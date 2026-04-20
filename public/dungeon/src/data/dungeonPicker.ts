// public/dungeon/src/data/dungeonPicker.ts
// Pure-function helpers for the dungeon's exam-picker scene.
// Data shapes only — no Phaser imports. Safe to unit test via vitest.

export interface DungeonCard {
  src: string;
  seed: number | string;
  source: string;
  total: number | null;
  composition?: string;
  difficulty?: string;
  scenarioSummary?: string;
  warnings: string[];
}

interface RegistryEntry {
  path: string;
  seed: number | string;
  source?: string;
  total?: number;
}

interface RegistryJson {
  exams?: RegistryEntry[];
}

interface ExamMetadata {
  seed?: number | string;
  source?: string;
  composition?: string;
  difficulty_actual?: { easy: number; medium: number; hard: number };
  scenarios_kept?: unknown[];
  scenarios_dropped?: unknown[];
  coverage_warnings?: string[];
}

interface ExamFile {
  built_at?: string;
  total?: number;
  exam_metadata?: ExamMetadata;
}

/** Convert a repo-relative path from `verified/index.json` to a URL the dungeon can fetch.
 *  `public/exams/cca-f/verified/foo.json` → `../exams/cca-f/verified/foo.json`
 *  (Dungeon root is `public/dungeon/`; `..` climbs to `public/`.) */
export function toExamSrc(repoPath: string): string {
  if (typeof repoPath !== 'string' || repoPath.length === 0) {
    throw new Error(`toExamSrc: invalid path: ${String(repoPath)}`);
  }
  if (repoPath.startsWith('public/')) return '../' + repoPath.slice('public/'.length);
  return repoPath;
}

/** Merge registry entries with per-exam metadata into renderable card descriptors. */
export function buildCardDescriptors(
  registry: RegistryJson,
  examFiles: Record<string, ExamFile>,
): DungeonCard[] {
  const out: DungeonCard[] = [];
  for (const entry of registry.exams || []) {
    const src = toExamSrc(entry.path);
    const exam = examFiles[src];
    const meta = exam?.exam_metadata || {};
    const card: DungeonCard = {
      src,
      seed: (meta.seed ?? entry.seed) as number | string,
      source: meta.source ?? entry.source ?? 'unknown',
      total: exam?.total ?? entry.total ?? null,
      composition: meta.composition,
      warnings: Array.isArray(meta.coverage_warnings) ? meta.coverage_warnings : [],
    };
    if (meta.difficulty_actual) {
      const d = meta.difficulty_actual;
      card.difficulty = `E${d.easy}/M${d.medium}/H${d.hard}`;
    }
    if (Array.isArray(meta.scenarios_kept) && Array.isArray(meta.scenarios_dropped)) {
      card.scenarioSummary = `${meta.scenarios_kept.length} of ${meta.scenarios_kept.length + meta.scenarios_dropped.length} scenarios`;
    }
    out.push(card);
  }
  return out;
}
