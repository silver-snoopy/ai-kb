---
cert: cca-f
domain: domain-1-agentic
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, sample-questions]
---

# Official Sample Questions — Domain 1: Agentic Architecture & Orchestration

Verbatim from the official CCA-F exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`). These are the sample questions whose primary tested domain (per the exam guide's numbering) is Agentic Architecture & Orchestration.

```question
id: official-domain-1-agentic-01
domain: domain-1-agentic
difficulty: medium
stem: |
  Scenario: Customer Support Resolution Agent.

  Production data shows that in 12% of cases, your agent skips get_customer entirely and calls lookup_order using only the customer's stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?
options:
  A: Add a programmatic prerequisite that blocks lookup_order and process_refund calls until get_customer has returned a verified customer ID.
  B: Enhance the system prompt to state that customer verification via get_customer is mandatory before any order operations.
  C: Add few-shot examples showing the agent always calling get_customer first, even when customers volunteer order details.
  D: Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type.
correct: A
explanation: |
  When a specific tool sequence is required for critical business logic (like verifying customer identity before processing refunds), programmatic enforcement provides deterministic guarantees that prompt-based approaches cannot. Options B and C rely on probabilistic LLM compliance, which is insufficient when errors have financial consequences. Option D addresses tool availability rather than tool ordering, which is not the actual problem.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-1-agentic-02
domain: domain-1-agentic
difficulty: medium
stem: |
  Scenario: Multi-Agent Research System.

  After running the system on the topic "impact of AI on creative industries," you observe that each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarizes papers correctly, and the synthesis agent produces coherent output. However, the final reports cover only visual arts, completely missing music, writing, and film production. When you examine the coordinator's logs, you see it decomposed the topic into three subtasks: "AI in digital art creation," "AI in graphic design," and "AI in photography." What is the most likely root cause?
options:
  A: The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.
  B: The coordinator agent's task decomposition is too narrow, resulting in subagent assignments that don't cover all relevant domains of the topic.
  C: The web search agent's queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.
  D: The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria.
correct: B
explanation: |
  The coordinator's logs reveal the root cause directly: it decomposed "creative industries" into only visual arts subtasks (digital art, graphic design, photography), completely omitting music, writing, and film. The subagents executed their assigned tasks correctly—the problem is what they were assigned. Options A, C, and D incorrectly blame downstream agents that are working correctly within their assigned scope.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```
