import { describe, it, expect } from 'vitest';
import { computeShakeIntensity, computeShakeDuration } from './shakeGrading';

describe('shakeGrading', () => {
  it('intensity scales with damage ratio, clamped to [0.004, 0.025]', () => {
    expect(computeShakeIntensity(0, 10)).toBe(0.004);
    expect(computeShakeIntensity(1, 10)).toBe(0.004);   // 0.004 floor
    expect(computeShakeIntensity(3, 10)).toBeCloseTo(0.012, 3);
    expect(computeShakeIntensity(10, 10)).toBe(0.025);  // 0.025 ceiling
    expect(computeShakeIntensity(100, 10)).toBe(0.025); // ceiling
  });

  it('duration scales with damage, clamped to [80, 240]', () => {
    expect(computeShakeDuration(1)).toBe(80);
    expect(computeShakeDuration(3)).toBe(90);
    expect(computeShakeDuration(8)).toBe(240);
    expect(computeShakeDuration(20)).toBe(240);
  });
});
