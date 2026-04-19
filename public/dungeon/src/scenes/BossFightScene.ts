import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG } from '../config';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight } from '../data/questionLoader';
import type { BossDefinition, CombatState, Question, QuestionsJson } from '../types';

interface BossFightData {
  bossId: string;
}

export class BossFightScene extends Phaser.Scene {
  private state!: CombatState;
  private boss!: BossDefinition;
  private questions!: Question[];
  private questionIndex = 0;
  private heroHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private taunText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BossFightScene' });
  }

  init(data: BossFightData): void {
    const boss = BOSSES.find(b => b.id === data.bossId);
    if (!boss) throw new Error(`Unknown boss: ${data.bossId}`);
    this.boss = boss;

    const questionsJson: QuestionsJson = this.registry.get('questions');
    const domainData = questionsJson.domains.find(d => d.id === boss.domain);
    if (!domainData || domainData.questions.length === 0) {
      throw new Error(`No questions for domain ${boss.domain}`);
    }
    const bossHp = GAME_CONFIG.BOSS_HP['first-run'];
    const maxQuestions = bossHp + GAME_CONFIG.HERO_MAX_HP - 1;
    this.questions = pickQuestionsForFight(domainData.questions, maxQuestions);
    this.questionIndex = 0;

    this.state = initCombat({
      heroMaxHp: GAME_CONFIG.HERO_MAX_HP,
      bossMaxHp: bossHp,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.boss.environmentColor);

    this.add.text(480, 40, this.boss.name, {
      fontSize: '32px',
      color: '#f5e4b3',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.bossHpText = this.add.text(200, 100, '', {
      fontSize: '20px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
    });
    this.heroHpText = this.add.text(600, 100, '', {
      fontSize: '20px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    });

    this.questionText = this.add.text(480, 220, '', {
      fontSize: '18px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
      wordWrap: { width: 880 },
      align: 'center',
    }).setOrigin(0.5, 0);

    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 400 + idx * 45;
      const btn = this.add.rectangle(480, y, 800, 40, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      const txt = this.add.text(100, y, '', {
        fontSize: '16px',
        color: '#d0d0da',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    this.taunText = this.add.text(480, 600, '', {
      fontSize: '14px',
      color: '#b0b0c0',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.nextQuestion();
  }

  private nextQuestion(): void {
    if (this.questionIndex >= this.questions.length) {
      this.showResult('draw');
      return;
    }
    const q = this.questions[this.questionIndex++]!;
    this.state.currentQuestion = q;
    this.questionText.setText(q.stem);
    this.optionTexts.forEach((txt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D';
      txt.setText(`${letter}) ${q.options[letter]}`);
    });
    this.updateHp();
  }

  private submit(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (!this.state.currentQuestion) return;
    const result = resolveAnswer(this.state, choice);
    this.updateHp();

    const tauntPool = result.wasCorrect ? this.boss.taunts.correct : this.boss.taunts.wrong;
    this.taunText.setText(`"${tauntPool[Math.floor(Math.random() * tauntPool.length)]}"`);

    if (!result.wasCorrect) {
      this.questionText.setText(
        `\u2717 Incorrect. Correct: ${result.correctAnswer}\n\n${result.explanation}\n\n(click any option to continue)`,
      );
      this.optionTexts.forEach(t => t.setText(''));
      this.input.once('pointerdown', () => this.advanceOrEnd());
      return;
    }

    this.time.delayedCall(800, () => this.advanceOrEnd());
  }

  private advanceOrEnd(): void {
    if (isBossDefeated(this.state)) {
      this.showResult('victory');
      return;
    }
    if (isHeroDead(this.state)) {
      this.showResult('death');
      return;
    }
    this.nextQuestion();
  }

  private updateHp(): void {
    const bossHearts = '\u2764\uFE0F'.repeat(Math.max(0, this.state.bossHp)) + '\uD83D\uDDA4'.repeat(this.state.bossMaxHp - this.state.bossHp);
    const heroHearts = '\u2764\uFE0F'.repeat(Math.max(0, this.state.heroHp)) + '\uD83D\uDDA4'.repeat(this.state.heroMaxHp - this.state.heroHp);
    this.bossHpText.setText(`BOSS ${bossHearts}`);
    this.heroHpText.setText(`HERO ${heroHearts}`);
  }

  private showResult(kind: 'victory' | 'death' | 'draw'): void {
    this.questionText.setText('');
    this.optionTexts.forEach(t => t.setText(''));

    let msg = '';
    if (kind === 'victory') msg = `\uD83C\uDFC6 ${this.boss.name} DEFEATED`;
    else if (kind === 'death') msg = 'YOU DIED';
    else msg = 'Out of questions';

    this.add.text(480, 320, msg, {
      fontSize: '48px',
      color: kind === 'victory' ? '#f5e4b3' : '#e57373',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 400, '(click to return to Hub)', {
      fontSize: '16px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }
}
