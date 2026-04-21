import Phaser from 'phaser';
import type { Priority } from './types';

export const OVERLAY_FADE_IN_MS = 300;
export const OVERLAY_HOLD_MS = 7500;
export const OVERLAY_FADE_OUT_MS = 400;
export const OVERLAY_ABORT_FADE_MS = 200;

// Center-Y of the narrator strip on canvas.
// Question bubble occupies y=130..330; sprite bottoms ≈ y=362; HP hearts at
// y=405; options start y=470. y=375 sits in the breathing space above the
// HP label row so the narrator reads as "inside" the scene with the sprites.
const OVERLAY_CENTER_Y = 375;

export function computeHoldMs(): number {
  return OVERLAY_FADE_IN_MS + OVERLAY_HOLD_MS + OVERLAY_FADE_OUT_MS;
}

type State = 'IDLE' | 'SHOWING' | 'HIDING';

export class NarratorOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private accent!: Phaser.GameObjects.Rectangle;
  private textObj!: Phaser.GameObjects.Text;
  private state: State = 'IDLE';
  private currentPrio: Priority | null = null;
  private activeTween: Phaser.Tweens.Tween | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  // scene.time.now at the moment the current line started its fade-in.
  // Used by pendingDelayMs() to report actual remaining time rather than
  // the full hold + fade-out budget.
  private showStartedAt = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build(): void {
    const cx = 480;
    const cy = OVERLAY_CENTER_Y;
    const width = 600;
    const height = 56;

    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(50);
    this.bg = this.scene.add.rectangle(0, 0, width, height, 0x0f0a1a, 0.96);
    this.bg.setStrokeStyle(1, 0x3a2f50, 0.6);
    this.accent = this.scene.add.rectangle(-width / 2 + 2, 0, 3, height - 8, 0x8a6ac0, 1);
    this.textObj = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      color: '#c8b8e0',
      wordWrap: { width: width - 40 },
      align: 'center',
    }).setOrigin(0.5);
    this.container.add([this.bg, this.accent, this.textObj]);
    this.container.setAlpha(0);
    this.container.setVisible(false);
  }

  show(line: string, priority: Priority): void {
    if (this.state !== 'IDLE') {
      if (this.currentPrio !== null && priority > this.currentPrio) {
        this.hide(true);
        this.scene.time.delayedCall(OVERLAY_ABORT_FADE_MS, () => this.show(line, priority));
        return;
      }
      return;
    }
    this.state = 'SHOWING';
    this.currentPrio = priority;
    this.showStartedAt = this.scene.time.now;
    this.textObj.setText(line);
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.container.y = OVERLAY_CENTER_Y + 10;
    this.activeTween = this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: OVERLAY_CENTER_Y,
      duration: OVERLAY_FADE_IN_MS,
      ease: 'Sine.easeOut',
    });
    this.hideTimer = this.scene.time.delayedCall(OVERLAY_FADE_IN_MS + OVERLAY_HOLD_MS, () => this.hide(false));
  }

  hide(abort: boolean): void {
    if (this.state === 'IDLE' || this.state === 'HIDING') return;
    if (this.hideTimer) { this.hideTimer.remove(false); this.hideTimer = null; }
    if (this.activeTween) { this.activeTween.stop(); this.activeTween = null; }
    this.state = 'HIDING';
    const duration = abort ? OVERLAY_ABORT_FADE_MS : OVERLAY_FADE_OUT_MS;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: OVERLAY_CENTER_Y - 8,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        this.state = 'IDLE';
        this.currentPrio = null;
      },
    });
  }

  isShowing(): boolean {
    return this.state !== 'IDLE';
  }

  currentPriority(): Priority | null {
    return this.currentPrio;
  }

  /** Remaining display time in ms if showing, else 0. Used by scene to
   *  delay next-question until the narrator line finishes. Computed from
   *  when show() started so a near-finished line doesn't block advance
   *  for the full hold + fade-out budget. */
  pendingDelayMs(): number {
    if (this.state === 'IDLE') return 0;
    const total = OVERLAY_FADE_IN_MS + OVERLAY_HOLD_MS + OVERLAY_FADE_OUT_MS;
    const elapsed = this.scene.time.now - this.showStartedAt;
    return Math.max(0, total - elapsed);
  }

  destroy(): void {
    this.hide(true);
    this.container.destroy();
  }
}
