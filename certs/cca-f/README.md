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

Two live surfaces, both reading from the unified [bank.json](../../public/exams/cca-f/bank.json):

- [`/practice/`](../../public/practice/) — scenario MCQs. Filter by domain + scenario (intersection). Launch a **Mock Exam** (60 Qs, 4-of-6 scenarios, domain-weighted).
- [`/dungeon/`](../../public/dungeon/) — *Slay the Cert* browser game. Each boss is a CCA-F domain; questions drawn from the bank filtered to that domain.

Review exists as a nav-hidden surface (`/review/`) per the 2026-04-20 retirement — unused in the active study loop.

## Unified question bank

Single source of truth: `public/exams/cca-f/bank.json`. Every question carries `domain` + `scenario` + `source` tags.

- **CertSafari imports** (initial seed, 364 questions): built once via `scripts/build-bank.mjs`, scenario-tagged via `scripts/classify-scenarios.mjs`.
- **LLM-generated additions** (accumulative): produced via `/cca-f-generate-questions`, merged into the bank by `/cca-f-verify-questions` on clean 4-reviewer pass.

### Pipeline

```
/cca-f-generate-questions [--count N] [--scenario 1..6] [--domain D] [--seed N]
    # Produces novel questions grounded in the CertSafari substrate.
    # Output: public/exams/cca-f/candidates/gen-<timestamp>.json

/cca-f-verify-questions <path-to-candidate>
    # 4 parallel reviewers (fact-check, distractor audit, stale-term sweep,
    # explanation audit) + 5th scenario/domain plausibility check.
    # On clean review: merges questions into bank.json (+ bump version).
    # Calibration gate: 10/10 against planted-error set (--calibrate).
```

Candidate files stay in `candidates/` after merge as an audit trail.

Direct exam loads in the practice UI still work via `?src=`:

```
public/practice/index.html?src=../exams/cca-f/bank.json  # explicit default
```

Zero per-invocation cost on a Claude Max subscription — cheap to rerun.

## Weakness queue

Missed questions accumulate in [weakness-queue.md](./weakness-queue.md). Use `/quiz --review-weak` to drill them.
