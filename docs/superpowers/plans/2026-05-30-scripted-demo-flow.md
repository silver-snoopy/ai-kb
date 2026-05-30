# Scripted Demo Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `?demo`-triggered, fully reproducible playthrough of the Slay the Cert dungeon over the **real** question bank, starting at the Tool-Smith boss, with the correct-answer key dumped to the console — and retire the old fake-bank demo.

**Architecture:** The game is already deterministic from a seed except for the one `Math.random` call that selects a fight's questions. In demo mode we (a) start a `first-run` campaign with a hardcoded `DEMO_SEED` and a fixed boss order, (b) feed `pickQuestionsForFight` a seeded RNG (`makeSeededRng(seed + floorsCleared)`), and (c) `console.log` each fight's correct letters. The demo grants the full spellbook and shows no badge, so it looks identical to normal play. Reuses the existing `demoRun` no-persist plumbing without the fake-bank swap.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest. All paths below are relative to `public/dungeon/` unless noted.

---

## Working directory & conventions

- All `npm` / `npx vitest` commands run from `public/dungeon/`.
- The real question bank the dungeon loads at runtime is `public/dungeon/public/data/bank.json` (364 questions; 60 in `domain-4-mcp`).
- Existing seeded-RNG algorithm (LCG, multiplier 16807, modulus 2147483647) is the canonical one — reuse it everywhere; do not invent a second RNG.
- The repo runs `tsc` via the build; treat any unused import as a failure to fix (the old-demo removal creates several).

---

## File Structure

**Modify:**
- `src/game/dungeon.ts` — export `makeSeededRng`; add `demoRngForFloor`.
- `src/game/dungeon.test.ts` — tests for the above.
- `src/data/questionLoader.test.ts` — add a `pickQuestionsForFight` determinism test.
- `src/ui/debugToggle.ts` — add `isScriptedDemo` + `scriptedDemoSeedOverride`.
- `src/ui/debugToggle.test.ts` — tests for the above.
- `src/config.ts` — add `DEMO_SEED` + `DEMO_BOSS_ORDER`.
- `src/scenes/HubScene.ts` — `beginScriptedDemo`; auto-trigger; simplify demo-return cleanup; remove old demo button + `beginDemoCampaign` + dead imports.
- `src/scenes/BossFightScene.ts` — seeded demo pick + console key dump; drop `demoBadge`.
- `src/scenes/InterstitialScene.ts` — drop `demoBadge`.
- `src/scenes/CampaignCompleteScene.ts` — drop `demoBadge`.

**Delete:**
- `src/ui/demoBadge.ts`
- `public/data/demo-questions.json`

**Create (talk artifact):**
- `../talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` (i.e. `public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` from repo root)

---

## Task 1: Export seeded RNG + add `demoRngForFloor`

**Files:**
- Modify: `src/game/dungeon.ts:32-38`
- Test: `src/game/dungeon.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/game/dungeon.test.ts` (import `makeSeededRng, demoRngForFloor` from `./dungeon`; add them to the existing import statement):

```typescript
import { demoRngForFloor, makeSeededRng } from './dungeon';

describe('makeSeededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeSeededRng(99);
    const b = makeSeededRng(99);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('demoRngForFloor', () => {
  it('equals makeSeededRng(seed + floor)', () => {
    const direct = makeSeededRng(1234 + 3);
    const helper = demoRngForFloor(1234, 3);
    expect([helper(), helper()]).toEqual([direct(), direct()]);
  });

  it('produces a different stream per floor', () => {
    const f0 = demoRngForFloor(1234, 0);
    const f1 = demoRngForFloor(1234, 1);
    expect(f0()).not.toEqual(f1());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/dungeon.test.ts`
Expected: FAIL — `makeSeededRng`/`demoRngForFloor` not exported.

- [ ] **Step 3: Implement**

In `src/game/dungeon.ts`, change the private function to an export and add the helper. Replace lines 32-38:

```typescript
export function makeSeededRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * RNG for a demo fight: deterministic per (seed, floor) so each boss in a
 * scripted demo draws a stable-but-distinct question set.
 */
export function demoRngForFloor(seed: number, floor: number): () => number {
  return makeSeededRng(seed + floor);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/dungeon.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/dungeon.ts src/game/dungeon.test.ts
git commit -m "feat(dungeon): export makeSeededRng + add demoRngForFloor"
```

---

## Task 2: Lock the `pickQuestionsForFight` determinism guarantee

The demo relies on `pickQuestionsForFight` returning the same picks for the same seeded RNG. The existing test only checks difficulty ordering — add an explicit determinism assertion.

**Files:**
- Test: `src/data/questionLoader.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside the `describe('questionLoader', …)` block in `src/data/questionLoader.test.ts` (the `seeded` helper already exists at the bottom of the file):

```typescript
it('is deterministic for the same seeded rng', () => {
  const pool: Question[] = [
    makeQ('e1', 'easy'),
    makeQ('e2', 'easy'),
    makeQ('m1', 'medium'),
    makeQ('m2', 'medium'),
    makeQ('h1', 'hard'),
    makeQ('h2', 'hard'),
  ];
  const a = pickQuestionsForFight(pool, 5, seeded(7)).map((q) => q.id);
  const b = pickQuestionsForFight(pool, 5, seeded(7)).map((q) => q.id);
  expect(a).toEqual(b);
});
```

- [ ] **Step 2: Run test to verify it passes immediately**

Run: `npx vitest run src/data/questionLoader.test.ts`
Expected: PASS (this is a regression guard, not new behavior). If it FAILS, stop — determinism is broken and the rest of the plan is invalid.

- [ ] **Step 3: Commit**

```bash
git add src/data/questionLoader.test.ts
git commit -m "test(dungeon): assert pickQuestionsForFight is seed-deterministic"
```

---

## Task 3: `?demo` query-param helpers

**Files:**
- Modify: `src/ui/debugToggle.ts:8` (insert after `isDebugEnabled`)
- Test: `src/ui/debugToggle.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/ui/debugToggle.test.ts` (extend the existing import to include the two new names):

```typescript
import { isScriptedDemo, scriptedDemoSeedOverride } from './debugToggle';

describe('isScriptedDemo', () => {
  it('is true for ?demo and ?demo=123', () => {
    expect(isScriptedDemo('?demo')).toBe(true);
    expect(isScriptedDemo('?demo=123')).toBe(true);
  });
  it('is false for no param or unrelated params', () => {
    expect(isScriptedDemo('')).toBe(false);
    expect(isScriptedDemo('?debug')).toBe(false);
  });
});

describe('scriptedDemoSeedOverride', () => {
  it('returns the numeric seed when ?demo=<n>', () => {
    expect(scriptedDemoSeedOverride('?demo=123')).toBe(123);
  });
  it('returns null for bare ?demo or non-numeric', () => {
    expect(scriptedDemoSeedOverride('?demo')).toBeNull();
    expect(scriptedDemoSeedOverride('?demo=abc')).toBeNull();
    expect(scriptedDemoSeedOverride('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/debugToggle.test.ts`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement**

In `src/ui/debugToggle.ts`, insert after the `isDebugEnabled` function (after line 8):

```typescript
/**
 * True when the URL requests a scripted demo run (`?demo` or `?demo=<seed>`).
 */
export function isScriptedDemo(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has('demo');
}

/**
 * The numeric seed from `?demo=<n>`, or null for bare `?demo` / non-numeric.
 * Callers fall back to the hardcoded DEMO_SEED when this is null.
 */
export function scriptedDemoSeedOverride(search: string = window.location.search): number | null {
  const raw = new URLSearchParams(search).get('demo');
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/debugToggle.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/debugToggle.ts src/ui/debugToggle.test.ts
git commit -m "feat(dungeon): add ?demo query-param helpers"
```

---

## Task 4: DEMO constants

**Files:**
- Modify: `src/config.ts:16` (after the `GAME_CONFIG` object, before `BOSSES`)

- [ ] **Step 1: Implement (no test — pure constants consumed by later tasks)**

In `src/config.ts`, immediately after the `GAME_CONFIG` `as const` block (line 16) add:

```typescript
// Scripted-demo run (talk mode). DEMO_SEED is locked in Task 8 after
// previewing which questions it surfaces. DEMO_BOSS_ORDER fixes the
// campaign order so the Tool-Smith fight is always the opener.
export const DEMO_SEED = 1;
export const DEMO_BOSS_ORDER = [
  'the-tool-smith',
  'the-orchestrator',
  'the-compiler-king',
  'the-grammarian',
  'the-memory-kraken',
] as const;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx vitest run src/game/dungeon.test.ts`
Expected: PASS (no behavior change; this just confirms the file still parses/typechecks under the test runner).

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat(dungeon): add DEMO_SEED + DEMO_BOSS_ORDER constants"
```

---

## Task 5: `beginScriptedDemo` + auto-trigger + cleanup simplification, and remove the old fake demo

This is the largest task. It (a) adds the new scripted-demo entry path, (b) auto-triggers it on `?demo`, (c) simplifies the demo-return cleanup, and (d) deletes the old fake-bank demo button + `beginDemoCampaign` + now-dead imports.

**Files:**
- Modify: `src/scenes/HubScene.ts` (imports; lines 57-71; lines 287-310; method after line 460)

- [ ] **Step 1: Replace the imports block**

In `src/scenes/HubScene.ts`, replace lines 2-12 (everything from `import { BOSSES }` down to and including the `import { isDebugEnabled, mountDebugToggle }` line — i.e. keep `import Phaser` on line 1 and the `import { fadeIn, fadeToScene }` on line 13) with:

```typescript
import { BOSSES, DEMO_BOSS_ORDER, DEMO_SEED } from '../config';
import { createCampaign } from '../game/dungeon';
import type { Campaign } from '../game/dungeon';
import { type RunSave, clearActiveRun, readActiveRun } from '../game/runSave';
import { createSpellbook } from '../game/spellbook';
import type { RunMode, SaveStateV1, SpellId } from '../types';
import { mountAudioToggles } from '../ui/audioToggles';
import { attachRectHover } from '../ui/buttonHover';
import {
  isDebugEnabled,
  isScriptedDemo,
  mountDebugToggle,
  scriptedDemoSeedOverride,
} from '../ui/debugToggle';
```

(This drops the now-unused `loadBank` and `Bank` imports and adds `DEMO_*`, the demo helpers, and `SpellId`.)

- [ ] **Step 2: Replace the demo-return cleanup block**

Replace lines 57-71 (the `if (this.registry.get('demoRun')) { … }` block including its comment) with:

```typescript
    // Returning from a scripted demo: clear the no-persist flag and any
    // active-run save so a subsequent real run starts clean. The demo uses
    // the real bank, so there is no bank to swap back.
    if (this.registry.get('demoRun')) {
      this.registry.remove('demoRun');
      clearActiveRun();
    }

    // Auto-launch the scripted demo when the URL requests it. Runs after the
    // cleanup above so a self-restart (return to Hub with ?demo still set)
    // re-enters cleanly.
    if (isScriptedDemo()) {
      this.beginScriptedDemo(scriptedDemoSeedOverride() ?? DEMO_SEED);
      return;
    }
```

- [ ] **Step 3: Remove the old demo button block**

Delete lines 287-310 (the entire `// Demo-campaign button: …` comment through `debugLayer.add(demoLabel);`). The `mountDebugToggle(...)` call that follows stays.

- [ ] **Step 4: Replace `beginDemoCampaign` with `beginScriptedDemo`**

Replace the entire `beginDemoCampaign` method (originally lines 462-513, `private async beginDemoCampaign(): Promise<void> { … }`) with:

```typescript
  private beginScriptedDemo(seed: number): void {
    // Scripted talk demo: real bank, fixed boss order (Tool-Smith first),
    // fixed seed → fully reproducible questions. Locked to first-run mode
    // (short 5-HP bosses). demoRun reuses the no-persist plumbing
    // (CampaignCompleteScene skips recordCampaignVictory) without swapping
    // the bank. Grants the full spellbook so every lifeline is demoable.
    clearActiveRun();
    this.registry.set('demoRun', true);

    const mode: RunMode = 'first-run';
    const campaign: Campaign = createCampaign(mode, seed);
    campaign.bossOrder = [...DEMO_BOSS_ORDER];

    const spellbook = createSpellbook(mode);
    const allSpells: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot'];
    for (const spellId of allSpells) {
      if ((spellbook[spellId] ?? 0) === 0) spellbook[spellId] = 1;
    }

    this.registry.set('campaign', campaign);
    this.registry.set('spellbook', spellbook);
    this.registry.set('heroHp', 3);
    this.registry.set('sessionLog', {
      schema_version: 1,
      cert_id: 'demo',
      mode,
      started_at: new Date().toISOString(),
      ended_at: null,
      result: null,
      bosses_defeated: [],
      spells_cast: [],
      questions: [],
      total_correct: 0,
      total_wrong: 0,
      final_hero_hp: 3,
    });

    fadeToScene(this, 'BossFightScene', { bossId: campaign.bossOrder[0], mode, isolated: false });
  }
```

- [ ] **Step 5: Run the full test + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, no unused-import or type errors. If `tsc` flags `SpellId` or any import as unused, the removal in Step 1/3/4 was incomplete — fix before committing.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/HubScene.ts
git commit -m "feat(dungeon): scripted ?demo run on real bank; retire fake-bank demo button"
```

---

## Task 6: Seeded demo question pick + console answer-key dump

**Files:**
- Modify: `src/scenes/BossFightScene.ts:8` (import), `:144` (pick), and just after the pick (console dump)

- [ ] **Step 1: Add `demoRngForFloor` to the dungeon import**

In `src/scenes/BossFightScene.ts`, replace line 8:

```typescript
import { advanceFloor, demoRngForFloor, isCampaignComplete } from '../game/dungeon';
```

- [ ] **Step 2: Replace the question-pick line with the seeded-in-demo version**

Replace line 144 (`this.questions = pickQuestionsForFight(domainPool, maxQuestions);`) with:

```typescript
      const demoRun = Boolean(this.registry.get('demoRun'));
      const demoCampaign = this.registry.get('campaign') as Campaign | undefined;
      const pickRng =
        demoRun && demoCampaign
          ? demoRngForFloor(demoCampaign.seed ?? 0, demoCampaign.floorsCleared)
          : Math.random;
      this.questions = pickQuestionsForFight(domainPool, maxQuestions, pickRng);
      if (demoRun) {
        // Answer key for the talk: the picked questions' correct letters in
        // order. Copied once into the demo cheat sheet (see plan Task 8).
        // eslint-disable-next-line no-console
        console.log(`[demo] ${this.boss.id}: ${this.questions.map((q) => q.correct).join(' → ')}`);
      }
```

- [ ] **Step 3: Verify it compiles + tests pass**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS. (`Campaign` is already imported at line 7.)

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BossFightScene.ts
git commit -m "feat(dungeon): seed demo question pick + log answer key"
```

---

## Task 7: Delete the fake bank + remove the demo badge entirely

**Files:**
- Delete: `public/data/demo-questions.json`, `src/ui/demoBadge.ts`
- Modify: `src/scenes/BossFightScene.ts` (import line 30, call line 406), `src/scenes/InterstitialScene.ts` (import line 5, call line 162), `src/scenes/CampaignCompleteScene.ts` (import line 6, call line 35)

- [ ] **Step 1: Delete the fake bank and the badge module**

```bash
git rm public/data/demo-questions.json src/ui/demoBadge.ts
```

- [ ] **Step 2: Remove the badge import + call from BossFightScene**

In `src/scenes/BossFightScene.ts`: delete the import line `import { mountDemoBadgeIfActive } from '../ui/demoBadge';` (line 30) and delete the call line `    mountDemoBadgeIfActive(this);` (line 406, near `this.events.emit('battle-start', …)`).

- [ ] **Step 3: Remove the badge import + call from InterstitialScene**

In `src/scenes/InterstitialScene.ts`: delete the import line `import { mountDemoBadgeIfActive } from '../ui/demoBadge';` (line 5) and delete the call line `    mountDemoBadgeIfActive(this);` (line 162, near `this.renderNarrative();`).

- [ ] **Step 4: Remove the badge import + call from CampaignCompleteScene**

In `src/scenes/CampaignCompleteScene.ts`: delete the import line `import { mountDemoBadgeIfActive } from '../ui/demoBadge';` (line 6) and delete the call line `    mountDemoBadgeIfActive(this);` (line 35, after `clearActiveRun();`).

- [ ] **Step 5: Verify no dangling references, full test + typecheck**

Run:
```bash
grep -rn "demoBadge\|mountDemoBadgeIfActive\|demo-questions" src/ public/data 2>/dev/null
npx vitest run && npx tsc --noEmit
```
Expected: the `grep` prints nothing; tests and `tsc` PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(dungeon): delete fake demo bank + demo badge"
```

---

## Task 8: Lock `DEMO_SEED` + generate the cheat sheet

This previews candidate seeds, locks the one whose Tool-Smith questions read best, and writes the answer-key markdown. It uses the **real** pure functions (via a throwaway Vitest spec) so the printed key is guaranteed to match what the running game shows.

**Files:**
- Create (temporary): `src/scenes/demoKey.preview.test.ts`
- Modify: `src/config.ts` (`DEMO_SEED` value)
- Create: `public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` (repo-root path)

- [ ] **Step 1: Write a throwaway preview spec**

Create `src/scenes/demoKey.preview.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { DEMO_BOSS_ORDER } from '../config';
import { pickQuestionsForFight, questionsForDomain } from '../data/questionLoader';
import { demoRngForFloor } from '../game/dungeon';
import { BOSSES } from '../config';
import type { Bank } from '../types';

const bank = JSON.parse(readFileSync('public/data/bank.json', 'utf-8')) as Bank;
const FIRST_RUN_MAX_QUESTIONS = 7; // 5 boss HP + 3 hero HP - 1

describe('demo key preview', () => {
  it('prints candidate keys', () => {
    for (const seed of [1, 2, 3, 7, 42, 100]) {
      const lines: string[] = [`SEED ${seed}`];
      DEMO_BOSS_ORDER.forEach((bossId, floor) => {
        const boss = BOSSES.find((b) => b.id === bossId)!;
        const pool = questionsForDomain(bank, boss.domain);
        const picks = pickQuestionsForFight(pool, FIRST_RUN_MAX_QUESTIONS, demoRngForFloor(seed, floor));
        const key = picks.map((q) => q.correct).join(' → ');
        lines.push(`  ${bossId}: ${key}`);
        if (floor === 0) {
          // Tool-Smith stems, to judge readability for the audience.
          picks.forEach((q) => lines.push(`      [${q.correct}] ${q.stem}`));
        }
      });
      // eslint-disable-next-line no-console
      console.log(lines.join('\n'));
    }
  });
});
```

- [ ] **Step 2: Run the preview and choose a seed**

Run: `npx vitest run src/scenes/demoKey.preview.test.ts`
Read the console output. Pick the seed whose **Tool-Smith** (`the-tool-smith`, floor 0) stems read clearest for an audience. Note that seed and its five answer-key lines.

- [ ] **Step 3: Lock `DEMO_SEED`**

In `src/config.ts`, set `export const DEMO_SEED = <chosen seed>;` (replace the placeholder `1` from Task 4 if a different seed reads better; if `1` is best, leave it).

- [ ] **Step 4: Write the cheat sheet**

Create `public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` (path from repo root) using the chosen seed's output. Template:

```markdown
# Slay the Cert — demo answer key

Run the demo at `…/dungeon/?demo` (locked seed `<seed>`, real bank). The run is
fully deterministic: these are the correct answers in pick order, per boss.
Representative run — you can deliberately miss one for the teaching beat.

> Regenerate after any bank change: `npx vitest run src/scenes/demoKey.preview.test.ts`
> (from `public/dungeon/`) and copy the line for the locked seed.

| Floor | Boss | Answer key (pick order) |
|---|---|---|
| 1 | Tool-Smith | `<A → B → …>` |
| 2 | Orchestrator | `<…>` |
| 3 | Compiler-King | `<…>` |
| 4 | Grammarian | `<…>` |
| 5 | Memory-Kraken | `<…>` |

You only need the first ~5 correct per boss to win (5 boss HP); the rest cover misses.
```

- [ ] **Step 5: Delete the throwaway preview spec**

```bash
git rm -f src/scenes/demoKey.preview.test.ts 2>/dev/null || rm -f src/scenes/demoKey.preview.test.ts
```

- [ ] **Step 6: Final full test + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, and the preview spec is gone.

- [ ] **Step 7: Commit**

```bash
cd ../..   # repo root, so the talks/ path is included
git add public/dungeon/src/config.ts public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md
git commit -m "feat(talk): lock DEMO_SEED + add demo answer-key cheat sheet"
```

---

## Task 9: Manual verification

- [ ] **Step 1: Build + serve, then exercise the demo in a browser**

Run: `npm run dev` (from `public/dungeon/`), open the printed URL with `?demo` appended.

Verify ALL of:
- The run starts on the **Tool-Smith** boss room.
- The browser console shows `[demo] the-tool-smith: …` and the letters match the cheat sheet.
- Every spell/lifeline (Echo, Study the Tome, Memorize, Amplify, Doubleshot) is present and castable.
- **No `(DEMO)` badge** is visible anywhere (boss fight, interstitial, campaign complete).
- Reload `?demo` → the same questions appear in the same order.
- Open the URL **without** `?demo` → normal randomized run, no badge, and the demo did not overwrite the real save/progression (Hub still shows your prior title/parchment).

- [ ] **Step 2: No commit** (verification only). Record the result in the PR description.

---

## Self-review notes (for the implementer)

- Both Task 6 and Task 8 call `demoRngForFloor(seed, floor)`, where `floor` is the boss index in `DEMO_BOSS_ORDER` and equals `campaign.floorsCleared` at fight time. That shared helper is what guarantees the cheat sheet matches the running game — don't inline a second copy of the formula.
- `pickQuestionsForFight` uses `maxQuestions = bossHp + HERO_MAX_HP - 1 = 7` for `first-run`. The preview spec hardcodes `7` to match.
- Do not seed normal (non-demo) play — the `pickRng` falls back to `Math.random` unless `demoRun` is set.
