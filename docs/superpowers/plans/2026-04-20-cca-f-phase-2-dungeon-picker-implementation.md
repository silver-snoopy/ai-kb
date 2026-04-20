# CCA-F Phase 2 — Dungeon Picker Implementation Plan (Plan 4 of 5)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pick-an-exam-pool screen between the dungeon's asset-loading boot and the Hub scene. Lets the player choose which verified exam backs the run — same verified pool the practice picker consumes. Defers metadata-driven stage balancing to a later plan (this is MVP polish on what already works).

**Architecture:** New `PickerScene` between `BootScene` and `HubScene`. `BootScene` keeps its asset-load responsibility; moves the `loadQuestionsJson()` call out to `PickerScene` so the picker decides which URL to load. Pure-function data helpers (`dungeonPicker.ts`) are unit-tested via vitest; the Phaser scene wiring is integration-tested via Playwright end-to-end.

**Tech Stack:** Phaser 3.90.0, TypeScript, Vite, Vitest (existing dungeon toolchain). No new deps.

**Spec:** [docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md](../specs/2026-04-20-cca-f-exam-integration-design.md) §7.

---

## File structure

| Path | New/Modify | Responsibility |
|---|---|---|
| `public/dungeon/src/data/dungeonPicker.ts` | Create | Pure-function data helpers: fetch+parse registry, build card descriptors |
| `public/dungeon/src/data/dungeonPicker.test.ts` | Create | Vitest unit tests for the pure helpers |
| `public/dungeon/src/scenes/PickerScene.ts` | Create | Phaser scene rendering card buttons + click handling + exam load |
| `public/dungeon/src/scenes/BootScene.ts` | Modify | Remove question-loading logic; fade to PickerScene instead of HubScene |
| `public/dungeon/src/main.ts` | Modify | Register PickerScene in scene array (between Boot and Hub) |

---

## Discovered context (verified from reading the code)

- `public/dungeon/src/main.ts` has scene array: `[BootScene, HubScene, BossFightScene, InterstitialScene, CampaignCompleteScene]`.
- `BootScene.ts:75` currently calls `loadQuestionsJson()` with the default `./data/questions.json`, stashes the result in `this.registry.set('questions', ...)`, initializes save-state, fades to `HubScene` after 1s.
- `loadQuestionsJson(url?)` at [questionLoader.ts:28](public/dungeon/src/data/questionLoader.ts#L28) already accepts a URL parameter — no changes needed there.
- Tests use `vitest run`; existing minimal test at `scenes/bossFightEvents.test.ts`. No existing fixture for `verified/index.json` in the dungeon dir (it lives in the top-level `public/exams/cca-f/verified/`).
- The dungeon's own package.json has `build:questions` script that points at the top-level `scripts/build-questions.mjs` — so the build already reaches outside its own subtree. Cross-dir fetches at runtime work similarly: from deployed `/ai-kb/dungeon/`, fetch `../exams/cca-f/verified/index.json`.

---

## URL strategy

- **In dev** (Vite `npm run dev` serves from `public/dungeon/`): `../exams/cca-f/verified/index.json` would resolve above the Vite root. Solution: for dev, allow a fallback default, OR configure Vite to serve from `public/` root. Simpler: fetch with `../exams/...` and catch any 404 by falling back to the default `./data/questions.json` pool so the dev experience survives.
- **In prod** (GitHub Pages at `/ai-kb/dungeon/`): `../exams/cca-f/verified/index.json` resolves to `/ai-kb/exams/cca-f/verified/index.json` — which is exactly where Plan 1 put them.

The picker MUST degrade gracefully: if `verified/index.json` is unreachable, auto-pick the default pool so the game still boots.

---

## Task 1: Pure-function data helpers (TDD)

**Files:**
- Create: `public/dungeon/src/data/dungeonPicker.ts` (implementation)
- Create: `public/dungeon/src/data/dungeonPicker.test.ts` (vitest tests)

**Exports:**
- `toExamSrc(registryPath: string): string` — path transform (`public/exams/cca-f/verified/foo.json` → `../exams/cca-f/verified/foo.json` relative to the dungeon root).
- `buildCardDescriptors(registry, examFiles): DungeonCard[]` — merge registry + per-exam metadata into renderable cards with `{src, seed, source, total, composition?, difficulty?, scenarioSummary?, warnings}` (same shape as the practice picker for consistency).

**DungeonCard type** (export from dungeonPicker.ts):

```typescript
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
```

### Steps

- [ ] **Step 1.1: Write the failing test file** `public/dungeon/src/data/dungeonPicker.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { toExamSrc, buildCardDescriptors } from './dungeonPicker';

describe('toExamSrc', () => {
  it('converts repo-relative path to dungeon-relative src', () => {
    expect(toExamSrc('public/exams/cca-f/verified/certsafari-seed42.json'))
      .toBe('../exams/cca-f/verified/certsafari-seed42.json');
  });

  it('leaves already-dungeon-relative paths alone', () => {
    expect(toExamSrc('../exams/foo.json')).toBe('../exams/foo.json');
  });

  it('throws on invalid input', () => {
    expect(() => toExamSrc('')).toThrow(/path/i);
    expect(() => toExamSrc(null as unknown as string)).toThrow(/path/i);
  });
});

describe('buildCardDescriptors', () => {
  it('merges registry entries with exam-file metadata', () => {
    const registry = {
      exams: [
        { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
      ],
    };
    const examFiles = {
      '../exams/cca-f/verified/certsafari-seed42.json': {
        built_at: '2026-04-20T10:00:00Z',
        total: 60,
        exam_metadata: {
          seed: 42,
          source: 'certsafari-curated',
          composition: 'certsafari-mixed',
          coverage_warnings: [],
        },
      },
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards).toHaveLength(1);
    expect(cards[0].src).toBe('../exams/cca-f/verified/certsafari-seed42.json');
    expect(cards[0].seed).toBe(42);
    expect(cards[0].source).toBe('certsafari-curated');
    expect(cards[0].total).toBe(60);
    expect(cards[0].composition).toBe('certsafari-mixed');
  });

  it('tolerates missing exam files (degraded card using registry fields only)', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/x.json', seed: 7, source: 'certsafari-curated', total: 60 }],
    };
    const cards = buildCardDescriptors(registry, {});
    expect(cards).toHaveLength(1);
    expect(cards[0].seed).toBe(7);
    expect(cards[0].total).toBe(60);
    expect(cards[0].src).toBe('../exams/cca-f/verified/x.json');
  });

  it('surfaces difficulty summary for generator-shaped exams', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/gen-1.json', seed: 1, source: 'generated', total: 60 }],
    };
    const examFiles = {
      '../exams/cca-f/verified/gen-1.json': {
        exam_metadata: {
          seed: 1,
          source: 'generated',
          difficulty_actual: { easy: 9, medium: 30, hard: 21 },
          scenarios_kept: ['a', 'b', 'c', 'd'],
          scenarios_dropped: ['e', 'f'],
          coverage_warnings: [],
        },
      },
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards[0].difficulty).toBe('E9/M30/H21');
    expect(cards[0].scenarioSummary).toBe('4 of 6 scenarios');
  });

  it('surfaces coverage_warnings as an array on the card', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/gen-2.json', seed: 2, source: 'generated', total: 60 }],
    };
    const examFiles = {
      '../exams/cca-f/verified/gen-2.json': {
        exam_metadata: {
          seed: 2,
          source: 'generated',
          coverage_warnings: ['Domain 2 has 0 questions'],
        },
      },
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards[0].warnings).toEqual(['Domain 2 has 0 questions']);
  });

  it('returns empty array when registry has no exams', () => {
    expect(buildCardDescriptors({ exams: [] }, {})).toEqual([]);
    expect(buildCardDescriptors({} as { exams: [] }, {})).toEqual([]);
  });
});
```

- [ ] **Step 1.2: Run tests — they MUST fail** (no implementation yet):

```bash
cd public/dungeon && npm test -- --run src/data/dungeonPicker.test.ts 2>&1 | tail -20
```
Expected: module-not-found or similar. If tests somehow pass, STOP and report BLOCKED.

- [ ] **Step 1.3: Create `public/dungeon/src/data/dungeonPicker.ts`**:

```typescript
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
```

- [ ] **Step 1.4: Run tests — all should pass**:

```bash
cd public/dungeon && npm test -- --run src/data/dungeonPicker.test.ts 2>&1 | tail -20
```
Expected: `Test Files  1 passed (1)` `Tests  6 passed (6)` (or similar vitest output).

- [ ] **Step 1.5: Commit**:

```bash
git add public/dungeon/src/data/dungeonPicker.ts public/dungeon/src/data/dungeonPicker.test.ts
git commit -m "$(cat <<'EOF'
feat(dungeon): dungeonPicker — pure-function helpers for exam picker

Exports toExamSrc (path transform from repo-relative to dungeon-relative)
and buildCardDescriptors (registry + exam files → card shape). Mirrors
public/practice/picker.js's pure functions but retyped for TypeScript.
6 vitest tests cover path transform, metadata merging, missing-file
fallback, difficulty/scenario surfacing, coverage warnings, empty
registry.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: PickerScene Phaser integration

**Files:**
- Create: `public/dungeon/src/scenes/PickerScene.ts`

**What it does:**
1. On create(), fetch `../exams/cca-f/verified/index.json`.
2. If fetch succeeds: fan-out per-exam metadata fetches, build cards, render as clickable buttons.
3. If fetch fails (404, network error): auto-fallback to the default pool — fetch `./data/questions.json`, stash in registry, fade to HubScene. No user interaction required.
4. On card click: fetch that exam's JSON, stash in registry as `questions`, initialize save-state, fade to HubScene.

### Steps

- [ ] **Step 2.1: Create `public/dungeon/src/scenes/PickerScene.ts`**:

```typescript
import Phaser from 'phaser';
import { loadQuestionsJson } from '../data/questionLoader';
import { buildCardDescriptors, toExamSrc, type DungeonCard } from '../data/dungeonPicker';
import { loadSaveState, initSaveState, saveSaveState } from '../game/saveState';
import { fadeToScene } from '../ui/transitions';
import type { QuestionsJson } from '../types';

const REGISTRY_URL = '../exams/cca-f/verified/index.json';
const FALLBACK_URL = './data/questions.json';

export class PickerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PickerScene' });
  }

  async create(): Promise<void> {
    this.add.text(480, 80, 'Pick a study pool', {
      fontSize: '32px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 120, 'Each pool is a 60-question exam. Pick one to begin.', {
      fontSize: '14px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const status = this.add.text(480, 380, 'Loading verified exams…', {
      fontSize: '16px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const registry = await fetchJson<{ exams: Array<{ path: string; seed: number; source?: string; total?: number }> }>(REGISTRY_URL);
      const srcs = (registry.exams || []).map(e => toExamSrc(e.path));
      const files = await Promise.all(srcs.map(s => fetchJson(s).catch(() => null)));
      const examFiles: Record<string, unknown> = {};
      srcs.forEach((s, i) => { if (files[i]) examFiles[s] = files[i]; });
      const cards = buildCardDescriptors(registry, examFiles as Record<string, Parameters<typeof buildCardDescriptors>[1][string]>);

      if (cards.length === 0) {
        status.setText('No verified exams found — falling back to default pool…');
        await this.bootWithDefault();
        return;
      }

      status.destroy();
      this.renderCards(cards);
    } catch (e: unknown) {
      status.setText('Could not load verified-exam registry — falling back to default pool…');
      await this.bootWithDefault();
    }
  }

  private renderCards(cards: DungeonCard[]): void {
    const cols = 2;
    const cardW = 380;
    const cardH = 120;
    const gapX = 40;
    const gapY = 20;
    const startX = (960 - (cols * cardW + (cols - 1) * gapX)) / 2 + cardW / 2;
    const startY = 180 + cardH / 2;

    cards.forEach((card, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const btn = this.add.rectangle(x, y, cardW, cardH, 0x1a1a2a)
        .setStrokeStyle(2, 0x4a4a6a)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStrokeStyle(2, 0x7c4dff));
      btn.on('pointerout', () => btn.setStrokeStyle(2, 0x4a4a6a));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        this.pickAndBoot(card);
      });

      const title = this.add.text(x - cardW / 2 + 16, y - cardH / 2 + 12, `Exam · seed ${card.seed}`, {
        fontSize: '18px',
        color: '#e0e0ea',
        fontFamily: 'monospace',
      });

      const badge = this.add.text(x + cardW / 2 - 16, y - cardH / 2 + 16, card.source.toUpperCase(), {
        fontSize: '10px',
        color: '#7c4dff',
        fontFamily: 'monospace',
      }).setOrigin(1, 0);

      const metaParts = [
        card.total ? `${card.total} Qs` : null,
        card.difficulty ?? null,
        card.scenarioSummary ?? null,
        card.composition ? card.composition : null,
      ].filter(Boolean);
      const meta = this.add.text(x - cardW / 2 + 16, y - cardH / 2 + 44, metaParts.join(' · '), {
        fontSize: '12px',
        color: '#a0a0b0',
        fontFamily: 'monospace',
        wordWrap: { width: cardW - 32 },
      });

      if (card.warnings.length > 0) {
        this.add.text(x - cardW / 2 + 16, y + cardH / 2 - 28, '⚠ ' + card.warnings.join('; '), {
          fontSize: '11px',
          color: '#e57373',
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 32 },
        });
      }

      this.add.text(x + cardW / 2 - 16, y + cardH / 2 - 16, 'Enter →', {
        fontSize: '11px',
        color: '#7c4dff',
        fontFamily: 'monospace',
      }).setOrigin(1, 1);

      void title; void badge; void meta;
    });
  }

  private async pickAndBoot(card: DungeonCard): Promise<void> {
    this.add.rectangle(480, 600, 960, 80, 0x000000, 0.85);
    this.add.text(480, 600, `Loading exam seed ${card.seed}…`, {
      fontSize: '14px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const questions = await loadQuestionsJson(card.src);
      this.stashAndBoot(questions);
    } catch (e: unknown) {
      this.add.text(480, 640, `Failed to load: ${(e as Error).message} — using default pool`, {
        fontSize: '12px',
        color: '#e57373',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      await this.bootWithDefault();
    }
  }

  private async bootWithDefault(): Promise<void> {
    try {
      const questions = await loadQuestionsJson(FALLBACK_URL);
      this.stashAndBoot(questions);
    } catch (e: unknown) {
      this.add.text(480, 440, `ERROR: could not load any question pool — ${(e as Error).message}`, {
        fontSize: '14px',
        color: '#e57373',
        fontFamily: 'monospace',
        wordWrap: { width: 800 },
      }).setOrigin(0.5);
    }
  }

  private stashAndBoot(questions: QuestionsJson): void {
    this.registry.set('questions', questions);
    let saveState = loadSaveState(questions.cert_id);
    if (!saveState) {
      saveState = initSaveState(questions.cert_id);
      saveSaveState(saveState);
    }
    this.registry.set('saveState', saveState);
    this.time.delayedCall(400, () => fadeToScene(this, 'HubScene'));
  }
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return (await res.json()) as T;
}
```

- [ ] **Step 2.2: Sanity check type-check**:

```bash
cd public/dungeon && npx tsc --noEmit 2>&1 | tail -10
```
Expected: no errors.

- [ ] **Step 2.3: Commit**:

```bash
git add public/dungeon/src/scenes/PickerScene.ts
git commit -m "$(cat <<'EOF'
feat(dungeon): PickerScene — card-grid scene for verified-exam selection

New Phaser scene between BootScene (assets) and HubScene (gameplay).
Fetches ../exams/cca-f/verified/index.json, fans out per-exam metadata
pulls in parallel, renders cards as interactive rectangles with hover
highlight. Clicking a card fetches that exam, stashes it in the game
registry, initializes save-state, fades to HubScene.

Auto-fallback: if verified/index.json is unreachable or empty, loads
./data/questions.json (the pre-Plan-1 default) so the dungeon still
boots. Preserves backward compatibility with the pre-picker flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Wire BootScene → PickerScene

**Files:**
- Modify: `public/dungeon/src/scenes/BootScene.ts`

**Change:** remove the question-load + save-state init from BootScene's create(); have it just load assets, then fade to PickerScene (not HubScene). PickerScene takes ownership of the question-load path.

### Steps

- [ ] **Step 3.1: Modify BootScene.create()** at [public/dungeon/src/scenes/BootScene.ts:61-103](public/dungeon/src/scenes/BootScene.ts#L61-L103). Replace the entire `async create(): Promise<void>` body with:

```typescript
  create(): void {
    this.add.text(480, 280, 'Slay the Cert', {
      fontSize: '48px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 340, 'Assets loaded.', {
      fontSize: '20px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.time.delayedCall(400, () => {
      fadeToScene(this, 'PickerScene');
    });
  }
```

Also remove the unused imports at the top: `loadQuestionsJson`, `loadSaveState`, `initSaveState`, `saveSaveState`, `QuestionsJson`. Keep `fadeToScene` and `Phaser`.

- [ ] **Step 3.2: Type-check**:

```bash
cd public/dungeon && npx tsc --noEmit 2>&1 | tail -10
```
Expected: no errors (the unused imports shouldn't trigger errors if noUnusedLocals is false; if it IS on, the removal in step 3.1 is required).

- [ ] **Step 3.3: Commit**:

```bash
git add public/dungeon/src/scenes/BootScene.ts
git commit -m "$(cat <<'EOF'
refactor(dungeon): BootScene loads assets only; question-load moves to PickerScene

Boot's single responsibility is now asset-loading. The question-pool
decision moves to PickerScene (new). BootScene fades to PickerScene
after a brief 'Assets loaded' beat.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Register PickerScene

**Files:**
- Modify: `public/dungeon/src/main.ts`

### Steps

- [ ] **Step 4.1: Update the scene array** at [public/dungeon/src/main.ts:19](public/dungeon/src/main.ts#L19). Add `PickerScene` between `BootScene` and `HubScene`:

```typescript
import { PickerScene } from './scenes/PickerScene';
// ... rest of imports unchanged
  scene: [BootScene, PickerScene, HubScene, BossFightScene, InterstitialScene, CampaignCompleteScene],
```

- [ ] **Step 4.2: Type-check + build-smoke**:

```bash
cd public/dungeon && npx tsc --noEmit 2>&1 | tail -10
cd public/dungeon && npm run build 2>&1 | tail -20
```
Expected: type-check clean, build succeeds, bundle size similar (maybe +5-10KB for the new scene).

- [ ] **Step 4.3: Commit**:

```bash
git add public/dungeon/src/main.ts
git commit -m "$(cat <<'EOF'
feat(dungeon): register PickerScene in game scene array

Scene order: Boot → Picker → Hub → BossFight → Interstitial → CampaignComplete.
Picker sits between asset-loading and gameplay boot.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: End-to-end Playwright smoke test

**Goal:** Prove that the full flow works in the deployed dungeon: boot → assets load → picker renders cards → click → game boots with chosen pool.

- [ ] **Step 5.1: Start Vite dev server**:

```bash
cd public/dungeon && npm run dev 2>&1 &
```
Use `run_in_background: true` so the dev server keeps running.

- [ ] **Step 5.2: Wait for server to come up**, then navigate:
  - Default dev URL is usually `http://localhost:5173/`. Watch the startup log for the actual URL.
  - **Important caveat:** Vite's dev server roots at `public/dungeon/` so the `../exams/cca-f/verified/...` relative fetch will escape the Vite root and fail with 404. This is the fallback-to-default-pool path — expected behavior in dev.
  - Navigate via Playwright to the server URL.

- [ ] **Step 5.3: Smoke-test the BOOT path**:
  - Wait for "Assets loaded." beat.
  - Wait for fade to PickerScene.
  - **Expected in dev (with verified fetch failing):** status says "Could not load verified-exam registry — falling back to default pool…" and game eventually fades to HubScene with the default pool.
  - If HubScene is reached, the full chain works. Take a screenshot for record.

- [ ] **Step 5.4: Smoke-test the PICKER path via a local static server** (to test the happy path where verified/index.json IS reachable). Use the same `python -m http.server --directory public` trick used in Plan 3 smoke tests. Navigate to `http://localhost:8000/dungeon/index.html` (note: needs the dungeon to be built first — run `npm run build` and serve from `public/dungeon/dist/` or similar).

  This is awkward because Vite builds into `public/dungeon/dist/`. For MVP: skip this second path and just verify the fallback works. Flag the prod smoke as a follow-up once this PR is deployed via GitHub Actions and can be tested live at the GH Pages URL.

- [ ] **Step 5.5: Kill the dev server** (KillShell with the shell_id from step 5.1).

- [ ] **Step 5.6: Only if failures surfaced, commit a fix + re-test.** Otherwise no commit — this is verification-only.

---

## Task 6: Handoff

**Deliverables after Tasks 1–5:**
- [ ] `dungeonPicker.ts` + 6 passing vitest tests
- [ ] `PickerScene.ts` — new scene with card grid + fallback
- [ ] `BootScene.ts` — simplified to assets-only
- [ ] `main.ts` — PickerScene registered between Boot and Hub
- [ ] Dev server smoke test confirms fallback path works

**What's now shippable:**
- Opening the dungeon in prod shows the picker with 5 CertSafari-curated exams to choose from.
- Each choice loads that exam's question pool and proceeds to HubScene as before.
- No regressions: if verified/index.json is unreachable, auto-falls back to `./data/questions.json`.

**Unblocked for Plan 5 (Phase 3 Weakness queue):**
- No direct dependency; Plan 5 is entirely practice-UI-side.

---

## Deferred / out of scope for this plan

- **Metadata-driven stage balance** — the spec §7.2 envisions `exam_metadata.difficulty` counts driving encounter tiers (easy→minions, medium→elites, hard→boss) and `coverage_warnings` locking wings. That's a separate plan (call it Plan 4b) touching HubScene + BossFightScene balance constants. Wait for signal that the current balance is unbalanced before investing.
- **Picker visual polish** — using the existing UI-panel-brown sprite for card backgrounds instead of flat rectangles. Plan 4b material.
- **Keyboard navigation for picker** — currently mouse/touch only. Plan 4b material.
- **Registry cache / preload** — currently refetches on every boot. Fine for the 5-exam case; worth caching when the library grows to 100+.

---

## Success criteria

- [ ] `cd public/dungeon && npm test` — all vitest tests pass (6 new + existing).
- [ ] `cd public/dungeon && npm run build` — clean build.
- [ ] Dev-server Playwright smoke: boot → picker-fallback → HubScene reaches successfully.
- [ ] No regressions: if you manually override by setting URL to something valid, the picker launches that exam.
