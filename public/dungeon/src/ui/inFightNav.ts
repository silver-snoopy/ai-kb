import type Phaser from 'phaser';
import { attachTextHover } from './buttonHover';

// Single wooden door in the td-tiles spritesheet — reads as "exit/leave".
const DOOR_FRAME = 45;

/**
 * Mount a small "Menu" exit control (door icon + label) in the top-left of a
 * boss fight. Clicking either the icon or the label invokes onExit. Visuals
 * only — the caller decides what leaving does (see BossFightScene.exitToHub).
 */
export function mountMenuButton(scene: Phaser.Scene, onExit: () => void): void {
  const door = scene.add
    .image(28, 28, 'td-tiles', DOOR_FRAME)
    .setScale(2)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(48, 28, 'Menu', {
      fontSize: '13px',
      color: '#c0c0d0',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2a',
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0, 0.5)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  attachTextHover(label, { bg: '#1a1a2a', color: '#c0c0d0' }, { bg: '#2a2a3a', color: '#ffffff' });
  door.on('pointerover', () => door.setTint(0xffe070));
  door.on('pointerout', () => door.clearTint());

  door.on('pointerdown', onExit);
  label.on('pointerdown', onExit);
}
