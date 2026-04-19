---
description: Bulk-ingest URLs from a file. Each URL processed sequentially with per-URL approval. For rapid vault seeding.
argument-hint: <cert-id> <urls-file>
---

# /seed-urls — bulk URL ingestion

**Arguments:** `<cert-id>` `<urls-file>` — path to a text file with one URL per line. Optional prefix `<domain-id>|<url>` to target a specific domain; if absent, command prompts per URL. Comment lines start with `#`.

## What to do

1. Parse `$ARGUMENTS`. Require both.
2. Read `<urls-file>`. Skip blank lines and lines starting with `#`.
3. For each line, parse as `<domain-id>|<url>` or plain `<url>`.
4. Preflight summary: "Processing <N> URLs for <cert-id>. Per-URL y/n approval for each raw snapshot and each compiled note. Estimated ~2-3 min per URL. Continue? [y/n]"
5. On `y`, iterate:
   a. If plain `<url>`, prompt for domain-id (show meta.yaml's list of domains).
   b. Run the `/ingest-url` flow for <cert, domain, url>.
   c. If user declines raw snapshot → skip snapshot, still offer compiled note.
   d. If user declines compiled note → log as "skipped" and move to next URL.
   e. On fetch failure: log error, continue (do NOT abort).
   f. Progress: "URL <i>/<N>: <url> → <snapshot? note? skipped?>"
6. End summary:
   ```
   ✓ /seed-urls complete — <cert-id>
   URLs processed:     <N>
   Fetch failures:     <F>
   Raw snapshots:      <R>
   Compiled notes:     <M>
   Flashcards added:   <C>
   Question blocks:    <Q>
   Index updated:      yes
   Report:             _lint/<date>-seed-urls.md
   ```
7. Write session report to `_lint/<YYYY-MM-DD>-seed-urls.md` listing every URL + outcome + paths.

## Invariants

- Per-URL, per-item user approval. No "approve all" shortcut.
- A failed URL does not abort the batch.
- Session report always written, even on partial completion (user Ctrl+C'd).

## Example `urls.txt`

```
# CCA-F Day 2 seeding — Anthropic docs priority

# Domain 1 — Agentic Architecture & Orchestration
domain-1-agentic|https://docs.anthropic.com/en/docs/build-with-claude/agents
domain-1-agentic|https://www.anthropic.com/news/engineering-challenges-of-agents

# Domain 2 — Claude Code
domain-2-claude-code|https://docs.anthropic.com/en/docs/claude-code/overview
domain-2-claude-code|https://docs.anthropic.com/en/docs/claude-code/quickstart

# Domain 4 — Tool Design & MCP
domain-4-mcp|https://docs.anthropic.com/en/docs/build-with-claude/tool-use
domain-4-mcp|https://modelcontextprotocol.io/docs/concepts/architecture
```

## Usage

```
/seed-urls cca-f seed-urls-day2.txt
```
