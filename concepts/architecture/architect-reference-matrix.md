---
tags: [playbook, architect, reference-matrix, failure-modes, scenarios, synthesis]
source: 2026-04-21-architect-playbook
links:
  - ../../raw/papers/The Architect's Playbook.md
  - ../../certs/cca-f/domain-1-agentic/architect-playbook-agentic-patterns.md
  - ../../certs/cca-f/domain-2-claude-code/architect-playbook-claude-code-patterns.md
  - ../../certs/cca-f/domain-3-prompt-engineering/architect-playbook-extraction-prompting.md
  - ../../certs/cca-f/domain-4-mcp/architect-playbook-tool-design.md
  - ../../certs/cca-f/domain-5-context/architect-playbook-context-reliability.md
---

# The Architect's Reference Matrix

Cross-domain synthesis from `raw/papers/The Architect's Playbook.pdf`. This note captures the four framing constructs the Playbook uses to organize every pattern it teaches:

1. **The Four Domains of AI Architecture** — the scenario frame
2. **The Hierarchy of Constraints** — the failure-mode axis
3. **The Reference Matrix** — the 4×4 lookup table that intersects them
4. **The Production Architecture Blueprint** — the synthesized reference system

Use this note as a **triage tool**: when a CCA-F question describes a scenario and a failure symptom, the matrix points you to the canonical pattern family. Per-pattern detail lives in the five domain notes linked above.

## 1. The Four Domains of AI Architecture

The Playbook opens with four scenario quadrants that correspond almost exactly to four of the unified-bank scenarios:

| Playbook quadrant | CCA-F scenario | Characteristics |
|---|---|---|
| **Structured Data Extraction** | 6 — Structured Data Extraction | High volume, strict schemas, batch pipelines |
| **Customer Support Orchestration** | 1 — Customer Support Resolution Agent | Stateful, human-in-the-loop, policy constraints |
| **Developer Productivity** | 4 — Developer Productivity with Claude | Dynamic tasks, iterative context, advanced tool use |
| **Multi-Agent Systems** | 3 — Multi-Agent Research System | Parallel processing, shared memory, cross-agent synthesis |

CCA-F scenarios 2 (Code Generation) and 5 (CI/CD) aren't directly named in the Playbook but are sub-flavors of Developer Productivity. *Figure p2.*

## 2. The Hierarchy of Constraints

The Playbook frames every architectural problem as a tension across four axes. Each axis has a dedicated mitigation family:

| Axis | Mitigated by |
|---|---|
| **Latency** | Parallelization & Caching |
| **Accuracy** | Structured Intermediates & Few-Shot Prompts |
| **Compliance** | Application-Layer Intercepts (NOT prompts) |
| **Cost** | Batch APIs & Context Pruning |

The Playbook visualizes this as a radar chart — each axis is one of the four, and each cert-grade system has a "shape" showing which constraints dominate (e.g., a support bot is heavy on compliance and accuracy; a batch extraction pipeline is heavy on cost and accuracy). *Figure p3.*

**Exam heuristic:** Every CCA-F question implicitly asks "which constraint axis is this?" and the right answer family follows the hierarchy:

- Latency pressure? → look for Batch API / parallelization / caching answers
- Accuracy gap? → look for Few-Shot / Structured Intermediates / schema redundancy answers
- Compliance failure? → look for App-Layer Hook / tool_choice / server-side enforcement answers (NEVER prompt-only)
- Cost spike? → look for Batch API / context pruning / smaller responses answers

## 3. The Reference Matrix (the core payload)

The Playbook's culminating 4×4 lookup table intersects **Hierarchy axes** with **Scenario quadrants**:

|                      | Data Extraction          | Customer Support            | Developer Productivity    | Multi-Agent                    |
|----------------------|--------------------------|-----------------------------|---------------------------|--------------------------------|
| **Token Bloat**      | —                        | Filter Stale Results        | Scratchpad File           | Shared Vector Store            |
| **Latency**          | Batch Routing            | —                           | —                         | Parallelization & Caching      |
| **Compliance/Control** | —                      | App-Layer Intercepts        | —                         | `tool_choice` Enforcement      |
| **Accuracy**         | Schema Redundancy        | —                           | Granular MCP Tools        | Structured Intermediates       |

### Cell-by-cell

- **Token Bloat × Customer Support → Filter Stale Results.** See [Domain 5](../../certs/cca-f/domain-5-context/architect-playbook-context-reliability.md) Resuming Asynchronous Sessions: programmatically filter previous `tool_result` messages on resume so the agent re-fetches.
- **Token Bloat × Developer Productivity → Scratchpad File.** See [Domain 2](../../certs/cca-f/domain-2-claude-code/architect-playbook-claude-code-patterns.md) Scratchpad Pattern: agent maintains a dense structured file rather than bloating the conversation.
- **Token Bloat × Multi-Agent → Shared Vector Store.** See [Domain 1](../../certs/cca-f/domain-1-agentic/architect-playbook-agentic-patterns.md) Shared Memory Architecture: subagents write findings to a vector store; downstream agents retrieve semantically rather than inheriting full transcripts.
- **Latency × Data Extraction → Batch Routing.** See [Domain 5](../../certs/cca-f/domain-5-context/architect-playbook-context-reliability.md) Routing for Cost and SLA: default to Message Batches API for async workloads.
- **Latency × Multi-Agent → Parallelization & Caching.** See [Domain 5](../../certs/cca-f/domain-5-context/architect-playbook-context-reliability.md) Parallelization & Caching: fan out independent work to parallel subagents; enable prompt caching on repeated synthesis calls.
- **Compliance × Customer Support → App-Layer Intercepts.** See [Domain 5](../../certs/cca-f/domain-5-context/architect-playbook-context-reliability.md) Zero-Tolerance Compliance: server-side hook blocks tool calls that violate thresholds; model discretion removed.
- **Compliance × Multi-Agent → `tool_choice` Enforcement.** See [Domain 1](../../certs/cca-f/domain-1-agentic/architect-playbook-agentic-patterns.md) Forcing Execution Order: API-level `tool_choice` guarantees the first tool in a required sequence.
- **Accuracy × Data Extraction → Schema Redundancy.** See [Domain 3](../../certs/cca-f/domain-3-prompt-engineering/architect-playbook-extraction-prompting.md) Schema Redundancy: emit calculated_total + stated_total; flag when they disagree.
- **Accuracy × Developer Productivity → Granular MCP Tools.** See [Domain 4](../../certs/cca-f/domain-4-mcp/architect-playbook-tool-design.md) MCP Tool Specificity: split broad tools into narrow, description-rich single-purpose tools.
- **Accuracy × Multi-Agent → Structured Intermediates.** See [Domain 3](../../certs/cca-f/domain-3-prompt-engineering/architect-playbook-extraction-prompting.md) Structured Intermediate Representations: Format Conversion Layer + claim-source JSON between specialist agents.

The empty cells aren't "no-pattern-applies" — they're where the Playbook didn't single out a top recommendation because multiple patterns co-apply (e.g., Token Bloat × Data Extraction is addressed by schema design itself). *Figure p26.*

## 4. The Production Architecture Blueprint

The Playbook's final synthesis (*Figure p27*) walks through a reference production architecture that applies the matrix end-to-end:

```
    User
     ↓
Pattern Router
 ├── Real-time   ─┐
 └── Batch       ─┤
                  ↓
          Execution Layer
          ├── Granular Tools (Tool A, Tool B, Tool C, …)
          └── Application Intercepts
               ├── Validation Guardrails
               ├── Policy Enforcement
               └── Schema Checks
                  ↓
              Synthesis
              ├── Result Aggregation
              ├── Formatting
              └── Delivery

  (crosscutting, from Execution Layer down:)
      State Management (Pruning + Shared Vector)
      ├── Pruning Logic
      ├── Shared Vector Store (data)
      └── Context Window Management
```

Four annotations summarize the design philosophy:

- **"Intelligence at the edges"** — smart routing upfront, not downstream
- **"Strict typing in the middle"** — granular tools, structured intermediates
- **"Application intercepts guarding the core"** — compliance enforced in code, not prompt
- **"Shared memory sustaining the lifecycle"** — vector store as crosscutting state layer

The diagram also displays a "CCA Certified" badge — confirming this deck was designed as an architect-grade reference with the cert in mind.

## Exam triage with this matrix

When facing a scenario-based question:

1. **Identify the scenario quadrant** (Data Extraction / Support / Dev Prod / Multi-Agent). The stem almost always names it.
2. **Identify the dominant constraint axis** (Latency / Accuracy / Compliance / Cost/Bloat). The failure symptom in the stem tells you.
3. **Look up the cell.** The matrix points you to the canonical pattern family.
4. **Match answers against the family.** Distractors often present plausible but out-of-axis solutions (e.g., "fine-tune the model" for a compliance failure → wrong; App-Layer Intercept is right).

The Playbook's value as exam prep is this compression: five chapters of patterns collapse to one 4×4 lookup, and that lookup aligns precisely with CCA-F's scenario structure.
