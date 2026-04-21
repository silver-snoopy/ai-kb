---
description: Answer + enrich an externally-authored CCA-F raw question dump (stems + distractors only) into a bank-shaped candidate JSON ready for /cca-f-verify-questions. Source tag "mix" (externally-authored stems, LLM-inferred answers/explanations/tags).
argument-hint: <path-to-raw-dump> [--out PATH]
---

# /cca-f-answer-raw — answer + tag raw question dumps for bank ingestion

**Arguments:** `<path-to-raw-dump>` (required, e.g. `raw/other/cca-f-questions-2.json`) `[--out PATH]`

Consumes a raw dump of "verified but unanswered" CCA-F MCQs (stems and distractors reviewed, no answer key, no explanations, no vault-native domain/scenario tags) and produces a bank-shaped candidate JSON. Output feeds the existing `candidates/` → `/cca-f-verify-questions` → merge-to-`bank.json` pipeline. Candidate questions are tagged `source: "mix"` (externally-authored stems + LLM-inferred answers/tags/explanations).

## Invariants

- **Raw input is immutable.** Never mutate `raw/**`. Read-only.
- **Stem content is authoritative for domain/scenario inference.** Raw `topic` string and `scenarioId` are supportive hints only — used to cross-check and tie-break, never to override stem-derived tags silently.
- **Every emitted question must carry a non-trivial per-option explanation.** Each option line names a specific pattern from `_scenarios.md` (correct) or anti-pattern from `domain-*/anti-patterns.md` (distractor). Generic or missing explanations are a build-time error, not a verifier flag.
- **Hard constraint `domain ∈ bank.scenarios[scenario].domains`.** If no scenario in `"1".."6"` satisfies the constraint for the inferred domain, the question is skipped and reported (never forced into a bad pair).
- **Unknown topics fail loud.** If a raw `topic` string is not in the Topic Map, abort — keep the map exhaustive.

## What to do

### 1. Parse arguments

- `$ARGUMENTS[0]` is the raw dump path (required). Must exist; default `raw/other/cca-f-questions-2.json`.
- `--out` optional; must resolve under `public/exams/cca-f/candidates/`. Default `public/exams/cca-f/candidates/mix-<UTC-timestamp>.json` (UTC ISO, colons stripped).

### 2. Validate raw input

Read the raw JSON. Assert it is an array and every entry has:
- `id` (int)
- `text` (non-empty string)
- `options` (array of exactly 4 `{label,text}` where labels are `A,B,C,D`)
- `difficulty ∈ {"easy","medium","hard"}`
- `topic` (non-empty string)
- `scenarioId` (int)

Reject on any structural failure with a precise error (which field, which entry).

### 3. Load substrate (same set `/cca-f-generate-questions` uses)

Read via the Read tool:

- `CLAUDE.md` (vault conventions + stale-terms list)
- `certs/cca-f/meta.yaml` (exam params, domain weights)
- `certs/cca-f/_scenarios.md` (authoritative scenario taxonomy — CORRECT / ANTI-PATTERN pairs; primary grounding)
- `certs/cca-f/_quick-reference.md` (distractor catalog per domain)
- `certs/cca-f/domain-1-agentic/anti-patterns.md`
- `certs/cca-f/domain-2-claude-code/anti-patterns.md`
- `certs/cca-f/domain-3-prompt-engineering/anti-patterns.md`
- `certs/cca-f/domain-4-mcp/anti-patterns.md`
- `certs/cca-f/domain-5-context/anti-patterns.md`
- `public/exams/cca-f/bank.json` (for `scenarios[S].domains` constraint + near-duplicate stem-trigram check)

### 4. Per-question inference + answer (stem primary, raw hints supportive)

For each raw entry:

1. **Infer `domain` from stem content.** Keyword / concept match against the domain anti-pattern files + CORRECT patterns in `_scenarios.md`. Pick the single best-fit vault slug: one of `domain-1-agentic`, `domain-2-claude-code`, `domain-3-prompt-engineering`, `domain-4-mcp`, `domain-5-context`.
2. **Infer `scenario` from stem content.** Read the stem's setup + correct answer; pick the scenario in `_scenarios.md` (1..6) whose narrative frame best matches.
3. **Cross-check with supportive hints.**
   - Apply the **Topic Map** (below) to map `raw.topic → expected-domain`.
   - Apply the **ScenarioId Alias Table** (below) to map `raw.scenarioId → expected-bank-scenario`.
   - Compute two booleans: `topic_domain_agree` (stem-inferred domain == topic-mapped domain) and `scenario_alias_agree` (stem-inferred scenario == alias-mapped scenario).
4. **Resolve disagreements.**
   - If stem inference is high-confidence and hints disagree → log in `source_note`, keep stem-derived, let the verifier's scenario-plausibility check adjudicate.
   - If stem is ambiguous (no clear winner) → use the hints as tiebreakers.
   - If stem content and all hints disagree and the stem is vague → skip and count under `skipped_ambiguous`.
5. **Enforce `bank.scenarios[S].domains`.** If the chosen `(domain, scenario)` pair isn't in `bank.scenarios[scenario].domains`, try the next-best scenario that contains the domain. If none exists, skip and count under `skipped_unmappable`.
6. **Pick the correct option letter (`A|B|C|D`).** Compare each option against the CORRECT/ANTI-PATTERN pairs in `_scenarios.md` for the selected scenario. Exactly one must match a CORRECT pattern; the other three must match anti-patterns. If the stem has no clear single correct option per substrate, skip and count under `skipped_ambiguous_answer`.
7. **Write the flattened explanation (mandatory, 4 lines):**

   ```
   A: <why-correct-or-anti-pattern-name + one-line rationale>
   B: <...>
   C: <...>
   D: <...>
   ```

   - Correct option: name a specific CORRECT pattern from `_scenarios.md` (e.g. `matches the "pass conversation history each turn" pattern in scenario 1`). Quote or paraphrase the exact guidance.
   - Each distractor: name the specific anti-pattern from `domain-<n>-*/anti-patterns.md` the option embodies (e.g. `anti-pattern: assumes server-side memory persistence`).
   - **No circular reasoning** (e.g. "wrong because it's incorrect").
   - **No hallucinated Anthropic APIs or features.**
   - **No stale terms** — flag CLAUDE.md stale-terms list (`Claude 2`, `Claude 3.x`, `Claude 3.5 Sonnet`, `computer use beta`, `prompt caching beta`, etc.) and rewrite. Current models: Claude 4.x family.

8. **Validate explanation shape (build-time gate).** Abort the run if any emitted question:
   - has fewer than 4 `X: ` lines,
   - has any option line shorter than 40 characters (generic filler),
   - contains any stale-term from CLAUDE.md,
   - contains the phrase "correct answer" or "incorrect answer" without a named pattern.

### 5. Near-duplicate guard

For each generated stem, compute a lowercased-trigram set and compare against every existing `bank.questions[].stem` trigram set. If Jaccard overlap > 0.55 against any bank question, record `near_duplicate_of: <bank-id>` in that question's entry in `exam_metadata.warnings` (do NOT drop — verifier's id-collision check and human spot-check adjudicate).

### 6. Emit the candidate JSON

```json
{
  "generated_at": "<ISO UTC>",
  "exam_metadata": {
    "source_dump": "<raw-path>",
    "count": <N-emitted>,
    "skipped_unmappable": <int>,
    "skipped_ambiguous": <int>,
    "skipped_ambiguous_answer": <int>,
    "warnings": [
      { "mix_id": "mix-<raw-id>", "warning": "near_duplicate_of: <bank-id>" },
      { "mix_id": "mix-<raw-id>", "warning": "topic_domain_disagree: stem=<X> topic=<Y>" }
    ],
    "generator": ".claude/commands/cca-f-answer-raw.md",
    "generator_model": "<claude-model-id>"
  },
  "questions": [
    {
      "id": "mix-<raw-id>",
      "source": "mix",
      "domain": "<inferred-vault-slug>",
      "scenario": "<inferred 1..6>",
      "difficulty": "easy|medium|hard",
      "stem": "<raw.text verbatim>",
      "options": { "A": "<opt A text>", "B": "...", "C": "...", "D": "..." },
      "correct": "A|B|C|D",
      "explanation": "A: ...\nB: ...\nC: ...\nD: ...",
      "source_note": "raw/other/cca-f-questions-2.json id=<N> raw-topic=\"<T>\" raw-scenarioId=<S> topic-domain-agree=<bool> scenario-alias-agree=<bool>"
    }
  ]
}
```

Write to `--out` (default under `candidates/`). Report:
- Total emitted vs. skipped (by reason).
- Per-domain and per-scenario breakdown of emitted questions.
- Count of `topic_domain_disagree` and `scenario_alias_disagree` warnings.
- Near-duplicate hits.

### 7. Sharding (for dumps > ~30 questions)

The prompt cost of per-question reasoning is heavy. Internally shard:

- Process the input in slices of ~30 questions.
- Maintain partial state (emitted questions so far, skip counts, warnings) in memory across slices.
- If the model context approaches limits, flush the current candidate file to disk and resume on re-invocation with `--resume <partial-file>` — partial state is read back, skipped ids are honored, remaining raw entries processed.

### 8. Next step (do NOT execute automatically)

Tell the user:

> Ready for verification: `/cca-f-verify-questions <output-path>` — runs the 4-reviewer pass and merges into bank.json on clean review.

## Topic Map (raw.topic → vault domain)

Derived from the 62 distinct `topic` strings observed in `raw/other/cca-f-questions-2.json`. Extend this table when new raw dumps introduce new topics.

| Topic (raw) | Domain |
|---|---|
| Agent SDK Hook Patterns | `domain-1-agentic` |
| Agentic Loop Fundamentals | `domain-1-agentic` |
| Escalation Decisions | `domain-1-agentic` |
| Information Provenance Tracking | `domain-1-agentic` |
| Multi-Agent Context Persistence | `domain-1-agentic` |
| Multi-Agent Orchestration | `domain-1-agentic` |
| Multi-step Workflow Handoffs | `domain-1-agentic` |
| Parallel Tool Execution | `domain-1-agentic` |
| Result Aggregation Formats | `domain-1-agentic` |
| Result Aggregation Uncertainty | `domain-1-agentic` |
| Session Resumption | `domain-1-agentic` |
| Subagent Context Passing | `domain-1-agentic` |
| Subagent Delegation Strategy | `domain-1-agentic` |
| Subagent Invocation Configuration | `domain-1-agentic` |
| Subagent Spawning Architecture | `domain-1-agentic` |
| Temporal Data Aggregation | `domain-1-agentic` |
| CLAUDE.md Import Patterns | `domain-2-claude-code` |
| Claude Code Configuration Selection | `domain-2-claude-code` |
| Codebase Exploration Patterns | `domain-2-claude-code` |
| Configuration Scope Management | `domain-2-claude-code` |
| Context Management for Large Codebases | `domain-2-claude-code` |
| Memory File Debugging | `domain-2-claude-code` |
| Plan Mode vs Direct Execution | `domain-2-claude-code` |
| Task Decomposition | `domain-2-claude-code` |
| Extraction Accuracy Patterns | `domain-3-prompt-engineering` |
| False Positive Reduction | `domain-3-prompt-engineering` |
| Feedback Loop Design | `domain-3-prompt-engineering` |
| Few-Shot Prompting | `domain-3-prompt-engineering` |
| Iterative Refinement | `domain-3-prompt-engineering` |
| Prompt Criteria Design | `domain-3-prompt-engineering` |
| Response Format Control | `domain-3-prompt-engineering` |
| Structured Output | `domain-3-prompt-engineering` |
| Structured Output Extraction | `domain-3-prompt-engineering` |
| Structured Output Methods | `domain-3-prompt-engineering` |
| System Prompt Design | `domain-3-prompt-engineering` |
| Test Generation Quality | `domain-3-prompt-engineering` |
| Tool Choice Configuration | `domain-3-prompt-engineering` |
| User Intent Clarification | `domain-3-prompt-engineering` |
| Built-in Tool Selection | `domain-4-mcp` |
| Human Review Workflows | `domain-4-mcp` |
| Human-in-the-Loop Safeguards | `domain-4-mcp` |
| MCP Error Handling Architecture | `domain-4-mcp` |
| MCP Resource vs Tool Design | `domain-4-mcp` |
| MCP Server Integration | `domain-4-mcp` |
| MCP Tool Annotation Trust Model | `domain-4-mcp` |
| MCP Tool Description Design | `domain-4-mcp` |
| MCP Value Proposition | `domain-4-mcp` |
| Tool Composition Patterns | `domain-4-mcp` |
| Tool Distribution | `domain-4-mcp` |
| Tool Error Handling | `domain-4-mcp` |
| Tool Interface Design | `domain-4-mcp` |
| Tool Output Structure | `domain-4-mcp` |
| Tool Result Semantics | `domain-4-mcp` |
| Batch Processing | `domain-5-context` |
| Context Prioritization Strategies | `domain-5-context` |
| Context Provision Methods | `domain-5-context` |
| Context Window Optimization | `domain-5-context` |
| Conversation Context Management | `domain-5-context` |
| Conversation Memory Strategies | `domain-5-context` |
| Multi-turn Guideline Adherence | `domain-5-context` |
| Session Context Isolation | `domain-5-context` |
| Session Persistence | `domain-5-context` |

Unmapped topic → abort with `ERROR: unknown raw.topic "<T>" — extend Topic Map in .claude/commands/cca-f-answer-raw.md`.

## ScenarioId Alias Table (raw.scenarioId → bank scenario)

Supportive hint only; stem inference wins when they disagree. Observed raw scenarioIds: `{1, 3, 11, 12, 13, 15, 16, 17, 18}`.

| Raw scenarioId | Bank scenario | Rationale |
|---|---|---|
| 1 | `"1"` | Direct — customer-support framing |
| 3 | `"3"` | Direct — multi-agent research |
| 11 | `"2"` | Claude Code config / plan-mode / CLAUDE.md family |
| 12 | `"4"` | MCP + tool-design / Developer Productivity |
| 13 | `"2"` | Codebase exploration / task decomposition |
| 15 | `"1"` | HITL safeguards within customer-support framing |
| 16 | `"5"` | CI/CD feedback loops, test quality |
| 17 | `"6"` | Structured extraction, batch, human review |
| 18 | `"1"` | Conversation-context heavy; customer-support shape |

Unseen scenarioId → log `scenario_alias_missing` warning; rely solely on stem inference.

## Non-goals

- **Does not generate new questions.** Stems and distractors come from the raw dump; the skill only fills in answers, explanations, domain, scenario, and id.
- **Does not merge into `bank.json`.** That's `/cca-f-verify-questions`' job (adversarial separation).
- **Does not mutate `raw/`.** Raw is immutable per `CLAUDE.md`.
- **Does not relax the verifier.** Verifier already accepts `source: "mix"` and `id` prefix `mix-`.

## See also

- Verify: `.claude/commands/cca-f-verify-questions.md`
- Generate (from scratch, not from raw dump): `.claude/commands/cca-f-generate-questions.md`
- Bank shape: `public/exams/cca-f/bank.json`
- Substrate: `certs/cca-f/_scenarios.md`, `_quick-reference.md`, `domain-*/anti-patterns.md`
