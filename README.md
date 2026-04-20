# AI Certification Knowledge Base

Personal knowledge base for preparing for AI certifications, starting with **Claude Certified Architect — Foundations (CCA-F)** (target: end of May 2026).

Built on the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — immutable raw sources, LLM-compiled wiki, schema doc.

## Live study surfaces

Deployed via GitHub Pages at `https://silver-snoopy.github.io/ai-kb/`:

- **`/practice/`** — scenario MCQs with instant feedback; pick a verified exam or a domain filter
- **`/review/`** — spaced repetition over the same question bank; missed cards return sooner
- **`/dungeon/`** — *Slay the Cert*, a 16-bit browser dungeon crawler where each boss is a CCA-F domain. Autosaves, post-boss mistakes review, and a `?debug=1` mode with a demo campaign
- **`/`** — landing hub that links all three

All state lives in the user's browser. Nothing phones home.

## Repo structure

- `raw/` — immutable source material (Academy transcripts, docs excerpts, papers, URL snapshots, game-session logs, the CertSafari question bank)
- `certs/` — per-certification compiled notes, `meta.yaml`, mock exams, weakness queue
- `concepts/` — provider-neutral concept library
- `prompts/`, `resources/` — reusable prompts and bookmarks
- `public/` — the deployed study surfaces (practice, review, dungeon, landing)
- `public/exams/<cert-id>/verified/` — verified exam JSON files the study surfaces read
- `.claude/commands/` — slash commands (see below)
- `scripts/` — dashboard, question-build, CertSafari extractor, exam-builder
- `quartz/` — Quartz v4 static site generator (wraps the vault into a browsable site)

## Slash commands

Study / ingest:
- `/capture <cert> <domain> <source>` — ingest pasted content into structured notes
- `/ingest-url <cert> <domain> <url>` — fetch + save snapshot + capture in one flow
- `/seed-urls <cert> <urls-file>` — bulk ingest multiple URLs
- `/tutor <cert> <domain> "<topic>"` — Socratic/scenario tutor session
- `/quiz <cert> <domain>` — short conversational quiz
- `/mock-exam <cert>` — full-length practice exam (study mode)
- `/ingest-session <session-log>` — ingest a downloaded dungeon session log into the vault

Exam pipeline (CCA-F):
- `/cca-f-generate-exam` — generate a candidate exam JSON grounded in the CertSafari bank
- `/cca-f-verify-exam <path>` — 4-pass adversarial review; promotes candidates to `verified/` on zero critical flags

Maintenance:
- `/lint <cert>` — weekly health check (contradictions, orphans, stale terms)

## Design docs

- [Vault design](docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md) — the Karpathy three-layer + schema-doc rationale
- [Slay the Cert gamification](docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md) — the dungeon game spec
- [CCA-F exam integration](docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md) — practice picker + generator + verifier pipeline
- [Dungeon UX pass](docs/superpowers/specs/2026-04-20-dungeon-ux-improvements-design.md) — debug gate, continue-run, wrong-answer visibility
