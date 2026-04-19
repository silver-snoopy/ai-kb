---
description: Ingest a raw source (transcript, doc excerpt, paper) into structured notes + MCQ question blocks. Karpathy-pattern compile step.
argument-hint: <cert-id> <domain-id> <source-name>
---

# /capture — ingest new source into vault

**Arguments:** `<cert-id>` `<domain-id>` `<source-name>`

Where:
- `<cert-id>` — folder under `certs/` (e.g., `cca-f`)
- `<domain-id>` — folder under `certs/<cert-id>/` (e.g., `domain-1-agentic`)
- `<source-name>` — free-form label (e.g., `academy-lesson-7-mcp-tools`). Becomes part of output filename and frontmatter `source:` field. NOT a file path.

## What to do

1. Parse `$ARGUMENTS` into `CERT`, `DOMAIN`, `SOURCE`. Fail with usage message if fewer than 3.
2. Read `certs/$CERT/meta.yaml` via `obsidian-mcp` — validate cert exists.
3. Validate the domain exists in `meta.yaml`.
4. Read any existing notes in `certs/$CERT/$DOMAIN/` to learn style + naming.
5. Prompt the user:
   > "Paste the raw source material below. End with a line containing just `---END---`.
   >
   > **Note:** `/capture` does not write to `raw/`. If you want a raw snapshot preserved on disk, use `/ingest-url` for URL sources (which writes to `raw/` with your approval), or save the source file to `raw/academy/`, `raw/anthropic-docs/`, or `raw/papers/` yourself."
6. Read the pasted content until `---END---`.
7. Propose:
   - A slugified filename `<slug-of-SOURCE>.md` (kebab-case, lowercase, max 60 chars before `.md`)
   - Frontmatter:
     ```yaml
     ---
     cert: $CERT
     domain: $DOMAIN
     status: draft
     source: $SOURCE
     tags: [suggest 2-4 relevant tags based on content]
     links: [suggest paths to related concepts/ notes if any match]
     ---
     ```
   - A structured note body with 2-5 H2 sections covering main ideas
   - 2-4 structured ```question``` blocks (see §5.2 in the spec; these are MCQs in YAML format embedded in the note). Not Anki flashcards — inline machine-readable questions that `/quiz` and `/mock-exam` consume.
8. Show all of the above to the user. Ask for confirmation, edits, or skip items (per question block).
9. On approval:
   a. Write note to `certs/$CERT/$DOMAIN/<slug>.md` with approved question blocks embedded.
   b. Update `index.md` at vault root — add a row for the new note (Path | Cert | Domain | Status | One-line summary). Sort alphabetically by Path.
   c. If the note references `concepts/` paths that don't exist yet, offer to create stubs.
10. At end, confirm what was written:
    ```
    ✓ Note:             certs/$CERT/$DOMAIN/<slug>.md (+N question blocks)
    ✓ Index updated:    index.md (+1 entry)
    ```

## Invariants

- **`/capture` never writes to `raw/`.** For URL-sourced content that should have a raw snapshot, use `/ingest-url` instead (which writes to `raw/` with explicit per-snapshot user approval per spec §3.1).
- Never write to the compiled wiki without per-item user approval.
- Always update `index.md` if any note is created/renamed/moved.
- One-line summary in `index.md` ≤ 140 chars.

## Usage example

```
/capture cca-f domain-4-mcp academy-lesson-7-mcp-tools
```

Then paste the Academy lesson transcript, end with `---END---`, review proposals, accept/edit/reject each part.
