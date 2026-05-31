import { BOSSES } from '../config';
import { shuffleBossOrder } from '../data/questionLoader';
import type { RunMode } from '../types';
import type { RunSave } from './runSave';

export interface Campaign {
  mode: RunMode;
  bossOrder: string[];
  floorsCleared: number;
  seed: number;
}

export function createCampaign(mode: RunMode, seed: number): Campaign {
  const rng = makeSeededRng(seed);
  const bossIds = BOSSES.map((b) => b.id);
  const bossOrder = shuffleBossOrder(bossIds, rng);
  return { mode, bossOrder, floorsCleared: 0, seed };
}

/**
 * Reconstruct a full Campaign from a persisted save (the resume path). Carries
 * `seed` through so a resumed demo re-picks the same questions via
 * demoRngForFloor. A legacy save predating the seed field can only be a normal
 * run — which ignores seed — so 1 is a safe placeholder there; isRunSave already
 * rejects a demo save that lacks one.
 */
export function campaignFromSave(save: RunSave): Campaign {
  return {
    mode: save.campaign.mode,
    bossOrder: [...save.campaign.bossOrder],
    floorsCleared: save.campaign.floorsCleared,
    seed: save.campaign.seed ?? 1,
  };
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

export function makeSeededRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * RNG for a demo fight: deterministic per (seed, floor) so each boss in a
 * scripted demo draws a stable-but-distinct question set.
 */
export function demoRngForFloor(seed: number, floor: number): () => number {
  return makeSeededRng(seed + floor);
}
