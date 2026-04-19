Home
Claude Certified Architect Foundations
Anti-Patterns Cheatsheet
Anti-Patterns Cheatsheet

The most common wrong answers and distractors on the Claude Certified Architect exam. Learn to spot them instantly and eliminate 2-3 options before even reading the correct answer.

10 critical
7 high priority
18 total patterns
JUMP TO DOMAIN
D1 Agentic Architecture
D2 Tool Design & MCP
D3 Claude Code Config
D4 Prompt Engineering
D5 Context & Reliability

D1
Agentic Architecture
5 patterns

Parsing natural language for loop termination
CRITICAL

Text content is for the user, not control flow. The model may phrase completion differently each time.

Check stop_reason field (tool_use vs end_turn)

stop_reason is a structured, deterministic field that reliably signals whether the agent needs to continue.

Arbitrary iteration caps as primary stopping mechanism
CRITICAL

May cut off the agent mid-task or allow it to loop pointlessly. Does not reflect task completion.

Let the agentic loop terminate naturally via stop_reason

The model decides when it is done based on task state, not an arbitrary number.

Prompt-based enforcement for critical business rules
CRITICAL

Prompts are probabilistic. The model CAN and WILL sometimes ignore critical instructions.

Use programmatic hooks (PreToolUse/PostToolUse) for deterministic enforcement

Hooks run as code, not suggestions. They provide 100% reliable enforcement.

Sentiment-based escalation to human agents
HIGH

An angry customer with a simple request does NOT need a human. Sentiment does not equal task complexity.

Escalate based on policy gaps, capability limits, explicit requests, or business thresholds

Objective criteria prevent unnecessary escalations while catching genuine edge cases.

Self-reported confidence scores for decision-making
HIGH

Model confidence scores are not well-calibrated and cannot be relied upon for production decisions.

Use structured criteria and programmatic checks for escalation decisions

Programmatic checks based on observable facts are reliable and auditable.

D2
Tool Design & MCP
4 patterns

Generic error messages ('Operation failed')
CRITICAL

The agent cannot decide whether to retry, try an alternative, or escalate without details.

Return structured errors: isError, errorCategory, isRetryable, and context

Structured errors give the agent enough information to make intelligent recovery decisions.

Silently returning empty results for access failures
CRITICAL

The agent thinks 'no results found' when the real problem is 'could not even check.' This leads to catastrophic misunderstandings.

Distinguish access failures (isError: true) from genuinely empty results (isError: false, results: [])

The agent knows whether data is missing because it was not found vs. because the search failed.

Giving one agent 18+ tools
HIGH

Tool selection accuracy degrades rapidly above 5 tools. Similar tools create ambiguity.

Keep 4-5 tools per agent. Distribute the rest across specialized subagents.

Focused agents with fewer tools make better selections and produce higher quality results.

Hardcoding API keys in .mcp.json configuration
CRITICAL

Configuration files are committed to git. Hardcoded secrets get leaked.

Use ${ENV_VAR} environment variable expansion in MCP config

Secrets stay in the environment, not in version-controlled files.

D3
Claude Code Config
3 patterns

Putting personal preferences in project-level CLAUDE.md
MEDIUM

Personal preferences (editor settings, themes) should not be imposed on the whole team.

Use ~/.claude/CLAUDE.md for personal prefs, .claude/CLAUDE.md for team standards

Each configuration layer has a specific purpose and audience.

Using commands for complex tasks that need context isolation
HIGH

Commands run in the current session context, polluting it with exploration noise.

Use skills with context: fork and allowed-tools restrictions

Forked context keeps exploration separate. Tool restrictions prevent accidental side effects.

Same-session self-review in CI/CD pipelines
CRITICAL

The reviewer retains the generator's reasoning context, creating confirmation bias.

Use separate sessions for code generation and code review

A fresh session reviews the code objectively with no preconceptions.

D4
Prompt Engineering
3 patterns

Vague instructions like 'be thorough' or 'find all issues'
CRITICAL

Leads to over-flagging, false positives, and alert fatigue. Developers stop trusting the tool.

Provide explicit, measurable criteria: 'flag functions exceeding 50 lines'

Specific criteria produce consistent, actionable results that build trust.

Assuming tool_use guarantees semantic correctness
HIGH

tool_use guarantees STRUCTURE only. Values inside the JSON may still be wrong.

Validate extracted values after tool_use with business rule checks

Schema compliance + semantic validation together ensure both correct format AND correct content.

Generic retry messages: 'There were errors, please try again'
HIGH

Without specific error details, the model has no signal for what to fix.

Append specific error details: which field, what was wrong, expected vs actual

Specific feedback gives the model a clear correction target.

D5
Context & Reliability
3 patterns

Progressive summarization of critical customer details
CRITICAL

Each round of summarization loses specifics: names, IDs, amounts, dates.

Use immutable 'case facts' blocks positioned at the start of context

Case facts are never summarized and sit in a high-recall position (beginning of context).

Aggregate accuracy metrics only (e.g., '95% overall')
CRITICAL

Aggregate metrics mask per-category failures. Invoices at 70% while receipts at 99% still averages 95%.

Track accuracy per document type (stratified metrics)

Per-type tracking reveals hidden failures that aggregate metrics conceal.

No provenance tracking for multi-agent data
HIGH

When subagents provide conflicting data, there is no way to determine which source to trust.

Track source, confidence level, timestamp, and agent ID for all data

Provenance metadata enables informed conflict resolution and audit trails.

Quick Reference Summary

10
Critical Patterns
Most likely to appear on exam

7
High Priority
Frequently seen as distractors

18
Total Patterns
Across all 5 domains

Memorizing these anti-patterns lets you instantly eliminate 2-3 wrong answers on most exam questions.

Test Your Anti-Pattern Knowledge

See if you can spot the anti-patterns in our practice questions.

Practice Questions
Study Domain Guides
