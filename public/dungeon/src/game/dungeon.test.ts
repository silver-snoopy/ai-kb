import { describe, expect, it } from 'vitest';
import { BOSSES } from '../config';
import {
  advanceFloor,
  campaignFromSave,
  createCampaign,
  demoRngForFloor,
  isCampaignComplete,
  makeSeededRng,
} from './dungeon';
import type { RunSave } from './runSave';

function makeRunSave(campaign: Partial<RunSave['campaign']> = {}): RunSave {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    campaign: {
      bossOrder: ['a', 'b', 'c', 'd', 'e'],
      floorsCleared: 2,
      mode: 'first-run',
      seed: 4242,
      ...campaign,
    },
    spellbook: { echo: 1, 'study-the-tome': 1, memorize: 0, amplify: 0, doubleshot: 0 },
    heroHpCarryover: 2,
    inBoss: null,
  };
}

describe('dungeon', () => {
  it('creates a campaign with 5 bosses in random order', () => {
    const c = createCampaign('first-run', 42);
    expect(c.bossOrder).toHaveLength(5);
    const ids = BOSSES.map((b) => b.id).sort();
    expect([...c.bossOrder].sort()).toEqual(ids);
    expect(c.floorsCleared).toBe(0);
  });

  it('same seed → same order', () => {
    const c1 = createCampaign('first-run', 100);
    const c2 = createCampaign('first-run', 100);
    expect(c1.bossOrder).toEqual(c2.bossOrder);
  });

  it('advanceFloor increments floorsCleared', () => {
    const c = createCampaign('first-run', 1);
    advanceFloor(c);
    expect(c.floorsCleared).toBe(1);
  });

  it('isCampaignComplete when floorsCleared === 5', () => {
    const c = createCampaign('first-run', 1);
    expect(isCampaignComplete(c)).toBe(false);
    for (let i = 0; i < 5; i++) advanceFloor(c);
    expect(isCampaignComplete(c)).toBe(true);
  });
});

describe('campaignFromSave', () => {
  it('carries the seed through so a resumed demo re-picks identically', () => {
    const c = campaignFromSave(makeRunSave({ seed: 99 }));
    expect(c.seed).toBe(99);
  });

  it('reconstructs the full campaign (mode, bossOrder copy, floorsCleared)', () => {
    const save = makeRunSave({ bossOrder: ['x', 'y'], floorsCleared: 1, mode: 'ng-plus' });
    const c = campaignFromSave(save);
    expect(c).toEqual({ mode: 'ng-plus', bossOrder: ['x', 'y'], floorsCleared: 1, seed: 4242 });
    // bossOrder must be a copy — mutating the campaign must not touch the save.
    c.bossOrder.push('z');
    expect(save.campaign.bossOrder).toEqual(['x', 'y']);
  });

  it('falls back to a placeholder seed for a legacy save with none (normal runs ignore seed)', () => {
    const legacy = makeRunSave();
    delete (legacy.campaign as { seed?: number }).seed;
    expect(campaignFromSave(legacy).seed).toBe(1);
  });
});

describe('makeSeededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeSeededRng(99);
    const b = makeSeededRng(99);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('demoRngForFloor', () => {
  it('equals makeSeededRng(seed + floor)', () => {
    const direct = makeSeededRng(1234 + 3);
    const helper = demoRngForFloor(1234, 3);
    expect([helper(), helper()]).toEqual([direct(), direct()]);
  });

  it('produces a different stream per floor', () => {
    const f0 = demoRngForFloor(1234, 0);
    const f1 = demoRngForFloor(1234, 1);
    expect(f0()).not.toEqual(f1());
  });
});
