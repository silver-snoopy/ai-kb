import Phaser from 'phaser';
import { createCampaign } from '../game/dungeon';
import { createSpellbook } from '../game/spellbook';
import type { Campaign } from '../game/dungeon';
import type { RunMode, SaveStateV1, SpellId } from '../types';
import { BOSSES, SPELLS } from '../config';
import { mountAudioToggles } from '../ui/audioToggles';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover } from '../ui/buttonHover';
import { isDebugEnabled, mountDebugToggle } from '../ui/debugToggle';
import { readActiveRun, clearActiveRun, type RunSave } from '../game/runSave';

function continueButtonLabel(save: RunSave): string {
  const floor = save.campaign.floorsCleared + 1;
  const currentBossId = save.inBoss?.bossId
    ?? save.campaign.bossOrder[save.campaign.floorsCleared];
  const bossName = BOSSES.find(b => b.id === currentBossId)?.name ?? currentBossId ?? '???';
  const where = save.inBoss ? 'mid-fight' : 'approaching';
  return `Continue (Floor ${floor} · ${bossName}, ${where})`;
}

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

    const activeRun = readActiveRun();

    if (activeRun) {
      // Mid-run save present — offer Continue (primary) + New Game (secondary).
      const continueLabel = continueButtonLabel(activeRun);
      const continueBtn = this.add.rectangle(480, 210, 500, 64, 0x1b4e2d);
      continueBtn.setStrokeStyle(3, 0x8bc34a);
      continueBtn.setInteractive({ useHandCursor: true });
      attachRectHover(continueBtn,
        { fill: 0x1b4e2d, stroke: 0x8bc34a },
        { fill: 0x2d7a4a, stroke: 0xb0e070 },
        3,
      );
      this.add.text(480, 210, continueLabel, {
        fontSize: '18px', color: '#e0e0ea', fontFamily: 'monospace',
      }).setOrigin(0.5);
      continueBtn.on('pointerdown', () => this.resumeActiveRun(activeRun));

      const newBtn = this.add.rectangle(480, 286, 320, 44, 0x2d1b4e);
      newBtn.setStrokeStyle(2, 0x8b7cc4);
      newBtn.setInteractive({ useHandCursor: true });
      attachRectHover(newBtn,
        { fill: 0x2d1b4e, stroke: 0x8b7cc4 },
        { fill: 0x4a2d7a, stroke: 0xc4a0ff },
      );
      this.add.text(480, 286, 'New Game (discards current run)', {
        fontSize: '13px', color: '#c0c0d0', fontFamily: 'monospace', fontStyle: 'italic',
      }).setOrigin(0.5);
      newBtn.on('pointerdown', () => this.confirmNewGame(mode));
    } else {
      // No save — single big button as before.
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
    }

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

    // Debug surfaces live in a dedicated container so the bug-icon toggle
    // can show/hide the entire cluster atomically. Only mounted when the
    // URL gate (?debug or ?debug=1) is present — otherwise non-dev users
    // never see a discovery path.
    if (isDebugEnabled()) {
      const debugLayer = this.add.container(0, 0);

      debugLayer.add(this.add.text(480, 420, '(debug) preview boss rooms', {
        fontSize: '12px', color: '#808090', fontFamily: 'monospace', fontStyle: 'italic',
      }).setOrigin(0.5));

      const debugBosses: Array<{ id: string; label: string }> = [
        { id: 'the-orchestrator',  label: 'Orch.' },
        { id: 'the-compiler-king', label: 'Comp-K' },
        { id: 'the-grammarian',    label: 'Gram.' },
        { id: 'the-tool-smith',    label: 'Tool-S' },
        { id: 'the-memory-kraken', label: 'Kraken' },
      ];
      debugBosses.forEach((b, idx) => {
        const x = 130 + idx * 175;
        const y = 465;
        const btn = this.add.rectangle(x, y, 150, 38, 0x1b2d4e);
        btn.setStrokeStyle(2, 0x6a7aa4);
        btn.setInteractive({ useHandCursor: true });
        attachRectHover(btn,
          { fill: 0x1b2d4e, stroke: 0x6a7aa4 },
          { fill: 0x2d4a7a, stroke: 0xa0b4e0 },
        );
        const label = this.add.text(x, y, b.label, {
          fontSize: '14px', color: '#d0d0da', fontFamily: 'monospace',
        }).setOrigin(0.5);
        btn.on('pointerdown', () => {
          fadeToScene(this, 'BossFightScene', { bossId: b.id, mode, isolated: true });
        });
        debugLayer.add(btn);
        debugLayer.add(label);
      });

      const interBtn = this.add.rectangle(480, 525, 320, 34, 0x2d1b4e);
      interBtn.setStrokeStyle(2, 0x7a6aa4);
      interBtn.setInteractive({ useHandCursor: true });
      attachRectHover(interBtn,
        { fill: 0x2d1b4e, stroke: 0x7a6aa4 },
        { fill: 0x4a2d7a, stroke: 0xc4a0ff },
      );
      const interLabel = this.add.text(480, 525, '(debug) preview interstitial', {
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
      debugLayer.add(interBtn);
      debugLayer.add(interLabel);

      mountDebugToggle(this, (visible) => {
        debugLayer.setVisible(visible);
      });
    }
  }

  private resumeActiveRun(save: RunSave): void {
    // Validate the saved boss still exists (boss config could have drifted
    // between versions). If not, clear and fall back to a fresh start.
    const inBossId = save.inBoss?.bossId;
    const nextBossIdx = save.campaign.floorsCleared;
    const currentBossId = inBossId ?? save.campaign.bossOrder[nextBossIdx];
    if (!currentBossId || !BOSSES.find(b => b.id === currentBossId)) {
      clearActiveRun();
      // eslint-disable-next-line no-console
      console.warn('[runSave] cleared: saved boss id missing from BOSSES config');
      this.scene.restart();
      return;
    }

    // Restore the minimum registry state BossFightScene / InterstitialScene
    // expect: campaign, spellbook, heroHp, sessionLog.
    const saveState: SaveStateV1 = this.registry.get('saveState');
    this.registry.set('campaign', {
      mode: save.campaign.mode,
      bossOrder: [...save.campaign.bossOrder],
      floorsCleared: save.campaign.floorsCleared,
    });
    this.registry.set('spellbook', { ...save.spellbook });
    this.registry.set('heroHp', save.heroHpCarryover);
    this.registry.set('sessionLog', {
      schema_version: 1,
      cert_id: saveState.cert_id,
      mode: save.campaign.mode,
      started_at: save.savedAt,
      ended_at: null,
      result: null,
      bosses_defeated: save.campaign.bossOrder.slice(0, save.campaign.floorsCleared),
      spells_cast: [],
      questions: [],
      total_correct: 0,
      total_wrong: 0,
      final_hero_hp: save.heroHpCarryover,
    });

    if (save.inBoss) {
      // Re-enter mid-boss. BossFightScene.init will detect the matching
      // save and restore question pool + index + HP from it.
      fadeToScene(this, 'BossFightScene', {
        bossId: save.inBoss.bossId,
        mode: save.campaign.mode,
        isolated: false,
      });
    } else if (nextBossIdx === 0) {
      // Between-bosses save but no floors cleared yet — happens after
      // "(debug) preview interstitial" lands a stale save. Straight to
      // first boss.
      fadeToScene(this, 'BossFightScene', {
        bossId: currentBossId,
        mode: save.campaign.mode,
        isolated: false,
      });
    } else {
      // Between-bosses save mid-campaign — re-enter the interstitial
      // with the previous-boss → next-boss recap (no mistakes-review
      // since those were scene-local to the just-finished BossFight).
      fadeToScene(this, 'InterstitialScene', {
        previousBossId: save.campaign.bossOrder[nextBossIdx - 1]!,
        nextBossId: currentBossId,
        mode: save.campaign.mode,
      });
    }
  }

  private confirmNewGame(mode: RunMode): void {
    // Simple in-scene confirm modal — dim overlay + two-button row.
    const overlay = this.add.rectangle(480, 360, 960, 720, 0x000000, 0.72);
    overlay.setInteractive();

    const panel = this.add.rectangle(480, 340, 560, 220, 0x1a1a2a);
    panel.setStrokeStyle(2, 0x8b7cc4);

    const title = this.add.text(480, 270, 'Abandon current run?', {
      fontSize: '22px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const body = this.add.text(480, 312, 'This will discard your in-flight progress\nand start a fresh campaign.', {
      fontSize: '14px', color: '#a0a0b0', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);

    const yesBtn = this.add.rectangle(360, 400, 180, 44, 0x4e1b1b);
    yesBtn.setStrokeStyle(2, 0xe57373);
    yesBtn.setInteractive({ useHandCursor: true });
    attachRectHover(yesBtn,
      { fill: 0x4e1b1b, stroke: 0xe57373 },
      { fill: 0x7a2d2d, stroke: 0xff9b9b },
    );
    const yesText = this.add.text(360, 400, 'Abandon', {
      fontSize: '15px', color: '#f0c8c8', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const noBtn = this.add.rectangle(600, 400, 180, 44, 0x2d1b4e);
    noBtn.setStrokeStyle(2, 0x8b7cc4);
    noBtn.setInteractive({ useHandCursor: true });
    attachRectHover(noBtn,
      { fill: 0x2d1b4e, stroke: 0x8b7cc4 },
      { fill: 0x4a2d7a, stroke: 0xc4a0ff },
    );
    const noText = this.add.text(600, 400, 'Keep running', {
      fontSize: '15px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const dismiss = () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      body.destroy();
      yesBtn.destroy();
      yesText.destroy();
      noBtn.destroy();
      noText.destroy();
    };

    yesBtn.on('pointerdown', () => {
      clearActiveRun();
      dismiss();
      this.beginCampaign(mode);
    });
    noBtn.on('pointerdown', dismiss);
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
