import { describe, expect, it } from 'vitest';
import { STAGGER_KNOCK_MS, STAGGER_PX, STAGGER_RECOVER_MS } from './staggerBack';

describe('staggerBack', () => {
  it('exports expected timing constants', () => {
    expect(STAGGER_PX).toBe(12);
    expect(STAGGER_KNOCK_MS).toBe(120);
    expect(STAGGER_RECOVER_MS).toBe(200);
  });
});
