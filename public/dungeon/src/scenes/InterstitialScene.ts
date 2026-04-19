import Phaser from 'phaser';
import { BOSSES } from '../config';
import type { Question, QuestionsJson, RunMode, BossDefinition } from '../types';

interface InterstitialData {
  previousBossId: string;
  nextBossId: string;
  mode: RunMode;
}

type Beat = 'narrative' | 'recall' | 'recall-answered' | 'primer';

export class InterstitialScene extends Phaser.Scene {
  private previousBoss!: BossDefinition;
  private nextBoss!: BossDefinition;
  private mode!: RunMode;
  private beat: Beat = 'narrative';
  private recallQuestion: Question | null = null;

  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];

  // Preview sprite tracking — destroyed + recreated on each beat
  private previewImage: Phaser.GameObjects.Image | null = null;

  constructor() {
    super({ key: 'InterstitialScene' });
  }

  init(data: InterstitialData): void {
    const prev = BOSSES.find(b => b.id === data.previousBossId);
    const next = BOSSES.find(b => b.id === data.nextBossId);
    if (!prev || !next) throw new Error(`Unknown boss in InterstitialScene: prev=${data.previousBossId} next=${data.nextBossId}`);
    this.previousBoss = prev;
    this.nextBoss = next;
    this.mode = data.mode;
    this.beat = 'narrative';

    const qs: QuestionsJson = this.registry.get('questions');
    const prevDomain = qs.domains.find(d => d.id === prev.domain);
    const pool = prevDomain?.questions ?? [];
    this.recallQuestion = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]! : null;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a14);

    this.titleText = this.add.text(480, 80, '', {
      fontSize: '28px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.bodyText = this.add.text(480, 200, '', {
      fontSize: '18px', color: '#e0e0ea', fontFamily: 'monospace',
      wordWrap: { width: 860 }, align: 'center',
    }).setOrigin(0.5, 0);

    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 400 + idx * 40;
      const txt = this.add.text(100, y, '', {
        fontSize: '15px', color: '#d0d0da', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      this.input.keyboard?.on(`keydown-${letter}`, () => this.onRecallChoice(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.onRecallChoice(letter));
    });

    this.hintText = this.add.text(480, 600, '', {
      fontSize: '14px', color: '#808090', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);

    this.input.on('pointerdown', () => this.onPointer());
    this.input.keyboard?.on('keydown-SPACE', () => this.onPointer());
    this.input.keyboard?.on('keydown-ENTER', () => this.onPointer());

    this.renderNarrative();
  }

  /** Destroy the current preview image before setting a new one. */
  private clearPreview(): void {
    if (this.previewImage) {
      this.previewImage.destroy();
      this.previewImage = null;
    }
  }

  /** Add a boss sprite image at the given position with scale and optional alpha.
   *  Returns the image so callers can add tweens. */
  private addBossPreview(
    bossId: string,
    x: number,
    y: number,
    scale: number,
    alpha = 1,
  ): Phaser.GameObjects.Image | null {
    this.clearPreview();
    const key = `boss-${bossId}`;
    if (!this.textures.exists(key)) return null;
    const img = this.add.image(x, y, key).setScale(scale).setAlpha(alpha);
    this.previewImage = img;
    return img;
  }

  private renderNarrative(): void {
    this.beat = 'narrative';
    this.titleText.setText('✨ Descent');
    this.bodyText.setText(
      `You descended from the ${this.previousBoss.name}'s lair.\n\n` +
      `Ahead: the ${this.nextBoss.theme.toLowerCase()}.\n\n` +
      `The ${this.nextBoss.name} awaits.`,
    );
    this.optionTexts.forEach(t => t.setText(''));
    this.hintText.setText('(press Space / Enter / click to continue)');

    // Show previous boss sprite fading out
    const img = this.addBossPreview(this.previousBoss.id, 480, 400, 6, 1);
    if (img) {
      this.tweens.add({
        targets: img,
        alpha: 0.3,
        duration: 1200,
        ease: 'Sine.easeIn',
      });
    }
  }

  private renderRecall(): void {
    this.beat = 'recall';
    if (!this.recallQuestion) {
      // No questions in previous domain — skip to primer
      this.renderPrimer();
      return;
    }

    // Show previous boss sprite in upper corner as visual reminder
    const img = this.addBossPreview(this.previousBoss.id, 840, 200, 5, 0.8);
    if (img) {
      this.tweens.add({
        targets: img,
        y: '+=4',
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const q = this.recallQuestion;
    this.titleText.setText('📚 Recall');
    this.bodyText.setText(
      `From your victory over the ${this.previousBoss.name}:\n\n${q.stem}`,
    );
    const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    this.optionTexts.forEach((t, i) => {
      const letter = letters[i]!;
      t.setText(`${letter}) ${q.options[letter]}`);
    });
    this.hintText.setText('(press A/B/C/D or 1-4 to answer — no HP penalty, this is review only)');
  }

  private onRecallChoice(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (this.beat !== 'recall' || !this.recallQuestion) return;
    this.beat = 'recall-answered';
    const q = this.recallQuestion;
    const correct = choice === q.correct;
    const prefix = correct ? '✓ Correct' : `✗ Incorrect. Correct: ${q.correct}`;
    this.bodyText.setText(`${prefix}\n\n${q.explanation}`);
    this.optionTexts.forEach(t => t.setText(''));
    this.hintText.setText('(press Space / Enter / click to continue)');
  }

  private renderPrimer(): void {
    this.beat = 'primer';
    this.titleText.setText('📖 Primer');
    this.bodyText.setText(
      `The ${this.nextBoss.name} guards ${this.nextBoss.theme.toLowerCase()}.\n\n` +
      `Its domain: ${this.nextBoss.domain}.\n\n` +
      `Gather yourself — your next trial begins on the next keypress.`,
    );
    this.optionTexts.forEach(t => t.setText(''));
    this.hintText.setText('(press Space / Enter / click to begin the fight)');

    // Show incoming boss sprite with idle bob
    const img = this.addBossPreview(this.nextBoss.id, 480, 300, 6, 0.85);
    if (img) {
      this.tweens.add({
        targets: img,
        y: '+=4',
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private onPointer(): void {
    if (this.beat === 'narrative') {
      this.renderRecall();
    } else if (this.beat === 'recall-answered') {
      this.renderPrimer();
    } else if (this.beat === 'primer') {
      this.scene.start('BossFightScene', {
        bossId: this.nextBoss.id,
        mode: this.mode,
        isolated: false,
      });
    }
    // If beat === 'recall' (not answered yet): ignore pointer. User must pick A-D.
  }
}
