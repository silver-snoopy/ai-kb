// Small helpers for camera-fade scene transitions so every boss\u2194interstitial
// boundary has the same read \u2014 you land in a scene, things fade in; when you
// leave, things fade out, then the next scene loads and fades in. Prevents
// the current abrupt snap between bosses that reads as a cut rather than a
// "descend to the next floor" beat.

import Phaser from 'phaser';

const FADE_IN_MS = 350;
const FADE_OUT_MS = 400;

/** Call at the top of a scene's create() so the scene fades in from black. */
export function fadeIn(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(FADE_IN_MS, 0, 0, 0);
}

/**
 * Fade the current scene to black, then start the next scene.
 * Use as a drop-in replacement for `this.scene.start(key, data)`.
 */
export function fadeToScene(
  scene: Phaser.Scene,
  key: string,
  data?: Record<string, unknown>,
): void {
  scene.cameras.main.fadeOut(FADE_OUT_MS, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(key, data);
  });
}
