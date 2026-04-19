import Phaser from 'phaser';
import { loadQuestionsJson } from '../data/questionLoader';
import { loadSaveState, initSaveState, saveSaveState } from '../game/saveState';
import type { QuestionsJson } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Sprite assets
    this.load.image('hero', 'assets/sprites/hero.png');
    this.load.image('boss-the-orchestrator', 'assets/sprites/boss-orchestrator.png');
    this.load.image('boss-the-compiler-king', 'assets/sprites/boss-compiler-king.png');
    this.load.image('boss-the-grammarian', 'assets/sprites/boss-grammarian.png');
    this.load.image('boss-the-tool-smith', 'assets/sprites/boss-tool-smith.png');
    this.load.image('boss-the-memory-kraken', 'assets/sprites/boss-memory-kraken.png');
    this.load.image('ui-panel-brown', 'assets/ui/panel-brown.png');

    // Audio assets
    this.load.audio('sfx-hit-boss', 'assets/audio/sfx-hit-boss.ogg');
    this.load.audio('sfx-hit-hero', 'assets/audio/sfx-hit-hero.ogg');
    this.load.audio('sfx-spell', 'assets/audio/sfx-spell.ogg');
    this.load.audio('sfx-victory', 'assets/audio/sfx-victory.ogg');
    this.load.audio('sfx-death', 'assets/audio/sfx-death.ogg');

    // Progress indicator
    const progressText = this.add.text(480, 380, 'Loading assets...', {
      fontSize: '16px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Simple progress bar
    const barBg = this.add.rectangle(480, 410, 400, 12, 0x2a2a3a);
    const barFill = this.add.rectangle(280, 410, 0, 10, 0x7c4dff);
    barBg.setStrokeStyle(1, 0x4a4a6a);

    this.load.on('progress', (value: number) => {
      barFill.setPosition(280 + (value * 400) / 2, 410);
      barFill.setSize(value * 400, 10);
      progressText.setText(`Loading assets... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressText.setText('');
      barBg.setVisible(false);
      barFill.setVisible(false);
    });
  }

  async create(): Promise<void> {
    this.add.text(480, 280, 'Slay the Cert', {
      fontSize: '48px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 340, 'Loading questions...', {
      fontSize: '20px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const questions: QuestionsJson = await loadQuestionsJson();
      this.registry.set('questions', questions);

      const certId = questions.cert_id;
      let saveState = loadSaveState(certId);
      if (!saveState) {
        saveState = initSaveState(certId);
        saveSaveState(saveState);
      }
      this.registry.set('saveState', saveState);

      this.add.text(480, 400, `${questions.total_questions} questions loaded`, {
        fontSize: '16px',
        color: '#8bc34a',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      this.time.delayedCall(1000, () => {
        this.scene.start('HubScene');
      });
    } catch (e: unknown) {
      this.add.text(480, 400, `ERROR: ${(e as Error).message}`, {
        fontSize: '16px',
        color: '#e57373',
        fontFamily: 'monospace',
        wordWrap: { width: 800 },
      }).setOrigin(0.5);
    }
  }
}
