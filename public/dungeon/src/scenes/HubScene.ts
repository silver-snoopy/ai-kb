import Phaser from 'phaser';
import { createCampaign } from '../game/dungeon';
import { createSpellbook } from '../game/spellbook';
import type { Campaign } from '../game/dungeon';
import type { RunMode, SaveStateV1, SpellId } from '../types';
import { SPELLS } from '../config';
import { mountAudioToggles } from '../ui/audioToggles';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover } from '../ui/buttonHover';

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
    fadeIn(this);
    const save: SaveStateV1 = this.registry.get('saveState');

    // Audio mute toggles (top-right). Hub has no BGM so only SFX mute is
    // functionally relevant here, but the BGM toggle is still shown so
    // the user can pre-mute before entering a boss fight.
    mountAudioToggles(this);

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
    attachRectHover(newBtn,
      { fill: 0x2d1b4e, stroke: 0x8b7cc4 },
      { fill: 0x4a2d7a, stroke: 0xc4a0ff },
      3,
    );
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

    // Debug boss-preview row \u2014 each button jumps straight to the named
    // boss's fight in isolated mode so the design of each room can be
    // eyeballed without playing a full campaign.
    this.add.text(480, 420, '(debug) preview boss rooms', {
      fontSize: '12px', color: '#808090', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);

    const debugBosses: Array<{ id: string; label: string }> = [
      { id: 'the-orchestrator',  label: 'Orch.' },
      { id: 'the-compiler-king', label: 'Comp-K' },
      { id: 'the-grammarian',    label: 'Gram.' },
      { id: 'the-tool-smith',    label: 'Tool-S' },
      { id: 'the-memory-kraken', label: 'Kraken' },
    ];
    debugBosses.forEach((b, idx) => {
      // 5 buttons at 150 wide, 175px-apart centers, centered around x=480.
      const x = 130 + idx * 175;
      const y = 465;
      const btn = this.add.rectangle(x, y, 150, 38, 0x1b2d4e);
      btn.setStrokeStyle(2, 0x6a7aa4);
      btn.setInteractive({ useHandCursor: true });
      attachRectHover(btn,
        { fill: 0x1b2d4e, stroke: 0x6a7aa4 },
        { fill: 0x2d4a7a, stroke: 0xa0b4e0 },
      );
      this.add.text(x, y, b.label, {
        fontSize: '14px', color: '#d0d0da', fontFamily: 'monospace',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        fadeToScene(this, 'BossFightScene', { bossId: b.id, mode, isolated: true });
      });
    });

    // Debug: preview the 3-beat interstitial (narrative \u2192 recall \u2192 primer).
    // Hardcodes Orchestrator \u2192 Compiler-King so the recall step has real
    // domain-1 content to pull from; flagged isolated so the follow-up
    // BossFight doesn't try to read a non-existent campaign.
    const interBtn = this.add.rectangle(480, 525, 320, 34, 0x2d1b4e);
    interBtn.setStrokeStyle(2, 0x7a6aa4);
    interBtn.setInteractive({ useHandCursor: true });
    attachRectHover(interBtn,
      { fill: 0x2d1b4e, stroke: 0x7a6aa4 },
      { fill: 0x4a2d7a, stroke: 0xc4a0ff },
    );
    this.add.text(480, 525, '(debug) preview interstitial', {
      fontSize: '12px', color: '#c0c0d0', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);
    interBtn.on('pointerdown', () => {
      fadeToScene(this, 'InterstitialScene', {
        previousBossId: 'the-orchestrator',
        nextBossId: 'the-compiler-king',
        mode,
        nextBossIsolated: true,
      });
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

    fadeToScene(this, 'BossFightScene', { bossId: campaign.bossOrder[0], mode, isolated: false });
  }
}
