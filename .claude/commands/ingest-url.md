---
description: Fetch a URL, save a raw snapshot to raw/ with user approval, then process like /capture. Seeding mode for docs, blogs, arxiv.
argument-hint: <cert-id> <domain-id> <url>
---

# /ingest-url — fetch + capture from a URL

**Arguments:** `<cert-id>` `<domain-id>` `<url>`

## What to do

1. Parse `$ARGUMENTS`. Require all three. Fail with usage if fewer.
2. Validate URL shape (starts with http/https, no query-stripping needed).
3. Read `certs/<cert>/meta.yaml` via obsidian-mcp; validate cert + domain.
4. Fetch the URL using the `WebFetch` tool. Prompt to the fetcher:
   > "Return the full content of this page as clean markdown. Preserve headings, bullet lists, code blocks, tables. Strip navigation, ads, cookie banners, footers, and sidebars. If the page is primarily video/audio without a transcript, say so explicitly."
5. Auto-detect `raw/` subfolder by URL host:
   - `docs.anthropic.com`, `anthropic.com/news/*`, `anthropic.com/research/*` → `raw/anthropic-docs/`
   - `arxiv.org`, `*.acm.org`, `*.openreview.net`, `proceedings.mlr.press` → `raw/papers/`
   - `*.skilljar.com` → `raw/academy/` **with warning**: "Skilljar pages are usually video; extracted content is often incomplete. Consider pasting the transcript manually via `/capture` instead."
   - anything else → `raw/other/`
6. Auto-generate raw filename: `<YYYY-MM-DD>-<slug>.md` where slug is derived from URL path or page title (kebab-case, lowercase, ≤60 chars before `.md`).
7. Show the user:
   - First ~500 lines of extracted markdown + truncation note if longer
   - Proposed raw path
   - URL + fetched timestamp
8. Ask: "Save raw snapshot to `<path>`? [y/n]"
   - On `y`: write the content to `raw/<folder>/<filename>` with frontmatter:
     ```yaml
     ---
     source_url: <full URL>
     fetched_at: <ISO-8601 UTC>
     fetched_by: /ingest-url
     host: <hostname>
     ---
     ```
     followed by the extracted markdown body.
   - On `n`: skip snapshot but continue to step 9 using the in-memory content.
9. Continue like `/capture`:
   a. Propose a compiled note skeleton + frontmatter (include `source_url` alongside `source`).
   b. Propose 2-4 ```question``` blocks to embed inline (MCQ format per spec §5.2).
   c. Propose 2-4 structured question blocks (see below).
   d. User approves per item; edits as needed.
   e. Write to `certs/<cert>/<domain>/<slug>.md`. Update `index.md`.

## Structured question block format

Use a fenced code block with language tag `question`:

````
```question
id: <cert-id>-<domain-id>-<topic-slug>-<nn>
domain: <domain-id>
difficulty: easy | medium | hard
stem: |
  <scenario text, 2-6 sentences>
options:
  A: <option text>
  B: <option text>
  C: <option text>
  D: <option text>
correct: <letter>
explanation: |
  <2-4 sentences of why the correct is correct + why distractors fail>
source-note: <path to the note this question lives in>
```
````

The post-exam game build (`scripts/build-questions.mjs`, not yet implemented) extracts these into `questions.json` for the dungeon-crawler. Meanwhile, `/quiz` and `/mock-exam` can optionally prefer these deterministic questions over LLM-generated ones.

## Invariants

- **`raw/` is written ONLY with per-snapshot y/n approval.** No bulk-yes. No silent writes.
- Fetched content always carries `fetched_at` timestamp. Survives URL drift.
- If `WebFetch` fails or returns obvious junk (CAPTCHA/login wall/empty), surface the problem and do NOT write raw snapshot. Offer user to paste content manually via `/capture` instead.
- Skilljar warning is mandatory — video content does not extract cleanly.

## Usage examples

```
/ingest-url cca-f domain-4-mcp https://docs.anthropic.com/en/docs/build-with-claude/tool-use
/ingest-url cca-f domain-1-agentic https://www.anthropic.com/news/engineering-challenges-of-agents
/ingest-url cca-f domain-2-claude-code https://docs.anthropic.com/en/docs/claude-code/overview
```
