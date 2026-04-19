# Personal AI Cert KB — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 2-evening MVP of the personal AI-certification Knowledge Base as specified in `docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md`.

**Architecture:** Karpathy LLM Wiki three-layer (immutable `raw/`, LLM-compiled wiki, `CLAUDE.md` schema doc) backed by git + Obsidian + Quartz + Claude Code (obsidian-mcp + 7 slash commands: `/capture`, `/ingest-url`, `/seed-urls`, `/tutor`, `/quiz`, `/mock-exam`, `/lint`). Dashboard auto-generated via GitHub Action. Claude Max plan baseline assumed. Retention via in-vault `weakness-queue.md` + `/quiz --review-weak` — no SRS app dependency.

**Tech Stack:** git, GitHub, Node.js 20+ (ESM; `yaml` + `glob` + `vitest` for the dashboard), Obsidian desktop + Obsidian Git plugin, Quartz v4, obsidian-mcp (StevenStavrakis), Claude Code + Claude.ai GitHub connector. No Anki, no Yanki, no mobile app — retention is handled in-vault.

**Spec references:** `docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md` — §3 architecture, §4 vault layout, §5 meta.yaml, §6 slash commands, §7 study loops, §8 dashboard, §9 build sequence.

**Resolved open decisions (from spec §12):**
- Socratic default phrasing — defined in `.claude/commands/tutor.md` (Task 2.2)
- Quiz verdict format — defined in `.claude/commands/quiz.md` (Task 2.3)
- Quartz theme — default vanilla Quartz v4; no custom styling in MVP
- Mock-exam report format — YAML frontmatter + Q&A sections; defined in `.claude/commands/mock-exam.md` (Task 2.4) and consumed by `scripts/dashboard.mjs` (Task 5.1)
- Dashboard script language — **Node.js (ESM)** with `yaml` + `glob` + `vitest`. Chosen for toolchain consistency (Quartz, obsidian-mcp, GitHub Pages workflow all already use Node; no second toolchain to install).
- Obsidian commit flow — use Obsidian Git plugin for local auto-commit; manual push from Obsidian Git or CLI; dashboard workflow uses `[skip ci]` to avoid loop
- MVP Obsidian plugins — Obsidian Git, Core Search (default). No Yanki, no Dataview/Templater (YAGNI)

---

## Phase 0 — Prerequisites (~15 min)

> **TDD note:** Phases 0–4, S, and 6 are infrastructure/config/slash-command authoring or content seeding — verification happens via the `Expected:` checks after each step, not unit tests. Only Phase 5 (Node dashboard) uses full TDD (test-first, via vitest). This matches the test-driven-development skill's scope: TDD applies to code with behavior to assert, not to tool installs, markdown command files, or seeded content derived from external sources.

### Task 0.1: Verify toolchain

**Files:** (none — verification only)

- [ ] **Step 1: Check installed tools**

Run (each should return a version, not an error):
```bash
git --version
node --version   # ≥20 (required for ESM + built-in test utilities used by vitest)
npm --version
npx --version
gh --version     # GitHub CLI; install from https://cli.github.com/ if missing
```

Expected: all five return versions. If any missing, install before proceeding.

- [ ] **Step 2: Authenticate GitHub CLI**

Run:
```bash
gh auth status
```

If not authenticated:
```bash
gh auth login
```

Follow prompts (choose GitHub.com, HTTPS, authenticate via browser).

Expected: `gh auth status` shows "Logged in to github.com as <username>".

- [ ] **Step 3: Install Obsidian desktop**

- Obsidian: https://obsidian.md/download → desktop installer for Windows
- Install it. Do NOT open any vault yet — Claude creates the vault folder in Phase 1.

No test. Human verification.

---

## Phase 1 — Vault foundation (Day 1, ~90 min)

### Task 1.1: Initialize git repo + .gitignore + README

**Files:**
- Create: `c:\projects\ai-kb\.gitignore`
- Create: `c:\projects\ai-kb\README.md`

- [ ] **Step 1: Initialize git**

Run:
```bash
cd c:/projects/ai-kb
git init -b main
```

Expected: `Initialized empty Git repository in c:/projects/ai-kb/.git/`

- [ ] **Step 2: Write `.gitignore`**

Content:
```gitignore
# Node / Quartz / dashboard script
node_modules/
*.log
coverage/
.vitest-cache/
quartz/public/
quartz/.quartz-cache/

# OS
.DS_Store
Thumbs.db
desktop.ini

# Obsidian
.obsidian/workspace*
.obsidian/cache
.obsidian/app.json

# Secrets (belt & braces — shouldn't exist here anyway)
.env
.env.*
*.key
*.pem
```

- [ ] **Step 3: Write `README.md`**

Content:
```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: initialize vault with gitignore and README"
```

Expected: commit succeeds.

---

### Task 1.2: Create folder skeleton

**Files:** (directories only — create empties with `.gitkeep` where needed)

- [ ] **Step 1: Create all folders**

Run (single command):
```bash
mkdir -p \
  raw/academy raw/anthropic-docs raw/papers raw/other raw/game-sessions \
  certs/cca-f/domain-1-agentic certs/cca-f/domain-2-claude-code certs/cca-f/domain-3-prompt-engineering certs/cca-f/domain-4-mcp certs/cca-f/domain-5-context certs/cca-f/mock-exams \
  certs/_template/domain-1/ certs/_template/mock-exams \
  concepts/agents concepts/rag concepts/tool-use concepts/prompt-engineering concepts/evaluation concepts/safety \
  prompts resources \
  _lint \
  .claude/commands \
  .github/workflows \
  scripts
```

- [ ] **Step 2: Add `.gitkeep` to empty folders so they're tracked**

Run:
```bash
touch raw/academy/.gitkeep raw/anthropic-docs/.gitkeep raw/papers/.gitkeep raw/other/.gitkeep raw/game-sessions/.gitkeep \
      concepts/agents/.gitkeep concepts/rag/.gitkeep concepts/tool-use/.gitkeep \
      concepts/prompt-engineering/.gitkeep concepts/evaluation/.gitkeep concepts/safety/.gitkeep \
      prompts/.gitkeep resources/.gitkeep _lint/.gitkeep \
      certs/cca-f/mock-exams/.gitkeep \
      certs/_template/mock-exams/.gitkeep
```

- [ ] **Step 3: Verify structure**

Run:
```bash
find . -type d -not -path './.git*' | sort
```

Expected output includes: `./raw/academy`, `./raw/anthropic-docs`, `./certs/cca-f/domain-1-agentic` … `./certs/_template/domain-1`, all `concepts/*`, `.claude/commands`, `scripts`, `_lint`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: create vault folder skeleton (Karpathy three-layer)"
```

---

### Task 1.3: Write root `CLAUDE.md` (schema doc)

**Files:**
- Create: `c:\projects\ai-kb\CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`**

Full content:
```markdown
# AI-KB Vault Conventions (Schema Doc)

This file is loaded automatically by every Claude Code session in this vault. It defines how the vault is organized and how Claude should behave when invoked here.

## Vault purpose

Personal preparation for AI certifications, starting with **Claude Certified Architect — Foundations (CCA-F)** (target: end of May 2026), then future Claude certifications (Professional / Forward-Deployed-Engineer tier when Anthropic releases them).

## Three-layer architecture (Karpathy LLM Wiki pattern)

1. **`raw/`** — IMMUTABLE once written. Academy transcripts, docs excerpts, paper PDFs, URL snapshots, game-session logs. Writes happen **only** via `/ingest-url`, `/seed-urls`, or (post-exam) `/ingest-session`, and **only** with per-snapshot user approval. Never silent. Treat written content as source of truth for facts.
2. **Compiled wiki** — `certs/`, `concepts/`, `prompts/`, `resources/`. Claude writes here, always with human approval. These are **derived** from `raw/` and verified by the user.
3. **Schema doc** — this file. Conventions + Claude's role.

## Claude's role in this vault

Claude is an **active research librarian**, not an autonomous writer. Responsibilities:
- Ingest raw sources into compiled notes (`/capture`)
- Tutor the user on cert content (`/tutor`) and file valuable Q&A back as wiki pages at session end (compound-knowledge loop)
- Quiz the user (`/quiz`) and drive retention via saved weakness queue
- Run full-length mock exams (`/mock-exam`)
- Periodic health checks (`/lint`) — find contradictions, orphans, stale claims, missing cross-references, data gaps
- Keep `index.md` current on every capture and lint

**Core invariant: Claude never silently modifies the vault.** Every proposed change is surfaced to the user for y/n/skip approval.

## Folder conventions

| Path | Who writes | Frontmatter required | Notes |
|---|---|---|---|
| `raw/**` | Human; Claude via `/ingest-url`, `/seed-urls`, or (post-exam) `/ingest-session` with per-snapshot user approval | No | Immutable once written. Verbatim source material (pasted transcripts, fetched URL snapshots, PDFs, game session logs). |
| `certs/<cert>/game-log.md` | System-generated by `/ingest-session` (post-exam) | No | Append-only summary of Slay the Cert game sessions. Exempt from frontmatter lint. |
| `certs/<cert-id>/domain-*/**.md` | Claude via `/capture` | Yes: `cert`, `domain`, `status`, `tags?`, `links?` | Exam-content notes |
| `certs/<cert-id>/README.md` | Human or Claude | No | MOC (Map of Content) |
| `certs/<cert-id>/meta.yaml` | Human | n/a | Exam parameters — see spec §5 |
| `certs/<cert-id>/mock-exams/*.md` | Claude via `/mock-exam` | Standardized YAML header: `cert`, `mode`, `date`, `score`, `total`, `passing_score`, `pass`, `time_elapsed_seconds`, `time_limit_seconds`, `per_domain_scores`, `weak_spots` | Reports |
| `certs/<cert-id>/weakness-queue.md` | Claude via `/quiz` and `/mock-exam` | No | Plain markdown checkbox list. `/quiz --review-weak` re-drills unchecked items. No external SRS app. |
| `concepts/**/*.md` | Claude via `/capture` or `/tutor` compound-knowledge | Tags-based, not status | Provider-neutral |
| `prompts/**`, `resources/**` | Human | No | Manual collection |
| `_lint/YYYY-MM-DD-report.md` | Claude via `/lint` | No | Reports |
| `index.md` | Claude via `/capture` and `/lint` | No | Auto-maintained catalog |
| `dashboard.md` | GitHub Action (dashboard.yml) | No | Auto-generated |

## Frontmatter contract (in-scope notes only)

```yaml
---
cert: <cert-id>              # e.g., "cca-f"
domain: <domain-id>          # e.g., "domain-1-agentic"
status: draft | in-progress | done
tags: [list, of, tags]       # optional
source: <source-name>        # from /capture <source-name> arg
links: [list/of/paths]       # wikilinks or file paths to related notes
---
```

## Stale-terms list (for `/lint` to flag)

Update this list as Anthropic deprecates features. Current items to flag if mentioned without a "superseded" note:

- "Claude 2" — obsolete model family
- "Claude 3.x" — superseded by Claude 4 family
- "Claude 3.5 Sonnet" — superseded by Sonnet 4 / 4.5 / 4.6
- "computer use beta" — now GA
- "human feedback" with no RLHF context — often conflated; flag for review
- "prompt caching beta" — now GA

(Reviewer agent / `/lint` adds to this list when user asks.)

## Cert roadmap (2026-04-18)

1. **CCA-F** — in progress, target end of May 2026 (primary focus)
2. **Next Claude cert** — placeholder in `certs/cca-next/` (Professional / FDE-track); populate when Anthropic announces
3. Other providers de-prioritized; architecture remains open

## Subscription context

User is on **Claude Max** plan. Tutor-mode and mock-exam loops can load full domain folders into context freely — no Pro-tier message budgeting needed.

## When invoked in this vault, Claude:
1. Reads this file (automatic via Claude Code).
2. Consults the active cert's `meta.yaml` for exam parameters.
3. Uses `obsidian-mcp` to access vault files.
4. For any mutating action: proposes, waits for approval, then applies.
5. Updates `index.md` whenever notes are created/moved/renamed.
6. Cites source filenames when drawing on vault content (trust-but-verify).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add root CLAUDE.md schema doc (Karpathy pattern)"
```

---

### Task 1.4: Seed `certs/cca-f/meta.yaml`

**Files:**
- Create: `c:\projects\ai-kb\certs\cca-f\meta.yaml`

- [ ] **Step 1: Write `meta.yaml`**

Content:
```yaml
id: cca-f
name: Claude Certified Architect — Foundations
provider: Anthropic
target_date: 2026-05-31
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: scenario-based-mcq
  cost_usd: 99
domains:
  - { id: domain-1-agentic, name: "Agentic Architecture & Orchestration", weight: 0.27 }
  - { id: domain-2-claude-code, name: "Claude Code Configuration & Workflows", weight: 0.20 }
  - { id: domain-3-prompt-engineering, name: "Prompt Engineering & Structured Output", weight: 0.20 }
  - { id: domain-4-mcp, name: "Tool Design & MCP Integration", weight: 0.18 }
  - { id: domain-5-context, name: "Context Management & Reliability", weight: 0.15 }
resources:
  - { name: "Anthropic Academy", url: "https://anthropic.skilljar.com", priority: primary }
  - { name: "Official cert landing page", url: "https://claudecertifications.com/", priority: secondary }
```

- [ ] **Step 2: Verify weights sum to 1.0**

Run:
```bash
node -e "const yaml=require('yaml');const fs=require('fs');const d=yaml.parse(fs.readFileSync('certs/cca-f/meta.yaml','utf8'));console.log(Math.round(d.domains.reduce((a,x)=>a+x.weight,0)*10000)/10000);"
```

(If Node complains about `yaml` not being installed, skip this check — it runs cleanly after Task 5.1 Step 2 installs deps. Alternatively, pip-free one-liner: add weights manually from the file; they sum to 1.00.)

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add certs/cca-f/meta.yaml
git commit -m "feat: seed CCA-F meta.yaml with verified exam parameters"
```

---

### Task 1.5: Write `certs/cca-f/README.md` + domain README stubs

**Files:**
- Create: `c:\projects\ai-kb\certs\cca-f\README.md`
- Create: `c:\projects\ai-kb\certs\cca-f\domain-1-agentic\README.md`
- Create: `c:\projects\ai-kb\certs\cca-f\domain-2-claude-code\README.md`
- Create: `c:\projects\ai-kb\certs\cca-f\domain-3-prompt-engineering\README.md`
- Create: `c:\projects\ai-kb\certs\cca-f\domain-4-mcp\README.md`
- Create: `c:\projects\ai-kb\certs\cca-f\domain-5-context\README.md`

- [ ] **Step 1: Write `certs/cca-f/README.md`**

Content:
```markdown
# CCA-F — Claude Certified Architect, Foundations

**Target:** 2026-05-31 · **Exam:** 60 scenario-based MCQs, 120 min, pass = 720/1000 · **Cost:** $99

## Domains (weight-ordered for study priority)

| # | Domain | Weight | Folder |
|---|---|---:|---|
| 1 | Agentic Architecture & Orchestration | 27% | [domain-1-agentic](./domain-1-agentic/) |
| 2 | Claude Code Configuration & Workflows | 20% | [domain-2-claude-code](./domain-2-claude-code/) |
| 3 | Prompt Engineering & Structured Output | 20% | [domain-3-prompt-engineering](./domain-3-prompt-engineering/) |
| 4 | Tool Design & MCP Integration | 18% | [domain-4-mcp](./domain-4-mcp/) |
| 5 | Context Management & Reliability | 15% | [domain-5-context](./domain-5-context/) |

## Primary resources

- **Anthropic Academy** (Skilljar) — 13 free self-paced courses; the authoritative prep material
- Official cert page: https://claudecertifications.com/
- Community: https://www.the-ai-corner.com/p/claude-certified-architect-curriculum-2026

## Schedule target

~6 weeks. Weight-weighted time allocation: Domain 1 gets the most hours, Domain 5 the least.

## Mock exams

See [mock-exams/](./mock-exams/) for dated session reports.

## Weakness queue

Missed questions accumulate in [weakness-queue.md](./weakness-queue.md). Use `/quiz --review-weak` to drill them.
```

- [ ] **Step 2: Write each domain README**

For each of the 5 domains, write a README at `certs/cca-f/<domain-id>/README.md`.

Template (substitute NAME, WEIGHT, ID per domain):
```markdown
# <NAME>

**Weight:** <WEIGHT>% of the CCA-F exam · **Domain ID:** `<ID>`

## Purpose

(Fill with 2-3 sentences about what this domain covers as you author notes.)

## Sub-topics to cover

(Populated by `/capture` as you ingest Academy lessons. Initially empty.)

## Notes in this folder

(Populated by `/capture`; `index.md` has the authoritative list.)

## Concept cross-references

(Link to provider-neutral notes in `concepts/` as you create them.)
```

Concrete values:

| Folder | NAME | WEIGHT | ID |
|---|---|---|---|
| domain-1-agentic | Agentic Architecture & Orchestration | 27 | domain-1-agentic |
| domain-2-claude-code | Claude Code Configuration & Workflows | 20 | domain-2-claude-code |
| domain-3-prompt-engineering | Prompt Engineering & Structured Output | 20 | domain-3-prompt-engineering |
| domain-4-mcp | Tool Design & MCP Integration | 18 | domain-4-mcp |
| domain-5-context | Context Management & Reliability | 15 | domain-5-context |

- [ ] **Step 3: Commit**

```bash
git add certs/cca-f/README.md certs/cca-f/domain-*/README.md
git commit -m "feat: seed CCA-F README and domain stubs"
```

---

### Task 1.6: Write `certs/_template/` scaffold

**Files:**
- Create: `c:\projects\ai-kb\certs\_template\meta.yaml`
- Create: `c:\projects\ai-kb\certs\_template\README.md`
- Create: `c:\projects\ai-kb\certs\_template\weakness-queue.md`
- Create: `c:\projects\ai-kb\certs\_template\domain-1\README.md`

- [ ] **Step 1: Write `_template/meta.yaml`**

Content:
```yaml
# TEMPLATE — copy this folder to certs/<new-cert-id>/ and fill in values

id: <cert-id>                    # filesystem-safe, e.g., "cca-professional"
name: <Human Readable Name>
provider: <Anthropic | Microsoft | AWS | ...>
target_date: <YYYY-MM-DD>        # user's target exam date
exam:
  question_count: <int>
  time_limit_minutes: <int>
  passing_score: <int>
  scale_max: <int>
  format: <scenario-based-mcq | mixed | ...>
  cost_usd: <int>
domains:
  - { id: <domain-id>, name: "<Human name>", weight: <0.0–1.0> }
  # weights must sum to 1.0
resources:
  - { name: "<Resource name>", url: "<URL>", priority: primary }
```

- [ ] **Step 2: Write `_template/README.md`**

Content:
```markdown
# TEMPLATE — <Cert Name>

**Target:** <YYYY-MM-DD> · **Exam:** <question_count> questions, <time_limit_minutes> min, pass = <passing_score>/<scale_max>

## Domains

(Fill from meta.yaml)

## Primary resources

(Fill from meta.yaml)

## Schedule target

(Write your own study plan here)

## Mock exams

See [mock-exams/](./mock-exams/).

## Weakness queue

[weakness-queue.md](./weakness-queue.md)
```

- [ ] **Step 3: Write `_template/weakness-queue.md`**

Content:
```markdown
# Weakness Queue — <cert-name>

Missed questions from `/quiz` and `/mock-exam` get appended here as unchecked checkbox items. `/quiz --review-weak` re-drills unchecked items. Mark them checked (or let the command remove them) once you've answered correctly twice in a row.

<!-- entries go below this line -->
```

- [ ] **Step 4: Write `_template/domain-1/README.md`**

Content:
```markdown
# <Domain 1 name>

**Weight:** <N>% · **Domain ID:** `<domain-1-id>`

## Purpose

(Fill with 2-3 sentences.)

## Sub-topics to cover

## Notes in this folder

## Concept cross-references
```

- [ ] **Step 5: Commit**

```bash
git add certs/_template/
git commit -m "feat: add certs/_template scaffolding for future certs"
```

---

### Task 1.7: Create initial empty `index.md`

**Files:**
- Create: `c:\projects\ai-kb\index.md`

- [ ] **Step 1: Write `index.md`**

Content:
```markdown
# Vault Index

_Last updated: (never — run `/lint --all` or any `/capture` to populate)_

_Auto-maintained by `/capture` and `/lint`. Do not edit by hand — your changes will be overwritten._

| Path | Cert | Domain | Status | One-line summary |
|---|---|---|---|---|
<!-- rows appended by /capture and /lint -->
```

- [ ] **Step 2: Commit**

```bash
git add index.md
git commit -m "feat: seed empty index.md (Karpathy catalog)"
```

---

### Task 1.8: Push to GitHub

**Files:** (none — remote setup)

- [ ] **Step 1: Create remote repo via gh CLI**

Run:
```bash
gh repo create ai-kb --public --description "Personal AI certification knowledge base" --source=. --remote=origin
```

Expected: repo created, local `origin` remote configured.

- [ ] **Step 2: Push**

Run:
```bash
git push -u origin main
```

Expected: 8 commits pushed.

- [ ] **Step 3: Verify on GitHub**

Run:
```bash
gh repo view --web
```

Expected: browser opens repo page showing commits.

---

### Task 1.9: Install Obsidian desktop + open vault

**Files:** (user configuration — no repo files)

- [ ] **Step 1: Install Obsidian**

Run the Obsidian installer from Phase 0. Launch Obsidian.

- [ ] **Step 2: Open `c:\projects\ai-kb` as vault**

In Obsidian: "Open folder as vault" → select `c:\projects\ai-kb`.

Expected: Obsidian shows the folder tree matching the git repo structure.

- [ ] **Step 3: Disable automatic `.obsidian/workspace*.json` tracking**

(Already handled in `.gitignore` from Task 1.1.)

- [ ] **Step 4: Verify**

Open `README.md` in Obsidian; confirm it renders. Open `certs/cca-f/README.md`; confirm domain links are clickable.

No commit. User verification.

---

### Task 1.10: Install + configure Obsidian Git plugin

**Files:** (user configuration)

- [ ] **Step 1: Enable community plugins**

Obsidian → Settings → Community plugins → Turn on community plugins.

- [ ] **Step 2: Install Obsidian Git**

Browse → search "Obsidian Git" (by Vinzent) → Install → Enable.

- [ ] **Step 3: Configure Obsidian Git**

Settings → Obsidian Git:
- Auto commit-and-sync interval: `60` minutes (not too aggressive; user still drives big changes)
- Auto pull interval on startup: `true`
- Commit message: `vault: auto-commit {{date}}`
- Pull updates on startup: `true`

- [ ] **Step 4: Verify**

Edit a file in Obsidian (e.g., add a line to `certs/cca-f/README.md`). Wait 60+ seconds or manually trigger `Ctrl+P` → "Obsidian Git: Commit all changes". Then check git log:

Run:
```bash
git log --oneline -5
```

Expected: top commit is the auto-commit from Obsidian Git.

- [ ] **Step 5: Revert the test edit**

```bash
git revert HEAD --no-edit
```

Or just undo the edit in Obsidian and let it auto-commit again.

---

### Task 1.11: (skipped — Option A: desktop-only authoring)

**Decision:** starting without Obsidian Sync. Desktop is the sole authoring environment; mobile access is via the public Quartz web view (browser-based read + Claude.ai GitHub connector for queries). Rationale: saves $4/mo until mobile capture is actually a need, avoids unnecessary setup.

**Upgrade path (if mobile authoring becomes needed later):**
1. Obsidian → Settings → Account → Upgrade to Sync plan ($4/mo annual billing).
2. Create a remote vault named `ai-kb` with end-to-end encryption password.
3. Connect local vault → upload.
4. Install Obsidian mobile app; sign in; pull remote vault.
5. ~10 minutes total. No other plan changes required.

No steps to execute now. Skip to Task 1.13.

---

### Task 1.12: (skipped — Option A: desktop-only authoring)

Skipped per Task 1.11. Mobile access is via the Quartz public URL built in Phase 4, not via Obsidian mobile. Proceed to Task 1.13.

---

### Task 1.13: Install obsidian-mcp + register in Claude Code

**Files:**
- Create: `c:\projects\ai-kb\.claude\settings.json`

- [ ] **Step 1: Test obsidian-mcp install (one-shot)**

Run:
```bash
npx -y obsidian-mcp c:/projects/ai-kb
```

Expected: something like `Starting obsidian-mcp server for c:/projects/ai-kb...` followed by server running.

Press Ctrl+C to stop. The one-shot run proves the package exists and the path works.

- [ ] **Step 2: Write `.claude/settings.json`**

Content:
```json
{
  "$schema": "https://claude.com/schemas/settings.json",
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp", "c:/projects/ai-kb"]
    }
  },
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(node:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "WebFetch",
      "mcp__obsidian__*"
    ]
  }
}
```

- [ ] **Step 3: Restart Claude Code**

Close and reopen Claude Code in the `c:\projects\ai-kb` directory.

- [ ] **Step 4: Verify MCP loaded**

In Claude Code, ask: "List the files in my Obsidian vault at the root level using the obsidian MCP."

Expected: Claude uses `mcp__obsidian__*` tools and returns the file listing (CLAUDE.md, README.md, index.md, etc.).

- [ ] **Step 5: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: configure obsidian-mcp server in Claude Code"
```

---

### Task 1.14: Day 1 smoke test (end-to-end)

**Files:** (none)

- [ ] **Step 1: Create test note on desktop**

In Obsidian desktop, create `certs/cca-f/domain-1-agentic/_smoke-test.md`:
```markdown
---
cert: cca-f
domain: domain-1-agentic
status: draft
tags: [test]
source: smoke-test
---

# Smoke test note

If you're reading this via Claude Code MCP (or, post-Phase-4, via the public Quartz URL), the chain works.
```

- [ ] **Step 2: (Deferred to Phase 4)** Verify on Quartz public URL once deployed. For Day 1, skip — we haven't built the Quartz deploy yet.

- [ ] **Step 3: Verify via Claude Code**

In Claude Code: "Read `certs/cca-f/domain-1-agentic/_smoke-test.md` using obsidian-mcp."

Expected: content returned verbatim.

- [ ] **Step 4: Delete the smoke test**

```bash
git rm certs/cca-f/domain-1-agentic/_smoke-test.md
git commit -m "chore: remove Day 1 smoke-test artifact"
git push
```

**✅ End of Phase 1. Day 1 complete.**

---

## Phase 2 — Slash commands (~60 min)

### Task 2.1: Write `/capture` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\capture.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/capture.md
git commit -m "feat: add /capture slash command"
```

---

### Task 2.2: Write `/tutor` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\tutor.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
---
description: Deep interactive tutoring session — Socratic/scenario/lecture modes. At session end, files valuable Q&A back as wiki pages (Karpathy compound-knowledge loop).
argument-hint: <cert-id> <domain-id> <topic> [--socratic|--lecture|--scenario]
---

# /tutor — interactive tutoring session

**Arguments:** `<cert-id>` `<domain-id>` `<topic>` `[--mode]`

Modes:
- `--scenario` (default) — I present design scenarios, you work through them, I critique. Matches CCA-F exam format.
- `--socratic` — I ask guiding questions, probe deeper, move on when understanding is solid. You can say "give me the answer" to break out.
- `--lecture` — I explain the topic with examples, you take notes. Minimal back-and-forth. Use when you're fuzzy on fundamentals.

## What to do

1. Parse `$ARGUMENTS`. Require at least `<cert-id> <domain-id> <topic>`; default mode to `--scenario` if not specified.
2. Load context via `obsidian-mcp`:
   - `CLAUDE.md`
   - `certs/<cert-id>/meta.yaml`
   - All files under `certs/<cert-id>/<domain-id>/`
   - Any `concepts/*/*.md` referenced in those files' frontmatter `links:`
   - (On Max plan, load generously — context is not a constraint.)
3. Announce the session:
   ```
   📚 Tutor session — <cert-name> · Domain: <domain-name> · Topic: <topic> · Mode: <mode>
   Loaded N notes and M concept files. Let's begin.
   ```
4. Enter mode-specific tutor loop:
   - **Scenario mode:** Present a CCA-F-style scenario (2-4 sentences setting a realistic problem). Offer 4 choices (A-D) OR an open-ended design-response prompt. Wait. When user answers, critique:
     - If multiple-choice: correct / incorrect + detailed explanation citing vault source files
     - If design-response: 3-6 sentence feedback, identify missing considerations, reference vault notes
     Then move to next scenario. 5-10 scenarios per session.
   - **Socratic mode:** Ask one probing question. Wait. Respond to user's answer with a deeper/follow-up question OR transition if understanding is strong. Note confusions as they arise. Do NOT give answers until explicitly asked.
   - **Lecture mode:** Structured explanation with headings, concrete Claude/MCP examples. Pause every 2-3 paragraphs and ask "checking in — does this make sense? Want me to go deeper on anything?"
5. Throughout the session, log gaps to `certs/<cert-id>/<domain-id>/_gaps.md`:
   - When user says "I don't know X", append to `_gaps.md`: `- [ ] X (from <date> tutor session on <topic>)`
   - When the user's vault has no note on a concept that came up, log: `- [ ] Missing note: <concept-name>`
6. **Compound-knowledge loop (Karpathy pattern) — at session end:**
   - Identify the 1-3 most valuable Q&A exchanges (e.g., a question that revealed a non-obvious pattern, a user insight worth preserving).
   - For each: propose a concrete filing action:
     - "Augment `certs/cca-f/domain-1-agentic/orchestration-patterns.md` with a new section titled X" (show diff)
     - OR "Create new concept note `concepts/agents/supervisor-pattern.md`" (show full content proposal)
     - OR "Add 2 more ```question``` blocks to `certs/cca-f/domain-1-agentic/orchestration-patterns.md`" (show proposed blocks)
   - User approves each independently (y/n/skip).
   - On approval: write the file(s). Update `index.md` for any new notes. Log what was filed: "✓ Filed back 3 compound-knowledge items."
7. Session end message:
   ```
   📊 Session summary:
   - <N> scenarios/questions covered
   - <G> gaps logged to _gaps.md
   - <C> compound-knowledge items filed back (of <P> proposed)
   - Next recommended: [topic] in [domain-id]
   ```

## Invariants

- Always cite vault filenames when drawing on stored content ("from your note on X at path Y...").
- Never modify the vault mid-session except for `_gaps.md` appends. All other writes happen at session end with per-item approval.
- Never fabricate facts about Claude's capabilities — if unsure, say "I'm not sure — this is worth verifying against Anthropic docs in `raw/anthropic-docs/`."

## Usage examples

```
/tutor cca-f domain-1-agentic "orchestration patterns"
/tutor cca-f domain-3-prompt-engineering "XML output contracts" --socratic
/tutor cca-f domain-4-mcp "tool schema design" --lecture
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/tutor.md
git commit -m "feat: add /tutor slash command with compound-knowledge loop"
```

---

### Task 2.3: Write `/quiz` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\quiz.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
---
description: Short conversational quiz with immediate feedback and save-to-weakness-queue. 5-20 questions.
argument-hint: <cert-id> <domain-id> [<topic>] [--count N]
---

# /quiz — short quiz with immediate feedback

**Arguments:** `<cert-id>` `<domain-id>` `[<topic>]` `[--count N]`

Default count: 10. Topic is optional (if absent, quiz the whole domain).

## What to do

1. Parse `$ARGUMENTS`. Require `<cert-id>` and `<domain-id>`. Parse optional `<topic>` and `--count N` (default 10).
2. Load via `obsidian-mcp`: `CLAUDE.md`, `certs/<cert-id>/meta.yaml`, all files under `certs/<cert-id>/<domain-id>/`.
3. Generate N questions grounded in the loaded notes. Mix:
   - Multiple-choice (4 options)
   - "Which of these is WRONG?" negatives
   - Short-answer (user types a phrase or pattern name)
4. Present questions one at a time. Use this format for MCQs:
   ```
   Q<n>/<N>: <question text>

   A) <option>
   B) <option>
   C) <option>
   D) <option>
   ```
5. Wait for user answer.
6. Give immediate verdict in this format:
   ```
   ✓ Correct!  (or ✗ Incorrect — answer was <letter>)

   Explanation: <2-4 sentences referencing the vault note that grounds this>
   Source note: <path/to/file.md>
   ```
7. **On every incorrect answer, prompt:**
   ```
   Save to weakness queue? [y/n/skip]
   ```
   If `y`: append to `certs/<cert-id>/weakness-queue.md` as a checkbox list item:
   ```markdown
   - [ ] **[<domain-id>]** <question stem>
     - Your answer: <letter> (<option text>) — wrong
     - Correct: <letter> (<option text>)
     - Explanation: <2-3 sentences>
     - Saved: <YYYY-MM-DD>
     - Source: <path to note>
   ```
8. After all N questions, write a session summary:
   ```
   📊 Quiz summary — <cert>/<domain> · <topic if any>
   - <correct>/<N> correct (<pct>%)
   - <saved> questions saved to weakness queue
   - Weakest sub-topic: <if detectable>
   ```

## Invariants

- Every question grounded in a specific note (cite it in the explanation).
- Weakness-queue format is plain markdown checkboxes; `/quiz --review-weak` grep-parses unchecked items and re-drills them.
- Never modify notes themselves from `/quiz` (only the weakness queue).

## Usage examples

```
/quiz cca-f domain-1-agentic
/quiz cca-f domain-4-mcp "tool schema design"
/quiz cca-f domain-2-claude-code --count 5
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/quiz.md
git commit -m "feat: add /quiz slash command with weakness-queue flow"
```

---

### Task 2.4: Write `/mock-exam` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\mock-exam.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
---
description: Full-length mock exam. Study mode (default) = per-question feedback + save-to-weakness-queue. Simulation mode (--sim) = timed, end-scored.
argument-hint: <cert-id> [--sim] [--count N]
---

# /mock-exam — full-length mock exam

**Arguments:** `<cert-id>` `[--sim]` `[--count N]`

Defaults:
- Mode: study (per-question feedback, no timer)
- Count: `meta.yaml`'s `exam.question_count` (60 for CCA-F)
- With `--sim`: timer = `meta.yaml`'s `exam.time_limit_minutes`, no feedback during

## What to do

1. Parse `$ARGUMENTS`. Require `<cert-id>`. Parse `--sim` flag, `--count N` override.
2. Load via `obsidian-mcp`: `CLAUDE.md`, `certs/<cert-id>/meta.yaml`, ALL files under `certs/<cert-id>/domain-*/` (full domain coverage), and referenced `concepts/*`.
3. Compute per-domain question distribution using `meta.yaml` weights × N. Round to integers so the sum equals N. For CCA-F default N=60:
   - Domain 1 (0.27): 16
   - Domain 2 (0.20): 12
   - Domain 3 (0.20): 12
   - Domain 4 (0.18): 11
   - Domain 5 (0.15): 9
   - Total: 60 ✓
4. Generate question bank: for each domain, pull N_domain scenario-based MCQs grounded in the vault notes for that domain. Format as `exam.format` from meta.yaml.
5. **Study mode (default):**
   - For each question:
     - Present `Q<n>/<N> [Domain: <name>]: <scenario>` + options A-D.
     - Wait for answer.
     - Immediate verdict + explanation + source citation (same format as `/quiz`).
     - On wrong answer: prompt "Save to weakness queue? [y/n/skip]".
   - No timer.
   - Generate session report (see §6 below) and write to `certs/<cert-id>/mock-exams/<YYYY-MM-DD>-study.md` (append `-NN` if multiple on the same day).
6. **Simulation mode (`--sim`):**
   - Announce: "Simulation mode. You have <T> minutes. No feedback until the end. Good luck."
   - Start timer (internal; report elapsed at end).
   - Present all questions sequentially. Just collect answers.
   - At end: score, breakdown, explanations for all answers, report saved to `certs/<cert-id>/mock-exams/<YYYY-MM-DD>-sim.md`.
7. **Session report format** (YAML frontmatter + markdown body):
   ```markdown
   ---
   cert: <cert-id>
   mode: study | sim
   date: <ISO-8601 UTC>
   score: <int>           # number correct
   total: <int>           # N
   passing_score: <int>   # scaled to meta.yaml's scale_max; for study mode use pct × scale_max
   pass: true | false
   time_elapsed_seconds: <int>
   time_limit_seconds: <int>   # null for study mode
   per_domain_scores:
     domain-1-agentic: { correct: 14, total: 16, pct: 87.5 }
     domain-2-claude-code: { correct: 10, total: 12, pct: 83.3 }
     # ... etc
   weak_spots:
     - "MCP tool schema edge cases"
     - "Context compaction thresholds"
   ---

   # Mock Exam Report — <date> (<mode> mode)

   **Score: <correct>/<total> (<pct>%) — <PASS|FAIL>** (need <passing_score> / <scale_max> = <pct_needed>%)

   ## Per-domain breakdown

   | Domain | Correct | Total | % | Status |
   |---|---:|---:|---:|:---:|
   | Agentic Architecture | 14 | 16 | 87.5% | 🟢 |
   ...

   ## Questions

   ### Q1 [Domain 1 — Agentic] (✓)

   **Scenario:** <full scenario text>

   **Your answer:** A
   **Correct:** A

   **Explanation:** <2-4 sentences>

   **Source:** `certs/cca-f/domain-1-agentic/orchestration-patterns.md`
   **Saved to weakness queue:** n/a (answer correct)

   ### Q2 [Domain 1 — Agentic] (✗)

   **Scenario:** ...
   **Your answer:** C
   **Correct:** B
   **Explanation:** ...
   **Source:** ...
   **Saved to weakness queue:** yes

   ... (repeat for all N)
   ```
8. Append any saved weakness entries to `certs/<cert-id>/weakness-queue.md` as checkbox items.
9. Update `index.md` — add a row for the mock-exam report file.

## Invariants

- Score scaling: for study mode, just use raw percentage. For `--sim`, compute `pct × scale_max` as the scaled score and compare to `passing_score`.
- `pass` field is authoritative — dashboard parses this exactly.
- Weak spots auto-derived: 2+ incorrect answers in the same sub-topic → weak spot entry.
- Never skip the report write, even on partial completion (user ctrl-C'd). Write what's there with an `incomplete: true` flag.

## Usage examples

```
/mock-exam cca-f                  # 60-question study mode, no timer
/mock-exam cca-f --sim             # 60-question, 120-min timer, end-scored
/mock-exam cca-f --count 20        # short study-mode warmup
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/mock-exam.md
git commit -m "feat: add /mock-exam slash command (study + sim modes)"
```

---

### Task 2.5: Write `/lint` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\lint.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
---
description: Karpathy-style health-check across the vault — contradictions, orphans, stale claims, missing cross-references, data gaps. Proposes fixes, waits for approval.
argument-hint: [<cert-id>|--all]
---

# /lint — vault health check

**Arguments:** `[<cert-id>|--all]` — scope of the lint. Default: `--all`.

## What to do

1. Parse `$ARGUMENTS`. Interpret missing arg as `--all`.
2. Load via `obsidian-mcp`:
   - `CLAUDE.md` (has the stale-terms list in "Stale-terms list" section)
   - `certs/*/meta.yaml` (all certs OR the one specified)
   - All `.md` files in scope:
     - `--all`: everything under `certs/`, `concepts/`, `prompts/`, `resources/`
     - `<cert-id>`: everything under `certs/<cert-id>/` plus `concepts/` (since concepts are referenced cross-cert)
3. Run 5 checks in order:

### Check 1 — Contradictions

For each factual claim in each note, look for semantically-similar claims in OTHER notes that differ materially. Focus on claims involving:
- Numeric specifics (context window sizes, token costs, question counts, model IDs)
- Definitions of named concepts
- Feature availability ("supported", "deprecated", "beta")

For each contradiction found, emit:
```
[CONTRADICTION] <topic>
  File A: <path-a>
    claim: "<quote>"
  File B: <path-b>
    claim: "<quote>"
  Which is correct? [show A / show B / skip / both wrong, research]
```

### Check 2 — Orphans

For every markdown file in scope (excluding `README.md`, `_lint/`, `dashboard.md`, `index.md`, `weakness-queue.md`, `_gaps.md`, `raw/**`):
- Count incoming wikilinks (files that link TO this one via `[[path]]` or markdown `[text](relative/path.md)`)
- Count outgoing wikilinks

If both are 0 → orphan. Emit:
```
[ORPHAN] <path>
  Note has no incoming or outgoing links.
  Options: [link from parent README / add links to referenced concepts / archive to _archive/ / skip]
```

### Check 3 — Stale claims

Parse the "Stale-terms list" section of `CLAUDE.md`. For each stale term, grep all in-scope notes.

If a stale term is mentioned without a nearby (same-paragraph) "superseded by" or "deprecated" qualifier → emit:
```
[STALE] <path>:<line>
  Mentions: "<term>"
  Context: "<sentence>"
  Options: [add "(superseded by <newer>)" annotation / update to <newer> / skip]
```

### Check 4 — Missing cross-references

For each concept that appears in 3+ cert-domain notes (detect by simple noun-phrase frequency: capitalized multi-word terms or common AI terms like "retrieval-augmented generation"), check if a note exists in `concepts/*/` whose filename matches (slugified).

If 3+ mentions but no concept note → emit:
```
[MISSING-CONCEPT] "<concept>"
  Mentioned in:
    - <path-1>
    - <path-2>
    - <path-3>+
  Options: [create stub concepts/<category>/<slug>.md / skip]
```

### Check 5 — Data gaps

For each cert with in-scope notes:
- Expected notes per domain ∝ domain weight. Rule of thumb: aim for ≥1 note per 5% of exam weight. So Domain 1 (27%) should have ≥5 notes, Domain 5 (15%) ≥3 notes.
- For each domain below its expected count, emit:
```
[GAP] certs/<cert>/<domain>/
  Weight: <N>% · Notes: <actual> · Recommended minimum: <expected>
  Suggested next topics (from meta.yaml resources if available):
    - <topic>
    - <topic>
  Options: [schedule capture session / skip for now]
```

4. Write all findings to `_lint/<YYYY-MM-DD>-report.md`:
   ```markdown
   ---
   date: <ISO-8601>
   scope: <cert-id or all>
   counts:
     contradictions: <N>
     orphans: <N>
     stale: <N>
     missing_concepts: <N>
     gaps: <N>
   ---

   # Lint Report — <date> (<scope>)

   ## Contradictions
   ...
   ## Orphans
   ...
   (etc.)
   ```

5. Walk user through each finding IN-SESSION:
   - Present the finding
   - Show the proposed fix
   - Wait for `y/n/skip` input
   - On `y`: apply the fix immediately (edit file, create stub, etc.)
   - On `n`: skip; record in report as "declined"
   - On `skip`: defer; record as "deferred"

6. After all findings processed, regenerate `index.md`:
   - Walk all `.md` files under `certs/*/domain-*/` and `concepts/`
   - For each: read frontmatter (or first non-frontmatter sentence as summary fallback)
   - Rewrite `index.md` with sorted rows + `_Last updated:_` header set to now
   - Also: if `index.md` is missing or last-updated is >7 days old → force regen regardless of whether this lint made changes

7. Final session output:
   ```
   ✓ Lint complete — <scope>
   Report: _lint/<date>-report.md
   Actions: <accepted> applied, <declined> declined, <deferred> deferred
   Index regenerated: <yes|no>
   ```

## Invariants

- **Never silently modify the vault.** Every fix is shown + approved before write.
- Always write the full report to `_lint/` even if user skips everything — it's the evidence of what was checked.
- `index.md` regeneration: after a lint that modified any file, OR on a forced cadence (`index.md` missing or older than 7 days).

## Usage examples

```
/lint                  # default: --all
/lint cca-f            # scope to one cert
/lint --all            # explicit
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/lint.md
git commit -m "feat: add /lint slash command (Karpathy health-check)"
```

---

### Task 2.6: Write `/ingest-url` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\ingest-url.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/ingest-url.md
git commit -m "feat: add /ingest-url slash command (URL → raw/ + /capture flow)"
```

---

### Task 2.7: Write `/seed-urls` command

**Files:**
- Create: `c:\projects\ai-kb\.claude\commands\seed-urls.md`

- [ ] **Step 1: Write the command**

Content:
````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/seed-urls.md
git commit -m "feat: add /seed-urls slash command (bulk URL ingestion)"
```

---

### Task 2.8: Verify all 7 commands loaded

**Files:** (none — verification)

- [ ] **Step 1: In Claude Code, list available commands**

Type `/` in Claude Code. Expected: `/capture`, `/ingest-url`, `/seed-urls`, `/tutor`, `/quiz`, `/mock-exam`, `/lint` all appear in the autocomplete list.

- [ ] **Step 2: Open one command to verify it parses**

Type `/capture` and press Enter (without args). Expected: Claude responds with the usage message parsed from the command file, not an error.

- [ ] **Step 3: Push all command additions**

```bash
git push
```

**✅ End of Phase 2.**

---

## Phase 3 — SRS removed (retained as a note, no tasks)

**2026-04-18 decision:** no Anki / Yanki / AnkiConnect / AnkiWeb / AnkiDroid. Retention is handled by `/quiz --review-weak` against `weakness-queue.md` (plain markdown checkboxes). SRS can be re-added post-exam in ~30 min without plan rework. No tasks in this phase.

---

## Phase S — Seed content from official + community sources (~45 min, mostly automated)

**Goal:** populate the vault with exam-ready study material sourced from (a) the official Anthropic exam guide PDF, (b) three claudecertifications.com reference pages (domains / scenarios / anti-patterns), (c) 5 per-domain cheat sheets from claudecertificationguide.com, and (d) the full CertSafari 363-question practice bank. After Phase S, every domain has: subdomain checklist, cheat sheet, anti-patterns, exam scenarios, official sample questions, and ~60-86 CertSafari practice questions — all as structured `` ```question `` blocks where applicable, all persisted in the vault.

**Executes unattended** (minus one env var export for CertSafari user-id).

### Task S.1: Extract official exam guide (~15 min)

**Files:**
- Read: cached PDF at `C:\Users\D\.claude\projects\c--projects-ai-kb\<session-dir>\tool-results\webfetch-*.pdf` (if still present) OR fetch fresh from the S3 URL below
- Create: `raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md` (immutable)
- Create: `certs/cca-f/_exam-guide-extract.md` (structured summary)
- Modify: 5 × `certs/cca-f/domain-*/README.md` (add subdomain checklist from official guide)
- Create: 5 × `certs/cca-f/domain-*/official-sample-questions.md` (the 12 sample questions split by domain)

- [ ] **Step 1: Obtain the PDF**

```bash
mkdir -p raw/anthropic-docs
# Try local cache first (already extracted during planning)
if [ -f c:/projects/ai-kb/.scratch/exam-guide.txt ]; then
  cp c:/projects/ai-kb/.scratch/exam-guide.txt raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
else
  curl -L "https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf" -o raw/anthropic-docs/2026-04-18-cca-f-exam-guide.pdf
  pdftotext -layout raw/anthropic-docs/2026-04-18-cca-f-exam-guide.pdf raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
fi
wc -l raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

Expected: ≥1500 lines of plain-text markdown.

- [ ] **Step 2: Have Claude read the extracted exam guide and produce derived notes**

A Claude subagent reads the raw extracted text and produces structured outputs:

Subagent prompt (fresh subagent with narrow context):
> Read `raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`. Produce:
> 1. `certs/cca-f/_exam-guide-extract.md` — a 1-page structured summary with sections: "Intro + target candidate", "5 domains at a glance (table)", "Sample questions (cross-referenced by id)", "Recommended study resources", "Exam logistics".
> 2. For each of the 5 domains, update `certs/cca-f/domain-*/README.md` to include the complete subdomain checklist from the official guide. Preserve the existing domain weight + purpose; add a new `## Subdomains (from official exam guide)` section listing every subdomain with its Knowledge/Skills bullets verbatim from the guide.
> 3. Extract the 12 sample questions from the exam guide (they are in the "Sample Questions" section). For each, determine which domain it belongs to (scan the "Domains reinforced" line or question content). Write to `certs/cca-f/<domain-id>/official-sample-questions.md` as structured ```question blocks with id of the form `official-<domain-id>-<NN>`, difficulty `medium` (official samples lean medium-to-hard), and explanation copied verbatim from the guide.
>
> Invariants: use exact subdomain text from the guide (not paraphrased). Cite source-note as `raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md` in every question block.

- [ ] **Step 3: Commit**

```bash
git add raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md certs/cca-f/_exam-guide-extract.md certs/cca-f/domain-*/README.md certs/cca-f/domain-*/official-sample-questions.md
git commit -m "feat(seed): extract official exam guide + 12 sample questions + subdomain checklists"
```

---

### Task S.2: Fetch claudecertifications.com + quick-reference cheat sheets (~15 min)

**Files:**
- Create: `raw/anthropic-docs/2026-04-18-domains-overview.md`
- Create: `raw/anthropic-docs/2026-04-18-scenarios-deep-dive.md`
- Create: `raw/anthropic-docs/2026-04-18-anti-patterns.md`
- Create: `raw/anthropic-docs/quick-ref-domain-{1..5}.md`
- Create: `certs/cca-f/_scenarios.md`
- Create: `certs/cca-f/_quick-reference.md`
- Create: 5 × `certs/cca-f/domain-*/anti-patterns.md`
- Create: 5 × `certs/cca-f/domain-*/scenarios.md`

- [ ] **Step 1: Fetch the 3 SPA reference pages via Playwright MCP**

Execute via a subagent with Playwright MCP access:

> For each URL below, navigate via `mcp__plugin_playwright_playwright__browser_navigate`, wait 2s, then `browser_evaluate` to get `document.querySelector('main').innerText`. Save the full text to the corresponding file path.
>
> - `https://claudecertifications.com/claude-certified-architect/domains` → `raw/anthropic-docs/2026-04-18-domains-overview.md`
> - `https://claudecertifications.com/claude-certified-architect/scenarios` → `raw/anthropic-docs/2026-04-18-scenarios-deep-dive.md`
> - `https://claudecertifications.com/claude-certified-architect/anti-patterns` → `raw/anthropic-docs/2026-04-18-anti-patterns.md`
>
> Close the browser when done.

- [ ] **Step 2: Fetch the 5 per-domain cheat sheets via WebFetch**

For each of 5 domains (the URL patterns are `claudecertificationguide.com/learn/<0N-topic>/quick-reference`):
- `01-agentic-architecture/quick-reference`
- `02-tool-design-mcp/quick-reference`
- `03-claude-code/quick-reference`
- `04-prompt-engineering/quick-reference`
- `05-context-reliability/quick-reference`

Use `WebFetch` with prompt "Extract the cheat-sheet content as markdown, preserving all bullet points, decision tables, and exam traps. Omit site navigation and footer."

Save each to `raw/anthropic-docs/quick-ref-domain-<N>.md`.

(If any URL 404s because the path is different, probe `claudecertificationguide.com/learn/` first to discover the correct pattern.)

- [ ] **Step 3: Synthesize per-domain anti-patterns + scenarios**

A subagent reads the 3 raw SPA extracts + official exam guide and produces:

> For each of 5 domains:
>   - Write `certs/cca-f/<domain-id>/anti-patterns.md` containing **only that domain's anti-patterns** from the anti-patterns page. Preserve priority labels (CRITICAL / HIGH / MEDIUM). Format each as: H3 heading with priority tag, "Why wrong" section, "Correct approach" section, "Why correct works" section. Add a source-note `raw/anthropic-docs/2026-04-18-anti-patterns.md`.
>   - Write `certs/cca-f/<domain-id>/scenarios.md` containing exam scenarios that touch this domain (each scenario touches multiple domains per its "Domains tested" line). For each applicable scenario: scenario title, key architectural decisions as CORRECT/ANTI-PATTERN pairs, this domain's specific angle, exam strategy note. Source-note: `raw/anthropic-docs/2026-04-18-scenarios-deep-dive.md`.
>
> Also write `certs/cca-f/_scenarios.md` — the unified deep-dive view of all 6 scenarios with their CORRECT/ANTI pairs and "domains tested" cross-references.
>
> Also write `certs/cca-f/_quick-reference.md` — a single consolidated cheat sheet synthesizing the 5 domain cheat sheets + the domains overview page. Organize by domain, keep only decision rules and exam traps (omit padding).

- [ ] **Step 4: Commit**

```bash
git add raw/anthropic-docs/ certs/cca-f/_scenarios.md certs/cca-f/_quick-reference.md certs/cca-f/domain-*/anti-patterns.md certs/cca-f/domain-*/scenarios.md
git commit -m "feat(seed): anti-patterns + scenarios + cheat sheets from claudecertifications.com"
```

---

### Task S.3: Extract 363 CertSafari practice questions (~10 min, includes API wait time)

**Files:**
- Create: `scripts/extract-certsafari.mjs`
- Create: `raw/certsafari/cca-f-questions.json` (immutable archive)
- Create: 5 × `certs/cca-f/domain-*/certsafari-questions.md` (structured ```question blocks)

- [ ] **Step 1: Write the extractor script**

Create `scripts/extract-certsafari.mjs`:

```javascript
// scripts/extract-certsafari.mjs
// Extracts all ~363 CertSafari questions for the Claude Certified Architect
// exam by creating one quiz per domain and iterating /api/questions.
//
// API (discovered by network inspection, 2026-04-18):
//   POST https://www.certsafari.com/api/create-quiz
//     body: { certificate, vendor, n_questions, user_id, mode, domain }
//     returns: { data: { quiz: { id, question_ids }, first_question: {...} } }
//   POST https://www.certsafari.com/api/questions
//     body: { quiz_id }
//     returns: { data: [question_obj] }   // returns next question in the quiz
//
// Invariants:
// - 500ms pacing between /api/questions calls to avoid per-minute rate limit.
// - Uses provided user-id; doesn't pollute the user's real quiz history in any unsafe way.
// - Writes immutable raw JSON + per-domain markdown with ```question blocks.

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER_ID = process.env.CERTSAFARI_USER_ID || process.argv[2];
if (!USER_ID) {
  console.error('Usage: CERTSAFARI_USER_ID=<uid> node extract-certsafari.mjs');
  console.error('  OR:  node extract-certsafari.mjs <uid>');
  process.exit(1);
}

const BASE = 'https://www.certsafari.com';
const DOMAINS = [
  { name: 'Domain 1: Agentic Architecture & Orchestration', count: 86, id: 'domain-1-agentic' },
  { name: 'Domain 2: Tool Design & MCP Integration',         count: 60, id: 'domain-2-mcp' },
  { name: 'Domain 3: Claude Code Configuration & Workflows', count: 73, id: 'domain-3-claude-code' },
  { name: 'Domain 4: Prompt Engineering & Structured Output', count: 72, id: 'domain-4-prompt-engineering' },
  { name: 'Domain 5: Context Management & Reliability',      count: 72, id: 'domain-5-context' },
];
const PACING_MS = 500;
const COOLDOWN_MS = 2000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function createQuiz(domain, count) {
  const res = await fetch(`${BASE}/api/create-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      certificate: 'claude-certified-architect',
      vendor: 'anthropic',
      n_questions: Math.min(count, 100),
      user_id: USER_ID,
      mode: 'exam',
      domain,
    }),
  });
  if (!res.ok) throw new Error(`create-quiz failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function getNextQuestion(quizId) {
  const res = await fetch(`${BASE}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  if (!res.ok) throw new Error(`questions failed (${res.status})`);
  return res.json();
}

async function extractDomain(d) {
  console.log(`\n→ ${d.name}: target=${d.count}`);
  const createJson = await createQuiz(d.name, d.count);
  if (!createJson.data?.quiz) throw new Error(`no quiz in response: ${JSON.stringify(createJson).slice(0, 200)}`);
  const quizId = createJson.data.quiz.id;
  const expectedIds = new Set(createJson.data.quiz.question_ids || []);
  const collected = new Map();
  if (createJson.data.first_question) collected.set(createJson.data.first_question.id, createJson.data.first_question);
  let stalls = 0;
  let attempts = 0;
  const maxAttempts = expectedIds.size * 3 + 10;
  while (collected.size < expectedIds.size && stalls < 5 && attempts < maxAttempts) {
    attempts++;
    await sleep(PACING_MS);
    try {
      const qj = await getNextQuestion(quizId);
      const q = qj.data?.[0];
      if (q && !collected.has(q.id)) {
        collected.set(q.id, q);
        stalls = 0;
      } else {
        stalls++;
      }
      process.stdout.write(`  ${collected.size}/${expectedIds.size} (attempts: ${attempts})\r`);
    } catch (e) {
      console.error(`\n  ${e.message} — backing off 2s`);
      stalls++;
      await sleep(2000);
    }
  }
  console.log(`\n  ✓ ${collected.size}/${expectedIds.size} collected in ${attempts} attempts`);
  return Array.from(collected.values()).map(q => ({ ...q, _domain_slug: d.id }));
}

function toQuestionBlock(q, index, domainSlug) {
  const correctLetter = (q.correct_answers?.[0] ?? 'A');
  const optsLines = ['A', 'B', 'C', 'D'].map((l, idx) => `  ${l}: ${JSON.stringify(q.options[idx] || '')}`).join('\n');
  const explParts = (q.explanations || [])
    .map(e => `  ${e.option}: ${e.explanation.replace(/\n/g, ' ')}`)
    .join('\n');
  const explanation = explParts || 'See CertSafari.';
  const stemIndented = q.question.split('\n').map(l => `  ${l}`).join('\n');
  const explIndented = explanation.split('\n').map(l => `  ${l}`).join('\n');
  return [
    '```question',
    `id: certsafari-${domainSlug}-${String(index + 1).padStart(3, '0')}`,
    `domain: ${domainSlug}`,
    `difficulty: medium`,
    `stem: |`,
    stemIndented,
    `options:`,
    optsLines,
    `correct: ${correctLetter}`,
    `explanation: |`,
    explIndented,
    `source-note: raw/certsafari/cca-f-questions.json (certsafari_id=${q.id})`,
    '```',
    '',
  ].join('\n');
}

async function main() {
  const scriptDir = fileURLToPath(new URL('.', import.meta.url));
  const vault = resolve(scriptDir, '..');

  const all = [];
  for (const d of DOMAINS) {
    try {
      const qs = await extractDomain(d);
      all.push(...qs);
    } catch (e) {
      console.error(`Domain ${d.id} failed: ${e.message}`);
    }
    await sleep(COOLDOWN_MS);
  }

  const rawPath = join(vault, 'raw', 'certsafari', 'cca-f-questions.json');
  await mkdir(dirname(rawPath), { recursive: true });
  await writeFile(rawPath, JSON.stringify({
    extracted_at: new Date().toISOString(),
    source: 'https://www.certsafari.com/anthropic/claude-certified-architect',
    certificate: 'claude-certified-architect',
    vendor: 'anthropic',
    total: all.length,
    questions: all,
  }, null, 2));
  console.log(`\n✓ Raw archive: ${rawPath} (${all.length} questions)`);

  for (const d of DOMAINS) {
    const qs = all.filter(q => q._domain_slug === d.id);
    if (!qs.length) continue;
    const header = [
      '---',
      'cert: cca-f',
      `domain: ${d.id}`,
      'status: done',
      'source: certsafari',
      'tags: [seeded, certsafari]',
      '---',
      '',
      `# CertSafari Practice Questions — ${d.name}`,
      '',
      `${qs.length} questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.`,
      '',
    ].join('\n');
    const body = qs.map((q, i) => toQuestionBlock(q, i, d.id)).join('\n');
    const mdPath = join(vault, 'certs', 'cca-f', d.id, 'certsafari-questions.md');
    await mkdir(dirname(mdPath), { recursive: true });
    await writeFile(mdPath, header + body);
    console.log(`✓ ${mdPath} (${qs.length} question blocks)`);
  }

  console.log(`\nDone. Total: ${all.length} questions.`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the extractor**

```bash
cd c:/projects/ai-kb
# Replace <your-uid> with your CertSafari user-id (set once in localStorage at certsafari.com)
CERTSAFARI_USER_ID=98d8e896-109d-454f-b5df-f28f49f5c240 node scripts/extract-certsafari.mjs
```

Expected: ~363 questions distributed across 5 domains. Progress prints live. Total wall time ~4-8 minutes depending on rate-limit pacing.

- [ ] **Step 3: Verify coverage**

```bash
node -e "const j=JSON.parse(require('fs').readFileSync('raw/certsafari/cca-f-questions.json','utf8')); console.log('total:', j.total); const counts={}; for (const q of j.questions) counts[q._domain_slug]=(counts[q._domain_slug]||0)+1; console.log(counts);"
```

Expected something like `total: 363 { 'domain-1-agentic': 86, 'domain-2-mcp': 60, 'domain-3-claude-code': 73, 'domain-4-prompt-engineering': 72, 'domain-5-context': 72 }` (or close; some domains may be 1-3 short if rate-limiting stalled).

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-certsafari.mjs raw/certsafari/ certs/cca-f/domain-*/certsafari-questions.md
git commit -m "feat(seed): extract 363 CertSafari questions + structured ${JSON.stringify('question')} blocks per domain"
```

---

### Task S.4: Author `_docs-map.yaml` for on-demand docs fetching (~5 min)

**Files:**
- Create: `certs/cca-f/_docs-map.yaml`
- Modify: `.claude/commands/tutor.md` (reference the map)
- Modify: `.claude/commands/quiz.md` (reference the map)

- [ ] **Step 1: Write the docs map**

Create `certs/cca-f/_docs-map.yaml`:

```yaml
# Per-domain Anthropic documentation URLs for /tutor and /quiz to consult on-demand via WebFetch.
# Not pre-ingested into the vault (docs update frequently; always fetch fresh).

cert_id: cca-f

domains:
  domain-1-agentic:
    - title: Agent SDK overview
      url: https://docs.anthropic.com/en/docs/build-with-claude/agents
    - title: Claude Managed Agents
      url: https://docs.anthropic.com/en/docs/managed-agents/overview
    - title: Tool use (agentic loop control)
      url: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
    - title: Messages API (stop_reason)
      url: https://docs.anthropic.com/en/api/messages

  domain-2-mcp:
    - title: MCP architecture
      url: https://modelcontextprotocol.io/docs/concepts/architecture
    - title: MCP tools
      url: https://modelcontextprotocol.io/docs/concepts/tools
    - title: Tool use + tool_choice
      url: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
    - title: Claude Code MCP integration
      url: https://docs.anthropic.com/en/docs/claude-code/mcp

  domain-3-claude-code:
    - title: Claude Code overview
      url: https://docs.anthropic.com/en/docs/claude-code/overview
    - title: Settings + CLAUDE.md hierarchy
      url: https://docs.anthropic.com/en/docs/claude-code/settings
    - title: Slash commands
      url: https://docs.anthropic.com/en/docs/claude-code/slash-commands
    - title: Hooks
      url: https://docs.anthropic.com/en/docs/claude-code/hooks
    - title: Skills + plan mode
      url: https://docs.anthropic.com/en/docs/claude-code/skills

  domain-4-prompt-engineering:
    - title: Prompt engineering overview
      url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
    - title: Use XML tags
      url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags
    - title: Few-shot examples
      url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting
    - title: Structured output / JSON mode
      url: https://docs.anthropic.com/en/docs/build-with-claude/tool-use

  domain-5-context:
    - title: Context windows
      url: https://docs.anthropic.com/en/docs/build-with-claude/context-windows
    - title: Prompt caching
      url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
    - title: Handling stop reasons
      url: https://docs.anthropic.com/en/docs/build-with-claude/working-with-messages
```

- [ ] **Step 2: Amend `/tutor.md` and `/quiz.md` to consult the map**

In `.claude/commands/tutor.md`, append to the "What to do" flow (step 2 area — context loading):

```markdown
2a. Read `certs/<cert-id>/_docs-map.yaml` to identify relevant official Anthropic docs URLs for the requested domain. Use `WebFetch` to pull the top 2-3 most relevant URLs for this topic (judge relevance from title field + topic arg). Add them to the tutoring context.
```

Same edit in `.claude/commands/quiz.md`.

- [ ] **Step 3: Smoke test**

In Claude Code:
```
/tutor cca-f domain-4-prompt-engineering "XML tag structure"
```

Expected: Claude reads `_docs-map.yaml`, picks the "Use XML tags" URL, fetches it via WebFetch, uses the doc content in the tutoring session.

- [ ] **Step 4: Commit**

```bash
git add certs/cca-f/_docs-map.yaml .claude/commands/tutor.md .claude/commands/quiz.md
git commit -m "feat(seed): docs-map.yaml + tutor/quiz integration for on-demand Anthropic docs fetch"
```

---

### Phase S summary

After Phase S, you will have:
- **Raw archive layer** (8+ files): exam guide, 3 claudecertifications.com pages, 5 cheat sheets, CertSafari JSON
- **5 per-domain READMEs** with subdomain checklists
- **5 × anti-patterns.md** with priority-labeled patterns
- **5 × scenarios.md** with CORRECT/ANTI-PATTERN pairs
- **5 × official-sample-questions.md** (12 questions total from exam guide)
- **5 × certsafari-questions.md** (~363 questions total)
- **_exam-guide-extract.md, _scenarios.md, _quick-reference.md** at cert root
- **_docs-map.yaml** for on-demand docs fetching from /tutor and /quiz

Total question blocks in the vault: **~375** (12 official + 363 CertSafari).

> **⏸️ PHASE S COMPLETE — OPTIONAL USER VERIFICATION.** User can spot-check any of the generated files. Phase 4 can proceed either way.

---

## Phase 4 — Web publishing (~60 min)

### Task 4.1: Clone Quartz v4 + configure

**Files:**
- Create: `c:\projects\ai-kb\quartz\` (Quartz v4 repo as a subdir)
- Modify: `c:\projects\ai-kb\quartz\quartz.config.ts` (after clone)

- [ ] **Step 1: Clone Quartz v4**

Run (from vault root):
```bash
git clone https://github.com/jackyzha0/quartz.git quartz
cd quartz
npm install
```

Expected: Quartz installs with no critical errors.

- [ ] **Step 2: Remove Quartz's .git so it's vendored into our repo**

```bash
rm -rf quartz/.git
cd ..
```

- [ ] **Step 3: Configure Quartz to point at vault root as content**

Edit `quartz/quartz.config.ts`:

Find:
```ts
configuration: {
    pageTitle: "🪴 Quartz 4",
```

Replace with:
```ts
configuration: {
    pageTitle: "AI Cert KB",
```

Find the `ignorePatterns` array and add:
```ts
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      ".claude",
      "quartz",
      "scripts",
      "_lint",
      "raw",              // do NOT publish raw sources
      "node_modules",
      "docs/superpowers", // private planning docs
      "MEMORY.md",
      // "public/dungeon",  // RESERVED: post-exam Slay the Cert game
      //                     (uncomment when game lands; kept commented for now
      //                      so the folder can exist without blocking Quartz)
    ],
```

> **Post-exam hook:** when the Slay the Cert game is built, a Phaser app will be deployed at `public/dungeon/`. At that time, uncomment the `public/dungeon` line in `ignorePatterns` so Quartz's content indexer doesn't try to render the game's HTML/JS as markdown pages. See `docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md` §13 for the full hook list.

- [ ] **Step 4: Link vault root as Quartz content**

Quartz expects content in `quartz/content/`. Simplest: make a symlink (Windows requires admin or dev mode for symlinks) OR configure Quartz to read from the parent.

Use Quartz's `contentDir` config. In `quartz.config.ts`, find the `build` section and update:

```ts
  configuration: {
    // ... existing keys ...
  },
```

We'll use a different approach — configure the build command to read from vault root. Edit `quartz/package.json`, in the `scripts` section:

Find:
```json
    "quartz": "./quartz/bootstrap-cli.mjs",
```

And add after:
```json
    "build:vault": "./quartz/bootstrap-cli.mjs build --directory ../",
    "serve:vault": "./quartz/bootstrap-cli.mjs build --directory ../ --serve"
```

- [ ] **Step 5: Test build locally**

```bash
cd quartz
npm run serve:vault
```

Expected: local server at http://localhost:8080; browse to verify pages render with the vault's wikilinks working.

Press Ctrl+C to stop.

- [ ] **Step 6: Commit**

```bash
cd ..
git add quartz/
git commit -m "feat: vendor Quartz v4 and configure for vault content"
```

---

### Task 4.2: Write Quartz GitHub Pages deploy workflow

**Files:**
- Create: `c:\projects\ai-kb\.github\workflows\quartz-deploy.yml`

- [ ] **Step 1: Write workflow**

Content:
```yaml
name: Deploy Quartz site

on:
  push:
    branches: [main]
    paths-ignore:
      - 'dashboard.md'          # avoid loop with dashboard workflow
      - '_lint/**'
      - '.github/**'
      - 'docs/**'
      - 'raw/**'                # Quartz ignores these anyway
      - 'MEMORY.md'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Quartz deps
        working-directory: quartz
        run: npm ci

      - name: Build site
        working-directory: quartz
        run: npm run build:vault   # defined in quartz/package.json (Task 4.1 step 4)

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: quartz/public

  deploy:
    needs: build
    runs-on: ubuntu-22.04
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages**

Run:
```bash
gh api -X POST /repos/:owner/:repo/pages \
  -f source.branch=main \
  -f source.path=/ \
  --silent || \
gh api /repos/:owner/:repo/pages 2>/dev/null || \
echo "Enable Pages manually: gh repo view --web → Settings → Pages → Source: GitHub Actions"
```

OR, manually:
```bash
gh repo view --web
```

Then Settings → Pages → Source: "GitHub Actions".

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/quartz-deploy.yml
git commit -m "feat: GitHub Action for Quartz → Pages deployment"
git push
```

- [ ] **Step 4: Verify workflow ran and site is live**

Wait ~2 minutes. Then:
```bash
gh run list --workflow="Deploy Quartz site" --limit 1
gh run view  # pick the latest
```

Expected: workflow status "completed / success". Then visit the Pages URL (shown in `gh repo view --web` under Environments → github-pages).

- [ ] **Step 5: Test from incognito / different browser (simulating work laptop)**

Open the GitHub Pages URL in a private/incognito browser window. Verify:
- Vault content renders
- Wikilinks work
- Search works
- `raw/`, `.claude/`, `docs/superpowers/` are NOT visible

---

### Task 4.3: Enable Claude.ai GitHub connector

**Files:** (external account)

- [ ] **Step 1: Add connector**

Claude.ai → Settings → Connectors → Add connector → GitHub → authorize for the `ai-kb` repo.

- [ ] **Step 2: Verify from phone**

Open Claude app on phone. Start a new chat. Ask:
> "Using the GitHub connector, what are the 5 domains listed in `certs/cca-f/meta.yaml`?"

Expected: Claude reads the file from GitHub and returns the 5 domains with weights.

No commit.

---

## Phase 5 — Dashboard (~60 min, TDD for the Node script)

### Task 5.1: Write `scripts/dashboard.mjs` with vitest tests (TDD)

**Files:**
- Create: `c:\projects\ai-kb\scripts\package.json`
- Create: `c:\projects\ai-kb\scripts\dashboard.mjs`
- Create: `c:\projects\ai-kb\scripts\dashboard.test.mjs`
- Create (by `npm install`): `c:\projects\ai-kb\scripts\package-lock.json`

- [ ] **Step 1: Write `scripts/package.json`**

Content:
```json
{
  "name": "ai-kb-scripts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dashboard": "node dashboard.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "glob": "^10.3.10",
    "yaml": "^2.4.0"
  },
  "devDependencies": {
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: Install deps**

```bash
cd c:/projects/ai-kb/scripts
npm install
cd ..
```

Expected: `scripts/node_modules/` appears; `scripts/package-lock.json` is created.

- [ ] **Step 3: Write failing tests**

Create `scripts/dashboard.test.mjs`:
```javascript
import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  discoverCerts,
  countNotesInDomain,
  daysUntil,
  parseMockExam,
  sparkline,
} from './dashboard.mjs';

async function makeTempVault() {
  return mkdtemp(join(tmpdir(), 'ai-kb-test-'));
}

describe('dashboard', () => {
  it('discovers certs from meta.yaml files', async () => {
    const vault = await makeTempVault();
    const cert = join(vault, 'certs', 'cca-f');
    await mkdir(cert, { recursive: true });
    await writeFile(join(cert, 'meta.yaml'), `id: cca-f
name: Test Cert
provider: Anthropic
target_date: '2026-05-31'
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: mcq
  cost_usd: 99
domains:
  - { id: domain-1, name: D1, weight: 1.0 }
resources: []
`);
    const certs = await discoverCerts(vault);
    expect(certs).toHaveLength(1);
    expect(certs[0].id).toBe('cca-f');
  });

  it('counts notes per domain by frontmatter match', async () => {
    const vault = await makeTempVault();
    const d = join(vault, 'certs', 'cca-f', 'domain-1');
    await mkdir(d, { recursive: true });
    await writeFile(join(d, 'note1.md'), `---
cert: cca-f
domain: domain-1
status: done
---

Body`);
    await writeFile(join(d, 'note2.md'), `---
cert: cca-f
domain: domain-1
status: in-progress
---

Body`);
    // file without frontmatter should NOT be counted
    await writeFile(join(d, 'README.md'), '# README\nno frontmatter here');

    const count = await countNotesInDomain(vault, 'cca-f', 'domain-1');
    expect(count).toBe(2);
  });

  it('computes days until target', () => {
    // 2026-04-18 → 2026-05-31 = 43 days
    const days = daysUntil('2026-05-31', new Date(Date.UTC(2026, 3, 18)));
    expect(days).toBe(43);
  });

  it('parses mock exam frontmatter', async () => {
    const vault = await makeTempVault();
    const r = join(vault, 'report.md');
    await writeFile(r, `---
cert: cca-f
mode: study
date: 2026-04-18T10:00:00Z
score: 42
total: 60
pass: false
---

Body`);
    const info = await parseMockExam(r);
    expect(info.score).toBe(42);
    expect(info.total).toBe(60);
    expect(info.pass).toBe(false);
    expect(info.mode).toBe('study');
  });

  it('renders sparkline of correct visible length', () => {
    const s = sparkline([30, 50, 70]);
    // The spark chars are in the BMP; counting code points is safe via spread
    expect([...s]).toHaveLength(3);
  });
});
```

- [ ] **Step 4: Run tests — expect failure**

```bash
cd c:/projects/ai-kb/scripts
npm test
cd ..
```

Expected: all 5 tests fail with `ERR_MODULE_NOT_FOUND` or similar (because `dashboard.mjs` doesn't exist yet).

- [ ] **Step 5: Write `scripts/dashboard.mjs`**

Content:
```javascript
// scripts/dashboard.mjs
//
// Dashboard generator for the AI Cert KB.
//
// Reads meta.yaml files, walks certs/*/domain-* notes, parses mock-exam reports,
// and writes a dashboard.md at the vault root.
//
// Invariants:
// - Does NOT modify anything except dashboard.md.
// - Safe to run from either local CLI or GitHub Actions.
// - Output is deterministic; running twice in a row produces identical dashboard.md
//   (except for the _Last updated:_ timestamp in the footer, stripped for diff check).

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

// ---------- Cert discovery ----------

export async function discoverCerts(vaultRoot) {
  const files = await glob('certs/*/meta.yaml', { cwd: vaultRoot, posix: true });
  const out = [];
  for (const rel of files.sort()) {
    const dirName = rel.split('/')[1];
    if (dirName.startsWith('_')) continue; // skip _template
    try {
      const text = await readFile(join(vaultRoot, rel), 'utf-8');
      const data = parseYaml(text);
      if (data && typeof data === 'object' && 'id' in data) {
        out.push(data);
      }
    } catch {
      // malformed YAML — skip
    }
  }
  return out;
}

// ---------- Frontmatter parsing ----------

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

export function parseFrontmatter(text) {
  const m = text.match(FRONTMATTER_RE);
  if (!m) return null;
  try {
    const fm = parseYaml(m[1]);
    return fm && typeof fm === 'object' ? fm : null;
  } catch {
    return null;
  }
}

async function readFrontmatter(filePath) {
  try {
    const text = await readFile(filePath, 'utf-8');
    return parseFrontmatter(text);
  } catch {
    return null;
  }
}

// ---------- Note counting ----------

export async function countNotesInDomain(vaultRoot, certId, domainId) {
  const domainDir = join(vaultRoot, 'certs', certId, domainId);
  if (!existsSync(domainDir)) return 0;
  const files = await glob('**/*.md', { cwd: domainDir, nodir: true, posix: true });
  let count = 0;
  for (const rel of files) {
    const name = rel.split('/').pop();
    if (name.startsWith('_') || name === 'README.md') continue;
    const fm = await readFrontmatter(join(domainDir, rel));
    if (fm && fm.cert === certId && fm.domain === domainId) {
      count++;
    }
  }
  return count;
}

export async function countWeaknessQueueItems(vaultRoot, certId) {
  const queuePath = join(vaultRoot, 'certs', certId, 'weakness-queue.md');
  if (!existsSync(queuePath)) return { total: 0, unchecked: 0 };
  const text = await readFile(queuePath, 'utf-8');
  // Count checkbox list items; match `- [ ]` (unchecked) and `- [x]` (checked)
  const total = (text.match(/^- \[[ x]\]/gm) || []).length;
  const unchecked = (text.match(/^- \[ \]/gm) || []).length;
  return { total, unchecked };
}

// ---------- Mock exam parsing ----------

export async function parseMockExam(filePath) {
  const fm = await readFrontmatter(filePath);
  if (!fm) return {};
  return {
    score: fm.score,
    total: fm.total,
    pass: fm.pass,
    mode: fm.mode,
    date: fm.date,
  };
}

export async function findMockExams(vaultRoot, certId) {
  const dir = join(vaultRoot, 'certs', certId, 'mock-exams');
  if (!existsSync(dir)) return [];
  const files = await glob('*.md', { cwd: dir, nodir: true, posix: true });
  const out = [];
  for (const rel of files.sort()) {
    if (rel.startsWith('_')) continue;
    const info = await parseMockExam(join(dir, rel));
    if (info.score != null) {
      info.path = relative(vaultRoot, join(dir, rel)).split(/[\\/]/).join('/');
      out.push(info);
    }
  }
  return out;
}

// ---------- Countdown ----------

export function daysUntil(targetDateStr, today = new Date()) {
  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((target - todayUtc) / msPerDay);
}

// ---------- Presentation helpers ----------

const SPARK_CHARS = [...'▁▂▃▄▅▆▇█'];

export function sparkline(values) {
  if (!values.length) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const rng = hi - lo || 1;
  return values
    .map(v => {
      const idx = Math.min(
        SPARK_CHARS.length - 1,
        Math.floor(((v - lo) / rng) * (SPARK_CHARS.length - 1))
      );
      return SPARK_CHARS[idx];
    })
    .join('');
}

function statusIcon(pctOfExpected) {
  if (pctOfExpected >= 0.8) return '🟢';
  if (pctOfExpected >= 0.4) return '🟡';
  return '🔴';
}

// ---------- Rendering ----------

async function renderCertBlock(vaultRoot, cert) {
  const certId = cert.id;
  const name = cert.name;
  const target = cert.target_date || '';
  const days = target ? daysUntil(target) : null;

  const countdownLine = days != null
    ? `**${name}** — ${days} days to exam (target: ${target})`
    : `**${name}**`;

  const lines = [`## 🎯 ${countdownLine}`, '', '### Coverage vs. exam weight', ''];
  lines.push('| Domain | Weight | Notes | Cards | Status |');
  lines.push('|---|---:|---:|---:|:---:|');

  const weakness = await countWeaknessQueueItems(vaultRoot, certId);

  for (const d of cert.domains || []) {
    const weight = d.weight || 0;
    const expected = Math.max(1, Math.round(weight * 20));
    const actual = await countNotesInDomain(vaultRoot, certId, d.id);
    const icon = statusIcon(expected ? actual / expected : 1.0);
    lines.push(
      `| ${d.name} | ${Math.round(weight * 100)}% | ${actual} | — | ${icon} (${actual}/${expected} target) |`
    );
  }
  lines.push('');
  lines.push(`_Weakness queue for ${certId}: ${weakness.unchecked} unchecked / ${weakness.total} total_`);
  lines.push('');

  const exams = await findMockExams(vaultRoot, certId);
  if (exams.length) {
    lines.push('### Mock exam trend', '');
    for (const e of exams.slice(-5)) {
      const pct = e.total ? (e.score / e.total) * 100 : 0;
      const verdict = e.pass ? '🟢 PASS' : '🔴 FAIL';
      lines.push(`- ${e.date ?? '?'} · ${e.mode ?? '?'} · ${e.score}/${e.total} (${pct.toFixed(0)}%) · ${verdict}`);
    }
    const scores = exams.slice(-10).map(e => e.total ? (e.score / e.total) * 100 : 0);
    if (scores.length >= 2) {
      lines.push('', `Trend (last ${scores.length}): ${sparkline(scores)}`);
    }
    lines.push('');
  } else {
    lines.push('### Mock exam trend', '');
    lines.push(`_No mock exams yet. Run \`/mock-exam ${certId}\` to begin tracking._`);
    lines.push('');
  }

  return lines.join('\n');
}

export async function renderDashboard(vaultRoot, now = new Date()) {
  const certs = await discoverCerts(vaultRoot);
  const header = '# 📊 AI Cert KB Dashboard';
  const subheader = `_Last updated: ${now.toISOString()} (auto — do not edit by hand)_`;

  const blocks = certs.length
    ? await Promise.all(certs.map(c => renderCertBlock(vaultRoot, c)))
    : ['_No certs configured. Seed a `certs/<id>/meta.yaml` to begin._'];

  const footer = '\n---\n_Generated by `scripts/dashboard.mjs`. Invariants: never modifies any file except this one._';
  return [header, subheader, ...blocks].join('\n\n') + footer;
}

export async function writeDashboard(vaultRoot, outputPath = null) {
  outputPath = outputPath || join(vaultRoot, 'dashboard.md');
  const newContent = await renderDashboard(vaultRoot);

  const stripTs = (s) => s.split('\n').filter(l => !l.startsWith('_Last updated:')).join('\n');

  if (existsSync(outputPath)) {
    const old = await readFile(outputPath, 'utf-8');
    if (stripTs(old) === stripTs(newContent)) {
      return false;
    }
  }
  await writeFile(outputPath, newContent, 'utf-8');
  return true;
}

// ---------- Entrypoint ----------
// Only runs the CLI when this file is executed directly (not imported).
// Using resolve() to normalize paths makes this work on Windows + Unix.

const invokedAsMain =
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] || '');

if (invokedAsMain) {
  const scriptDir = fileURLToPath(new URL('.', import.meta.url));
  const defaultVault = resolve(scriptDir, '..');
  const vault = process.argv[2] || defaultVault;
  const changed = await writeDashboard(vault);
  console.log(`dashboard.md ${changed ? 'WRITTEN' : 'unchanged'}`);
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd c:/projects/ai-kb/scripts
npm test
cd ..
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Run dashboard against real vault**

```bash
node scripts/dashboard.mjs
```

Expected output: `dashboard.md WRITTEN`. A `dashboard.md` appears at vault root with CCA-F countdown (days until 2026-05-31), empty coverage, no mock exams.

- [ ] **Step 8: Commit**

```bash
git add scripts/package.json scripts/package-lock.json scripts/dashboard.mjs scripts/dashboard.test.mjs dashboard.md
git commit -m "feat: add dashboard.mjs (Node + vitest TDD), regenerate dashboard.md"
```

---

### Task 5.2: Write dashboard GitHub Action workflow with loop prevention

**Files:**
- Create: `c:\projects\ai-kb\.github\workflows\dashboard.yml`

- [ ] **Step 1: Write workflow**

Content:
```yaml
name: Regenerate dashboard.md

on:
  push:
    branches: [main]
    paths:
      # Only trigger when something that affects the dashboard changes.
      - 'certs/**/meta.yaml'
      - 'certs/**/domain-*/**.md'
      - 'certs/**/mock-exams/**.md'
      - 'certs/**/weakness-queue.md'
      - 'scripts/dashboard.mjs'
      - 'scripts/package.json'
      - 'scripts/package-lock.json'
      - '.github/workflows/dashboard.yml'
      # Explicitly DO NOT include: dashboard.md itself (loop prevention)
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-22.04
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: scripts/package-lock.json

      - name: Install deps
        working-directory: scripts
        run: npm ci

      - name: Regenerate dashboard
        run: node scripts/dashboard.mjs

      - name: Commit if changed
        run: |
          if [ -z "$(git status --porcelain dashboard.md)" ]; then
            echo "dashboard.md unchanged — nothing to commit."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add dashboard.md
          git commit -m "chore: regenerate dashboard.md [skip ci]"
          git push
```

**Loop prevention built in 3 ways (per spec §8.1):**
1. `paths:` filter excludes `dashboard.md` — pushing the bot's commit won't re-trigger
2. `[skip ci]` in the commit message — belt-and-braces for any path-filter edge cases
3. `if` guard on the job itself checks for `[skip ci]` in the parent commit message
4. Bonus: the `git status --porcelain` check exits early if there's no diff

> **Side effect to know about:** `[skip ci]` in the commit message is honored by GitHub Actions globally — so the `quartz-deploy.yml` workflow **also** skips on dashboard-only commits. This is intentional: a dashboard-only change doesn't require a full site rebuild (dashboard.md is part of the site, but it will be included in the next Quartz build when any other content changes). If you ever want to force a site rebuild, push any content change or run `gh workflow run "Deploy Quartz site"`.

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/dashboard.yml
git commit -m "feat: GitHub Action to regenerate dashboard.md with loop prevention"
git push
```

- [ ] **Step 3: Verify workflow runs and does NOT loop**

Wait ~2 minutes, then:
```bash
gh run list --workflow="Regenerate dashboard.md" --limit 3
```

Expected:
- First run: triggered by your push. Status: success. Check its output — may say "dashboard.md unchanged" (because we already committed it locally in Task 5.1) OR it commits with [skip ci].
- If it commits: check there is NO second run triggered by the bot's commit. Wait 3 more minutes, re-check `gh run list`. Only 1 run should exist.

- [ ] **Step 4: Force a dashboard regen as a final loop test**

Edit any note (e.g., add a line to `certs/cca-f/domain-1-agentic/README.md`), commit, push.

```bash
# after editing and pushing
gh run list --workflow="Regenerate dashboard.md" --limit 3
```

Expected: a new run (for your push). If it commits a dashboard change, verify **no third run** is triggered by the bot's commit. The path filter + `[skip ci]` prevent the loop.

**✅ End of Phase 5.**

---

## Phase 6 — End-to-end smoke tests (~30 min)

### Task 6.1: Run `/capture` with real content

**Files:** (creates new note under `certs/cca-f/domain-1-agentic/`)

- [ ] **Step 1: Prepare a sample Academy-like text**

Save the following as a local file `~/smoke-capture.txt` (NOT in the vault):
```
Agentic orchestration in Claude applications

Three canonical patterns for coordinating multiple Claude invocations:

1. Supervisor: a top-level agent delegates sub-tasks to specialized worker agents,
   collecting their outputs and reasoning across them. Best for tasks with clear
   decomposition into independent sub-problems.

2. Pipeline/Chain: outputs of one agent feed into the next. Best when each stage
   has a well-defined contract. Simpler to reason about than supervisor but less
   flexible.

3. Swarm: multiple agents operate in parallel with occasional synchronization
   points. Best for exploratory tasks where different approaches may all yield
   insights.

Key consideration: context budget per sub-agent. Supervisor pattern multiplies
context cost; swarm adds synchronization complexity.
```

- [ ] **Step 2: Run `/capture`**

In Claude Code:
```
/capture cca-f domain-1-agentic academy-orchestration-patterns
```

When prompted, paste the text. End with `---END---`.

- [ ] **Step 3: Verify output**

Expected:
- Claude proposes a slug (probably `academy-orchestration-patterns.md`)
- Frontmatter with cert, domain, status, source, tags (e.g., `[orchestration, agents, patterns]`)
- Body with 3 sections for the 3 patterns + a "Key considerations" section
- 3-5 flashcard candidates (e.g., "What is the Supervisor pattern?" → "Top-level agent delegates sub-tasks...")
- Asks for approval

Approve the note, approve 3+ flashcards.

- [ ] **Step 4: Check files created**

Run:
```bash
ls certs/cca-f/domain-1-agentic/
ls certs/cca-f/anki/
ls raw/academy/
cat index.md | tail -5
```

Expected:
- New note in domain-1-agentic/
- Flashcards file in anki/
- Raw text in raw/academy/
- Row added to index.md

- [ ] **Step 5: Commit via Obsidian Git or CLI**

(Obsidian Git should auto-commit within 60s. Or:)

```bash
git add .
git commit -m "feat(cca-f/domain-1): capture agentic orchestration patterns from Academy"
git push
```

---

### Task 6.2: Run `/tutor`

- [ ] **Step 1: Start session**

In Claude Code:
```
/tutor cca-f domain-1-agentic "orchestration patterns"
```

- [ ] **Step 2: Engage for 5-10 minutes**

Answer 3-5 scenarios or probing questions based on the note you just captured in Task 6.1.

- [ ] **Step 3: Let compound-knowledge propose filings**

At session end, Claude should propose 1-3 compound-knowledge items. Approve at least one — e.g., "augment orchestration-patterns.md with a new section on 'When to choose supervisor over pipeline'".

- [ ] **Step 4: Verify**

```bash
git status
```

Expected: modified files from the tutor session. `_gaps.md` may also have appeared.

Commit via Obsidian Git or CLI.

---

### Task 6.3: Run `/lint cca-f`

- [ ] **Step 1: Run**

In Claude Code:
```
/lint cca-f
```

- [ ] **Step 2: Expect findings**

At this stage (just 1-2 notes in Domain 1):
- Contradictions: 0 (expected)
- Orphans: maybe 1 (the new note has no outgoing wikilinks yet) — offer to add link to `concepts/agents/` stubs
- Stale: 0
- Missing-concepts: possibly 1 (e.g., "supervisor pattern" is mentioned, no concept note)
- Gaps: multiple (most domains empty)

- [ ] **Step 3: Apply 1-2 fixes**

Approve creating 1 concept stub (e.g., `concepts/agents/orchestration-patterns.md`). Skip the rest with `s` or decline with `n`.

- [ ] **Step 4: Verify report**

```bash
cat _lint/$(date +%Y-%m-%d)-report.md
ls concepts/agents/
cat index.md | head -20
```

Expected: report file present; new concept stub if you approved it; `index.md` regenerated with the additions.

---

### Task 6.4: Run `/quiz` on captured content

- [ ] **Step 1: Run**

```
/quiz cca-f domain-1-agentic --count 5
```

- [ ] **Step 2: Intentionally answer 1-2 wrong**

To test the weakness-queue flow. When prompted to save, answer `y`.

- [ ] **Step 3: Verify weakness queue populated**

```bash
cat certs/cca-f/weakness-queue.md
```

Expected: 1-2 unchecked checkbox items with the question, your wrong answer, the correct answer, an explanation, and a source-note path.

- [ ] **Step 4: Verify `/quiz --review-weak` picks them up**

```
/quiz cca-f --review-weak
```

Expected: Claude re-asks the saved question(s). On correct answer twice in a row, the item becomes checked (or removed — depending on spec choice during implementation).

---

### Task 6.5: Run short `/mock-exam` (study mode)

- [ ] **Step 1: Run**

```
/mock-exam cca-f --count 5
```

- [ ] **Step 2: Complete the 5 questions**

Per-question feedback mode.

- [ ] **Step 3: Verify report**

```bash
ls certs/cca-f/mock-exams/
cat certs/cca-f/mock-exams/$(date +%Y-%m-%d)-study.md | head -30
```

Expected: report file with YAML frontmatter (`score`, `total`, `mode: study`, etc.) + per-question sections.

- [ ] **Step 4: Verify dashboard picks it up**

Run locally:
```bash
node scripts/dashboard.mjs
cat dashboard.md | grep -A 5 "Mock exam trend"
```

Expected: the new mock exam appears in the trend.

---

### Task 6.6: Final commit + push + verify all workflows

- [ ] **Step 1: Commit everything**

```bash
git add .
git commit -m "chore: MVP smoke tests complete — vault populated with first real content"
git push
```

- [ ] **Step 2: Watch workflows**

```bash
gh run list --limit 5
```

Expected:
- Quartz deploy: running → success
- Dashboard: running → success (may commit [skip ci] update)
- Critically: no loop (no dashboard workflow re-triggered by its own commit)

- [ ] **Step 3: Visit public Pages URL from incognito browser**

Verify:
- New captured note is live
- Mock-exam report is live (or ignored per `ignorePatterns` if that's configured)
- Raw sources remain private (`raw/` returns 404)

- [ ] **Step 4: Verify mobile end-to-end**

From phone:
- Obsidian mobile shows the new note
- Anki app (after sync) shows 4+ cards in CCA-F deck
- Claude mobile can query the vault via GitHub connector

---

## Done — MVP complete

At this point:
- ✅ Vault foundation in place with Karpathy three-layer pattern
- ✅ 7 slash commands (`/capture`, `/ingest-url`, `/seed-urls`, `/tutor`, `/quiz`, `/mock-exam`, `/lint`) working
- ✅ SRS loop wired (Obsidian → Yanki → Anki → AnkiWeb → phone)
- ✅ Public browser view via Quartz + GitHub Pages
- ✅ Claude mobile access via GitHub connector
- ✅ Auto-generated dashboard with loop prevention
- ✅ First real content captured + first tutor/quiz/lint/mock-exam sessions completed

**Next (not in this plan):** Week 1 study — focus on Domain 1 (27%), daily `/capture` + SRS, weekly `/lint`, first full 60-question mock exam at week's end for baseline.

---

## Post-MVP enhancements (deferred, intentionally out of scope)

The following were considered and deferred:

- `log.md` append-only chronological log (demoted during Karpathy COVE — weak evidence in secondary sources)
- Dataview / Templater plugins (YAGNI — `index.md` + `/lint` cover the use cases)
- Quartz theme customization (post-exam)
- Mock-exam score-history chart (Quartz markdown component; post-exam)
- Stale-terms list expansion via `/lint` learning from user overrides (post-exam)
- `certs/cca-next/` seeding (wait for Anthropic to announce the Professional / FDE-track cert)

---

## Executing this plan

**If you have subagents available (Claude Code):**
Use `superpowers:subagent-driven-development`. Fresh subagent per task + two-stage review.

**If not:**
Use `superpowers:executing-plans`. Batch execution with checkpoints for review.

**Regardless:** after each phase, commit + push. Do not skip phases.
