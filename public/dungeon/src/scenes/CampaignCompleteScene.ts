import Phaser from 'phaser';
import { recordCampaignVictory, saveSaveState } from '../game/saveState';
import { clearActiveRun } from '../game/runSave';
import { downloadSessionLog } from '../game/sessionExport';
import type { RunMode, SaveStateV1, SessionLog } from '../types';
import { fadeIn, fadeToScene } from '../ui/transitions';

export class CampaignCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignCompleteScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x2d1b4e);
    fadeIn(this);

    const sessionLog: SessionLog = this.registry.get('sessionLog');
    const save: SaveStateV1 = this.registry.get('saveState');
    const mode: RunMode = sessionLog.mode;

    // Persist victory
    const nextSave = recordCampaignVictory(save, mode);
    saveSaveState(nextSave);
    this.registry.set('saveState', nextSave);

    // Defensive clear (BossFightScene's onFightEnd already clears on the
    // last-floor branch; this guards against edge cases like direct scene
    // navigation during dev / tests).
    clearActiveRun();

    this.add.text(480, 70, '\uD83D\uDCDC GOLDEN PARCHMENT', {
      fontSize: '44px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 130, `${modeLabelTitle(mode)} Complete`, {
      fontSize: '22px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (nextSave.title_earned && !save.title_earned) {
      this.add.text(480, 180, `You have earned the title: ${nextSave.title_earned}`, {
        fontSize: '18px', color: '#ffca28', fontFamily: 'monospace', fontStyle: 'italic',
      }).setOrigin(0.5);
    } else if (nextSave.title_earned) {
      this.add.text(480, 180, `Title: ${nextSave.title_earned}`, {
        fontSize: '16px', color: '#f5e4b3', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Score breakdown
    const total = sessionLog.total_correct + sessionLog.total_wrong;
    const pct = total === 0 ? 0 : Math.round((sessionLog.total_correct / total) * 100);

    const lines = [
      `Bosses defeated : ${sessionLog.bosses_defeated.length}`,
      `Correct answers : ${sessionLog.total_correct}`,
      `Wrong answers   : ${sessionLog.total_wrong}`,
      `Accuracy        : ${pct}%`,
      `Final hero HP   : ${sessionLog.final_hero_hp} / 3`,
      `Spells cast     : ${sessionLog.spells_cast.length}`,
    ];
    this.add.text(480, 280, lines.join('\n'), {
      fontSize: '16px', color: '#e0e0ea', fontFamily: 'monospace', align: 'left',
    }).setOrigin(0.5, 0);

    // New unlock notice
    const newUnlocks = nextSave.unlocked_spells.filter(s => !save.unlocked_spells.includes(s));
    if (newUnlocks.length > 0) {
      this.add.text(480, 470, `\u2728 New spell unlocked: ${newUnlocks.join(', ')}`, {
        fontSize: '16px', color: '#ffca28', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    if (!save.eternal_dungeon_unlocked && nextSave.eternal_dungeon_unlocked) {
      this.add.text(480, 500, '\uD83D\uDDDD Eternal Dungeon unlocked!', {
        fontSize: '16px', color: '#8bc34a', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Download session-log button (click-only; doesn't consume the "back" input)
    const dlBtn = this.add.rectangle(480, 540, 340, 40, 0x1b2d4e);
    dlBtn.setStrokeStyle(2, 0x6a7aa4);
    dlBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 540, '\u2B07 Download session log (JSON)', {
      fontSize: '15px', color: '#d0d0da', fontFamily: 'monospace',
    }).setOrigin(0.5);
    dlBtn.on('pointerdown', (_: unknown, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      downloadSessionLog(sessionLog);
    });

    this.add.text(480, 590, '(press Space / Enter to return to Hub)', {
      fontSize: '14px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const goHome = (): void => fadeToScene(this, 'HubScene');
    this.input.keyboard?.once('keydown-SPACE', goHome);
    this.input.keyboard?.once('keydown-ENTER', goHome);
  }
}

function modeLabelTitle(mode: RunMode): string {
  switch (mode) {
    case 'first-run': return 'First Run';
    case 'ng-plus': return 'NG+';
    case 'ng-plus-plus': return 'NG++';
    case 'ng-plus-plus-plus': return 'Eternal Dungeon';
  }
}
