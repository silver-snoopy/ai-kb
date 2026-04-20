import Phaser from 'phaser';
import type { SaveStateV1 } from '../types';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { attachRectHover } from '../ui/buttonHover';
import { CODEX_SPELL_ORDER, getTomeCardData } from './tomeCardData';

const CARD_WIDTH = 400;
const CARD_HEIGHT = 160;
const COL_X = [100, 520] as const; // left/right card origins (top-left)
const ROW_Y = [160, 340, 520] as const; // top edges of each row

export class TomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TomeScene' });
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setBackgroundColor(0x0a0a14);

    // Title
    this.add.text(480, 60, '\uD83D\uDCD6 The Archmage\u2019s Codex', {
      fontSize: '28px', color: '#ffca28', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const save: SaveStateV1 = this.registry.get('saveState');
    const unlocked = save?.unlocked_spells ?? [];

    CODEX_SPELL_ORDER.forEach((spellId, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = COL_X[col]!;
      const y = ROW_Y[row]!;
      this.renderCard(x, y, spellId, unlocked);
    });

    // Back button \u2014 parked in the empty sixth card slot (row 3, col 2).
    // The empty slot's center is at (520 + CARD_WIDTH/2, 520 + CARD_HEIGHT/2)
    // = (720, 600). Centering the back button there keeps visual balance
    // and avoids overlapping the Doubleshot card at the bottom-left.
    const backBtn = this.add.rectangle(720, 600, 200, 44, 0x2d1b4e);
    backBtn.setStrokeStyle(2, 0x8b7cc4);
    backBtn.setInteractive({ useHandCursor: true });
    attachRectHover(backBtn,
      { fill: 0x2d1b4e, stroke: 0x8b7cc4 },
      { fill: 0x4a2d7a, stroke: 0xc4a0ff },
    );
    this.add.text(720, 600, '\u2190 Back', {
      fontSize: '15px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    backBtn.on('pointerdown', () => fadeToScene(this, 'HubScene', {}));
    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'HubScene', {}));
  }

  private renderCard(
    originX: number,
    originY: number,
    spellId: typeof CODEX_SPELL_ORDER[number],
    unlocked: readonly typeof CODEX_SPELL_ORDER[number][],
  ): void {
    const data = getTomeCardData(spellId, unlocked);
    const alpha = data.locked ? 0.6 : 1;

    // Panel — anchored top-left at (originX, originY)
    const panel = this.add.rectangle(
      originX + CARD_WIDTH / 2,
      originY + CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      0x1a1a2a,
    );
    panel.setStrokeStyle(1, 0xffca28);
    panel.setAlpha(alpha);

    // Name (top-left inside 16px padding)
    this.add.text(originX + 16, originY + 16, data.name, {
      fontSize: '20px', color: '#ffca28', fontFamily: 'monospace', fontStyle: 'bold',
    }).setAlpha(alpha);

    // Subtitle
    this.add.text(originX + 16, originY + 44, data.subtitle, {
      fontSize: '11px', color: '#808090', fontFamily: 'monospace',
    }).setAlpha(alpha);

    // Body (wrapped)
    this.add.text(originX + 16, originY + 68, data.body, {
      fontSize: '13px', color: '#d0d0da', fontFamily: 'monospace',
      wordWrap: { width: CARD_WIDTH - 32, useAdvancedWrap: true },
    }).setAlpha(alpha);
  }
}
