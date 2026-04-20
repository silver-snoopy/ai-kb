# Unified Question Bank for Practice + Dungeon

**Date:** 2026-04-20
**Status:** approved via brainstorm (2026-04-20, two COVE rounds, all gaps resolved)
**Scope:** `public/practice/`, `public/dungeon/`, `public/exams/cca-f/`, `scripts/`, CI workflow
**Out of scope:** Review surface (nav-hidden per `project_review_retired_2026_04_20.md`; its source-of-truth stays on vault `questions.json`)

## Goal

Collapse the current split between vault-authored `questions.json` and per-seed verified exam files into **one canonical `bank.json`** that both Practice and Dungeon draw from. The bank is accumulative: CertSafari-imported questions (364) are the initial seed; LLM-generated questions merge in over time via a preserved verification pipeline. Every question carries `domain` + `scenario` tags, enabling dynamic slicing instead of per-file arrangements.

## Non-goals

- Adding new Dungeon modes (Scenario Run / Mock Run in the Dungeon). Normal mode only this pass.
- Touching the Review surface. It keeps reading vault `questions.json` by direct URL; nav-hidden per prior decision.
- Pre-baked mock-exam arrangement files. Mock exams are runtime-generated from the bank; arrangements drift as the bank grows.
- Migration from old seed-exam URLs. Bookmarks pointing at `verified/certsafari-seed*.json` will 404. Acceptable because the user is the sole operator.

## Design

### A. Data model — the bank

Single file: `public/exams/cca-f/bank.json`.

```jsonc
{
  "cert_id": "cca-f",
  "version": 1,
  "built_at": "<ISO8601>",
  "total": 364,
  "domains": {
    "domain-1-agentic":            { "num": 1, "name": "...", "weight": 0.27, "color": "..." },
    "domain-2-claude-code":        { "num": 2, "name": "...", "weight": 0.20, "color": "..." },
    "domain-3-prompt-engineering": { "num": 3, "name": "...", "weight": 0.20, "color": "..." },
    "domain-4-mcp":                { "num": 4, "name": "...", "weight": 0.18, "color": "..." },
    "domain-5-context":            { "num": 5, "name": "...", "weight": 0.15, "color": "..." }
  },
  "scenarios": {
    "1": { "name": "Customer Support Resolution Agent",   "domains": ["domain-1-agentic", "domain-4-mcp", "domain-5-context"] },
    "2": { "name": "Code Generation with Claude Code",    "domains": ["domain-2-claude-code", "domain-3-prompt-engineering"] },
    "3": { "name": "Multi-Agent Research System",         "domains": ["domain-1-agentic", "domain-5-context"] },
    "4": { "name": "Developer Productivity with Claude",  "domains": ["domain-4-mcp"] },
    "5": { "name": "Claude Code for CI/CD",               "domains": ["domain-2-claude-code", "domain-3-prompt-engineering"] },
    "6": { "name": "Structured Data Extraction",          "domains": ["domain-3-prompt-engineering", "domain-5-context"] }
  },
  "questions": [
    {
      "id": "certsafari-domain-1-agentic-24060",
      "source": "certsafari",
      "domain": "domain-1-agentic",
      "scenario": "3",
      "difficulty": "medium",
      "stem": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "B",
      "explanation": "A: ...\nB: ...\nC: ...\nD: ...",
      "source_note": "raw/certsafari/cca-f-questions.json (id=24060)"
    },
    {
      "id": "gen-<uuid-v4>",
      "source": "llm",
      "domain": "domain-2-claude-code",
      "scenario": "2",
      "difficulty": "hard",
      "stem": "...",
      "options": { ... },
      "correct": "C",
      "explanation": "...",
      "source_note": "gen-<timestamp>.json (generator seed=42)"
    }
  ]
}
```

#### ID convention (invariant)

- CertSafari imports: `certsafari-<domain-slug>-<numeric-id>` — preserves the numeric suffix from the raw bank so existing localStorage references (weakness-queue, dungeon runSave) continue to resolve.
- LLM-generated: `gen-<uuid-v4>` — collision-free, opaque.
- Prefix is the discriminator: a unit test MUST assert `q.source === 'certsafari'` ⟺ `q.id.startsWith('certsafari-')` and similarly for `llm` / `gen-`.

#### Scenario metadata

Six scenarios, sourced authoritatively from `certs/cca-f/_scenarios.md`. Each scenario declares which domains it tests — used to constrain the UI filter (empty scenario∩domain intersections are disabled, not clickable).

### B. Migration pipeline (one-shot, scripted)

Two new scripts, run once to produce the initial bank:

#### `scripts/build-bank.mjs`

Reads `raw/certsafari/cca-f-questions.json`, transforms to bank schema. Outputs `public/exams/cca-f/bank.json` with `scenario: null` on every question. Pure data transform, no LLM calls.

Key transforms (same as the prior `build-dungeon-fallback.mjs` draft we discarded):
- CertSafari domain string ("Domain 1: Agentic...") → vault slug ("domain-1-agentic") via authoritative mapping (see `reference_certsafari_api.md`)
- Options array `[A, B, C, D]` → options object `{A, B, C, D}`
- `correct_answers: ["B"]` → `correct: "B"`
- `explanations: [{option, explanation}]` → `explanation` string joined with newlines
- `source: "certsafari"` added
- `id: certsafari-<slug>-<numeric>` formed from the raw numeric id
- Default `difficulty: "medium"` (CertSafari doesn't supply this; preserves current seed behavior)

#### `scripts/classify-scenarios.mjs`

Reads `public/exams/cca-f/bank.json`. For each question with `scenario: null`:
- Dispatches a classification call (subagent or direct API, see Implementation Notes)
- Input context: the 6 scenario definitions from `_scenarios.md` + the question stem + correct answer + explanation
- Output: `scenario: "<1–6>"` + one-line justification (logged, not persisted)
- Writes scenario tag back to bank.json
- Idempotent: skips already-tagged questions

Cost: ~$2 via Haiku for 364 questions. Wallclock: ~15 minutes.

The script is also re-run on demand if scenario taxonomy ever changes. Idempotency + `scenario: null` on newly-merged LLM questions (see §F: generator emits its own scenario, so classifier isn't re-run on them) keeps the script cheap in steady state.

### C. Arrangement function — runtime, no file output

New module: `public/exams/arrangement.js` (ES module, vanilla JS, zero dependencies).

```js
// Deterministic seeded PRNG; pure, no I/O.
export function buildMockExam(bank, opts = {}) {
  const { seed, size = 60, scenarioCount = 4, domainWeights = 'exam' } = opts;
  // 1. Seed PRNG (mulberry32 or similar; deterministic given seed).
  // 2. Pick scenarioCount of 6 scenarios at random.
  // 3. Filter bank.questions to those scenarios.
  // 4. Shuffle per domain-weighted proportions (default = exam weights from bank.domains[*].weight).
  // 5. Return first `size` question objects (not just ids — callers want full data).
}

export function buildDrillSession(bank, filters = {}) {
  const { domains, scenarios, size, seed } = filters;
  // 1. Filter bank.questions by INTERSECTION of provided domain and scenario sets (empty filter = all).
  // 2. Shuffle with seeded PRNG (or Math.random if no seed).
  // 3. Return first `size` question objects.
}

export function countByAxis(bank, filters = {}) {
  // Returns { byDomain: {domainId: count}, byScenario: {scenarioId: count} }
  // Used by Practice UI to render live counts + disable empty-intersection rows.
}
```

**Seed drift (V1 decision):** `buildMockExam(bank, { seed: 1 })` produces different arrangements as the bank grows. This is the correct behavior for a study tool — newly-added LLM-generated questions become eligible for mock-exam selection without seed-file migration. Users who want "exactly this 60-Q session" later get a session-replay URL that embeds the question-id array explicitly; that's the only place snapshots matter.

**Module location:** `public/exams/arrangement.js` (sibling to `cca-f/`). Both Practice (vanilla JS) and Dungeon (Vite/TS) import it — Vite handles the JS interop transparently.

### D. Practice UI

#### Setup screen (new, replaces current domain-only setup + retired picker)

Live-filter rendering pattern (mirrors today's domain checkbox group):

- **Domain filter** — 5 checkboxes, one per domain, showing name + live count of questions matching current scenario selection.
- **Scenario filter** — 6 checkboxes, one per scenario, showing name + live count of questions matching current domain selection.
- **Cross-validation:** selecting any scenario disables domains with 0 intersection with the selected scenario set; selecting any domain disables scenarios with 0 intersection with the selected domain set. Disabled checkboxes are visually greyed and un-clickable. User cannot create an empty-filter session.
- **Session length** — dropdown or slider: 10 / 20 / 60. Default 20.
- **Start session** button → quiz UI (unchanged from today).
- **Mock exam preset** — secondary button: "Mock exam — 60 Qs, 4-of-6 scenarios, domain-weighted." Clicking overrides filters + session length to `buildMockExam(bank, { seed: Date.now() })` and launches directly into the quiz.

Filter intersection logic lives in `public/practice/app.js` using `arrangement.js`'s `countByAxis` for counts and `buildDrillSession` for question selection.

#### Quiz UI

No changes. The existing flow (question rendering, instant feedback, results screen with missed-questions review, weakness-queue write) is unaffected by the bank switch — only the data-load path changes.

#### Data load path

- Default: `fetch('../exams/cca-f/bank.json')` (replaces `fetch('../questions.json')`).
- `?src=<path>` override still works for custom banks if ever needed.
- Nav link `/practice/` lands on the setup screen directly. `picker.html` is deleted.

### E. Dungeon behavior

**Scene flow simplified to:** `Boot → Hub → BossFight → Interstitial → CampaignComplete`.

**`BootScene.ts`** absorbs the bank fetch:
```ts
// Replaces current assets-only Boot.
async create() {
  // ... asset loads as today ...
  const bank = await loadBank('./data/bank.json');
  this.registry.set('bank', bank);
  this.scene.start('HubScene');
}
```

**`BossFightScene.init`** changes the domain-lookup path:
```ts
// Before:
const domainData = questionsJson.domains.find(d => d.id === boss.domain);
if (!domainData || domainData.questions.length === 0) throw ...;
this.questions = pickQuestionsForFight(domainData.questions, maxQuestions);

// After:
const bank: Bank = this.registry.get('bank');
const domainPool = bank.questions.filter(q => q.domain === boss.domain);
if (domainPool.length === 0) throw ...;
this.questions = pickQuestionsForFight(domainPool, maxQuestions);
```

**`PickerScene`** retired. Deleted from `main.ts` scene array and from `src/scenes/`. `dungeonPicker.ts` + test deleted.

**Local-dev fallback:** `public/dungeon/public/data/bank.json` committed (copy of prod bank). CI overlay updates to `cp public/exams/cca-f/bank.json quartz/public/dungeon/data/bank.json`.

**Continue-run save compatibility:** `runSave.ts` stores `questionIds: string[]`. Existing saves reference `certsafari-*` IDs. Bank preserves these IDs (see §A). `BossFightScene.init`'s restore path (`restoreQuestionPool(save.inBoss.questionIds, domainPool)`) continues to work unchanged.

**Registry key rename:** `registry.set('questions', ...)` → `registry.set('bank', ...)`. All scene consumers updated (InterstitialScene's recall-question pick uses the same path).

### F. Generator + verifier reshape

**Renamed slash commands:**

- **`/cca-f-generate-questions [--count N --scenario S --domain D --seed SEED]`**
  - Generates N novel questions for the target scenario/domain via Claude API.
  - Grounded in the full CertSafari substrate (same substrate pattern as current `/cca-f-generate-exam`).
  - Emits `scenario: "<1–6>"` + `domain: "<slug>"` + `source: "llm"` at creation time (generator contract, NOT post-hoc classification).
  - Writes to `public/exams/cca-f/candidates/gen-<timestamp>.json` (one file per generator run).

- **`/cca-f-verify-questions <candidate-file>`**
  - Runs the existing 4-parallel-reviewer pass (fact-check, distractor audit, stale-term sweep, explanation audit).
  - Adds a 5th check: `scenario` + `domain` tag plausibility (reviewer verifies the self-reported tags match question content).
  - On clean review (zero critical/high): merges each question into `public/exams/cca-f/bank.json` (append to `bank.questions`, bump `bank.version`, update `bank.built_at`, update `bank.total`).
  - Keeps candidate file in `candidates/` as audit trail.
  - On issues: candidate stays in `candidates/` with flags recorded inline; user reviews and either edits or re-runs.
  - Calibration gate (10/10 planted-error detection, per `_calibration/bad-questions.json`) preserved and re-run on demand.

**Candidate folder lifecycle:**
- Keep merged candidate files indefinitely (audit trail).
- Failed candidates stay in `candidates/` with flags; user cleans manually.
- No automatic deletion policy.

**Command file paths:**
- `.claude/commands/cca-f-generate-questions.md` (new)
- `.claude/commands/cca-f-verify-questions.md` (new)
- `.claude/commands/cca-f-generate-exam.md` (delete)
- `.claude/commands/cca-f-verify-exam.md` (delete)

### G. Cleanup list

Delete:
- `public/exams/cca-f/verified/certsafari-seed{1,7,42,101,777}.json`
- `public/exams/cca-f/verified/index.json`
- `public/exams/cca-f/candidates/*.json` (wipe pre-migration; fresh slate for the new pipeline)
- `scripts/build-certsafari-exams.mjs` + `scripts/build-certsafari-exams.test.mjs`
- `public/practice/picker.html`
- `public/practice/picker.js`
- `public/practice/picker.test.mjs`
- `public/dungeon/src/scenes/PickerScene.ts`
- `public/dungeon/src/data/dungeonPicker.ts` + `public/dungeon/src/data/dungeonPicker.test.ts`
- `.claude/commands/cca-f-generate-exam.md`
- `.claude/commands/cca-f-verify-exam.md`

Modify:
- `public/dungeon/src/main.ts` — remove PickerScene from scene array
- `public/dungeon/src/scenes/BootScene.ts` — load bank, transition to Hub
- `public/dungeon/src/scenes/BossFightScene.ts` — flat-filter bank instead of nested domain lookup; rename `registry.questions` → `registry.bank`
- `public/dungeon/src/scenes/InterstitialScene.ts` — same registry-key rename for recall-question pick
- `public/dungeon/src/scenes/HubScene.ts` — same registry-key rename
- `public/practice/app.js` — data load switches to `bank.json`; domain-filter UI extended with scenario filter + intersection cross-validation
- `public/practice/index.html` — setup-screen markup for scenario filter
- `.github/workflows/quartz-deploy.yml` — overlay `bank.json` instead of `questions.json` for the Dungeon; drop picker-path references
- Top-level `README.md` and `certs/cca-f/README.md` — reference the new commands + bank surface

Add:
- `public/exams/cca-f/bank.json` (built via scripts)
- `public/dungeon/public/data/bank.json` (committed copy for local dev)
- `public/exams/arrangement.js` + `public/exams/arrangement.test.mjs`
- `scripts/build-bank.mjs` + `scripts/build-bank.test.mjs`
- `scripts/classify-scenarios.mjs`
- `.claude/commands/cca-f-generate-questions.md`
- `.claude/commands/cca-f-verify-questions.md`

### H. Testing plan

New / changed tests:

- **`arrangement.test.mjs`** (pure function, no DOM):
  - Seeded determinism: same seed + same bank → same output
  - Drift: same seed + extended bank → different output (documented behavior)
  - Domain weight respected: mock exam composition matches `domainWeights` within rounding
  - Scenario count: exactly `scenarioCount` of 6 scenarios represented
  - Filter intersection: correct count for given domain + scenario sets
  - Empty-filter safeguard: asserting buildDrillSession with impossible intersection throws or returns empty (documented)

- **`build-bank.test.mjs`**:
  - CertSafari ID preservation: all 364 raw ids present in bank
  - Schema conformance: every question has required fields
  - Scenario tag initially null (classification is a separate step)

- **ID-prefix invariant test** (new in bank-level test file):
  - Every `certsafari-*` has `source: "certsafari"` and vice versa
  - Every `gen-*` has `source: "llm"` and vice versa
  - No ID collisions across prefixes

- **Dungeon integration test** (existing vitest suite extended):
  - BossFightScene.init with bank-shaped registry entry filters correctly
  - InterstitialScene recall-question pick works against flat bank

- **Practice UI test** (could be a small vitest harness or just manual):
  - Domain-only filter produces correct count
  - Scenario-only filter produces correct count
  - Intersection produces correct count
  - Disabled-checkbox invariant: no selectable combination yields 0 questions

Regression tests to confirm survive:
- All existing Dungeon tests (107 pre-this-pass)
- Existing weakness-queue write/read (Practice results screen)
- Existing Continue-run save/restore (Dungeon F2)

### I. Rollout order (one PR, sequential commits acceptable)

1. Add `scripts/build-bank.mjs` + `scripts/classify-scenarios.mjs`. Run both. Commit `bank.json`.
2. Add `public/exams/arrangement.js` + tests. Commit.
3. Update Dungeon: BootScene + BossFightScene + InterstitialScene + HubScene + main.ts + committed `public/dungeon/public/data/bank.json`. Run dungeon test suite. Commit.
4. Update Practice UI: `app.js` + `index.html`. Commit.
5. Update `.github/workflows/quartz-deploy.yml` (bank.json overlay + drop picker paths). Commit.
6. Add `/cca-f-generate-questions` + `/cca-f-verify-questions` command files. Commit.
7. Delete retired files (seed exams, picker, old commands, build-certsafari-exams). Commit.
8. Update top-level README.md + `certs/cca-f/README.md`. Commit.
9. Local verification: full test suite, production build, manual smoke (Dungeon 2-boss run, Practice filter drill, Mock exam preset).
10. Push branch, open PR, merge squash, deploy, verify live.

### J. Implementation notes

- **Classification subagent:** dispatch via the SDK or a single Claude API call per question; either works. The output must be strict `{"scenario": "<1-6>", "justification": "..."}` JSON. Retry once on parse failure; skip on second failure (leaves `scenario: null`, user reviews manually).
- **Registry key change in Dungeon:** one-pass rename `registry.questions` → `registry.bank`; reuses Phaser's registry API, no Phaser-internal migration needed.
- **Bank version bumps:** `bank.version: 1` initially. Verifier merge bumps to `2`, then `3`, etc. Used for cache-busting if needed.
- **Deterministic PRNG:** mulberry32 (~20 lines), no dependency. Seed accepts any integer or string (string → hash → int).
- **Bank file size:** ~1.0–1.2 MB uncompressed at 364 Qs, ~250 KB gzipped over the wire. Grows ~3 KB per LLM-generated question. Not a concern for the CCA-F timeframe.

### K. Risk register

1. **Scenario classifier accuracy.** A fraction of the 364 questions may be misclassified. Mitigation: bank.json is hand-editable; user can override a bad tag via direct edit + PR. Also, the LLM pass logs justifications to stderr/log file during classification for post-hoc review.
2. **Bank growth unbounded.** As LLM-generated questions merge in, bank.json grows. Mitigation: no active mitigation needed at the CCA-F-exam horizon. If the bank ever exceeds ~5 MB, reshape to split-by-domain files loaded on demand.
3. **Generator scenario-tag quality.** New LLM questions self-report scenario; the 5th reviewer check (§F) validates plausibility. If reviewer fails, candidate stays in `candidates/` with flags. No silent bad tags.
4. **Practice `?src=` bookmarks.** Users with bookmarked seed-exam URLs will 404. Acceptable — solo operator, no external users.
5. **Registry key rename breaks uncaught consumer.** Grep for `registry.get('questions')` and `registry.set('questions'` to ensure all consumers updated.
6. **CI overlay path race.** Existing CI step has a rm -rf + cp sequence for dungeon dist. Must insert bank.json overlay AFTER dist wipe (same pattern as today's questions.json overlay).

## Out-of-scope, deferred

Nothing. All design elements ship together per user direction.

## Success criteria

- Bank.json exists, 364 CertSafari questions, all with scenario tags in `"1"`–`"6"`, all with `source: "certsafari"`.
- Practice default session (no filter) launches from bank.json, 20 random questions.
- Practice domain + scenario filter combinations produce correct counts; empty-intersection domains/scenarios visually disabled.
- Practice mock-exam preset generates 60 Qs from 4-of-6 scenarios with domain weighting.
- Dungeon boots → Hub → BossFight using bank-filtered questions per boss.
- Dungeon Continue-run save from a pre-migration saves still resumes (or gracefully clears if IDs don't resolve).
- Weakness-queue entries from a pre-migration practice session still resolve against bank.json.
- Full test suite passes (>107 tests; all new tests pass).
- `npm run build` clean.
- Live deploy: `silver-snoopy.github.io/ai-kb/practice/` loads, filters work; `silver-snoopy.github.io/ai-kb/dungeon/` plays through at least one boss.
- `/cca-f-generate-questions` + `/cca-f-verify-questions` available; one smoke run produces a valid candidate and merges cleanly.

## References

- Scenarios: `certs/cca-f/_scenarios.md` (authoritative 6-scenario taxonomy)
- CertSafari API + schema: `C:/Users/D/.claude/projects/c--projects-ai-kb/memory/reference_certsafari_api.md`
- Routing memory (supersedes): `C:/Users/D/.claude/projects/c--projects-ai-kb/memory/project_study_surfaces_routing_2026_04_20.md`
- Review retirement (out of scope): `C:/Users/D/.claude/projects/c--projects-ai-kb/memory/project_review_retired_2026_04_20.md`
- Prior CCA-F pipeline (reshaped by this spec): `C:/Users/D/.claude/projects/c--projects-ai-kb/memory/project_cca_f_pipeline_shipped.md`
