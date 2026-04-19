# AI Certification Knowledge Base

Personal knowledge base for preparing for AI certifications, starting with **Claude Certified Architect — Foundations (CCA-F)** (target: end of May 2026).

Built on the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — immutable raw sources, LLM-compiled wiki, schema doc.

## Structure

- `raw/` — immutable source material (Academy transcripts, docs excerpts, papers, URL snapshots, game-session logs)
- `certs/` — per-certification compiled notes, meta.yaml, mock exams, weakness queue
- `concepts/` — provider-neutral concept library
- `prompts/`, `resources/` — reusable prompts, bookmarks
- `.claude/commands/` — `/capture`, `/ingest-url`, `/seed-urls`, `/tutor`, `/quiz`, `/mock-exam`, `/lint` slash commands
- `scripts/dashboard.mjs` — regenerates `dashboard.md` with progress/countdown/weak-spots
- `quartz/` — Quartz v4 static site generator (builds to public URL)

## Quick start

1. `/capture cca-f domain-1-agentic <source-name>` — ingest pasted content into structured notes
2. `/ingest-url cca-f domain-4-mcp <url>` — fetch + save snapshot + capture in one flow
3. `/seed-urls cca-f urls.txt` — bulk ingest multiple URLs
4. `/tutor cca-f domain-1-agentic "<topic>"` — Socratic/scenario tutor session
5. `/quiz cca-f domain-1-agentic` — quick conversational quiz
6. `/mock-exam cca-f` — full-length practice exam (study mode)
7. `/lint cca-f` — weekly health check

See `docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md` for the full design.
