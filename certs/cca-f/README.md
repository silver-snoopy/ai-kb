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

## Dynamic exam generation

The `/generate-exam` slash command produces a fresh 60-question exam JSON on each invocation, using the real exam rules (4 of 6 scenarios picked at random from this cert's 6-scenario pool). Output lands in [`public/exams/`](../../public/exams/) and is loadable in the practice UI via the `?src=` query parameter.

```
/generate-exam                       # default: 60 Q, 4 of 6 scenarios, mixed difficulty
/generate-exam --seed 42             # reproducible scenario pick
/generate-exam --size 12 --drop 2    # short warmup (3 Q per kept scenario)
```

Open the generated exam in the practice UI:

```
public/practice/index.html?src=../exams/<generated-filename>.json
```

Zero per-invocation cost on a Claude Max subscription — cheap to rerun.

## Weakness queue

Missed questions accumulate in [weakness-queue.md](./weakness-queue.md). Use `/quiz --review-weak` to drill them.
