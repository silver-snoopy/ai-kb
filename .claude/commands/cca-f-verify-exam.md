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

```json
{
  "question_id": "<id>",
  "severity": "critical" | "high" | "medium" | "low",
  "pass": 1 | 2 | 3 | 4,
  "location": "stem" | "option-A" | "option-B" | "option-C" | "option-D" | "explanation" | "provenance" | "metadata",
  "reason": "<one-sentence diagnosis>",
  "suggested_fix": "<one-sentence repair, optional>"
}
```

### 4. Four reviewer personas

**Pass 1 — Fact check**
- Read every factual claim in stem, options, and explanation.
- Verify each factual claim is backed by a provenance citation that actually exists at the cited line.
- Flag CRITICAL if a claim is factually wrong per substrate. Flag HIGH if a provenance citation is absent or points to an unrelated location.
- Also flag wrong-domain tags: if the question content clearly belongs to a different domain than the one tagged, flag HIGH at location=metadata.

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

```json
{
  "reviewed_at": "<ISO>",
  "exam_path": "<path>",
  "flags": [ /* all flags from all 4 passes, flat array */ ],
  "summary": {
    "total_flags": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "decision": "promote" | "keep-in-candidates"
}
```

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

```
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
```
