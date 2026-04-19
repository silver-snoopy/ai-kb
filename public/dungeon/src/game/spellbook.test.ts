import { describe, it, expect } from 'vitest';
import { createSpellbook, castSpell, canCast } from './spellbook';
import type { CombatState } from '../types';

function dummyState(): CombatState {
  return {
    heroHp: 3, heroMaxHp: 3,
    bossHp: 5, bossMaxHp: 5,
    currentQuestion: null,
    questionHistory: [],
    pendingDamageMultiplier: 1,
    pendingPrimer: null,
    pendingRetake: false,
  };
}

describe('spellbook', () => {
  it('initializes first-run spellbook with 1 charge each of 3 spells', () => {
    const book = createSpellbook('first-run');
    expect(book.echo).toBe(1);
    expect(book['study-the-tome']).toBe(1);
    expect(book.memorize).toBe(1);
    expect(book.amplify).toBe(0);
    expect(book.doubleshot).toBe(0);
  });

  it('ng-plus includes amplify', () => {
    const book = createSpellbook('ng-plus');
    expect(book.amplify).toBe(1);
  });

  it('canCast is true when charges > 0', () => {
    const book = createSpellbook('first-run');
    expect(canCast(book, 'echo')).toBe(true);
    expect(canCast(book, 'amplify')).toBe(false);
  });

  it('amplify cast sets pendingDamageMultiplier to 2', () => {
    const book = createSpellbook('ng-plus');
    const state = dummyState();
    castSpell('amplify', book, state);
    expect(state.pendingDamageMultiplier).toBe(2);
    expect(book.amplify).toBe(0);
  });

  it('echo cast sets pendingRetake flag', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    castSpell('echo', book, state);
    expect(state.pendingRetake).toBe(true);
    expect(book.echo).toBe(0);
  });

  it('study-the-tome sets pendingPrimer (placeholder text)', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    castSpell('study-the-tome', book, state);
    expect(state.pendingPrimer).toBeTruthy();
    expect(book['study-the-tome']).toBe(0);
  });

  it('casting a spell with 0 charges throws', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    expect(() => castSpell('amplify', book, state)).toThrow(/no charges/i);
  });

  it('wrong answer does not cost extra HP even with amplify queued', () => {
    const book = createSpellbook('ng-plus');
    const state = dummyState();
    castSpell('amplify', book, state);
    expect(state.pendingDamageMultiplier).toBe(2);
  });
});
