import { describe, it, expect } from 'vitest';
import { createCampaign, advanceFloor, isCampaignComplete } from './dungeon';
import { BOSSES } from '../config';

describe('dungeon', () => {
  it('creates a campaign with 5 bosses in random order', () => {
    const c = createCampaign('first-run', 42);
    expect(c.bossOrder).toHaveLength(5);
    const ids = BOSSES.map(b => b.id).sort();
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
