import Phaser from 'phaser';
import { installAmbientDust } from '../feel/ambientDust';
import { SIGIL_GLYPH } from '../ui/decorativeSigil';
import { fadeToScene } from '../ui/transitions';
import { renderBackdrop } from './backdrops';

const AUTO_RETURN_MS = 20000;
const GROUND_Y = 430;

/**
 * "The Vanishing" — a hidden post-credit stinger. The warlock walks in, reads
 * the golden parchment, and teleports out in a white flash; the screen falls to
 * black and "Our hero will return…" fades in beneath a single arcane rune (the
 * same glyph as the trigger sigil). Pure tween/flash/text choreography over the
 * existing static `hero` image — no new art.
 *
 * Reached only via the demo-armed decorative sigil (see decorativeSigil.ts).
 * Always exits to HubScene: on input once the text has appeared, or after a
 * ~20s failsafe so the presenter is never stranded on stage.
 */
export class PostCreditScene extends Phaser.Scene {
  private canDismiss = false;
  private leaving = false;

  constructor() {
    super({ key: 'PostCreditScene' });
  }

  create(): void {
    this.canDismiss = false;
    this.leaving = false;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Dim torch-lit floor: reuse a boss backdrop, then darken with an overlay.
    renderBackdrop(this, 'the-orchestrator');
    const dim = this.add.rectangle(480, 360, 960, 720, 0x000000, 0.62).setDepth(5);

    const stopDust = installAmbientDust(this);

    // The warlock walks in from the left (static image; motion = tween + bob).
    const hero = this.add.image(-60, GROUND_Y, 'hero').setScale(3).setDepth(10);
    this.tweens.add({
      targets: hero,
      x: 360,
      duration: 2200,
      delay: 1500,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: hero,
      y: GROUND_Y - 4,
      duration: 260,
      yoyo: true,
      repeat: 8,
      delay: 1500,
      ease: 'Sine.easeInOut',
    });

    // BEAT 2 — the golden parchment glows in; he reads it.
    const scroll = this.add
      .text(430, GROUND_Y + 36, '📜', { fontSize: '40px' })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0);
    this.time.delayedCall(3900, () => {
      this.tweens.add({ targets: scroll, alpha: 1, duration: 500 });
      this.tweens.add({
        targets: scroll,
        scale: 1.12,
        duration: 700,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    });

    // BEAT 3-5 — ignition → white flash → vanish (flash masks alpha/scale→0).
    const flash = this.add.rectangle(480, 360, 960, 720, 0xffffff, 1).setDepth(50).setAlpha(0);
    this.time.delayedCall(6500, () => {
      this.tweens.add({
        targets: hero,
        scaleX: 2.8,
        scaleY: 3.3,
        duration: 700,
        ease: 'Sine.easeIn',
      });
    });
    this.time.delayedCall(7300, () => {
      this.tweens.add({
        targets: flash,
        alpha: 1,
        duration: 130,
        ease: 'Quad.easeIn',
        onComplete: () => {
          hero.setAlpha(0).setScale(0);
          scroll.setAlpha(0);
          this.spawnCollapseRing(360, GROUND_Y);
          this.tweens.add({ targets: flash, alpha: 0, duration: 360, ease: 'Quad.easeOut' });
        },
      });
    });

    // BEAT 6 — fall to full black.
    this.time.delayedCall(8300, () => {
      this.tweens.add({ targets: dim, fillAlpha: 1, duration: 900 });
    });

    // BEAT 7 — the promise + the rune.
    const line = this.add
      .text(480, 330, 'Our hero will return…', {
        fontSize: '30px',
        color: '#f5e4b3',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    const rune = this.add
      .text(480, 400, SIGIL_GLYPH, { fontSize: '26px', color: '#9a7bd0', fontFamily: 'monospace' })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.time.delayedCall(9500, () => {
      this.tweens.add({ targets: line, alpha: 1, duration: 1200, ease: 'Sine.easeInOut' });
    });
    this.time.delayedCall(10800, () => {
      this.tweens.add({
        targets: rune,
        alpha: 0.85,
        duration: 600,
        yoyo: true,
        hold: 200,
        ease: 'Sine.easeInOut',
      });
    });

    // BEAT 8 — the tiny 4th-wall wink; arm dismissal.
    const wink = this.add
      .text(480, 690, '// to be continued — pending review', {
        fontSize: '13px',
        color: '#7a7a8a',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.time.delayedCall(12000, () => {
      this.tweens.add({ targets: wink, alpha: 1, duration: 800 });
      this.canDismiss = true;
      stopDust();
    });

    // Dismiss: any input once text is in, plus a failsafe auto-return.
    const goHome = (): void => {
      if (this.canDismiss) this.leave();
    };
    this.input.on('pointerdown', goHome);
    this.input.keyboard?.on('keydown', goHome);
    this.time.delayedCall(AUTO_RETURN_MS, () => this.leave());
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    fadeToScene(this, 'HubScene');
  }

  private spawnCollapseRing(x: number, y: number): void {
    const g = this.add.graphics().setDepth(45);
    const ring = { r: 90, a: 0.9 };
    this.tweens.add({
      targets: ring,
      r: 0,
      a: 0,
      duration: 600,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        g.clear();
        g.lineStyle(3, 0x9a7bd0, ring.a);
        g.strokeCircle(x, y, ring.r);
      },
      onComplete: () => g.destroy(),
    });
  }
}
