import { describe, it, expect } from 'vitest';
import { computeHitStopMs } from './hitStop';

describe('hitStop', () => {
  it('clamps duration to [40, 150] ms', () => {
    expect(computeHitStopMs(0)).toBe(40);
    expect(computeHitStopMs(1)).toBe(40);     // sqrt(1)*25 = 25 → clamped to 40
    expect(computeHitStopMs(4)).toBe(50);     // sqrt(4)*25 = 50
    expect(computeHitStopMs(9)).toBe(75);     // sqrt(9)*25 = 75
    expect(computeHitStopMs(25)).toBe(125);   // sqrt(25)*25 = 125
    expect(computeHitStopMs(100)).toBe(150);  // sqrt(100)*25 = 250 → clamped to 150
  });

  it('returns 40 for wrong-answer fixed hero damage', () => {
    expect(computeHitStopMs(1)).toBe(40);
  });
});
