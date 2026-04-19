import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG, SPELLS } from '../config';
import { downloadSessionLog } from '../game/sessionExport';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight } from '../data/questionLoader';
import { canCast, castSpell, createSpellbook, grantBossDefeatReward } from '../game/spellbook';
import type { Spellbook } from '../game/spellbook';
import type { BossDefinition, CombatState, Question, QuestionsJson, RunMode, SessionLog, SpellId } from '../types';
import type { Campaign } from '../game/dungeon';
import { advanceFloor, isCampaignComplete } from '../game/dungeon';
import { ProceduralBGM } from '../audio/bgm';
import { mountAudioToggles, REGISTRY_BGM_MUTED } from '../ui/audioToggles';
import { renderBackdrop } from './backdrops';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover, attachTextHover } from '../ui/buttonHover';

interface BossFightData {
  bossId: string;
  mode: RunMode;
  isolated: boolean;
}

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
  private spellButtons: Phaser.GameObjects.Text[] = [];
  private tauntText!: Phaser.GameObjects.Text;
  private primerText!: Phaser.GameObjects.Text;

  // Sprite references for animations
  private heroSprite!: Phaser.GameObjects.Image;
  private bossSprite!: Phaser.GameObjects.Image;

  // Per-boss procedural BGM (no asset dependency — generated via Web Audio)
  private bgm = new ProceduralBGM();

  private acceptingInput = false;
  private currentQuestionIdx = 0;

  constructor() {
    super({ key: 'BossFightScene' });
  }

  init(data: BossFightData): void {
    const boss = BOSSES.find(b => b.id === data.bossId);
    if (!boss) throw new Error(`Unknown boss: ${data.bossId}`);
    this.boss = boss;
    this.mode = data.mode;
    this.isolated = data.isolated;

    const questionsJson: QuestionsJson = this.registry.get('questions');
    const domainData = questionsJson.domains.find(d => d.id === boss.domain);
    if (!domainData || domainData.questions.length === 0) {
      throw new Error(`No questions for domain ${boss.domain}`);
    }
    const bossHp = GAME_CONFIG.BOSS_HP[this.mode];
    const maxQuestions = bossHp + GAME_CONFIG.HERO_MAX_HP - 1;
    this.questions = pickQuestionsForFight(domainData.questions, maxQuestions);
    this.currentQuestionIdx = 0;

    const heroHpStart = this.registry.get('heroHp') ?? GAME_CONFIG.HERO_MAX_HP;
    this.state = initCombat({ heroMaxHp: GAME_CONFIG.HERO_MAX_HP, bossMaxHp: bossHp });
    this.state.heroHp = heroHpStart;

    if (this.isolated) {
      this.spellbook = createSpellbook(this.mode);
    } else {
      this.spellbook = this.registry.get('spellbook');
    }
  }

  create(): void {
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

    // Primer text (Study-the-Tome effect) — below the bubble
    this.primerText = this.add.text(480, 360, '', {
      fontSize: '13px', color: '#ffca28', fontFamily: 'monospace',
      wordWrap: { width: 760 }, align: 'center', fontStyle: 'italic',
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
    // Boxes are wider (900 vs old 820) and text is smaller (13 vs 15)
    // with wordWrap, so answers up to ~110 monospace chars fit on one
    // line; only truly long answers wrap to 2 lines and are still
    // readable inside the 32-tall box. Row pitch is kept at 35px so the
    // spellbook at y=610 still has room beneath.
    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 470 + idx * 35;
      const btn = this.add.rectangle(480, y, 900, 32, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      attachRectHover(btn,
        { fill: 0x1a1a2a, stroke: 0x4a4a6a },
        { fill: 0x2a2a3a, stroke: 0x8b8bc4 },
      );
      const txt = this.add.text(50, y, '', {
        fontSize: '13px', color: '#d0d0da', fontFamily: 'monospace',
        wordWrap: { width: 870, useAdvancedWrap: true },
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    // --- Spellbook UI (3\u00D72 grid) ---
    // Each button carries its own dark background panel + padding so the
    // labels stay readable against the tiled floor backdrop. Active
    // spells tint amber (reads as "charged"); unavailable ones fade to
    // dim grey.
    const spellIds: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'];
    spellIds.forEach((id, idx) => {
      const x = 100 + (idx % 3) * 280;
      // Two rows at y=650 and y=682, panels ~26 tall. Canvas is now 720
      // tall so spells sit with ~50px breathing room below the option row
      // (y=575) and the last row's bottom lands at y=708 \u2014 comfortably
      // above the 720 canvas floor.
      const y = 650 + Math.floor(idx / 3) * 32;
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
      this.spellButtons.push(btn);
    });

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

    this.nextQuestion();
  }

  private refreshSpellUI(): void {
    const ids: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'];
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

  private tryCast(spell: SpellId): void {
    if (!this.acceptingInput) return;
    if (!canCast(this.spellbook, spell)) return;
    const sessionLog: SessionLog = this.registry.get('sessionLog');

    try {
      castSpell(spell, this.spellbook, this.state);
      sessionLog.spells_cast.push(spell);

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
    this.optionTexts.forEach((txt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D';
      txt.setText(`${letter}) ${q.options[letter]}`);
    });
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
      this.bossSprite.setTint(0xff6b6b);
      this.time.delayedCall(200, () => this.bossSprite.clearTint());
      this.floatDamage(this.bossSprite.x, this.bossSprite.y - 40, `-${result.damageDealt}`, '#ff6b6b');
    } else {
      // Hero takes damage
      this.sound.play('sfx-hit-hero', { volume: 0.5 });
      this.events.emit('answer-wrong', { heroHpRemaining: this.state.heroHp });
      this.heroSprite.setTint(0xff6b6b);
      this.time.delayedCall(200, () => this.heroSprite.clearTint());
      this.floatDamage(this.heroSprite.x, this.heroSprite.y - 40, '-1', '#ff6b6b');
    }

    if (!result.wasCorrect) {
      // Keep the bubble message short; push the full explanation into the
      // (now-empty) option-area below so long explanations don't overflow.
      // Hide the spellbook row too so the explanation has room to breathe.
      this.questionText.setText(`\u2717 Incorrect. Correct: ${result.correctAnswer}`);
      this.optionTexts.forEach(t => t.setText(''));
      this.spellButtons.forEach(b => b.setVisible(false));
      const explain = this.add.text(480, 440, `${result.explanation}\n\n(click to continue)`, {
        fontSize: '13px', color: '#e8e0d0', fontFamily: 'monospace',
        wordWrap: { width: 880 }, align: 'center',
      }).setOrigin(0.5, 0);
      this.input.once('pointerdown', () => {
        explain.destroy();
        this.spellButtons.forEach(b => b.setVisible(true));
        this.advanceOrEnd();
      });
      return;
    }

    this.time.delayedCall(600, () => this.advanceOrEnd());
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
    this.nextQuestion();
  }

  private onBossDefeated(): void {
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
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.result = 'death';
    sessionLog.ended_at = new Date().toISOString();
    sessionLog.final_hero_hp = 0;
    this.input.once('pointerdown', () => {
      if (sessionLog.questions.length > 0) downloadSessionLog(sessionLog);
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
      fadeToScene(this, 'CampaignCompleteScene');
    } else {
      const nextBossId = campaign.bossOrder[campaign.floorsCleared]!;
      fadeToScene(this, 'InterstitialScene', {
        previousBossId: this.boss.id,
        nextBossId,
        mode: campaign.mode,
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
