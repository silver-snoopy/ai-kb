---
description: Verify a candidate questions JSON via 4-parallel-reviewer passes. On clean review, merge questions into public/exams/cca-f/bank.json (bump version, refresh built_at). Keeps candidate file as audit trail.
argument-hint: <path-to-candidate> | --calibrate
---

# /cca-f-verify-questions — adversarial verifier + bank merge

**Arguments:** `<path-to-candidate>` (required) or `--calibrate` (validates the verifier against the planted-error set).

Runs 4 parallel reviewer subagents against a candidate JSON produced by `/cca-f-generate-questions`. On clean review (zero critical/high flags), merges each question into `public/exams/cca-f/bank.json`. Candidate file is retained regardless as an audit artifact.

## Invariants (from spec §F)

- **Never overwrites existing bank questions.** Merge is additive. If a candidate's id collides with an existing bank id, verification FAILS.
- **Generator-emitted `scenario` and `domain` must be plausibility-checked.** The scenario/domain a question claims is verified against its actual content by the 5th check below.
- **Clean pass = zero critical or high flags across all 4 reviewers + scenario-plausibility check.** Medium/low flags are reported but do not block merge; user reviews them.
- **Bank version bumps on every merge.** `bank.version += 1`, `bank.built_at` refreshed.
- **Adversarial separation preserved.** Each reviewer runs in a fresh subagent — reviewers cannot see the generator's reasoning or each other's output during their pass.

## What to do

### 1. Parse arguments

- If `--calibrate`, run the calibration sub-routine (see §4).
- Otherwise, `$ARGUMENTS` is the candidate file path. Must be under `public/exams/cca-f/candidates/`. Reject any other path.

### 2. Validate the candidate structure

Read the candidate JSON. Assert:
- Top-level keys: `generated_at`, `exam_metadata`, `questions`.
- Each question in `questions[]` has the bank schema fields: `id` (starts with `gen-` or `mix-`), `source` ∈ `{"llm", "mix"}`, `domain` (valid vault slug), `scenario` (`"1"`..`"6"`), `difficulty`, `stem`, `options {A,B,C,D}`, `correct`, `explanation`, `source_note`. The `id` prefix must match the `source` (`gen-` ↔ `"llm"`, `mix-` ↔ `"mix"`).
- No duplicate ids within the candidate.
- No id collisions against current `bank.json` (read bank, compare id sets).

On any structural failure: report the issue, leave candidate in place, exit.

### 3. Dispatch 4 parallel reviewers + 1 tag check

Each reviewer is a fresh subagent (never sees the generator's internal reasoning — only the final question objects + authoritative substrate):

**Reviewer 1 — Fact-check.** For each question, confirm the correct answer is actually correct per the authoritative substrate (`certs/cca-f/_scenarios.md`, `certs/cca-f/meta.yaml`, domain anti-pattern files, CertSafari raw bank). Flag any factual error as CRITICAL.

**Reviewer 2 — Distractor audit.** Every distractor (wrong option) must be plausibly wrong — rooted in a real anti-pattern from `certs/cca-f/domain-*/anti-patterns.md`, not a random/nonsensical wrong option. Flag trivially-wrong distractors as HIGH. Flag distractors that are themselves correct answers (making the question ambiguous) as CRITICAL.

**Reviewer 3 — Stale-term sweep.** Check against `CLAUDE.md`'s stale-terms list (e.g. "Claude 2", "Claude 3.x", "computer use beta", "prompt caching beta"). Any mention without a "superseded" note → HIGH flag.

**Reviewer 4 — Explanation audit.** Every per-option explanation must:
- For the correct option: explicitly state WHY it's correct with reference to a pattern/principle.
- For distractors: explicitly state WHY it's wrong, referencing the relevant anti-pattern.
- No circular reasoning ("It's wrong because it's the wrong answer").
- No hallucinated Anthropic features or APIs.

Flag circular explanations as HIGH. Flag hallucinations as CRITICAL.

**5th check — scenario/domain plausibility (inline in this command, NOT a subagent):**
For each question, confirm:
- Its `domain` appears in `bank.scenarios[question.scenario].domains` (hard constraint — if violated, CRITICAL).
- Its stem and correct-answer explanation thematically match the scenario's CORRECT/ANTI-PATTERN pairs in `_scenarios.md`. If it reads like it belongs to a different scenario, flag HIGH.

### 4. Collect results + decide

- If zero CRITICAL and zero HIGH flags across all reviewers: **CLEAN**. Proceed to merge.
- Otherwise: **BLOCKED**. Produce `<candidate-path>.review.md` listing every flag (per reviewer, per question, severity, rationale). Leave candidate in candidates/ unchanged. Report total flag count by severity. Do NOT merge.

### 5. Merge (only on CLEAN)

- Read `public/exams/cca-f/bank.json`.
- Append every candidate question to `bank.questions[]`.
- Re-sort `bank.questions` by id (diff-stable).
- Update `bank.total`, bump `bank.version` by 1, set `bank.built_at` to current ISO.
- Write back to `public/exams/cca-f/bank.json`.
- Append a line to `public/exams/cca-f/_merge-log.md` (create if missing): `<ISO>` · merged `<candidate-filename>` · `<N>` questions · bank v`<old>` → v`<new>`.
- Leave candidate file in `candidates/` for audit.

Report: number of questions merged, new bank total, new version.

## --calibrate sub-routine

Runs the verifier against `certs/cca-f/_calibration/bad-questions.json` (10 planted errors across 5 error classes: factual, ambiguous distractor, stale term, hallucinated explanation, scenario/domain mismatch).

Target: 10/10 caught at CRITICAL or HIGH severity. Any miss is a regression in the verifier. Report per-error-class detection rate + list any missed.

Does NOT merge anything; calibration is read-only.

## Non-goals

- Does not generate questions (that's `/cca-f-generate-questions`).
- Does not promote files to a `verified/` folder (seed-file model retired; merge goes directly into bank).
- Does not delete candidate files on success (audit trail is more valuable than tidiness).
- Does not mute medium/low flags (they're surfaced, not fatal).

## See also

- Design: `docs/superpowers/specs/2026-04-20-unified-question-bank-design.md` §F
- Generate: `.claude/commands/cca-f-generate-questions.md`
- Calibration set: `certs/cca-f/_calibration/bad-questions.json`
