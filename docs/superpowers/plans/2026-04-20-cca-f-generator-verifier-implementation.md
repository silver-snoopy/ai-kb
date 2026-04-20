# CCA-F Generator + Verifier Pipeline — Implementation Plan (Plan 2 of 5)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the full LLM-only content-generation pipeline so that `/cca-f-generate-exam` produces grounded candidate exams and `/cca-f-verify-exam` promotes clean ones to `verified/`. Prove the pipeline works end-to-end with the calibration gate (10/10 catch rate on known-bad fixture).

**Architecture:** Two slash-command prompts + one test fixture + one promoted output. The generator reads the full CertSafari bank for grounding, emits to `candidates/`. The verifier dispatches 4 parallel reviewer subagents against one candidate exam, writes a `.review.json` with per-question flags, atomically moves to `verified/` if no critical/high flags. The calibration fixture proves the verifier actually catches the error classes it's supposed to catch.

**Tech Stack:** Markdown slash-command prompts (not code). Agent tool dispatching via a main orchestrator. JSON fixtures and outputs. No new runtime code — all logic is expressed as prompt instructions.

**Spec:** [docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md](../specs/2026-04-20-cca-f-exam-integration-design.md) §§3–5.

---

## File structure

| Path | New/Modify | Responsibility |
|---|---|---|
| `.claude/commands/generate-exam.md` | Delete (rename) | Old top-level command — moved to cert-namespaced file |
| `.claude/commands/cca-f-generate-exam.md` | Create | New namespaced generator with CertSafari grounding + provenance + near-dup guard + candidates/ target |
| `.claude/commands/cca-f-verify-exam.md` | Create | New verifier — dispatches 4 parallel reviewer subagents, writes review report, promotes on clean |
| `certs/cca-f/_calibration/bad-questions.json` | Create | 10 deliberately-malformed questions covering 5 error classes |
| `certs/cca-f/_calibration/expected-flags.json` | Create | Ground-truth map of which flags the reviewer MUST catch per question |
| `certs/cca-f/_calibration/results.md` | Create (written by first calibration run) | Log of calibration runs and catch-rate history |
| `public/exams/cca-f/candidates/.gitkeep` | Create | Ensures the candidates directory exists in git |
| `public/exams/cca-f/candidates/index.json` | Create | Registry for candidate exams (parallel to verified/index.json) |

---

## Task 1: Rename and move generate-exam command

**Goal:** Move the existing `/generate-exam` to the `cca-f-` namespace with no other changes. Keeps the rename clean and atomic — spec changes come in Task 2.

**Files:**
- Delete: `.claude/commands/generate-exam.md`
- Create: `.claude/commands/cca-f-generate-exam.md` (content identical for now)

- [ ] **Step 1.1: Verify the current file exists**

```bash
ls -la .claude/commands/generate-exam.md
```

- [ ] **Step 1.2: Use `git mv` to rename** — preserves history cleanly:

```bash
git mv .claude/commands/generate-exam.md .claude/commands/cca-f-generate-exam.md
```

- [ ] **Step 1.3: Commit the rename** as an isolated commit (make the move reviewable separately from the content updates):

```bash
git commit -m "$(cat <<'EOF'
refactor(cca-f): rename /generate-exam → /cca-f-generate-exam

Namespaces the command per the integration design (Plan 2 §3). Uses
flat-file hyphen-prefix since Claude Code doesn't support subdirectory
colon namespaces for user commands (plugin-only).

Content unchanged in this commit — grounding + provenance + candidates/
target updates land in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Rewrite generate-exam spec with grounding + provenance + candidates/ target

**Goal:** Update the freshly-renamed `.claude/commands/cca-f-generate-exam.md` to implement design-doc §3:
- Step 2 loads the full CertSafari bank (not 4–6 for style anchoring)
- Build subdomain coverage map at step 2.5
- Step 5 injects matching CertSafari Qs per scenario as few-shot grounding
- Step 5 emits internal `<name>.provenance.json` with substrate citations per question
- Step 6 adds near-duplicate guard (trigram overlap against every CertSafari stem)
- Step 7 metadata gains `subdomain_coverage` block
- Step 8 writes to `public/exams/cca-f/candidates/` (not top-level exams/, not verified/)
- Registry: `public/exams/cca-f/candidates/index.json`
- Invariants section gains near-duplicate threshold note

**Files:**
- Modify: `.claude/commands/cca-f-generate-exam.md`
- Create: `public/exams/cca-f/candidates/.gitkeep`
- Create: `public/exams/cca-f/candidates/index.json` with `{"exams": []}`

- [ ] **Step 2.1: Read the current command file** to know what's there before editing. Expected length: ~230 lines. Read all of it.

- [ ] **Step 2.2: Update `## 2. Load the knowledge substrate` section.** Change:

```markdown
- `public/questions.json` (skim 4–6 existing questions for style anchoring)
```

to:

```markdown
- `raw/certsafari/cca-f-questions.json` (FULL bank — load all ~364 real-exam questions; used as grounding substrate, few-shot examples, subdomain coverage reference, AND near-duplicate comparison set)

## 2.5. Build subdomain coverage map

After loading the CertSafari bank, build an in-memory frequency map:
`{ [subdomain_string]: questionCount }`. This map becomes `exam_metadata.subdomain_coverage` in step 7. Surface any subdomain with zero coverage as a warning in step 4 (analogous to the existing domain-coverage warning).
```

- [ ] **Step 2.3: Update `## 5. Generate questions` section.** At the top of the rubric, add a new "Grounding" subsection BEFORE "Stem":

```markdown
**Grounding (new — enforced per scenario):**

For each kept scenario's batch of questions, before generating, select 6–10 CertSafari questions from the bank that match the scenario's tested domains (per §3 mapping). Inject these as explicit few-shot examples in the generation prompt:

> "These are real-exam questions testing the same domains. Mimic their style, rigor, and distractor plausibility. Produce NOVEL stems on angles the samples don't cover. Do not copy stems, options, or explanations verbatim."

Record the few-shot CertSafari IDs used for each generated question into provenance (see below).
```

- [ ] **Step 2.4: Add a "Provenance" requirement** to the Metadata section:

```markdown
**Internal provenance (new — per-question, written to a sibling .provenance.json file):**

For EACH generated question, emit an entry in the provenance file:

\`\`\`json
{
  "question_id": "generated-20260420-seed42-s2cg-01",
  "correct_answer_maps_to": {
    "anti_pattern": "Using Bash when a built-in tool exists",
    "source_file": "certs/cca-f/domain-4-mcp/anti-patterns.md",
    "source_line": 12
  },
  "distractors_map_to": {
    "A": { "anti_pattern": "...", "source_file": "...", "source_line": ... },
    "C": { "anti_pattern": "...", "source_file": "...", "source_line": ... },
    "D": { "anti_pattern": "...", "source_file": "...", "source_line": ... }
  },
  "few_shot_certsafari_ids": [24170, 24231, 32816]
}
\`\`\`

Provenance enables `/cca-f-verify-exam` to verify citations exist in the substrate before deep fact-checking.
```

- [ ] **Step 2.5: Update `## 6. Self-verify` section.** Add a new bullet:

```markdown
- **Near-duplicate guard (new):** for each generated stem, compute trigram overlap (Jaccard) against every CertSafari stem. If any overlap > **0.60**, reject the question and re-generate it once. If the re-generation still overlaps, abort with a clear error.
```

- [ ] **Step 2.6: Update `## 7. Assemble output JSON` shape** to add `subdomain_coverage` under `exam_metadata`:

```markdown
"subdomain_coverage": {
  "Subdomain 1.1: Design and implement agentic loops for autonomous task execution": 4,
  "Subdomain 1.2: Orchestrate multi-agent coordinator-subagent systems": 3,
  ...
},
```

(Populated from the step-2.5 map, intersected with the generated exam's actual subdomain hits.)

- [ ] **Step 2.7: Update `## 8. Write the file` section.** Change the target path:

Old: `Target: --out if provided, else public/exams/<YYYYMMDD>T<HHMMSS>Z-seed<seed>.json`

New: `Target: --out if provided, else public/exams/cca-f/candidates/<YYYYMMDD>T<HHMMSS>Z-seed<seed>.json. ALSO write <same-path>.provenance.json with the per-question provenance entries from step 5. NEVER write to public/exams/cca-f/verified/ directly — that's /cca-f-verify-exam's job.`

- [ ] **Step 2.8: Update `## 9. Update registry`**:

Old: `Append an entry to public/exams/index.json`

New: `Append an entry to public/exams/cca-f/candidates/index.json`

- [ ] **Step 2.9: Update `## Invariants` section.** Add new invariants:

```markdown
- **Near-duplicate guard:** Generated stems MUST NOT have trigram overlap > 0.60 with any CertSafari stem. Self-verify retries once; abort if still over threshold.
- **Provenance emission:** Every generated question MUST produce a provenance record. No provenance → abort.
- **Candidates-only write scope:** `/cca-f-generate-exam` writes ONLY to `public/exams/cca-f/candidates/**`. Promotion to `verified/` is `/cca-f-verify-exam`'s responsibility.
```

- [ ] **Step 2.10: Update `## Usage examples`** paths to the new locations (candidates/).

- [ ] **Step 2.11: Create the candidates directory** and its registry:

```bash
mkdir -p public/exams/cca-f/candidates
touch public/exams/cca-f/candidates/.gitkeep
printf '%s\n' '{' '  "exams": []' '}' > public/exams/cca-f/candidates/index.json
```

- [ ] **Step 2.12: Sanity check** — parse the registry:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('public/exams/cca-f/candidates/index.json','utf8')))"
```
Expected: `{ exams: [] }`.

- [ ] **Step 2.13: Commit**:

```bash
git add .claude/commands/cca-f-generate-exam.md public/exams/cca-f/candidates/
git commit -m "$(cat <<'EOF'
feat(cca-f): generate-exam — CertSafari grounding + provenance + candidates target

Implements design-doc §3 updates to /cca-f-generate-exam:
- Step 2 loads full CertSafari bank (not 4–6 for style anchoring).
- Step 2.5 builds subdomain coverage map for topic-breadth grounding.
- Step 5 injects 6–10 matching CertSafari Qs per scenario as few-shot,
  instructing the model to mimic style/rigor but produce novel stems.
- Step 5 emits sibling .provenance.json per exam with citations for
  each correct/distractor/few-shot source.
- Step 6 adds near-duplicate guard: trigram Jaccard > 0.60 vs any
  CertSafari stem → reject + retry once, else abort.
- Step 7 adds exam_metadata.subdomain_coverage block.
- Step 8 writes to public/exams/cca-f/candidates/ (not top-level or
  verified/ — verified/ is /cca-f-verify-exam's write scope).
- Step 9 updates candidates/index.json, not the old top-level registry.
- New invariants: provenance required, candidates-only write scope,
  near-duplicate threshold documented.

Candidates dir + empty registry created as scaffolding.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Author `/cca-f-verify-exam` slash command

**Goal:** New slash command that dispatches 4 parallel reviewer subagents against a candidate exam and promotes clean ones.

**Files:**
- Create: `.claude/commands/cca-f-verify-exam.md`

- [ ] **Step 3.1: Create the command file** with this content:

\`\`\`markdown
---
description: Verify a generated CCA-F exam via 4 parallel LLM reviewer passes. Promote to verified/ if clean; otherwise leave in candidates/ with flags.
argument-hint: <path-to-candidate-exam.json> [--calibrate]
---

# /cca-f-verify-exam — LLM-only multi-pass exam verifier

Reviews a candidate exam by dispatching 4 parallel adversarial reviewer subagents against each question in the exam. Each reviewer reads the question FRESH (no generator context), cross-checks claims against vault substrate, and flags issues by severity. If zero critical/high flags across all passes and questions, the exam is atomically moved to `public/exams/cca-f/verified/` and added to `verified/index.json`. Otherwise it stays in `candidates/` with the `.review.json` attached.

## Invariants

- **Adversarial separation:** reviewers MUST run in fresh subagents (Agent tool). NEVER review in the same session as the generator. Same-session self-review is a CRITICAL anti-pattern (see D3 Claude Code anti-patterns).
- **Write scope:** reads from `public/exams/cca-f/candidates/**`. Writes `.review.json` to candidates/. On promotion, moves the exam JSON (NOT the provenance) to `public/exams/cca-f/verified/` and appends to verified/index.json. NEVER modifies question content.
- **No user review in the loop:** per the architecture, the user cannot review content until post-exam. The reviewer subagents + calibration gate are the only verification between generation and verified/.
- **Critical/high blocks promotion:** any critical or high severity flag on any question → exam stays in candidates/. Medium/low are noted but do not block.

## What to do

### 1. Parse arguments

Parse `$ARGUMENTS`:
- Positional path: required UNLESS `--calibrate`. Must be a file under `public/exams/cca-f/candidates/`.
- `--calibrate`: special mode — instead of reviewing a real candidate, review the `certs/cca-f/_calibration/bad-questions.json` fixture and compare the emitted flags against `certs/cca-f/_calibration/expected-flags.json`. If all 10 expected flags are caught, the calibration passes; append a PASS entry to `certs/cca-f/_calibration/results.md`. If any are missed, append a FAIL entry with the gap analysis and DO NOT ship — tune the reviewer prompts and re-run.

### 2. Load the candidate

Read the exam JSON and its sibling provenance file (`<same-path>.provenance.json`). If provenance is missing, abort with a clear error — generator must emit it.

### 3. Dispatch 4 parallel reviewer subagents

Use the Agent tool with `general-purpose` subagent type. Launch all 4 in a single message (parallel execution) so they run concurrently.

For each subagent, construct a self-contained prompt (subagent has NO conversation context). Each prompt contains:
1. The reviewer persona (pass 1, 2, 3, or 4 — see below).
2. The full candidate exam JSON.
3. The full provenance JSON.
4. Pointer to vault substrate: the subagent must Read `certs/cca-f/_quick-reference.md`, `certs/cca-f/domain-*/anti-patterns.md`, `raw/certsafari/cca-f-questions.json` (for style cross-check), and `CLAUDE.md` (stale-terms list).
5. Strict output format: a JSON array of flags.

**Flag format (shared across all 4 passes):**
\\\`\\\`\\\`json
{
  "question_id": "<id>",
  "severity": "critical" | "high" | "medium" | "low",
  "pass": 1 | 2 | 3 | 4,
  "location": "stem" | "option-A" | "option-B" | "option-C" | "option-D" | "explanation" | "provenance" | "metadata",
  "reason": "<one-sentence diagnosis>",
  "suggested_fix": "<one-sentence repair, optional>"
}
\\\`\\\`\\\`

### 4. Four reviewer personas

**Pass 1 — Fact check**
- Read every factual claim in stem, options, and explanation.
- Verify each factual claim is backed by a provenance citation that actually exists at the cited line.
- Flag CRITICAL if a claim is factually wrong per substrate. Flag HIGH if a provenance citation is absent or points to an unrelated location.

**Pass 2 — Distractor audit**
- For each distractor (A/C/D when correct is B, etc.), verify:
  - It is genuinely wrong per the vault (not accidentally describing valid behavior).
  - Its provenance points to a named anti-pattern that actually makes the distractor wrong.
- Flag CRITICAL if a distractor is accidentally valid (i.e., a second correct answer). Flag HIGH if provenance is missing or mismatched.

**Pass 3 — Stale-term sweep**
- Cross-check all model/version/beta-status references against `CLAUDE.md`'s stale-terms blocklist.
- Flag HIGH on any "Claude 2", "Claude 3.x", "Claude 3.5 Sonnet" presented as current.
- Flag HIGH on "computer use beta" or "prompt caching beta" (both are GA).
- Flag MEDIUM on subtler currency issues (e.g., a deprecated flag name presented as current).

**Pass 4 — Explanation audit**
- Check the explanation for invented API flags, config options, or parameters that don't appear in any substrate file.
- Flag CRITICAL on fabricated `--flags` or config keys (directly poisons learner mental model).
- Flag HIGH on inconsistencies between stem and explanation.

### 5. Aggregate flags

Combine the 4 subagent outputs into a single `<exam-path>.review.json`:

\\\`\\\`\\\`json
{
  "reviewed_at": "<ISO>",
  "exam_path": "<path>",
  "flags": [ /* all flags from all 4 passes, flat array */ ],
  "summary": {
    "total_flags": <n>,
    "critical": <n>,
    "high": <n>,
    "medium": <n>,
    "low": <n>
  },
  "decision": "promote" | "keep-in-candidates"
}
\\\`\\\`\\\`

`decision` is `"promote"` iff `critical == 0 && high == 0`. Else `"keep-in-candidates"`.

### 6. Promote or keep

If `decision == "promote"`:
- Move the exam JSON from `candidates/<name>.json` to `verified/<name>.json` (keep the `.provenance.json` and `.review.json` in candidates/ for audit — don't clutter verified/).
- Append an entry to `public/exams/cca-f/verified/index.json` mirroring the candidates/ entry's fields.
- Remove the candidates/ entry from `candidates/index.json`.

If `decision == "keep-in-candidates"`:
- Leave all files in place.
- Print a summary to stdout listing the top 5 critical/high flags and their question IDs.

### 7. Calibration mode (`--calibrate`)

If `--calibrate` was passed:
- Load `certs/cca-f/_calibration/bad-questions.json` as the "candidate exam" (synthetic shape — 10 deliberately-bad questions).
- Load `certs/cca-f/_calibration/expected-flags.json` — a list of `{question_id, severity, pass, location}` entries that the reviewer MUST catch.
- Run the 4 reviewer passes as normal, producing flags.
- For each expected flag, check: was a flag with matching `(question_id, pass, location)` produced at severity ≥ the expected severity?
- If ALL 10 expected flags are caught: append to `certs/cca-f/_calibration/results.md` a PASS entry with date, total flags, and catch rate 10/10.
- If any miss: append a FAIL entry listing the missed expected flags and the reviewer output that came closest. Exit with status 1 so the caller knows to tune.

### 8. Report summary

Print to stdout:

\\\`\\\`\\\`
✓ Review complete for public/exams/cca-f/candidates/<name>.json

📊 Flags: total=N · critical=X · high=Y · medium=Z · low=W
🎯 Decision: PROMOTE / KEEP-IN-CANDIDATES

Top flags (if any):
  [CRITICAL] Q<id> / pass 1 / option-B: <reason>
  [HIGH]     Q<id> / pass 2 / provenance: <reason>
  ...

If promoted:
  → public/exams/cca-f/verified/<name>.json
  → public/exams/cca-f/verified/index.json updated
\\\`\\\`\\\`
\`\`\`

- [ ] **Step 3.2: Verify the file parses as markdown** — nothing funky:

```bash
head -5 .claude/commands/cca-f-verify-exam.md && echo "---" && wc -l .claude/commands/cca-f-verify-exam.md
```

- [ ] **Step 3.3: Commit**:

```bash
git add .claude/commands/cca-f-verify-exam.md
git commit -m "$(cat <<'EOF'
feat(cca-f): /cca-f-verify-exam — multi-pass LLM reviewer spec

New slash command that dispatches 4 parallel reviewer subagents
against a candidate exam JSON. Each pass has a single focused mandate:
(1) fact-check with provenance verification, (2) distractor audit,
(3) stale-term sweep, (4) explanation audit. Aggregates flags into a
review.json. Promotes to verified/ on zero critical/high; otherwise
keeps in candidates/ with the review attached.

--calibrate mode runs the 4-pass reviewer against the
_calibration/bad-questions.json fixture and logs catch rate to
_calibration/results.md. The calibration gate is the pre-flight check
before any real generated exam is trusted.

Design: docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md §4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Author the calibration fixture

**Goal:** 10 deliberately-bad questions + their expected-flag ground truth. This is the test set that proves the verifier works.

**Files:**
- Create: `certs/cca-f/_calibration/bad-questions.json`
- Create: `certs/cca-f/_calibration/expected-flags.json`

**Error classes (2 questions each):**
1. **Wrong-answer**: the designated correct letter actually maps to a distractor per vault; the real correct answer is a different letter.
2. **Distractor-valid**: a distractor text accidentally describes legitimate behavior per vault (two correct answers).
3. **Stale-term**: references "Claude 3.5 Sonnet" or "computer use beta" as current.
4. **Fabricated-flag**: explanation cites a non-existent CLI flag or config option.
5. **Wrong-domain**: question is tagged with a domain the content doesn't actually test.

- [ ] **Step 4.1: Create `certs/cca-f/_calibration/bad-questions.json`** with 10 questions (2 per error class). Use this shape matching the exam schema (so the same reviewer logic applies):

```json
{
  "built_at": "2026-04-20T00:00:00Z",
  "total": 10,
  "exam_metadata": {
    "seed": 0,
    "source": "calibration-fixture",
    "verified_by": "hand-authored-with-known-errors",
    "generator": "author",
    "generator_date": "2026-04-20T00:00:00Z",
    "composition": "calibration"
  },
  "by_domain": { /* fill in per question */ },
  "domains": { /* same DOMAIN_META block as other exams */ },
  "questions": [
    /* 10 entries — see per-question content below */
  ]
}
```

Author ten questions, each with:
- A realistic-looking stem in CCA-F subject area (2–3 sentences minimum).
- 4 options A/B/C/D.
- A specific planted error per its class.
- Provenance (`source-note`) can be `"calibration-fixture"` literal string.

**Concrete question specs to author** (the subagent writes the actual text; these define the error to plant):

| # | id | domain | error_class | planted_error |
|---|---|---|---|---|
| 1 | calib-wrongans-01 | domain-1-agentic | wrong-answer | Stem asks about correct agentic-loop termination. Options include `stop_reason` check (correct per vault) and `parsing text for "done"` (anti-pattern). `correct` is set to the anti-pattern letter, not the stop_reason letter. |
| 2 | calib-wrongans-02 | domain-4-mcp | wrong-answer | Stem asks about fix order for tool misselection. Options include "improve descriptions first" (correct per vault) and "reduce tools first" (anti-pattern). `correct` is set to the anti-pattern letter. |
| 3 | calib-distractor-01 | domain-2-claude-code | distractor-valid | Stem asks where team standards go. Options A-D: 'project .claude/CLAUDE.md' (correct), 'a project-specific CLAUDE.md file committed to git' (ALSO valid — same thing phrased differently), '~/.claude/CLAUDE.md' (wrong), 'inline comments' (wrong). `correct` is A; the second option accidentally describes the same valid thing. |
| 4 | calib-distractor-02 | domain-5-context | distractor-valid | Stem about context management. Correct answer is 'persistent case-facts block'. A distractor reads 'immutable structured header with Customer/Order/Issue' — accidentally the same valid pattern. |
| 5 | calib-stale-01 | domain-1-agentic | stale-term | Stem references "the latest Claude 3.5 Sonnet model" as the recommended choice. Correct letter is accurate; the stem's model reference is stale. |
| 6 | calib-stale-02 | domain-4-mcp | stale-term | Stem's context says "computer use is currently in beta and not recommended for production." This is stale — computer use is GA. |
| 7 | calib-fabricate-01 | domain-3-prompt-engineering | fabricated-flag | Explanation for correct answer cites a non-existent `--json-strict` flag for Claude Code. Real flag is `--output-format json` or `--json-schema`. |
| 8 | calib-fabricate-02 | domain-2-claude-code | fabricated-flag | Explanation cites a non-existent `autoApprove: true` config key in CLAUDE.md frontmatter. |
| 9 | calib-wrongdomain-01 | domain-1-agentic | wrong-domain | Question is actually about JSON schema extraction (belongs in domain-3-prompt-engineering) but tagged domain-1-agentic. |
| 10 | calib-wrongdomain-02 | domain-5-context | wrong-domain | Question is about .mcp.json configuration (belongs in domain-4-mcp) but tagged domain-5-context. |

- [ ] **Step 4.2: Create `certs/cca-f/_calibration/expected-flags.json`** — the ground truth the verifier MUST catch:

```json
{
  "expected_flags": [
    { "question_id": "calib-wrongans-01",    "min_severity": "critical", "pass": 1, "location": "explanation" },
    { "question_id": "calib-wrongans-02",    "min_severity": "critical", "pass": 1, "location": "explanation" },
    { "question_id": "calib-distractor-01",  "min_severity": "critical", "pass": 2, "location": "option-B" },
    { "question_id": "calib-distractor-02",  "min_severity": "critical", "pass": 2, "location": "option-B" },
    { "question_id": "calib-stale-01",       "min_severity": "high",     "pass": 3, "location": "stem" },
    { "question_id": "calib-stale-02",       "min_severity": "high",     "pass": 3, "location": "stem" },
    { "question_id": "calib-fabricate-01",   "min_severity": "critical", "pass": 4, "location": "explanation" },
    { "question_id": "calib-fabricate-02",   "min_severity": "critical", "pass": 4, "location": "explanation" },
    { "question_id": "calib-wrongdomain-01", "min_severity": "high",     "pass": 1, "location": "metadata" },
    { "question_id": "calib-wrongdomain-02", "min_severity": "high",     "pass": 1, "location": "metadata" }
  ]
}
```

Note: "location" for wrong-domain is `"metadata"` because it's about the `domain` tag mismatch, not a specific option.

- [ ] **Step 4.3: Validate the fixture JSON parses**:

```bash
node -e "const fs=require('fs');const b=JSON.parse(fs.readFileSync('certs/cca-f/_calibration/bad-questions.json','utf8'));const e=JSON.parse(fs.readFileSync('certs/cca-f/_calibration/expected-flags.json','utf8'));console.log('bad-questions total:',b.total,'expected flags:',e.expected_flags.length)"
```
Expected: `bad-questions total: 10 expected flags: 10`

- [ ] **Step 4.4: Commit**:

```bash
git add certs/cca-f/_calibration/
git commit -m "$(cat <<'EOF'
feat(cca-f): calibration fixture — 10 bad questions across 5 error classes

_calibration/bad-questions.json holds 10 deliberately-malformed CCA-F
questions, 2 per error class the verifier must catch:
  - wrong-answer (correct letter actually maps to anti-pattern)
  - distractor-valid (a distractor accidentally describes valid behavior)
  - stale-term (Claude 3.5 Sonnet as current / computer use as beta)
  - fabricated-flag (explanation cites non-existent CLI flag / config key)
  - wrong-domain (question content contradicts the assigned domain tag)

_calibration/expected-flags.json is the ground truth — the exact
(question_id, pass, location, min_severity) map /cca-f-verify-exam
must produce when run with --calibrate. Catch rate below 10/10
blocks the pipeline from shipping real content.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Run the calibration gate

**Goal:** Invoke `/cca-f-verify-exam --calibrate` (as a user would) to verify the reviewer actually catches all 10 planted errors. If it does, the pipeline is trustworthy.

**This task is interactive and iterative** — if calibration fails, we tune the reviewer persona prompts and re-run. Max 3 iteration attempts per calibration run; if still failing, escalate.

- [ ] **Step 5.1: Invoke the verifier in calibration mode.** Use the Skill tool to invoke `/cca-f-verify-exam --calibrate`.

  Expected behavior: the command parses `--calibrate`, loads the fixture, dispatches 4 reviewer subagents, aggregates flags, compares against expected-flags, writes result to `certs/cca-f/_calibration/results.md`.

- [ ] **Step 5.2: Inspect the result**:

```bash
cat certs/cca-f/_calibration/results.md
```
Expected (on success): "PASS: 10/10 caught at <date>" with a full flag breakdown.

- [ ] **Step 5.3: If 10/10, commit the results log**:

```bash
git add certs/cca-f/_calibration/results.md
git commit -m "$(cat <<'EOF'
chore(cca-f): first calibration-gate result — verifier passes 10/10

Log of the initial /cca-f-verify-exam --calibrate run. All 10 planted
errors caught at expected severity by the 4-pass reviewer. Pipeline is
trusted; real /cca-f-generate-exam outputs can now land in candidates/
and be promoted to verified/ via /cca-f-verify-exam.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5.4: If calibration FAILS (caught < 10):**
  1. Inspect `certs/cca-f/_calibration/results.md` for the missed flags.
  2. Identify which reviewer pass missed which planted errors.
  3. Revise the corresponding reviewer persona section in `.claude/commands/cca-f-verify-exam.md` — make the mandate more explicit for the missed class.
  4. Re-run step 5.1.
  5. Max 3 iterations. After 3 consecutive failures, STOP and escalate — the calibration fixture may be poorly designed or the reviewer personas may need rearchitecting.

Each tuning iteration should be its own small commit so the calibration history is auditable:

```bash
git commit -m "fix(cca-f): tune <pass name> reviewer — catch <missed error class>"
```

---

## Task 6: Handoff

**Deliverables after Tasks 1–5:**
- [ ] `.claude/commands/cca-f-generate-exam.md` — renamed and updated with grounding + provenance + candidates/ target
- [ ] `.claude/commands/cca-f-verify-exam.md` — new multi-pass reviewer spec
- [ ] `certs/cca-f/_calibration/bad-questions.json` — 10-question fixture
- [ ] `certs/cca-f/_calibration/expected-flags.json` — ground truth
- [ ] `certs/cca-f/_calibration/results.md` — PASS entry at 10/10
- [ ] `public/exams/cca-f/candidates/` directory + empty index.json

**What's now unblocked:**
- Full pipeline: `/cca-f-generate-exam` → candidates/ → `/cca-f-verify-exam` → verified/ or kept-for-review.
- Plan 4 (Phase 3 Weakness queue) — no direct dependency, but richer content from the generator makes the weakness queue more useful.

**Not in scope of this plan:**
- Actually generating a real (non-calibration) exam — save for once calibration passes and Plan 4 shipped.
- Partial regeneration of flagged questions — YAGNI per the design doc.
- `rejected/` tier for exams that fail multiple times — same.

---

## Deferred / out of scope for this plan

- Generator self-healing (re-generate flagged Qs in-place after verifier flags them) — design-doc §10 explicitly defers this.
- Reviewer caching (remember prior judgments to skip re-review on unchanged content) — no need yet.
- Calibration fixture expansion (more error classes, more questions per class) — 2-per-class × 5 classes is the minimum viable gate. Expand only if we see specific slips in real usage.
- Human review UI for flagged candidate exams — user explicitly can't review until post-exam.

---

## Success criteria (from spec §11 subset)

- [ ] `/cca-f-verify-exam --calibrate` run passes at 10/10.
- [ ] `/cca-f-generate-exam` writes to `candidates/` (verified via file creation — no actual generation in scope).
- [ ] `/cca-f-verify-exam` when run against a candidate promotes to `verified/` if clean (verified via the calibration fixture passing — real exam verification happens post-plan once we generate one).
- [ ] Calibration history log exists and has its first PASS entry.
