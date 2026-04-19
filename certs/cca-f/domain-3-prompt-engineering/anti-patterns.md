---
cert: cca-f
domain: domain-3-prompt-engineering
status: done
source: 2026-04-18-anti-patterns
tags: [seeded, anti-patterns]
---

# Domain 4 (vault folder: domain-3-prompt-engineering) — Prompt Engineering: Anti-Patterns

D4 — Prompt Engineering (3 patterns).

### Vague instructions like 'be thorough' or 'find all issues' (CRITICAL)

**Why wrong:** Leads to over-flagging, false positives, and alert fatigue. Developers stop trusting the tool.

**Correct approach:** Provide explicit, measurable criteria: 'flag functions exceeding 50 lines'

**Why correct works:** Specific criteria produce consistent, actionable results that build trust.

### Assuming tool_use guarantees semantic correctness (HIGH)

**Why wrong:** tool_use guarantees STRUCTURE only. Values inside the JSON may still be wrong.

**Correct approach:** Validate extracted values after tool_use with business rule checks

**Why correct works:** Schema compliance + semantic validation together ensure both correct format AND correct content.

### Generic retry messages: 'There were errors, please try again' (HIGH)

**Why wrong:** Without specific error details, the model has no signal for what to fix.

**Correct approach:** Append specific error details: which field, what was wrong, expected vs actual

**Why correct works:** Specific feedback gives the model a clear correction target.
