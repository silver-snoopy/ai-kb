---
cert: cca-f
domain: domain-2-claude-code
status: done
source: 2026-04-18-anti-patterns
tags: [seeded, anti-patterns]
---

# Domain 3 (vault folder: domain-2-claude-code) — Claude Code Config: Anti-Patterns

D3 — Claude Code Config (3 patterns).

### Putting personal preferences in project-level CLAUDE.md (MEDIUM)

**Why wrong:** Personal preferences (editor settings, themes) should not be imposed on the whole team.

**Correct approach:** Use ~/.claude/CLAUDE.md for personal prefs, .claude/CLAUDE.md for team standards

**Why correct works:** Each configuration layer has a specific purpose and audience.

### Using commands for complex tasks that need context isolation (HIGH)

**Why wrong:** Commands run in the current session context, polluting it with exploration noise.

**Correct approach:** Use skills with context: fork and allowed-tools restrictions

**Why correct works:** Forked context keeps exploration separate. Tool restrictions prevent accidental side effects.

### Same-session self-review in CI/CD pipelines (CRITICAL)

**Why wrong:** The reviewer retains the generator's reasoning context, creating confirmation bias.

**Correct approach:** Use separate sessions for code generation and code review

**Why correct works:** A fresh session reviews the code objectively with no preconceptions.
