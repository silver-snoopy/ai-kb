import { describe, expect, it } from 'vitest';
import { BOSSES } from '../config';
import { darken, formatFloorLabel } from './bossHud';

describe('darken', () => {
  it('multiplies each channel and rounds', () => {
    // 0x4e=78 → 39 (0x27); 0x1b=27 → 14 (0x0e)
    expect(darken(0x4e4e1b, 0.5)).toBe(0x27270e);
  });
  it('factor 0 yields black', () => {
    expect(darken(0x4e4e1b, 0)).toBe(0x000000);
  });
  it('clamps channels at 255', () => {
    expect(darken(0xffffff, 2)).toBe(0xffffff);
  });
});

describe('formatFloorLabel', () => {
  it('shows floor (1-indexed) / total when a campaign exists', () => {
    const campaign = { floorsCleared: 0, bossOrder: ['a', 'b', 'c', 'd', 'e'] };
    expect(formatFloorLabel(campaign)).toBe('Floor 1/5');
  });
  it('uses the later floor number as the run advances', () => {
    const campaign = { floorsCleared: 3, bossOrder: ['a', 'b', 'c', 'd', 'e'] };
    expect(formatFloorLabel(campaign)).toBe('Floor 4/5');
  });
  it('is empty when there is no campaign (debug/isolated) — domain shown alone', () => {
    expect(formatFloorLabel(undefined)).toBe('');
  });
});

describe('boss domainShort', () => {
  it('every boss declares a non-empty domainShort', () => {
    for (const b of BOSSES) {
      expect(b.domainShort.length).toBeGreaterThan(0);
    }
  });
});
