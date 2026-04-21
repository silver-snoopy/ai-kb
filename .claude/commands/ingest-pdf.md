---
description: Ingest a local PDF into the vault via Docling (text + figure extraction) → propose compiled notes per CCA-F domain with embedded question blocks → update index. Built for dense design-heavy PDFs (playbooks, decks, whitepapers).
argument-hint: <cert-id> <path-to-pdf> [--domains d1,d2,...|auto]
---

# /ingest-pdf — local PDF → compiled-wiki notes pipeline

**Arguments:** `<cert-id>` `<path-to-pdf>` `[--domains <d1,d2,...>|auto]`

Where:
- `<cert-id>` — folder under `certs/` (e.g., `cca-f`)
- `<path-to-pdf>` — local filesystem path. If not already under `raw/papers/`, offer to copy it there first (per spec §3.1, raw is immutable once written).
- `--domains` — comma-separated domain slugs to target, or `auto` (default) to infer domains from section headings.

Unlike `/capture` (single-domain, paste-driven) and `/ingest-url` (URL-driven), `/ingest-pdf` handles local PDF files including image-based/designed decks where `pdftotext` returns empty. It fans out into N domain-specific notes rather than one.

## What to do

### 1. Parse arguments + preflight

- Require both positional args. Fail with usage if missing.
- Validate the PDF path exists. If not under `raw/papers/`, prompt the user to approve copying it there first — `raw/` writes require explicit per-snapshot approval (spec §3.1). Do not silently copy.
- Check the docling MCP server is available (`mcp__docling__*` tools). If not, instruct user to add `docling-mcp-server` to `.mcp.json` (see `.mcp.json` for the obsidian/docling pattern) and restart.

### 2. Docling conversion (text projection)

- Call `mcp__docling__convert_document_into_docling_document` with the PDF path.
- Save the cache key returned.
- Call `mcp__docling__get_overview_of_document_anchors` to get the section structure.
- Call `mcp__docling__export_docling_document_to_markdown` to get the full markdown.
- Write the markdown to `raw/papers/<pdf-basename>.md` as a raw-adjacent text projection with frontmatter:

```yaml
---
source_type: docling-projection
source_pdf: <original PDF filename>
extracted_by: docling <version> via docling-mcp <version>
extracted_at: <ISO-8601 date>
pages: <N>
sections: <M>
pictures: <P>
tables: <T>
notes: |
  Machine-generated text projection. Figures appear as `<!-- image -->` placeholders.
  Compiled-wiki notes should use vision-read on specific pages where diagrams carry
  pedagogical content not present in the text layer.
---
```

This step is raw-adjacent (NOT compiled-wiki) — the projection is a cached view of an immutable source.

### 3. Figure pass — vision-read diagram pages

Image-based PDFs have diagrams that Docling marks `<!-- image -->` but does NOT interpret. For diagrams that carry pedagogical content:

- Use `pypdfium2` (already a Docling transitive dep) to render candidate pages as PNGs to a temp directory:

```python
import pypdfium2 as pdfium, os, tempfile
out_dir = os.path.join(tempfile.gettempdir(), 'pdf-pages')
os.makedirs(out_dir, exist_ok=True)
pdf = pdfium.PdfDocument(pdf_path)
for n in target_pages:
    img = pdf[n-1].render(scale=2.0).to_pil()
    img.save(os.path.join(out_dir, f'p{n:02d}.png'))
```

- Read the rendered PNGs with the Read tool (it's multimodal). Read 4-6 diagrams per ingest — prioritize:
  - Framework/overview figures (four-domain wheels, hierarchies, flowcharts)
  - Tables and grids (lookup matrices)
  - Anti-pattern vs Correct-pattern side-by-sides
- You can skip pages that are text-heavy with only minor decorative imagery.

Docling's `page_thumbnail` MCP tool ALSO works IF the server was started with `DOCLING_MCP_KEEP_IMAGES=true` (env var in `.mcp.json`). If the env var isn't set, prefer the pypdfium2 path to avoid requiring a server restart.

### 4. Domain inference + note proposal

- Read the active cert's `meta.yaml` to get the domain list.
- Read **substrate files for grounding** (CRITICAL for question quality):
  - `certs/<cert-id>/_scenarios.md` — scenario-domain taxonomy (CORRECT/ANTI-PATTERN pairs; primary few-shot source for question generation)
  - `certs/<cert-id>/_quick-reference.md` — distractor catalog per domain
  - `certs/<cert-id>/domain-*/anti-patterns.md` — per-domain anti-pattern catalogs
  - **`certs/<cert-id>/domain-*/official-sample-questions.md` — AUTHORITATIVE QUESTION SHAPE REFERENCE.** Study these before drafting questions; your question stems, option lengths, distractor style, and explanation depth should match this shape. Do NOT copy verbatim; use as stylistic anchor.
  - `public/exams/<cert-id>/bank.json` — for scenario-domain constraint check (see step 5)
- For `--domains auto`: walk the PDF's section anchors from step 2 and propose a mapping of section → domain based on content keywords + matches to anti-pattern files.
- Propose ONE compiled-wiki note per targeted domain, with:
  - Frontmatter (`cert`, `domain`, `status: draft`, `source: <YYYY-MM-DD>-<pdf-slug>`, `tags`, `links`)
  - H1 + brief intro linking back to `raw/papers/<pdf>.md`
  - H3 per pattern: `**Anti-pattern:** / **Correct pattern:** / **Why correct works:** / *Figure pN*` structure (matches existing vault style, e.g. `certs/cca-f/domain-1-agentic/anti-patterns.md`)
  - "Exam angle" footer summarizing the canonical traps this note arms against
  - **4 question blocks per note, pre-tagged with `domain` + `scenario`** matching the bank's `scenarios[S].domains` constraint (see step 5)

### 5. **Scenario-domain constraint check (CRITICAL — DO THIS BEFORE EMBEDDING QUESTIONS)**

The bank's `public/exams/<cert-id>/bank.json` has a `scenarios` map declaring which domains each scenario covers. Questions tagged with a scenario whose `domains` list does NOT include the question's domain will fail `/cca-f-verify-questions` with CRITICAL. Example (from cca-f bank.json):

```json
"4": { "name": "Developer Productivity with Claude", "domains": ["domain-4-mcp"] }
```

A question tagged `scenario: "4"` MUST have `domain: "domain-4-mcp"`. If you tag a Domain-1 question with scenario 4, it will fail.

**Before embedding any question:** look up the question's domain in the scenarios map. Only use scenarios whose allowed-domains list includes the question's domain. Match the stem's "Scenario: X" prose to the tagged scenario name.

### 6. Cross-domain concept note

If the PDF contains a cross-cutting synthesis artifact (a matrix, a hierarchy, a reference table), propose one note under `concepts/<category>/<slug>.md` that summarizes it + cross-links all the domain notes.

### 7. YAML-validity pre-flight on embedded question blocks

Before writing any note, run `yaml.safe_load` on every proposed ```question``` block. Bare-scalar YAML options fail when option text contains a colon (e.g., `A: Set tool_choice to {type: "tool", name: "x"}`). Wrap such option values in single or double quotes. Reject any block that fails to parse.

### 8. Propose + approve per-note

Show the user each proposed note (frontmatter + body + question blocks) and ask `y/n/edit` PER NOTE (not per question within a note — the note is the unit of approval, following `/capture`'s pattern).

On approval of each:
- Write `certs/<cert-id>/<domain>/<slug>.md`
- Update `index.md` with a new row

### 9. Final step — queue for verification

After all notes are written, emit:

> Candidate questions were embedded in the notes. To merge them into `public/exams/<cert-id>/bank.json`, extract them with a transform script (pattern: parse each note's ```question``` blocks, generate `gen-<uuid>` IDs, convert to bank schema with `source: "llm"`, write to `.tmp-ingest/candidates/ingest-<timestamp>.json`), then run `/cca-f-verify-questions <candidate-path>`.

Do NOT invoke the verifier automatically — verify happens on the user's command.

## Invariants

- **`raw/` writes (the `.md` projection) require explicit user approval.** No bulk-yes.
- **Compiled wiki writes (the per-domain notes) require per-note user approval.**
- **Question blocks must honor the bank's scenario-domain constraint map.** Pre-flight against `bank.json` before embedding.
- **Question blocks must pass `yaml.safe_load`.** Pre-flight before writing.
- **Official sample questions are the style anchor.** Read them before drafting new questions.
- **The figure pass complements the text pass.** For pedagogical diagrams, always vision-read; don't rely on Docling's text extraction alone for image-based content.

## Usage examples

```
/ingest-pdf cca-f raw/papers/The\ Architect\'s\ Playbook.pdf
/ingest-pdf cca-f raw/papers/some-whitepaper.pdf --domains domain-1-agentic,domain-5-context
```

## See also

- Generator (substrate-grounded question generation): `.claude/commands/cca-f-generate-questions.md`
- Verifier (4-reviewer adversarial pass): `.claude/commands/cca-f-verify-questions.md`
- Sibling: `/capture` (single-domain, paste-driven), `/ingest-url` (URL-driven)
