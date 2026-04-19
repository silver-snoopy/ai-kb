import { describe, it, expect } from 'vitest';
import { LinePool } from './linePool';
import type { NarratorLine } from './types';

const L = (text: string, trigger: NarratorLine['trigger'], bossId?: NarratorLine['bossId']): NarratorLine =>
  ({ text, trigger, bossId });

describe('LinePool', () => {
  it('returns a line matching the trigger', () => {
    const pool = new LinePool([L('A', 'battle-start', 'orchestrator'), L('B', 'phase-66', 'orchestrator')]);
    expect(pool.pick('battle-start', 'orchestrator')).toBe('A');
  });

  it('prefers boss-specific over generic when both exist', () => {
    const pool = new LinePool([L('generic', 'filler'), L('specific', 'battle-start', 'orchestrator')]);
    expect(pool.pick('battle-start', 'orchestrator')).toBe('specific');
  });

  it('falls back to generic when no boss-specific exists', () => {
    const pool = new LinePool([L('A', 'spell-cast'), L('B', 'spell-cast')]);
    const picked = pool.pick('spell-cast', 'orchestrator');
    expect(['A', 'B']).toContain(picked);
  });

  it('last-N exclusion: does not repeat within last 3 picks', () => {
    const lines = ['A', 'B', 'C', 'D'].map(t => L(t, 'filler'));
    const pool = new LinePool(lines);
    const picks = Array.from({ length: 4 }, () => pool.pick('filler'));
    // first 3 picks must all be distinct; 4th can match the 1st
    const [a, b, c] = picks;
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('resets exclusion window when all lines filtered out', () => {
    const pool = new LinePool([L('only', 'filler')]);
    const picks = Array.from({ length: 5 }, () => pool.pick('filler'));
    expect(picks.every(p => p === 'only')).toBe(true);
  });

  it('falls back to filler when pool truly empty for trigger+boss', () => {
    const pool = new LinePool([L('generic-filler', 'filler')]);
    const picked = pool.pick('spell-cast', 'orchestrator');
    expect(picked).toBe('generic-filler');
  });

  it('returns emergency hardcoded line if everything is empty', () => {
    const pool = new LinePool([]);
    const picked = pool.pick('filler');
    expect(picked).toBe('The chamber holds its breath.');
  });
});
