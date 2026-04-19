Home
Claude Certified Architect Foundations
Scenario Walkthroughs
6 Exam Scenarios — Deep Dive

The exam randomly selects 4 of these 6 scenarios. Each walkthrough covers the key architectural decisions, correct approaches, common anti-patterns, and which domains are tested.

4 of 6 appear on your exam
~20 min read
JUMP TO SCENARIO
1
Customer Support Resolution Agent
2
Code Generation with Claude Code
3
Multi-Agent Research System
4
Developer Productivity with Claude
5
Claude Code for CI/CD
6
Structured Data Extraction

Scenario 1
Customer Support Resolution Agent

Design an AI-powered customer support agent that handles inquiries, resolves issues, and escalates complex cases. Tests Agent SDK usage, MCP tools, and escalation logic.

Agent SDK implementation
Escalation pattern design
Hook-based compliance enforcement
Structured error handling
KEY ARCHITECTURAL DECISIONS

How should the agentic loop terminate?

CORRECT

Check stop_reason: continue on 'tool_use', exit on 'end_turn'

ANTI-PATTERN

Parsing assistant text for 'done' or 'complete' keywords

How to enforce a $500 refund limit?

CORRECT

PostToolUse hook that programmatically blocks refund tool calls above $500 and escalates

ANTI-PATTERN

Adding 'never process refunds above $500' to the system prompt

When should the agent escalate to a human?

CORRECT

Escalate on: explicit customer request, policy gaps, capability limits, business thresholds

ANTI-PATTERN

Escalating based on negative sentiment or self-reported low confidence

How to preserve customer details in long conversations?

CORRECT

Immutable 'case facts' block at the start of context with name, account ID, order, amounts

ANTI-PATTERN

Progressive summarization that silently loses critical specifics over multiple rounds

DOMAINS TESTED
D1: Agentic loop control via stop_reason
D1: Hooks for deterministic business rule enforcement
D2: Structured error responses from tool failures
D5: Case facts blocks for context preservation
EXAM STRATEGY

This scenario tests the intersection of agentic architecture and reliability. Focus on hook-based enforcement (not prompts) and case facts (not summarization). Every escalation question will try to trick you with sentiment-based triggers.

Scenario 2
Code Generation with Claude Code

Configure Claude Code for a development team workflow. Tests CLAUDE.md configuration, plan mode, slash commands, and iterative refinement strategies.

CLAUDE.md hierarchy setup
Plan mode vs direct execution
Custom slash commands and skills
TDD iteration pattern
KEY ARCHITECTURAL DECISIONS

Where should team coding standards go?

CORRECT

.claude/CLAUDE.md (project-level, version-controlled, shared with team)

ANTI-PATTERN

~/.claude/CLAUDE.md (user-level, personal only) or inline code comments

When to use plan mode vs direct execution?

CORRECT

Plan mode for multi-file architectural changes; direct execution for simple, well-defined fixes

ANTI-PATTERN

Always using plan mode (wasteful for simple tasks) or never using it (risky for complex changes)

How to handle complex refactoring that needs isolation?

CORRECT

Use a skill with context: fork and allowed-tools restrictions

ANTI-PATTERN

Using a simple command that runs in the main session context, polluting it with exploration noise

Best iterative refinement strategy?

CORRECT

TDD iteration: write failing test, implement, verify, refine while keeping tests green

ANTI-PATTERN

Vague instructions like 'make it better' without concrete verification criteria

DOMAINS TESTED
D3: CLAUDE.md hierarchy (user vs project vs directory)
D3: Commands vs skills (isolation and tool restriction)
D3: Plan mode for complex tasks
D4: Explicit criteria and TDD iteration for refinement
EXAM STRATEGY

This scenario is purely about Claude Code configuration. Know the three configuration layers, when to use commands vs skills, and the TDD iteration pattern. The exam loves to test whether you put personal prefs in project config.

Scenario 3
Multi-Agent Research System

Build a coordinator-subagent system for parallel research tasks. Tests multi-agent orchestration, context passing, error propagation, and result synthesis.

Hub-and-spoke architecture
Context isolation and passing
Error propagation patterns
Information provenance and synthesis
KEY ARCHITECTURAL DECISIONS

What architecture for parallel research tasks?

CORRECT

Hub-and-spoke: coordinator delegates to specialized subagents with isolated contexts

ANTI-PATTERN

Flat architecture where all agents share a global state or full conversation history

How to pass context from coordinator to subagents?

CORRECT

Pass ONLY the context relevant to each subagent's specific task

ANTI-PATTERN

Sharing the full coordinator conversation history with every subagent

How to handle conflicting data from different subagents?

CORRECT

Track information provenance (source, confidence, timestamp) and resolve based on reliability

ANTI-PATTERN

Arbitrarily choosing one result or averaging conflicting values without provenance

How to handle subagent failures?

CORRECT

Structured error propagation: report what was attempted, error type, distinguish access failure from empty result

ANTI-PATTERN

Silently returning empty results for failed lookups or generic 'operation failed' errors

DOMAINS TESTED
D1: Hub-and-spoke multi-agent orchestration
D1: Context isolation for subagents
D5: Information provenance tracking
D5: Error propagation and access failure vs empty result
EXAM STRATEGY

This is the hardest scenario. It tests multi-agent patterns deeply. The key traps are: sharing full context with subagents (always wrong), silently dropping subagent failures (always wrong), and ignoring provenance when resolving conflicts.

Scenario 4
Developer Productivity with Claude

Build developer tools using the Claude Agent SDK with built-in tools and MCP servers. Tests tool selection, codebase exploration, and code generation workflows.

Built-in tool selection (Read, Write, Bash, Grep, Glob)
MCP server integration
Codebase exploration strategies
Tool distribution across agents
KEY ARCHITECTURAL DECISIONS

Agent has 18 tools and selects the wrong one. What to do?

CORRECT

Reduce to 4-5 tools per agent, distribute the rest across specialized subagents

ANTI-PATTERN

Making tool descriptions longer, fine-tuning the model, or switching to a larger model

Which built-in tool for reading a config file?

CORRECT

Read tool (purpose-built for file reading)

ANTI-PATTERN

Bash('cat config.json') — never use Bash when a dedicated tool exists

How to configure project-level MCP servers?

CORRECT

.mcp.json with ${ENV_VAR} for secrets, version-controlled for the team

ANTI-PATTERN

~/.claude.json (personal only) or hardcoding API keys in config files

Write vs Edit for modifying an existing file?

CORRECT

Edit for targeted changes to existing files (preserves unchanged content)

ANTI-PATTERN

Write replaces the ENTIRE file — using it on existing files loses content you did not include

DOMAINS TESTED
D2: Tool distribution (4-5 per agent optimal)
D2: Built-in tool selection (Read/Write/Edit/Bash/Grep/Glob)
D2: MCP server configuration and secrets management
D2: Tool description best practices
EXAM STRATEGY

This scenario is tool-focused. Memorize the 6 built-in tools and when to use each. The '18 tools' question is almost guaranteed — always distribute across subagents. Never use Bash when a built-in tool exists.

Scenario 5
Claude Code for CI/CD

Integrate Claude Code into continuous integration and delivery pipelines. Tests -p flag usage, structured output, batch API, and multi-pass code review.

-p flag for non-interactive mode
Structured output with --output-format json
Batch API with Message Batches
Session isolation for generator vs reviewer
KEY ARCHITECTURAL DECISIONS

How to run Claude Code in a CI pipeline?

CORRECT

Use -p flag for non-interactive mode with --output-format json for structured results

ANTI-PATTERN

Running in interactive mode or piping commands via stdin

How to review code that Claude generated?

CORRECT

Use a SEPARATE session for review (fresh context, no confirmation bias)

ANTI-PATTERN

Same-session self-review where the reviewer retains the generator's reasoning

Nightly code audit: synchronous or batch?

CORRECT

Message Batches API for non-urgent tasks (50% cost savings, processes within 24h)

ANTI-PATTERN

Synchronous requests for non-urgent tasks (2x the cost with no benefit)

How to enforce structured output from review?

CORRECT

--json-schema flag to enforce specific output shape for automated processing

ANTI-PATTERN

Parsing unstructured text output from the review with regex

DOMAINS TESTED
D3: -p flag and --output-format json for CI/CD
D3: Session isolation (generator vs reviewer)
D3: Batch API for non-urgent processing (50% savings)
D4: Structured output via schemas
EXAM STRATEGY

Three facts to memorize: (1) -p for non-interactive, (2) NEVER self-review in the same session, (3) Batch API for non-urgent = 50% savings. These three cover most questions in this scenario.

Scenario 6
Structured Data Extraction

Build a structured data extraction pipeline from unstructured documents. Tests JSON schemas, tool_use, validation-retry loops, and few-shot prompting.

JSON schema design for tool_use
Validation-retry loop implementation
Few-shot prompting for format consistency
Field-level confidence and human review
KEY ARCHITECTURAL DECISIONS

How to guarantee structured JSON output from extraction?

CORRECT

tool_use with JSON schema + tool_choice forcing a specific tool

ANTI-PATTERN

Prompting 'output as JSON' (not guaranteed) or post-processing with regex (fragile)

Does tool_use guarantee correctness?

CORRECT

No — tool_use guarantees STRUCTURE only. Validate SEMANTICS separately with business rules.

ANTI-PATTERN

Assuming tool_use output is always correct because it matched the schema

What to do when extraction validation fails?

CORRECT

Append SPECIFIC error details (which field, what's wrong) and retry

ANTI-PATTERN

Generic retry: 'there were errors, try again' (no signal for what to fix)

How to handle ambiguous document types?

CORRECT

Include 'other' enum value + document_type_detail field for edge cases; use 2-4 few-shot examples covering edge cases

ANTI-PATTERN

Rigid enum without 'other' category (forces misclassification of unexpected types)

DOMAINS TESTED
D4: tool_use for structured output (structure vs semantics)
D4: Validation-retry loops with specific error feedback
D4: Few-shot prompting (2-4 examples, edge case coverage)
D5: Per-document-type accuracy tracking (stratified metrics)
EXAM STRATEGY

The critical concept here is that tool_use guarantees structure, NOT semantics. Every question about extraction reliability will test this. Also know that validation retries need SPECIFIC errors, not generic messages.

Ready to Test Your Knowledge?

Practice with scenario-based questions that mirror the real exam format.

Practice Questions
Review Anti-Patterns
