import { BOSSES } from '../config';
import { shuffleBossOrder } from '../data/questionLoader';
import type { RunMode } from '../types';

export interface Campaign {
  mode: RunMode;
  bossOrder: string[];
  floorsCleared: number;
  seed: number;
}

export function createCampaign(mode: RunMode, seed: number): Campaign {
  const rng = makeSeededRng(seed);
  const bossIds = BOSSES.map(b => b.id);
  const bossOrder = shuffleBossOrder(bossIds, rng);
  return { mode, bossOrder, floorsCleared: 0, seed };
}

export function currentBossId(c: Campaign): string | null {
  if (c.floorsCleared >= c.bossOrder.length) return null;
  return c.bossOrder[c.floorsCleared] ?? null;
}

export function advanceFloor(c: Campaign): void {
  c.floorsCleared += 1;
}

export function isCampaignComplete(c: Campaign): boolean {
  return c.floorsCleared >= c.bossOrder.length;
}

function makeSeededRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
