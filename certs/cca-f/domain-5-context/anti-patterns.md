---
cert: cca-f
domain: domain-5-context
status: done
source: 2026-04-18-anti-patterns
tags: [seeded, anti-patterns]
---

# Domain 5 — Context & Reliability: Anti-Patterns

D5 — Context & Reliability (3 patterns).

### Progressive summarization of critical customer details (CRITICAL)

**Why wrong:** Each round of summarization loses specifics: names, IDs, amounts, dates.

**Correct approach:** Use immutable 'case facts' blocks positioned at the start of context

**Why correct works:** Case facts are never summarized and sit in a high-recall position (beginning of context).

### Aggregate accuracy metrics only (e.g., '95% overall') (CRITICAL)

**Why wrong:** Aggregate metrics mask per-category failures. Invoices at 70% while receipts at 99% still averages 95%.

**Correct approach:** Track accuracy per document type (stratified metrics)

**Why correct works:** Per-type tracking reveals hidden failures that aggregate metrics conceal.

### No provenance tracking for multi-agent data (HIGH)

**Why wrong:** When subagents provide conflicting data, there is no way to determine which source to trust.

**Correct approach:** Track source, confidence level, timestamp, and agent ID for all data

**Why correct works:** Provenance metadata enables informed conflict resolution and audit trails.
