---
cert: cca-f
domain: domain-3-prompt-engineering
status: draft
source: 2026-04-21-architect-playbook
tags: [playbook, extraction, schema-design, few-shot, null-handling, structured-intermediates]
links:
  - ../../../raw/papers/The Architect's Playbook.md
  - ../../../concepts/architecture/architect-reference-matrix.md
---

# Domain 3 — Prompt Engineering: Patterns from The Architect's Playbook

Compiled from `raw/papers/The Architect's Playbook.pdf` (27-page deck, 2026). The Playbook frames extraction reliability as a schema-and-prompt joint design problem: the schema shape makes certain failure modes impossible, and prompts close the gap the schema can't cover. This note covers six Domain-3 patterns.

### Resilient Catch-All Enums (CRITICAL)

**Anti-pattern: Fragile Expansion.** Continuously expanding a closed enum as new edge cases appear. Every new property type (studio, warehouse, loft, mobile home) forces a schema migration or a validation error:

```json
{
  "property_type": {
    "type": "string",
    "enum": ["house", "apartment", "condo", "townhouse"]
  }
}
// "property_type": "studio" → VALIDATION ERROR
// "property_type": "converted warehouse" → VALIDATION ERROR
```

**Correct pattern:** Add an `"other"` value to the enum, **paired with a detail string field**:

```json
{
  "property_type": {
    "type": "string",
    "enum": ["house", "apartment", "condo", "townhouse", "other"]
  },
  "property_type_detail": {
    "type": "string"
  }
}
// "property_type": "other", "property_type_detail": "studio" → SUCCESS
```

**Why correct works:** New edge cases are captured rather than rejected, while the closed enum still covers the common path for downstream validation/analytics. *Figure p7.*

### Schema Redundancy for Mathematical Consistency (CRITICAL)

**The problem:** 18% of invoice extractions show line items that don't sum to the stated grand total, due to OCR or extraction errors. Without redundancy, you can't distinguish "model got a number wrong" from "source document was inconsistent."

**Correct pattern:** Output BOTH the model-derived total AND the directly-extracted stated total. Flag for human review only when they disagree:

```json
{
  "invoice_id": "12345",
  "line_items": [
    {"description": "Item 1", "amount": 120.50},
    {"description": "Item 2", "amount": 85.00},
    {"description": "Item 3", "amount": 4.525}
  ],
  "calculated_total": 210.025,  // Derived by model summing items
  "stated_total": 260.00,       // Extracted directly from page
  "currency": "USD"
}
// Routing Action: Flag the record for human review ONLY when
// calculated_total != stated_total
```

**Why correct works:** Redundancy turns a single-point-of-failure into a consistency check. You auto-approve the 82% where the numbers agree and human-review only the 18% that actually need attention.

### Null Handling Instruction (HIGH)

**The problem: Plausible Hallucinations.** When fields are nullable, models may invent plausible data (e.g., `attendee_count: 500`) rather than leaving it null, if not explicitly instructed.

**Correct pattern:** Add explicit prompt instructions to return `null` if not directly stated:

> *Extract attendee count and materials. If attendee count or materials are not mentioned in the text, return "null".*

**Why correct works:** Models bias toward filling requested fields — their training data rewards completeness. Explicit null-instruction overrides that bias in the prompt layer. *Figure p9.*

### Format Normalization via Few-Shot (HIGH)

**The problem: Inconsistent Formats.** For a materials field, the source text may say "cotton blend" in one doc and "Cotton/Polyester mix" in another. Temperature 0 alone won't normalize — the model mirrors input formatting.

**Correct pattern:** Provide **2-3 complete input-output example pairs** showing the standardized format:

```
Examples:
  Input: "Made of cotton blend."
  Output: {"materials": "Cotton Blend"}
  Input: "Cotton/Polyester mix"
  Output: {"materials": "Cotton/Polyester Mix"}
```

**Why correct works:** Few-shot examples anchor the model on output format (title-case, no qualifiers) more reliably than any imperative instruction. Don't rely on temperature 0 alone — that controls randomness, not formatting norms. *Figure p9.*

### Structured Intermediate Representations (HIGH)

**Anti-pattern:** Passing raw text from specialist agents (financial, news, patent) to a synthesis agent. Tables lose clarity when flattened to prose; narrative flow degrades; citations are lost across handoffs.

**Correct pattern:** Introduce a **Format Conversion Layer** between specialists and synthesis. Every specialist output gets standardized to a common intermediate representation (structured JSON with explicit citation fields):

```json
{
  "claim": "...",
  "evidence": "...",
  "source": "...",
  "confidence": 0.92
}
```

**Citation Rule:** Require all subagents to output structured claim-source mappings that the synthesis agent is instructed to preserve verbatim.

**Why correct works:** Structured intermediates survive handoffs in ways raw prose doesn't. Citations carry forward; table structure is preserved; the synthesis agent can mechanically trace any claim back to its specialist. *Figure p23.*

### The Limits of Automated Retry (MEDIUM)

**Pattern:** Appending specific validation errors to the prompt and retrying resolves most failures in 2-3 attempts — **for formatting errors**. Retries excel at: fixing nested objects vs flat arrays, resolving locale-formatted strings, correcting obvious type mismatches.

**The exception:** Retries are **least effective for missing information**. If the model tried to extract a full author list but the source says "et al." and points to an external document, retrying won't conjure the missing authors — it'll hallucinate them. **Recognize when to fail fast** and escalate to a different tool (fetch the external document) or a human.

**Why correct works:** Retries let the model learn from its own error message ("expected array, got object") but can't manifest information that was never in the source. *Figure p8.*

## Exam angle

Four canonical Domain-3 traps:

1. **"Expand the enum when new cases appear"** → wrong (Fragile Expansion). Correct: catch-all + detail field.
2. **"Use temperature 0 to normalize formats"** → insufficient. Correct: few-shot examples.
3. **"Trust the calculated total"** → wrong without redundancy. Correct: compare against stated_total and flag mismatches.
4. **"Retry the failed extraction N more times"** → wrong when the info is missing. Correct: fail fast for missing-info cases, retry for formatting.

```question
id: playbook-domain-3-01
domain: domain-3-prompt-engineering
scenario: "6"
difficulty: medium
stem: |
  Scenario: Structured Data Extraction.

  Your extraction pipeline uses a strict enum of 5 property types for a real estate dataset. In the past month you've seen validation errors on 4% of records — all for "studio apartment", "converted warehouse", "live/work loft", and "mobile home" values that don't fit your enum. Engineers want to add these to the enum, but expect MORE edge cases every quarter. What schema change best addresses this?
options:
  A: Expand the enum to include the 4 new types discovered so far, and plan for quarterly enum updates as more edge cases appear.
  B: Loosen the property_type field to accept any string, removing the enum constraint entirely.
  C: Add an "other" value to the enum, paired with a new property_type_detail string field that captures the specific variant.
  D: Log validation errors and use them as training data for a future fine-tuned model that recognizes more property types.
correct: C
explanation: |
  A: The Fragile Expansion anti-pattern. Every new edge case forces a schema migration and re-validation. Quarterly updates perpetually chase tail cases.
  B: Removes ALL validation protection. Now any garbage string passes validation — a worse failure mode than the original problem.
  C: Correct. The Playbook's "Resilient Catch-All" pattern: enum stays closed for the common path (preserving downstream validation), while "other" + detail string captures edge cases without rejection. Scales to unknown unknowns.
  D: Indirect, expensive, and doesn't solve the near-term problem. Also, fine-tuning for property types is overkill for what's ultimately a schema shape issue.
source-note: raw/papers/The Architect's Playbook.md (Resilient Catch-Alls, p7)
```

```question
id: playbook-domain-3-02
domain: domain-3-prompt-engineering
scenario: "6"
difficulty: hard
stem: |
  Scenario: Structured Data Extraction.

  Your invoice extraction pipeline processes PDFs and outputs line items plus a grand total. Analysis shows 18% of extracted invoices have line items whose sum does NOT match the extracted grand total — usually due to OCR misreads on individual amounts. You can't tell which field (a line item OR the total) is wrong without human review. Which schema change most effectively triages these automatically?
options:
  A: Increase OCR resolution to reduce misreads at the source, then rely on agreement between line items and total.
  B: Output both a calculated_total (derived by the model summing line items) AND a stated_total (extracted directly from the page). Flag for human review only when they disagree.
  C: Train the model to self-correct by comparing its sum against its extracted total and re-extracting when they disagree.
  D: Drop the grand total field entirely and compute it server-side from the extracted line items to avoid the inconsistency.
correct: B
explanation: |
  A: Better OCR reduces the error rate but doesn't eliminate it. You still have no triage mechanism for the residual errors.
  B: Correct. The Playbook's "Schema Redundancy" pattern: two independently-derived values (model-sum vs page-extract) become a consistency check. Agreement auto-approves; disagreement routes to human review. 82% of cases auto-flow; 18% get human attention.
  C: Self-correction still has no external ground truth — the model doesn't know WHICH of the two values is wrong, and may re-hallucinate.
  D: Loses valuable redundancy! The stated total is your check on OCR errors in the line items. Dropping it makes the problem invisible.
source-note: raw/papers/The Architect's Playbook.md (Schema Redundancy, p8)
```

```question
id: playbook-domain-3-03
domain: domain-3-prompt-engineering
scenario: "6"
difficulty: medium
stem: |
  Scenario: Structured Data Extraction.

  Your event-metadata extraction produces an attendee_count field. For ~12% of events, the source document doesn't mention attendance — yet your model confidently outputs numbers like 500 or 1000 for these cases, and downstream analytics flag the inflated totals. You run with temperature 0 already. What change most directly eliminates the fabricated counts?
options:
  A: Switch to temperature 1 so the model becomes less confident and more likely to output null.
  B: Add an explicit prompt instruction that if attendee_count is not mentioned in the source text, return "null" instead of inventing a number.
  C: Remove the attendee_count field from the schema so the model has no slot to fill.
  D: Post-process the output to clamp attendee_count to zero whenever the source text is below a certain length.
correct: B
explanation: |
  A: Temperature 1 increases randomness — you'll get varied hallucinations, not fewer. Temperature doesn't control "completeness bias."
  B: Correct. The Playbook's "Null Handling Instruction" pattern: models bias toward filling fields that are requested, because training data rewards completeness. Explicit null-instruction ("return null if not stated") overrides that bias in the prompt layer.
  C: Drops the data entirely — now you can't capture attendee counts even when they ARE in the source.
  D: Source-length heuristics are a proxy and will false-negative on short documents that DO mention attendance.
source-note: raw/papers/The Architect's Playbook.md (Null Handling Instruction, p9)
```

```question
id: playbook-domain-3-04
domain: domain-3-prompt-engineering
scenario: "6"
difficulty: medium
stem: |
  Scenario: Structured Data Extraction.

  Your extraction pipeline runs three specialist extractors (financial-data, news-metadata, patent-claims) whose outputs feed a synthesis extractor that produces final records for your warehouse. The raw outputs: financial extractor returns structured JSON tables, news extractor returns prose summaries, patent extractor returns bulleted lists. The synthesis extractor's final records lose table structure, drop citations, and sometimes attribute claims to the wrong source. Which architectural change best addresses all three issues?
options:
  A: Add a post-synthesis editor agent that fact-checks citations and reconstructs tables from prose summaries.
  B: Give the synthesis agent explicit instructions to preserve tables as tables, citations as citations, and not cross-attribute claims.
  C: Introduce a Format Conversion Layer that standardizes all specialist outputs to a common structured JSON intermediate (claim, evidence, source, confidence). Instruct the synthesis agent to preserve claim-source mappings verbatim.
  D: Have each specialist agent write its output directly to the final briefing's designated section, bypassing the synthesis step.
correct: C
explanation: |
  A: Editor-after-synthesis is too late — citations already lost in the handoff can't be reliably reconstructed from prose. Fact-checking prose against original sources is expensive and error-prone.
  B: Prompt-level exhortations don't overcome the real problem (prose is a LOSSY intermediate for tables and citations). The synthesis agent would still have to reconstruct from lossy input.
  C: Correct. The Playbook's "Structured Intermediate Representations" pattern: a common structured JSON intermediate with claim-source mappings survives handoffs in ways raw prose doesn't. The Citation Rule forces every specialist to emit machine-traceable evidence.
  D: Bypasses the synthesis agent entirely — loses the cross-source reasoning that synthesis provides, which is the whole point of having three specialists.
source-note: raw/papers/The Architect's Playbook.md (Structured Intermediate Representations, p23)
```
