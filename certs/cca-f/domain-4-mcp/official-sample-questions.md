---
cert: cca-f
domain: domain-4-mcp
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, sample-questions]
---

# Official Sample Questions — Domain 4 (vault) / Domain 2 (exam guide): Tool Design & MCP Integration

Verbatim from the official CCA-F exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`). These are the sample questions whose primary tested domain (per the exam guide's numbering) is Tool Design & MCP Integration.

```question
id: official-domain-4-mcp-01
domain: domain-4-mcp
difficulty: medium
stem: |
  Scenario: Customer Support Resolution Agent.

  Production logs show the agent frequently calls get_customer when users ask about orders (e.g., "check my order #12345"), instead of calling lookup_order. Both tools have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifier formats. What's the most effective first step to improve tool selection reliability?
options:
  A: Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to lookup_order.
  B: Expand each tool's description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.
  C: Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.
  D: Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query.
correct: B
explanation: |
  Tool descriptions are the primary mechanism LLMs use for tool selection. When descriptions are minimal, models lack the context to differentiate between similar tools. Option B directly addresses this root cause with a low-effort, high-leverage fix. Few-shot examples (A) add token overhead without fixing the underlying issue. A routing layer (C) is over-engineered and bypasses the LLM's natural language understanding. Consolidating tools (D) is a valid architectural choice but requires more effort than a "first step" warrants when the immediate problem is inadequate descriptions.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-4-mcp-02
domain: domain-4-mcp
difficulty: medium
stem: |
  Scenario: Multi-Agent Research System.

  During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks (dates, names, statistics) while 15% require deeper investigation. What's the most effective approach to reduce overhead while maintaining system reliability?
options:
  A: Give the synthesis agent a scoped verify_fact tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.
  B: Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once.
  C: Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.
  D: Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify.
correct: A
explanation: |
  Option A applies the principle of least privilege by giving the synthesis agent only what it needs for the 85% common case (simple fact verification) while preserving the existing coordination pattern for complex cases. Option B's batching approach creates blocking dependencies since synthesis steps may depend on earlier verified facts. Option C over-provisions the synthesis agent, violating separation of concerns. Option D relies on speculative caching that cannot reliably predict what the synthesis agent will need to verify.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```
