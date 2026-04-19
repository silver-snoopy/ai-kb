---
description: Full-length mock exam. Study mode (default) = per-question feedback + save-to-weakness-queue. Simulation mode (--sim) = timed, end-scored.
argument-hint: <cert-id> [--sim] [--count N]
---

# /mock-exam — full-length mock exam

**Arguments:** `<cert-id>` `[--sim]` `[--count N]`

Defaults:
- Mode: study (per-question feedback, no timer)
- Count: `meta.yaml`'s `exam.question_count` (60 for CCA-F)
- With `--sim`: timer = `meta.yaml`'s `exam.time_limit_minutes`, no feedback during

## What to do

1. Parse `$ARGUMENTS`. Require `<cert-id>`. Parse `--sim` flag, `--count N` override.
2. Load via `obsidian-mcp`: `CLAUDE.md`, `certs/<cert-id>/meta.yaml`, ALL files under `certs/<cert-id>/domain-*/` (full domain coverage), and referenced `concepts/*`.
3. Compute per-domain question distribution using `meta.yaml` weights × N. Round to integers so the sum equals N. For CCA-F default N=60:
   - Domain 1 (0.27): 16
   - Domain 2 (0.20): 12
   - Domain 3 (0.20): 12
   - Domain 4 (0.18): 11
   - Domain 5 (0.15): 9
   - Total: 60 ✓
4. Generate question bank: for each domain, pull N_domain scenario-based MCQs grounded in the vault notes for that domain. Format as `exam.format` from meta.yaml.
5. **Study mode (default):**
   - For each question:
     - Present `Q<n>/<N> [Domain: <name>]: <scenario>` + options A-D.
     - Wait for answer.
     - Immediate verdict + explanation + source citation (same format as `/quiz`).
     - On wrong answer: prompt "Save to weakness queue? [y/n/skip]".
   - No timer.
   - Generate session report (see §6 below) and write to `certs/<cert-id>/mock-exams/<YYYY-MM-DD>-study.md` (append `-NN` if multiple on the same day).
6. **Simulation mode (`--sim`):**
   - Announce: "Simulation mode. You have <T> minutes. No feedback until the end. Good luck."
   - Start timer (internal; report elapsed at end).
   - Present all questions sequentially. Just collect answers.
   - At end: score, breakdown, explanations for all answers, report saved to `certs/<cert-id>/mock-exams/<YYYY-MM-DD>-sim.md`.
7. **Session report format** (YAML frontmatter + markdown body):
   ```markdown
   ---
   cert: <cert-id>
   mode: study | sim
   date: <ISO-8601 UTC>
   score: <int>           # number correct
   total: <int>           # N
   passing_score: <int>   # scaled to meta.yaml's scale_max; for study mode use pct × scale_max
   pass: true | false
   time_elapsed_seconds: <int>
   time_limit_seconds: <int>   # null for study mode
   per_domain_scores:
     domain-1-agentic: { correct: 14, total: 16, pct: 87.5 }
     domain-2-claude-code: { correct: 10, total: 12, pct: 83.3 }
     # ... etc
   weak_spots:
     - "MCP tool schema edge cases"
     - "Context compaction thresholds"
   ---

   # Mock Exam Report — <date> (<mode> mode)

   **Score: <correct>/<total> (<pct>%) — <PASS|FAIL>** (need <passing_score> / <scale_max> = <pct_needed>%)

   ## Per-domain breakdown

   | Domain | Correct | Total | % | Status |
   |---|---:|---:|---:|:---:|
   | Agentic Architecture | 14 | 16 | 87.5% | 🟢 |
   ...

   ## Questions

   ### Q1 [Domain 1 — Agentic] (✓)

   **Scenario:** <full scenario text>

   **Your answer:** A
   **Correct:** A

   **Explanation:** <2-4 sentences>

   **Source:** `certs/cca-f/domain-1-agentic/orchestration-patterns.md`
   **Saved to weakness queue:** n/a (answer correct)

   ### Q2 [Domain 1 — Agentic] (✗)

   **Scenario:** ...
   **Your answer:** C
   **Correct:** B
   **Explanation:** ...
   **Source:** ...
   **Saved to weakness queue:** yes

   ... (repeat for all N)
   ```
8. Append any saved weakness entries to `certs/<cert-id>/weakness-queue.md` as checkbox items.
9. Update `index.md` — add a row for the mock-exam report file.

## Invariants

- Score scaling: for study mode, just use raw percentage. For `--sim`, compute `pct × scale_max` as the scaled score and compare to `passing_score`.
- `pass` field is authoritative — dashboard parses this exactly.
- Weak spots auto-derived: 2+ incorrect answers in the same sub-topic → weak spot entry.
- Never skip the report write, even on partial completion (user ctrl-C'd). Write what's there with an `incomplete: true` flag.

## Usage examples

```
/mock-exam cca-f                  # 60-question study mode, no timer
/mock-exam cca-f --sim             # 60-question, 120-min timer, end-scored
/mock-exam cca-f --count 20        # short study-mode warmup
```
