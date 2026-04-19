import { describe, it, expect } from 'vitest';
import {
  initCombat,
  resolveAnswer,
  isBossDefeated,
  isHeroDead,
} from './combat';
import type { Question } from '../types';

const dummyQuestion: Question = {
  id: 'q1',
  domain: 'd1',
  difficulty: 'easy',
  stem: 'Q',
  options: { A: 'a', B: 'b', C: 'c', D: 'd' },
  correct: 'B',
  explanation: 'e',
  source_note: 't.md',
};

describe('combat', () => {
  it('initializes combat state with given HP values', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    expect(state.heroHp).toBe(3);
    expect(state.bossHp).toBe(5);
    expect(state.pendingDamageMultiplier).toBe(1);
    expect(state.questionHistory).toEqual([]);
  });

  it('correct answer reduces boss HP by 1', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    const result = resolveAnswer(state, 'B');
    expect(result.wasCorrect).toBe(true);
    expect(result.damageDealt).toBe(1);
    expect(state.bossHp).toBe(4);
    expect(state.heroHp).toBe(3);
  });

  it('correct answer with Amplify (multiplier=2) deals 2 damage', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    state.pendingDamageMultiplier = 2;
    const result = resolveAnswer(state, 'B');
    expect(result.damageDealt).toBe(2);
    expect(state.bossHp).toBe(3);
    expect(state.pendingDamageMultiplier).toBe(1);
  });

  it('wrong answer reduces hero HP by 1 regardless of multiplier', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    state.pendingDamageMultiplier = 3;
    const result = resolveAnswer(state, 'A');
    expect(result.wasCorrect).toBe(false);
    expect(state.heroHp).toBe(2);
    expect(state.bossHp).toBe(5);
    expect(state.pendingDamageMultiplier).toBe(1);
  });

  it('wrong answer returns explanation for display', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    const result = resolveAnswer(state, 'A');
    expect(result.explanation).toBe('e');
    expect(result.correctAnswer).toBe('B');
  });

  it('question goes into history after resolution', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'B');
    expect(state.questionHistory).toHaveLength(1);
    expect(state.questionHistory[0]?.id).toBe('q1');
    expect(state.currentQuestion).toBeNull();
  });

  it('isBossDefeated reflects bossHp <= 0', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 1 });
    expect(isBossDefeated(state)).toBe(false);
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'B');
    expect(isBossDefeated(state)).toBe(true);
  });

  it('isHeroDead reflects heroHp <= 0', () => {
    const state = initCombat({ heroMaxHp: 1, bossMaxHp: 5 });
    expect(isHeroDead(state)).toBe(false);
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'A');
    expect(isHeroDead(state)).toBe(true);
  });
});
