import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG, SPELLS } from '../config';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight } from '../data/questionLoader';
import { canCast, castSpell, createSpellbook, grantBossDefeatReward } from '../game/spellbook';
import type { Spellbook } from '../game/spellbook';
import type { BossDefinition, CombatState, Question, QuestionsJson, RunMode, SessionLog, SpellId } from '../types';
import type { Campaign } from '../game/dungeon';
import { advanceFloor, isCampaignComplete } from '../game/dungeon';

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

    this.add.text(480, 30, this.boss.name, {
      fontSize: '28px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.bossHpText = this.add.text(200, 70, '', { fontSize: '18px', color: '#ff6b6b', fontFamily: 'monospace' });
    this.heroHpText = this.add.text(600, 70, '', { fontSize: '18px', color: '#8bc34a', fontFamily: 'monospace' });

    this.primerText = this.add.text(480, 130, '', {
      fontSize: '14px', color: '#ffca28', fontFamily: 'monospace',
      wordWrap: { width: 880 }, align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5, 0);

    this.questionText = this.add.text(480, 200, '', {
      fontSize: '18px', color: '#e0e0ea', fontFamily: 'monospace',
      wordWrap: { width: 880 }, align: 'center',
    }).setOrigin(0.5, 0);

    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 390 + idx * 40;
      const btn = this.add.rectangle(480, y, 800, 36, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      const txt = this.add.text(100, y, '', {
        fontSize: '15px', color: '#d0d0da', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    const spellIds: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'];
    spellIds.forEach((id, idx) => {
      const x = 100 + (idx % 3) * 280;
      const y = 570 + Math.floor(idx / 3) * 30;
      const btn = this.add.text(x, y, '', {
        fontSize: '13px', color: '#a0a0b0', fontFamily: 'monospace',
      });
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.tryCast(id));
      this.spellButtons.push(btn);
    });

    this.tauntText = this.add.text(480, 620, '', {
      fontSize: '14px', color: '#b0b0c0', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);

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
      btn.setColor(active ? '#c0c0d0' : '#505060');
    });
  }

  private tryCast(spell: SpellId): void {
    if (!this.acceptingInput) return;
    if (!canCast(this.spellbook, spell)) return;
    const sessionLog: SessionLog = this.registry.get('sessionLog');

    try {
      castSpell(spell, this.spellbook, this.state);
      sessionLog.spells_cast.push(spell);

      if (spell === 'echo' && this.state.questionHistory.length > 0) {
        const prior = this.state.questionHistory[Math.floor(Math.random() * this.state.questionHistory.length)]!;
        this.questions[this.currentQuestionIdx] = prior;
        this.showCurrentQuestion();
      }

      if (spell === 'study-the-tome' && this.state.currentQuestion) {
        this.primerText.setText(`\uD83D\uDCD6 ${this.generatePrimer(this.state.currentQuestion)}`);
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

    if (!result.wasCorrect) {
      this.questionText.setText(
        `\u2717 Incorrect. Correct: ${result.correctAnswer}\n\n${result.explanation}\n\n(click to continue)`,
      );
      this.optionTexts.forEach(t => t.setText(''));
      this.input.once('pointerdown', () => this.advanceOrEnd());
      return;
    }

    this.time.delayedCall(600, () => this.advanceOrEnd());
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
    this.questionText.setText(`\uD83C\uDFC6 ${this.boss.name} DEFEATED\n\n(click for reward)`);
    this.optionTexts.forEach(t => t.setText(''));
    this.input.once('pointerdown', () => this.grantReward());
  }

  private grantReward(): void {
    const choices: SpellId[] = ['echo', 'study-the-tome', 'memorize'];
    const chosen = choices[Math.floor(Math.random() * choices.length)]!;
    grantBossDefeatReward(this.spellbook, chosen);

    this.questionText.setText(`\uD83D\uDCDC Reward: +1 charge of ${SPELLS[chosen].name}\n\n(click to descend)`);
    this.refreshSpellUI();
    this.input.once('pointerdown', () => this.onFightEnd('victory'));
  }

  private onHeroDead(): void {
    this.questionText.setText(`\uD83D\uDC80 YOU DIED\n\nThe ${this.boss.name} claims another scholar.\n\n(click to return to Hub)`);
    this.optionTexts.forEach(t => t.setText(''));
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.result = 'death';
    sessionLog.ended_at = new Date().toISOString();
    sessionLog.final_hero_hp = 0;
    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }

  private onFightEnd(kind: 'victory'): void {
    const campaign: Campaign | undefined = this.registry.get('campaign');
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.bosses_defeated.push(this.boss.id);

    if (this.isolated || !campaign) {
      this.scene.start('HubScene');
      return;
    }

    advanceFloor(campaign);
    this.registry.set('heroHp', this.state.heroHp);

    if (isCampaignComplete(campaign)) {
      sessionLog.result = 'victory';
      sessionLog.ended_at = new Date().toISOString();
      sessionLog.final_hero_hp = this.state.heroHp;
      this.scene.start('CampaignCompleteScene');
    } else {
      const nextBossId = campaign.bossOrder[campaign.floorsCleared]!;
      this.scene.start('InterstitialScene', {
        previousBossId: this.boss.id,
        nextBossId,
        mode: campaign.mode,
      });
    }
  }

  private updateHp(): void {
    const bossHearts = '\u2764\uFE0F'.repeat(Math.max(0, this.state.bossHp)) + '\uD83D\uDDA4'.repeat(this.state.bossMaxHp - this.state.bossHp);
    const heroHearts = '\u2764\uFE0F'.repeat(Math.max(0, this.state.heroHp)) + '\uD83D\uDDA4'.repeat(this.state.heroMaxHp - this.state.heroHp);
    this.bossHpText.setText(`BOSS ${bossHearts}`);
    this.heroHpText.setText(`HERO ${heroHearts}`);
  }

  private showResult(kind: 'victory' | 'death' | 'draw'): void {
    if (this.isolated) this.scene.start('HubScene');
    else this.onHeroDead();
  }
}
