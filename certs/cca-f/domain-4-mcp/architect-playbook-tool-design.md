---
cert: cca-f
domain: domain-4-mcp
status: done
source: 2026-04-21-architect-playbook
tags: [playbook, tool-design, mcp, granularity, error-handling, delegation]
links:
  - ../../../raw/papers/The Architect's Playbook.md
  - ../../../concepts/architecture/architect-reference-matrix.md
  - ../domain-1-agentic/architect-playbook-agentic-patterns.md
---

# Domain 4 — Tool Design & MCP: Patterns from The Architect's Playbook

Compiled from `raw/papers/The Architect's Playbook.pdf` (27-page deck, 2026). Three Domain-4 patterns directly relevant to tool/MCP server design: tool granularity, failure semantics, and goal-oriented tool interfaces.

### MCP Tool Specificity (CRITICAL)

**Anti-pattern: Monolithic Tool.** Providing a broad custom tool like `analyze_dependencies` alongside built-in tools like `Grep`. The agent's tool-selection reasoning defaults to `Grep` because `Grep`'s behavior is concrete and predictable, while the custom tool's description is generic. You end up with:

```
Agent execution...
→ Agent uses built-in Grep to search imports.
   (ignoring analyze_dependencies)
```

**Correct pattern: Granular Tools.** Split the broad tool into single-purpose tools with explicit "when-to-prefer" descriptions:

```
Agent execution...
→ Agent uses custom tool for dependencies.
  - list_imports
  - resolve_transitive_deps
  - detect_circular_deps
```

**Why correct works:** The agent picks tools by matching query to description. Concrete, narrow descriptions ("list all top-level imports from a TypeScript module") beat vague ones ("analyze dependencies"). This applies equally to custom refactoring tools replacing standard Bash/sed. *Figure p16.*

### Graceful Tool Failure (HIGH)

**Anti-pattern:** Throwing application exceptions that crash the agent loop, OR returning empty strings on failure (indistinguishable from "legitimate empty result").

**Correct pattern:** Return the error message in the tool result's `content` field with **`isError: true`**, plus structured metadata the agent can reason about:

```json
{
  "isError": true,
  "errorCategory": "transient",
  "isRetryable": true
}
```

The agent can then emit a graceful user-facing response (e.g., "I'm experiencing a delay, please try again later") while distinguishing failure types internally.

**Why correct works:** `isError: true` is the documented protocol-level signal that the calling agent can pattern-match against. `errorCategory` (transient / permanent / auth / rate-limit) and `isRetryable` let the agent pick the right recovery strategy (retry, escalate, abort). Crashes lose all that reasoning. *Figure p13.*

### Goal-Oriented Tool Interfaces (MEDIUM)

**Anti-pattern: Procedural Micromanagement.** A coordinator prescribes a rigid sequence to a subagent:

```
Web Search Subagent
→ Step 1: Search X
→ Step 2: Read Y
→ Step 3: Extract Z
```

This fails rigidly on emerging topics and misses tangential sources.

**Correct pattern:** Specify **research goals and quality criteria**, NOT procedural steps. Keep tool interfaces generic but add **enum parameters** to guide behavior:

```
Target: Coverage Breadth
Criteria: Recency
```

```python
tool: 'analyze_document'
params: {
  analysis_type: 'extraction' | 'summarization'
}
```

**Why correct works:** The specialized subagent has more domain knowledge than its coordinator. Goals + quality bars let it apply that knowledge; procedural steps assume the caller knows better than the callee. Enum parameters keep tools generic while still letting the caller signal intent. *Figure p25.*

## Exam angle

Three canonical Domain-4 traps:

1. **"Provide a broad custom tool"** → wrong when it competes with built-ins. Correct: split into granular single-purpose tools with explicit prefer-over language.
2. **"Throw on tool failure"** / **"Return empty on failure"** → both wrong. Correct: `isError: true` + `errorCategory` + `isRetryable`.
3. **"Prescribe step-by-step procedure to subagent"** → wrong. Correct: specify goals + quality criteria; use enum params on generic tools to signal intent.

```question
id: playbook-domain-4-01
domain: domain-4-mcp
scenario: "4"
difficulty: medium
stem: |
  Scenario: Developer Productivity with Claude.

  You've shipped a custom MCP tool called `analyze_codebase` that can answer any structural question about a repo (imports, call graphs, test coverage, hotspots). Usage analytics show the agent invokes `analyze_codebase` in only 22% of relevant queries — in 78% of cases, the agent falls back to Grep or Read. What tool design change most reliably shifts agent behavior?
options:
  A: Make `analyze_codebase` the ONLY tool available (remove Grep/Read from the tool list) when the agent is in a codebase-analysis session.
  B: Split `analyze_codebase` into narrow single-purpose tools (list_imports, find_callers, detect_circular_deps, compute_test_coverage) with descriptions that explicitly say when to prefer each over Grep or Read.
  C: Add a system prompt that explicitly favors `analyze_codebase` over built-in file tools for any structural question.
  D: Increase the timeout on `analyze_codebase` so it never fails due to slow responses, making the agent more willing to invoke it.
correct: B
explanation: |
  A: Removes fallback options the agent legitimately needs for other tasks. Also brittle — session-boundary detection is hard.
  B: Correct. The Playbook's "MCP Tool Specificity" pattern: tool selection is description-driven. Concrete narrow descriptions ("resolve transitive dependency closure for a TypeScript module") beat vague ones ("analyze codebase"). Explicit prefer-over language closes the gap.
  C: System prompts are probabilistic; the Playbook measures a 3%+ override failure rate on emphatic prompts. Description-level design is deterministic.
  D: Doesn't address the ROOT cause (description vagueness). Timeout increases don't change tool selection reasoning.
source-note: raw/papers/The Architect's Playbook.md (MCP Tool Specificity, p16)
```

```question
id: playbook-domain-4-02
domain: domain-4-mcp
scenario: "1"
difficulty: hard
stem: |
  Scenario: Customer Support Resolution Agent.

  Your lookup_order tool sometimes fails — sometimes because the order-service is down (retryable), sometimes because the order genuinely doesn't exist (permanent), sometimes because the customer's auth token expired (needs re-auth). Currently, the tool throws a generic Python exception on any failure, and the agent either crashes or gives a misleading "order not found" reply for every failure type. What contract change best fixes this?
options:
  A: Change the tool to return a literal string "ERROR" when any failure occurs so the agent can detect and handle failures uniformly.
  B: "Return the error message in the tool result's content field with isError: true, plus structured metadata like errorCategory (transient / permanent / auth) and isRetryable, so the agent can pick the right recovery strategy."
  C: Catch all exceptions and return an empty result, letting the agent treat failure the same as "no order found."
  D: Have the tool automatically retry failed calls up to 3 times internally before returning anything to the agent.
correct: B
explanation: |
  A: A literal "ERROR" string is better than a thrown exception but still collapses all failure types into one bucket. The agent can't distinguish retryable from permanent.
  B: Correct. The Playbook's "Graceful Tool Failure" pattern: isError: true is the protocol-level signal; errorCategory + isRetryable give the agent enough information to pick the right recovery (retry for transient, escalate for auth, tell the user for permanent).
  C: Treating failure as "no order found" is exactly the misleading behavior currently observed — it produces wrong user-facing answers.
  D: Internal retries hide auth and permanent failures behind latency. The agent needs to know WHY a call failed to reason about what to do next.
source-note: raw/papers/The Architect's Playbook.md (Graceful Tool Failure, p13)
```

```question
id: playbook-domain-4-03
domain: domain-4-mcp
scenario: "3"
difficulty: medium
stem: |
  Scenario: Multi-Agent Research System.

  A coordinator agent dispatches research tasks to a web-search subagent. The coordinator gives detailed procedural instructions: "Step 1: Search Bing for X. Step 2: Filter results to the first 10. Step 3: Read each and extract Y." For emerging topics, this rigid flow misses new sources (which surfaced last week and aren't in Bing's top 10 yet) and ignores tangential but important material. What delegation pattern best addresses both failure modes?
options:
  A: Keep the procedural steps but add more of them — specify 15 sources instead of 10, add Google Scholar as a backup search engine.
  B: Replace procedural steps with a research goal ("coverage breadth for emerging topics") and quality criteria ("recency, multi-source corroboration"). Let the subagent determine its own search strategy.
  C: Have the coordinator inspect each result and give step-by-step feedback, iterating until the subagent's research is complete.
  D: Make the subagent's tools more specific (add search_arxiv, search_hackernews) so the procedural steps adapt to topic type.
correct: B
explanation: |
  A: More procedural steps doesn't fix rigidity — adds more failure points that also break on emerging topics.
  B: Correct. The Playbook's "Goal-Oriented Delegation" pattern: the specialized subagent has MORE domain knowledge than the coordinator. Goals + quality criteria let it apply that expertise; procedural steps assume the caller knows better.
  C: Micromanagement scales poorly and defeats the purpose of delegation — if the coordinator does all the reasoning, the subagent adds nothing.
  D: More tools helps, but without the goal-oriented pattern the subagent still gets rigid prescribed steps — just with a larger menu. Doesn't address root cause.
source-note: raw/papers/The Architect's Playbook.md (Goal-Oriented Delegation, p25)
```

```question
id: playbook-domain-4-04
domain: domain-4-mcp
scenario: "3"
difficulty: medium
stem: |
  Scenario: Multi-Agent Research System.

  You've designed an `analyze_document` tool used by multiple specialist subagents in a research pipeline. Some subagents need to extract specific facts; others need to generate summaries. You're deciding how each subagent should signal which mode it wants. Which approach aligns with the Playbook's Goal-Oriented Delegation pattern?
options:
  A: Separate tools (extract_facts, summarize_document) each with long free-text descriptions that explain every internal behavior, so the subagent picks via prompt-level reasoning over the descriptions rather than a structured parameter.
  B: "One analyze_document tool with an enum parameter (analysis_type: 'extraction' | 'summarization') — keeps the interface generic while signaling intent via a structured param."
  C: One analyze_document tool with NO params — let the subagent's system prompt fully determine behavior.
  D: Two tools AND an enum param (redundant) so the subagent always has multiple ways to express intent.
correct: B
explanation: |
  A: Rejects the Playbook's pattern. Goal-Oriented Delegation explicitly prescribes structured enum parameters to signal intent; relying on free-text descriptions + prompt-level reasoning is the prompt-begging anti-pattern. Structured params are deterministic; description-disambiguation is probabilistic.
  B: Correct. The Playbook's "Goal-Oriented Delegation" pattern explicitly prescribes generic tool interfaces with enum parameters to guide behavior. Keeps the tool catalog lean while still letting the caller signal intent structurally (not via prompt text alone).
  C: No params means the tool can't differentiate intents — the subagent's prompt has to carry all the signal, which is exactly the prompt-begging problem the Playbook warns against.
  D: Redundant interfaces produce inconsistent usage — some callers use the enum, some use separate tools, drift accumulates.
source-note: raw/papers/The Architect's Playbook.md (Goal-Oriented Delegation, p25)
```
