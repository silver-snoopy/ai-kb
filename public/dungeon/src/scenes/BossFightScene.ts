import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG, SPELLS } from '../config';
import { downloadSessionLog } from '../game/sessionExport';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight, questionsForDomain } from '../data/questionLoader';
import { canCast, castSpell, createSpellbook, grantBossDefeatReward } from '../game/spellbook';
import type { Spellbook } from '../game/spellbook';
import type { Bank, BossDefinition, CombatState, MissedQuestion, Question, RunMode, SessionLog, SpellId } from '../types';
import type { Campaign } from '../game/dungeon';
import { advanceFloor, isCampaignComplete } from '../game/dungeon';
import { readActiveRun, writeActiveRun, clearActiveRun, restoreQuestionPool } from '../game/runSave';
import { ProceduralBGM } from '../audio/bgm';
import { mountAudioToggles, REGISTRY_BGM_MUTED } from '../ui/audioToggles';
import { renderBackdrop } from './backdrops';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover, attachTextHover } from '../ui/buttonHover';
import { paintOptionFeedback, resetOptionFeedback } from '../ui/optionFeedback';
import { mountDemoBadgeIfActive } from '../ui/demoBadge';
import { formatSpellTooltip } from '../ui/spellTooltip';
import { installFeelPack } from '../feel/install';
import { NarratorOverlay } from '../ui/narrator/NarratorOverlay';
import { NarratorDispatcher } from '../ui/narrator/NarratorDispatcher';
import { LinePool } from '../ui/narrator/linePool';
import { NARRATOR_LINES } from '../ui/narrator/lines';

interface BossFightData {
  bossId: string;
  mode: RunMode;
  isolated: boolean;
}

// Auto-advance pacing between questions. Deterministic: the wait time
// depends only on whether the answer was correct, never on what else is
// happening on screen. The narrator runs as an ambient overlay and is
// allowed to fade out across the next question — it's flavor, not a
// modal UI, so it doesn't block pacing.
// - CORRECT: the answer is the expected outcome; no study needed.
// - WRONG: red ✗ / green ✓ paint on 4 options needs a beat to scan.
//   The full explanation lives in the post-boss mistakes review, so this
//   is only "see the colors" time, not "read the explanation" time.
const ADVANCE_DELAY_CORRECT_MS = 1100;
const ADVANCE_DELAY_WRONG_MS = 2200;

export class BossFightScene extends Phaser.Scene {
  private state!: CombatState;
  private boss!: BossDefinition;
  private questions!: Question[];
  private spellbook!: Spellbook;
  private mode!: RunMode;
  private isolated!: boolean;
  private questionStartMs = 0;

  private heroHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private optionButtons: Phaser.GameObjects.Rectangle[] = [];
  private spellButtons: Phaser.GameObjects.Text[] = [];
  private spellTooltip!: Phaser.GameObjects.Container;
  private spellTooltipBg!: Phaser.GameObjects.Rectangle;
  private spellTooltipText!: Phaser.GameObjects.Text;
  private tauntText!: Phaser.GameObjects.Text;
  private primerText!: Phaser.GameObjects.Text;

  // Sprite references for animations
  private heroSprite!: Phaser.GameObjects.Image;
  private bossSprite!: Phaser.GameObjects.Image;

  // Per-boss procedural BGM (no asset dependency — generated via Web Audio)
  private bgm = new ProceduralBGM();

  private acceptingInput = false;
  private currentQuestionIdx = 0;
  private lastPhaseEmitted: 66 | 33 | 10 | null = null;
  private missedQuestions: MissedQuestion[] = [];

  private narratorOverlay!: NarratorOverlay;
  private narratorDispatcher!: NarratorDispatcher;

  constructor() {
    super({ key: 'BossFightScene' });
  }

  init(data: BossFightData): void {
    const boss = BOSSES.find(b => b.id === data.bossId);
    if (!boss) throw new Error(`Unknown boss: ${data.bossId}`);
    this.boss = boss;
    this.mode = data.mode;
    this.isolated = data.isolated;

    const bank: Bank = this.registry.get('bank');
    if (!bank) throw new Error('No bank in registry — BootScene should have loaded it');
    const domainPool = questionsForDomain(bank, boss.domain);
    if (domainPool.length === 0) {
      throw new Error(`No questions for domain ${boss.domain}`);
    }
    const bossHp = GAME_CONFIG.BOSS_HP[this.mode];
    const maxQuestions = bossHp + GAME_CONFIG.HERO_MAX_HP - 1;

    // Try to restore from an active run save if this entry matches the
    // in-boss slot. Never restore in isolated (debug) mode — the debug
    // path doesn't own a campaign and shouldn't reuse any ongoing save.
    const save = !this.isolated ? readActiveRun() : null;
    const canRestore = save?.inBoss != null && save.inBoss.bossId === data.bossId;
    let restoredQuestions: Question[] | null = null;
    if (canRestore) {
      restoredQuestions = restoreQuestionPool(save!.inBoss!.questionIds, domainPool);
      if (!restoredQuestions) {
        // Save references question IDs that no longer exist in the bank
        // (bank evolved since the save was written). Treat as corruption;
        // clear and start a fresh fight.
        clearActiveRun();
        // eslint-disable-next-line no-console
        console.warn('[runSave] cleared: saved question IDs missing from current bank');
      }
    }

    if (restoredQuestions) {
      this.questions = restoredQuestions;
      this.currentQuestionIdx = save!.inBoss!.currentQuestionIdx;
      this.state = initCombat({ heroMaxHp: GAME_CONFIG.HERO_MAX_HP, bossMaxHp: save!.inBoss!.bossMaxHp });
      this.state.heroHp = save!.inBoss!.heroHp;
      this.state.bossHp = save!.inBoss!.bossHp;
      this.state.questionHistory = restoreQuestionPool(save!.inBoss!.questionHistoryIds, domainPool) ?? [];
    } else {
      this.questions = pickQuestionsForFight(domainPool, maxQuestions);
      this.currentQuestionIdx = 0;
      const heroHpStart = this.registry.get('heroHp') ?? GAME_CONFIG.HERO_MAX_HP;
      this.state = initCombat({ heroMaxHp: GAME_CONFIG.HERO_MAX_HP, bossMaxHp: bossHp });
      this.state.heroHp = heroHpStart;
    }

    if (this.isolated) {
      this.spellbook = createSpellbook(this.mode);
    } else {
      this.spellbook = this.registry.get('spellbook');
    }

    this.lastPhaseEmitted = null;
  }

  create(): void {
    // Phaser reuses scene instances on re-entry (scene.start reruns init+create
    // on the same instance). Class-field arrays persist across runs and would
    // otherwise accumulate references to destroyed GameObjects, causing a
    // `setText → drawImage on null canvas` crash in showCurrentQuestion. Reset.
    this.optionTexts = [];
    this.optionButtons = [];
    this.spellButtons = [];
    this.missedQuestions = [];

    this.cameras.main.setBackgroundColor(this.boss.environmentColor);
    fadeIn(this);

    // Per-boss backdrop (wall + floor bands + themed props). Must render
    // before everything else so it sits at the bottom of the z-stack.
    renderBackdrop(this, this.boss.id);

    // Boss name at top center
    this.add.text(480, 30, this.boss.name, {
      fontSize: '24px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // --- Speech bubble (question area) ---
    // Filled rectangle body
    this.add.rectangle(480, 230, 620, 200, 0x2a241a).setStrokeStyle(2, 0xa89978);

    // Triangle tail pointing toward boss (bottom-right of bubble)
    const tail = this.add.graphics();
    tail.fillStyle(0x2a241a, 1);
    tail.fillTriangle(720, 330, 760, 330, 740, 310);
    // Tail border lines to match bubble stroke
    tail.lineStyle(2, 0xa89978, 1);
    tail.strokeTriangle(720, 330, 760, 330, 740, 310);

    // Question text inside bubble
    this.questionText = this.add.text(480, 145, '', {
      fontSize: '16px', color: '#f0e8d8', fontFamily: 'monospace',
      wordWrap: { width: 580 }, align: 'center',
    }).setOrigin(0.5, 0);

    // Primer text (Study-the-Tome effect) — below the bubble. Wrap is
    // 880 so the primer hint fits in 2–3 lines and doesn't bleed into
    // the first option box below.
    this.primerText = this.add.text(480, 360, '', {
      fontSize: '13px', color: '#ffca28', fontFamily: 'monospace',
      wordWrap: { width: 880 }, align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5, 0);

    // --- Hero sprite (left) ---
    this.heroSprite = this.add.image(120, 330, 'hero').setScale(3);

    // Hero HP hearts below sprite. Slightly smaller than before so the
    // label stack under the hero is a compact 2-line group.
    this.heroHpText = this.add.text(120, 405, '', {
      fontSize: '12px', color: '#8bc34a', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Hero name label \u2014 intentionally tiny so it reads as a subtitle
    // rather than competing with the HP text above it.
    this.add.text(120, 420, 'WARLOCK', {
      fontSize: '9px', color: '#808090', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // --- Boss sprite (right) ---
    const bossKey = `boss-${this.boss.id}`;
    const bossTexKey = this.textures.exists(bossKey) ? bossKey : 'hero';
    this.bossSprite = this.add.image(840, 330, bossTexKey).setScale(4);

    // Boss HP hearts below boss sprite \u2014 match the hero HP scale so both
    // sides read as symmetric status lines.
    this.bossHpText = this.add.text(840, 405, '', {
      fontSize: '12px', color: '#ff6b6b', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Taunt text below boss
    this.tauntText = this.add.text(840, 450, '', {
      fontSize: '12px', color: '#d0c090', fontFamily: 'monospace', fontStyle: 'italic',
      wordWrap: { width: 260 }, align: 'center',
    }).setOrigin(0.5, 0);

    // --- Option buttons ---
    // Box height 50 + 48px pitch fits a 2-line wrapped answer cleanly
    // and degrades gracefully on the rare 3-line outlier. First center
    // stays at y=470 so the post-answer explanation (in the primer slot
    // at y=360, wrap 880) has room above without bleeding into option A;
    // last box bottom (~639) leaves ~7px above the spellbook row at y=650.
    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 470 + idx * 48;
      const btn = this.add.rectangle(480, y, 900, 50, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      attachRectHover(btn,
        { fill: 0x1a1a2a, stroke: 0x4a4a6a },
        { fill: 0x2a2a3a, stroke: 0x8b8bc4 },
      );
      this.optionButtons.push(btn);
      const txt = this.add.text(50, y, '', {
        fontSize: '13px', color: '#d0d0da', fontFamily: 'monospace',
        wordWrap: { width: 870, useAdvancedWrap: true },
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    // --- Spellbook UI (3+2 centered layout) ---
    // Row 1: echo, study-the-tome, memorize at x={100,380,660}, y=650.
    // Row 2: amplify, doubleshot at x={240,520}, y=682 (two cells centered
    // across the three-column axis). Each button carries its own dark panel
    // + padding so labels stay readable over the tiled floor backdrop.
    // Active spells tint amber; 0-charge spells fade to dim grey.
    const spellIds: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot'];
    spellIds.forEach((id, idx) => {
      const x = idx < 3 ? 100 + idx * 280 : 240 + (idx - 3) * 280;
      const y = idx < 3 ? 650 : 682;
      const btn = this.add.text(x, y, '', {
        fontSize: '13px', color: '#ffca28', fontFamily: 'monospace',
        backgroundColor: '#1a1a2a', padding: { x: 8, y: 4 },
      });
      btn.setInteractive({ useHandCursor: true });
      // Hover feedback: brighter bg + text color when castable. Inactive
      // (0 charges) spells stay dim \u2014 attachTextHover's predicate gates it.
      attachTextHover(btn,
        { bg: '#1a1a2a', color: '#ffca28' },
        { bg: '#3a2f10', color: '#ffe070' },
        () => (this.spellbook[id] ?? 0) > 0,
      );
      btn.on('pointerdown', () => this.tryCast(id));
      // Tooltip on hover: name + tagline above the button, regardless of
      // charge count (players learn what a spell does before they own it).
      btn.on('pointerover', () => this.showSpellTooltip(id, btn));
      btn.on('pointerout', () => this.hideSpellTooltip());
      this.spellButtons.push(btn);
    });

    // Shared tooltip (one Container, repopulated per hover). High depth so
    // it renders above spell buttons + backdrop, hidden by default.
    this.spellTooltipBg = this.add.rectangle(0, 0, 180, 50, 0x1a1a2a).setStrokeStyle(1, 0xffca28);
    this.spellTooltipText = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#e0e0ea', fontFamily: 'monospace',
      wordWrap: { width: 164, useAdvancedWrap: true }, align: 'center',
    }).setOrigin(0.5);
    this.spellTooltip = this.add.container(0, 0, [this.spellTooltipBg, this.spellTooltipText]);
    this.spellTooltip.setDepth(1000);
    this.spellTooltip.setVisible(false);

    // --- Idle animations ---
    this.tweens.add({
      targets: this.heroSprite,
      y: '+=4',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.bossSprite,
      y: '+=3',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Procedural BGM tied to boss id \u2014 stops on scene shutdown.
    // Phaser's sound system already handled the user-gesture unlock, so
    // its AudioContext is ready to accept scheduled notes here. Respect
    // the user's BGM mute preference.
    if (!this.registry.get(REGISTRY_BGM_MUTED)) {
      this.bgm.start(this.boss.id, this.sound as unknown as { context?: AudioContext });
    }
    this.events.once('shutdown', () => this.bgm.stop());
    this.events.once('destroy', () => this.bgm.stop());

    // Mute toggles (top-right). onBgmToggle starts/stops our procedural
    // BGM as the user flips the control; SFX mute flows through Phaser's
    // sound manager automatically.
    mountAudioToggles(this, {
      onBgmToggle: (muted) => {
        if (muted) this.bgm.stop();
        else this.bgm.start(this.boss.id, this.sound as unknown as { context?: AudioContext });
      },
    });

    // Install Feel Pack — hit-stop, shake grading, squash-stretch, stagger-back, ambient dust.
    installFeelPack(this, { heroSprite: this.heroSprite, bossSprite: this.bossSprite });

    // Install narrator — creates overlay + dispatcher wiring the 7 semantic events to narrator lines.
    const linePool = new LinePool(NARRATOR_LINES);
    this.narratorOverlay = new NarratorOverlay(this);
    this.narratorDispatcher = new NarratorDispatcher(this.events, linePool, this.narratorOverlay);
    this.events.once('shutdown', () => {
      this.narratorDispatcher.destroy();
      this.narratorOverlay.destroy();
    });

    mountDemoBadgeIfActive(this);

    this.events.emit('battle-start', { bossId: this.boss.id });

    // Boss-entry save (Write Point 1). If we restored from save, the
    // state captured here re-affirms it with a fresh savedAt timestamp,
    // sliding the stale window forward. If fresh fight, this is the
    // first save for this boss.
    this.writeSave();

    this.nextQuestion();
  }

  /**
   * Persist the current run state so a tab-close mid-boss resumes on
   * re-entry. Called at boss entry, after each advance, and on victory
   * (with inBoss=null). No-op in isolated (debug) mode.
   */
  private writeSave(options: { endOfFight?: boolean } = {}): void {
    if (this.isolated) return;
    const campaign: Campaign | undefined = this.registry.get('campaign');
    if (!campaign) return;
    writeActiveRun({
      version: 1,
      campaign: {
        bossOrder: [...campaign.bossOrder],
        floorsCleared: campaign.floorsCleared,
        mode: campaign.mode,
      },
      spellbook: { ...this.spellbook },
      heroHpCarryover: this.state.heroHp,
      inBoss: options.endOfFight ? null : {
        bossId: this.boss.id,
        questionIds: this.questions.map(q => q.id),
        currentQuestionIdx: this.currentQuestionIdx,
        heroHp: this.state.heroHp,
        bossHp: this.state.bossHp,
        bossMaxHp: this.state.bossMaxHp,
        questionHistoryIds: this.state.questionHistory.map(q => q.id),
      },
    });
  }

  private refreshSpellUI(): void {
    const ids: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot'];
    ids.forEach((id, i) => {
      const btn = this.spellButtons[i]!;
      const def = SPELLS[id];
      const charges = this.spellbook[id] ?? 0;
      const active = charges > 0;
      btn.setText(`[${def.name}] x${charges}`);
      // Active = amber (reads as "charged"), inactive = dim grey so the
      // labels are visible but clearly un-castable.
      btn.setColor(active ? '#ffca28' : '#5a5a6a');
    });
  }

  private showSpellTooltip(id: SpellId, btn: Phaser.GameObjects.Text): void {
    const def = SPELLS[id];
    this.spellTooltipText.setText(formatSpellTooltip(def));
    const bgHeight = Math.max(44, this.spellTooltipText.height + 12);
    this.spellTooltipBg.setSize(180, bgHeight);
    const centerX = btn.x + btn.width / 2;
    const tooltipCenterY = btn.y - (bgHeight / 2) - 6;
    this.spellTooltip.setPosition(centerX, tooltipCenterY);
    this.spellTooltip.setVisible(true);
  }

  private hideSpellTooltip(): void {
    this.spellTooltip.setVisible(false);
  }

  private tryCast(spell: SpellId): void {
    if (!this.acceptingInput) return;
    if (!canCast(this.spellbook, spell)) return;
    const sessionLog: SessionLog = this.registry.get('sessionLog');

    try {
      castSpell(spell, this.spellbook, this.state);
      sessionLog.spells_cast.push(spell);
      this.events.emit('spell-cast', { spellId: spell, bossId: this.boss.id });

      // Spell cast animation + SFX
      this.sound.play('sfx-spell', { volume: 0.5 });
      this.tweens.add({
        targets: this.heroSprite,
        scale: 4,
        duration: 120,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });

      if (spell === 'echo' && this.state.questionHistory.length > 0) {
        const prior = this.state.questionHistory[Math.floor(Math.random() * this.state.questionHistory.length)]!;
        this.questions[this.currentQuestionIdx] = prior;
        this.showCurrentQuestion();
      }

      if (spell === 'study-the-tome' && this.state.currentQuestion) {
        this.primerText.setText(`📖 ${this.generatePrimer(this.state.currentQuestion)}`);
      }

      if (spell === 'memorize' && this.state.currentQuestion) {
        const q = this.state.currentQuestion;
        sessionLog.questions.push({
          question_id: q.id,
          domain: q.domain,
          was_correct: false,
          time_elapsed_ms: 0,
          flagged_for_review: true,
        });
      }
    } catch (e) {
      // No charges — silently ignore
    }
    this.refreshSpellUI();
  }

  private generatePrimer(q: Question): string {
    const firstSentence = q.explanation.split('.')[0] + '.';
    return firstSentence.length < 180 ? firstSentence : firstSentence.slice(0, 180) + '...';
  }

  private nextQuestion(): void {
    if (this.currentQuestionIdx >= this.questions.length) {
      this.showResult('draw');
      return;
    }
    this.state.currentQuestion = this.questions[this.currentQuestionIdx++]!;
    this.showCurrentQuestion();
  }

  private showCurrentQuestion(): void {
    const q = this.state.currentQuestion!;
    this.questionText.setText(q.stem);
    // Self-heal visibility AND color AND interactivity. The previous
    // frame may have hidden option buttons (defeat/death/wrong-answer),
    // recolored them via paintOptionFeedback, or disabled their input
    // via disableInteractive — restore all three so the next question
    // presents a clean slate.
    this.optionButtons.forEach(b => {
      b.setVisible(true);
      b.setInteractive({ useHandCursor: true });
    });
    this.optionTexts.forEach((txt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D';
      txt.setText(`${letter}) ${q.options[letter]}`);
    });
    resetOptionFeedback(this.optionButtons, this.optionTexts);
    this.tauntText.setText('');
    this.primerText.setText('');
    this.questionStartMs = Date.now();
    this.acceptingInput = true;
    this.updateHp();
    this.refreshSpellUI();
  }

  private submit(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (!this.acceptingInput) return;
    if (!this.state.currentQuestion) return;
    this.acceptingInput = false;

    const q = this.state.currentQuestion;
    const elapsed = Date.now() - this.questionStartMs;
    const result = resolveAnswer(this.state, choice);
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    const existing = sessionLog.questions.find(x => x.question_id === q.id);
    if (existing) {
      existing.was_correct = result.wasCorrect;
      existing.time_elapsed_ms = elapsed;
    } else {
      sessionLog.questions.push({
        question_id: q.id,
        domain: q.domain,
        was_correct: result.wasCorrect,
        time_elapsed_ms: elapsed,
        flagged_for_review: false,
      });
    }
    if (result.wasCorrect) sessionLog.total_correct++;
    else sessionLog.total_wrong++;

    this.updateHp();
    this.primerText.setText('');

    const tauntPool = result.wasCorrect ? this.boss.taunts.correct : this.boss.taunts.wrong;
    this.tauntText.setText(`"${tauntPool[Math.floor(Math.random() * tauntPool.length)]}"`);

    if (result.wasCorrect) {
      // Boss takes damage
      this.sound.play('sfx-hit-boss', { volume: 0.6 });
      this.events.emit('answer-correct', {
        damage: result.damageDealt,
        bossHpPct: this.state.bossHp / this.state.bossMaxHp,
        bossMaxHp: this.state.bossMaxHp,
      });
      // Emit phase-crossed if HP% just crossed a threshold on this hit.
      // Iterate lowest threshold first: a big hit from 70% → 5% must fire phase-10, not phase-66.
      // Spec §7 edge case: "Multiple thresholds crossed in one hit → fire highest priority (lowest %) only."
      const hpPct = this.state.bossHp / this.state.bossMaxHp;
      const thresholds: Array<10 | 33 | 66> = [10, 33, 66];
      for (const t of thresholds) {
        const tRatio = t / 100;
        const notYetEmitted = this.lastPhaseEmitted === null || this.lastPhaseEmitted > t;
        if (hpPct <= tRatio && notYetEmitted) {
          this.events.emit('boss-phase-crossed', { threshold: t, bossId: this.boss.id });
          this.lastPhaseEmitted = t;
          break;  // lowest crossed threshold wins; skip remaining higher thresholds
        }
      }
      this.bossSprite.setTint(0xff6b6b);
      this.time.delayedCall(200, () => this.bossSprite.clearTint());
      this.floatDamage(this.bossSprite.x, this.bossSprite.y - 40, `-${result.damageDealt}`, '#ff6b6b');
      // Paint the chosen option green + ✓ so the player gets positive
      // visual confirmation of which answer was correct, AND lock
      // interactivity so the hover handlers can't revert the colors and
      // stray clicks during the scheduled-advance window cannot fire
      // tryCast/submit hover-look changes. showCurrentQuestion re-enables
      // on the next question.
      paintOptionFeedback(this.optionButtons, this.optionTexts, result.correctAnswer, choice);
      this.optionButtons.forEach(b => b.disableInteractive());
    } else {
      // Hero takes damage
      this.sound.play('sfx-hit-hero', { volume: 0.5 });
      this.events.emit('answer-wrong', { heroHpRemaining: this.state.heroHp });
      this.heroSprite.setTint(0xff6b6b);
      this.time.delayedCall(200, () => this.heroSprite.clearTint());
      this.floatDamage(this.heroSprite.x, this.heroSprite.y - 40, '-1', '#ff6b6b');
    }

    if (!result.wasCorrect) {
      // Record for post-boss mistakes-review (F3b). questionHistory already
      // contains the answered question at the end; keep a denormalized copy
      // with the chosen letter since sessionLog.questions doesn't carry
      // `chosen` today.
      this.missedQuestions.push({
        questionId: q.id,
        stem: q.stem,
        options: q.options,
        correct: result.correctAnswer,
        chosen: choice,
        explanation: result.explanation,
      });
      // Inline feedback: keep stem + 4 options visible, recolor chosen option
      // red (✗) and correct option green (✓). The red/green paint is the
      // sole on-screen signal of the miss — the post-boss mistakes review
      // (F3b) carries the full explanation. Options stay visually locked
      // until the next question via disableInteractive below.
      paintOptionFeedback(
        this.optionButtons,
        this.optionTexts,
        result.correctAnswer,
        choice,
      );
      // Lock in the painted colors: disable interactivity on the option
      // panels so their hover handlers can't repaint back to navy when
      // the cursor moves, AND so a stray click on a panel can't re-fire
      // submit. Re-enabled in showCurrentQuestion on the next question.
      this.optionButtons.forEach(b => b.disableInteractive());
      this.scheduleAdvance(ADVANCE_DELAY_WRONG_MS);
      return;
    }

    this.scheduleAdvance(ADVANCE_DELAY_CORRECT_MS);
  }

  /** Schedule the next-question advance. Fixed delay — the narrator
   *  overlay is a separate ambient layer and is allowed to keep playing
   *  over the next question if its line hasn't finished. */
  private scheduleAdvance(baseMs: number): void {
    this.time.delayedCall(baseMs, () => this.advanceOrEnd());
  }

  private floatDamage(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontSize: '28px', color, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private advanceOrEnd(): void {
    if (isBossDefeated(this.state)) {
      this.onBossDefeated();
      return;
    }
    if (isHeroDead(this.state)) {
      this.onHeroDead();
      return;
    }
    // Write Point 2: on-advance. The boss and hero are both alive; state
    // is stable for the next question. Capturing here means a tab close
    // during the hit-animation or explanation overlay re-enters on the
    // same upcoming question.
    this.writeSave();
    this.nextQuestion();
  }

  private onBossDefeated(): void {
    this.events.emit('boss-defeated', { bossId: this.boss.id });
    // Boss defeated animation + SFX
    this.sound.play('sfx-victory', { volume: 0.6 });
    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      y: this.bossSprite.y + 30,
      duration: 800,
      ease: 'Cubic.easeIn',
    });

    this.questionText.setText(`🏆 ${this.boss.name} DEFEATED\n\n(click for reward)`);
    this.optionTexts.forEach(t => t.setText(''));
    this.optionButtons.forEach(b => b.setVisible(false));
    this.input.once('pointerdown', () => this.grantReward());
  }

  private grantReward(): void {
    const choices: SpellId[] = ['echo', 'study-the-tome', 'memorize'];
    const chosen = choices[Math.floor(Math.random() * choices.length)]!;
    grantBossDefeatReward(this.spellbook, chosen);

    this.questionText.setText(`📜 Reward: +1 charge of ${SPELLS[chosen].name}\n\n(click to descend)`);
    this.refreshSpellUI();
    this.input.once('pointerdown', () => this.onFightEnd('victory'));
  }

  private onHeroDead(): void {
    this.events.emit('hero-defeated', { bossId: this.boss.id });
    // Hero death animation + SFX
    this.sound.play('sfx-death', { volume: 0.7 });
    this.tweens.add({
      targets: this.heroSprite,
      alpha: 0.3,
      rotation: Math.PI / 2,
      duration: 1000,
      ease: 'Cubic.easeIn',
    });

    this.questionText.setText(`💀 YOU DIED\n\n${this.boss.name} claims another scholar.\n\n(click to return to Hub)`);
    this.optionTexts.forEach(t => t.setText(''));
    this.optionButtons.forEach(b => b.setVisible(false));
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.result = 'death';
    sessionLog.ended_at = new Date().toISOString();
    sessionLog.final_hero_hp = 0;
    this.input.once('pointerdown', () => {
      if (sessionLog.questions.length > 0) downloadSessionLog(sessionLog);
      // Hero died — run is over; drop the save so the Hub shows New Game.
      clearActiveRun();
      fadeToScene(this, 'HubScene');
    });
  }

  private onFightEnd(kind: 'victory'): void {
    const campaign: Campaign | undefined = this.registry.get('campaign');
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.bosses_defeated.push(this.boss.id);

    if (this.isolated || !campaign) {
      fadeToScene(this, 'HubScene');
      return;
    }

    advanceFloor(campaign);
    this.registry.set('heroHp', this.state.heroHp);

    if (isCampaignComplete(campaign)) {
      sessionLog.result = 'victory';
      sessionLog.ended_at = new Date().toISOString();
      sessionLog.final_hero_hp = this.state.heroHp;
      // Campaign cleared — no more runs to resume.
      clearActiveRun();
      fadeToScene(this, 'CampaignCompleteScene');
    } else {
      // Write Point 3: victory transition. inBoss=null so a re-entry
      // from the hub lands in the interstitial-or-next-boss branch.
      this.writeSave({ endOfFight: true });
      const nextBossId = campaign.bossOrder[campaign.floorsCleared]!;
      fadeToScene(this, 'InterstitialScene', {
        previousBossId: this.boss.id,
        nextBossId,
        mode: campaign.mode,
        missedQuestions: this.missedQuestions,
      });
    }
  }

  private updateHp(): void {
    const bossHearts = '❤️'.repeat(Math.max(0, this.state.bossHp)) + '🖤'.repeat(this.state.bossMaxHp - this.state.bossHp);
    const heroHearts = '❤️'.repeat(Math.max(0, this.state.heroHp)) + '🖤'.repeat(this.state.heroMaxHp - this.state.heroHp);
    this.bossHpText.setText(`BOSS ${bossHearts}`);
    this.heroHpText.setText(`HERO ${heroHearts}`);
  }

  private showResult(kind: 'victory' | 'death' | 'draw'): void {
    if (this.isolated) fadeToScene(this, 'HubScene');
    else this.onHeroDead();
  }
}
