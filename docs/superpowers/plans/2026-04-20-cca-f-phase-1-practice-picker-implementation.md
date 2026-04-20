# CCA-F Phase 1 — Practice Picker + Enhanced Results Review

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a landing page at `public/practice/picker.html` that lists all `verified/` exams with metadata cards and launches `?src=` practice sessions on click. Enhance the existing results screen to show missed questions with full explanations.

**Architecture:** Two delta surfaces bolted onto the vanilla-JS practice app. The picker is a new static page that fetches `public/exams/cca-f/verified/index.json` and builds a card grid from exam metadata. The results enhancement modifies the existing `renderResults()` in `public/practice/app.js` to append an expandable "missed questions" section. No new runtime dependencies.

**Tech Stack:** Vanilla HTML + vanilla JS (ES modules) + the existing `style.css`. Node's built-in test runner (`node --test`) for pure-function unit tests. Playwright MCP for end-to-end smoke tests.

**Spec:** [docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md](../specs/2026-04-20-cca-f-exam-integration-design.md) §6.

---

## File structure

| Path | New/Modify | Responsibility |
|---|---|---|
| `public/practice/picker.html` | Create | Landing page markup: page shell, card grid container, loading/empty states. |
| `public/practice/picker.js` | Create | Fetch `verified/index.json`, fetch per-exam metadata for richer cards, render, wire click navigation. |
| `public/practice/picker.test.mjs` | Create | Pure-function unit tests for `buildCardData()` via `node --test`. |
| `public/practice/style.css` | Modify (append) | Add card-grid styles. Keep existing classes untouched. |
| `public/practice/app.js` | Modify | Enhance `renderResults()` — append missed-questions section with stems/correct-answer/explanation. |

---

## Discovered context (from reading the current codebase)

- `public/practice/app.js` has three rendered states: `'setup' | 'quiz' | 'results'`.
- `renderResults()` at ~line 248 already computes per-domain scores AND auto-saves missed questions to `localStorage['weakness-queue']` as `{id, domain, stem (first 200 chars), correct, given, saved_at}`.
- The current results markup shows overall score + per-domain breakdown. It does NOT currently show the actual missed questions.
- `public/practice/index.html` accepts `?src=<path>` URL param and loads the JSON from there.
- `public/exams/cca-f/verified/index.json` exists with 5 entries (seeds 1, 7, 42, 101, 777), each marked `source: "certsafari-curated"`.

---

## Task 1: Picker page shell (HTML + CSS)

**Files:**
- Create: `public/practice/picker.html`
- Modify: `public/practice/style.css` (append)

- [ ] **Step 1.1: Read `public/practice/index.html`** to match the existing page shell style (fonts, <head> structure, imports).

- [ ] **Step 1.2: Create `public/practice/picker.html`** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CCA-F Practice — Pick an exam</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="page">
    <header class="page-head">
      <h1>CCA-F Practice</h1>
      <p class="text-soft">Pick an exam pool to begin.</p>
    </header>
    <section id="exam-grid" class="exam-grid" aria-live="polite">
      <p class="text-soft">Loading exams…</p>
    </section>
  </main>
  <script type="module" src="./picker.js"></script>
</body>
</html>
```

The `#exam-grid` is the insertion point for `picker.js` to render cards into. The initial "Loading…" copy is the placeholder before fetch completes.

- [ ] **Step 1.3: Append to `public/practice/style.css`** — add these styles (keep existing rules; append at end):

```css
/* --- picker page --- */
.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.exam-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.1rem;
  border: 1px solid currentColor;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition: transform 0.08s ease, border-color 0.12s ease;
}

.exam-card:hover,
.exam-card:focus-visible {
  transform: translateY(-1px);
  border-color: var(--accent, currentColor);
  outline: none;
}

.exam-card__title {
  font-weight: 600;
  font-size: 1.05rem;
}

.exam-card__meta {
  font-size: 0.85em;
  color: var(--soft, #777);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
}

.exam-card__badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75em;
  border: 1px solid currentColor;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.exam-card__warn {
  font-size: 0.8em;
  color: #d66;
}

.exam-card__launch {
  margin-top: auto;
  font-size: 0.85em;
  opacity: 0.8;
}
```

- [ ] **Step 1.4: Smoke-check via Playwright** — start HTTP server (`python -m http.server 8000 --directory public` or `npx -y http-server public -p 8000 -c-1` fallback, `run_in_background: true`). Navigate to `http://localhost:8000/practice/picker.html`. Verify:
  - Title bar reads "CCA-F Practice — Pick an exam".
  - The "Loading exams…" placeholder is visible.
  - No JS errors in console (expected: picker.js 404 since Step 2 hasn't created it yet — that's OK but note it).
  
  Kill server when done.

- [ ] **Step 1.5: Commit**

```bash
git add public/practice/picker.html public/practice/style.css
git commit -m "$(cat <<'EOF'
feat(practice): picker page shell + card-grid styles

New public/practice/picker.html landing page. Adds card-grid CSS to
style.css for exam cards with hover/focus affordances. Logic comes
in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Picker logic (TDD)

**Files:**
- Create: `public/practice/picker.js`
- Create: `public/practice/picker.test.mjs`

The picker's work:
1. Fetch `../exams/cca-f/verified/index.json` (relative to picker.html)
2. For each registry entry, fetch the exam JSON to pull richer metadata (`exam_metadata.seed`, `exam_metadata.source`, `exam_metadata.composition`, `exam_metadata.difficulty_actual`, `exam_metadata.coverage_warnings`, `total`, `built_at`).
3. Build card descriptors, render them into `#exam-grid`.
4. Clicking a card navigates to `./index.html?src=<exam-path-relative-to-practice-dir>`.

The path transformation is tricky and unit-testable, so extract a pure function.

### What "path transformation" means

- Registry entries store `path` as repo-relative: `public/exams/cca-f/verified/certsafari-seed42.json`.
- The practice page at `public/practice/index.html` needs an `src` relative to its own directory: `../exams/cca-f/verified/certsafari-seed42.json`.
- The picker.js builds this transform.

- [ ] **Step 2.1: Write `public/practice/picker.test.mjs`** (tests first):

```javascript
// public/practice/picker.test.mjs
// Run: node --test public/practice/picker.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardData, toPracticeSrc } from './picker.js';

test('toPracticeSrc converts repo-relative path to practice-relative src', () => {
  assert.equal(
    toPracticeSrc('public/exams/cca-f/verified/certsafari-seed42.json'),
    '../exams/cca-f/verified/certsafari-seed42.json'
  );
});

test('toPracticeSrc leaves already-practice-relative paths alone', () => {
  assert.equal(
    toPracticeSrc('../exams/foo.json'),
    '../exams/foo.json'
  );
});

test('toPracticeSrc throws on unexpected shapes', () => {
  assert.throws(() => toPracticeSrc(''), /path/i);
  assert.throws(() => toPracticeSrc(null), /path/i);
});

test('buildCardData produces one entry per registry exam, merged with exam-file metadata', () => {
  const registry = {
    exams: [
      { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
      { path: 'public/exams/cca-f/verified/gen-1000.json', seed: 1000, source: 'generated', total: 60 },
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
    '../exams/cca-f/verified/gen-1000.json': {
      built_at: '2026-04-20T11:00:00Z',
      total: 60,
      exam_metadata: {
        seed: 1000,
        source: 'generated',
        scenarios_kept: ['a', 'b', 'c', 'd'],
        scenarios_dropped: ['e', 'f'],
        difficulty_actual: { easy: 9, medium: 30, hard: 21 },
        coverage_warnings: [],
      },
    },
  };
  const cards = buildCardData(registry, examFiles);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].src, '../exams/cca-f/verified/certsafari-seed42.json');
  assert.equal(cards[0].seed, 42);
  assert.equal(cards[0].source, 'certsafari-curated');
  assert.equal(cards[0].total, 60);
  assert.equal(cards[0].composition, 'certsafari-mixed');
  assert.equal(cards[1].seed, 1000);
  assert.equal(cards[1].source, 'generated');
  assert.ok(cards[1].difficulty === 'E9/M30/H21' || cards[1].difficulty === 'E:9 M:30 H:21' || /^E.?9/.test(cards[1].difficulty));
});

test('buildCardData tolerates missing exam files (degraded card, still renderable)', () => {
  const registry = {
    exams: [
      { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
    ],
  };
  const examFiles = {}; // none loaded
  const cards = buildCardData(registry, examFiles);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].seed, 42);
  assert.equal(cards[0].source, 'certsafari-curated');
  // Should still produce a src:
  assert.equal(cards[0].src, '../exams/cca-f/verified/certsafari-seed42.json');
});

test('buildCardData surfaces coverage_warnings as a string array on the card', () => {
  const registry = {
    exams: [{ path: 'public/exams/cca-f/verified/gen-2000.json', seed: 2000, source: 'generated', total: 60 }],
  };
  const examFiles = {
    '../exams/cca-f/verified/gen-2000.json': {
      exam_metadata: {
        seed: 2000,
        source: 'generated',
        coverage_warnings: ['Domain 2 has 0 questions'],
      },
    },
  };
  const cards = buildCardData(registry, examFiles);
  assert.deepEqual(cards[0].warnings, ['Domain 2 has 0 questions']);
});
```

- [ ] **Step 2.2: Run tests — expected to fail** (module doesn't exist yet):

```bash
node --test public/practice/picker.test.mjs
```
Expected: ENOENT or module-not-found.

- [ ] **Step 2.3: Create `public/practice/picker.js`**:

```javascript
// public/practice/picker.js
// Renders a grid of verified-exam cards. Click launches practice with ?src=.

/** @param {string} repoPath e.g. 'public/exams/cca-f/verified/foo.json'
 *  @returns {string} practice-dir-relative src e.g. '../exams/cca-f/verified/foo.json' */
export function toPracticeSrc(repoPath) {
  if (typeof repoPath !== 'string' || repoPath.length === 0) {
    throw new Error(`toPracticeSrc: invalid path: ${String(repoPath)}`);
  }
  if (repoPath.startsWith('public/')) return '../' + repoPath.slice('public/'.length);
  return repoPath;
}

/** Build card descriptors by merging registry entries with per-exam metadata.
 *  @param {{exams: Array}} registry — parsed verified/index.json
 *  @param {Record<string, any>} examFiles — map of practice-relative src → parsed exam JSON
 *  @returns {Array<{src, seed, source, total, composition?, difficulty?, scenarioSummary?, warnings, builtAt?}>} */
export function buildCardData(registry, examFiles) {
  const out = [];
  for (const entry of registry.exams || []) {
    const src = toPracticeSrc(entry.path);
    const exam = examFiles[src];
    const meta = exam?.exam_metadata || {};
    const card = {
      src,
      seed: meta.seed ?? entry.seed,
      source: meta.source ?? entry.source ?? 'unknown',
      total: exam?.total ?? entry.total ?? null,
      composition: meta.composition,
      builtAt: exam?.built_at,
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

// ---------- runtime (skipped when imported by tests) ----------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatCard(card) {
  const badge = `<span class="exam-card__badge">${escapeHtml(card.source)}</span>`;
  const meta = [
    `seed <strong>${escapeHtml(String(card.seed))}</strong>`,
    card.total ? `${card.total} Qs` : null,
    card.difficulty ?? null,
    card.scenarioSummary ?? null,
    card.composition ? escapeHtml(card.composition) : null,
  ].filter(Boolean).join(' · ');
  const warnings = card.warnings.length
    ? `<div class="exam-card__warn">&#9888;&#65039; ${card.warnings.map(escapeHtml).join('; ')}</div>`
    : '';
  return `
    <button class="exam-card" data-src="${escapeHtml(card.src)}" type="button">
      <span class="exam-card__title">Exam · seed ${escapeHtml(String(card.seed))}</span>
      ${badge}
      <span class="exam-card__meta">${meta}</span>
      ${warnings}
      <span class="exam-card__launch">Click to start →</span>
    </button>
  `;
}

async function loadExamFile(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  const grid = document.getElementById('exam-grid');
  if (!grid) return;
  let registry;
  try {
    const res = await fetch('../exams/cca-f/verified/index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    registry = await res.json();
  } catch (e) {
    grid.innerHTML = `<p class="text-soft">Couldn't load verified-exam registry: ${escapeHtml(e.message)}</p>`;
    return;
  }
  if (!registry?.exams?.length) {
    grid.innerHTML = `<p class="text-soft">No verified exams yet. Run <code>node scripts/build-certsafari-exams.mjs --seed &lt;N&gt;</code> to seed some.</p>`;
    return;
  }
  // Fan out per-exam fetches.
  const srcs = registry.exams.map(e => toPracticeSrc(e.path));
  const files = await Promise.all(srcs.map(loadExamFile));
  const examFiles = Object.fromEntries(srcs.map((s, i) => [s, files[i]]).filter(([, v]) => v));
  const cards = buildCardData(registry, examFiles);
  grid.innerHTML = cards.map(formatCard).join('');
  grid.querySelectorAll('.exam-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      if (src) window.location.href = `./index.html?src=${encodeURIComponent(src)}`;
    });
  });
}

// Only run main() in a browser, not when imported by node --test.
if (typeof document !== 'undefined') {
  main();
}
```

- [ ] **Step 2.4: Run tests — all should pass**:

```bash
node --test public/practice/picker.test.mjs
```
Expected: `# tests 6` / `# pass 6` / `# fail 0`.

- [ ] **Step 2.5: End-to-end Playwright check**:
  - Start HTTP server in background (as in Task 1 Step 1.4).
  - Navigate to `http://localhost:8000/practice/picker.html`.
  - Snapshot: verify 5 cards render (one per verified exam).
  - Click the seed-42 card.
  - Verify URL navigates to `./index.html?src=...certsafari-seed42.json`.
  - Verify practice setup screen renders (same behavior as Task 7 smoke test in Plan 1).
  - Kill server when done.

- [ ] **Step 2.6: Commit**

```bash
git add public/practice/picker.js public/practice/picker.test.mjs
git commit -m "$(cat <<'EOF'
feat(practice): picker logic — fetch verified/index.json, render card grid

Exports two pure functions for testability: toPracticeSrc (path
transform) and buildCardData (registry + exam files → card descriptors).
6 unit tests covering path transform, metadata merging, missing-file
fallback, and coverage-warning surfacing. Runtime fetches the registry,
fans out per-exam metadata pulls in parallel, renders button-cards,
navigates to practice ?src= on click.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Post-attempt missed-questions review

**Files:**
- Modify: `public/practice/app.js` — extend `renderResults()` to include missed-questions section

**Current state (discovered):** `renderResults()` at ~line 248 computes `answered`, filters `wrong = answered.filter(x => x.given !== null && x.given !== x.q.correct)`, auto-saves wrongs to localStorage, renders score + per-domain table. Does NOT currently show the missed questions themselves.

**Enhancement:** Append a collapsed-by-default "Missed questions" `<details>` section after the per-domain table. Each missed question shows:
- Stem (first ~300 chars, with a "…" if truncated)
- Correct answer letter + the text of that option
- What the user picked (letter + option text)
- The explanation (rendered safely)

Leave unanswered questions out (they're not "missed" in the wrong-answer sense; they're abandoned).

- [ ] **Step 3.1: Read `public/practice/app.js`** in full to locate the `renderResults()` function and its existing markup (the `app.innerHTML = ...` template literal). Identify the insertion point — after the per-domain table, before any closing tag.

- [ ] **Step 3.2: Add a new helper** near the existing `escapeHtml` / `formatStem` helpers — call it `renderMissedQuestions(wrong)` that takes the already-computed `wrong` array and returns an HTML string for a `<details>` section:

```javascript
function renderMissedQuestions(wrong) {
  if (wrong.length === 0) return '<p class="text-soft">No missed questions — all answered items were correct.</p>';
  const items = wrong.map(({ q, given }) => {
    const correctText = q.options[q.correct] ?? '';
    const givenText = given != null ? (q.options[given] ?? '') : '(unanswered)';
    const stem = q.stem.length > 300 ? q.stem.slice(0, 300) + '…' : q.stem;
    return `
      <li class="missed-item">
        <p class="missed-item__stem">${escapeHtml(stem)}</p>
        <dl class="missed-item__ans">
          <dt>Your answer</dt><dd><span class="mono">${escapeHtml(given ?? '—')}</span> ${escapeHtml(givenText)}</dd>
          <dt>Correct</dt><dd><span class="mono">${escapeHtml(q.correct)}</span> ${escapeHtml(correctText)}</dd>
        </dl>
        <details class="missed-item__explain">
          <summary>Why</summary>
          <p>${escapeHtml(q.explanation)}</p>
        </details>
      </li>
    `;
  }).join('');
  return `
    <details class="missed-section">
      <summary><strong>${wrong.length}</strong> missed question${wrong.length === 1 ? '' : 's'}</summary>
      <ol class="missed-list">${items}</ol>
    </details>
  `;
}
```

- [ ] **Step 3.3: Wire it into the results HTML**. Find the existing `app.innerHTML = \`<section class="results">...\`` block and insert `${renderMissedQuestions(wrong)}` AFTER the per-domain breakdown but before the closing `</section>`.

- [ ] **Step 3.4: Add CSS** to `public/practice/style.css` (append):

```css
/* --- missed-questions section --- */
.missed-section {
  margin-top: 1.5rem;
  border-top: 1px solid currentColor;
  padding-top: 1rem;
}

.missed-section > summary {
  cursor: pointer;
  font-size: 0.95em;
}

.missed-list {
  list-style: decimal;
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.missed-item__stem {
  margin: 0.25rem 0;
  font-size: 0.95em;
}

.missed-item__ans {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.75rem;
  font-size: 0.85em;
  margin: 0.4rem 0 0.4rem 0;
}

.missed-item__ans dt {
  font-weight: 600;
  color: var(--soft, #777);
}

.missed-item__ans dd {
  margin: 0;
}

.missed-item__explain {
  font-size: 0.85em;
}

.missed-item__explain > summary {
  cursor: pointer;
  color: var(--soft, #777);
}

.missed-item__explain p {
  margin-top: 0.5rem;
  white-space: pre-wrap;
}
```

- [ ] **Step 3.5: Smoke-test via Playwright**:
  - Start HTTP server.
  - Navigate to `http://localhost:8000/practice/index.html?src=../exams/cca-f/verified/certsafari-seed42.json`.
  - Click Start.
  - Answer a few questions deliberately wrong (click any option that's not the correct one). Answer at least 3 questions total, with at least 1 intentionally wrong.
  - Use keyboard shortcut to skip rapidly if there's a "skip" feature, or just click through. If the quiz is 25 questions, answer ~5 and then "abandon" to go to results (there's an abandon button at line 218).
  - On results screen, verify the `<details>` "Missed questions" section renders with at least one missed item showing stem, "Your answer" / "Correct" dl, and a nested "Why" collapsible for the explanation.
  - Kill server.

- [ ] **Step 3.6: Commit**

```bash
git add public/practice/app.js public/practice/style.css
git commit -m "$(cat <<'EOF'
feat(practice): results screen shows missed questions with explanations

Appends a collapsible <details> "Missed questions" section after the
per-domain breakdown. Each item lists the stem (truncated to 300 chars),
the user's answer vs. the correct one, and a nested <details> for the
explanation. Unanswered items are not treated as "missed" — only
incorrect ones surface here.

Pairs with the existing localStorage weakness-queue write path (Phase 3
will add the read-side re-drill mode).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Integration smoke test

**Goal:** Verify the full loop: picker → launch → quiz → results → missed-questions review.

- [ ] **Step 4.1: Playwright end-to-end walk**:
  - Start HTTP server.
  - Navigate to `http://localhost:8000/practice/picker.html`.
  - Verify 5 cards render.
  - Click any card (pick seed 7 so it differs from seed 42 used in other smoke tests).
  - On setup screen, click Start.
  - Answer 3 questions — intentionally miss at least 2.
  - Click abandon to trigger results.
  - Verify: score shown, per-domain breakdown rendered, `<details>` for missed questions is present and expandable, at least 2 missed-question entries inside.
  - Take a screenshot of the final results view.
  - Kill server.

- [ ] **Step 4.2: If all pass, no commit needed** — this is verification only. If something fails, STOP and report BLOCKED with the symptom.

---

## Task 5: Handoff

**Deliverables after Task 4:**
- [ ] `public/practice/picker.html` — landing page
- [ ] `public/practice/picker.js` + `picker.test.mjs` (6 tests passing)
- [ ] `public/practice/style.css` extended with picker + missed-questions styles
- [ ] `public/practice/app.js` enhanced with missed-questions review
- [ ] End-to-end flow verified via Playwright

**What's now shippable:**
- User opens `public/practice/picker.html`, picks a CertSafari-sourced exam, practices, sees missed questions with explanations.
- No more hand-editing `?src=` URLs.

**Unblocked for Plan 2 (Generator + verifier):**
- Generator will write to `candidates/`; verified ones promoted to `verified/`. Picker auto-picks them up because it reads `verified/index.json` dynamically.
- Picker will render generated-exam cards with scenario summary + difficulty badges (the code already handles both `certsafari-curated` and `generated` sources via the pure function `buildCardData`).

**Unblocked for Plan 4 (Phase 3 Weakness queue):**
- The localStorage weakness queue is already being populated by existing code.
- Plan 4 adds the READ/re-drill path: a new mode `?review=weak` that pulls from localStorage and filters questions across exams.

---

## Deferred / out of scope for this plan

- Spaced-repetition metadata on the localStorage queue (e.g., last-drilled timestamp, n-correct counter) — Plan 4 territory.
- Filtering/sorting picker cards by difficulty, source, or domain — wait for user signal that it's needed.
- `save to file` path (writing `certs/cca-f/weakness-queue.md`) — currently the queue is localStorage-only; a disk mirror would need an auth mechanism this static app doesn't have. Deferred until needed.
- Picker display for generator-output-specific metadata (subdomain coverage breakdown, provenance file preview) — wait for Plan 2 to define those shapes concretely.

---

## Success criteria

- [ ] Picker page loads at `public/practice/picker.html` and renders 5 cards from the existing `verified/index.json`.
- [ ] All 6 `picker.test.mjs` unit tests pass.
- [ ] Clicking a card navigates to the practice page with the correct `?src=` URL.
- [ ] The practice results screen includes a "Missed questions" `<details>` that, when expanded, lists each missed question with stem, your-vs-correct answer, and expandable "Why" explanation.
- [ ] No regressions in existing practice flow (setup/quiz/results still work).
