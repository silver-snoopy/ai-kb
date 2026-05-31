import type Phaser from 'phaser';
import { isScriptedDemo } from './debugToggle';
import { fadeToScene } from './transitions';

/**
 * The warded-diamond rune. Doubles as the camouflaged trigger glyph and the
 * symbol the stinger ends on — trigger and payload rhyme.
 */
export const SIGIL_GLYPH = '◈';

/**
 * If the scripted ?demo run is active, make `target` the post-credit stinger
 * launcher — a click fades to the PostCreditScene. No hand-cursor, so it stays
 * camouflaged; inert (left untouched) for every normal player. Shared by the
 * boss-HUD sigil and the Hub's castle title so both arm identically.
 */
export function armStingerTriggerIfDemo(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
): void {
  if (!isScriptedDemo()) return;
  target.setInteractive({ useHandCursor: false });
  target.on(
    'pointerdown',
    (_p: unknown, _x: number, _y: number, event?: Phaser.Types.Input.EventData) => {
      event?.stopPropagation?.();
      fadeToScene(scene, 'PostCreditScene');
    },
  );
}

/**
 * Mount the decorative rune at (x, y) — used as the boss-HUD Floor/domain
 * separator. Visible for ALL players as inert chrome; armed as the stinger
 * trigger only during the scripted ?demo run.
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
      fontSize: '14px',
      color: '#6a6a7a',
      fontFamily: 'monospace',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  armStingerTriggerIfDemo(scene, sigil);
  return sigil;
}
