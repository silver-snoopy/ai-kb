# Slay the Cert — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (fresh subagent per task + two-stage review). Steps use checkbox (`- [ ]`) syntax for tracking. Plan is **scope C** — phased full build across 4 sessions totaling ~12 hours of Claude-work. Sessions are independently valuable; can be executed sequentially in separate Claude runs.

**Goal:** Build the Slay the Cert 16-bit browser dungeon-crawler per the design at `docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md`. Target: full spec delivered across 4 Claude-execution sessions.

**Architecture:** Phaser 3 (v3.90.0 "Tsugumi", MIT) + TypeScript + Vite, deployed as `public/dungeon/` subfolder of the existing Quartz site. Pure logic (combat, spellbook, dungeon) is TDD-tested via vitest; Phaser scenes are verified via Playwright MCP smoke tests and manual browser checks. Question bank generated from vault `` ```question `` blocks via `scripts/build-questions.mjs` at deploy time.

**Tech Stack:** Node.js 20+, Phaser 3.90.0, TypeScript 5.x, Vite 5.x, vitest 1.x, yaml 2.x, glob 10.x. Assets: CC0 from Kenney.nl + OpenGameArt (downloaded in Session 4). Testing: vitest + Playwright MCP.

**Spec references:** `docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md` — §3 architecture, §4 dungeon, §5 combat, §6 spellbook, §7 meta-progression, §8 interstitials, §9 content pipeline, §10 write-back, §11 assets, §12 build phases.

**Resolved open decisions (from spec §15):**
- **Scene structure:** one Phaser Scene per game state (Boot, Hub, BossFight, Interstitial, Victory, Death). Simpler than nested-state-machine-in-one-scene; easier to test in isolation.
- **Save schema versioning:** `{ version: 1, ...}` envelope; future versions handle migration. Session 3 implements v1.
- **Session JSON schema:** snake_case to match vault conventions; explicit `schema_version: 1`.
- **Recall question selection:** uniform random from all previously-defeated floors' question pools (equal weight). Weighted-by-miss-rate deferred post-MVP.
- **Difficulty tilt within boss fight:** questions are shuffled once per fight; first half of the fight draws from `difficulty: easy|medium`, second half from `medium|hard`. Simple, deterministic-per-fight.
- **Accessibility:** full keyboard navigation required (Enter/Space to submit, 1-4 for options, Q-W-E for spells); screen reader support best-effort (semantic HTML where Phaser allows).
- **Ade-toolkit compatibility:** plan works identically under ade-toolkit's phase framework (each Session maps to ade's "build" + "verify" phases). Default execution via superpowers.

---

## Execution model

**4 Sessions, each a standalone Claude-driven build run of ~3 hours. Each session ends in a committable, playable-or-testable state.**

| Session | Scope | Ends with | Time |
|---|---|---|---|
| **1** | Bootstrap + question pipeline + single-boss vertical slice | Single boss playable in local browser | ~3 hrs |
| **2** | All 5 bosses + dungeon flow + spellbook | Full 5-boss run (no interstitials/progression/art) | ~3 hrs |
| **3** | Interstitials + localStorage save + NG+/++/+++ meta-progression | Complete first-run → Parchment → Eternal Dungeon loop | ~3 hrs |
| **4** | Asset integration (pixel art + chiptune) + session export + `/ingest-session` command + Quartz CI deploy | Publicly deployed game with art, audio, vault round-trip | ~3 hrs |

**Between sessions:** user reviews the session's state, runs the game locally, reports any issues. Next session starts with a fresh subagent that reads this plan + prior session's commit log.

---

## Session 0 — Prerequisites (~10 min, once)

### Task 0.1: Verify prerequisites

- [ ] **Step 1: Check Node + tooling**

```bash
node --version  # ≥20
npm --version
git --version
gh --version
```

All must succeed.

- [ ] **Step 2: Confirm KB plan Phase 1-2 state**

The game plan assumes:
- The vault has `certs/cca-f/meta.yaml` with 5 domains (either seeded via KB plan Task 1.4, OR seeded as part of Session 1 Task 1.2 below)
- At minimum one `` ```question `` block exists in `certs/cca-f/domain-1-agentic/` (Session 1 seeds test data if not)
- `.gitignore` already excludes `node_modules/` (from KB plan Task 1.1)

If KB plan hasn't been executed at all, Session 1 Task 1.1 will init git + seed minimal state. Otherwise picks up existing vault.

- [ ] **Step 3: Verify Playwright MCP available in Claude Code**

Type `/` and confirm `mcp__plugin_playwright_playwright__browser_navigate` (and friends) appear in the tool autocomplete. If not, install the Playwright plugin: `/plugin install playwright`. Used for Session smoke tests.

---

## Session 1 — Bootstrap + question pipeline + single-boss vertical slice (~3 hours)

**Goal:** Deliver a locally-runnable game where the player fights ONE boss (The Orchestrator), with 1 HP/damage system, questions loaded from the vault, and the fight reaches win/lose states.

**Ends with:** `npm run dev` in `public/dungeon/` opens a browser, player sees a hero + boss + question, answers A/B/C/D, boss or hero dies, game shows result.

### Task 1.1: Vault minimum state (if not already seeded)

**Files:**
- Create (if missing): `certs/cca-f/meta.yaml`
- Create (if missing): `certs/cca-f/domain-1-agentic/test-questions.md`

- [ ] **Step 1: Check if meta.yaml exists**

```bash
test -f certs/cca-f/meta.yaml && echo "Exists" || echo "Missing — will seed"
```

- [ ] **Step 2: If missing, seed minimal meta.yaml**

Content (matches KB spec §5.1 exactly):
```yaml
id: cca-f
name: Claude Certified Architect — Foundations
provider: Anthropic
target_date: 2026-05-31
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: scenario-based-mcq
  cost_usd: 99
domains:
  - { id: domain-1-agentic, name: "Agentic Architecture & Orchestration", weight: 0.27 }
  - { id: domain-2-claude-code, name: "Claude Code Configuration & Workflows", weight: 0.20 }
  - { id: domain-3-prompt-engineering, name: "Prompt Engineering & Structured Output", weight: 0.20 }
  - { id: domain-4-mcp, name: "Tool Design & MCP Integration", weight: 0.18 }
  - { id: domain-5-context, name: "Context Management & Reliability", weight: 0.15 }
resources:
  - { name: "Anthropic Academy", url: "https://anthropic.skilljar.com", priority: primary }
```

- [ ] **Step 3: Seed test question blocks**

Create `certs/cca-f/domain-1-agentic/test-questions.md` with 5 test questions so the game has content:

````markdown
---
cert: cca-f
domain: domain-1-agentic
status: draft
source: slay-the-cert-test-seed
tags: [test, orchestration]
---

# Test questions for Slay the Cert development

Seed content — can be replaced with real content during study.

```question
id: cca-f-d1-orchestration-supervisor-01
domain: domain-1-agentic
difficulty: easy
stem: |
  Which orchestration pattern has a top-level agent that delegates
  independent sub-tasks to specialized worker agents and synthesizes
  their outputs?
options:
  A: Pipeline
  B: Supervisor
  C: Swarm
  D: Single-agent loop
correct: B
explanation: |
  Supervisor pattern = top-level + delegated workers. Pipeline is
  sequential-dependency; Swarm is parallel-exploration; Single-agent
  runs everything in one loop.
source-note: certs/cca-f/domain-1-agentic/test-questions.md
```

```question
id: cca-f-d1-orchestration-pipeline-01
domain: domain-1-agentic
difficulty: medium
stem: |
  You're building a Claude system where stage 1 classifies intent,
  stage 2 retrieves KB articles using the classification, and stage 3
  drafts a response using both prior outputs. Which pattern fits?
options:
  A: Swarm — run all three in parallel
  B: Pipeline — output-of-prev feeds next
  C: Supervisor — delegate to workers
  D: Single-agent loop
correct: B
explanation: |
  Strict sequential dependencies between stages = Pipeline. Swarm
  wastes compute (dependencies force serialization anyway).
  Supervisor adds coordination overhead without benefit for linear flow.
source-note: certs/cca-f/domain-1-agentic/test-questions.md
```

```question
id: cca-f-d1-orchestration-swarm-01
domain: domain-1-agentic
difficulty: medium
stem: |
  Which orchestration pattern is LEAST appropriate when sub-tasks
  have strict sequential dependencies?
options:
  A: Pipeline
  B: Supervisor
  C: Swarm
  D: Single-agent loop
correct: C
explanation: |
  Swarm is designed for parallel exploration where sub-tasks don't
  depend on each other. Sequential dependencies force serialization,
  defeating the pattern.
source-note: certs/cca-f/domain-1-agentic/test-questions.md
```

```question
id: cca-f-d1-orchestration-context-01
domain: domain-1-agentic
difficulty: hard
stem: |
  Your supervisor agent delegates to 4 worker agents. Each worker
  produces ~10k tokens of output. What's the primary risk for the
  supervisor's synthesis step?
options:
  A: Worker outputs may disagree, requiring conflict resolution
  B: Supervisor's context window may overflow when synthesizing 40k+ tokens
  C: Workers may block on each other's outputs
  D: Cost per request exceeds budget
correct: B
explanation: |
  Context-window overflow on synthesis is the primary architectural
  risk. All other options are secondary considerations. Supervisor
  pattern requires careful context budgeting; solutions include
  summarization-before-synthesis or map-reduce style aggregation.
source-note: certs/cca-f/domain-1-agentic/test-questions.md
```

```question
id: cca-f-d1-orchestration-failure-01
domain: domain-1-agentic
difficulty: medium
stem: |
  In a Pipeline orchestration, one stage fails with a transient error.
  Which recovery strategy is most robust?
options:
  A: Kill the entire pipeline and restart from stage 1
  B: Retry the failed stage with exponential backoff; fail pipeline if retries exhausted
  C: Skip the failed stage and proceed with partial output
  D: Manually restart from the failed stage
correct: B
explanation: |
  Transient errors warrant bounded retries with backoff. Option A
  wastes completed work; Option C produces invalid downstream
  inputs; Option D requires human intervention. Idempotent stage
  design is a prerequisite for B.
source-note: certs/cca-f/domain-1-agentic/test-questions.md
```
````

- [ ] **Step 4: Commit**

```bash
git add certs/cca-f/meta.yaml certs/cca-f/domain-1-agentic/test-questions.md
git commit -m "chore(slay-the-cert): seed test question blocks for game dev"
```

---

### Task 1.2: Question pipeline — `scripts/build-questions.mjs`

**Files:**
- Create: `scripts/build-questions.mjs`
- Create: `scripts/build-questions.test.mjs`
- Modify: `scripts/package.json` (add `marked` dep for markdown parsing)

- [ ] **Step 1: Write test file first (TDD)**

Create `scripts/build-questions.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractQuestionBlocks,
  loadCertMeta,
  buildQuestionsJson,
} from './build-questions.mjs';

async function makeVault() {
  return mkdtemp(join(tmpdir(), 'stc-test-'));
}

describe('build-questions', () => {
  it('extracts well-formed question blocks from markdown', () => {
    const md = `
Some prose.

\`\`\`question
id: test-1
domain: domain-1
difficulty: easy
stem: |
  What is 2+2?
options:
  A: three
  B: four
  C: five
  D: six
correct: B
explanation: |
  Basic arithmetic.
source-note: test.md
\`\`\`

More prose.

\`\`\`question
id: test-2
domain: domain-1
difficulty: medium
stem: |
  What is 3*3?
options:
  A: 6
  B: 9
  C: 12
  D: 15
correct: B
explanation: |
  Multiplication.
source-note: test.md
\`\`\`
`;
    const questions = extractQuestionBlocks(md, 'test.md');
    expect(questions).toHaveLength(2);
    expect(questions[0].id).toBe('test-1');
    expect(questions[0].correct).toBe('B');
    expect(questions[0].options.B).toBe('four');
  });

  it('skips non-question code blocks', () => {
    const md = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`question
id: q-1
domain: d1
difficulty: easy
stem: q
options:
  A: a
  B: b
  C: c
  D: d
correct: A
explanation: e
source-note: t.md
\`\`\`
`;
    const questions = extractQuestionBlocks(md, 't.md');
    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe('q-1');
  });

  it('throws on malformed question block (missing required field)', () => {
    const md = `
\`\`\`question
id: broken
domain: d1
stem: missing correct field
options:
  A: a
  B: b
  C: c
  D: d
\`\`\`
`;
    expect(() => extractQuestionBlocks(md, 'broken.md')).toThrow(/correct/);
  });

  it('loads and validates cert meta.yaml', async () => {
    const vault = await makeVault();
    await mkdir(join(vault, 'certs', 'cca-f'), { recursive: true });
    await writeFile(
      join(vault, 'certs', 'cca-f', 'meta.yaml'),
      `id: cca-f
name: Test
provider: Anthropic
target_date: 2026-05-31
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: mcq
  cost_usd: 99
domains:
  - { id: domain-1, name: D1, weight: 1.0 }
resources: []
`
    );
    const meta = await loadCertMeta(vault, 'cca-f');
    expect(meta.id).toBe('cca-f');
    expect(meta.domains).toHaveLength(1);
  });

  it('buildQuestionsJson produces complete structure', async () => {
    const vault = await makeVault();
    await mkdir(join(vault, 'certs', 'cca-f', 'domain-1'), { recursive: true });
    await writeFile(
      join(vault, 'certs', 'cca-f', 'meta.yaml'),
      `id: cca-f
name: Test
provider: Anthropic
target_date: 2026-05-31
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: mcq
  cost_usd: 99
domains:
  - { id: domain-1, name: D1, weight: 1.0 }
resources: []
`
    );
    await writeFile(
      join(vault, 'certs', 'cca-f', 'domain-1', 'notes.md'),
      `---
cert: cca-f
domain: domain-1
status: done
---

\`\`\`question
id: q-1
domain: domain-1
difficulty: easy
stem: What?
options:
  A: a
  B: b
  C: c
  D: d
correct: A
explanation: e
source-note: certs/cca-f/domain-1/notes.md
\`\`\`
`
    );
    const json = await buildQuestionsJson(vault, 'cca-f');
    expect(json.cert_id).toBe('cca-f');
    expect(json.total_questions).toBe(1);
    expect(json.domains[0].questions).toHaveLength(1);
    expect(json.domains[0].questions[0].id).toBe('q-1');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd c:/projects/ai-kb/scripts
npm test -- build-questions
```

Expected: `ERR_MODULE_NOT_FOUND` — `build-questions.mjs` doesn't exist yet.

- [ ] **Step 3: Write `scripts/build-questions.mjs`**

```javascript
// scripts/build-questions.mjs
//
// Extracts ```question``` fenced blocks from vault markdown files and emits
// a questions.json bundle consumed by the Slay the Cert game.
//
// Invariants:
// - Fails non-zero on any malformed question block (missing required field).
// - Only scans certs/<cert-id>/domain-*/*.md (excludes README, _*, raw/, etc.).
// - Output is deterministic: questions ordered by file path, then by id.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

const REQUIRED_FIELDS = ['id', 'domain', 'difficulty', 'stem', 'options', 'correct', 'explanation', 'source-note'];
const REQUIRED_OPTIONS = ['A', 'B', 'C', 'D'];

export function extractQuestionBlocks(markdown, sourcePath) {
  const out = [];
  // Match ```question ... ``` blocks non-greedily
  const re = /```question\n([\s\S]*?)\n```/g;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const body = match[1];
    let parsed;
    try {
      parsed = parseYaml(body);
    } catch (e) {
      throw new Error(`Malformed YAML in question block in ${sourcePath}: ${e.message}`);
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(`Question block in ${sourcePath} did not parse to an object`);
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in parsed)) {
        throw new Error(`Question block in ${sourcePath} missing required field: ${field}`);
      }
    }
    for (const opt of REQUIRED_OPTIONS) {
      if (!parsed.options || !(opt in parsed.options)) {
        throw new Error(`Question block ${parsed.id} in ${sourcePath} missing option ${opt}`);
      }
    }
    if (!REQUIRED_OPTIONS.includes(parsed.correct)) {
      throw new Error(`Question block ${parsed.id} in ${sourcePath}: correct='${parsed.correct}' not in A-D`);
    }
    // Normalize field name for output (source-note → source_note)
    const normalized = {
      id: parsed.id,
      domain: parsed.domain,
      difficulty: parsed.difficulty,
      stem: parsed.stem,
      options: parsed.options,
      correct: parsed.correct,
      explanation: parsed.explanation,
      source_note: parsed['source-note'],
    };
    out.push(normalized);
  }
  return out;
}

export async function loadCertMeta(vaultRoot, certId) {
  const metaPath = join(vaultRoot, 'certs', certId, 'meta.yaml');
  if (!existsSync(metaPath)) {
    throw new Error(`Cert meta not found: ${metaPath}`);
  }
  const text = await readFile(metaPath, 'utf-8');
  const meta = parseYaml(text);
  if (!meta || !meta.id || !Array.isArray(meta.domains)) {
    throw new Error(`Invalid cert meta at ${metaPath}`);
  }
  return meta;
}

export async function buildQuestionsJson(vaultRoot, certId, now = new Date()) {
  const meta = await loadCertMeta(vaultRoot, certId);
  const domainQuestions = new Map(meta.domains.map(d => [d.id, []]));

  const pattern = `certs/${certId}/domain-*/**/*.md`;
  const files = await glob(pattern, { cwd: vaultRoot, posix: true });
  // Sort for determinism
  files.sort();

  for (const relFile of files) {
    const name = relFile.split('/').pop();
    if (name.startsWith('_') || name === 'README.md') continue;
    const full = join(vaultRoot, relFile);
    const md = await readFile(full, 'utf-8');
    const blocks = extractQuestionBlocks(md, relFile);
    for (const q of blocks) {
      if (!domainQuestions.has(q.domain)) {
        throw new Error(`Question ${q.id} references unknown domain '${q.domain}' (not in ${certId}/meta.yaml)`);
      }
      domainQuestions.get(q.domain).push(q);
    }
  }

  // Sort questions within each domain by id for determinism
  for (const list of domainQuestions.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }

  const totalQuestions = Array.from(domainQuestions.values()).reduce((sum, arr) => sum + arr.length, 0);

  return {
    generated_at: now.toISOString(),
    cert_id: meta.id,
    cert_name: meta.name,
    total_questions: totalQuestions,
    domains: meta.domains.map(d => ({
      id: d.id,
      name: d.name,
      weight: d.weight,
      questions: domainQuestions.get(d.id) || [],
    })),
  };
}

export async function writeQuestionsJson(vaultRoot, certId, outputPath) {
  const json = await buildQuestionsJson(vaultRoot, certId);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  return json.total_questions;
}

// CLI entrypoint
const invokedAsMain = resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] || '');
if (invokedAsMain) {
  const vault = process.argv[2];
  const certId = process.argv[3] || 'cca-f';
  const outPath = process.argv[4] || join(vault, 'public', 'dungeon', 'public', 'data', 'questions.json');

  if (!vault) {
    console.error('Usage: node build-questions.mjs <vault-root> [cert-id] [output-path]');
    process.exit(1);
  }

  try {
    const count = await writeQuestionsJson(vault, certId, outPath);
    console.log(`questions.json WRITTEN — ${count} questions from cert ${certId} → ${outPath}`);
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Update `scripts/package.json` dependencies (if needed)**

Open `scripts/package.json`. Check it includes `yaml` and `glob`. These were added in the KB plan Task 5.1. If missing, add:

```json
{
  "dependencies": {
    "glob": "^10.3.10",
    "yaml": "^2.4.0"
  }
}
```

Run `npm install` to update lockfile.

- [ ] **Step 5: Run tests — expect pass**

```bash
cd c:/projects/ai-kb/scripts
npm test -- build-questions
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Run build-questions on real vault**

```bash
cd c:/projects/ai-kb
mkdir -p public/dungeon/public/data
node scripts/build-questions.mjs . cca-f public/dungeon/public/data/questions.json
```

Expected: `questions.json WRITTEN — 5 questions from cert cca-f → public/dungeon/public/data/questions.json`.

Verify output (ESM-compatible since scripts/package.json is `"type": "module"`):
```bash
node -e "import('./public/dungeon/public/data/questions.json', { with: { type: 'json' } }).then(m => console.log('total:', m.default.total_questions, 'domain-1:', m.default.domains[0].questions.length))"
```

Or simpler — read via Node fs:
```bash
node -e "const j=JSON.parse(require('fs').readFileSync('./public/dungeon/public/data/questions.json','utf8')); console.log('total:', j.total_questions, 'domain-1:', j.domains[0].questions.length)" 2>/dev/null || \
cat public/dungeon/public/data/questions.json | head -20
```

Expected: `total: 5 domain-1: 5` (or the first 20 lines of the JSON if node command fails).

- [ ] **Step 7: Commit**

```bash
git add scripts/build-questions.mjs scripts/build-questions.test.mjs scripts/package*.json
git commit -m "feat(slay-the-cert): build-questions.mjs + TDD tests"
```

---

### Task 1.3: Scaffold Phaser project

**Files:**
- Create: `public/dungeon/package.json`
- Create: `public/dungeon/tsconfig.json`
- Create: `public/dungeon/vite.config.ts`
- Create: `public/dungeon/index.html`
- Create: `public/dungeon/.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
cd c:/projects/ai-kb
mkdir -p public/dungeon/src/{game,data,scenes,ui,audio}
mkdir -p public/dungeon/public/{assets/sprites,assets/audio,assets/tiles,data}
```

- [ ] **Step 2: Write `public/dungeon/package.json`**

```json
{
  "name": "slay-the-cert",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "build:questions": "node ../../scripts/build-questions.mjs ../../. cca-f public/data/questions.json"
  },
  "dependencies": {
    "phaser": "3.90.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 3: Write `public/dungeon/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "types": ["vite/client", "vitest/globals"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "src/**/*.test.ts"]
}
```

- [ ] **Step 4: Write `public/dungeon/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // relative paths so subfolder deploy on GitHub Pages works
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 5: Write `public/dungeon/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Slay the Cert</title>
  <style>
    body {
      margin: 0;
      background: #0a0a14;
      color: #e0e0ea;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #game {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: Write `public/dungeon/.gitignore`**

```gitignore
node_modules/
dist/
.vite/
coverage/
```

- [ ] **Step 7: Install dependencies**

```bash
cd c:/projects/ai-kb/public/dungeon
npm install
```

Expected: installs without errors. `package-lock.json` created.

- [ ] **Step 8: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/
git commit -m "feat(slay-the-cert): Phaser 3 + Vite + TypeScript scaffold"
```

---

### Task 1.4: Core type definitions + game config

**Files:**
- Create: `public/dungeon/src/types.ts`
- Create: `public/dungeon/src/config.ts`

- [ ] **Step 1: Write `src/types.ts`**

```typescript
// Question bank types (matches questions.json schema)
export interface Question {
  id: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source_note: string;
}

export interface DomainData {
  id: string;
  name: string;
  weight: number;
  questions: Question[];
}

export interface QuestionsJson {
  generated_at: string;
  cert_id: string;
  cert_name: string;
  total_questions: number;
  domains: DomainData[];
}

// Boss types
export interface BossDefinition {
  id: string;
  name: string;
  domain: string;
  theme: string;
  taunts: { correct: string[]; wrong: string[] };
  environmentColor: number; // hex for Phaser fillRect, etc.
}

// Spell types
export type SpellId = 'echo' | 'study-the-tome' | 'memorize' | 'amplify' | 'doubleshot' | 'focus';

export interface SpellEffect {
  type: 'retake' | 'primer' | 'weakness-queue' | 'damage-mult';
  multiplier?: number; // for damage-mult
}

export interface Spell {
  id: SpellId;
  name: string;
  description: string;
  tier: 'common' | 'uncommon' | 'rare';
  effect: SpellEffect;
  unlockedIn: 'first-run' | 'ng-plus' | 'ng-plus-plus' | 'ng-plus-plus-plus';
}

// Run mode
export type RunMode = 'first-run' | 'ng-plus' | 'ng-plus-plus' | 'ng-plus-plus-plus';

// Combat state
export interface CombatState {
  heroHp: number;
  heroMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  currentQuestion: Question | null;
  questionHistory: Question[];
  pendingDamageMultiplier: number; // 1, 2, or 3
  pendingPrimer: string | null;
  pendingRetake: boolean;
}

// Session log (for JSON export)
export interface SessionLog {
  schema_version: 1;
  cert_id: string;
  mode: RunMode;
  started_at: string;
  ended_at: string;
  result: 'victory' | 'death' | 'quit';
  bosses_defeated: string[];
  spells_cast: SpellId[];
  questions: Array<{
    question_id: string;
    domain: string;
    was_correct: boolean;
    time_elapsed_ms: number;
    flagged_for_review: boolean;
  }>;
  total_correct: number;
  total_wrong: number;
  final_hero_hp: number;
}

// Save state (localStorage v1)
export interface SaveStateV1 {
  version: 1;
  cert_id: string;
  current_campaign: {
    mode: RunMode;
    boss_order: string[]; // boss ids, shuffled
    floors_cleared: number; // 0 = none; 5 = all
    spellbook_charges: Record<SpellId, number>; // remaining casts this run
    hero_hp: number;
    run_questions_asked: string[]; // question ids, for Echo uniqueness
  } | null;
  unlocked_spells: SpellId[];
  bosses_defeated_ever: string[];
  parchment_earned: boolean;
  eternal_dungeon_unlocked: boolean;
  title_earned: string | null;
}
```

- [ ] **Step 2: Write `src/config.ts`**

```typescript
// Game-wide constants. Source: spec §4.3, §5.2, §6.
import type { BossDefinition, Spell } from './types';

export const GAME_CONFIG = {
  HERO_MAX_HP: 3,
  BOSS_HP: {
    'first-run': 5,
    'ng-plus': 7,
    'ng-plus-plus': 10,
    'ng-plus-plus-plus': 10,
  },
  BASE_DAMAGE_PER_CORRECT: 1,
  HP_COST_PER_WRONG: 1, // INVARIANT R6: never modified
  SPELLBOOK_SIZE: 3, // loadout slots per run
  FOCUS_CONTEMPLATION_MS: 15_000,
} as const;

export const BOSSES: BossDefinition[] = [
  {
    id: 'the-orchestrator',
    name: 'The Orchestrator',
    domain: 'domain-1-agentic',
    theme: 'Throne hall with chess-piece attendants',
    taunts: {
      correct: [
        'You see the pattern. Good.',
        'The dispatch aligns. I grant you that.',
        'A legion stands corrected.',
      ],
      wrong: [
        'Disorder. As expected.',
        'Your coordination falters.',
        'The patterns escape you.',
      ],
    },
    environmentColor: 0x2d1b4e,
  },
  {
    id: 'the-compiler-king',
    name: 'The Compiler-King',
    domain: 'domain-2-claude-code',
    theme: 'Iron workshop; command sigils',
    taunts: {
      correct: ['Your config compiles.', 'The build succeeds.', 'Compilation: 0 errors.'],
      wrong: ['Syntax error.', 'Your config will fail.', 'Malformed workflow.'],
    },
    environmentColor: 0x4e2d1b,
  },
  {
    id: 'the-grammarian',
    name: 'The Grammarian',
    domain: 'domain-3-prompt-engineering',
    theme: 'Library of carved stone scrolls',
    taunts: {
      correct: ['Precise.', 'Your tags are sacred.', 'Structure holds.'],
      wrong: ['Imprecision.', 'Grammar fails you.', 'Your prompts are broken.'],
    },
    environmentColor: 0x1b4e2d,
  },
  {
    id: 'the-tool-smith',
    name: 'The Tool-Smith',
    domain: 'domain-4-mcp',
    theme: 'Forge surrounded by schemas-as-runes',
    taunts: {
      correct: ['The schema holds.', 'Well-forged.', 'Your tools cut true.'],
      wrong: ['Schema violation.', 'Malformed invocation.', 'Your tools shatter.'],
    },
    environmentColor: 0x4e4e1b,
  },
  {
    id: 'the-memory-kraken',
    name: 'The Memory-Kraken',
    domain: 'domain-5-context',
    theme: 'Flooded archive; sinking context-shelves',
    taunts: {
      correct: ['You remember.', 'The tide holds.', 'Context preserved.'],
      wrong: ['Forgotten.', 'The tide takes it.', 'Your context drowns.'],
    },
    environmentColor: 0x1b2d4e,
  },
];

export const SPELLS: Record<import('./types').SpellId, Spell> = {
  echo: {
    id: 'echo',
    name: 'Echo',
    description: 'Next question is a retake of a previous question from this fight.',
    tier: 'uncommon',
    effect: { type: 'retake' },
    unlockedIn: 'first-run',
  },
  'study-the-tome': {
    id: 'study-the-tome',
    name: 'Study the Tome',
    description: 'Before next question, reveal a 3-sentence primer from the source note. Context only, no answer.',
    tier: 'uncommon',
    effect: { type: 'primer' },
    unlockedIn: 'first-run',
  },
  memorize: {
    id: 'memorize',
    name: 'Memorize',
    description: 'No combat effect. Adds current question to the session log flagged for weakness-queue.',
    tier: 'rare',
    effect: { type: 'weakness-queue' },
    unlockedIn: 'first-run',
  },
  amplify: {
    id: 'amplify',
    name: 'Amplify',
    description: 'Next correct answer deals 2 damage.',
    tier: 'common',
    effect: { type: 'damage-mult', multiplier: 2 },
    unlockedIn: 'ng-plus',
  },
  doubleshot: {
    id: 'doubleshot',
    name: 'Doubleshot',
    description: 'Next correct answer deals 3 damage.',
    tier: 'rare',
    effect: { type: 'damage-mult', multiplier: 3 },
    unlockedIn: 'ng-plus-plus',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    description: 'Next question gets a 15-second contemplation phase.',
    tier: 'uncommon',
    effect: { type: 'retake' /* handled separately via pendingFocus flag */ },
    unlockedIn: 'ng-plus-plus-plus',
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add public/dungeon/src/types.ts public/dungeon/src/config.ts
git commit -m "feat(slay-the-cert): core type definitions + game config"
```

---

### Task 1.5: Combat logic (TDD)

**Files:**
- Create: `public/dungeon/src/game/combat.ts`
- Create: `public/dungeon/src/game/combat.test.ts`

- [ ] **Step 1: Write combat.test.ts first**

```typescript
import { describe, it, expect } from 'vitest';
import {
  initCombat,
  resolveAnswer,
  isBossDefeated,
  isHeroDead,
} from './combat';
import type { Question } from '../types';

const dummyQuestion: Question = {
  id: 'q1',
  domain: 'd1',
  difficulty: 'easy',
  stem: 'Q',
  options: { A: 'a', B: 'b', C: 'c', D: 'd' },
  correct: 'B',
  explanation: 'e',
  source_note: 't.md',
};

describe('combat', () => {
  it('initializes combat state with given HP values', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    expect(state.heroHp).toBe(3);
    expect(state.bossHp).toBe(5);
    expect(state.pendingDamageMultiplier).toBe(1);
    expect(state.questionHistory).toEqual([]);
  });

  it('correct answer reduces boss HP by 1', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    const result = resolveAnswer(state, 'B');
    expect(result.wasCorrect).toBe(true);
    expect(result.damageDealt).toBe(1);
    expect(state.bossHp).toBe(4);
    expect(state.heroHp).toBe(3); // unchanged
  });

  it('correct answer with Amplify (multiplier=2) deals 2 damage', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    state.pendingDamageMultiplier = 2;
    const result = resolveAnswer(state, 'B');
    expect(result.damageDealt).toBe(2);
    expect(state.bossHp).toBe(3);
    // multiplier resets after use
    expect(state.pendingDamageMultiplier).toBe(1);
  });

  it('wrong answer reduces hero HP by 1 regardless of multiplier', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    state.pendingDamageMultiplier = 3; // Doubleshot queued — should NOT affect wrong-answer cost (invariant R6)
    const result = resolveAnswer(state, 'A');
    expect(result.wasCorrect).toBe(false);
    expect(state.heroHp).toBe(2);
    expect(state.bossHp).toBe(5); // unchanged
    // multiplier stays queued (wasted on wrong answer? no — spec says consumed on any submission)
    expect(state.pendingDamageMultiplier).toBe(1);
  });

  it('wrong answer returns explanation for display', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    const result = resolveAnswer(state, 'A');
    expect(result.explanation).toBe('e');
    expect(result.correctAnswer).toBe('B');
  });

  it('question goes into history after resolution', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 5 });
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'B');
    expect(state.questionHistory).toHaveLength(1);
    expect(state.questionHistory[0]?.id).toBe('q1');
    expect(state.currentQuestion).toBeNull();
  });

  it('isBossDefeated reflects bossHp <= 0', () => {
    const state = initCombat({ heroMaxHp: 3, bossMaxHp: 1 });
    expect(isBossDefeated(state)).toBe(false);
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'B');
    expect(isBossDefeated(state)).toBe(true);
  });

  it('isHeroDead reflects heroHp <= 0', () => {
    const state = initCombat({ heroMaxHp: 1, bossMaxHp: 5 });
    expect(isHeroDead(state)).toBe(false);
    state.currentQuestion = dummyQuestion;
    resolveAnswer(state, 'A'); // wrong
    expect(isHeroDead(state)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd c:/projects/ai-kb/public/dungeon
npm test
```

Expected: all 8 tests fail (module missing).

- [ ] **Step 3: Write `src/game/combat.ts`**

```typescript
import type { CombatState, Question } from '../types';

export interface CombatInit {
  heroMaxHp: number;
  bossMaxHp: number;
}

export interface ResolutionResult {
  wasCorrect: boolean;
  damageDealt: number;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export function initCombat(init: CombatInit): CombatState {
  return {
    heroHp: init.heroMaxHp,
    heroMaxHp: init.heroMaxHp,
    bossHp: init.bossMaxHp,
    bossMaxHp: init.bossMaxHp,
    currentQuestion: null,
    questionHistory: [],
    pendingDamageMultiplier: 1,
    pendingPrimer: null,
    pendingRetake: false,
  };
}

export function resolveAnswer(
  state: CombatState,
  selected: 'A' | 'B' | 'C' | 'D',
): ResolutionResult {
  const q = state.currentQuestion;
  if (!q) throw new Error('No current question to resolve');

  const wasCorrect = selected === q.correct;
  let damageDealt = 0;

  if (wasCorrect) {
    damageDealt = state.pendingDamageMultiplier;
    state.bossHp = Math.max(0, state.bossHp - damageDealt);
  } else {
    // INVARIANT R6: wrong answer always costs exactly 1 HP. No modifiers.
    state.heroHp = Math.max(0, state.heroHp - 1);
  }

  // Multiplier consumed on any submission (correct or wrong)
  state.pendingDamageMultiplier = 1;

  // Primer and retake are one-shot too (consumed when question fires)
  state.pendingPrimer = null;
  state.pendingRetake = false;

  // Move question to history
  state.questionHistory.push(q);
  state.currentQuestion = null;

  return {
    wasCorrect,
    damageDealt,
    correctAnswer: q.correct,
    explanation: q.explanation,
  };
}

export function isBossDefeated(state: CombatState): boolean {
  return state.bossHp <= 0;
}

export function isHeroDead(state: CombatState): boolean {
  return state.heroHp <= 0;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/src/game/combat.ts public/dungeon/src/game/combat.test.ts
git commit -m "feat(slay-the-cert): combat logic with TDD (R6 invariant enforced in tests)"
```

---

### Task 1.6: Question loader

**Files:**
- Create: `public/dungeon/src/data/questionLoader.ts`
- Create: `public/dungeon/src/data/questionLoader.test.ts`

- [ ] **Step 1: Write test**

```typescript
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
    // First half should tilt easy/medium
    const firstHalfDifficulties = picks.slice(0, 3).map(q => q.difficulty);
    const easyMediumCount = firstHalfDifficulties.filter(d => d === 'easy' || d === 'medium').length;
    expect(easyMediumCount).toBeGreaterThanOrEqual(2);
  });

  it('shuffles boss order deterministically given seed', () => {
    const bosses = ['a', 'b', 'c', 'd', 'e'];
    const shuffle1 = shuffleBossOrder(bosses, seeded(123));
    const shuffle2 = shuffleBossOrder(bosses, seeded(123));
    expect(shuffle1).toEqual(shuffle2); // same seed → same order
    expect(shuffle1.sort()).toEqual([...bosses].sort()); // same elements
  });

  it('different seeds produce different orders (with overwhelming probability)', () => {
    const bosses = ['a', 'b', 'c', 'd', 'e'];
    const s1 = shuffleBossOrder(bosses, seeded(1));
    const s2 = shuffleBossOrder(bosses, seeded(2));
    // 5! = 120 permutations, so collision probability is 1/120 per pair
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
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- questionLoader
```

- [ ] **Step 3: Write `src/data/questionLoader.ts`**

```typescript
import type { Question, QuestionsJson } from '../types';

export async function loadQuestionsJson(url: string = './data/questions.json'): Promise<QuestionsJson> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load questions.json: ${res.status}`);
  return res.json() as Promise<QuestionsJson>;
}

/**
 * Pick N questions from a pool for a boss fight.
 * Difficulty tilt: first half weighted toward easy/medium, second half toward medium/hard.
 * Uses provided rng() → [0,1) for determinism in tests.
 */
export function pickQuestionsForFight(
  pool: Question[],
  n: number,
  rng: () => number = Math.random,
): Question[] {
  if (pool.length < n) {
    // Not enough questions — pad by repeating (acceptable for tight pools during early play)
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

  // First half: prefer easy+medium
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
    // If ran out of fresh, recycle
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- questionLoader
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/src/data/questionLoader.ts public/dungeon/src/data/questionLoader.test.ts
git commit -m "feat(slay-the-cert): question loader + boss shuffle (seeded, tested)"
```

---

### Task 1.7: Minimal Phaser scenes — Boot, Hub, BossFight (vertical slice)

**Files:**
- Create: `public/dungeon/src/main.ts`
- Create: `public/dungeon/src/scenes/BootScene.ts`
- Create: `public/dungeon/src/scenes/HubScene.ts`
- Create: `public/dungeon/src/scenes/BossFightScene.ts`

This task writes the Phaser skeleton. No unit tests — verification is via Playwright smoke test in Task 1.8.

- [ ] **Step 1: Write `src/main.ts`**

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BossFightScene } from './scenes/BossFightScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#0a0a14',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BossFightScene],
};

new Phaser.Game(config);
```

- [ ] **Step 2: Write `src/scenes/BootScene.ts`**

```typescript
import Phaser from 'phaser';
import { loadQuestionsJson } from '../data/questionLoader';
import type { QuestionsJson } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    this.add.text(480, 280, 'Slay the Cert', {
      fontSize: '48px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 340, 'Loading questions...', {
      fontSize: '20px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    try {
      const questions: QuestionsJson = await loadQuestionsJson();
      this.registry.set('questions', questions);

      this.add.text(480, 400, `${questions.total_questions} questions loaded`, {
        fontSize: '16px',
        color: '#8bc34a',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      this.time.delayedCall(1000, () => {
        this.scene.start('HubScene');
      });
    } catch (e: unknown) {
      this.add.text(480, 400, `ERROR: ${(e as Error).message}`, {
        fontSize: '16px',
        color: '#e57373',
        fontFamily: 'monospace',
        wordWrap: { width: 800 },
      }).setOrigin(0.5);
    }
  }
}
```

- [ ] **Step 3: Write `src/scenes/HubScene.ts`**

```typescript
import Phaser from 'phaser';
import { BOSSES } from '../config';

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create(): void {
    this.add.text(480, 80, '🏰 Gates of the Archive', {
      fontSize: '36px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 140, 'Session 1 vertical slice — single boss test', {
      fontSize: '16px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // For Session 1, just a button to start a fight with The Orchestrator
    const button = this.add.rectangle(480, 320, 400, 80, 0x2d1b4e);
    button.setStrokeStyle(3, 0x8b7cc4);
    button.setInteractive({ useHandCursor: true });

    this.add.text(480, 320, 'Fight The Orchestrator', {
      fontSize: '24px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      this.scene.start('BossFightScene', { bossId: 'the-orchestrator' });
    });
  }
}
```

- [ ] **Step 4: Write `src/scenes/BossFightScene.ts`**

```typescript
import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG } from '../config';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight } from '../data/questionLoader';
import type { BossDefinition, CombatState, Question, QuestionsJson } from '../types';

interface BossFightData {
  bossId: string;
}

export class BossFightScene extends Phaser.Scene {
  private state!: CombatState;
  private boss!: BossDefinition;
  private questions!: Question[];
  private questionIndex = 0;
  private heroHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private taunText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BossFightScene' });
  }

  init(data: BossFightData): void {
    const boss = BOSSES.find(b => b.id === data.bossId);
    if (!boss) throw new Error(`Unknown boss: ${data.bossId}`);
    this.boss = boss;

    const questionsJson: QuestionsJson = this.registry.get('questions');
    const domainData = questionsJson.domains.find(d => d.id === boss.domain);
    if (!domainData || domainData.questions.length === 0) {
      throw new Error(`No questions for domain ${boss.domain}`);
    }
    const bossHp = GAME_CONFIG.BOSS_HP['first-run'];
    const maxQuestions = bossHp + GAME_CONFIG.HERO_MAX_HP - 1; // 7 for defaults
    this.questions = pickQuestionsForFight(domainData.questions, maxQuestions);
    this.questionIndex = 0;

    this.state = initCombat({
      heroMaxHp: GAME_CONFIG.HERO_MAX_HP,
      bossMaxHp: bossHp,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.boss.environmentColor);

    // Boss name at top
    this.add.text(480, 40, this.boss.name, {
      fontSize: '32px',
      color: '#f5e4b3',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // HP displays
    this.bossHpText = this.add.text(200, 100, '', {
      fontSize: '20px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
    });
    this.heroHpText = this.add.text(600, 100, '', {
      fontSize: '20px',
      color: '#8bc34a',
      fontFamily: 'monospace',
    });

    // Question display
    this.questionText = this.add.text(480, 220, '', {
      fontSize: '18px',
      color: '#e0e0ea',
      fontFamily: 'monospace',
      wordWrap: { width: 880 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // 4 option buttons
    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 400 + idx * 45;
      const btn = this.add.rectangle(480, y, 800, 40, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      const txt = this.add.text(100, y, '', {
        fontSize: '16px',
        color: '#d0d0da',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      // Keyboard shortcut
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    // Taunt
    this.taunText = this.add.text(480, 600, '', {
      fontSize: '14px',
      color: '#b0b0c0',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.nextQuestion();
  }

  private nextQuestion(): void {
    if (this.questionIndex >= this.questions.length) {
      this.showResult('draw'); // shouldn't happen with proper question count
      return;
    }
    const q = this.questions[this.questionIndex++]!;
    this.state.currentQuestion = q;
    this.questionText.setText(q.stem);
    this.optionTexts.forEach((txt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D';
      txt.setText(`${letter}) ${q.options[letter]}`);
    });
    this.updateHp();
  }

  private submit(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (!this.state.currentQuestion) return;
    const result = resolveAnswer(this.state, choice);
    this.updateHp();

    const tauntPool = result.wasCorrect ? this.boss.taunts.correct : this.boss.taunts.wrong;
    this.taunText.setText(`"${tauntPool[Math.floor(Math.random() * tauntPool.length)]}"`);

    if (!result.wasCorrect) {
      this.questionText.setText(
        `✗ Incorrect. Correct: ${result.correctAnswer}\n\n${result.explanation}\n\n(click any option to continue)`,
      );
      this.optionTexts.forEach(t => t.setText(''));
      this.input.once('pointerdown', () => this.advanceOrEnd());
      return;
    }

    // Correct: brief pause, then advance
    this.time.delayedCall(800, () => this.advanceOrEnd());
  }

  private advanceOrEnd(): void {
    if (isBossDefeated(this.state)) {
      this.showResult('victory');
      return;
    }
    if (isHeroDead(this.state)) {
      this.showResult('death');
      return;
    }
    this.nextQuestion();
  }

  private updateHp(): void {
    const bossHearts = '❤️'.repeat(Math.max(0, this.state.bossHp)) + '🖤'.repeat(this.state.bossMaxHp - this.state.bossHp);
    const heroHearts = '❤️'.repeat(Math.max(0, this.state.heroHp)) + '🖤'.repeat(this.state.heroMaxHp - this.state.heroHp);
    this.bossHpText.setText(`BOSS ${bossHearts}`);
    this.heroHpText.setText(`HERO ${heroHearts}`);
  }

  private showResult(kind: 'victory' | 'death' | 'draw'): void {
    this.questionText.setText('');
    this.optionTexts.forEach(t => t.setText(''));

    let msg = '';
    if (kind === 'victory') msg = `🏆 ${this.boss.name} DEFEATED`;
    else if (kind === 'death') msg = 'YOU DIED';
    else msg = 'Out of questions';

    this.add.text(480, 320, msg, {
      fontSize: '48px',
      color: kind === 'victory' ? '#f5e4b3' : '#e57373',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 400, '(click to return to Hub)', {
      fontSize: '16px',
      color: '#a0a0b0',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/src/main.ts public/dungeon/src/scenes/
git commit -m "feat(slay-the-cert): Phaser scenes for vertical slice (Boot, Hub, BossFight)"
```

---

### Task 1.8: End-to-end smoke test

**Files:** (none — runtime verification)

- [ ] **Step 1: Generate questions.json**

```bash
cd c:/projects/ai-kb/public/dungeon
npm run build:questions
```

Expected: `questions.json WRITTEN — 5 questions from cert cca-f → ...`

- [ ] **Step 2: Run dev server in background**

```bash
cd c:/projects/ai-kb/public/dungeon
npm run dev
```

(Phaser should open in browser at http://localhost:5173 automatically. If running via subagent, use Playwright MCP to navigate.)

- [ ] **Step 3: Smoke test with Playwright MCP**

Use the Playwright browser navigation tool to open `http://localhost:5173` and:
1. Verify the Boot scene renders "Slay the Cert" title.
2. Wait for the Hub scene ("Gates of the Archive" visible).
3. Click "Fight The Orchestrator" button.
4. Verify BossFightScene loads: "The Orchestrator" title visible, HP text visible, Q1 stem text visible, 4 options visible.
5. Take a screenshot for the session record.
6. Press key `A`, `B`, `C`, or `D` to submit an answer. Verify HP changes.
7. Continue clicking options until a result screen shows.

If all checks pass, Session 1 vertical slice is complete.

- [ ] **Step 4: Stop dev server**

Ctrl+C.

- [ ] **Step 5: Final Session 1 commit**

```bash
cd c:/projects/ai-kb
git add -A
git commit -m "chore(slay-the-cert): Session 1 complete — single-boss vertical slice playable" --allow-empty
```

> **⏸️ SESSION 1 COMPLETE — USER VERIFICATION REQUIRED.** Before starting Session 2, user should run the game locally (`cd public/dungeon && npm run dev`), play through a single Orchestrator fight end-to-end, and confirm nothing feels off. Report any issues. Session 2 subagent starts fresh and reads Session 1's commits + this plan.

**✅ End of Session 1.** Next session picks up from here.

---

## Session 2 — All 5 bosses + spellbook + dungeon flow (~3 hours)

**Goal:** Full 5-boss dungeon works end-to-end. Random boss order. Spellbook with 3 first-run spells usable in combat. Still no interstitials, no art, no progression state.

**Ends with:** Player can start a campaign from Hub, fight 5 bosses in shuffled order (passing from one to the next), cast spells mid-fight, reach a "campaign complete" stub screen OR death.

### Task 2.1: Spellbook logic (TDD)

**Files:**
- Create: `public/dungeon/src/game/spellbook.ts`
- Create: `public/dungeon/src/game/spellbook.test.ts`

- [ ] **Step 1: Write test**

```typescript
import { describe, it, expect } from 'vitest';
import { createSpellbook, castSpell, canCast } from './spellbook';
import type { CombatState } from '../types';

function dummyState(): CombatState {
  return {
    heroHp: 3, heroMaxHp: 3,
    bossHp: 5, bossMaxHp: 5,
    currentQuestion: null,
    questionHistory: [],
    pendingDamageMultiplier: 1,
    pendingPrimer: null,
    pendingRetake: false,
  };
}

describe('spellbook', () => {
  it('initializes first-run spellbook with 1 charge each of 3 spells', () => {
    const book = createSpellbook('first-run');
    expect(book.echo).toBe(1);
    expect(book['study-the-tome']).toBe(1);
    expect(book.memorize).toBe(1);
    expect(book.amplify).toBe(0);
    expect(book.doubleshot).toBe(0);
  });

  it('ng-plus includes amplify', () => {
    const book = createSpellbook('ng-plus');
    expect(book.amplify).toBe(1);
  });

  it('canCast is true when charges > 0', () => {
    const book = createSpellbook('first-run');
    expect(canCast(book, 'echo')).toBe(true);
    expect(canCast(book, 'amplify')).toBe(false);
  });

  it('amplify cast sets pendingDamageMultiplier to 2', () => {
    const book = createSpellbook('ng-plus');
    const state = dummyState();
    castSpell('amplify', book, state);
    expect(state.pendingDamageMultiplier).toBe(2);
    expect(book.amplify).toBe(0);
  });

  it('echo cast sets pendingRetake flag', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    castSpell('echo', book, state);
    expect(state.pendingRetake).toBe(true);
    expect(book.echo).toBe(0);
  });

  it('study-the-tome sets pendingPrimer (placeholder text)', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    castSpell('study-the-tome', book, state);
    expect(state.pendingPrimer).toBeTruthy();
    expect(book['study-the-tome']).toBe(0);
  });

  it('casting a spell with 0 charges throws', () => {
    const book = createSpellbook('first-run');
    const state = dummyState();
    expect(() => castSpell('amplify', book, state)).toThrow(/no charges/i);
  });

  it('wrong answer does not cost extra HP even with amplify queued', () => {
    // This is really a combat.ts invariant test but worth reinforcing here
    const book = createSpellbook('ng-plus');
    const state = dummyState();
    castSpell('amplify', book, state);
    // pendingDamageMultiplier = 2, but wrong answer still costs 1 HP.
    // (Full behavior tested in combat.test.ts)
    expect(state.pendingDamageMultiplier).toBe(2);
  });
});
```

- [ ] **Step 2: Write `src/game/spellbook.ts`**

```typescript
import type { CombatState, RunMode, SpellId } from '../types';
import { SPELLS } from '../config';

export type Spellbook = Record<SpellId, number>; // charges remaining

export function createSpellbook(mode: RunMode): Spellbook {
  const book: Spellbook = {
    echo: 0,
    'study-the-tome': 0,
    memorize: 0,
    amplify: 0,
    doubleshot: 0,
    focus: 0,
  };
  // Grant 1 charge to each spell unlocked at or before this mode
  const tierOrder: RunMode[] = ['first-run', 'ng-plus', 'ng-plus-plus', 'ng-plus-plus-plus'];
  const currentIdx = tierOrder.indexOf(mode);
  for (const spell of Object.values(SPELLS)) {
    const spellIdx = tierOrder.indexOf(spell.unlockedIn);
    if (spellIdx <= currentIdx) book[spell.id] = 1;
  }
  return book;
}

export function canCast(book: Spellbook, spell: SpellId): boolean {
  return (book[spell] ?? 0) > 0;
}

export function castSpell(spell: SpellId, book: Spellbook, state: CombatState): void {
  if (!canCast(book, spell)) throw new Error(`No charges remaining for ${spell}`);
  book[spell] -= 1;

  const def = SPELLS[spell];
  switch (def.effect.type) {
    case 'damage-mult':
      state.pendingDamageMultiplier = def.effect.multiplier ?? 1;
      break;
    case 'retake':
      state.pendingRetake = true;
      break;
    case 'primer':
      // Primer text is sourced at runtime from source_note during BossFightScene —
      // here we just flag it. Scene fills in the actual primer before displaying question.
      state.pendingPrimer = 'PRIMER_PENDING';
      break;
    case 'weakness-queue':
      // No combat effect. Scene observes and flags the current question in the session log.
      // Marker flag in state: not strictly needed, scene can ask book pre-cast state
      break;
  }
}

export function grantBossDefeatReward(book: Spellbook, chosenSpell: SpellId): void {
  book[chosenSpell] = (book[chosenSpell] ?? 0) + 1;
}
```

- [ ] **Step 3: Run tests — expect pass**

```bash
cd c:/projects/ai-kb/public/dungeon
npm test -- spellbook
```

- [ ] **Step 4: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/src/game/spellbook.ts public/dungeon/src/game/spellbook.test.ts
git commit -m "feat(slay-the-cert): spellbook logic with charge management"
```

---

### Task 2.2: Dungeon flow

**Files:**
- Create: `public/dungeon/src/game/dungeon.ts`
- Create: `public/dungeon/src/game/dungeon.test.ts`

- [ ] **Step 1: Write test**

```typescript
import { describe, it, expect } from 'vitest';
import { createCampaign, advanceFloor, isCampaignComplete } from './dungeon';
import { BOSSES } from '../config';

describe('dungeon', () => {
  it('creates a campaign with 5 bosses in random order', () => {
    const c = createCampaign('first-run', 42);
    expect(c.bossOrder).toHaveLength(5);
    const ids = BOSSES.map(b => b.id).sort();
    expect([...c.bossOrder].sort()).toEqual(ids);
    expect(c.floorsCleared).toBe(0);
  });

  it('same seed → same order', () => {
    const c1 = createCampaign('first-run', 100);
    const c2 = createCampaign('first-run', 100);
    expect(c1.bossOrder).toEqual(c2.bossOrder);
  });

  it('advanceFloor increments floorsCleared', () => {
    const c = createCampaign('first-run', 1);
    advanceFloor(c);
    expect(c.floorsCleared).toBe(1);
  });

  it('isCampaignComplete when floorsCleared === 5', () => {
    const c = createCampaign('first-run', 1);
    expect(isCampaignComplete(c)).toBe(false);
    for (let i = 0; i < 5; i++) advanceFloor(c);
    expect(isCampaignComplete(c)).toBe(true);
  });
});
```

- [ ] **Step 2: Write `src/game/dungeon.ts`**

```typescript
import { BOSSES } from '../config';
import { shuffleBossOrder } from '../data/questionLoader';
import type { RunMode } from '../types';

export interface Campaign {
  mode: RunMode;
  bossOrder: string[];
  floorsCleared: number;
  seed: number;
}

export function createCampaign(mode: RunMode, seed: number): Campaign {
  const rng = makeSeededRng(seed);
  const bossIds = BOSSES.map(b => b.id);
  const bossOrder = shuffleBossOrder(bossIds, rng);
  return { mode, bossOrder, floorsCleared: 0, seed };
}

export function currentBossId(c: Campaign): string | null {
  if (c.floorsCleared >= c.bossOrder.length) return null;
  return c.bossOrder[c.floorsCleared] ?? null;
}

export function advanceFloor(c: Campaign): void {
  c.floorsCleared += 1;
}

export function isCampaignComplete(c: Campaign): boolean {
  return c.floorsCleared >= c.bossOrder.length;
}

function makeSeededRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
```

- [ ] **Step 3: Run tests, expect pass**

```bash
npm test -- dungeon
```

- [ ] **Step 4: Commit**

```bash
cd c:/projects/ai-kb
git add public/dungeon/src/game/dungeon.ts public/dungeon/src/game/dungeon.test.ts
git commit -m "feat(slay-the-cert): dungeon flow with seeded boss shuffle"
```

---

### Task 2.3: Wire HubScene + BossFightScene for full campaign flow

**Files:**
- Modify: `public/dungeon/src/scenes/HubScene.ts`
- Modify: `public/dungeon/src/scenes/BossFightScene.ts`
- Create: `public/dungeon/src/scenes/CampaignCompleteScene.ts`

- [ ] **Step 1: Update HubScene to start a campaign**

Replace `src/scenes/HubScene.ts` contents:

```typescript
import Phaser from 'phaser';
import { createCampaign } from '../game/dungeon';
import { createSpellbook } from '../game/spellbook';
import type { Campaign } from '../game/dungeon';

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  create(): void {
    this.add.text(480, 60, '🏰 Gates of the Archive', {
      fontSize: '36px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(480, 120, 'The Tower of Trials awaits.', {
      fontSize: '18px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start new campaign button
    const newBtn = this.add.rectangle(480, 260, 400, 80, 0x2d1b4e);
    newBtn.setStrokeStyle(3, 0x8b7cc4);
    newBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 260, 'Begin Quest (first run)', {
      fontSize: '24px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    newBtn.on('pointerdown', () => this.beginCampaign());

    // Single-boss test button (kept from Session 1 for debugging)
    const debugBtn = this.add.rectangle(480, 380, 400, 60, 0x1b2d4e);
    debugBtn.setStrokeStyle(2, 0x6a7aa4);
    debugBtn.setInteractive({ useHandCursor: true });
    this.add.text(480, 380, '(debug) Fight Orchestrator only', {
      fontSize: '16px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);
    debugBtn.on('pointerdown', () => {
      this.scene.start('BossFightScene', { bossId: 'the-orchestrator', mode: 'first-run', isolated: true });
    });
  }

  private beginCampaign(): void {
    const seed = Date.now();
    const campaign: Campaign = createCampaign('first-run', seed);
    const spellbook = createSpellbook('first-run');
    this.registry.set('campaign', campaign);
    this.registry.set('spellbook', spellbook);
    this.registry.set('heroHp', 3); // full HP at start
    this.registry.set('sessionLog', {
      schema_version: 1,
      cert_id: this.registry.get('questions').cert_id,
      mode: campaign.mode,
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

    this.scene.start('BossFightScene', { bossId: campaign.bossOrder[0], mode: 'first-run', isolated: false });
  }
}
```

- [ ] **Step 2: Update BossFightScene to support campaign + spellbook + flow to next boss**

Replace `src/scenes/BossFightScene.ts` contents:

```typescript
import Phaser from 'phaser';
import { BOSSES, GAME_CONFIG, SPELLS } from '../config';
import { initCombat, resolveAnswer, isBossDefeated, isHeroDead } from '../game/combat';
import { pickQuestionsForFight } from '../data/questionLoader';
import { canCast, castSpell, createSpellbook, grantBossDefeatReward } from '../game/spellbook';
import type { Spellbook } from '../game/spellbook';
import type { BossDefinition, CombatState, Question, QuestionsJson, RunMode, SessionLog, SpellId } from '../types';
import type { Campaign } from '../game/dungeon';
import { advanceFloor, isCampaignComplete } from '../game/dungeon';

interface BossFightData {
  bossId: string;
  mode: RunMode;
  isolated: boolean; // single-boss test mode
}

export class BossFightScene extends Phaser.Scene {
  private state!: CombatState;
  private boss!: BossDefinition;
  private questions!: Question[];
  private spellbook!: Spellbook;
  private mode!: RunMode;
  private isolated!: boolean;
  private questionStartMs = 0;

  private heroHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private spellButtons: Phaser.GameObjects.Text[] = [];
  private tauntText!: Phaser.GameObjects.Text;
  private primerText!: Phaser.GameObjects.Text;

  private acceptingInput = false;
  private currentQuestionIdx = 0;

  constructor() {
    super({ key: 'BossFightScene' });
  }

  init(data: BossFightData): void {
    const boss = BOSSES.find(b => b.id === data.bossId);
    if (!boss) throw new Error(`Unknown boss: ${data.bossId}`);
    this.boss = boss;
    this.mode = data.mode;
    this.isolated = data.isolated;

    const questionsJson: QuestionsJson = this.registry.get('questions');
    const domainData = questionsJson.domains.find(d => d.id === boss.domain);
    if (!domainData || domainData.questions.length === 0) {
      throw new Error(`No questions for domain ${boss.domain}`);
    }
    const bossHp = GAME_CONFIG.BOSS_HP[this.mode];
    const maxQuestions = bossHp + GAME_CONFIG.HERO_MAX_HP - 1;
    this.questions = pickQuestionsForFight(domainData.questions, maxQuestions);
    this.currentQuestionIdx = 0;

    const heroHpStart = this.registry.get('heroHp') ?? GAME_CONFIG.HERO_MAX_HP;
    this.state = initCombat({ heroMaxHp: GAME_CONFIG.HERO_MAX_HP, bossMaxHp: bossHp });
    this.state.heroHp = heroHpStart;

    if (this.isolated) {
      // In debug mode, give a fresh spellbook
      this.spellbook = createSpellbook(this.mode);
    } else {
      this.spellbook = this.registry.get('spellbook');
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.boss.environmentColor);

    this.add.text(480, 30, this.boss.name, {
      fontSize: '28px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.bossHpText = this.add.text(200, 70, '', { fontSize: '18px', color: '#ff6b6b', fontFamily: 'monospace' });
    this.heroHpText = this.add.text(600, 70, '', { fontSize: '18px', color: '#8bc34a', fontFamily: 'monospace' });

    this.primerText = this.add.text(480, 130, '', {
      fontSize: '14px', color: '#ffca28', fontFamily: 'monospace',
      wordWrap: { width: 880 }, align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5, 0);

    this.questionText = this.add.text(480, 200, '', {
      fontSize: '18px', color: '#e0e0ea', fontFamily: 'monospace',
      wordWrap: { width: 880 }, align: 'center',
    }).setOrigin(0.5, 0);

    const optLetters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    optLetters.forEach((letter, idx) => {
      const y = 390 + idx * 40;
      const btn = this.add.rectangle(480, y, 800, 36, 0x1a1a2a);
      btn.setStrokeStyle(2, 0x4a4a6a);
      btn.setInteractive({ useHandCursor: true });
      const txt = this.add.text(100, y, '', {
        fontSize: '15px', color: '#d0d0da', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.optionTexts.push(txt);
      btn.on('pointerdown', () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${letter}`, () => this.submit(letter));
      this.input.keyboard?.on(`keydown-${idx + 1}`, () => this.submit(letter));
    });

    // Spellbook UI — display all spells with charges, clickable
    const spellIds: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'];
    spellIds.forEach((id, idx) => {
      const x = 100 + (idx % 3) * 280;
      const y = 570 + Math.floor(idx / 3) * 30;
      const btn = this.add.text(x, y, '', {
        fontSize: '13px', color: '#a0a0b0', fontFamily: 'monospace',
      });
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.tryCast(id));
      this.spellButtons.push(btn);
    });

    this.tauntText = this.add.text(480, 620, '', {
      fontSize: '14px', color: '#b0b0c0', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5);

    this.nextQuestion();
  }

  private refreshSpellUI(): void {
    const ids: SpellId[] = ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot', 'focus'];
    ids.forEach((id, i) => {
      const btn = this.spellButtons[i]!;
      const def = SPELLS[id];
      const charges = this.spellbook[id] ?? 0;
      const active = charges > 0;
      btn.setText(`[${def.name}] x${charges}`);
      btn.setColor(active ? '#c0c0d0' : '#505060');
    });
  }

  private tryCast(spell: SpellId): void {
    if (!this.acceptingInput) return;
    if (!canCast(this.spellbook, spell)) return;
    const sessionLog: SessionLog = this.registry.get('sessionLog');

    try {
      castSpell(spell, this.spellbook, this.state);
      sessionLog.spells_cast.push(spell);

      // Handle Echo: replace next question with a previously-asked one
      if (spell === 'echo' && this.state.questionHistory.length > 0) {
        const prior = this.state.questionHistory[Math.floor(Math.random() * this.state.questionHistory.length)]!;
        this.questions[this.currentQuestionIdx] = prior;
        // re-render current question display
        this.showCurrentQuestion();
      }

      // Handle Study the Tome: fetch primer from source_note
      if (spell === 'study-the-tome' && this.state.currentQuestion) {
        this.primerText.setText(`📖 ${this.generatePrimer(this.state.currentQuestion)}`);
      }

      // Handle Memorize: flag the current question for weakness queue
      if (spell === 'memorize' && this.state.currentQuestion) {
        const q = this.state.currentQuestion;
        sessionLog.questions.push({
          question_id: q.id,
          domain: q.domain,
          was_correct: false, // placeholder; will be overwritten on answer
          time_elapsed_ms: 0,
          flagged_for_review: true,
        });
      }
    } catch (e) {
      // No charges — silently ignore
    }
    this.refreshSpellUI();
  }

  private generatePrimer(q: Question): string {
    // Session 2: extract first sentence of explanation as a primer.
    // Session 3/4: could fetch actual concept note via build-time bundling.
    const firstSentence = q.explanation.split('.')[0] + '.';
    return firstSentence.length < 180 ? firstSentence : firstSentence.slice(0, 180) + '...';
  }

  private nextQuestion(): void {
    if (this.currentQuestionIdx >= this.questions.length) {
      this.showResult('draw');
      return;
    }
    this.state.currentQuestion = this.questions[this.currentQuestionIdx++]!;
    this.showCurrentQuestion();
  }

  private showCurrentQuestion(): void {
    const q = this.state.currentQuestion!;
    this.questionText.setText(q.stem);
    this.optionTexts.forEach((txt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D';
      txt.setText(`${letter}) ${q.options[letter]}`);
    });
    this.tauntText.setText('');
    this.questionStartMs = Date.now();
    this.acceptingInput = true;
    this.updateHp();
    this.refreshSpellUI();
  }

  private submit(choice: 'A' | 'B' | 'C' | 'D'): void {
    if (!this.acceptingInput) return;
    if (!this.state.currentQuestion) return;
    this.acceptingInput = false;

    const q = this.state.currentQuestion;
    const elapsed = Date.now() - this.questionStartMs;
    const result = resolveAnswer(this.state, choice);
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    // Record the question (overwrite if memorize already flagged it)
    const existing = sessionLog.questions.find(x => x.question_id === q.id);
    if (existing) {
      existing.was_correct = result.wasCorrect;
      existing.time_elapsed_ms = elapsed;
    } else {
      sessionLog.questions.push({
        question_id: q.id,
        domain: q.domain,
        was_correct: result.wasCorrect,
        time_elapsed_ms: elapsed,
        flagged_for_review: false,
      });
    }
    if (result.wasCorrect) sessionLog.total_correct++;
    else sessionLog.total_wrong++;

    this.updateHp();
    this.primerText.setText('');

    const tauntPool = result.wasCorrect ? this.boss.taunts.correct : this.boss.taunts.wrong;
    this.tauntText.setText(`"${tauntPool[Math.floor(Math.random() * tauntPool.length)]}"`);

    if (!result.wasCorrect) {
      this.questionText.setText(
        `✗ Incorrect. Correct: ${result.correctAnswer}\n\n${result.explanation}\n\n(click to continue)`,
      );
      this.optionTexts.forEach(t => t.setText(''));
      this.input.once('pointerdown', () => this.advanceOrEnd());
      return;
    }

    this.time.delayedCall(600, () => this.advanceOrEnd());
  }

  private advanceOrEnd(): void {
    if (isBossDefeated(this.state)) {
      this.onBossDefeated();
      return;
    }
    if (isHeroDead(this.state)) {
      this.onHeroDead();
      return;
    }
    this.nextQuestion();
  }

  private onBossDefeated(): void {
    this.questionText.setText(`🏆 ${this.boss.name} DEFEATED\n\n(click for reward)`);
    this.optionTexts.forEach(t => t.setText(''));
    this.input.once('pointerdown', () => this.grantReward());
  }

  private grantReward(): void {
    // Auto-grant +1 charge to a random first-run spell (user choice UI in Session 3)
    const choices: SpellId[] = ['echo', 'study-the-tome', 'memorize'];
    const chosen = choices[Math.floor(Math.random() * choices.length)]!;
    grantBossDefeatReward(this.spellbook, chosen);

    this.questionText.setText(`📜 Reward: +1 charge of ${SPELLS[chosen].name}\n\n(click to descend)`);
    this.refreshSpellUI();
    this.input.once('pointerdown', () => this.onFightEnd('victory'));
  }

  private onHeroDead(): void {
    this.questionText.setText(`💀 YOU DIED\n\nThe ${this.boss.name} claims another scholar.\n\n(click to return to Hub)`);
    this.optionTexts.forEach(t => t.setText(''));
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.result = 'death';
    sessionLog.ended_at = new Date().toISOString();
    sessionLog.final_hero_hp = 0;
    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }

  private onFightEnd(kind: 'victory'): void {
    const campaign: Campaign | undefined = this.registry.get('campaign');
    const sessionLog: SessionLog = this.registry.get('sessionLog');
    sessionLog.bosses_defeated.push(this.boss.id);

    if (this.isolated || !campaign) {
      this.scene.start('HubScene');
      return;
    }

    advanceFloor(campaign);
    this.registry.set('heroHp', this.state.heroHp);

    if (isCampaignComplete(campaign)) {
      sessionLog.result = 'victory';
      sessionLog.ended_at = new Date().toISOString();
      sessionLog.final_hero_hp = this.state.heroHp;
      this.scene.start('CampaignCompleteScene');
    } else {
      // Session 2: skip interstitial, go straight to next boss
      const nextBossId = campaign.bossOrder[campaign.floorsCleared]!;
      this.scene.start('BossFightScene', { bossId: nextBossId, mode: campaign.mode, isolated: false });
    }
  }

  private updateHp(): void {
    const bossHearts = '❤️'.repeat(Math.max(0, this.state.bossHp)) + '🖤'.repeat(this.state.bossMaxHp - this.state.bossHp);
    const heroHearts = '❤️'.repeat(Math.max(0, this.state.heroHp)) + '🖤'.repeat(this.state.heroMaxHp - this.state.heroHp);
    this.bossHpText.setText(`BOSS ${bossHearts}`);
    this.heroHpText.setText(`HERO ${heroHearts}`);
  }

  private showResult(kind: 'victory' | 'death' | 'draw'): void {
    // Retained for Session 1 debug mode
    if (this.isolated) this.scene.start('HubScene');
    else this.onHeroDead();
  }
}
```

- [ ] **Step 3: Write `src/scenes/CampaignCompleteScene.ts` (stub)**

```typescript
import Phaser from 'phaser';

export class CampaignCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignCompleteScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2d1b4e');
    this.add.text(480, 200, '📜 GOLDEN PARCHMENT', {
      fontSize: '48px', color: '#f5e4b3', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(480, 280, 'Quest Complete', {
      fontSize: '24px', color: '#e0e0ea', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(480, 360, '(Session 2 placeholder — score breakdown\nand Archmage Title in Session 3)', {
      fontSize: '14px', color: '#a0a0b0', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
    this.add.text(480, 460, '(click to return to Hub)', {
      fontSize: '16px', color: '#a0a0b0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('HubScene'));
  }
}
```

- [ ] **Step 4: Replace `src/main.ts`**

Task 1.7 wrote `main.ts` with 3 scenes. Replace its full contents to register the new `CampaignCompleteScene`:

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BossFightScene } from './scenes/BossFightScene';
import { CampaignCompleteScene } from './scenes/CampaignCompleteScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#0a0a14',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BossFightScene, CampaignCompleteScene],
};

new Phaser.Game(config);
```

- [ ] **Step 5: Seed content for all 5 domains (STOP — user gate)**

> **⚠️ USER COLLABORATION REQUIRED.** This step needs real domain content to avoid polluting playtesting with plausible-but-incorrect seed questions. Two paths:
>
> **Path A (preferred if executed post-exam):** the vault already has 100+ real question blocks from actual CCA-F study via `/capture`. Nothing to do — just regenerate `questions.json` in Step 6 and proceed.
>
> **Path B (if executed pre-exam for testing):** **STOP here.** The subagent must not invent seed content. User must either (a) provide 5 question blocks per domain manually, or (b) defer Session 2 smoke-testing to after real content exists in at least 2 domains.
>
> Single-domain test from Session 1 (`test-questions.md` in `domain-1-agentic/`) is already enough to exercise the full combat loop in isolation — Session 2 can proceed with "debug boss fight" mode even without domains 2-5 seeded.

If Path A: skip to Step 6. If Path B and user hasn't authored content: commit Session 2 state with `(debug) Fight Orchestrator only` as the testable path, mark smoke test partial, proceed to Session 3. No seed content is written by the subagent.

- [ ] **Step 6: Regenerate questions.json**

```bash
cd c:/projects/ai-kb/public/dungeon
npm run build:questions
```

Expected: `questions.json WRITTEN — 25 questions` (5 per domain × 5 domains).

- [ ] **Step 7: Commit**

```bash
cd c:/projects/ai-kb
git add -A
git commit -m "feat(slay-the-cert): full 5-boss campaign flow with spellbook + seed content"
```

---

### Task 2.4: Session 2 smoke test

- [ ] **Step 1: Dev server + Playwright smoke**

```bash
cd c:/projects/ai-kb/public/dungeon
npm run dev
```

Playwright smoke:
1. Navigate to http://localhost:5173
2. Wait for Hub scene
3. Click "Begin Quest (first run)"
4. Verify BossFightScene loads a boss (could be any of 5 — check boss name renders)
5. Answer questions (keyboard A-D) until boss defeated or hero dies
6. If victory: verify "Reward: +1 charge..." → click → advances to next boss
7. Complete campaign: verify CampaignCompleteScene shows Golden Parchment

- [ ] **Step 2: Final Session 2 commit**

```bash
cd c:/projects/ai-kb
git commit --allow-empty -m "chore(slay-the-cert): Session 2 complete — full 5-boss campaign playable"
```

> **⏸️ SESSION 2 COMPLETE — USER VERIFICATION REQUIRED.** User runs the full 5-boss campaign locally; reports whether spell UX, boss variety, and flow feel right before Session 3 starts.

**✅ End of Session 2.**

---

## Session 3 — Interstitials + localStorage + meta-progression (~3 hours)

**Goal:** Full first-run loop completes with: interstitials between floors (3-beat Narrative/Recall/Primer), Parchment + Title + Eternal Dungeon unlock on victory, localStorage save state, NG+/NG++/NG+++ mode support.

**Ends with:** Player completes first run → earns Parchment → Eternal Dungeon option appears in Hub → can start NG+ with Amplify spell added.

### Task 3.1: Save state + localStorage wrapper (TDD)

**Files:**
- Create: `public/dungeon/src/game/saveState.ts`
- Create: `public/dungeon/src/game/saveState.test.ts`

- [ ] **Step 1: Write tests** — covering load/save/migrate, default state, parchment/eternal flag flips.

(Full test code structure similar to previous tasks — ~80 lines of vitest covering: `loadSaveState`, `saveSaveState`, `initSaveState`, `unlockEternalDungeon`, `recordCampaignVictory`.)

- [ ] **Step 2: Write implementation**

Key functions: `loadSaveState(certId)` reads `localStorage.getItem('slay-the-cert:<certId>')`, parses JSON, validates version, returns `SaveStateV1`. `saveSaveState(state)` stringifies + writes. `initSaveState(certId)` returns fresh state.

- [ ] **Step 3: Run tests + commit**

### Task 3.2: Interstitial scene

**Files:**
- Create: `public/dungeon/src/scenes/InterstitialScene.ts`

3-beat flow:
1. **Narrative** (10-15s) — walking text with boss preview
2. **Recall** — pull 1 random question from previously-defeated boss's domain, ask without penalty
3. **Primer** — show 3-5 sentence lore-flavored snippet of upcoming boss's domain

### Task 3.3: Campaign Complete overhaul

Score breakdown, Archmage Title, Eternal Dungeon button.

### Task 3.4: NG+/NG++/NG+++ plumbing

Hub scene reads save state, shows appropriate "Begin Quest" or "Enter Eternal Dungeon" buttons. Saves mode unlocks. Passes correct mode to BossFightScene.

### Task 3.5: Session 3 smoke test

End-to-end: win first run → see parchment → re-enter with NG+ → verify Amplify spell appears in spellbook.

> **⏸️ SESSION 3 COMPLETE — USER VERIFICATION REQUIRED.** User plays through progressive mode → first clear → NG+ start; confirms Eternal Dungeon unlock, save state persistence across reloads, and interstitials read well before Session 4 starts.

---

## Session 4 — Polish + assets + session export + deploy (~3 hours)

**Goal:** Real pixel art + chiptune audio + session export + `/ingest-session` command authored + CI deploy integration. Game is publicly reachable.

### Task 4.1: Asset drop

User downloads Kenney CC0 packs locally and drops ZIPs into `public/dungeon/public/assets/_dropzone/`. Claude extracts + organizes into sprites/, tiles/, audio/ folders.

### Task 4.2: Swap placeholder rectangles for real sprites

Update all scenes to `this.load.image(...)` + `this.add.image(...)` for hero, bosses, UI.

### Task 4.3: Audio integration

BGM per boss theme (use environmentColor to theme-match which CC0 track plays). SFX for correct/wrong/spell-cast/death.

### Task 4.4: Session JSON export

End-of-session modal: "Download session log" → triggers JSON download with complete `SessionLog`.

### Task 4.5: `/ingest-session` command

Author `.claude/commands/ingest-session.md` per spec §6.8.

### Task 4.6: Quartz CI integration — detailed

**Files:**
- Modify: `c:\projects\ai-kb\.github\workflows\quartz-deploy.yml`
- Modify: `c:\projects\ai-kb\quartz\quartz.config.ts` (ignorePatterns finalization)

- [ ] **Step 1: Add steps to `quartz-deploy.yml`** — insert BEFORE the existing "Build site" step:

```yaml
      - name: Install scripts deps (for build-questions)
        working-directory: scripts
        run: npm ci

      - name: Build questions.json
        run: node scripts/build-questions.mjs . cca-f public/dungeon/public/data/questions.json

      - name: Install game deps
        working-directory: public/dungeon
        run: npm ci

      - name: Build game
        working-directory: public/dungeon
        run: npm run build

      - name: Stage game under Quartz output
        run: |
          mkdir -p quartz/public-staging/dungeon
          cp -r public/dungeon/dist/* quartz/public-staging/dungeon/
```

(The game's `dist/` output is the compiled Phaser bundle + assets. After Quartz builds, its output needs to include this as a subfolder.)

- [ ] **Step 2: Update Quartz build step** to merge game dist into its output.

Find the existing "Build site" step in the workflow:

```yaml
      - name: Build site
        working-directory: quartz
        run: npm run build:vault
```

Modify the post-build to copy the staged game output into Quartz's `public/` directory (Quartz builds to `quartz/public` by default). Add a new step AFTER "Build site":

```yaml
      - name: Merge game into Quartz output
        run: |
          if [ -d quartz/public-staging/dungeon ]; then
            cp -r quartz/public-staging/dungeon quartz/public/dungeon
          fi
```

- [ ] **Step 3: Setup-node version pin**

Verify the existing `setup-node@v4` step pins `node-version: 20` (per KB plan Task 4.2). Game requires ≥20 (ESM + current Phaser). If KB workflow pins lower, update to 20.

- [ ] **Step 4: Update Quartz `ignorePatterns`**

Edit `quartz/quartz.config.ts`. Uncomment the reserved line per the KB plan's post-exam hook:

```ts
    ignorePatterns: [
      // ... existing entries ...
      "public/dungeon",          // game is built + deployed as subfolder; Quartz should NOT index its source
    ],
```

Verify `public/dungeon/src/`, `public/dungeon/node_modules/` are implicitly excluded by the parent pattern. `public/dungeon/dist/` is what gets staged/copied in Step 1+2, not directly content-indexed.

- [ ] **Step 5: Commit + push**

```bash
cd c:/projects/ai-kb
git add .github/workflows/quartz-deploy.yml quartz/quartz.config.ts
git commit -m "feat(slay-the-cert): CI deploy — game dist merged into Quartz output"
git push
```

- [ ] **Step 6: Verify deploy**

```bash
gh run list --workflow="Deploy Quartz site" --limit 1
gh run view  # watch the logs; all 6 new steps should pass
```

After success, visit `<user>.github.io/ai-kb/dungeon/` (the URL is shown in repo Settings → Pages). Verify the game loads.

### Task 4.7: End-to-end deploy verification

Push. Watch CI. Visit `<user>.github.io/ai-kb/dungeon/`. Verify playable.

> **⏸️ SESSION 4 COMPLETE — GAME SHIPPED.** All 7 spec success criteria should verifiable. User does a final playthrough on the public URL (preferably from the locked-down work laptop browser to confirm R11 guest-play flow). Session 4 is the terminal state; no further sessions.

---

## Success criteria (per spec §1.3)

All 7 spec success criteria should be met after Session 4:

1. First-run playthrough in < 60 min ✓
2. Deploys as subfolder, works on all browsers ✓
3. Vault round-trip via `/ingest-session` ✓
4. Guest-plays-it end-to-end ✓
5. Zero game-side writes to vault without user action ✓
6. questions.json gated by Quartz build (build-questions.mjs fails on malformed blocks) ✓
7. NG+ and Eternal Dungeon genuinely distinct ✓

---

## Executing this plan

**Use `superpowers:subagent-driven-development`** per session. Fresh subagent per task (within a session) + two-stage review per task.

**Between sessions:**
- User runs the session's state locally to verify it feels right
- User reports any issues before next session starts
- Next session's subagent reads this plan + the prior session's commit log

**If a task overruns:** stop the session, commit the current state, resume next session. Prefer incremental commits over trying to finish a too-large session in one sitting.

**Plan this plan will be reviewed post-write via plan-document-reviewer** before execution.
