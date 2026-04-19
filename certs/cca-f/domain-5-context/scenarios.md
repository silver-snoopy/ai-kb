---
cert: cca-f
domain: domain-5-context
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios]
---

# Domain 5 — Context & Reliability: Scenario Deep Dives

Scenarios from the CCA-F scenarios page whose "Domains tested" line includes D5 (Context & Reliability).

## Scenario 1 — Customer Support Resolution Agent

**Setup:** Design an AI-powered customer support agent that handles inquiries, resolves issues, and escalates complex cases.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Preserving customer details in long conversations**
  - CORRECT: Immutable 'case facts' block at the start of context with name, account ID, order, amounts
  - ANTI-PATTERN: Progressive summarization that silently loses critical specifics over multiple rounds

### This domain's angle

Tests case facts blocks for context preservation. Customer identifiers, order numbers, and monetary amounts must sit in an immutable block at context start — never summarized.

### Exam strategy

Any scenario mentioning "long conversation" + "customer details lost" → case facts block answer, never "summarize earlier turns".

---

## Scenario 3 — Multi-Agent Research System

**Setup:** Build a coordinator-subagent system for parallel research tasks.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Handling conflicting data from different subagents**
  - CORRECT: Track information provenance (source, confidence, timestamp) and resolve based on reliability
  - ANTI-PATTERN: Arbitrarily choosing one result or averaging conflicting values without provenance
- **Handling subagent failures**
  - CORRECT: Structured error propagation: report what was attempted, error type, distinguish access failure from empty result
  - ANTI-PATTERN: Silently returning empty results for failed lookups or generic 'operation failed' errors

### This domain's angle

Tests information provenance tracking and error propagation (access failure vs empty result distinction).

### Exam strategy

Key traps: silently dropping subagent failures (always wrong), ignoring provenance when resolving conflicts (always wrong). Always pick the option that distinguishes "could not check" from "checked, found nothing".

---

## Scenario 6 — Structured Data Extraction

**Setup:** Build a structured data extraction pipeline from unstructured documents.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Tracking extraction accuracy**
  - CORRECT: Per-document-type accuracy tracking (stratified metrics)
  - ANTI-PATTERN: Aggregate accuracy ('95% overall') that hides per-category failures

### This domain's angle

Tests per-document-type accuracy tracking (stratified metrics). Aggregate accuracy hides category-specific failures (invoices 70%, receipts 99% averages to 95% while one category is broken).

### Exam strategy

When a question mentions "overall accuracy looks fine but users report issues", the answer is stratified per-type metrics.
