# CCA-F Exam Integration — Design (2026-04-20)

**Topic:** Dynamic exam generation, LLM-only verification, and integration into practice/review/dungeon surfaces.

**Target cert:** CCA-F (Claude Certified Architect — Foundations), exam 2026-05-31.

**Authoring context:** User cannot review generated content until post-exam (reading answers contaminates prep). Therefore the LLM must verify autonomously; generated output that reaches user-facing surfaces must be trustworthy enough to study from blind.

---

## 1. Context and constraints

Today the three study surfaces (practice UI, future review loop, dungeon game) consume a single hand-built `public/questions.json` (232 Qs — 220 from CertSafari + 12 official samples). We want them to consume a **growing library** of dynamic exam JSON files plus pre-packaged CertSafari-sourced exams.

**Hard constraints:**
- User does not review question content until 2026-06-01 — LLM-only verification between now and then.
- Study material lands on the user's screen; an error on the screen becomes an error in the user's head.
- Static hosting (GitHub Pages) — no server-side generation; all generation happens locally via Claude Code.
- Claude Max subscription — token cost is negligible; context windows ~1M on Opus 4.7.

**Non-goals:**
- Non-CCA-F cert support until Anthropic announces the next cert.
- Shared UI component library across surfaces (each surface implements its own picker).
- Human-approval workflows (UI for accept/reject flagged exams) — defer until post-exam.

---

## 2. Architectural principles

### 2.1 Cert-id as first-class axis

Three parallel coordinates all keyed by cert-id:

| Coordinate | Path pattern |
|---|---|
| Substrate | `certs/<cert-id>/` |
| Commands | `.claude/commands/<cert-id>-<cmd>.md` → `/<cert-id>-<cmd>` (flat-file hyphen prefix) |
| Exam output | `public/exams/<cert-id>/{candidates,verified}/*.json` |

For CCA-F, `<cert-id>` = `cca-f` (matches existing vault folder). Vault-level commands (`/lint`, `/capture`, `/ingest-url`, `/seed-urls`) stay un-namespaced. Cert-specific top-level commands already present (`/tutor`, `/quiz`, `/mock-exam`, `/ingest-session`) defer migration until second cert lands — YAGNI.

**Note on namespace syntax:** CoVE verification against Claude Code docs confirmed that `.claude/commands/` does **not** support subdirectory-based colon namespacing (`/cca-f:cmd`) — that syntax is plugin-only. We use flat-file hyphen-prefix naming instead (`/cca-f-cmd`). Semantic equivalence, slightly different ergonomics. If we later decide flat hyphen-prefix is too ugly, we can convert to a plugin for proper `/cca-f:cmd` namespacing — but that's a post-MVP consideration.

### 2.2 Candidates/verified split

- **`public/exams/cca-f/candidates/`** — unreviewed LLM-generated exams; internal staging. User never sees this path.
- **`public/exams/cca-f/verified/`** — the trusted pool. Every study surface reads from here.

### 2.3 Trust hierarchy

| Question source | Review required | Lands in |
|---|---|---|
| CertSafari real-exam bank | None (pre-verified; source is ground truth) | `verified/` directly |
| `/cca-f-generate-exam` | Multi-pass LLM verifier + calibration gate | `candidates/` → promoted to `verified/` if clean |

---

## 3. Generator updates (`/cca-f-generate-exam`)

Rename from `/generate-exam`; move file from `.claude/commands/generate-exam.md` → `.claude/commands/cca-f-generate-exam.md`.

Substrate grounding added per yesterday's feedback memory `feedback_generator_grounds_in_certsafari.md`:

- **Step 2 (load substrate)**: load full `raw/certsafari/cca-f-questions.json` (not a 4–6 sample). Build subdomain coverage map from the bank. Substrate is read dynamically so today's added CertSafari questions flow through automatically.
- **Step 5 (generate)**: for each kept scenario, inject matching CertSafari questions (by domain/subdomain) as explicit few-shot with instruction "mimic style and rigor, produce novel stems on unseen angles." Also emit internal `<name>.provenance.json` alongside the exam, with per-question citations: "correct-answer anti-pattern X in file Y, distractor-A anti-pattern Z in file W."
- **Step 6 (self-verify)**: add near-duplicate guard — trigram overlap of each generated stem against every CertSafari stem; reject+regenerate if overlap > ~0.6.
- **Step 7 (metadata)**: add `subdomain_coverage` block showing actual subdomain distribution.
- **Step 8 (write)**: write target is `public/exams/cca-f/candidates/` (not top-level exams/, not verified/).
- **Registry**: `candidates/index.json`.

---

## 4. Verifier (`/cca-f-verify-exam`)

**New slash command:** `.claude/commands/cca-f-verify-exam.md`.

Input: path to a candidate JSON. Dispatches 4 parallel reviewer subagents via the Agent tool. Each subagent runs in a fresh context with its own focused system prompt and full substrate access — no shared reasoning with the generator (same-session self-review is forbidden per vault D3 anti-pattern).

### 4.1 Four reviewer passes

| Pass | Mandate | Catches |
|---|---|---|
| ① Fact-check | Every factual claim in stem/options/explanation traces to a substrate citation that actually supports it. | Invented facts; misquoted substrate. |
| ② Distractor audit | Each distractor is genuinely wrong per vault AND maps to a named anti-pattern cited in provenance. | Distractor accidentally valid; unmoored distractors. |
| ③ Stale-term sweep | No Claude 2/3.x/3.5 Sonnet as current; no "computer use beta"/"prompt caching beta"; model/version refs cross-checked. | Stale/deprecated references. |
| ④ Explanation audit | No invented API flags, config options, or parameters. All named APIs/flags appear in substrate. | Fabricated `--flags`; hallucinated config keys. |

### 4.2 Output

`<name>.review.json` with structured per-question flags: `{ question_id, severity: critical|high|medium|low, pass: 1|2|3|4, location: "stem"|"option-A"|..., reason, suggested_fix }`.

### 4.3 Gate

- Zero critical + zero high flags → atomic move of exam JSON to `verified/`, update `verified/index.json`, archive `.review.json` alongside.
- Any critical/high → exam stays in `candidates/` with `.review.json` attached. Not promoted.

### 4.4 Calibration gate (one-time, before first production use)

- **Fixture**: `certs/cca-f/_calibration/bad-questions.json` with 10 deliberately corrupted questions:
  - 2 wrong-answer (correct letter is actually wrong)
  - 2 distractor-valid (a "wrong" distractor is legitimately correct)
  - 2 stale-term (mentions Claude 3.5 Sonnet as current)
  - 2 fabricated-flag (invents a non-existent `--json-strict` or similar)
  - 2 wrong-domain (answer correct but question misclassified into wrong domain)
- **Run**: `/cca-f-verify-exam --calibrate` executes all 4 passes against the fixture.
- **Threshold**: must catch 10/10 or the reviewer prompts get tuned until they do. Results logged to `certs/cca-f/_calibration/results.md`.

---

## 5. Pre-seed the verified pool from CertSafari

### Step 1: Complete CertSafari extraction

- **Current state (verified via CoVE)**: exactly 220 Qs in `raw/certsafari/cca-f-questions.json`, split as:
  - 87 from CertSafari D1 (Agentic) → vault `domain-1-agentic`
  - 60 from CertSafari D2 (Tool Design & MCP) → vault `domain-4-mcp`
  - 73 from CertSafari D3 (Claude Code) → vault `domain-2-claude-code`
  - 0 from CertSafari D4 (Prompt Engineering, 72 available) → vault `domain-3-prompt-engineering`
  - 0 from CertSafari D5 (Context, 72 available) → vault `domain-5-context`
- Total missing: **144** (72 + 72). Target ~336 implies extracting 116 of them today.
- Target: ~336 (user's stated goal).
- Tool: `scripts/extract-certsafari.mjs` (exists; already handles CORS headers and daily-limit abort).
- Today's extraction must prioritize the two entirely-missing domains (`--domain domain-3-prompt-engineering` and `--domain domain-5-context`). Daily rate limit is 150 Qs/IP/day — achievable in one run but tight; if user wants the full 144, split across two days.
- **Script pacing update (Step 1a)**: `scripts/extract-certsafari.mjs` line 62 currently sets `PACING_MS = 2500`; bump to **2600ms** for a bit of headroom under the ~30 req/min cap. Also fix the stale comment on line 14 that still says "500ms pacing" (leftover from an earlier revision — never matched the actual constant). One-line code change plus a comment fix.
- **After extraction**: rebuild derivatives — run `scripts/build-questions.mjs` (existing) to refresh `public/questions.json`; regenerate per-domain `certs/cca-f/domain-*/certsafari-questions.md` files.

### Step 2: Build CertSafari-sourced verified exams

- **New script**: `scripts/build-certsafari-exams.mjs`.
- **Output**: N exam JSONs at `public/exams/cca-f/verified/certsafari-<seed>.json`. Proposed N = 5 exams initially (user can regenerate as bank grows).
- **Composition per exam**: 60 Qs drawn from the CertSafari bank, balanced per `meta.yaml` domain weights (27%/18%/20%/20%/15% mapping to D1/D4/D2/D3/D5 vault slugs). Seeded for reproducibility.
- **Scenario tagging**: CertSafari questions lack scenario tags. Emit exams WITHOUT the 4-of-6-scenario structure — instead metadata.composition says `certsafari-mixed`. The UI treats these as "mixed practice" pools. This is intentional — CertSafari predates our scenario taxonomy.
- **Metadata**: `source: "certsafari-curated"`, `verified_by: "source-is-ground-truth"`, `generator: "scripts/build-certsafari-exams.mjs"`. Bypasses `/cca-f-verify-exam` entirely — source is pre-verified.
- **Registry**: entries appended to `public/exams/cca-f/verified/index.json` with `source: "certsafari-curated"` tag so picker UIs can distinguish these from generator output.

**End of Step 2**: `verified/` has 5 ready-to-pick CertSafari-sourced exams. Study surfaces have immediate, trustworthy content.

---

## 6. Phase 1 — Practice picker + post-attempt review

### 6.1 Practice landing page (new)

- **Path**: `public/practice/picker.html` (new).
- **Behavior**: fetch `public/exams/cca-f/verified/index.json`; render cards per exam showing seed, date, source tag (CertSafari-curated vs generated), difficulty counts, coverage warnings.
- **Action**: clicking a card navigates to `public/practice/index.html?src=<exam-path>` (existing `?src` handling continues to work unchanged).

### 6.2 Post-attempt review screen (update to existing practice UI)

- After user submits answers, show missed-questions list with full explanations and the correct answer.
- Per-missed-question "Save to weakness queue" button. Button is disabled/hidden until Phase 3 ships the write path.
- Optional v1: include a per-domain score summary.

**Effort estimate**: ~200 LOC vanilla JS across picker page + review screen additions.

---

## 7. Phase 2 — Dungeon picker + metadata-driven stages

### 7.1 Start-screen modal

- Before game boot, present a picker modal fetching the same `verified/index.json`.
- User selection → `loadQuestionsJson(pickedUrl)` (function already accepts a URL parameter at `public/dungeon/src/data/questionLoader.ts:28`).
- Question pool instantiated from the chosen exam; rest of game unchanged.

### 7.2 Metadata-driven stage balance

- `exam_metadata.difficulty` counts drive encounter mix (easy→minions, medium→elites, hard→boss).
- `coverage_warnings` lock or gray-out related wings ("Domain 2 has no questions — Claude Code wing locked.").
- `source: certsafari-curated` exams may present slightly differently in UI (e.g., "Verified real-exam source" ribbon vs "Generated practice set").

**Effort estimate**: ~100 LOC TypeScript (picker modal + metadata wiring) plus a Vite rebuild.

---

## 8. Phase 3 — Weakness queue review

### 8.1 Populate (write path)

- On practice submit, each missed question gets a "Save to weakness queue" action.
- Clicking append-to-file: adds a line to `certs/cca-f/weakness-queue.md` in CLAUDE.md-specified format:
  `- [ ] <exam-path>#<question-id> — <domain-id> · "<first 60 chars of stem>"`
- First time the file doesn't exist, practice UI creates it with a minimal header.

### 8.2 Consume (read path)

- `public/practice/index.html?review=weak` mode.
- Parses unchecked items from `weakness-queue.md`; for each item, fetches the exam JSON and extracts the referenced question.
- Runs a filtered practice session over just those questions.
- Correct answers tick items off; incorrect answers leave them unchecked (or re-add to bottom — see open questions).

### 8.3 Open Phase 3 questions (answer when Phase 3 becomes active)

1. Markdown parse in-browser is awkward — do we mirror to `weakness-queue.json` at save time for easier consumption?
2. Spaced-repetition cadence — check off after 1 correct, 2 corrects, or configurable?
3. Re-add-on-wrong behavior — prepend, append, or flag as "still wrong" with counter?

**Effort estimate**: ~250 LOC vanilla JS + an optional JSON mirror write path.

---

## 9. Execution order

| Step | What | Blocks | When |
|---|---|---|---|
| 1 | Complete CertSafari extraction (≥116 new Qs, priority D4 + D5) | — | Today |
| 2 | Build CertSafari-sourced exams in `verified/` (5 exams) | 1 | Today |
| 3 | Move+rewrite `generate-exam` → `/cca-f-generate-exam` with grounding | — | Before Phase 1 |
| 4 | Author `/cca-f-verify-exam` + calibration fixture | — | Before Phase 1 |
| 5 | Run calibration gate, tune until 10/10 | 4 | Before any generated exam ships |
| 6 | Phase 1 — Practice picker + post-attempt review | 2 | After Steps 1–2 |
| 7 | Phase 2 — Dungeon picker + metadata stages | 6 | After Phase 1 |
| 8 | Phase 3 — Weakness queue write + re-drill read | 6 | After Phase 2 |

Steps 3–5 can run in parallel with Steps 1–2. Phase 1 can ship against just the CertSafari-sourced exams without waiting for the generator pipeline.

---

## 10. Deferred / YAGNI

- Partial regeneration of flagged questions (re-gen one question vs whole exam).
- `rejected/` tier for exams that fail verification twice.
- Shared picker component across surfaces — each surface builds its own for now.
- Rich domain-performance analytics post-attempt — missed-list only initially.
- Human approval UI for flagged exams — defer until post-May-31.
- Weakness-queue spaced-repetition metadata — plain checkbox list to start.
- Second-cert namespacing of `/tutor`, `/quiz`, `/mock-exam`, `/ingest-session` — wait for second-cert announcement.
- `/cca-f-generate-exam` self-healing (re-generate flagged Qs in-place) — out of scope this pass.

---

## 11. Success criteria

- [ ] `raw/certsafari/cca-f-questions.json` total ≥ 336.
- [ ] `public/exams/cca-f/verified/` has ≥ 5 browseable CertSafari-sourced exams with a populated `index.json`.
- [ ] `/cca-f-verify-exam --calibrate` passes 10/10 catches (logged in `certs/cca-f/_calibration/results.md`).
- [ ] `/cca-f-generate-exam` writes to `candidates/`; `/cca-f-verify-exam` promotes clean ones to `verified/`; flagged ones stay in `candidates/` with review notes.
- [ ] Practice picker at `public/practice/picker.html` lists every `verified/` exam; clicking launches existing practice UI.
- [ ] Post-attempt review shows missed questions with full explanations.
- [ ] Dungeon start-screen picker launches the game with the chosen exam's question pool.
- [ ] Weakness queue save-on-miss works; `?review=weak` mode re-drills the unchecked set.

---

## 12. Key deviations from yesterday's handoff

- **Namespace under `/cca-f-…` prefix** (new this session). Yesterday's memory assumed top-level `/generate-exam` — rename is part of this design. Original plan proposed `/cca-f:…` colon namespace; CoVE verification against Claude Code docs forced a switch to flat-file hyphen-prefix since subdirectory namespacing is plugin-only.
- **Candidates/verified split** (new). Yesterday's plan had a single `public/exams/` folder.
- **CertSafari as grounding substrate, not style anchor** (new feedback memory this session). Yesterday's generator only sampled 4–6 for style.
- **Multi-pass LLM verifier with calibration gate** (new). Yesterday's plan had no human-less verification path.
- **CertSafari-sourced verified exams as a pre-seed** (new this session). Gives Phase 1 immediate content without waiting for generator maturity.
