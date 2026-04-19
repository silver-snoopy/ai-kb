---
cert: cca-f
status: done
source: 2026-04-18-scenarios-deep-dive
tags: [seeded, scenarios, overview]
---

# CCA-F Scenarios — Unified Deep Dive

All 6 scenarios from the CCA-F scenarios page. The exam randomly selects 4 of these 6.

**Domain mapping used below (vault folder slugs):**
- D1 Agentic → `domain-1-agentic`
- D2 Tool Design & MCP → `domain-4-mcp`
- D3 Claude Code → `domain-2-claude-code`
- D4 Prompt Engineering → `domain-3-prompt-engineering`
- D5 Context & Reliability → `domain-5-context`

---

## Scenario 1 — Customer Support Resolution Agent

**Setup:** Design an AI-powered customer support agent that handles inquiries, resolves issues, and escalates complex cases. Tests Agent SDK usage, MCP tools, and escalation logic.

### CORRECT / ANTI-PATTERN pairs

- **Agentic loop termination**
  - CORRECT: Check stop_reason: continue on 'tool_use', exit on 'end_turn'
  - ANTI-PATTERN: Parsing assistant text for 'done' or 'complete' keywords
- **Enforcing a $500 refund limit**
  - CORRECT: PostToolUse hook that programmatically blocks refund tool calls above $500 and escalates
  - ANTI-PATTERN: Adding 'never process refunds above $500' to the system prompt
- **When to escalate to human**
  - CORRECT: Escalate on explicit customer request, policy gaps, capability limits, business thresholds
  - ANTI-PATTERN: Escalating based on negative sentiment or self-reported low confidence
- **Preserving customer details in long conversations**
  - CORRECT: Immutable 'case facts' block at the start of context with name, account ID, order, amounts
  - ANTI-PATTERN: Progressive summarization that silently loses critical specifics over multiple rounds

**Domains tested:** `domain-1-agentic`, `domain-4-mcp`, `domain-5-context`

**Exam strategy:** Focus on hook-based enforcement (not prompts) and case facts (not summarization). Every escalation question will try to trick you with sentiment-based triggers.

---

## Scenario 2 — Code Generation with Claude Code

**Setup:** Configure Claude Code for a development team workflow. Tests CLAUDE.md configuration, plan mode, slash commands, and iterative refinement strategies.

### CORRECT / ANTI-PATTERN pairs

- **Where team coding standards go**
  - CORRECT: .claude/CLAUDE.md (project-level, version-controlled, shared with team)
  - ANTI-PATTERN: ~/.claude/CLAUDE.md (user-level, personal only) or inline code comments
- **Plan mode vs direct execution**
  - CORRECT: Plan mode for multi-file architectural changes; direct execution for simple, well-defined fixes
  - ANTI-PATTERN: Always using plan mode (wasteful for simple tasks) or never using it (risky for complex changes)
- **Complex refactoring that needs isolation**
  - CORRECT: Use a skill with context: fork and allowed-tools restrictions
  - ANTI-PATTERN: Using a simple command that runs in the main session context, polluting it with exploration noise
- **Best iterative refinement strategy**
  - CORRECT: TDD iteration: write failing test, implement, verify, refine while keeping tests green
  - ANTI-PATTERN: Vague instructions like 'make it better' without concrete verification criteria

**Domains tested:** `domain-2-claude-code`, `domain-3-prompt-engineering`

**Exam strategy:** Know the three configuration layers, commands vs skills, TDD iteration. The exam loves to test whether you put personal prefs in project config.

---

## Scenario 3 — Multi-Agent Research System

**Setup:** Build a coordinator-subagent system for parallel research tasks. Tests multi-agent orchestration, context passing, error propagation, and result synthesis.

### CORRECT / ANTI-PATTERN pairs

- **Architecture for parallel research**
  - CORRECT: Hub-and-spoke: coordinator delegates to specialized subagents with isolated contexts
  - ANTI-PATTERN: Flat architecture where all agents share a global state or full conversation history
- **Passing context to subagents**
  - CORRECT: Pass ONLY the context relevant to each subagent's specific task
  - ANTI-PATTERN: Sharing the full coordinator conversation history with every subagent
- **Handling conflicting data from different subagents**
  - CORRECT: Track information provenance (source, confidence, timestamp) and resolve based on reliability
  - ANTI-PATTERN: Arbitrarily choosing one result or averaging conflicting values without provenance
- **Handling subagent failures**
  - CORRECT: Structured error propagation: report what was attempted, error type, distinguish access failure from empty result
  - ANTI-PATTERN: Silently returning empty results for failed lookups or generic 'operation failed' errors

**Domains tested:** `domain-1-agentic`, `domain-5-context`

**Exam strategy:** Hardest scenario. Key traps: sharing full context with subagents (always wrong), silently dropping subagent failures (always wrong), ignoring provenance when resolving conflicts.

---

## Scenario 4 — Developer Productivity with Claude

**Setup:** Build developer tools using the Claude Agent SDK with built-in tools and MCP servers. Tests tool selection, codebase exploration, and code generation workflows.

### CORRECT / ANTI-PATTERN pairs

- **Agent has 18 tools and selects the wrong one**
  - CORRECT: Reduce to 4-5 tools per agent, distribute the rest across specialized subagents
  - ANTI-PATTERN: Making tool descriptions longer, fine-tuning the model, or switching to a larger model
- **Built-in tool for reading a config file**
  - CORRECT: Read tool (purpose-built for file reading)
  - ANTI-PATTERN: Bash('cat config.json') — never use Bash when a dedicated tool exists
- **Project-level MCP server configuration**
  - CORRECT: .mcp.json with ${ENV_VAR} for secrets, version-controlled for the team
  - ANTI-PATTERN: ~/.claude.json (personal only) or hardcoding API keys in config files
- **Write vs Edit**
  - CORRECT: Edit for targeted changes to existing files (preserves unchanged content)
  - ANTI-PATTERN: Write replaces the ENTIRE file — using it on existing files loses content you did not include

**Domains tested:** `domain-4-mcp`

**Exam strategy:** Memorize the 6 built-in tools. The "18 tools" question is almost guaranteed. Never use Bash when a built-in tool exists.

---

## Scenario 5 — Claude Code for CI/CD

**Setup:** Integrate Claude Code into continuous integration and delivery pipelines. Tests -p flag usage, structured output, batch API, and multi-pass code review.

### CORRECT / ANTI-PATTERN pairs

- **Running Claude Code in a CI pipeline**
  - CORRECT: Use -p flag for non-interactive mode with --output-format json for structured results
  - ANTI-PATTERN: Running in interactive mode or piping commands via stdin
- **Reviewing code that Claude generated**
  - CORRECT: Use a SEPARATE session for review (fresh context, no confirmation bias)
  - ANTI-PATTERN: Same-session self-review where the reviewer retains the generator's reasoning
- **Nightly code audit: synchronous or batch?**
  - CORRECT: Message Batches API for non-urgent tasks (50% cost savings, processes within 24h)
  - ANTI-PATTERN: Synchronous requests for non-urgent tasks (2x the cost with no benefit)
- **Enforcing structured output from review**
  - CORRECT: --json-schema flag to enforce specific output shape for automated processing
  - ANTI-PATTERN: Parsing unstructured text output from the review with regex

**Domains tested:** `domain-2-claude-code`, `domain-3-prompt-engineering`

**Exam strategy:** Three facts: (1) -p for non-interactive, (2) NEVER self-review in the same session, (3) Batch API for non-urgent = 50% savings.

---

## Scenario 6 — Structured Data Extraction

**Setup:** Build a structured data extraction pipeline from unstructured documents. Tests JSON schemas, tool_use, validation-retry loops, and few-shot prompting.

### CORRECT / ANTI-PATTERN pairs

- **Guaranteeing structured JSON output**
  - CORRECT: tool_use with JSON schema + tool_choice forcing a specific tool
  - ANTI-PATTERN: Prompting 'output as JSON' (not guaranteed) or post-processing with regex (fragile)
- **Does tool_use guarantee correctness?**
  - CORRECT: No — tool_use guarantees STRUCTURE only. Validate SEMANTICS separately with business rules.
  - ANTI-PATTERN: Assuming tool_use output is always correct because it matched the schema
- **Extraction validation fails**
  - CORRECT: Append SPECIFIC error details (which field, what's wrong) and retry
  - ANTI-PATTERN: Generic retry: 'there were errors, try again' (no signal for what to fix)
- **Ambiguous document types**
  - CORRECT: Include 'other' enum value + document_type_detail field for edge cases; use 2-4 few-shot examples covering edge cases
  - ANTI-PATTERN: Rigid enum without 'other' category (forces misclassification of unexpected types)

**Domains tested:** `domain-3-prompt-engineering`, `domain-5-context`

**Exam strategy:** tool_use guarantees STRUCTURE, NOT semantics. Every question about extraction reliability tests this. Validation retries need SPECIFIC errors.
