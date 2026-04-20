import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readActiveRun,
  writeActiveRun,
  clearActiveRun,
  isStale,
  restoreQuestionPool,
  type RunSave,
} from './runSave';

function makeSave(overrides: Partial<RunSave> = {}): RunSave {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    campaign: { bossOrder: ['a', 'b', 'c', 'd', 'e'], floorsCleared: 2, mode: 'first-run' },
    spellbook: { echo: 1, 'study-the-tome': 1, memorize: 0, amplify: 0, doubleshot: 0, focus: 0 },
    heroHpCarryover: 2,
    inBoss: {
      bossId: 'c',
      questionIds: ['q1', 'q2', 'q3'],
      currentQuestionIdx: 1,
      heroHp: 2,
      bossHp: 4,
      bossMaxHp: 5,
      questionHistoryIds: ['q1'],
    },
    ...overrides,
  };
}

describe('runSave — storage layer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a save through writeActiveRun + readActiveRun', () => {
    const save = makeSave();
    writeActiveRun({
      version: save.version,
      campaign: save.campaign,
      spellbook: save.spellbook,
      heroHpCarryover: save.heroHpCarryover,
      inBoss: save.inBoss,
    });
    const read = readActiveRun();
    expect(read?.campaign.floorsCleared).toBe(2);
    expect(read?.inBoss?.bossId).toBe('c');
    expect(read?.inBoss?.questionIds).toEqual(['q1', 'q2', 'q3']);
  });

  it('returns null when no save exists', () => {
    expect(readActiveRun()).toBeNull();
  });

  it('returns null when JSON is corrupted', () => {
    localStorage.setItem('stc:active-run', '{not json');
    expect(readActiveRun()).toBeNull();
  });

  it('returns null when version mismatches', () => {
    const save = makeSave();
    localStorage.setItem('stc:active-run', JSON.stringify({ ...save, version: 99 }));
    expect(readActiveRun()).toBeNull();
  });

  it('returns null when save is stale (>48h)', () => {
    const sixtyHoursAgo = new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString();
    const save = makeSave({ savedAt: sixtyHoursAgo });
    localStorage.setItem('stc:active-run', JSON.stringify(save));
    expect(readActiveRun()).toBeNull();
  });

  it('clearActiveRun removes the key', () => {
    writeActiveRun(makeSave());
    clearActiveRun();
    expect(readActiveRun()).toBeNull();
  });

  it('tolerates localStorage.getItem throwing (incognito Safari etc.)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readActiveRun()).toBeNull();
    spy.mockRestore();
  });
});

describe('isStale', () => {
  it('is false for a savedAt 1 hour ago', () => {
    expect(isStale(new Date(Date.now() - 60 * 60 * 1000).toISOString())).toBe(false);
  });

  it('is true for a savedAt 49 hours ago', () => {
    expect(isStale(new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString())).toBe(true);
  });

  it('is true for an unparseable savedAt', () => {
    expect(isStale('not a date')).toBe(true);
  });
});

describe('restoreQuestionPool', () => {
  const pool = [
    { id: 'q1', stem: 'a' },
    { id: 'q2', stem: 'b' },
    { id: 'q3', stem: 'c' },
  ];

  it('rebuilds a fight pool preserving saved order', () => {
    expect(restoreQuestionPool(['q3', 'q1', 'q2'], pool)).toEqual([
      { id: 'q3', stem: 'c' },
      { id: 'q1', stem: 'a' },
      { id: 'q2', stem: 'b' },
    ]);
  });

  it('returns null if any saved ID is not in the pool', () => {
    expect(restoreQuestionPool(['q1', 'q-missing'], pool)).toBeNull();
  });

  it('returns an empty array for empty input', () => {
    expect(restoreQuestionPool([], pool)).toEqual([]);
  });
});
