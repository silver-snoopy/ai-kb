import { describe, it, expect } from 'vitest';
import { pickQuestionsForFight, shuffleBossOrder } from './questionLoader';
import type { Question } from '../types';

function makeQ(id: string, difficulty: 'easy' | 'medium' | 'hard'): Question {
  return {
    id, domain: 'd1', difficulty,
    stem: 'stem', options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correct: 'A', explanation: 'e', source_note: 't.md',
  };
}

describe('questionLoader', () => {
  it('picks N questions, easier first then harder', () => {
    const pool: Question[] = [
      makeQ('e1', 'easy'), makeQ('e2', 'easy'),
      makeQ('m1', 'medium'), makeQ('m2', 'medium'),
      makeQ('h1', 'hard'), makeQ('h2', 'hard'),
    ];
    const picks = pickQuestionsForFight(pool, 6, seeded(42));
    expect(picks).toHaveLength(6);
    const firstHalfDifficulties = picks.slice(0, 3).map(q => q.difficulty);
    const easyMediumCount = firstHalfDifficulties.filter(d => d === 'easy' || d === 'medium').length;
    expect(easyMediumCount).toBeGreaterThanOrEqual(2);
  });

  it('shuffles boss order deterministically given seed', () => {
    const bosses = ['a', 'b', 'c', 'd', 'e'];
    const shuffle1 = shuffleBossOrder(bosses, seeded(123));
    const shuffle2 = shuffleBossOrder(bosses, seeded(123));
    expect(shuffle1).toEqual(shuffle2);
    expect(shuffle1.sort()).toEqual([...bosses].sort());
  });

  it('different seeds produce different orders (with overwhelming probability)', () => {
    const bosses = ['a', 'b', 'c', 'd', 'e'];
    const s1 = shuffleBossOrder(bosses, seeded(1));
    const s2 = shuffleBossOrder(bosses, seeded(2));
    expect(s1.join('')).not.toBe(s2.join(''));
  });
});

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
