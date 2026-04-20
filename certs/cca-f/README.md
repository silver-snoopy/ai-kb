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

## Study surfaces

Three live surfaces, all deployed via GitHub Pages and reading from the same verified exam pool under [`public/exams/cca-f/verified/`](../../public/exams/cca-f/verified/):

- [`/practice/picker.html`](../../public/practice/picker.html) — card grid of verified exams; pick one to launch a timed session with instant feedback + missed-question review
- [`/review/`](../../public/review/) — spaced repetition over the same question bank
- [`/dungeon/`](../../public/dungeon/) — *Slay the Cert* browser game; `PickerScene` offers the same verified exams as boss-fight pools

## Dynamic exam generation

Two-step pipeline, generator + adversarial verifier:

```
/cca-f-generate-exam [--seed N] [--size N] [--drop N] [--difficulty e/m/h]
    # Produces a candidate exam JSON grounded in the 364-Q CertSafari bank.
    # Output: public/exams/cca-f/candidates/<filename>.json
    # NOT picked up by the study surfaces until verified.

/cca-f-verify-exam <path-to-candidate>
    # 4 parallel reviewer subagents (fact-check, distractor audit,
    # stale-term sweep, explanation audit). On zero critical/high flags,
    # promotes the candidate to public/exams/cca-f/verified/.
    # Calibration gate: 10/10 against planted-error set.
```

The 5 pre-seeded verified exams (`certsafari-seed{1,7,42,101,777}.json`, 60 Qs each, built from the CertSafari bank) are already live and surfaced in all three study surfaces.

Open a specific exam directly in the practice UI:

```
public/practice/index.html?src=../exams/cca-f/verified/<filename>.json
```

Zero per-invocation cost on a Claude Max subscription — cheap to rerun.

## Weakness queue

Missed questions accumulate in [weakness-queue.md](./weakness-queue.md). Use `/quiz --review-weak` to drill them.
