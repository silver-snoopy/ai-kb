import Phaser from 'phaser';
import { createCampaign } from '../game/dungeon';
import { createSpellbook } from '../game/spellbook';
import type { Campaign } from '../game/dungeon';

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create(): void {
    this.add.text(480, 60, '\uD83C\uDFF0 Gates of the Archive', {
      fontSize: '36px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 120, 'The Tower of Trials awaits.', {
      fontSize: '18px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const newBtn = this.add.rectangle(480, 260, 400, 80, 0x2d1b4e);
    newBtn.setStrokeStyle(3, 0x8b7cc4);
    newBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 260, 'Begin Quest (first run)', {
      fontSize: '24px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    newBtn.on('pointerdown', () => this.beginCampaign());

    const debugBtn = this.add.rectangle(480, 380, 400, 60, 0x1b2d4e);
    debugBtn.setStrokeStyle(2, 0x6a7aa4);
    debugBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 380, '(debug) Fight Orchestrator only', {
      fontSize: '16px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);
    debugBtn.on('pointerdown', () => {
      this.scene.start('BossFightScene', { bossId: 'the-orchestrator', mode: 'first-run', isolated: true });
    });
  }

  private beginCampaign(): void {
    const seed = Date.now();
    const campaign: Campaign = createCampaign('first-run', seed);
    const spellbook = createSpellbook('first-run');
    this.registry.set('campaign', campaign);
    this.registry.set('spellbook', spellbook);
    this.registry.set('heroHp', 3);
    this.registry.set('sessionLog', {
      schema_version: 1,
      cert_id: this.registry.get('questions').cert_id,
      mode: campaign.mode,
      started_at: new Date().toISOString(),
      ended_at: null,
      result: null,
      bosses_defeated: [],
      spells_cast: [],
      questions: [],
      total_correct: 0,
      total_wrong: 0,
      final_hero_hp: 3,
    });

    this.scene.start('BossFightScene', { bossId: campaign.bossOrder[0], mode: 'first-run', isolated: false });
  }
}
