import Phaser from 'phaser';
import { BOSSES } from '../config';

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create(): void {
    this.add.text(480, 80, '\uD83C\uDFF0 Gates of the Archive', {
      fontSize: '36px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 140, 'Session 1 vertical slice \u2014 single boss test', {
      fontSize: '16px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const button = this.add.rectangle(480, 320, 400, 80, 0x2d1b4e);
    button.setStrokeStyle(3, 0x8b7cc4);
    button.setInteractive({ useHandCursor: true });

    this.add.text(480, 320, 'Fight The Orchestrator', {
      fontSize: '24px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      this.scene.start('BossFightScene', { bossId: 'the-orchestrator' });
    });
  }
}
