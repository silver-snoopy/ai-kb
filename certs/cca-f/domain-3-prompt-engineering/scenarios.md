---
cert: cca-f
domain: domain-3-prompt-engineering
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios]
---

# Domain 4 (vault: domain-3-prompt-engineering) — Prompt Engineering: Scenario Deep Dives

Scenarios from the CCA-F scenarios page whose "Domains tested" line includes D4 (Prompt Engineering).

## Scenario 2 — Code Generation with Claude Code

**Setup:** Configure Claude Code for a development team workflow.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Best iterative refinement strategy**
  - CORRECT: TDD iteration: write failing test, implement, verify, refine while keeping tests green
  - ANTI-PATTERN: Vague instructions like 'make it better' without concrete verification criteria

### This domain's angle

Tests explicit criteria and TDD iteration for refinement. Concrete verification criteria (failing tests) are the prompt-engineering anchor; vague refinement requests produce drift.

### Exam strategy

Whenever you see "make it better" or similar vague refinement language, it is the anti-pattern. Pick the option with concrete verification criteria.

---

## Scenario 5 — Claude Code for CI/CD

**Setup:** Integrate Claude Code into continuous integration and delivery pipelines.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Enforcing structured output from review**
  - CORRECT: --json-schema flag to enforce specific output shape for automated processing
  - ANTI-PATTERN: Parsing unstructured text output from the review with regex

### This domain's angle

Tests structured output via schemas. Structured output requires schema enforcement, not post-hoc regex parsing.

### Exam strategy

For D4 in CI/CD contexts: pick the schema-enforced option over text parsing every time.

---

## Scenario 6 — Structured Data Extraction

**Setup:** Build a structured data extraction pipeline from unstructured documents.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Guaranteeing structured JSON output from extraction**
  - CORRECT: tool_use with JSON schema + tool_choice forcing a specific tool
  - ANTI-PATTERN: Prompting 'output as JSON' (not guaranteed) or post-processing with regex (fragile)
- **Does tool_use guarantee correctness?**
  - CORRECT: No — tool_use guarantees STRUCTURE only. Validate SEMANTICS separately with business rules.
  - ANTI-PATTERN: Assuming tool_use output is always correct because it matched the schema
- **What to do when extraction validation fails**
  - CORRECT: Append SPECIFIC error details (which field, what's wrong) and retry
  - ANTI-PATTERN: Generic retry: 'there were errors, try again' (no signal for what to fix)
- **Handling ambiguous document types**
  - CORRECT: Include 'other' enum value + document_type_detail field for edge cases; use 2-4 few-shot examples covering edge cases
  - ANTI-PATTERN: Rigid enum without 'other' category (forces misclassification of unexpected types)

### This domain's angle

Tests tool_use for structured output (structure vs semantics), validation-retry loops with specific error feedback, few-shot prompting (2-4 examples, edge case coverage).

### Exam strategy

The critical concept is that tool_use guarantees structure, NOT semantics. Every question about extraction reliability will test this. Validation retries need SPECIFIC errors, not generic messages.
