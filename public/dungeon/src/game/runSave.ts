import type { RunMode, SpellId } from '../types';

const LS_KEY = 'stc:active-run';
const STALE_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface RunSave {
  version: 1;
  savedAt: string;
  campaign: { bossOrder: string[]; floorsCleared: number; mode: RunMode };
  spellbook: Record<SpellId, number>;
  heroHpCarryover: number;
  inBoss: {
    bossId: string;
    questionIds: string[];
    currentQuestionIdx: number;
    heroHp: number;
    bossHp: number;
    bossMaxHp: number;
    questionHistoryIds: string[];
  } | null;
}

export function isStale(savedAt: string, nowMs: number = Date.now()): boolean {
  const saved = Date.parse(savedAt);
  if (Number.isNaN(saved)) return true;
  return nowMs - saved > STALE_MS;
}

/**
 * Read the active run from localStorage. Returns null if:
 *   - key missing
 *   - JSON parse fails
 *   - version mismatch
 *   - stale (>48h)
 * Does NOT validate that the boss/question IDs still exist in the current
 * pool — callers do that after loading because they have the pool in hand.
 */
export function readActiveRun(now: number = Date.now()): RunSave | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRunSave(parsed)) return null;
  if (isStale(parsed.savedAt, now)) return null;
  return parsed;
}

export function writeActiveRun(save: Omit<RunSave, 'savedAt'>): void {
  const full: RunSave = { ...save, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(full));
  } catch {
    // quota / disabled localStorage — fail silent; resume won't be available
  }
}

export function clearActiveRun(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Given the current question pool and a list of saved question IDs (in
 * the pool order they were picked), rebuild the fight's question array.
 * Returns null if any ID is missing from the pool — the caller should
 * treat that as save corruption and clear.
 */
export function restoreQuestionPool<Q extends { id: string }>(
  savedIds: string[],
  pool: Q[],
): Q[] | null {
  const byId = new Map(pool.map(q => [q.id, q]));
  const out: Q[] = [];
  for (const id of savedIds) {
    const q = byId.get(id);
    if (!q) return null;
    out.push(q);
  }
  return out;
}

function isRunSave(v: unknown): v is RunSave {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o['version'] !== 1) return false;
  if (typeof o['savedAt'] !== 'string') return false;
  if (typeof o['heroHpCarryover'] !== 'number') return false;
  const c = o['campaign'];
  if (!c || typeof c !== 'object') return false;
  const cc = c as Record<string, unknown>;
  if (!Array.isArray(cc['bossOrder']) || !cc['bossOrder'].every(x => typeof x === 'string')) return false;
  if (typeof cc['floorsCleared'] !== 'number') return false;
  if (typeof cc['mode'] !== 'string') return false;
  const sb = o['spellbook'];
  if (!sb || typeof sb !== 'object') return false;
  if (o['inBoss'] !== null) {
    const b = o['inBoss'];
    if (!b || typeof b !== 'object') return false;
    const bb = b as Record<string, unknown>;
    if (typeof bb['bossId'] !== 'string') return false;
    if (!Array.isArray(bb['questionIds']) || !bb['questionIds'].every(x => typeof x === 'string')) return false;
    if (typeof bb['currentQuestionIdx'] !== 'number') return false;
    if (typeof bb['heroHp'] !== 'number') return false;
    if (typeof bb['bossHp'] !== 'number') return false;
    if (typeof bb['bossMaxHp'] !== 'number') return false;
    if (!Array.isArray(bb['questionHistoryIds']) || !bb['questionHistoryIds'].every(x => typeof x === 'string')) return false;
  }
  return true;
}
