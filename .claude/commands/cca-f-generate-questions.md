---
description: Generate N novel CCA-F questions for a target scenario/domain, grounded in the CertSafari substrate. Output is a candidate JSON for verification + merge into bank.json.
argument-hint: [--count N] [--scenario S] [--domain D] [--seed N] [--difficulty e/m/h] [--out PATH]
---

# /cca-f-generate-questions — generator for new bank questions

**Arguments:** `[--count N]` `[--scenario 1..6]` `[--domain <slug>]` `[--seed N]` `[--difficulty e/m/h]` `[--out PATH]`

Generates novel CCA-F exam questions (not a full 60-Q exam — the old `/cca-f-generate-exam` is retired; mock exams are now runtime arrangements over the bank). Output feeds the `candidates/` → verify → merge-to-`bank.json` pipeline.

**Defaults:**
- `--count 10` — number of questions to generate per run.
- `--scenario` — optional. If provided, all generated questions target that scenario. If omitted, the generator distributes across scenarios proportionally to domain weights (27/20/20/18/15).
- `--domain` — optional. If provided, all questions are in that domain. Must be compatible with `--scenario` (see `bank.scenarios[S].domains`) — combining an incompatible pair is an error.
- `--difficulty` — `e`, `m`, or `h`. If omitted, pick based on scenario: medium default, harder for deeper topics.
- `--seed` — for reproducibility. Defaults to `Date.now()`. Logged in `exam_metadata.seed` in the output file.
- `--out` — target path under `.tmp-ingest/candidates/`. Defaults to `.tmp-ingest/candidates/gen-<UTC-timestamp>-seed<seed>.json`.

## What to do

### 1. Parse arguments

Validate. Reject `--out` paths outside `.tmp-ingest/candidates/`. If `--scenario` and `--domain` both set, verify the domain is in `bank.scenarios[S].domains` — reject otherwise.

### 2. Load substrate

Read these files via the Read tool:

- `CLAUDE.md` (vault conventions, stale-terms list)
- `certs/cca-f/meta.yaml` (exam params)
- `certs/cca-f/_scenarios.md` (authoritative scenario taxonomy with CORRECT/ANTI-PATTERN pairs — the primary few-shot source)
- `certs/cca-f/_quick-reference.md` (distractor catalog per domain)
- `certs/cca-f/domain-<1..5>-*/anti-patterns.md` (per-domain anti-patterns)
- `certs/cca-f/domain-<1..5>-*/official-sample-questions.md` (verbatim questions from the official CCA-F exam guide — authoritative reference for question shape, stem length, distractor style, explanation depth. Use as the primary few-shot pattern exemplar alongside `_scenarios.md`. NOT copied; used as stylistic anchor.)
- `public/exams/cca-f/bank.json` (current bank — existing questions used for near-duplicate detection via stem-trigram overlap)
- `raw/certsafari/cca-f-questions.json` (CertSafari substrate — grounding for topic authenticity, NOT copied verbatim)

### 3. Generate

For each of `--count` questions:

1. Pick target scenario and domain (per args or weighted random within args' constraints).
2. Draft stem: a concrete exam-style scenario question rooted in a CORRECT/ANTI-PATTERN pair from the target scenario. Aim for 60-200 words including enough setup that a single right answer is obvious.
3. Draft 4 options (A/B/C/D): exactly 1 correct. Distractors use the domain's anti-pattern catalog so they're plausibly wrong, not random wrong.
4. Mark correct letter.
5. Write per-option explanations: each explanation explains WHY that option is right/wrong referencing an anti-pattern from the catalog if applicable.
6. Emit the full question object:

```json
{
  "id": "gen-<uuid-v4>",
  "source": "llm",
  "domain": "<vault-slug>",
  "scenario": "<1..6>",
  "difficulty": "easy|medium|hard",
  "stem": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct": "B",
  "explanation": "A: ...\nB: ...\nC: ...\nD: ...",
  "source_note": "<output-filename> (generator seed=<seed>)"
}
```

**Critical contract:** the generator MUST emit `scenario` at creation time (not left null). The verifier checks scenario plausibility; untagged questions fail verification.

### 4. Near-duplicate guard

Before finalizing, for each generated stem compute a lowercased-trigram set, compare against every existing bank stem's trigram set. If Jaccard overlap > 0.55 against any bank question, regenerate that stem (up to 2 retries). If still duplicate, abort the run and report which existing id it collides with.

### 5. Write output

Serialize:

```json
{
  "generated_at": "<ISO>",
  "exam_metadata": {
    "count": N,
    "scenario": "<arg or null>",
    "domain": "<arg or null>",
    "seed": N,
    "difficulty_hint": "e|m|h|null",
    "generator": ".claude/commands/cca-f-generate-questions.md",
    "generator_model": "<claude-model-id>",
    "coverage_warnings": []
  },
  "questions": [ <N question objects> ]
}
```

Write to `--out` (default under `candidates/`). Report total generated, per-scenario and per-domain breakdown, and any retries on near-duplicate.

### 6. Next step (do NOT execute automatically)

Tell the user:

> Ready for verification: `/cca-f-verify-questions <output-path>` — runs the 4-reviewer pass and merges into bank.json on clean review.

## Non-goals

- **Not a mock-exam generator.** Mock exams are runtime-built by `public/exams/arrangement.js`'s `buildMockExam`. This command produces NEW questions to grow the bank, not arrangements of existing ones.
- **Does not merge into bank.json.** Merge is the verifier's job (adversarial separation — a clean audit trail of what was generated vs what was approved).
- **Does not overwrite bank.json.** Output always lands in `candidates/` as a separate file.

## See also

- Design: `docs/superpowers/specs/2026-04-20-unified-question-bank-design.md` §F
- Verify: `.claude/commands/cca-f-verify-questions.md`
- Bank shape: `public/exams/cca-f/bank.json`
