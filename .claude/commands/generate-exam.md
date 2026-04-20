---
description: Dynamically generate a 60-question CCA-F exam JSON using real exam rules (4 of 6 scenarios at random). Output is consumable by public/practice/ UI and the future Slay the Cert game.
argument-hint: [--seed N] [--size N] [--drop N] [--difficulty e/m/h] [--out PATH]
---

# /generate-exam — dynamic CCA-F exam generator

**Arguments:** `[--seed N]` `[--size N]` `[--drop N]` `[--difficulty e/m/h]` `[--out PATH]`

Defaults match the real exam (from `certs/cca-f/meta.yaml` and `_exam-guide-extract.md`):

- `--size 60` (real exam `exam.question_count`)
- `--drop 2` (keep **4 of 6** scenarios, per the guide's "4 of the 6 scenarios above, chosen at random" rule)
- `--difficulty 9/30/21` (easy/medium/hard — scaled from user's "between option B and C" preference across 60 Qs)
- `--seed` = `Date.now()` when omitted (logged for reproducibility of the scenario pick)
- `--out` = `public/exams/<UTC-timestamp>-seed<seed>.json`

Zero marginal cost per invocation on a Claude Max subscription — cheap to rerun.

## What to do

### 1. Parse arguments

Parse `$ARGUMENTS`. All flags are optional. Validate:
- `--size` is a positive integer; default 60.
- `--drop` is 0..5; default 2. (`6 - drop` scenarios kept.)
- `--difficulty` is `E/M/H` with three non-negative integers summing to `--size`. If sum mismatches, rescale proportionally and log.
- `--seed` is any integer; default `Date.now()`.
- `--out` is a path under `public/exams/`. Reject writes outside `public/exams/`.

### 2. Load the knowledge substrate

Read these vault files via the Read tool (once each, top-to-bottom):

- `CLAUDE.md` (stale-terms list; vault conventions)
- `certs/cca-f/meta.yaml` (exam parameters — domain weights, time limit, passing score)
- `certs/cca-f/_exam-guide-extract.md` (scenario list, exam rules, sample-question index)
- `certs/cca-f/_scenarios.md` (per-scenario setup + domains tested)
- `certs/cca-f/_quick-reference.md` (per-domain decision rules + exam traps — distractor catalog)
- `certs/cca-f/domain-1-agentic/anti-patterns.md`
- `certs/cca-f/domain-2-claude-code/anti-patterns.md`
- `certs/cca-f/domain-3-prompt-engineering/anti-patterns.md`
- `certs/cca-f/domain-4-mcp/anti-patterns.md`
- `certs/cca-f/domain-5-context/anti-patterns.md`
- `public/questions.json` (skim 4–6 existing questions for style anchoring)

### 3. Seeded scenario pick

Implement mulberry32 (pure function, no deps) keyed by `--seed`. Shuffle the 6 scenario IDs and split into `scenarios_kept` (first `6 - drop`) and `scenarios_dropped` (rest).

Scenario ID vocabulary (closed set, from `_scenarios.md`):

1. `scenario-1-customer-support` — D1, D4, D5
2. `scenario-2-code-gen` — D2, D3
3. `scenario-3-multi-agent-research` — D1, D5
4. `scenario-4-dev-productivity` — D4
5. `scenario-5-ci-cd` — D2, D3
6. `scenario-6-structured-extraction` — D3, D5

Log the pick: `🎲 seed=<N> · kept=[...] · dropped=[...]`.

### 4. Quota and coverage pre-check

**Per-scenario quota:** `--size / (6 - drop)`. Default 60 / 4 = **15 per scenario**. If not evenly divisible, distribute the remainder to the earliest scenarios in `scenarios_kept`.

**Per-scenario difficulty split:** distribute `--difficulty` proportionally. Default 9/30/21 across 4 scenarios → 2–3 easy / 7–8 medium / 5–6 hard per scenario. Carry the remainder to earlier scenarios.

**Domain-coverage pre-check:** compute the union of domains across `scenarios_kept`. If any of the 5 domains has zero coverage (e.g., dropping both S2 and S5 eliminates all D2 coverage, since S2 and S5 are the only D2-testing scenarios), add a human-readable entry to `coverage_warnings` and echo it prominently in the stdout summary. **Do NOT re-roll** — per the official exam guide, the drop is purely random and uneven coverage is a legitimate exam outcome.

### 5. Generate questions

For each kept scenario, generate its quota of fresh MCQs. Each question must conform to this rubric:

**Stem:**
- Opens with `Scenario: <scenario-name>.` on its own line.
- 2–6 additional sentences describing a concrete production situation with a decision point.
- No URLs. No citations. No external references.
- No quoting from existing question stems in `public/questions.json` — fresh content each time.

**Options:**
- Exactly 4, keyed A / B / C / D, each a single-line string.
- Exactly one correct; three plausible distractors.
- Each distractor must map to a named anti-pattern from the vault's `anti-patterns.md` files or a documented exam trap from `_quick-reference.md`. Track the mapping internally; surface it in the explanation.
- Avoid trivial giveaways: never make the correct answer the longest, never put "all of the above" / "none of the above".

**Correct:** one letter `A`..`D`.

**Explanation:**
- 4 short paragraphs (~1–2 sentences each), one per option, in order A/B/C/D.
- Each paragraph opens with the letter and a verdict: `A: Incorrect. …` / `B: Correct. …`, matching the `certsafari` style in `public/questions.json`.
- Reference the specific anti-pattern / exam trap / Claude-API concept being tested.
- No URLs.

**Metadata fields (required):**
- `id`: `generated-<YYYYMMDD>-seed<seed>-<scenario-short>-<NN>` (NN is zero-padded within scenario; `scenario-short` is e.g. `s1cs`, `s2cg`, `s3mar`, `s4dp`, `s5ci`, `s6se`).
- `domain`: from the closed vocabulary `domain-1-agentic` / `domain-2-claude-code` / `domain-3-prompt-engineering` / `domain-4-mcp` / `domain-5-context`. Must be a domain the kept scenario actually tests (per §3 mapping).
- `scenario`: the scenario ID from §3.
- `difficulty`: `easy` / `medium` / `hard`.
- `stem`, `options` (object with A,B,C,D), `options_array` (array parallel to A-D), `correct`, `explanation`.
- `source-note`: string literal `generated-from-vault-<YYYY-MM-DD>` (never a URL).

**Difficulty calibration rubric (apply consistently):**
- `easy` = single-concept recall. One decision point, one anti-pattern tested, distractors are obviously wrong to someone who has studied that sub-topic. Stem 2–3 sentences.
- `medium` = scenario with a tradeoff. Two or three competing considerations; distractors are plausible mistakes a junior practitioner would make. Stem 4–5 sentences.
- `hard` = multi-domain scenario with subtle distractors. Two domains interact; at least one distractor is "correct but not the *most* correct"; requires weighing principles against each other. Stem 5–6 sentences, may reference specific API parameters or tool configurations.

**Stale-terms blocklist (from `CLAUDE.md`):** never reference "Claude 2", "Claude 3.x", "Claude 3.5 Sonnet" as current; never call "computer use" or "prompt caching" a beta; the current model family is Claude 4.x (Opus 4.7, Sonnet 4.6, Haiku 4.5).

### 6. Self-verify

Before writing, pass the assembled question list through these checks. Re-generate (one retry) any item that fails; bail with a clear error if any item still fails after one retry.

- Every question has all required fields and non-empty values.
- `correct` letter maps to a non-empty option.
- No two options within a single question have identical text.
- No question stem contains a URL (simple `http` / `www.` substring check).
- No two questions have identical stems.
- Every question's `domain` is a domain its `scenario` actually tests (per §3 mapping).
- Actual difficulty distribution is within ±3 of target per bucket. If off, re-roll the overshot bucket once.
- Actual count equals `--size` exactly.

### 7. Assemble output JSON

Shape matches `public/questions.json` so the existing UI loads it unchanged:

```json
{
  "built_at": "<ISO UTC>",
  "total": 60,
  "exam_metadata": {
    "seed": 42,
    "scenarios_kept": ["scenario-1-customer-support", "..."],
    "scenarios_dropped": ["...", "..."],
    "difficulty_target": { "easy": 9, "medium": 30, "hard": 21 },
    "difficulty_actual": { "easy": 9, "medium": 30, "hard": 21 },
    "coverage_warnings": [],
    "exam_rules_source": "certs/cca-f/meta.yaml + _exam-guide-extract.md (60 Q, 4 of 6 scenarios)",
    "time_limit_minutes": 120,
    "passing_score": 720,
    "scale_max": 1000,
    "generator": "/generate-exam",
    "generator_date": "<ISO UTC>"
  },
  "by_domain": { "domain-1-agentic": 18, "domain-4-mcp": 8, "...": "..." },
  "by_scenario": { "scenario-1-customer-support": 15, "...": "..." },
  "domains": {
    "domain-1-agentic":           { "num": 1, "name": "Agentic Architecture & Orchestration",   "weight": 0.27, "color": "#f39c4a" },
    "domain-2-claude-code":       { "num": 2, "name": "Claude Code Configuration & Workflows",  "weight": 0.20, "color": "#a87cf0" },
    "domain-3-prompt-engineering":{ "num": 3, "name": "Prompt Engineering & Structured Output", "weight": 0.20, "color": "#5db5f0" },
    "domain-4-mcp":               { "num": 4, "name": "Tool Design & MCP Integration",          "weight": 0.18, "color": "#5ad1a0" },
    "domain-5-context":           { "num": 5, "name": "Context Management & Reliability",       "weight": 0.15, "color": "#e85d75" }
  },
  "questions": [ /* 60 items, each as §5 */ ]
}
```

Shuffle `questions` before writing (seeded by `seed + 1`) so the order doesn't leak scenario groupings.

### 8. Write the file

Target: `--out` if provided, else `public/exams/<YYYYMMDD>T<HHMMSS>Z-seed<seed>.json`. Create the directory if missing (`public/exams/` should already exist with `.gitkeep`).

Pretty-print JSON with 2-space indentation (matches `public/questions.json`).

### 9. Update registry

Append an entry to `public/exams/index.json` (create with `{ "exams": [] }` if missing):

```json
{
  "path": "public/exams/<filename>.json",
  "seed": 42,
  "date": "<ISO UTC>",
  "total": 60,
  "scenarios_kept": [...],
  "scenarios_dropped": [...],
  "difficulty_actual": {...},
  "coverage_warnings": [...]
}
```

### 10. Report summary

Echo to the user (concise, no prose padding):

```
✓ Generated exam written to public/exams/<file>.json

🎲 Seed: 42
📋 Scenarios kept (4): scenario-1-customer-support, scenario-3-multi-agent-research, scenario-4-dev-productivity, scenario-6-structured-extraction
📋 Scenarios dropped: scenario-2-code-gen, scenario-5-ci-cd
📊 Difficulty: easy 9 · medium 30 · hard 21 (target 9/30/21 ✓)
🎯 By domain: D1 18 · D2 0 · D3 5 · D4 13 · D5 24
⚠️  Coverage warning: Domain 2 (Claude Code) has 0 questions — both D2-testing scenarios were dropped.

Open in practice UI:
  public/practice/index.html?src=../exams/<file>.json
```

## Invariants

- **Write scope:** ONLY to `public/exams/**`. NEVER write to `certs/**`, `concepts/**`, `raw/**`, or any other vault folder.
- **No URLs:** Question stems and explanations never contain URLs. `source-note` is always the literal string `generated-from-vault-<YYYY-MM-DD>`.
- **Size contract:** Output must contain exactly `--size` questions. If self-verify §6 cannot reach that count after one retry per item, ABORT — do not silently produce an undersized exam.
- **Seed reproducibility:** Same `--seed` must produce the same `scenarios_kept` / `scenarios_dropped`. Question content is intentionally fresh per run (the "dynamic generation" contract; this is a feature, not a bug).
- **Coverage warnings:** If a domain has zero coverage, the warning MUST appear both in `exam_metadata.coverage_warnings` and in the stdout summary. Never silently ship an exam missing a domain.
- **Closed vocabularies:** `domain` and `scenario` field values must come from the respective closed sets. No novel IDs.
- **Real exam calibration:** Defaults (60 Q, 4 of 6 scenarios) mirror `certs/cca-f/meta.yaml` and `_exam-guide-extract.md`. If either source diverges in the future, update THIS command, not the defaults ad-hoc.

## Usage examples

```
/generate-exam                            # real exam rules: 60 Q, 4 of 6 scenarios, fresh content
/generate-exam --seed 42                  # reproducible scenario pick (content still fresh each run)
/generate-exam --size 12 --drop 2         # small smoke-test: 3 Q per kept scenario
/generate-exam --drop 1                   # easier coverage: keep 5 of 6 scenarios
/generate-exam --difficulty 20/40/0       # no hard questions, for early study
/generate-exam --out public/exams/my-exam.json
```

## Consuming the output

The practice UI accepts a `?src=` query parameter:

```
public/practice/index.html?src=../exams/<filename>.json
```

The future Slay the Cert game (see `docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md`) will consume the same schema.
