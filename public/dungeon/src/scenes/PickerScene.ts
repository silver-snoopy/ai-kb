import Phaser from 'phaser';
import { loadQuestionsJson } from '../data/questionLoader';
import { buildCardDescriptors, toExamSrc, type DungeonCard } from '../data/dungeonPicker';
import { loadSaveState, initSaveState, saveSaveState } from '../game/saveState';
import { fadeToScene } from '../ui/transitions';
import type { QuestionsJson } from '../types';

const REGISTRY_URL = '../exams/cca-f/verified/index.json';
const FALLBACK_URL = './data/questions.json';

export class PickerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PickerScene' });
  }

  async create(): Promise<void> {
    this.add.text(480, 80, 'Pick a study pool', {
      fontSize: '32px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 120, 'Each pool is a 60-question exam. Pick one to begin.', {
      fontSize: '14px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const status = this.add.text(480, 380, 'Loading verified exams…', {
      fontSize: '16px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const registry = await fetchJson<{ exams: Array<{ path: string; seed: number; source?: string; total?: number }> }>(REGISTRY_URL);
      const srcs = (registry.exams || []).map(e => toExamSrc(e.path));
      const files = await Promise.all(srcs.map(s => fetchJson(s).catch(() => null)));
      const examFiles: Record<string, unknown> = {};
      srcs.forEach((s, i) => { if (files[i]) examFiles[s] = files[i]; });
      const cards = buildCardDescriptors(
        registry,
        examFiles as Parameters<typeof buildCardDescriptors>[1],
      );

      if (cards.length === 0) {
        status.setText('No verified exams found — falling back to default pool…');
        await this.bootWithDefault();
        return;
      }

      status.destroy();
      this.renderCards(cards);
    } catch {
      status.setText('Could not load verified-exam registry — falling back to default pool…');
      await this.bootWithDefault();
    }
  }

  private renderCards(cards: DungeonCard[]): void {
    const cols = 2;
    const cardW = 380;
    const cardH = 120;
    const gapX = 40;
    const gapY = 20;
    const startX = (960 - (cols * cardW + (cols - 1) * gapX)) / 2 + cardW / 2;
    const startY = 180 + cardH / 2;

    cards.forEach((card, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const btn = this.add.rectangle(x, y, cardW, cardH, 0x1a1a2a)
        .setStrokeStyle(2, 0x4a4a6a)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStrokeStyle(2, 0x7c4dff));
      btn.on('pointerout', () => btn.setStrokeStyle(2, 0x4a4a6a));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        void this.pickAndBoot(card);
      });

      this.add.text(x - cardW / 2 + 16, y - cardH / 2 + 12, `Exam · seed ${card.seed}`, {
        fontSize: '18px',
        color: '#e0e0ea',
        fontFamily: 'monospace',
      });

      this.add.text(x + cardW / 2 - 16, y - cardH / 2 + 16, String(card.source).toUpperCase(), {
        fontSize: '10px',
        color: '#7c4dff',
        fontFamily: 'monospace',
      }).setOrigin(1, 0);

      const metaParts = [
        card.total ? `${card.total} Qs` : null,
        card.difficulty ?? null,
        card.scenarioSummary ?? null,
        card.composition ?? null,
      ].filter((v): v is string => Boolean(v));

      this.add.text(x - cardW / 2 + 16, y - cardH / 2 + 44, metaParts.join(' · '), {
        fontSize: '12px',
        color: '#a0a0b0',
        fontFamily: 'monospace',
        wordWrap: { width: cardW - 32 },
      });

      if (card.warnings.length > 0) {
        this.add.text(x - cardW / 2 + 16, y + cardH / 2 - 28, '⚠ ' + card.warnings.join('; '), {
          fontSize: '11px',
          color: '#e57373',
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 32 },
        });
      }

      this.add.text(x + cardW / 2 - 16, y + cardH / 2 - 16, 'Enter →', {
        fontSize: '11px',
        color: '#7c4dff',
        fontFamily: 'monospace',
      }).setOrigin(1, 1);
    });
  }

  private async pickAndBoot(card: DungeonCard): Promise<void> {
    this.add.rectangle(480, 600, 960, 80, 0x000000, 0.85);
    this.add.text(480, 600, `Loading exam seed ${card.seed}…`, {
      fontSize: '14px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const questions = await loadQuestionsJson(card.src);
      this.stashAndBoot(questions);
    } catch (e: unknown) {
      this.add.text(480, 640, `Failed to load: ${(e as Error).message} — using default pool`, {
        fontSize: '12px',
        color: '#e57373',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      await this.bootWithDefault();
    }
  }

  private async bootWithDefault(): Promise<void> {
    try {
      const questions = await loadQuestionsJson(FALLBACK_URL);
      this.stashAndBoot(questions);
    } catch (e: unknown) {
      this.add.text(480, 440, `ERROR: could not load any question pool — ${(e as Error).message}`, {
        fontSize: '14px',
        color: '#e57373',
        fontFamily: 'monospace',
        wordWrap: { width: 800 },
      }).setOrigin(0.5);
    }
  }

  private stashAndBoot(questions: QuestionsJson): void {
    this.registry.set('questions', questions);
    let saveState = loadSaveState(questions.cert_id);
    if (!saveState) {
      saveState = initSaveState(questions.cert_id);
      saveSaveState(saveState);
    }
    this.registry.set('saveState', saveState);
    this.time.delayedCall(400, () => fadeToScene(this, 'HubScene'));
  }
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return (await res.json()) as T;
}
