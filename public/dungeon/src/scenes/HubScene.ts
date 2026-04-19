import Phaser from 'phaser';
import { createCampaign } from '../game/dungeon';
import { createSpellbook } from '../game/spellbook';
import type { Campaign } from '../game/dungeon';
import type { RunMode, SaveStateV1, SpellId } from '../types';
import { SPELLS } from '../config';

function nextModeFor(save: SaveStateV1): RunMode {
  // Determine the next unplayed tier from unlocked_spells.
  // first-run: nothing NG-tier yet → play first-run
  // ng-plus: amplify unlocked but not doubleshot
  // ng-plus-plus: doubleshot unlocked but not focus
  // ng-plus-plus-plus: focus unlocked (terminal/replay tier)
  const u = save.unlocked_spells;
  if (!save.parchment_earned) return 'first-run';
  if (!u.includes('doubleshot')) return 'ng-plus';
  if (!u.includes('focus')) return 'ng-plus-plus';
  return 'ng-plus-plus-plus';
}

function modeLabel(mode: RunMode): string {
  switch (mode) {
    case 'first-run': return 'first run';
    case 'ng-plus': return 'NG+';
    case 'ng-plus-plus': return 'NG++';
    case 'ng-plus-plus-plus': return 'NG+++';
  }
}

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create(): void {
    const save: SaveStateV1 = this.registry.get('saveState');

    this.add.text(480, 50, '\uD83C\uDFF0 Gates of the Archive', {
      fontSize: '36px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (save.title_earned) {
      this.add.text(480, 95, `Title: ${save.title_earned}`, {
        fontSize: '16px', color: '#f5e4b3', fontFamily: 'monospace', fontStyle: 'italic',
      }).setOrigin(0.5);
    }

    this.add.text(480, 135, 'The Tower of Trials awaits.', {
      fontSize: '16px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const mode = nextModeFor(save);
    const isTerminal = mode === 'ng-plus-plus-plus' && save.eternal_dungeon_unlocked && save.unlocked_spells.includes('focus');

    const beginLabel = isTerminal
      ? 'Enter the Eternal Dungeon (NG+++)'
      : `Begin Quest (${modeLabel(mode)})`;

    const newBtn = this.add.rectangle(480, 230, 500, 80, 0x2d1b4e);
    newBtn.setStrokeStyle(3, 0x8b7cc4);
    newBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 230, beginLabel, {
      fontSize: '22px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    newBtn.on('pointerdown', () => this.beginCampaign(mode));

    // Unlocked spells summary
    const unlockedNames = save.unlocked_spells.map((id: SpellId) => SPELLS[id].name).join(', ');
    this.add.text(480, 320, `Unlocked spells: ${unlockedNames}`, {
      fontSize: '13px', color: '#808090', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (save.parchment_earned) {
      this.add.text(480, 355, '\uD83D\uDCDC Golden Parchment earned', {
        fontSize: '14px', color: '#f5e4b3', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Debug button kept for testing
    const debugBtn = this.add.rectangle(480, 440, 400, 50, 0x1b2d4e);
    debugBtn.setStrokeStyle(2, 0x6a7aa4);
    debugBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 440, '(debug) Fight Orchestrator only', {
      fontSize: '14px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);
    debugBtn.on('pointerdown', () => {
      this.scene.start('BossFightScene', { bossId: 'the-orchestrator', mode, isolated: true });
    });
  }

  private beginCampaign(mode: RunMode): void {
    const save: SaveStateV1 = this.registry.get('saveState');
    const seed = Date.now();
    const campaign: Campaign = createCampaign(mode, seed);
    const spellbook = createSpellbook(mode);

    // Grant only the charges for spells the player has unlocked (in case
    // they revisit an early tier after unlocking more spells: they should
    // get their existing unlocks on top of the tier default)
    for (const spellId of save.unlocked_spells) {
      if ((spellbook[spellId] ?? 0) === 0) spellbook[spellId] = 1;
    }

    this.registry.set('campaign', campaign);
    this.registry.set('spellbook', spellbook);
    this.registry.set('heroHp', 3);
    this.registry.set('sessionLog', {
      schema_version: 1,
      cert_id: save.cert_id,
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

    this.scene.start('BossFightScene', { bossId: campaign.bossOrder[0], mode, isolated: false });
  }
}
