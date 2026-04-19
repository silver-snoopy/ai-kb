# Personal AI Certification Knowledge Base — Design

**Date:** 2026-04-18
**Author:** User + Claude (brainstorming session)
**Status:** Draft pending user approval

---

## 1. Overview

### 1.1 Goal

Build a personal, durable, multi-device Knowledge Base (KB) that accelerates preparation for AI certification exams. First cert: **Claude Certified Architect — Foundations (CCA-F)**, exam deadline end of May 2026. After CCA-F, user will pivot to the **next Claude certification** (expected at Professional / Forward-Deployed-Engineer-track tier, not yet released by Anthropic at time of writing). User's career motivation is a Forward-Deployed-Engineer role. Architecture must be extensible to any future Claude certification *without redesign*, and also remain open to other providers' certs if that preference changes later.

### 1.2 Non-goals

- Not a note-taking app for general life notes (cert-adjacent only).
- Not a public teaching site for other users. Public hosting is only for personal access across devices.
- Not a replacement for Anthropic Academy or other official course material. The KB is a *processing layer* on top of official sources.
- No calendar/scheduling integration (out of scope for MVP; can be added later).

### 1.3 Success criteria

The KB is successful if, by mid-May 2026:

1. User can capture a note on any device (desktop, mobile, browser) in <60 seconds.
2. User can reach any note in ≤3 clicks/taps on the slowest device (locked-down work laptop browser).
3. User can invoke `/quiz`, `/tutor`, `/mock-exam`, `/capture` slash commands from Claude Code targeting any cert in the vault.
4. Anki card queue reflects vault content automatically (Yanki sync working).
5. A dashboard markdown file auto-regenerates on every git push and shows: days-until-exam, domain coverage, mock-exam trend, weak-spot highlights.
6. Adding a second cert (future Claude cert / any provider) requires only: copy `certs/_template/`, fill `meta.yaml`. Zero tooling changes.
7. `/lint --all` runs across the vault and produces a health-check report; after user-approved fixes, the vault has zero contradictions, zero orphan pages, and complete cross-reference coverage (or explicitly-acknowledged exceptions).
8. `index.md` auto-updates on every `/capture` invocation and after every `/lint`, reflecting every note in `certs/` and `concepts/` with a one-line summary.

### 1.4 Verified exam context (primary cert)

Claude Certified Architect — Foundations (CCA-F):

- 60 scenario-based multiple-choice questions, 120 minutes, pass = 720/1000
- **Five domains with weights** (drive study-time allocation and mock-exam distribution):
  - Agentic Architecture & Orchestration — 27%
  - Claude Code Configuration & Workflows — 20%
  - Prompt Engineering & Structured Output — 20%
  - Tool Design & MCP Integration — 18%
  - Context Management & Reliability — 15%
- Cost: $99/attempt; free for first 5,000 Claude Partner Network **employees of member organizations** (the benefit is organizational, not individual — user's employer must already be in the Partner Network, which requires demonstrated Claude expertise + 1–2 week application review + 60-day onboarding; an individual cannot self-enroll for the discount)
- Primary official prep: **Anthropic Academy** (Skilljar-hosted, 13 free courses, launched 2026-03-02)

---

## 2. Requirements (confirmed with user)

| # | Requirement | Source |
|---|---|---|
| R1 | Reachable from anywhere: desktop + mobile + locked-down work-laptop browser | User Q1 answer: "C" (truly split) |
| R2 | Easy browsing with search, cross-references, graph | User original requirements |
| R3 | Claude-native query/tutor mode from desktop (Claude Code/Desktop) and mobile (Claude.ai/Mobile) | User original requirements |
| R4 | Quiz/test-knowledge commands scoped to cert + module + topic | User original requirements |
| R5 | Both spaced-repetition flashcards AND on-demand Claude quizzing | User Q3 answer: "C" |
| R6 | Extensible to future Claude certifications without redesign (primary) and to any other provider's cert if preference changes (secondary) | User follow-up |
| R7 | Public content acceptable — no auth gating needed on web view | User Q4 answer: "A" |
| R8 | Starting fresh with Obsidian — no existing vault to migrate | User Q2 answer: "D" |
| R9 | Mock exam with per-question immediate feedback + explanation + save-to-SRS | User follow-up on Loop 5 |
| R10 | Lightweight dashboard showing motivational/progress stats, visible across all devices | User follow-up |

### 2.1 Budget tolerance

- **Claude Max plan** — *assumed baseline, already paid, pre-existing*. User is on the highest-tier Claude subscription, which removes any headroom concerns around Claude Code usage (tutor-mode, mock exams, capture flows can run freely without hitting Pro-tier message limits). This is a significant capability advantage for the KB design — we can be generous with context loading and long tutoring sessions.
- **Obsidian Sync: $4/month (annual) / $5/month (monthly)** — *optional*, not enabled initially. Starting with desktop-only authoring + public Quartz web view for mobile access. Upgrade to Sync if mobile authoring becomes a need. (Decision: Option A.)
- **AnkiMobile (iOS): ~$25 one-time** — accepted if user on iOS. (Free on Android via AnkiDroid.)
- Everything else: free / open source

### 2.2 Time budget

- Setup: ≤2 evenings (≤6 hours total) before study begins in earnest
- Remaining ~6 weeks to exam: 100% study, no further infrastructure work
- Dashboard script: +1–2 hours, bundled into Day 2 setup

---

## 3. Architecture

### 3.1 Pattern

**Single source of truth, many views** — structured by **Karpathy's LLM Wiki pattern** (three-layer architecture). The git-tracked markdown vault is canonical. All other surfaces (Obsidian, Quartz, Anki, Claude) are read-optimized projections of the same underlying files.

The three layers:

1. **Raw sources** (`raw/`) — human-curated inputs. Anthropic Academy transcripts, docs excerpts, paper PDFs, highlighted notes, and **URL snapshots fetched via `/ingest-url` or `/seed-urls` with explicit per-snapshot user approval**. Claude reads freely. Claude writes to `raw/` ONLY via those two commands AND ONLY with in-session y/n approval for each write — no silent writes, no bulk-approve-all. This preserves provenance (every derived note traceable to a source) and protects against URL drift (fetched snapshots become offline-safe archives).
2. **Compiled wiki** (`certs/`, `concepts/`, `prompts/`, `resources/`) — LLM-maintained notes the user verifies. Claude writes here under human supervision via `/capture`, `/tutor`, `/quiz`, and `/lint`.
3. **Schema doc** (`CLAUDE.md` at vault root) — vault conventions, folder rules, and how Claude should behave when invoked in this vault. Picked up automatically by every Claude Code session.

Claude serves as an **active research librarian**: it ingests raw sources into compiled notes (`/capture`), keeps `index.md` current, runs periodic health-checks (`/lint`) for contradictions/orphans/gaps, and files valuable Q&A back as wiki pages (compound-knowledge loop in `/tutor`).

```
                ┌──────────────────────────────────────┐
                │ SOURCE OF TRUTH: c:\projects\ai-kb   │
                │ git repo → GitHub (public)           │
                │ markdown + YAML + .claude/ commands  │
                └──────────────────┬───────────────────┘
                                   │
         ┌─────────────┬───────────┼───────────┬──────────────┐
         ▼             ▼           ▼           ▼              ▼
    ┌─────────┐  ┌──────────┐ ┌────────┐ ┌──────────┐  ┌────────────┐
    │Obsidian │  │Obsidian  │ │Quartz  │ │  Yanki   │  │ Claude MCP │
    │desktop  │  │mobile    │ │v4 →    │ │  → Anki  │  │ (obsidian- │
    │(author+ │  │(author+  │ │GH Pages│ │  desktop │  │  mcp)      │
    │read)    │  │read)     │ │(browse │ │  → Anki- │  │ +          │
    │         │  │          │ │anywhere│ │  Web     │  │ GitHub     │
    │         │  │          │ │incl.   │ │  (SRS)   │  │ connector  │
    │         │  │          │ │work    │ │          │  │            │
    │         │  │          │ │browser)│ │          │  │            │
    └─────────┘  └──────────┘ └────────┘ └──────────┘  └────────────┘
         │            │
         └(desktop-only authoring; mobile access via Quartz public URL)
```

### 3.2 Component roster

| Component | Role | Why chosen |
|---|---|---|
| **Git repo + GitHub (public)** | Source of truth, version history | Durable, portable, free, zero lock-in |
| **Obsidian desktop** | Primary authoring | Best markdown editor with wikilinks/graph; user is Obsidian-fresh but comfortable with Claude Code tooling |
| **Obsidian mobile** | Authoring + review on phone/tablet | Native apps on iOS/Android, same vault via Sync |
| **Obsidian Sync** | (optional, deferred) | Not enabled initially. Upgrade path: $4/mo annual → mobile authoring. Starting without per user decision (Option A). |
| **Quartz v4 + GitHub Pages** | Browser-accessible public KB | Obsidian-native static generator (wikilinks, backlinks, graph view, full-text search out of the box); free hosting; zero maintenance |
| **Yanki plugin** | Pure-markdown → Anki sync | Folder-to-deck mapping, no custom flashcard syntax required, aligns with markdown-first philosophy |
| **Anki + AnkiWeb + AnkiDroid/AnkiMobile** | SRS study loop, cross-device | Gold-standard SRS algorithm, free (Android) / $25 (iOS) |
| **`obsidian-mcp`** | Claude Code/Desktop → vault (filesystem-based) | Simplest option (`npx obsidian-mcp /path`), no plugin required, read+write via filesystem |
| **Claude.ai GitHub connector** | Mobile/work-browser → vault (cloud) | First-party Anthropic connector; one-click setup; works without any local install |
| **Custom slash commands** | `/capture`, `/tutor`, `/quiz`, `/mock-exam` | Generic across certs (read `meta.yaml`); encode the 5 study loops |
| **Dashboard script (GitHub Action)** | Auto-generated `dashboard.md` | Cross-platform, deterministic, extends to all certs, no web-app maintenance |

### 3.3 Why not alternatives

Explicitly rejected during brainstorming:

- **Notion-centric**: proprietary format, weak native SRS, higher Claude latency (cloud→cloud)
- **Anki-only**: no browsable wiki, poor cross-referencing, violates R2
- **Obsidian Publish**: paid ($96-120/year) where Quartz + GitHub Pages is free and equivalent
- **MkDocs Material**: more mature but not Obsidian-aware (loses wikilinks, backlinks, graph view by default)
- **Custom web app**: overkill; maintenance burden competes with study time

---

## 4. Vault layout

```
c:\projects\ai-kb\
├── README.md                          # project overview, quickstart
├── CLAUDE.md                          # schema doc: vault conventions + Claude's role
├── index.md                           # AUTO-GENERATED catalog of all notes (Karpathy pattern)
├── dashboard.md                       # AUTO-GENERATED, do not edit by hand
├── MEMORY.md                          # (auto-memory, not vault content)
│
├── raw/                               # IMMUTABLE source material (Karpathy layer 1)
│   │                                  # Academy transcripts, doc excerpts, papers, PDFs,
│   │                                  # URL snapshots, game-session logs. Claude writes
│   │                                  # here ONLY via /ingest-url, /seed-urls, or
│   │                                  # /ingest-session (post-exam) with approval.
│   ├── academy/                       # Anthropic Academy lesson transcripts
│   ├── anthropic-docs/                # saved docs excerpts + URL snapshots
│   ├── papers/                        # research papers, arxiv, articles
│   ├── other/                         # fallback for miscellaneous URL snapshots
│   └── game-sessions/                 # reserved for post-exam Slay the Cert game (see gamification spec)
│
├── certs/
│   ├── _template/                     # scaffold for new certs
│   │   ├── README.md                  # MOC template
│   │   ├── meta.yaml                  # fill in cert parameters
│   │   ├── domain-1/                  # per-domain folders
│   │   ├── mock-exams/
│   │   ├── anki/                      # Yanki folder → Anki deck
│   │   └── weakness-queue.md          # appended by /mock-exam and /quiz
│   │
│   ├── cca-f/                         # Claude Certified Architect Foundations
│   │   ├── README.md                  # domain weights, schedule, links
│   │   ├── meta.yaml                  # exam parameters (see §5)
│   │   ├── domain-1-agentic/
│   │   ├── domain-2-claude-code/
│   │   ├── domain-3-prompt-engineering/
│   │   ├── domain-4-mcp/
│   │   ├── domain-5-context/
│   │   ├── mock-exams/                # dated session reports (standardized header)
│   │   ├── anki/                      # Yanki-managed folder → "CCA-F" deck;
│   │   │                              # files here are card SOURCES in Yanki's
│   │   │                              # markdown format, not Anki's .apkg artifacts
│   │   └── weakness-queue.md          # appended by /quiz and /mock-exam
│   │
│   ├── cca-next/                      # placeholder for next Claude cert
│   │   │                              # (Professional / FDE-track when Anthropic releases it)
│   │   └── meta.yaml                  # copied from _template, filled when exam announced
│   │
│   └── (further Claude certs, or other providers if preference changes)/
│
├── concepts/                          # PROVIDER-NEUTRAL concept library
│   ├── agents/
│   ├── rag/
│   ├── tool-use/
│   ├── prompt-engineering/
│   ├── evaluation/
│   └── safety/
│
├── prompts/                           # reusable prompts library
├── resources/                         # papers, videos, bookmarks
│
├── .claude/
│   ├── settings.json                  # MCP config, permissions
│   └── commands/
│       ├── capture.md
│       ├── tutor.md
│       ├── quiz.md
│       ├── mock-exam.md
│       └── lint.md
│
├── _lint/                             # lint reports from /lint command (dated)
│
├── .github/
│   └── workflows/
│       ├── quartz-deploy.yml          # build + deploy to Pages on push
│       └── dashboard.yml              # regenerate dashboard.md on push
│
├── scripts/
│   └── dashboard.py                   # reads vault → writes dashboard.md
│
├── quartz/                            # Quartz v4 checkout (git submodule or separate)
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-18-ai-cert-kb-design.md  # THIS DOC
```

### 4.1 Extensibility invariants

1. **No cert-specific code outside `certs/<cert-id>/`.** All tooling (slash commands, dashboard script, Quartz config) reads parameters from `meta.yaml` files.
2. **Concepts are provider-neutral.** `concepts/rag/` contains the concept plus sections per provider. Certs link to concepts via `[[wikilinks]]`.
3. **Adding a new cert is three steps**: copy `_template/`, fill `meta.yaml`, start authoring. No tool edits.
4. **Deleting a cert is one step**: `rm -r certs/<cert-id>/`. Nothing else breaks.

---

## 5. Data model: `meta.yaml` contract

Every cert folder contains one `meta.yaml`. Schema:

```yaml
id: <string>                 # filesystem-safe identifier (e.g., "cca-f")
name: <string>               # human-readable
provider: <string>           # "Anthropic" | "Microsoft" | etc.
target_date: <YYYY-MM-DD>    # user's target exam date
exam:
  question_count: <int>
  time_limit_minutes: <int>
  passing_score: <int>
  scale_max: <int>
  format: <string>           # e.g., "scenario-based-mcq" | "mixed"
  cost_usd: <int>
domains:
  - id: <string>             # filesystem-safe
    name: <string>           # human-readable
    weight: <float>          # 0.0–1.0, must sum to 1.0
resources:
  - name: <string>
    url: <string>
    priority: <primary|secondary>
```

### 5.1 Example: CCA-F

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
```

### 5.2 Example: second cert of a *different* provider (illustrative only)

The user's personal roadmap is Claude-only for the foreseeable future (CCA-F → next Claude cert when released, FDE-track). The example below demonstrates how the architecture accommodates a cert from a different provider with a different exam shape — kept as reference in case the user's preferences change, or for anyone else referencing this spec.

**Chosen illustrative target: Microsoft Azure AI-102.** Note: AI-102 has a published retirement date (see warning below); the example values are still instructive because the extensibility mechanism is identical regardless of which non-Claude cert is chosen.

```yaml
# certs/azure-ai-102/meta.yaml — illustrative; values verified April 2026
id: azure-ai-102
name: Microsoft Certified — Azure AI Engineer Associate
provider: Microsoft
target_date: 2026-06-30   # ⚠ AI-102 RETIRES 2026-06-30 — see note below
exam:
  question_count: 50      # official range: 40–60, varies per delivery
  time_limit_minutes: 100 # not 120
  passing_score: 700
  scale_max: 1000
  format: mixed           # MCQ + drag-drop + case-study + interactive
  cost_usd: 165
domains:                  # verified from Microsoft Learn April 2026
  - { id: plan-and-manage, name: "Plan and manage an Azure AI solution", weight: 0.275 }
  - { id: decision-support, name: "Implement decision support solutions", weight: 0.125 }
  - { id: vision, name: "Implement Azure AI Vision solutions", weight: 0.175 }
  - { id: nlp, name: "Implement natural language processing solutions", weight: 0.275 }
  - { id: gen-ai, name: "Implement generative AI solutions", weight: 0.125 }
resources:
  - { name: "Microsoft Learn — AI-102 study guide", url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-102", priority: primary }
```

> ⚠️ **Azure AI-102 retirement notice (verified April 2026):** Microsoft has announced that **AI-102 retires on 2026-06-30**. If the user passes CCA-F at end of May 2026, they would have only ~30 days to also pass AI-102 before retirement. More likely the right move is to target the **successor exam** (not yet confirmed at time of writing; likely a renamed "Azure AI Engineer" path with more agent/GenAI content). The spec retains AI-102 as an illustrative example because the **architecture works identically** for any replacement — that is the core extensibility guarantee. When the successor is announced, user creates `certs/<new-id>/` from `_template/` and proceeds.

### 5.3 `index.md` format

Auto-maintained by `/capture` and `/lint`. Flat table, one row per note in the compiled wiki (excludes `raw/` and system files). Concrete example:

```markdown
# Vault Index
_Last updated: 2026-04-18T14:32:00Z (auto — do not edit by hand)_

| Path | Cert | Domain | Status | One-line summary |
|---|---|---|---|---|
| certs/cca-f/domain-1-agentic/orchestration-patterns.md | cca-f | domain-1-agentic | done | Three canonical Claude agent orchestration patterns (supervisor, delegation, swarm); when to pick each. |
| certs/cca-f/domain-4-mcp/tool-design.md | cca-f | domain-4-mcp | in-progress | MCP tool schema anatomy: name, description, input_schema, tool choice semantics. |
| concepts/agents/tool-use.md | (concept) | (concept) | — | Tool use pattern: function calling, parallel tools, error handling, provider-neutral. |
| concepts/rag/contextual-retrieval.md | (concept) | (concept) | — | Anthropic's Contextual Retrieval: prepending chunk-specific context before embedding. |
```

Implementation notes:
- Path is relative to vault root, forward-slashes even on Windows.
- Cert/Domain columns show `(concept)` when the row is a provider-neutral concept note.
- Status column shows `—` for concept notes (they don't have the cert-domain status field).
- One-line summary is ≤140 chars, generated on `/capture` and refreshed on `/lint`.

### 5.4 Note frontmatter (required for dashboard)

Every cert-domain note needs:

```yaml
---
cert: cca-f
domain: domain-1-agentic
status: draft | in-progress | done
tags: [concept, orchestration]
links: [concepts/agents/orchestration-patterns]
---
```

This powers the dashboard's coverage metrics (§8).

---

## 6. Slash commands

All five commands live in `.claude/commands/`. All read a cert's `meta.yaml` and associated notes via `obsidian-mcp`.

### 6.1 `/capture <cert-id> <domain-id> <source-name>`

**Purpose:** turn raw input (lesson transcript, highlighted PDF, docs excerpt) into structured notes + candidate Anki cards.

**Arg semantics:** `<source-name>` is a **free-form human-readable label** (e.g., `"academy-lesson-7-mcp-tools"` or `"anthropic-docs-prompt-caching"`). It becomes part of the output filename slug and is recorded in the note's frontmatter as `source:`. It is NOT a file path. If the user wants to capture from an existing file in the vault, that's a separate `/import` flow (out of MVP scope).

**Flow:**
1. User pastes raw content into the Claude Code session.
2. Command reads existing domain notes for style/structure reference.
3. Claude proposes: (a) a note skeleton with headings, (b) 3–8 candidate Yanki-format flashcards.
4. User accepts/edits in-place.
5. Written to `certs/<cert-id>/<domain-id>/<slug>.md` with proper frontmatter.

**Design invariant:** user reviews every card before it's saved. No auto-ingestion without human verification.

### 6.2 `/tutor <cert-id> <domain-id> <topic> [--socratic|--lecture|--scenario]`

**Purpose:** deep interactive study session, Claude as tutor.

**Flow:**
1. Reads `meta.yaml` for cert context + all files in `certs/<cert-id>/<domain-id>/` + referenced `concepts/` notes.
2. Enters tutor system prompt (scenario-based by default; Socratic or lecture mode via flag).
3. Cites vault filenames when drawing on notes — trust-but-verify loop.
4. Gaps discovered during the session are logged to `certs/<cert-id>/<domain-id>/_gaps.md` for later authoring.
5. **Compound knowledge loop (Karpathy pattern):** at session end, Claude proposes filing 1–3 of the most valuable Q&A exchanges back as new wiki content (new concept notes, augmentations to existing notes, or new flashcards). User approves per-item before anything is written. Session ≠ session: every tutor conversation grows the vault rather than only consuming it.

**Default mode:** `--scenario` (matches exam format).

### 6.3 `/quiz <cert-id> <domain-id> [<topic>] [--count N]`

**Purpose:** short-form conversational quiz with immediate feedback.

**Flow:**
1. Reads vault notes for the specified scope.
2. Generates 5–20 questions (default 10).
3. Presents one at a time. Immediate verdict + explanation after each answer.
4. Missed questions → user prompted "Save to weakness queue? [y/n]" → if yes, appended to `certs/<cert-id>/weakness-queue.md` in Yanki format → Anki picks it up on next sync.
5. Session summary at end.

### 6.4 `/mock-exam <cert-id> [--sim] [--count N]`

**Purpose:** full-length mock exam, two modes.

**Study mode (default):**
1. Reads `meta.yaml` for `question_count` + domain weights.
2. Generates N questions (default = `question_count`) with correct domain distribution.
3. Per-question immediate feedback + explanation (pedagogically superior for study).
4. Save-missed-to-weakness-queue prompt after wrong answers.
5. Session report written to `certs/<cert-id>/mock-exams/YYYY-MM-DD-study.md` with per-domain breakdown + weak spots.

**Simulation mode (`--sim`):**
1. Strict timer matching `time_limit_minutes`.
2. No feedback during exam.
3. End-only scoring using scale defined in `meta.yaml`.
4. Full report with explanations after submission.
5. Saved to `certs/<cert-id>/mock-exams/YYYY-MM-DD-sim.md`.

### 6.5 `/ingest-url <cert-id> <domain-id> <url>`

**Purpose:** fetch a public URL, save a raw snapshot under `raw/` with user approval, then process exactly like `/capture`. Fast seeding mode for docs, blog posts, and arxiv papers.

**Flow:**
1. Validate args and cert/domain.
2. Use `WebFetch` with a content-extraction prompt ("Return full content as clean markdown, strip navigation/ads/cookies").
3. Auto-detect `raw/` subfolder by host:
   - `docs.anthropic.com`, `anthropic.com/news/*` → `raw/anthropic-docs/`
   - `arxiv.org`, `*.acm.org`, `*.openreview.net` → `raw/papers/`
   - `*.skilljar.com` → `raw/academy/` **with warning** ("Skilljar pages are usually video; extracted content may be incomplete")
   - otherwise → `raw/other/`
4. Show the user the extracted markdown (first ~500 lines + truncation note) + proposed raw filename `<YYYY-MM-DD>-<slug>.md`.
5. Ask: "Save raw snapshot to `<path>`? [y/n]". On `y`, write with frontmatter including `source_url`, `fetched_at` (ISO-8601 UTC), `fetched_by: /ingest-url`. On `n`, skip snapshot.
6. Continue as `/capture`: propose compiled note + flashcards + structured question blocks, per-item approval, writes to `certs/<cert>/<domain>/`. Compiled note includes `source_url` in frontmatter so any note is traceable to its URL.

**Works well for:** docs.anthropic.com, blog posts, arxiv HTML, GitHub raw markdown.
**Does NOT work for:** Skilljar video lessons, YouTube (no transcript fetch), JS-rendered SPAs, paywalled content.

### 6.6 `/seed-urls <cert-id> <urls-file>`

**Purpose:** bulk variant of `/ingest-url`. Processes multiple URLs sequentially with per-URL approval gates. For rapid Day 2 vault seeding.

**Input file format:** plain text, one URL per line. Optional prefix `<domain-id>|<url>` to target a specific domain; if absent, command prompts for domain per URL. Lines starting with `#` are comments.

**Flow:**
1. Read file, skip comments/blanks.
2. For each URL: run `/ingest-url` flow (fetch → show → approve raw → propose note → approve note → write).
3. On any fetch failure: log + continue (do not abort batch).
4. At end: write a session report to `_lint/<YYYY-MM-DD>-seed-urls.md` summarizing URLs processed, raw snapshots written, notes written, flashcards, questions.

**Invariant:** every single write (raw or compiled) still requires per-item user approval. No bulk-yes. Prevents accidental ingestion of wrong content.

### 6.7 `/lint [<cert-id>|--all]`

**Purpose:** Karpathy-style periodic health-check over the vault. Finds contradictions, orphan pages, stale claims, missing cross-references, and data gaps. Proposes concrete fixes; user approves before anything is written. Prevents KB rot — without this pass, errors compound silently over a 6-week study arc.

**Flow:**
1. Scope: single cert (`/lint cca-f`) or entire vault (`/lint --all`).
2. Reads every markdown file in scope via `obsidian-mcp`.
3. Runs five checks in sequence:
   - **Contradictions** — same claim stated differently in two or more files (e.g., "Claude Sonnet has 200k context" vs. "1M context" in different notes)
   - **Orphans** — pages with no incoming or outgoing `[[wikilinks]]`
   - **Stale claims** — references to deprecated APIs, retired models, outdated Anthropic features (flagged when keywords match a small stale-terms list maintained in `CLAUDE.md`)
   - **Missing cross-references** — concept mentioned in 3+ cert-domain notes but no central concept note in `concepts/`
   - **Data gaps** — domain folders that are light on coverage vs. expectations derived from `meta.yaml` weights (e.g., Domain 1 is 27% of the exam but has only 2 notes)
4. Writes a structured report to `_lint/YYYY-MM-DD-report.md`.
5. For each issue: proposes a concrete fix, waits for user y/n/skip, applies on approval.
6. Regenerates `index.md` at the end if any notes were created, moved, renamed, or had their summary line changed — plus a forced regeneration if `index.md` is missing or older than 7 days.

**Frequency:** run weekly as a calendar habit, or on-demand after adding 5+ notes, or when a mock exam reveals conceptual confusion in a specific domain.

**Design invariant:** `/lint` **never silently modifies the vault**. Every proposed change is human-reviewed in-session. The vault is LLM-maintained, human-verified — the Karpathy principle.

### 6.8 `/ingest-session <path>` (reserved, post-exam)

**Status:** reserved. Authored in Phase G8 of the Slay the Cert gamification build (see `docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md`). Not implemented in the current KB MVP.

**Purpose (when built):** apply a downloaded game session JSON back to the vault — append missed questions to `weakness-queue.md`, archive raw session log to `raw/game-sessions/`, add summary row to `certs/<cert-id>/game-log.md`.

**Why reserved now:** guarantees the KB's vault layout and conventions (Karpathy three-layer, approval invariant, structured question blocks) already accommodate the game post-exam without architectural surgery. The folder `raw/game-sessions/` is created now; the command is authored later.

### 6.9 Command contract invariants

- All commands take `cert-id` as first positional arg.
- All commands read `certs/<cert-id>/meta.yaml` for parameters.
- All commands write outputs back to the vault (conversations, reports, weakness entries) — the vault records its own learning trajectory.
- Zero cert-specific logic inside command markdown. Everything parameterized.

---

## 7. Study loops (5 study journeys + 1 maintenance pass)

| # | Loop | Frequency | Primary surface | Output artifact |
|---|---|---|---|---|
| 1 | **Capture** — notes + cards from Anthropic Academy or other source | Daily | Obsidian desktop (+ `/capture`) | `certs/<cert>/<domain>/<note>.md` with inline Yanki cards |
| 2 | **Reference lookup** — recall a fact on the fly | As needed | Any: Obsidian mobile / Quartz browser / Claude mobile | None (read-only) |
| 3 | **SRS drilling** — daily Anki queue | Daily, ~15 min | AnkiDroid / AnkiMobile / Anki desktop | Anki review history |
| 4 | **Tutor session** — deep Socratic/scenario study | 3–5×/week, 30–60 min | Claude Code + `/tutor` | `_gaps.md` updates, possibly new notes |
| 5 | **Mock exam** — study or simulation | Weekly (sim) + on-demand (study) | Claude Code + `/mock-exam` | Dated report in `mock-exams/`, weakness queue updates |
| 6 | **Lint / maintenance** — Karpathy-style health check | Weekly + on-demand | Claude Code + `/lint` | Lint report in `_lint/`, user-approved fixes, regenerated `index.md` |

### 7.1 Self-healing weakness feedback

Missed questions in Loops 4 & 5 → `weakness-queue.md` → Yanki → Anki deck → Loop 3 tomorrow morning. The system progressively targets weak spots without manual planning.

---

## 8. Dashboard (Tier 2 — auto-generated markdown)

### 8.1 Implementation

- Python script at `scripts/dashboard.py`.
- GitHub Action `.github/workflows/dashboard.yml` runs on every push to `main`.
- Reads:
  - Every `certs/*/meta.yaml` (for target dates, domain weights)
  - Every note's frontmatter under `certs/*/domain-*/**/*.md` (for counts by `status` and `domain`)
  - Every `certs/*/mock-exams/*.md` (parses score from a standardized report header — format fixed during implementation planning)
  - Every markdown file under `certs/*/anki/` (Yanki's output folder — these files ARE the card sources, one card per file or Yanki's native multi-card format)
- Writes `dashboard.md` at repo root.
- Commits and pushes the regenerated file using `GITHUB_TOKEN`.

**Loop prevention (critical):** the dashboard workflow MUST (a) use path filters to ignore commits that only touch `dashboard.md`, (b) include `[skip ci]` in its own bot commit message, and (c) skip the commit entirely if the regenerated file has no diff from the current `dashboard.md`. Without these guards the workflow re-triggers itself and also churns the Quartz deploy workflow. The implementation plan must verify all three guards are in place before first enabling the action.

### 8.2 Dashboard content (per cert block)

- Countdown: days until `target_date`
- Coverage table: domain × weight × notes count × cards count × status
- Mock exam trend: last 5 sessions with score + ASCII sparkline
- Weak spots: top 3–5 recurring misses extracted from reports
- Anki queue snapshot (if AnkiWeb API accessible; otherwise skip)

### 8.3 Cross-surface visibility

- **Obsidian desktop/mobile**: renders `dashboard.md` inline
- **Quartz web (incl. work laptop)**: rendered as a page
- **Claude mobile**: retrievable via GitHub connector

### 8.4 YAML frontmatter discipline

**In scope for frontmatter requirement** (`cert`, `domain`, `status` required):
- Notes under `certs/<cert-id>/domain-*/**/*.md`

**Exempt from frontmatter requirement** (system-generated or index files):
- `certs/<cert-id>/README.md` (MOC index)
- `certs/<cert-id>/mock-exams/*.md` (reports — have their own standardized header with `score:`, `mode:`, `date:`)
- `certs/<cert-id>/weakness-queue.md` (appended by commands)
- `certs/<cert-id>/anki/**/*.md` (Yanki card sources — counted but not classified by status)
- `concepts/**/*.md` (provider-neutral, classified by tags not status)
- `prompts/**/*.md`, `resources/**/*.md`

Enforced by `/capture` (always writes frontmatter for in-scope notes) and by a CI lint in the dashboard workflow that warns (not blocks) on missing frontmatter in in-scope paths.

---

## 9. Build sequence

### 9.1 Day 1 evening (~2–3 hours) — "It works"

1. `git init` in `c:\projects\ai-kb`; create GitHub repo; push.
2. Lay folder skeleton (§4) — including `raw/`, `raw/academy/`, `raw/anthropic-docs/`, `raw/papers/`, `_lint/`.
3. Seed `certs/cca-f/meta.yaml` + `README.md` + 5 empty domain folders.
4. Write `certs/_template/` scaffolding.
4a. **Write root `CLAUDE.md`** — vault conventions (folder structure, frontmatter rules, Karpathy three-layer principle, slash-command list, Claude's role as active librarian with human-in-the-loop approval). This file is loaded by every Claude Code session in this vault.
4b. **Seed `index.md`** — initially empty catalog; `/capture` and `/lint` maintain it.
5. Install Obsidian desktop only; point at the vault; verify editing + Obsidian Git plugin auto-commit. (Mobile access is via the Quartz public URL built in Phase 4; Obsidian Sync is deferred per Option A.)
6. Install `obsidian-mcp` (`npx -y obsidian-mcp <vault-path>` — the `-y` auto-confirms the npm download prompt; the package is `StevenStavrakis/obsidian-mcp`); register in `.claude/settings.json`.
7. Smoke test: author a note on desktop → appears on phone + in Claude Code via MCP.

### 9.2 Day 2 evening (~2–3 hours) — "It teaches me"

8. Author the **five** slash commands (`.claude/commands/`): `/capture`, `/tutor`, `/quiz`, `/mock-exam`, `/lint`. Implementation plan (next step after this spec) will provide command contents.
9. Install Obsidian Yanki plugin + AnkiConnect in Anki desktop; verify a test card syncs end-to-end.
10. Install AnkiDroid / AnkiMobile; log in to AnkiWeb; verify card appears on phone.
11. Clone Quartz v4; configure to render the vault; enable GitHub Pages; verify public URL works from a different device.
12. Enable Claude.ai GitHub connector; verify Claude mobile can read a vault note.
13. Write `scripts/dashboard.py` + `.github/workflows/dashboard.yml`; test locally; verify action runs on push.
14. First real tutor session: `/tutor cca-f domain-1-agentic "orchestration patterns"` — proves the whole stack on actual study work.
15. First `/lint cca-f` run — should flag the seeded domain stubs as "data gap, expected coverage low" which is expected at day 2; confirms the lint pipeline wires up correctly against `meta.yaml`.

### 9.3 Week 1 — "It has content"

- Daily capture + SRS + tutor sessions focused on Domain 1 (27% exam weight).
- First study-mode mock exam for baseline score.
- Start populating `concepts/agents/` with provider-neutral notes.

### 9.4 Weeks 2–6 — "Pure study"

- No further infrastructure work.
- Weekly mock-exam cadence (alternating study / simulation).
- Dashboard countdown + weakness queue drive weekly focus.

### 9.5 Post-CCA-F

- When Anthropic announces the next Claude certification (Professional / Forward-Deployed-Engineer-track), copy `certs/_template/` → `certs/<new-cert-id>/`.
- Fill `meta.yaml` from Anthropic's published exam guide.
- Reuse concept library (the 5 CCA-F domains already cover most core concepts — the next cert likely adds more depth, not net-new concepts).
- Mock-exam loop, tutor loop, quiz loop, dashboard — all work without modification.

---

## 10. Cost summary

| Item | One-time | Recurring |
|---|---|---|
| Git + GitHub | $0 | $0 |
| Obsidian apps | $0 | $0 |
| Obsidian Sync (optional, deferred) | — | $0/mo (not enabled); $4/mo if upgraded for mobile |
| Quartz + GitHub Pages | $0 | $0 |
| Anki desktop + AnkiWeb + AnkiDroid | $0 | $0 |
| AnkiMobile (iOS, optional) | ~$25 | $0 |
| `obsidian-mcp` + all MCP tooling | $0 | $0 |
| Claude.ai connectors (GitHub, Notion, etc.) | $0 | $0 — included in Max plan |
| **Claude Max plan** (assumed pre-existing; unlocks generous Claude Code headroom for tutor/mock-exam loops) | — | pre-existing |
| CCA-F exam | $99 (or free only if employer is in Claude Partner Network — see §1.4) | — |
| **New recurring cost introduced by this KB** | **$0–$25 one-time** | **$0/mo** (Option A); $4/mo if Obsidian Sync added later |

---

## 11. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Mobile authoring need emerges mid-study | Low | Upgrade path documented: enable Obsidian Sync + install mobile app, ~10 min. Alternatively, capture to phone notes app → migrate at desktop. |
| `obsidian-mcp` breaks on plugin/OS update | Medium | Fallback to Claude Code's built-in filesystem access (no MCP); lose semantic convenience but keep all capability |
| Quartz build fails on GitHub Actions | Low | Run locally (`npx quartz build`); bypass Pages if needed; static HTML deploys to any host |
| Yanki stops supporting a card type | Low | Markdown syntax is plain text — migrate to Obsidian_to_Anki if needed, notes themselves are portable |
| Claude.ai GitHub connector gets rate-limited | Low | Connector is official and rate-limits are generous for personal use; fall back to cloning repo locally on work laptop if allowed |
| User loses motivation / misses study days | High | Dashboard countdown and weakness queue are explicit motivational signals; review weekly |
| Exam domain weights change before May | Low | `meta.yaml` edit; slash commands pick it up automatically |
| Scope creep (adding features instead of studying) | High | This spec's non-goals section is binding; no new features before the May exam |

---

## 12. Open decisions deferred to implementation plan

The implementation plan (next step via `writing-plans` skill) should resolve:

- Exact slash-command prompt wording (Socratic default phrasing, quiz verdict format)
- Quartz theme selection + any custom styling
- Dashboard Python script's exact score-parsing regex (depends on mock-exam report format chosen)
- Whether to use Obsidian Git plugin or rely on manual `git` CLI for commits
- Which additional Obsidian plugins to install in the MVP (Dataview? Templater? Tags?)

---

## 13. References

- [Claude Certified Architect Foundations — overview](https://claudecertifications.com/)
- [CCA-F curriculum breakdown](https://www.the-ai-corner.com/p/claude-certified-architect-curriculum-2026)
- [Quartz v4](https://quartz.jzhao.xyz/)
- [obsidian-mcp](https://github.com/MarkusPfundstein/mcp-obsidian) + alternatives on [Obsidian forum](https://forum.obsidian.md/t/obsidian-mcp-servers-experiences-and-recommendations/99936)
- [Yanki Obsidian plugin](https://github.com/kitschpatrol/yanki-obsidian)
- [Anthropic Claude connectors directory](https://github.com/rdmgator12/awesome-claude-connectors)
- [StevenStavrakis/obsidian-mcp (install)](https://mcp-obsidian.org/install/)
- [Microsoft Learn — AI-102 exam + retirement notice](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-102)
- [Claude pricing (Max plan baseline)](https://claude.com/pricing)
- [Claude Partner Network requirements (BSWEN)](https://docs.bswen.com/blog/2026-03-21-claude-partner-network-requirements/)
- [Obsidian pricing (Sync tiers)](https://obsidian.md/pricing)
- **[Karpathy LLM Wiki — canonical gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** (primary pattern reference)
- [Andrej Karpathy's LLM Knowledge Bases explained (Data Science in Your Pocket)](https://medium.com/data-science-in-your-pocket/andrej-karpathys-llm-knowledge-bases-explained-2d9fd3435707)
- [LLM Knowledge Bases (DAIR.AI Academy)](https://academy.dair.ai/blog/llm-knowledge-bases-karpathy)

---

## 14. COVE verification log

This spec was Chain-of-Verification-checked twice on 2026-04-18.

### COVE #1 — Factual corrections against web sources

- §1.4 Partner Network: clarified organizational (not individual) eligibility
- §2.1 Budget: corrected Obsidian Sync to $4/mo annual or $5/mo monthly; later updated to Claude Max baseline
- §5.2 Azure AI-102 example: corrected question count (40–60 not 60), time limit (100 not 120); added retirement notice (2026-06-30); added verified domain list + weights
- §9.1 step 6: added `-y` flag to `npx obsidian-mcp` command
- §10 Cost summary: clarified monthly vs annual Sync pricing; refined Partner Network wording; updated to Claude Max

### COVE #2 — Triangulation against Karpathy LLM Wiki pattern

Cross-checked against (1) Karpathy's canonical gist, (2) Data Science in Your Pocket article, (3) DAIR.AI Academy blog. Additions integrated:

- **CONFIRMED (3/3 sources):** `raw/` immutable source layer → added as §3.1 layer 1 + §4 vault layout
- **CONFIRMED (2/3 sources + primary):** `index.md` content catalog → added at vault root, maintained by `/capture` and `/lint`
- **CONFIRMED (3/3 sources):** `/lint` periodic health-check pass → added as §6.7 command (was §6.5 before URL-ingestion insert); loops now #6 in §7
- **CONFIRMED convention in Claude Code:** root `CLAUDE.md` schema doc → added at vault root + §4 + §9 Day 1 step 4a
- **CONFIRMED Karpathy pattern:** compound-knowledge loop in `/tutor` → added as step 5 in §6.2 flow
- **DEMOTED to optional (weak evidence):** `log.md` append-only chronological log — primary source mentioned it but secondary sources did not confirm; skipped from MVP

The Karpathy pattern alignment is not cosmetic — **42% of CCA-F exam weight (Domain 1 Agentic Architecture + Domain 5 Context Management) is exactly what the KB design itself embodies**. User practices the exam material while studying it.

---

**End of design.**
