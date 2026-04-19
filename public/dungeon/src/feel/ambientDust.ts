import Phaser from 'phaser';

export const DUST_BURST_COUNT = 4;
export const DUST_BURST_INTERVAL_MS = 2500;
export const DUST_LIFETIME_MIN_MS = 8000;
export const DUST_LIFETIME_MAX_MS = 12000;
const DUST_TEXTURE_KEY = 'feel-dust-pixel';

function ensureDustTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(DUST_TEXTURE_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xc0c8d8, 1);
  g.fillRect(0, 0, 2, 2);
  g.generateTexture(DUST_TEXTURE_KEY, 2, 2);
  g.destroy();
}

export function installAmbientDust(scene: Phaser.Scene): () => void {
  ensureDustTexture(scene);
  const emitter = scene.add.particles(0, 0, DUST_TEXTURE_KEY, {
    x: { min: 0, max: 960 },
    y: { min: 580, max: 700 },
    lifespan: { min: DUST_LIFETIME_MIN_MS, max: DUST_LIFETIME_MAX_MS },
    speedY: { min: -18, max: -12 },
    speedX: { min: -2, max: 2 },
    alpha: { start: 0.3, end: 0 },
    frequency: DUST_BURST_INTERVAL_MS / DUST_BURST_COUNT,
    quantity: 1,
  });
  emitter.setDepth(-5);  // behind everything but the backdrop
  return () => { emitter.destroy(); };
}
