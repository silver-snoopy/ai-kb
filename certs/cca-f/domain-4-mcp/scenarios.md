---
cert: cca-f
domain: domain-4-mcp
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios]
---

# Domain 2 (vault: domain-4-mcp) — Tool Design & MCP: Scenario Deep Dives

Scenarios from the CCA-F scenarios page whose "Domains tested" line includes D2 (Tool Design & MCP).

## Scenario 1 — Customer Support Resolution Agent

**Setup:** Design an AI-powered customer support agent that handles inquiries, resolves issues, and escalates complex cases.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Tool failure reporting (structured errors)**
  - CORRECT: Return structured errors with category, retryable flag, and context so the agent can decide recovery path
  - ANTI-PATTERN: Generic 'operation failed' messages that leave the agent with no recovery signal

### This domain's angle

Tests structured error responses from tool failures. When a refund/lookup tool errors, the response shape determines whether the agent can retry, escalate, or try an alternative.

### Exam strategy

For D2 in this scenario: pick the option with structured error metadata (errorCategory, isRetryable) over raw strings.

---

## Scenario 4 — Developer Productivity with Claude

**Setup:** Build developer tools using the Claude Agent SDK with built-in tools and MCP servers.

### Architectural decisions (CORRECT vs ANTI-PATTERN)

- **Agent has 18 tools and selects the wrong one**
  - CORRECT: Reduce to 4-5 tools per agent, distribute the rest across specialized subagents
  - ANTI-PATTERN: Making tool descriptions longer, fine-tuning the model, or switching to a larger model
- **Built-in tool selection for reading a config file**
  - CORRECT: Read tool (purpose-built for file reading)
  - ANTI-PATTERN: Bash('cat config.json') — never use Bash when a dedicated tool exists
- **Project-level MCP server configuration**
  - CORRECT: .mcp.json with ${ENV_VAR} for secrets, version-controlled for the team
  - ANTI-PATTERN: ~/.claude.json (personal only) or hardcoding API keys in config files
- **Write vs Edit**
  - CORRECT: Edit for targeted changes to existing files (preserves unchanged content)
  - ANTI-PATTERN: Write replaces the ENTIRE file — using it on existing files loses content you did not include

### This domain's angle

Tests tool distribution (4-5 per agent optimal), built-in tool selection (Read/Write/Edit/Bash/Grep/Glob), MCP configuration and secrets management, and tool description best practices.

### Exam strategy

This scenario is almost entirely D2. Memorize the 6 built-in tools and when to use each. The "18 tools" question is almost guaranteed — always distribute across subagents. Never use Bash when a built-in tool exists. Hardcoded API keys is always wrong.
