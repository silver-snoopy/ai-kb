---
cert: cca-f
domain: domain-4-mcp
status: done
source: 2026-04-18-anti-patterns
tags: [seeded, anti-patterns]
---

# Domain 2 (vault folder: domain-4-mcp) — Tool Design & MCP: Anti-Patterns

D2 — Tool Design & MCP (4 patterns).

### Generic error messages ('Operation failed') (CRITICAL)

**Why wrong:** The agent cannot decide whether to retry, try an alternative, or escalate without details.

**Correct approach:** Return structured errors: isError, errorCategory, isRetryable, and context

**Why correct works:** Structured errors give the agent enough information to make intelligent recovery decisions.

### Silently returning empty results for access failures (CRITICAL)

**Why wrong:** The agent thinks 'no results found' when the real problem is 'could not even check.' This leads to catastrophic misunderstandings.

**Correct approach:** Distinguish access failures (isError: true) from genuinely empty results (isError: false, results: [])

**Why correct works:** The agent knows whether data is missing because it was not found vs. because the search failed.

### Giving one agent 18+ tools (HIGH)

**Why wrong:** Tool selection accuracy degrades rapidly above 5 tools. Similar tools create ambiguity.

**Correct approach:** Keep 4-5 tools per agent. Distribute the rest across specialized subagents.

**Why correct works:** Focused agents with fewer tools make better selections and produce higher quality results.

### Hardcoding API keys in .mcp.json configuration (CRITICAL)

**Why wrong:** Configuration files are committed to git. Hardcoded secrets get leaked.

**Correct approach:** Use ${ENV_VAR} environment variable expansion in MCP config

**Why correct works:** Secrets stay in the environment, not in version-controlled files.
