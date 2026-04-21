---
cert: cca-f
domain: domain-1-agentic
status: draft
source: 2026-04-21-architect-playbook
tags: [playbook, patterns, multi-agent, escalation, fork-session]
links:
  - ../../../raw/papers/The Architect's Playbook.md
  - ../../../concepts/architecture/architect-reference-matrix.md
  - ./anti-patterns.md
  - ./scenarios.md
---

# Domain 1 — Agentic Architecture: Patterns from The Architect's Playbook

Compiled from `raw/papers/The Architect's Playbook.pdf` (27-page deck, 2026). The playbook frames agentic architecture around a **Hierarchy of Constraints** — Latency, Accuracy, Compliance, Cost — each mitigated by a specific class of pattern. This note covers the six Domain-1 patterns with direct exam relevance: escalation, shared memory, session branching, delegation, tool-failure handling, and execution ordering.

### The Escalation Handoff (CRITICAL)

**Anti-pattern:** Dumping raw conversation transcripts to the next agent or human reviewer.

**Correct pattern:** Two distinct escalation triggers — **explicit customer request** ("I want a human NOW") *or* **complex policy issue detected**. The first path honors the request immediately with no further clarification; the second path gathers context via `get_customer` BEFORE handoff. Both paths converge on a **structured summary payload**:

```json
{
  "customer_id": "CUST-847392",
  "root_cause": "Duplicate charges due to gateway timeout.",
  "amount": "847.00 USD",
  "recommended_action": "Approve refund for 847.00 USD and notify customer."
}
```

**Why correct works:** Transcript dumps push context-window bloat onto the receiving agent/human; structured payloads keep each stage's context bounded AND make the handoff auditable. *Figure p14.*

### Shared Memory Architecture (HIGH)

**Anti-pattern:** Daisy-chaining full conversation logs between subagents. Token cost scales O(n²) — each subagent inherits the growing transcript.

**Correct pattern:** Decouple state from invocation. Subagents **write findings to a shared vector store**; subsequent agents **retrieve only semantically-relevant priors** via search. State lives in the store, not in transient messages.

**Why correct works:** Per-subagent context stays bounded regardless of pipeline depth. Survives mid-pipeline crashes — if the synthesis agent dies, earlier findings aren't lost. *Figure p21.*

### Branching Reality via `fork_session` (HIGH)

**Anti-pattern:** Exploring A/B alternatives (e.g., "microservice extraction vs in-place refactor") in a single thread. The two approaches' context contaminate each other, producing conclusions that oscillate.

**Correct pattern:** `fork_session` creates two separate branches from a foundational analysis. Each branch explores independently under isolated context; comparison happens at decision-time by reading from both.

**Why correct works:** Prevents the "I just argued the opposite three turns ago" failure mode in extended exploration. *Figure p18.*

### Goal-Oriented Delegation (MEDIUM)

**Anti-pattern:** Giving a subagent detailed step-by-step procedural instructions ("search Bing for X, then Google Scholar, then read the first 3 PDFs"). It fails rigidly on emerging topics or misses tangential sources.

**Correct pattern:** Specify **research goals and quality criteria** rather than procedural steps. Let the specialized subagent determine its own search strategy. Keep tool interfaces generic but add enum parameters to guide behavior:

```python
tool: 'analyze_document'
params: { analysis_type: 'extraction' | 'summarization' }
```

**Why correct works:** Procedural prompts assume the subagent has less domain knowledge than the caller, which defeats the purpose of delegation. Goal + quality bar lets the specialized agent apply its own expertise.

### Graceful Tool Failure (HIGH)

**Anti-pattern:** Subagent raises an exception on tool failure (breaking the loop) or silently returns an empty result (indistinguishable from "no data exists").

**Correct pattern:** Return the error message in the tool result's `content` field with **`isError: true`** flag set. Distinguish failure modes clearly: access failure (401/403) vs rate-limited (429) vs genuinely empty result (200 + empty list).

**Why correct works:** The calling agent can *reason* about the failure (retry vs abort vs escalate) rather than crashing or silently degrading. Matches the contract every well-behaved tool result obeys.

### Forcing Execution Order via `tool_choice` (MEDIUM)

**Anti-pattern:** Prompt-begging to enforce tool ordering ("You MUST call `extract_metadata` before `lookup_citations`"). Yields a 3%+ failure rate even with emphatic wording.

**Correct pattern:** Use API-level constraints. Set `tool_choice` on the first API call to *guarantee* the first tool invocation:

```python
{
  "model": "claude-3-opus-20240229",
  "tool_choice": {"type": "tool", "name": "extract_metadata"},
  "tools": [...]
}
```

**Why correct works:** Removes model discretion entirely — structural API enforcement beats probabilistic prompt enforcement for order-of-operations.

## Exam angle

Four canonical traps in Domain-1 questions this playbook arms you against:

1. **"Dumps full transcript to next agent"** → always wrong. Look for structured-summary answers.
2. **"All subagents share global context"** → always wrong. Look for isolated-context or shared-vector-store answers.
3. **"System prompt says MUST"** → almost always wrong when tool_choice or an app-layer hook would enforce structurally.
4. **"Subagent throws on failure"** → wrong. Correct is `isError: true` in the tool result.

```question
id: playbook-domain-1-01
domain: domain-1-agentic
scenario: "1"
difficulty: medium
stem: |
  Scenario: Customer Support Resolution Agent.

  Your agent escalates ~8% of tickets to human reviewers. Analysis shows humans spend 3-4 minutes reading the full conversation transcript before taking action, and in 15% of escalations the reviewer reports missing critical context (account status, refund amount already offered). You need to make escalations faster and more accurate. Which change most directly addresses both issues?
options:
  A: Append a one-line "reason for escalation" to the transcript header so the reviewer can prioritize.
  B: Pass a structured summary payload (customer_id, root_cause, amount, recommended_action) to the reviewer instead of the raw transcript.
  C: Train reviewers on speed-reading agent transcripts and add a keyboard shortcut to jump to the latest exchange.
  D: Have the agent flag "critical context" turns in the transcript with a visual marker the reviewer can scan.
correct: B
explanation: |
  A: Adds metadata but still forces the reviewer to read the transcript — doesn't reduce time or prevent missed context.
  B: Correct. The Architect's Playbook explicitly prescribes a structured handoff payload (customer_id, root_cause, amount, recommended_action). The reviewer receives exactly what they need to act, no more, no less — faster AND more consistent.
  C: Doesn't address the "missing critical context" problem at all; treats the symptom, not the cause.
  D: Still requires reading unstructured turns and risks the agent mis-flagging which turns matter. Structured payloads avoid both problems.
source-note: raw/papers/The Architect's Playbook.md (Escalation Handoff, p14)
```

```question
id: playbook-domain-1-02
domain: domain-1-agentic
scenario: "3"
difficulty: hard
stem: |
  Scenario: Multi-Agent Research System.

  Your pipeline chains 6 subagents: web-search → 2 document-analysis → synthesis → editor → publisher. Each subagent receives the full prior conversation as context so nothing gets lost. You're observing token costs per run that grow quadratically with pipeline depth, and mid-pipeline crashes (one failing subagent) cause the entire run to be discarded. What architectural change addresses both issues simultaneously?
options:
  A: Increase the context window by switching to a larger model so token growth becomes less painful.
  B: Add a retry wrapper around each subagent so crashes trigger automatic re-invocation from the same input.
  C: Replace daisy-chained message history with a shared vector store; each subagent writes findings there, and downstream agents retrieve only semantically-relevant priors via search.
  D: Compress each prior conversation by summarizing it before passing to the next subagent, reducing token cost per handoff.
correct: C
explanation: |
  A: A bigger context window doesn't change the O(n²) scaling — it only raises the ceiling before you hit it.
  B: Retry loops cost tokens per attempt and don't preserve prior work — a crashed synthesis agent re-runs over the same bloated inputs.
  C: Correct. Shared-vector-store architecture decouples state from invocation. Per-subagent context stays bounded (retrieve-only-what-you-need), and if one subagent crashes, prior findings persist in the store rather than evaporating with the transient message chain.
  D: Summarization is lossy and pushes the problem down one level — you're still passing growing state along, just compressed. Doesn't address crash recovery.
source-note: raw/papers/The Architect's Playbook.md (Shared Memory Architecture, p21)
```

```question
id: playbook-domain-1-03
domain: domain-1-agentic
scenario: "4"
difficulty: medium
stem: |
  Scenario: Developer Productivity with Claude.

  You're helping an engineer decide between two refactoring approaches for a legacy billing module: (A) extract a microservice, or (B) refactor in place. You've been exploring both in a single long chat session, and you notice the agent's recommendations increasingly contradict earlier turns — sometimes arguing for extraction, sometimes against. The foundational analysis of the module is sound; the drift is in the approach comparison. What architectural pattern most directly resolves this?
options:
  A: Ask the agent to summarize its position at the start of every turn so it self-corrects against drift.
  B: Use fork_session to branch from the foundational analysis — one branch explores microservice extraction, the other explores in-place refactoring, each with isolated context.
  C: Instruct the agent in the system prompt to pick one approach upfront and commit to it for the remainder of the session.
  D: Set temperature to 0 to eliminate the stochasticity causing the agent to waver between positions.
correct: B
explanation: |
  A: Self-summarization can't fix context contamination — the contradicting content is still in the window informing every next turn.
  B: Correct. fork_session (Branching Reality pattern) creates two branches from a foundational analysis, each with isolated context. Each branch reasons cleanly about one approach; comparison happens at decision-time by reading both.
  C: Committing upfront defeats the purpose — you need the comparison. Also doesn't address the actual failure mode (context contamination).
  D: Temperature-0 doesn't prevent contradiction when the context itself contains contradictory reasoning from earlier turns. The agent will confidently contradict itself.
source-note: raw/papers/The Architect's Playbook.md (Branching Reality, p18)
```

```question
id: playbook-domain-1-04
domain: domain-1-agentic
scenario: "3"
difficulty: hard
stem: |
  Scenario: Multi-Agent Research System.

  Your research agent extracts paper metadata and then looks up each paper's DOI via lookup_citations. In production, ~5% of runs call lookup_citations FIRST (before extract_metadata), passing an empty/partial metadata blob that causes the lookup to fail or return wrong citations. The system prompt already says "Call extract_metadata BEFORE any citation lookup." Per the Playbook's "Forcing Execution Order" pattern, which API-level construct most reliably fixes this?
options:
  A: Rephrase the system prompt in all-caps and add "CRITICAL - DO NOT VIOLATE" to emphasize the ordering constraint.
  B: Add a few-shot example showing the correct ordering, then retry on failure with the error message appended.
  C: 'On the first API call, set tool_choice to {type: "tool", name: "extract_metadata"} so the API itself guarantees the first tool invocation.'
  D: Remove lookup_citations from the available tools on the first turn; only re-enable it after extract_metadata has completed.
correct: C
explanation: |
  A: Prompt-begging — even emphatic — still leaves a 3%+ failure rate per the Playbook. The 5% observed is consistent with that.
  B: Few-shot + retry costs tokens per failed attempt and doesn't eliminate the probabilistic failure; it just makes it cheaper.
  C: Correct. tool_choice is an API-level constraint — the model CANNOT choose a different first tool when tool_choice forces one. This is the Playbook's "Forcing Execution Order" pattern: use API constraints, not prompt begging.
  D: Workable but brittle — requires per-turn tool-availability management across the orchestration layer and doesn't scale to multi-step ordering (what if step 3 requires a specific tool too?). tool_choice is cleaner.
source-note: raw/papers/The Architect's Playbook.md (Forcing Execution Order, p22)
```
