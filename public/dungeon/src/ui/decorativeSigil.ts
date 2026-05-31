import type Phaser from 'phaser';
import { isDemoMode } from '../game/demoMode';
import { fadeToScene } from './transitions';

/**
 * The warded-diamond rune. Doubles as the camouflaged trigger glyph and the
 * symbol the stinger ends on — trigger and payload rhyme.
 */
export const SIGIL_GLYPH = '◈';

/**
 * Mount the permanent decorative rune at (x, y). Visible for ALL players as
 * inert HUD chrome. Only in demo mode does it become interactive and, on click,
 * launch the post-credit stinger. No hand-cursor, so it never reads as a button
 * to a normal player.
 *
 * Returns the created text object (for repositioning / tests).
 */
export function mountDecorativeSigil(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Text {
  const sigil = scene.add
    .text(x, y, SIGIL_GLYPH, {
      fontSize: '16px',
      color: '#6a6a7a',
      fontFamily: 'monospace',
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  if (isDemoMode(scene)) {
    sigil.setInteractive({ useHandCursor: false });
    sigil.on(
      'pointerdown',
      (_p: unknown, _x: number, _y: number, event?: Phaser.Types.Input.EventData) => {
        event?.stopPropagation?.();
        fadeToScene(scene, 'PostCreditScene');
      },
    );
  }

  return sigil;
}
