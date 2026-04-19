---
cert: cca-f
domain: domain-1-agentic
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios]
---

# Domain 1 — Agentic: Scenario Deep Dives

Scenarios from the CCA-F scenarios page whose "Domains tested" line includes D1 (Agentic).

## Scenario 1 — Customer Support Resolution Agent

**Setup:** Design an AI-powered customer support agent that handles inquiries, resolves issues, and escalates complex cases.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Agentic loop termination**
  - CORRECT: Check stop_reason: continue on 'tool_use', exit on 'end_turn'
  - ANTI-PATTERN: Parsing assistant text for 'done' or 'complete' keywords
- **Enforcing a $500 refund limit**
  - CORRECT: PostToolUse hook that programmatically blocks refund tool calls above $500 and escalates
  - ANTI-PATTERN: Adding 'never process refunds above $500' to the system prompt
- **When to escalate to human**
  - CORRECT: Escalate on explicit customer request, policy gaps, capability limits, business thresholds
  - ANTI-PATTERN: Escalating based on negative sentiment or self-reported low confidence

### This domain's angle

Tests agentic loop control via `stop_reason` and hook-based deterministic enforcement of business rules. Agentic correctness depends on structured termination signals and code-level hooks, never natural language or prompt-only constraints.

### Exam strategy

Every escalation question will try to trick you with sentiment-based triggers. For D1 in this scenario: the right answers are always `stop_reason` (loops) and hooks (enforcement).

---

## Scenario 3 — Multi-Agent Research System

**Setup:** Build a coordinator-subagent system for parallel research tasks.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Architecture for parallel research**
  - CORRECT: Hub-and-spoke: coordinator delegates to specialized subagents with isolated contexts
  - ANTI-PATTERN: Flat architecture where all agents share a global state or full conversation history
- **Passing context to subagents**
  - CORRECT: Pass ONLY the context relevant to each subagent's specific task
  - ANTI-PATTERN: Sharing the full coordinator conversation history with every subagent
- **Subagent failures**
  - CORRECT: Structured error propagation: report what was attempted, error type, distinguish access failure from empty result
  - ANTI-PATTERN: Silently returning empty results for failed lookups or generic 'operation failed' errors

### This domain's angle

Tests hub-and-spoke multi-agent orchestration and context isolation for subagents. Subagents do NOT inherit coordinator context; they must receive only task-scoped context.

### Exam strategy

This is the hardest scenario. Key D1 traps: sharing full context with subagents (always wrong), flat shared-state architectures (always wrong).
