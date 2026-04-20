# Calibration Results

## 2026-04-20 · initial calibration run

**Status:** PASS (10/10)

**Catch rate:** 10/10 expected flags caught at or above required severity.

**Full flag summary:**
- Total flags: 12
- Critical: 8
- High: 4
- Medium: 0
- Low: 0

**Expected-flag breakdown:**
| expected question_id | pass | location | required severity | matched? |
|---|---|---|---|---|
| calib-wrongans-01 | 1 | explanation | critical | ✓ |
| calib-wrongans-02 | 1 | explanation | critical | ✓ |
| calib-distractor-01 | 2 | option-B | critical | ✓ |
| calib-distractor-02 | 2 | option-B | critical | ✓ |
| calib-stale-01 | 3 | stem | high | ✓ |
| calib-stale-02 | 3 | stem | high | ✓ |
| calib-fabricate-01 | 4 | explanation | critical | ✓ |
| calib-fabricate-02 | 4 | explanation | critical | ✓ |
| calib-wrongdomain-01 | 1 | metadata | high | ✓ |
| calib-wrongdomain-02 | 1 | metadata | high | ✓ |

**Missed expected flags (if any):** None — all 10 caught.

**Top actual flags (critical/high only):**

1. `calib-wrongans-01` · pass 1 · critical · explanation — correct letter (C) points to documented CRITICAL anti-pattern "parse natural language for loop termination"; real correct is A (check `stop_reason`).
2. `calib-wrongans-02` · pass 1 · critical · explanation — correct letter (B) points to documented CRITICAL anti-pattern "reduce tool count first"; real correct is A (improve descriptions first per misselection fix order).
3. `calib-distractor-01` · pass 2 · critical · option-B — option B ("project-level CLAUDE.md shared via version control") describes the same valid pattern as option A (`.claude/CLAUDE.md` committed to repo); two answers both describe correct approach.
4. `calib-distractor-02` · pass 2 · critical · option-B — option B ("structured persistent header carried forward verbatim every turn") is the same valid pattern as option A (immutable case-facts block); explanation explicitly acknowledges this yet marks B wrong.
5. `calib-stale-01` · pass 3 · high · stem — "latest Claude 3.5 Sonnet" referenced as current model; superseded by Claude 4 family (Sonnet 4/4.5/4.6).
6. `calib-stale-02` · pass 3 · high · stem — "computer use is currently in beta" stated as fact; computer use is now GA.
7. `calib-fabricate-01` · pass 4 · critical · explanation — explanation cites invented flag `--json-strict`; no such flag exists in the Claude Code CLI (real flags: `--output-format json`, `--json-schema`).
8. `calib-fabricate-02` · pass 4 · critical · explanation — explanation cites invented frontmatter key `autoApprove: true` in `.claude/CLAUDE.md`; this key does not exist in Claude Code's CLAUDE.md frontmatter spec.
9. `calib-wrongdomain-01` · pass 1 · high · metadata — question content is about `tool_choice` + JSON schema enforcement for structured output (domain-3-prompt-engineering), not domain-1-agentic.
10. `calib-wrongdomain-02` · pass 1 · high · metadata — question content is about `.mcp.json` secret management with `${ENV_VAR}` expansion (domain-4-mcp), not domain-5-context.

**Additional flags (bonus detections beyond expected):**

11. `calib-wrongans-01` · pass 1 · high · option-A — option A (check `stop_reason`) is actually the documented correct approach, yet is marked as a distractor with a misleading dismissal in the explanation.
12. `calib-wrongans-02` · pass 1 · high · option-A — option A (improve tool descriptions) is the documented correct first step per misselection fix order, yet is dismissed in the explanation.

---
