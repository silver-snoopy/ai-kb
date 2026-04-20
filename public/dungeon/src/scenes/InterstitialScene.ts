import Phaser from 'phaser';
import { BOSSES } from '../config';
import type { MissedQuestion, Question, QuestionsJson, RunMode, BossDefinition } from '../types';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover } from '../ui/buttonHover';
import { paintOptionFeedback, resetOptionFeedback, summarizeExplanation } from '../ui/optionFeedback';
import { mountDemoBadgeIfActive } from '../ui/demoBadge';

interface InterstitialData {
  previousBossId: string;
  nextBossId: string;
  mode: RunMode;
  // If true, the follow-up BossFight runs in isolated (debug) mode \u2014
  // used by the Hub's "preview interstitial" button so the next boss
  // doesn't try to read a non-existent campaign from the registry.
  nextBossIsolated?: boolean;
  // Wrong answers from the boss just defeated. Drives the mistakes-review
  // beat. Undefined/empty \u2192 skip the beat entirely.
  missedQuestions?: MissedQuestion[];
}

type Beat = 'narrative' | 'mistakes-review' | 'recall' | 'recall-answered' | 'primer';

export class InterstitialScene extends Phaser.Scene {
  private previousBoss!: BossDefinition;
  private nextBoss!: BossDefinition;
  private mode!: RunMode;
  private nextBossIsolated = false;
  private beat: Beat = 'narrative';
  private recallQuestion: Question | null = null;
  private missedQuestions: MissedQuestion[] = [];
  private currentMistakeIdx = 0;

  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private optionPanels: Phaser.GameObjects.Rectangle[] = [];

  // Phaser fires per-object pointerdown before the global scene
  // pointerdown in the same frame. When the user clicks a recall panel,
  // onRecallChoice transitions beat \u2014 but the global onPointer then sees
  // the new beat and would advance again in the same click. This flag
  // swallows that one extra global click.
  private recallJustAnswered = false;

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
    this.nextBossIsolated = data.nextBossIsolated ?? false;
    this.missedQuestions = data.missedQuestions ?? [];
    this.currentMistakeIdx = 0;
    this.beat = 'narrative';

    const qs: QuestionsJson = this.registry.get('questions');
    const prevDomain = qs.domains.find(d => d.id === prev.domain);
    const pool = prevDomain?.questions ?? [];
    this.recallQuestion = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]! : null;
  }

  create(): void {
    // Phaser reuses scene instances on re-entry (same bug pattern as BossFightScene):
    // without this reset, optionPanels + optionTexts accumulate references to
    // destroyed GameObjects from the previous campaign transition. On boss 2→3+,
    // the forEach(setText/...) in renderRecall throws on a destroyed Text's null
    // canvas — which halts the function before setVisible(true) and the hint
    // update can run, leaving the recall screen with no option panels and a
    // stale hint reading "(press Space / Enter / click to continue)".
    this.optionTexts = [];
    this.optionPanels = [];

    this.cameras.main.setBackgroundColor(0x0a0a14);
    fadeIn(this);

    this.titleText = this.add.text(480, 80, '', {
      fontSize: '28px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Body text \u2014 shrunk from 18 to 16 and word-wrap widened so long
    // recall stems use the full scene width without clipping.
    this.bodyText = this.add.text(480, 170, '', {
      fontSize: '16px', color: '#e0e0ea', fontFamily: 'monospace',
      wordWrap: { width: 900, useAdvancedWrap: true }, align: 'center',
    }).setOrigin(0.5, 0);

    // Options \u2014 now with a dark panel behind each row + wordWrap so long
    // answers don't run past the canvas right edge. 48px row pitch so a
    // 2-line wrap still fits inside its panel without bleeding into the
    // next row.
    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 395 + idx * 48;
      const panel = this.add.rectangle(480, y, 900, 44, 0x1a1a2a);
      panel.setStrokeStyle(1, 0x3a3a4a);
      panel.setVisible(false);  // only shown on the recall beat
      panel.setInteractive({ useHandCursor: true });
      // Hover feedback so the recall panel behaves like the combat
      // options \u2014 brighten on cursor enter, restore on leave.
      attachRectHover(panel,
        { fill: 0x1a1a2a, stroke: 0x3a3a4a },
        { fill: 0x2a2a3a, stroke: 0x8b8bc4 },
        1,
      );
      // Click also answers the recall, matching the keyboard path.
      panel.on('pointerdown', () => this.onRecallChoice(letter));
      this.optionPanels.push(panel);
      const txt = this.add.text(50, y, '', {
        fontSize: '13px', color: '#d0d0da', fontFamily: 'monospace',
        wordWrap: { width: 870, useAdvancedWrap: true },
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      this.input.keyboard?.on(`keydown-${letter}`, () => this.onRecallChoice(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.onRecallChoice(letter));
    });

    this.hintText = this.add.text(480, 600, '', {
      fontSize: '14px', color: '#808090', fontFamily: 'monospace', fontStyle: 'italic',
      wordWrap: { width: 900, useAdvancedWrap: true }, align: 'center',
    }).setOrigin(0.5, 0);

    this.input.on('pointerdown', () => this.onPointer());
    this.input.keyboard?.on('keydown-SPACE', () => this.onPointer());
    this.input.keyboard?.on('keydown-ENTER', () => this.onPointer());

    mountDemoBadgeIfActive(this);

    this.renderNarrative();
  }

  /** Restore the default grey-italic hint style after mistakes-review
   *  overrode it for a higher-contrast explanation readout. */
  private resetHintStyle(): void {
    this.hintText.setColor('#808090');
    this.hintText.setStyle({ fontStyle: 'italic' });
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
      `You descended from ${this.previousBoss.name}'s lair.\n\n` +
      `Ahead: ${this.nextBoss.theme.toLowerCase()}.\n\n` +
      `${this.nextBoss.name} awaits.`,
    );
    this.optionTexts.forEach(t => t.setText(''));
    this.optionPanels.forEach(p => p.setVisible(false));
    this.resetHintStyle();
    this.hintText.setText('(press Space / Enter / click to continue)');

    // Show previous boss sprite fading out
    const img = this.addBossPreview(this.previousBoss.id, 480, 400, 4, 1);
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

    // Show previous boss sprite inline with the Recall title so it reads
    // as a caption badge next to the heading rather than a floating
    // thumbnail in the corner.
    const img = this.addBossPreview(this.previousBoss.id, 660, 82, 2.5, 0.9);
    if (img) {
      this.tweens.add({
        targets: img,
        y: '+=3',
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const q = this.recallQuestion;
    this.titleText.setText('📚 Recall');
    this.bodyText.setText(
      `From your victory over ${this.previousBoss.name}:\n\n${q.stem}`,
    );
    const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    this.optionTexts.forEach((t, i) => {
      const letter = letters[i]!;
      t.setText(`${letter}) ${q.options[letter]}`);
    });
    // Recall options re-enable input (mistakes-review may have disabled them).
    this.optionPanels.forEach(p => {
      p.setVisible(true);
      p.setInteractive({ useHandCursor: true });
    });
    resetOptionFeedback(this.optionPanels, this.optionTexts);
    // Re-apply the recall option text since resetOptionFeedback strips prefixes.
    this.optionTexts.forEach((t, i) => {
      const letter = (['A', 'B', 'C', 'D'] as const)[i]!;
      t.setText(`${letter}) ${q.options[letter]}`);
    });
    this.resetHintStyle();
    this.hintText.setText('(press A/B/C/D or 1-4 to answer — no HP penalty, this is review only)');
  }

  private onRecallChoice(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (this.beat !== 'recall' || !this.recallQuestion) return;
    this.beat = 'recall-answered';
    this.recallJustAnswered = true;
    const q = this.recallQuestion;
    const correct = choice === q.correct;
    const prefix = correct ? '✓ Correct' : `✗ Incorrect. Correct: ${q.correct}`;
    this.bodyText.setText(`${prefix}\n\n${q.explanation}`);
    this.optionTexts.forEach(t => t.setText(''));
    this.optionPanels.forEach(p => p.setVisible(false));
    this.resetHintStyle();
    this.hintText.setText('(press Space / Enter / click to continue)');
  }

  private renderPrimer(): void {
    this.beat = 'primer';
    this.titleText.setText('📖 Primer');
    this.bodyText.setText(
      `${this.nextBoss.name} guards ${this.nextBoss.theme.toLowerCase()}.\n\n` +
      `Its domain: ${this.nextBoss.domain}.\n\n` +
      `Gather yourself — your next trial begins on the next keypress.`,
    );
    this.optionTexts.forEach(t => t.setText(''));
    this.optionPanels.forEach(p => p.setVisible(false));
    this.resetHintStyle();
    this.hintText.setText('(press Space / Enter / click to begin the fight)');

    // Show incoming boss sprite with idle bob
    const img = this.addBossPreview(this.nextBoss.id, 480, 300, 4, 0.85);
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
    if (this.recallJustAnswered) {
      // Swallow the global pointerdown that fires in the same frame as
      // the panel's pointerdown when the user just clicked a recall
      // option. Next click advances to primer normally.
      this.recallJustAnswered = false;
      return;
    }
    if (this.beat === 'narrative') {
      if (this.missedQuestions.length > 0) {
        this.currentMistakeIdx = 0;
        this.renderMistakesReview();
      } else {
        this.renderRecall();
      }
    } else if (this.beat === 'mistakes-review') {
      if (this.currentMistakeIdx + 1 < this.missedQuestions.length) {
        this.currentMistakeIdx++;
        this.renderMistakesReview();
      } else {
        this.renderRecall();
      }
    } else if (this.beat === 'recall-answered') {
      this.renderPrimer();
    } else if (this.beat === 'primer') {
      fadeToScene(this, 'BossFightScene', {
        bossId: this.nextBoss.id,
        mode: this.mode,
        isolated: this.nextBossIsolated,
      });
    }
    // If beat === 'recall' (not answered yet): ignore pointer. User must pick A-D.
  }

  private renderMistakesReview(): void {
    this.beat = 'mistakes-review';
    const miss = this.missedQuestions[this.currentMistakeIdx];
    if (!miss) {
      // Defensive: if the index got out of bounds, skip to recall.
      this.renderRecall();
      return;
    }

    const total = this.missedQuestions.length;
    const n = this.currentMistakeIdx + 1;
    this.titleText.setText(`\uD83D\uDCDC Mistake ${n} of ${total}`);
    this.clearPreview();

    // Stem in the body slot \u2014 truncated hint if very long, options below
    // show the detail.
    this.bodyText.setText(miss.stem);

    // Populate the 4 option texts with the full option text, then paint
    // them via the shared helper so the chosen-wrong option goes red (\u2717)
    // and the correct one green (\u2713).
    const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    resetOptionFeedback(this.optionPanels, this.optionTexts);
    this.optionTexts.forEach((t, i) => {
      const letter = letters[i]!;
      t.setText(`${letter}) ${miss.options[letter]}`);
    });
    this.optionPanels.forEach(p => {
      p.setVisible(true);
      // Disable interactivity \u2014 this is review, not a quiz.
      p.disableInteractive();
    });
    paintOptionFeedback(this.optionPanels, this.optionTexts, miss.correct, miss.chosen);

    // Explanation summary below the options. 350-char cap + wordWrap keeps
    // the text inside the ~160px band between the last option (y=561) and
    // the canvas floor (y=720). Full explanation is still available via
    // the session log download / post-run review.
    const summary = summarizeExplanation(miss.explanation, miss.correct, 350);
    const advance = n < total
      ? '(press Space / Enter / click for next mistake)'
      : '(press Space / Enter / click to continue)';
    this.hintText.setColor('#e8e0d0');
    this.hintText.setStyle({ fontStyle: 'normal' });
    this.hintText.setText(`${summary}\n\n${advance}`);
  }
}
