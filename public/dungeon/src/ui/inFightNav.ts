import type Phaser from 'phaser';

// Single wooden door in the td-tiles spritesheet — reads as "exit/leave".
const DOOR_FRAME = 45;

/**
 * Mount a small door icon that acts as a back-to-menu control (default
 * top-left; the caller may reposition via `position` — the HUD bar centers it).
 * Clicking it invokes onExit. Visuals only — the caller decides what leaving
 * does (see BossFightScene.exitToHub).
 */
export function mountMenuButton(
  scene: Phaser.Scene,
  onExit: () => void,
  position: { x: number; y: number } = { x: 28, y: 28 },
): void {
  const door = scene.add
    .image(position.x, position.y, 'td-tiles', DOOR_FRAME)
    .setScale(2)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  door.on('pointerover', () => door.setTint(0xffe070));
  door.on('pointerout', () => door.clearTint());
  door.on('pointerdown', onExit);
}
