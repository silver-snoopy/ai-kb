import Phaser from 'phaser';

export class CampaignCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignCompleteScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2d1b4e');
    this.add.text(480, 200, '\uD83D\uDCDC GOLDEN PARCHMENT', {
      fontSize: '48px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(480, 280, 'Quest Complete', {
      fontSize: '24px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(480, 360, '(Session 2 placeholder \u2014 score breakdown\nand Archmage Title in Session 3)', {
      fontSize: '14px', color: '#a0a0b0', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
    this.add.text(480, 460, '(click to return to Hub)', {
      fontSize: '16px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }
}
