import { describe, it, expect } from 'vitest';
import { getTomeCardData, CODEX_SPELL_ORDER } from './tomeCardData';
import type { SpellId } from '../types';

describe('tomeCardData', () => {
  it('CODEX_SPELL_ORDER lists the 5 current spells in unlock-tier order', () => {
    expect(CODEX_SPELL_ORDER).toEqual([
      'echo',
      'study-the-tome',
      'memorize',
      'amplify',
      'doubleshot',
    ]);
  });

  it('unlocked card shows name, {tier · unlockedIn} subtitle, and full description', () => {
    const unlocked: SpellId[] = ['echo'];
    const card = getTomeCardData('echo', unlocked);
    expect(card.locked).toBe(false);
    expect(card.name).toBe('Echo');
    expect(card.subtitle).toBe('uncommon \u00B7 first-run');
    expect(card.body).toBe('Next question is a retake of a previous question from this fight.');
  });

  it('locked card silhouettes the name and shows the unlock-tier hint', () => {
    const unlocked: SpellId[] = ['echo']; // amplify is NOT unlocked
    const card = getTomeCardData('amplify', unlocked);
    expect(card.locked).toBe(true);
    expect(card.name).toBe('???????');
    expect(card.subtitle).toBe('locked \u00B7 ng-plus');
    expect(card.body).toBe('Clear NG+ to unveil this page.');
  });

  it('locked card for a first-run spell points at first-run clear', () => {
    const unlocked: SpellId[] = [];
    const card = getTomeCardData('echo', unlocked);
    expect(card.locked).toBe(true);
    expect(card.body).toBe('Clear the dungeon for the first time to unveil this page.');
  });

  it('locked card for a ng-plus-plus spell points at NG++', () => {
    const unlocked: SpellId[] = ['echo', 'amplify'];
    const card = getTomeCardData('doubleshot', unlocked);
    expect(card.locked).toBe(true);
    expect(card.body).toBe('Clear NG++ to unveil this page.');
  });

  it('all 5 spells render as unlocked when the full roster is granted', () => {
    const unlocked: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot'];
    for (const id of CODEX_SPELL_ORDER) {
      const card = getTomeCardData(id, unlocked);
      expect(card.locked).toBe(false);
    }
  });
});
