import type { Bank, Question } from '../types';

/**
 * Loads the unified question bank (public/exams/cca-f/bank.json, surfaced to
 * the dungeon at ./data/bank.json via CI overlay or committed fallback for
 * local dev). The bank is already in the flat shape the game needs — no
 * normalization required; we just validate and pass through.
 *
 * See: docs/superpowers/specs/2026-04-20-unified-question-bank-design.md §A
 */
export async function loadBank(url: string = './data/bank.json'): Promise<Bank> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load bank.json: ${res.status}`);
  const bank = (await res.json()) as Bank;
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    throw new Error(`${url}: expected non-empty questions array`);
  }
  if (!bank.domains || !bank.scenarios) {
    throw new Error(`${url}: missing domains or scenarios metadata`);
  }
  return bank;
}

/**
 * Filter the bank's questions to a single domain. Used by BossFightScene.init
 * to scope the per-boss pool.
 */
export function questionsForDomain(bank: Bank, domain: string): Question[] {
  return bank.questions.filter(q => q.domain === domain);
}

/**
 * Pick N questions from a pool for a boss fight.
 * Difficulty tilt: first half weighted toward easy/medium, second half toward medium/hard.
 * Uses provided rng() -> [0,1) for determinism in tests.
 */
export function pickQuestionsForFight(
  pool: Question[],
  n: number,
  rng: () => number = Math.random,
): Question[] {
  if (pool.length === 0) {
    throw new Error(`pickQuestionsForFight: pool is empty; cannot pick ${n} questions`);
  }
  if (pool.length < n) {
    const padded: Question[] = [];
    while (padded.length < n) padded.push(...pool);
    pool = padded.slice(0, Math.max(n, pool.length));
  }

  const byDifficulty = {
    easy: pool.filter(q => q.difficulty === 'easy'),
    medium: pool.filter(q => q.difficulty === 'medium'),
    hard: pool.filter(q => q.difficulty === 'hard'),
  };

  const firstHalfCount = Math.ceil(n / 2);
  const secondHalfCount = n - firstHalfCount;

  const firstPool = [...byDifficulty.easy, ...byDifficulty.medium, ...byDifficulty.hard];
  const secondPool = [...byDifficulty.medium, ...byDifficulty.hard, ...byDifficulty.easy];

  const picks: Question[] = [];
  const usedIds = new Set<string>();

  function pickFromPool(pool: Question[], count: number): Question[] {
    const out: Question[] = [];
    const shuffled = shuffle(pool.filter(q => !usedIds.has(q.id)), rng);
    for (const q of shuffled) {
      if (out.length >= count) break;
      out.push(q);
      usedIds.add(q.id);
    }
    if (out.length < count) {
      const fallback = shuffle(pool, rng);
      for (const q of fallback) {
        if (out.length >= count) break;
        out.push(q);
      }
    }
    return out;
  }

  picks.push(...pickFromPool(firstPool, firstHalfCount));
  picks.push(...pickFromPool(secondPool, secondHalfCount));

  return picks;
}

export function shuffleBossOrder(bossIds: string[], rng: () => number = Math.random): string[] {
  return shuffle(bossIds, rng);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
