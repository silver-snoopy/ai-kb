---
cert: cca-f
domain: domain-5-context
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, sample-questions]
---

# Official Sample Questions — Domain 5: Context Management & Reliability

Verbatim from the official CCA-F exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`). These are the sample questions whose primary tested domain (per the exam guide's numbering) is Context Management & Reliability.

```question
id: official-domain-5-context-01
domain: domain-5-context
difficulty: medium
stem: |
  Scenario: Customer Support Resolution Agent.

  Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What's the most effective way to improve escalation calibration?
options:
  A: Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.
  B: Have the agent self-report a confidence score (1-10) before each response and automatically route requests to humans when confidence falls below a threshold.
  C: Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.
  D: Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold.
correct: A
explanation: |
  Adding explicit escalation criteria with few-shot examples directly addresses the root cause: unclear decision boundaries. This is the proportionate first response before adding infrastructure. Option B fails because LLM self-reported confidence is poorly calibrated—the agent is already incorrectly confident on hard cases. Option C is over-engineered, requiring labeled data and ML infrastructure when prompt optimization hasn't been tried. Option D solves a different problem entirely; sentiment doesn't correlate with case complexity, which is the actual issue.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-5-context-02
domain: domain-5-context
difficulty: medium
stem: |
  Scenario: Multi-Agent Research System.

  The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?
options:
  A: Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.
  B: Implement automatic retry logic with exponential backoff within the subagent, returning a generic "search unavailable" status only after all retries are exhausted.
  C: Catch the timeout within the subagent and return an empty result set marked as successful.
  D: Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow.
correct: A
explanation: |
  Structured error context gives the coordinator the information it needs to make intelligent recovery decisions—whether to retry with a modified query, try an alternative approach, or proceed with partial results. Option B's generic status hides valuable context from the coordinator, preventing informed decisions. Option C suppresses the error by marking failure as success, which prevents any recovery and risks incomplete research outputs. Option D terminates the entire workflow unnecessarily when recovery strategies could succeed.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```
