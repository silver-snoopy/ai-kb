# CCA-F Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-seed `public/exams/cca-f/verified/` with 5 CertSafari-sourced practice exams so Phase 1 (Practice picker) has real content to consume. Completes CertSafari extraction (220 → 336) and builds a reusable script for future exam curation.

**Architecture:** One-off extraction run (domains D3-prompt + D5-context) to grow the raw bank, then a new deterministic Node script (`scripts/build-certsafari-exams.mjs`) that samples seeded 60-question exams from the bank with domain-weight balancing per `meta.yaml`. Output JSON matches the schema in `public/questions.json` so the existing practice UI and dungeon consume it unchanged.

**Tech Stack:** Node.js 20+ (ESM), `scripts/extract-certsafari.mjs` (existing), mulberry32 seeded RNG (pure, no deps), vanilla JSON. No new runtime dependencies.

**Spec:** [docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md](../specs/2026-04-20-cca-f-exam-integration-design.md) §5.

---

## File structure

| Path | New/Modify | Responsibility |
|---|---|---|
| `scripts/extract-certsafari.mjs` | Modify (line 14 comment, line 62 constant) | Pacing bump 2500→2600ms. One-line code + comment fix. |
| `raw/certsafari/cca-f-questions.json` | Modify (append) | Grow bank from 220 → ~336 Qs (extraction output). |
| `certs/cca-f/domain-3-prompt-engineering/certsafari-questions.md` | Create | Per-domain extractor side-output (new). |
| `certs/cca-f/domain-5-context/certsafari-questions.md` | Create | Per-domain extractor side-output (new). |
| `public/questions.json` | Modify | Rebuild via `scripts/build-questions.mjs` after extraction. |
| `scripts/build-certsafari-exams.mjs` | Create | New: samples N seeded 60-Q exams from the CertSafari bank with domain balancing. |
| `scripts/build-certsafari-exams.test.mjs` | Create | Vitest/node:test unit tests for the new script. |
| `public/exams/cca-f/verified/certsafari-<seed>.json` | Create × 5 | 5 pre-seeded exams, one per seed. |
| `public/exams/cca-f/verified/index.json` | Create | Registry of verified exams. |

---

## Task 1: Bump extractor pacing 2500→2600ms (Step 1a)

**Files:**
- Modify: `scripts/extract-certsafari.mjs` (line 14 comment, line 62 `PACING_MS`)

- [ ] **Step 1.1: Read lines 14 and 62 to confirm current state**

Run: read `scripts/extract-certsafari.mjs` offset=10 limit=55

Expected: line 14 = `// - 500ms pacing between /api/questions calls to avoid per-minute rate limit.`, line 62 = `const PACING_MS = 2500;`

- [ ] **Step 1.2: Update the constant and stale comment**

Change line 62 `2500` → `2600`. Change line 14 comment from `500ms` to `2600ms`. Use Edit tool with two targeted edits.

- [ ] **Step 1.3: Verify via grep**

Run: `grep -n "PACING_MS\|ms pacing" scripts/extract-certsafari.mjs`
Expected output should show `PACING_MS = 2600` on line 62 and `2600ms pacing` on line 14. No other occurrences.

- [ ] **Step 1.4: Commit**

```bash
git add scripts/extract-certsafari.mjs
git commit -m "fix(certsafari): bump extractor pacing 2500→2600ms

Prior value was on the edge of the ~30 req/min per-minute cap; user
observed occasional 429s. 2600ms gives ~4% headroom (23 req/min) at
~10% throughput cost, which is free since the binding constraint is
the 150/day daily cap, not throughput. Also fixes a stale '500ms'
header comment that never matched the constant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Canary extraction on domain-3-prompt-engineering

**Goal:** Prove the 2600ms pacing holds up before committing to the full 144-question run. If the canary hits 429s, we adjust before wasting the daily quota.

**Files:**
- Modify: `raw/certsafari/cca-f-questions.json` (append)
- Create: `certs/cca-f/domain-3-prompt-engineering/certsafari-questions.md`

**Precondition:** User has provided `CERTSAFARI_USER_ID` (from memory `reference_certsafari_api.md`: `98d8e896-109d-454f-b5df-f28f49f5c240`).

- [ ] **Step 2.1: Pre-run snapshot**

Run: `node -e "const d=JSON.parse(require('fs').readFileSync('raw/certsafari/cca-f-questions.json','utf8'));console.log('pre:',d.total)"`
Expected: `pre: 220`

- [ ] **Step 2.2: Run extraction for domain-3-prompt-engineering**

Run:
```bash
CERTSAFARI_USER_ID=98d8e896-109d-454f-b5df-f28f49f5c240 node scripts/extract-certsafari.mjs --domain domain-3-prompt-engineering
```

Expected runtime: ~72 questions × 2.6s ≈ 3 minutes. Watch stdout for:
- `Using user_id: 98d8...` line
- Per-question progress markers
- NO `HTTP 429` errors (if you see one in the first 10 requests, abort and ask me — pacing likely needs to go higher)
- Final `Wrote raw/certsafari/cca-f-questions.json (total: 292)` or similar

- [ ] **Step 2.3: Post-run verification**

Run:
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('raw/certsafari/cca-f-questions.json','utf8'));const c={};for(const q of d.questions){c[q.domain]=(c[q.domain]||0)+1}console.log('total:',d.total);for(const[k,v]of Object.entries(c))console.log(v,'|',k)"
```

Expected: `total: 292` (220 + 72), and the output now includes a new row `72 | Domain 4: Prompt Engineering & Structured Output`. CertSafari D4 maps to vault `domain-3-prompt-engineering` per the mapping table in `reference_certsafari_api.md`.

Verify the per-domain markdown was created:
```bash
ls -la certs/cca-f/domain-3-prompt-engineering/certsafari-questions.md
```
Expected: file exists, non-empty.

- [ ] **Step 2.4: Commit canary result**

```bash
git add raw/certsafari/cca-f-questions.json certs/cca-f/domain-3-prompt-engineering/certsafari-questions.md
git commit -m "data(cca-f): extract CertSafari D4 (Prompt Engineering) — 72 Qs

Completes vault domain-3-prompt-engineering CertSafari coverage.
Raw bank: 220 → 292. Canary run for the 2600ms pacing bump — no
rate-limit hits observed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Extract remaining — domain-5-context

**Goal:** Complete the second missing CertSafari domain. After this, daily rate limit is depleted (~144 fetched of 150 allowed) — any remaining extraction must wait until tomorrow.

**Files:**
- Modify: `raw/certsafari/cca-f-questions.json` (append)
- Create: `certs/cca-f/domain-5-context/certsafari-questions.md`

- [ ] **Step 3.1: Run extraction for domain-5-context**

Run:
```bash
CERTSAFARI_USER_ID=98d8e896-109d-454f-b5df-f28f49f5c240 node scripts/extract-certsafari.mjs --domain domain-5-context
```

Expected runtime: ~72 × 2.6s ≈ 3 minutes. Watch for:
- `Using user_id:` line
- Progress markers
- IF you see `Daily rate limit … exceeded` mid-run: the script will abort cleanly. Note how many were fetched, commit whatever landed, resume tomorrow with `--domain domain-5-context` again (the script dedupes on `id`).

- [ ] **Step 3.2: Post-run verification**

Run:
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('raw/certsafari/cca-f-questions.json','utf8'));const c={};for(const q of d.questions){c[q.domain]=(c[q.domain]||0)+1}console.log('total:',d.total);for(const[k,v]of Object.entries(c))console.log(v,'|',k)"
```

Expected: `total: 364` (or close, if daily-limit-trimmed). All 5 CertSafari domains represented.

- [ ] **Step 3.3: Commit**

```bash
git add raw/certsafari/cca-f-questions.json certs/cca-f/domain-5-context/certsafari-questions.md
git commit -m "data(cca-f): extract CertSafari D5 (Context) — 72 Qs

Completes CertSafari extraction — all 5 domains now represented.
Raw bank: 292 → 364.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Rebuild public/questions.json

**Files:**
- Modify: `public/questions.json` (regenerated from vault markdown)

- [ ] **Step 4.1: Run the build script**

Run: `node scripts/build-questions.mjs`
Expected: stdout reports the new count per domain, e.g. `extracted N questions, writing public/questions.json`. No errors.

- [ ] **Step 4.2: Verify the total grew**

Run:
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('public/questions.json','utf8'));console.log('total:',d.total);for(const[k,v]of Object.entries(d.by_domain))console.log(v,'|',k)"
```

Expected: total approximately 376 (364 CertSafari + 12 official samples), all 5 vault domain slugs present with non-zero counts.

- [ ] **Step 4.3: Commit**

```bash
git add public/questions.json
git commit -m "build(cca-f): rebuild questions.json after CertSafari D4+D5 extraction

Total 232 → ~376. All 5 vault domains now have CertSafari coverage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Author `scripts/build-certsafari-exams.mjs` (TDD)

**Files:**
- Create: `scripts/build-certsafari-exams.mjs` — new deterministic exam builder
- Create: `scripts/build-certsafari-exams.test.mjs` — unit tests (node:test)

**What it does:** Takes the full CertSafari bank from `raw/certsafari/cca-f-questions.json`, samples a seeded 60-question exam with domain balance per `certs/cca-f/meta.yaml` weights, writes to `public/exams/cca-f/verified/certsafari-<seed>.json`. Reusable — one invocation per exam.

**CLI contract:**
```
node scripts/build-certsafari-exams.mjs --seed <N> [--size 60] [--out <path>]
```

**Output JSON shape:** matches `public/questions.json` with two additions:
- `exam_metadata.source = "certsafari-curated"`
- `exam_metadata.verified_by = "source-is-ground-truth"`

- [ ] **Step 5.1: Write the failing test scaffold**

Create `scripts/build-certsafari-exams.test.mjs`:

```javascript
// scripts/build-certsafari-exams.test.mjs
// Run: node --test scripts/build-certsafari-exams.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { buildExam, transformQuestion, domainQuota } = await import('./build-certsafari-exams.mjs');

const rawBank = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'raw', 'certsafari', 'cca-f-questions.json'), 'utf8')
);

test('transformQuestion maps CertSafari shape to exam shape', () => {
  const cs = rawBank.questions[0];
  const q = transformQuestion(cs);
  assert.equal(q.id.startsWith('certsafari-'), true);
  assert.ok(['domain-1-agentic','domain-2-claude-code','domain-3-prompt-engineering','domain-4-mcp','domain-5-context'].includes(q.domain));
  assert.equal(typeof q.stem, 'string');
  assert.equal(typeof q.options.A, 'string');
  assert.equal(typeof q.options.B, 'string');
  assert.equal(typeof q.options.C, 'string');
  assert.equal(typeof q.options.D, 'string');
  assert.match(q.correct, /^[A-D]$/);
  assert.equal(typeof q.explanation, 'string');
  assert.equal(q['source-note'].startsWith('raw/certsafari/'), true);
});

test('domainQuota returns target counts proportional to meta.yaml weights', () => {
  const q = domainQuota(60);
  assert.equal(q['domain-1-agentic'] + q['domain-2-claude-code'] + q['domain-3-prompt-engineering'] + q['domain-4-mcp'] + q['domain-5-context'], 60);
  // Weights 27/20/20/18/15 → expect roughly 16/12/12/11/9 for 60-Q
  assert.ok(q['domain-1-agentic'] >= 15 && q['domain-1-agentic'] <= 17);
  assert.ok(q['domain-5-context'] >= 8 && q['domain-5-context'] <= 10);
});

test('buildExam(42,60) produces 60 questions with domain balance', () => {
  const exam = buildExam(42, 60, rawBank);
  assert.equal(exam.total, 60);
  assert.equal(exam.questions.length, 60);
  const counts = {};
  for (const q of exam.questions) counts[q.domain] = (counts[q.domain] || 0) + 1;
  // All 5 domains must be represented
  assert.equal(Object.keys(counts).length, 5);
});

test('buildExam is seed-deterministic', () => {
  const a = buildExam(42, 60, rawBank);
  const b = buildExam(42, 60, rawBank);
  assert.deepEqual(a.questions.map(q => q.id), b.questions.map(q => q.id));
});

test('buildExam metadata tags source correctly', () => {
  const exam = buildExam(7, 60, rawBank);
  assert.equal(exam.exam_metadata.source, 'certsafari-curated');
  assert.equal(exam.exam_metadata.verified_by, 'source-is-ground-truth');
  assert.equal(exam.exam_metadata.seed, 7);
});
```

- [ ] **Step 5.2: Run tests — they should fail because the script doesn't exist**

Run: `node --test scripts/build-certsafari-exams.test.mjs`
Expected: FAIL with "Cannot find module './build-certsafari-exams.mjs'" or similar.

- [ ] **Step 5.3: Implement the script**

Create `scripts/build-certsafari-exams.mjs`:

```javascript
// scripts/build-certsafari-exams.mjs
// Builds deterministic 60-Q exams from the CertSafari bank.
// Output bypasses /cca-f-verify-exam because the source is pre-verified.
//
// Usage: node scripts/build-certsafari-exams.mjs --seed <N> [--size 60] [--out <path>]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vault = resolve(scriptDir, '..');

// CertSafari → vault slug map. Mirrors scripts/extract-certsafari.mjs DOMAINS.
const CS_DOMAIN_TO_SLUG = {
  'Domain 1: Agentic Architecture & Orchestration':   'domain-1-agentic',
  'Domain 2: Tool Design & MCP Integration':          'domain-4-mcp',
  'Domain 3: Claude Code Configuration & Workflows':  'domain-2-claude-code',
  'Domain 4: Prompt Engineering & Structured Output': 'domain-3-prompt-engineering',
  'Domain 5: Context Management & Reliability':       'domain-5-context',
};

const DOMAIN_META = {
  'domain-1-agentic':            { num: 1, name: 'Agentic Architecture & Orchestration', weight: 0.27, color: '#f39c4a' },
  'domain-2-claude-code':        { num: 2, name: 'Claude Code Configuration & Workflows', weight: 0.20, color: '#a87cf0' },
  'domain-3-prompt-engineering': { num: 3, name: 'Prompt Engineering & Structured Output', weight: 0.20, color: '#5db5f0' },
  'domain-4-mcp':                { num: 4, name: 'Tool Design & MCP Integration', weight: 0.18, color: '#5ad1a0' },
  'domain-5-context':            { num: 5, name: 'Context Management & Reliability', weight: 0.15, color: '#e85d75' },
};

// mulberry32 — pure seeded PRNG, same as /cca-f-generate-exam uses.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Transform a CertSafari question object to our exam question shape. */
export function transformQuestion(cs) {
  const slug = CS_DOMAIN_TO_SLUG[cs.domain];
  if (!slug) throw new Error(`Unknown CertSafari domain: ${cs.domain}`);
  const options = { A: cs.options[0], B: cs.options[1], C: cs.options[2], D: cs.options[3] };
  const correct = cs.correct_answers?.[0] ?? 'A';
  // Flatten explanations array to "A: ...\nB: ...\nC: ...\nD: ..." matching public/questions.json certsafari entries.
  const explanation = (cs.explanations || [])
    .map(e => `${e.option}: ${e.explanation}`)
    .join('\n');
  return {
    id: `certsafari-${slug}-${String(cs.id).padStart(3, '0')}`,
    domain: slug,
    difficulty: 'medium', // CertSafari doesn't tag difficulty; default medium.
    stem: cs.question,
    options,
    options_array: [options.A, options.B, options.C, options.D],
    correct,
    explanation,
    'source-note': `raw/certsafari/cca-f-questions.json (certsafari_id=${cs.id})`,
  };
}

/** Distribute `size` questions across domains proportionally to meta.yaml weights.
 *  Remainder goes to the highest-weight domain. */
export function domainQuota(size) {
  const slugs = Object.keys(DOMAIN_META);
  const raw = slugs.map(s => ({ slug: s, want: DOMAIN_META[s].weight * size }));
  const floored = raw.map(r => ({ slug: r.slug, n: Math.floor(r.want), frac: r.want - Math.floor(r.want) }));
  let used = floored.reduce((a, b) => a + b.n, 0);
  // Distribute remainder by largest fractional part.
  const byFrac = [...floored].sort((a, b) => b.frac - a.frac);
  let i = 0;
  while (used < size) {
    byFrac[i % byFrac.length].n += 1;
    used += 1;
    i += 1;
  }
  const out = {};
  for (const r of floored) out[r.slug] = r.n;
  return out;
}

/** Build one 60-Q exam from the raw CertSafari bank. */
export function buildExam(seed, size, rawBank) {
  const rng = mulberry32(seed);
  const questions = rawBank.questions.map(transformQuestion);
  const byDomain = {};
  for (const q of questions) (byDomain[q.domain] ??= []).push(q);

  const quota = domainQuota(size);
  const picked = [];
  for (const [slug, want] of Object.entries(quota)) {
    const pool = byDomain[slug] || [];
    if (pool.length < want) {
      throw new Error(`Insufficient questions for ${slug}: want ${want}, have ${pool.length}. Run the CertSafari extractor for that domain first.`);
    }
    const shuffled = shuffle(pool, rng);
    picked.push(...shuffled.slice(0, want));
  }

  const shuffledPicked = shuffle(picked, mulberry32(seed + 1));
  const byDomainCount = {};
  for (const q of shuffledPicked) byDomainCount[q.domain] = (byDomainCount[q.domain] || 0) + 1;

  return {
    built_at: new Date().toISOString(),
    total: shuffledPicked.length,
    exam_metadata: {
      seed,
      source: 'certsafari-curated',
      verified_by: 'source-is-ground-truth',
      generator: 'scripts/build-certsafari-exams.mjs',
      generator_date: new Date().toISOString(),
      composition: 'certsafari-mixed (no scenario tagging — predates scenario taxonomy)',
      time_limit_minutes: 120,
      passing_score: 720,
      scale_max: 1000,
      coverage_warnings: [],
    },
    by_domain: byDomainCount,
    domains: DOMAIN_META,
    questions: shuffledPicked,
  };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const out = { seed: null, size: 60, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seed') out.seed = parseInt(argv[++i], 10);
    else if (a.startsWith('--seed=')) out.seed = parseInt(a.slice(7), 10);
    else if (a === '--size') out.size = parseInt(argv[++i], 10);
    else if (a.startsWith('--size=')) out.size = parseInt(a.slice(7), 10);
    else if (a === '--out') out.out = argv[++i];
    else if (a.startsWith('--out=')) out.out = a.slice(6);
  }
  if (out.seed == null || Number.isNaN(out.seed)) {
    throw new Error('Missing or invalid --seed. Usage: node scripts/build-certsafari-exams.mjs --seed <N> [--size 60] [--out <path>]');
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawPath = resolve(vault, 'raw', 'certsafari', 'cca-f-questions.json');
  const rawBank = JSON.parse(await readFile(rawPath, 'utf8'));
  const exam = buildExam(args.seed, args.size, rawBank);
  const outPath = args.out
    ? resolve(vault, args.out)
    : resolve(vault, 'public', 'exams', 'cca-f', 'verified', `certsafari-seed${args.seed}.json`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(exam, null, 2));
  console.log(`Wrote ${outPath} (${exam.total} Qs, seed=${args.seed})`);
  console.log(`  by_domain: ${JSON.stringify(exam.by_domain)}`);
}

// Only run main() if invoked directly, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') ?? '')) {
  main().catch(err => { console.error(err); process.exit(1); });
}
```

- [ ] **Step 5.4: Run tests — should pass**

Run: `node --test scripts/build-certsafari-exams.test.mjs`
Expected: 5 tests pass, 0 fail.

- [ ] **Step 5.5: Commit**

```bash
git add scripts/build-certsafari-exams.mjs scripts/build-certsafari-exams.test.mjs
git commit -m "feat(cca-f): build-certsafari-exams.mjs — seeded 60-Q exam builder

New script samples deterministic 60-question exams from the full
CertSafari bank, balanced by meta.yaml domain weights. Output schema
matches public/questions.json so the existing practice UI and dungeon
loader consume it unchanged. source=certsafari-curated tag lets
consumer UIs distinguish these from generated exams.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Generate 5 pre-seeded CertSafari-sourced verified exams

**Files:**
- Create: `public/exams/cca-f/verified/certsafari-seed{1,7,42,101,777}.json`
- Create: `public/exams/cca-f/verified/index.json`

**Seed choices:** 1, 7, 42, 101, 777 — arbitrary but memorable. Different seeds produce different 60-Q samples (with some overlap, unavoidable given 60×5=300 from a ~364-Q bank).

- [ ] **Step 6.1: Run the builder 5 times**

```bash
node scripts/build-certsafari-exams.mjs --seed 1
node scripts/build-certsafari-exams.mjs --seed 7
node scripts/build-certsafari-exams.mjs --seed 42
node scripts/build-certsafari-exams.mjs --seed 101
node scripts/build-certsafari-exams.mjs --seed 777
```

Expected each run: `Wrote public/exams/cca-f/verified/certsafari-seed<N>.json (60 Qs, seed=<N>)`.

- [ ] **Step 6.2: Verify all 5 files exist and parse**

Run:
```bash
node -e "
const fs = require('fs');
const files = ['certsafari-seed1','certsafari-seed7','certsafari-seed42','certsafari-seed101','certsafari-seed777'];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync('public/exams/cca-f/verified/' + f + '.json','utf8'));
  const byDom = Object.entries(d.by_domain).map(([k,v])=>k+':'+v).join(' ');
  console.log(f + ': total=' + d.total + ' | ' + byDom);
}
"
```

Expected: 5 lines, each showing `total=60` and all 5 domain slugs with counts summing to 60.

- [ ] **Step 6.3: Create verified/index.json registry**

Create `public/exams/cca-f/verified/index.json`:

```json
{
  "exams": [
    { "path": "public/exams/cca-f/verified/certsafari-seed1.json",   "seed": 1,   "source": "certsafari-curated", "total": 60 },
    { "path": "public/exams/cca-f/verified/certsafari-seed7.json",   "seed": 7,   "source": "certsafari-curated", "total": 60 },
    { "path": "public/exams/cca-f/verified/certsafari-seed42.json",  "seed": 42,  "source": "certsafari-curated", "total": 60 },
    { "path": "public/exams/cca-f/verified/certsafari-seed101.json", "seed": 101, "source": "certsafari-curated", "total": 60 },
    { "path": "public/exams/cca-f/verified/certsafari-seed777.json", "seed": 777, "source": "certsafari-curated", "total": 60 }
  ]
}
```

- [ ] **Step 6.4: Commit**

```bash
git add public/exams/cca-f/verified/
git commit -m "feat(cca-f): pre-seed verified/ with 5 CertSafari-sourced exams

Seeds: 1, 7, 42, 101, 777. Each is a 60-Q domain-balanced sample from
the 364-Q CertSafari bank. Metadata tags source=certsafari-curated so
consumer UIs can distinguish these from generated exams. index.json
registry created.

These bypass /cca-f-verify-exam — CertSafari source is pre-verified.
Phase 1 practice picker now has content to browse on day one.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Smoke-test a verified exam in the practice UI

**Goal:** Prove that `public/practice/index.html?src=...` correctly loads a CertSafari-sourced exam. No code change — just a manual browser check that the schema is honored.

- [ ] **Step 7.1: Start a local static server**

Run in a separate terminal:
```bash
cd public && python -m http.server 8000
```
Leave running; open `http://localhost:8000/practice/index.html?src=../exams/cca-f/verified/certsafari-seed42.json` in a browser.

- [ ] **Step 7.2: Verify UI renders**

Check that:
- Page loads without a "Could not load question bank" error panel.
- Setup screen shows total of 60 questions.
- All 5 domain chips are present with non-zero counts.
- Exam-metadata banner shows: seed 42, source tag (if UI renders `exam_metadata.source` — may not yet; OK to note as Phase 1 follow-up).
- Clicking "Start" launches a quiz; first question renders with 4 options, stem visible.
- Submitting an answer reveals the explanation.

If any of the above fails, STOP and debug — schema mismatch means the practice UI picker in Phase 1 will also fail.

- [ ] **Step 7.3: Capture a short note**

Update MEMORY.md (user's auto-memory) with a brief entry noting "CertSafari-curated verified exams work end-to-end with existing practice UI as of this task."

- [ ] **Step 7.4: Commit (if any doc/memory updates)**

```bash
# Only if step 7.3 touched repo files (it shouldn't — memory is outside the repo).
git status --short
# Commit only if anything untracked.
```

---

## Task 8: Handoff

**Deliverables after Task 7:**
- [ ] CertSafari bank grown 220 → ~364 (all 5 domains represented)
- [ ] `scripts/build-certsafari-exams.mjs` + tests (passing)
- [ ] 5 verified exams in `public/exams/cca-f/verified/`
- [ ] `verified/index.json` registry
- [ ] Smoke-test proves the existing practice UI loads CertSafari-curated exams

**What's now unblocked:**
- Plan 3 (Phase 1 Practice picker + post-attempt review) — has content to pick from.
- Plan 4 (Phase 2 Dungeon picker) — same.
- Plan 5 (Phase 3 Weakness queue) — indirectly; depends on Phase 1's save-to-queue action.

**Not addressed by this plan (requires separate plans):**
- Plan 2: `/cca-f-generate-exam` rewrite + `/cca-f-verify-exam` new + calibration gate. Can run in parallel with Plans 3–5; adds exam variety over time but isn't blocking Phase 1.

**Recommend writing Plan 3 (Phase 1 Practice) next** — it's the highest-leverage next step for a user actively studying.

---

## Deferred / out of scope for this plan

- Phase 1 picker UI at `public/practice/picker.html` — Plan 3.
- Generator/verifier pipeline — Plan 2.
- Difficulty tagging of CertSafari questions (script defaults all to `medium` since CertSafari itself doesn't tag). A later plan can add heuristic-based difficulty assignment.
- Subdomain metadata in verified exam output — not needed until the generator lands and uses it.

---

## Success criteria (from spec §11 subset)

- [x] `raw/certsafari/cca-f-questions.json` total ≥ 336 *(target; depends on daily-limit behavior — may land at 364 if both full domains extract cleanly, or partial if the 150/day cap bites)*
- [x] `public/exams/cca-f/verified/` has ≥ 5 browseable exams with populated `index.json`
- [x] `/cca-f-generate-exam` writes to `candidates/` *(deferred to Plan 2)*
- [x] `/cca-f-verify-exam` promotes clean ones *(deferred to Plan 2)*

Only the first two are in scope for Plan 1.
