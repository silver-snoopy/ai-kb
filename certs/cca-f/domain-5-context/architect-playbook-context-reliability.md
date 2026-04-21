---
cert: cca-f
domain: domain-5-context
status: draft
source: 2026-04-21-architect-playbook
tags: [playbook, context-management, reliability, batch-api, hitl, compliance, retry]
links:
  - ../../../raw/papers/The Architect's Playbook.md
  - ../../../concepts/architecture/architect-reference-matrix.md
---

# Domain 5 — Context Management & Reliability: Patterns from The Architect's Playbook

Compiled from `raw/papers/The Architect's Playbook.pdf` (27-page deck, 2026). This is the densest chapter of the Playbook — context-window hygiene, cost routing, compliance enforcement, and HITL calibration all live here. Eight Domain-5 patterns.

### Routing for Cost and SLA (CRITICAL)

**Rule:** Never default to real-time for asynchronous needs.

**Correct pattern:** Route by SLA constraint:

| SLA constraint | API choice | Why |
|---|---|---|
| Urgent exceptions (< 30min) | Real-time Messages API | High cost, instant latency — only for truly urgent |
| Standard workflows | **Message Batches API** | **50% cost savings** — the default for async work |
| Continuous arrival (30h SLA) | Submit batches every 6 hours containing documents from that window | Keeps batch sizes reasonable while meeting SLA |

**Why correct works:** Most "async" workloads don't need sub-second responses. Batch API accepts a latency budget in exchange for 50% cost reduction — a massive lever on production economics. *Figure p4.*

### Calibrating Human-in-the-Loop (HIGH)

**Requirement:** Automate extractions with model confidence > 90%.

**Implementation:** Have the model output **field-level confidence scores**. Ground this in the solution for reducing semantic errors — separate "I'm sure of this extraction" from "I'm guessing because the source was ambiguous."

**The bell curve:** In a well-calibrated pipeline, the confidence distribution shows a long left tail (0-90%, to human review queue) and a sharper right tail (90-100%, auto-processed). Routing cuts the queue by the right amount — not too many (human reviewers bottleneck), not too few (error rate creeps up).

**Critical Validation Step:** **Analyze accuracy by document type AND field** to verify that high-confidence extractions perform consistently across all segments, not just in aggregate. A pipeline with 95% aggregate accuracy can still be 60% accurate on one document class while being 99% on another — deploying the aggregate alone masks the weak segment.

**Why correct works:** Field-level confidence + per-segment validation catches miscalibration before production. Aggregate metrics lie; segmented metrics reveal the failure-prone edges. *Figure p9.*

### Zero-Tolerance Compliance via App-Layer Intercepts (CRITICAL)

**The Trap:** Relying on emphatic system prompts ("CRITICAL POLICY: NEVER process > $500") still yields a **3% failure rate**. At production scale that's thousands of policy violations.

**The Architectural Standard:** Implement an **application-layer hook** to intercept tool calls. When `process_refund($847)` exceeds the threshold, block it **server-side** and invoke escalation. Model discretion is removed entirely.

**Why correct works:** Prompts are probabilistic — the LLM is statistically obedient, not logically bound. Code is deterministic. For zero-tolerance thresholds (compliance, safety, financial limits), the enforcement MUST live in application code where it runs 100% of the time. *Figure p10.*

### Resuming Asynchronous Sessions (HIGH)

**The Problem:** Resuming a customer session hours later leads to the agent confidently re-stating outdated status ("expected resolution: 24h" from a prior tool call that's now stale).

**The Solution:** Resume with full conversation history **BUT programmatically filter out previous `tool_result` messages**. Keep only human/assistant turns so the agent is **forced to re-fetch** needed data upon resumption.

**Why correct works:** Stale tool results pretend to be current. Filtering them doesn't erase the conversation — it just removes the snapshots, forcing fresh data lookup. Customers get current information every time. *Figure p11.*

### Tool Context Pruning (HIGH)

**The Bloat:** Repeatedly calling `lookup_order` fills the context window with verbose shipping and payment data when only the return status is needed. A 40+-field raw API response bloats the context when only 4 fields are relevant.

**The Pattern: Application-side filtering.** Extract only relevant fields (items, purchase_data, return_window, status) from each existing order response, **removing verbose details BEFORE they reach the agent's context**.

**Why correct works:** The API response isn't the problem — stuffing its entirety into the context is. Filter at the boundary, not inside the agent's reasoning. Especially valuable in support sessions that accumulate multiple tool calls. *Figure p12.*

### Compressing Long Sessions (MEDIUM)

**The Scenario:** A single session covers a refund inquiry, a subscription question, and a payment update across 48 turns. Context limits approach.

**The Strategy:** Summarize earlier, **resolved** turns into a narrative description, preserving the **full message history verbatim only for the active, unresolved issue**.

**Correct error pattern (bonus):** Return the error message in the tool result content with the `isError` flag set to true. (Cross-reference Domain 4's Graceful Tool Failure.)

**Why correct works:** Verbatim-everywhere is wasteful (resolved issues don't need full fidelity); narrative-everywhere is lossy (active issues need exact quotes). Mixing matches the fidelity to the need. *Figure p15.*

### Parallelization & Caching (MEDIUM)

**The Problem:** Processing each of 12 legal precedents sequentially takes 3+ minutes per complex case — unacceptable latency.

**Two complementary patterns:**

- **Subagent Parallelism:** For independent data, the coordinator spawns parallel subagents, each handling a subset, then aggregates. T0→T+180s sequential compresses to T0→T+30s parallel.
- **Prompt Caching:** When follow-up summaries consistently pass 80+K tokens of accumulated findings, enable **prompt caching on the synthesis subagent** to drastically reduce transfer overhead.

**Why correct works:** Latency = max(subagent times) + aggregation, not sum. Prompt caching turns a repeat-read of 80K tokens into a cache lookup. Both levers compound. *Figure p24.*

### The Limits of Automated Retry (MEDIUM)

**The Pattern:** Appending specific validation errors to the prompt and retrying resolves most failures in 2-3 attempts — for **formatting errors**.

**The Exception:** Retries are **least effective for missing information** (e.g., trying to extract full author lists when the source says "et al." and points to an unprovided external document). Recognize when to fail fast.

**Why correct works:** Retries let the model learn from its error message. But they can't manifest information that was never in the source. For missing-info cases, escalate to a different tool (fetch the external document) or a human; don't spin. *Figure p8.*

## Exam angle

Five canonical Domain-5 traps:

1. **"Real-time API for async workload"** → wrong. Correct: Batch API = 50% cost savings for async.
2. **"Emphatic system prompt enforces compliance"** → wrong. Correct: app-layer intercept.
3. **"Resume session with full transcript including tool_results"** → serves stale data. Correct: filter prior tool_results; force re-fetch.
4. **"Dump entire API response to context"** → bloats. Correct: app-side field filtering before context.
5. **"Retry N more times on any failure"** → wrong for missing info. Correct: retry for format errors; fail fast for missing info.

```question
id: playbook-domain-5-01
domain: domain-5-context
scenario: "6"
difficulty: medium
stem: |
  Scenario: Structured Data Extraction.

  Your nightly pipeline extracts metadata from 200,000 newly-arrived documents. The work must finish within a 30-hour SLA window but individual documents have no per-doc latency requirement. Your team initially built this on the real-time Messages API and is seeing a $48,000/month Anthropic bill. Which routing change most directly addresses cost while still meeting SLA?
options:
  A: Optimize prompts to reduce token count per document, keeping the real-time Messages API.
  B: Switch to the Message Batches API, submitting batches of documents every 6 hours containing documents from that window. Accept the batch-turnaround latency in exchange for the 50% cost reduction.
  C: Process documents serially on a single worker to minimize concurrent API cost spikes.
  D: Move to a cheaper model tier for the extraction step.
correct: B
explanation: |
  A: Prompt optimization is incremental and orthogonal — it trims token cost but doesn't change the fundamental API-pricing-tier mismatch. Real-time pricing for async work is still paying a premium for latency you don't need.
  B: Correct. The Playbook's "Routing for Cost and SLA" pattern: never default to real-time for async needs. Batch API gives 50% cost savings; submitting every 6 hours keeps batch sizes reasonable while comfortably meeting the 30h SLA.
  C: Reduces concurrency but doesn't change per-request cost. Also likely blows the 30h SLA.
  D: Possibly valid but sacrifices extraction quality — the right-sized API tier matters more than the right-sized model for a cost-vs-SLA question like this.
source-note: raw/papers/The Architect's Playbook.md (Routing for Cost and SLA, p4)
```

```question
id: playbook-domain-5-02
domain: domain-5-context
scenario: "1"
difficulty: hard
stem: |
  Scenario: Customer Support Resolution Agent.

  Your agent can issue refunds via a process_refund tool. Policy states refunds above $500 require a human approver. Your system prompt reads: "CRITICAL POLICY: NEVER call process_refund with amount > 500 USD. ALWAYS escalate to human." Production telemetry shows a 3% rate of process_refund calls with amounts > $500 — small, but every violation is a policy incident. Which change most reliably eliminates violations?
options:
  A: Add more emphatic warnings to the system prompt and retry the call if the model outputs a refund above $500.
  B: Fine-tune the base model on examples that demonstrate the correct escalation behavior.
  C: Implement an application-layer hook that intercepts process_refund calls. When the amount exceeds $500, block it server-side and invoke escalation. Model discretion is removed.
  D: Add a validation step AFTER the model outputs the tool call, but BEFORE execution, that checks the amount and returns an error if >$500 so the agent retries.
correct: C
explanation: |
  A: Even maximum-emphasis prompts leave a statistical failure rate. The Playbook measures exactly the 3% currently observed — this is a known ceiling of prompt enforcement.
  B: Fine-tuning shifts probabilities but doesn't eliminate violations. Also expensive and slow to iterate.
  C: Correct. The Playbook's "Zero-Tolerance Compliance" pattern: for policy thresholds, enforcement MUST live in application code where it runs 100% of the time. Prompts are probabilistic; code is deterministic.
  D: Post-model validation + retry still relies on the model to eventually pick the right action. A stubborn sequence could loop. Server-side blocking is the deterministic stop.
source-note: raw/papers/The Architect's Playbook.md (Zero-Tolerance Compliance, p10)
```

```question
id: playbook-domain-5-03
domain: domain-5-context
scenario: "1"
difficulty: hard
stem: |
  Scenario: Customer Support Resolution Agent.

  A customer opens a support ticket about a billing issue. The agent calls a tool and says "Expected resolution: 24 hours." The customer returns 6 hours later to check status. Your session resumption code replays the full conversation history, including the old tool_result containing "expected_resolution: 24h". The agent then parrots "Expected resolution: 24 hours" without re-checking — but actual status is now "PROCESSED". Which resumption strategy fixes this?
options:
  A: Store a timestamp with each tool_result; show the agent tool_results older than 1 hour with a warning to re-check.
  B: Resume with full conversation history, but programmatically filter out previous tool_result messages. Keep only human/assistant turns so the agent is forced to re-fetch needed data on resumption.
  C: Cap the session to 1 hour — force customers to start a new conversation after that.
  D: Prepend a system message saying "All previous tool results may be stale; re-check before quoting them."
correct: B
explanation: |
  A: Adds complexity and still lets the agent choose to use stale data if its heuristic judgment says "probably still valid." Probabilistic.
  B: Correct. The Playbook's "Resuming Asynchronous Sessions" pattern: filtering tool_results isn't losing conversation — it forces a fresh lookup. Customers get current info every time, deterministically.
  C: Breaks multi-session support flows, which are a legitimate and common pattern. Blunt.
  D: System prompt instructions are probabilistic — the agent may still quote stale data. Also pollutes every future turn with a caveat.
source-note: raw/papers/The Architect's Playbook.md (Resuming Asynchronous Sessions, p11)
```

```question
id: playbook-domain-5-04
domain: domain-5-context
scenario: "1"
difficulty: medium
stem: |
  Scenario: Customer Support Resolution Agent.

  Your support agent frequently calls lookup_order to help customers with returns. The tool returns a 40+-field JSON including shipping address, payment method, fulfillment center, carrier tracking URLs, and itemized tax breakdown. Over a 20-turn session, context window usage is 85% consumed by these verbose responses — the agent's reasoning quality degrades, and some questions fail because there's no room for the final answer. Which change most directly addresses the context pressure?
options:
  A: Reduce the agent's max output tokens so the context consumed by responses shrinks.
  B: "Implement application-side filtering: extract only the relevant fields (items, purchase_date, return_window, status) from each lookup_order response BEFORE it enters the agent's context."
  C: Move to a model with a larger context window so the 40-field responses fit more comfortably.
  D: Have the agent summarize its own context every 5 turns to free space.
correct: B
explanation: |
  A: Shrinks output tokens but doesn't touch the bloat source (tool results). Symptomatic, not causal.
  B: Correct. The Playbook's "Tool Context Pruning" pattern: filter at the boundary where data enters the context, NOT inside the agent's reasoning. The API response is fine; stuffing its entirety into context is the problem.
  C: Raises the ceiling but doesn't change the growth rate — a long-enough session still hits it.
  D: Self-summarization is lossy and costs inference tokens per summarize pass. Application-side filtering is deterministic and free.
source-note: raw/papers/The Architect's Playbook.md (Tool Context Pruning, p12)
```
