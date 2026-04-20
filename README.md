# AI Certification Knowledge Base

Personal knowledge base for preparing for AI certifications, starting with **Claude Certified Architect — Foundations (CCA-F)** (target: end of May 2026).

Built on the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — immutable raw sources, LLM-compiled wiki, schema doc.

## Live study surfaces

Deployed via GitHub Pages at `https://silver-snoopy.github.io/ai-kb/`. All surfaces read from a single unified bank at `public/exams/cca-f/bank.json` (364 questions, each tagged with domain + scenario).

- **`/practice/`** — scenario MCQs with instant feedback. Filter by domain and/or scenario (intersection); or launch a full **Mock Exam** (60 Qs, 4 of 6 scenarios, domain-weighted like the real exam)
- **`/dungeon/`** — *Slay the Cert*, a 16-bit browser dungeon crawler where each boss is a CCA-F domain. Autosaves, post-boss mistakes review, and a `?debug=1` mode with a demo campaign
- **`/`** — landing hub

All state lives in the user's browser. Nothing phones home.

## Repo structure

- `raw/` — immutable source material (Academy transcripts, docs excerpts, papers, URL snapshots, game-session logs, the CertSafari question bank)
- `certs/` — per-certification compiled notes, `meta.yaml`, mock exams, weakness queue
- `concepts/` — provider-neutral concept library
- `prompts/`, `resources/` — reusable prompts and bookmarks
- `public/` — the deployed study surfaces (practice, dungeon, landing; review nav-hidden but reachable by direct URL)
- `public/exams/<cert-id>/bank.json` — unified question bank the study surfaces read
- `public/exams/arrangement.js` — shared deterministic arrangement function (filter, mock-exam builder)
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
- `/cca-f-generate-questions` — generate novel questions for a target scenario/domain, grounded in the CertSafari substrate; writes to `public/exams/cca-f/candidates/`
- `/cca-f-verify-questions <path>` — 4-pass adversarial review; on clean review, merges each question into `public/exams/cca-f/bank.json` (bumps version, keeps candidate as audit trail)

Maintenance:
- `/lint <cert>` — weekly health check (contradictions, orphans, stale terms)

## Design docs

- [Vault design](docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md) — the Karpathy three-layer + schema-doc rationale
- [Slay the Cert gamification](docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md) — the dungeon game spec
- [CCA-F exam integration](docs/superpowers/specs/2026-04-20-cca-f-exam-integration-design.md) — practice picker + generator + verifier pipeline
- [Dungeon UX pass](docs/superpowers/specs/2026-04-20-dungeon-ux-improvements-design.md) — debug gate, continue-run, wrong-answer visibility
