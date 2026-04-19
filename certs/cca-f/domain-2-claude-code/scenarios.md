---
cert: cca-f
domain: domain-2-claude-code
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios]
---

# Domain 3 (vault: domain-2-claude-code) — Claude Code: Scenario Deep Dives

Scenarios from the CCA-F scenarios page whose "Domains tested" line includes D3 (Claude Code).

## Scenario 2 — Code Generation with Claude Code

**Setup:** Configure Claude Code for a development team workflow.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Where team coding standards go**
  - CORRECT: .claude/CLAUDE.md (project-level, version-controlled, shared with team)
  - ANTI-PATTERN: ~/.claude/CLAUDE.md (user-level, personal only) or inline code comments
- **Plan mode vs direct execution**
  - CORRECT: Plan mode for multi-file architectural changes; direct execution for simple, well-defined fixes
  - ANTI-PATTERN: Always using plan mode (wasteful for simple tasks) or never using it (risky for complex changes)
- **Complex refactoring that needs isolation**
  - CORRECT: Use a skill with context: fork and allowed-tools restrictions
  - ANTI-PATTERN: Using a simple command that runs in the main session context, polluting it with exploration noise

### This domain's angle

Tests CLAUDE.md hierarchy (user vs project vs directory), commands vs skills (isolation and tool restriction), plan mode for complex tasks.

### Exam strategy

Know the three configuration layers, when to use commands vs skills. The exam loves to test whether you put personal prefs in project config.

---

## Scenario 5 — Claude Code for CI/CD

**Setup:** Integrate Claude Code into continuous integration and delivery pipelines.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Running Claude Code in a CI pipeline**
  - CORRECT: Use -p flag for non-interactive mode with --output-format json for structured results
  - ANTI-PATTERN: Running in interactive mode or piping commands via stdin
- **Reviewing code that Claude generated**
  - CORRECT: Use a SEPARATE session for review (fresh context, no confirmation bias)
  - ANTI-PATTERN: Same-session self-review where the reviewer retains the generator's reasoning
- **Nightly code audit: synchronous or batch?**
  - CORRECT: Message Batches API for non-urgent tasks (50% cost savings, processes within 24h)
  - ANTI-PATTERN: Synchronous requests for non-urgent tasks (2x the cost with no benefit)

### This domain's angle

Tests -p flag and --output-format json for CI/CD, session isolation (generator vs reviewer), and Batch API for non-urgent processing (50% savings).

### Exam strategy

Three facts to memorize: (1) -p for non-interactive, (2) NEVER self-review in the same session, (3) Batch API for non-urgent = 50% savings.
