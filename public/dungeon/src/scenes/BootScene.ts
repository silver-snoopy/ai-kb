import Phaser from 'phaser';
import { loadQuestionsJson } from '../data/questionLoader';
import type { QuestionsJson } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
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
