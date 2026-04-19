---
cert: cca-f
domain: domain-1-agentic
status: done
source: 2026-04-18-anti-patterns
tags: [seeded, anti-patterns]
---

# Domain 1 — Agentic Architecture: Anti-Patterns

D1 — Agentic Architecture (5 patterns).

### Parsing natural language for loop termination (CRITICAL)

**Why wrong:** Text content is for the user, not control flow. The model may phrase completion differently each time.

**Correct approach:** Check stop_reason field (tool_use vs end_turn)

**Why correct works:** stop_reason is a structured, deterministic field that reliably signals whether the agent needs to continue.

### Arbitrary iteration caps as primary stopping mechanism (CRITICAL)

**Why wrong:** May cut off the agent mid-task or allow it to loop pointlessly. Does not reflect task completion.

**Correct approach:** Let the agentic loop terminate naturally via stop_reason

**Why correct works:** The model decides when it is done based on task state, not an arbitrary number.

### Prompt-based enforcement for critical business rules (CRITICAL)

**Why wrong:** Prompts are probabilistic. The model CAN and WILL sometimes ignore critical instructions.

**Correct approach:** Use programmatic hooks (PreToolUse/PostToolUse) for deterministic enforcement

**Why correct works:** Hooks run as code, not suggestions. They provide 100% reliable enforcement.

### Sentiment-based escalation to human agents (HIGH)

**Why wrong:** An angry customer with a simple request does NOT need a human. Sentiment does not equal task complexity.

**Correct approach:** Escalate based on policy gaps, capability limits, explicit requests, or business thresholds

**Why correct works:** Objective criteria prevent unnecessary escalations while catching genuine edge cases.

### Self-reported confidence scores for decision-making (HIGH)

**Why wrong:** Model confidence scores are not well-calibrated and cannot be relied upon for production decisions.

**Correct approach:** Use structured criteria and programmatic checks for escalation decisions

**Why correct works:** Programmatic checks based on observable facts are reliable and auditable.
