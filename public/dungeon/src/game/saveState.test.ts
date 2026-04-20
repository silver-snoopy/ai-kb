import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSaveState,
  loadSaveState,
  saveSaveState,
  recordCampaignVictory,
  deleteSaveState,
  STORAGE_KEY_PREFIX,
} from './saveState';

describe('saveState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initSaveState returns fresh state with first-run spells unlocked', () => {
    const s = initSaveState('cca-f');
    expect(s.version).toBe(1);
    expect(s.cert_id).toBe('cca-f');
    expect(s.current_campaign).toBeNull();
    expect(s.unlocked_spells).toEqual(['echo', 'study-the-tome', 'memorize']);
    expect(s.bosses_defeated_ever).toEqual([]);
    expect(s.parchment_earned).toBe(false);
    expect(s.eternal_dungeon_unlocked).toBe(false);
    expect(s.title_earned).toBeNull();
  });

  it('loadSaveState returns null when none exists', () => {
    expect(loadSaveState('cca-f')).toBeNull();
  });

  it('saveSaveState + loadSaveState round-trip preserves all fields', () => {
    const s = initSaveState('cca-f');
    s.parchment_earned = true;
    s.title_earned = 'Archmage';
    saveSaveState(s);
    const loaded = loadSaveState('cca-f');
    expect(loaded).toEqual(s);
  });

  it('loadSaveState returns null on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cca-f', '{not valid json');
    expect(loadSaveState('cca-f')).toBeNull();
  });

  it('loadSaveState returns null on unknown version', () => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cca-f', JSON.stringify({ version: 99, cert_id: 'cca-f' }));
    expect(loadSaveState('cca-f')).toBeNull();
  });

  it('recordCampaignVictory on first-run sets parchment + unlocks eternal + amplify', () => {
    const s = initSaveState('cca-f');
    const v = recordCampaignVictory(s, 'first-run');
    expect(v.parchment_earned).toBe(true);
    expect(v.eternal_dungeon_unlocked).toBe(true);
    expect(v.title_earned).toBe('Archmage');
    expect(v.unlocked_spells).toContain('amplify');
    expect(v.current_campaign).toBeNull();
  });

  it('recordCampaignVictory does not mutate input', () => {
    const s = initSaveState('cca-f');
    const before = JSON.stringify(s);
    recordCampaignVictory(s, 'first-run');
    expect(JSON.stringify(s)).toBe(before);
  });

  it('recordCampaignVictory on ng-plus adds doubleshot (idempotent on spells)', () => {
    let s = initSaveState('cca-f');
    s = recordCampaignVictory(s, 'first-run');
    const v = recordCampaignVictory(s, 'ng-plus');
    expect(v.unlocked_spells).toContain('doubleshot');
    // amplify was already unlocked; don't duplicate
    expect(v.unlocked_spells.filter(x => x === 'amplify')).toHaveLength(1);
  });

  it('recordCampaignVictory on ng-plus-plus adds no new spell (Focus removed 2026-04-20)', () => {
    let s = initSaveState('cca-f');
    s = recordCampaignVictory(s, 'first-run');
    s = recordCampaignVictory(s, 'ng-plus');
    const before = s.unlocked_spells.length;
    const v = recordCampaignVictory(s, 'ng-plus-plus');
    expect(v.unlocked_spells.length).toBe(before);
  });

  it('recordCampaignVictory on ng-plus-plus-plus (terminal) adds no new spell', () => {
    let s = initSaveState('cca-f');
    s = recordCampaignVictory(s, 'first-run');
    s = recordCampaignVictory(s, 'ng-plus');
    s = recordCampaignVictory(s, 'ng-plus-plus');
    const before = s.unlocked_spells.length;
    const v = recordCampaignVictory(s, 'ng-plus-plus-plus');
    expect(v.unlocked_spells.length).toBe(before);
  });

  it('loadSaveState filters stale spell ids (e.g. focus) out of unlocked_spells', () => {
    // Simulate an old save on disk that was written before the Focus spell
    // was removed. The loader must strip the stale id so downstream code
    // doesn't see a value outside the narrowed SpellId union.
    const stale = {
      version: 1,
      cert_id: 'cca-f',
      current_campaign: null,
      unlocked_spells: ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'],
      bosses_defeated_ever: [],
      parchment_earned: true,
      eternal_dungeon_unlocked: true,
      title_earned: 'Archmage',
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cca-f', JSON.stringify(stale));
    const loaded = loadSaveState('cca-f');
    expect(loaded).not.toBeNull();
    expect(loaded!.unlocked_spells).not.toContain('focus');
    expect(loaded!.unlocked_spells).toEqual(['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot']);
  });

  it('deleteSaveState removes the entry', () => {
    const s = initSaveState('cca-f');
    saveSaveState(s);
    deleteSaveState('cca-f');
    expect(loadSaveState('cca-f')).toBeNull();
  });
});
