import type { Question, QuestionsJson, DomainData } from '../types';

// Shape of the raw JSON emitted by scripts/build-questions.mjs.
interface RawQuestion {
  id: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  'source-note': string;
}
interface RawDomainsJson {
  built_at: string;
  total: number;
  by_domain: Record<string, number>;
  domains: Record<string, { num: number; name: string; weight: number; color?: string }>;
  questions: RawQuestion[];
}

/**
 * Loads + normalizes the vault's questions.json into the shape declared in
 * src/types.ts. The raw file uses a flat top-level `questions` array with
 * hyphenated `source-note` keys; this function transforms it into the
 * domain-nested, snake_case-keyed QuestionsJson shape the game consumes.
 */
export async function loadQuestionsJson(url: string = './data/questions.json'): Promise<QuestionsJson> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load questions.json: ${res.status}`);
  const raw = (await res.json()) as RawDomainsJson;
  return normalize(raw);
}

function normalize(raw: RawDomainsJson): QuestionsJson {
  const questionsByDomain = new Map<string, Question[]>();
  for (const rq of raw.questions) {
    const q: Question = {
      id: rq.id,
      domain: rq.domain,
      difficulty: rq.difficulty,
      stem: rq.stem,
      options: rq.options,
      correct: rq.correct,
      explanation: rq.explanation,
      source_note: rq['source-note'],
    };
    const bucket = questionsByDomain.get(rq.domain);
    if (bucket) bucket.push(q);
    else questionsByDomain.set(rq.domain, [q]);
  }

  const domains: DomainData[] = Object.entries(raw.domains).map(([id, meta]) => ({
    id,
    name: meta.name,
    weight: meta.weight,
    questions: questionsByDomain.get(id) ?? [],
  }));

  return {
    generated_at: raw.built_at,
    cert_id: 'cca-f',
    cert_name: 'Claude Certified Architect \u2014 Foundations',
    total_questions: raw.total,
    domains,
  };
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
