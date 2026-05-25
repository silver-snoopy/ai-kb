import { describe, expect, it } from 'vitest';
import {
  OVERLAY_ABORT_FADE_MS,
  OVERLAY_FADE_IN_MS,
  OVERLAY_FADE_OUT_MS,
  OVERLAY_HOLD_MS,
  computeHoldMs,
} from './NarratorOverlay';

describe('NarratorOverlay constants', () => {
  it('exports fade + hold timings', () => {
    expect(OVERLAY_FADE_IN_MS).toBe(300);
    expect(OVERLAY_HOLD_MS).toBe(7500);
    expect(OVERLAY_FADE_OUT_MS).toBe(400);
    expect(OVERLAY_ABORT_FADE_MS).toBe(200);
  });

  it('computeHoldMs returns total display duration', () => {
    expect(computeHoldMs()).toBe(OVERLAY_FADE_IN_MS + OVERLAY_HOLD_MS + OVERLAY_FADE_OUT_MS);
    expect(computeHoldMs()).toBe(8200);
  });
});
