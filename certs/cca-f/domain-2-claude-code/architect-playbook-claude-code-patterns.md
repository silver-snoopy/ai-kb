---
cert: cca-f
domain: domain-2-claude-code
status: done
source: 2026-04-21-architect-playbook
tags: [playbook, claude-code, codebase-exploration, scratchpad, session-resumption]
links:
  - ../../../raw/papers/The Architect's Playbook.md
  - ../../../concepts/architecture/architect-reference-matrix.md
  - ../domain-1-agentic/architect-playbook-agentic-patterns.md
---

# Domain 2 — Claude Code: Patterns from The Architect's Playbook

Compiled from `raw/papers/The Architect's Playbook.pdf` (27-page deck, 2026). This note covers the five Domain-2 patterns directly relevant to Claude Code workflows: codebase exploration strategy, custom-tool design, scratchpad-based long-session memory, cross-session resumption, and branched exploration.

### Directed Codebase Exploration (CRITICAL)

**Anti-pattern:** Using `Read` to sequentially load thousands of lines of source code. Inefficient and context-heavy — overloads the window with unrelated data.

**Correct pattern:** **Start broad, then pinpoint.** Two context-specific flows:

- **For architecture (new engineer, 800+ files):** Read `CLAUDE.md` / `README.md` first, THEN ask the human engineer for priority files. The human's filesystem knowledge is cheaper than the agent's exhaustive scan.
- **For intermittent bugs (tracing errors):** Have the agent **dynamically generate investigation subtasks** based on what it discovers at each step, adapting the plan as new errors emerge. Don't pre-plan; the first trace reveals the real search frontier.

**Why correct works:** Reading everything upfront wastes tokens on content that turns out irrelevant. The broad-then-pinpoint strategy lets evidence gathered at each step shape the next read. *Figure p17.*

### MCP Tool Specificity (HIGH)

**Anti-pattern:** Providing a broad custom tool like `analyze_dependencies` alongside Claude Code's built-in `Grep`. The agent defaults to `Grep` because the custom tool's description doesn't clearly signal when it wins.

**Correct pattern:** Split broad tools into **highly granular, single-purpose tools** (`list_imports`, `resolve_transitive_deps`, `detect_circular_deps`). Enhance MCP tool descriptions to detail capabilities, expected outputs, and when to prefer them over text manipulation.

**Why correct works:** Claude Code's tool-selection decision is made from descriptions. Granular tools with explicit "prefer-over" language tilt the selection reliably. Same pattern applies to adopting custom refactoring tools over standard Bash/sed. *Figure p16.*

### The Scratchpad Pattern (HIGH)

**Anti-pattern:** Long exploration sessions (30+ minutes) accumulate token bloat; the agent starts giving inconsistent answers about early discoveries. Engineers report having to repeat module information across turns.

**Correct pattern:** Have the agent **actively maintain a `scratchpad.md` file** recording key findings, architectural maps, and decisions. The agent references this dense, structured file for subsequent questions rather than scanning raw message history.

**Why correct works:** The scratchpad decouples long-term memory from the context window. Messages age out of retrieval-favored positions in the context; a dedicated file stays linkable and re-readable on demand. *Figure p19.*

### Resumption in Dynamic Environments (MEDIUM)

**Anti-pattern:** Resuming an exploration session from a transcript alone. If 3 of the 12 files read yesterday were modified by a teammate's PR overnight, the agent operates on stale content without realizing it.

**Correct pattern:** Resume from previous transcript BUT explicitly inform the agent which files or functions changed, for targeted re-analysis:

```shell
resume_session --update_context={
  files:['File C', 'File D', 'File E'],
  changes: 'renamed utility functions'
}
```

**Why correct works:** Don't force a complete re-read (wastes tokens) and don't pretend nothing changed (produces wrong answers). Targeted context updates let the agent re-read only what moved. *Figure p20.*

### Branching Reality via `fork_session` (MEDIUM)

Cross-reference with [Domain 1 notes](../domain-1-agentic/architect-playbook-agentic-patterns.md). Relevance for Claude Code: use `fork_session` when exploring A/B refactoring approaches (microservice extraction vs in-place refactor) so each branch reasons under isolated context. *Figure p18.*

## Exam angle

Three canonical traps in Domain-2 questions:

1. **"Agent reads all 800 files sequentially"** → wrong. Strategy: broad entry points (README/CLAUDE.md) first, then human-guided or evidence-guided pinpoint.
2. **"Custom tool replaces Grep"** → trap if the tool is broad. Correct pattern is granular tools + enhanced descriptions.
3. **"Resume session from transcript alone"** → incomplete. Correct: resume + explicit change notification.

```question
id: playbook-domain-2-01
domain: domain-2-claude-code
scenario: "4"
difficulty: medium
stem: |
  Scenario: Developer Productivity with Claude.

  A new engineer joins a team with an 800-file codebase and asks Claude Code to "get up to speed" on the authentication system. Claude Code's default behavior is to Read files sequentially starting from the repo root. After 45 minutes, the agent has read 120 files, the context window is nearly full, and the engineer reports the agent's summaries have grown vague and contradictory. What is the most effective course correction?
options:
  A: Increase the context window by switching to a larger model so more files fit simultaneously.
  B: Instruct the agent to read CLAUDE.md and the top-level README first, then ask the engineer which 5-10 files are most relevant to authentication, and read those in depth.
  C: Have the agent compress prior reads into short summaries to free context window space for additional files.
  D: Set a hard file-read limit of 50 files per session to prevent context window saturation.
correct: B
explanation: |
  A: Larger context doesn't address the real problem — indiscriminate reading still produces vague summaries because most of what's read is irrelevant to the question.
  B: Correct. The Architect's Playbook's "Directed Codebase Exploration" pattern: start broad (CLAUDE.md/README give the map), then pinpoint with the human engineer's filesystem knowledge. The human knows which 5-10 files define the authentication system; the agent doesn't.
  C: Summarization is lossy and doesn't fix the "reading the wrong files" root problem.
  D: An arbitrary cap truncates exploration at an arbitrary point — doesn't ensure the RIGHT 50 files are read.
source-note: raw/papers/The Architect's Playbook.md (Directed Codebase Exploration, p17)
```

```question
id: playbook-domain-2-02
domain: domain-2-claude-code
scenario: "2"
difficulty: hard
stem: |
  Scenario: Code Generation with Claude Code.

  You've built a custom MCP tool `analyze_dependencies` that traces import graphs across a TypeScript monorepo, alongside Claude Code's built-in Grep. Production telemetry shows the agent invokes `Grep` for dependency questions 78% of the time, even though `analyze_dependencies` would give faster, more accurate answers. What change most reliably shifts the agent's tool selection?
options:
  A: Remove Grep from the tool list when working in TypeScript repos, forcing the agent to use analyze_dependencies.
  B: Lower the temperature parameter so the agent's tool-choice behavior becomes more deterministic.
  C: Split analyze_dependencies into granular single-purpose tools (list_imports, resolve_transitive_deps, detect_circular_deps) each with descriptions that explicitly state when to prefer them over Grep.
  D: 'Add a system prompt instruction: "Always prefer analyze_dependencies over Grep for import questions."'
correct: C
explanation: |
  A: Removing Grep breaks every non-dependency use case. Over-correction.
  B: Temperature doesn't govern tool selection strongly enough to override a description-based preference. Also doesn't address the root cause.
  C: Correct. The Playbook's "MCP Tool Specificity" pattern: granular tools WITH explicit "prefer over Grep" language in descriptions shift the agent's selection reliably because tool-selection reasoning is driven by descriptions, not catch-all tools.
  D: System prompts are probabilistic. Observed: even emphatic prompts yield 3%+ override failures; description-level changes influence selection directly and consistently.
source-note: raw/papers/The Architect's Playbook.md (MCP Tool Specificity, p16)
```

```question
id: playbook-domain-2-03
domain: domain-2-claude-code
scenario: "4"
difficulty: medium
stem: |
  Scenario: Developer Productivity with Claude.

  An engineer uses Claude Code for a 90-minute architectural deep-dive through a payment service. Around the 45-minute mark, the agent starts giving inconsistent answers about components it examined earlier — claiming a module uses Redis when it actually uses Memcached, contradicting its own earlier summary. What pattern most directly resolves this?
options:
  A: Reduce the exploration session to 20 minutes and restart with a fresh agent to avoid context decay.
  B: Have the agent maintain a scratchpad.md file recording key findings (module structures, endpoints, decisions) and reference that file for subsequent questions instead of relying on message history.
  C: Enable message compression so older conversation turns are compressed into shorter summaries automatically.
  D: Ask the agent to re-read the modules in question every time a related follow-up arises.
correct: B
explanation: |
  A: Workable but sacrifices continuity — you lose the architectural map built so far. Also doesn't solve the underlying problem for any session longer than 20 minutes.
  B: Correct. The Playbook's "Scratchpad Pattern": the agent actively maintains a dense structured file with findings, architectural maps, and decisions. Subsequent questions reference the file, not the token-decayed message history.
  C: Compression is lossy; the very details that cause contradictions (Redis vs Memcached) are the fine-grained facts most likely to be dropped or mangled.
  D: Re-reading modules costs tokens for content already analyzed and doesn't address the ROOT cause (memory loss from context bloat).
source-note: raw/papers/The Architect's Playbook.md (The Scratchpad Pattern, p19)
```

```question
id: playbook-domain-2-04
domain: domain-2-claude-code
scenario: "5"
difficulty: medium
stem: |
  Scenario: Claude Code for CI/CD.

  An engineer resumes an exploration session they paused yesterday. Overnight, a teammate's PR renamed utility functions in 3 of the 12 files the agent originally read. When asked a follow-up question, the agent confidently references the OLD function names, causing its answer to be wrong. Which resumption strategy best addresses this?
options:
  A: Force the agent to re-read all 12 files from scratch at the start of the resumed session to guarantee freshness.
  B: Just resume from the previous transcript — the agent can rely on its prior analysis since most files weren't touched.
  C: Resume from the previous transcript, but explicitly pass update_context listing which files changed and summarizing the nature of the changes ('renamed utility functions') so the agent can do targeted re-analysis.
  D: Discard the prior session entirely and start fresh with no context.
correct: C
explanation: |
  A: Wastes tokens re-reading 9 files that didn't change; also delays getting to the actual follow-up question.
  B: Produces wrong answers. The agent confidently references stale names because it has no signal anything changed.
  C: Correct. The Playbook's "Resumption in Dynamic Environments" pattern: resume_session + update_context={files:[...], changes:'...'} lets the agent do targeted re-analysis only on what moved. Cheapest AND most accurate.
  D: Destroys continuity — the foundational analysis in the prior session would all have to be redone.
source-note: raw/papers/The Architect's Playbook.md (Resumption in Dynamic Environments, p20)
```
