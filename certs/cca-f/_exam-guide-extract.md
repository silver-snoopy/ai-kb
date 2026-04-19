---
cert: cca-f
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, exam-guide]
---

# CCA-F Official Exam Guide — Structured Extract

Condensed reference distilled from the official Anthropic exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`, v0.1, Feb 10 2025).

## Introduction & target candidate

The Claude Certified Architect — Foundations certification validates that practitioners can make informed tradeoff decisions when implementing real-world solutions with Claude. The exam tests foundational knowledge across **Claude Code**, the **Claude Agent SDK**, the **Claude API**, and **Model Context Protocol (MCP)** — the core technologies used to build production-grade applications with Claude. Questions are grounded in realistic customer scenarios (agentic customer support, multi-agent research pipelines, Claude Code in CI/CD, developer-productivity tooling, structured data extraction).

The ideal candidate is a solution architect with **6+ months hands-on experience** building with Claude APIs, Agent SDK, Claude Code, and MCP. They can build agentic applications (multi-agent orchestration, subagent delegation, tool integration, lifecycle hooks), configure Claude Code for team workflows (CLAUDE.md, Agent Skills, MCP servers, plan mode), design MCP tool/resource interfaces, engineer prompts for reliable structured output, manage context windows across long interactions, integrate Claude into CI/CD, and make sound escalation/reliability decisions.

Candidates must demonstrate not only conceptual knowledge but practical judgment about architecture, configuration, and tradeoffs in production deployments.

## 5 domains at a glance

| Vault folder | Exam-guide name | Weight | 1-sentence purpose |
|---|---|---|---|
| `domain-1-agentic/` | Domain 1: Agentic Architecture & Orchestration | 27% | Design agentic loops, orchestrate multi-agent coordinator-subagent systems, apply hooks, manage sessions/forks, and decompose complex tasks. |
| `domain-4-mcp/` | Domain 2: Tool Design & MCP Integration | 18% | Design unambiguous tool interfaces, structured error responses, scoped tool distribution, and configure MCP servers into Claude Code and agent workflows. |
| `domain-2-claude-code/` | Domain 3: Claude Code Configuration & Workflows | 20% | Configure CLAUDE.md hierarchies, slash commands, skills, path-specific rules, plan mode vs direct execution, iterative refinement, and CI/CD integration. |
| `domain-3-prompt-engineering/` | Domain 4: Prompt Engineering & Structured Output | 20% | Write explicit prompts, apply few-shot patterns, enforce schemas via tool_use, implement validation/retry loops, design batch processing, and multi-instance review. |
| `domain-5-context/` | Domain 5: Context Management & Reliability | 15% | Preserve critical information across long interactions, design escalation patterns, propagate errors across agents, explore large codebases, calibrate human review, and preserve provenance. |

The exam presents **4 scenarios at random from a pool of 6**: (1) Customer Support Resolution Agent, (2) Code Generation with Claude Code, (3) Multi-Agent Research System, (4) Developer Productivity with Claude, (5) Claude Code for CI, (6) Structured Data Extraction.

## Sample questions (12) — cross-reference

One-line index into each `official-sample-questions.md` file. Questions are grouped by the scenario they appear under in the guide and mapped to the vault folder for their primary tested domain.

- `official-domain-1-agentic-01` — "Production data shows that in 12% of cases..." (programmatic prerequisite for get_customer before lookup_order/process_refund)
- `official-domain-4-mcp-01` — "Production logs show the agent frequently calls get_customer when users ask about orders..." (improve tool descriptions to differentiate similar tools)
- `official-domain-5-context-01` — "Your agent achieves 55% first-contact resolution..." (explicit escalation criteria with few-shot examples)
- `official-domain-2-claude-code-01` — "You want to create a custom /review slash command..." (project-scoped `.claude/commands/`)
- `official-domain-2-claude-code-02` — "You've been assigned to restructure the team's monolithic application into microservices..." (plan mode for architectural decisions)
- `official-domain-2-claude-code-03` — "Your codebase has distinct areas with different coding conventions..." (`.claude/rules/` with YAML glob patterns)
- `official-domain-1-agentic-02` — "After running the system on the topic 'impact of AI on creative industries'..." (coordinator decomposition too narrow)
- `official-domain-5-context-02` — "The web search subagent times out while researching a complex topic..." (structured error context for coordinator recovery)
- `official-domain-4-mcp-02` — "During testing, you observe that the synthesis agent frequently needs to verify specific claims..." (scoped `verify_fact` tool with fallback to coordinator)
- `official-domain-2-claude-code-04` — "Your pipeline script runs `claude \"Analyze this pull request...\"` but the job hangs indefinitely..." (`-p` / `--print` flag)
- `official-domain-3-prompt-engineering-01` — "Your team wants to reduce API costs for automated analysis..." (Message Batches API only for overnight reports, not blocking pre-merge checks)
- `official-domain-3-prompt-engineering-02` — "A pull request modifies 14 files across the stock tracking module..." (split into per-file local passes plus a separate integration pass)

## Recommended study resources

The exam guide recommends these preparation strategies (all hands-on):

- **Build an agent with the Claude Agent SDK** — implement a complete agentic loop with tool calling, error handling, and session management; practice spawning subagents and passing context between them.
- **Configure Claude Code for a real project** — set up CLAUDE.md with a configuration hierarchy, create path-specific rules in `.claude/rules/`, build custom skills with frontmatter options (`context: fork`, `allowed-tools`), and integrate at least one MCP server.
- **Design and test MCP tools** — write tool descriptions that clearly differentiate similar tools; implement structured error responses with error categories and retryable flags; test tool selection reliability with ambiguous requests.
- **Build a structured data extraction pipeline** — use `tool_use` with JSON schemas, implement validation-retry loops, design schemas with optional/nullable fields, practice batch processing with the Message Batches API.
- **Practice prompt engineering techniques** — write few-shot examples for ambiguous scenarios; define explicit review criteria to reduce false positives; design multi-pass review architectures for large code reviews.
- **Study context management patterns** — extract structured facts from verbose tool outputs, implement scratchpad files for long sessions, design subagent delegation to manage context limits.
- **Review escalation and human-in-the-loop patterns** — know when to escalate (policy gaps, customer requests, inability to progress) vs resolve autonomously; design human review workflows with confidence-based routing.
- **Complete the Practice Exam** — the practice exam covers the same scenarios and question format as the real exam and shows explanations after each answer.

Four concrete preparation exercises are detailed in the guide: (1) build a multi-tool agent with escalation logic, (2) configure Claude Code for a team development workflow, (3) build a structured data extraction pipeline, (4) design and debug a multi-agent research pipeline.

## Exam logistics

- **Questions:** 60 scenario-based multiple-choice (each with one correct answer and three distractors)
- **Time:** 120 minutes
- **Cost:** $99 USD
- **Scoring:** scaled 100–1000; minimum passing score **720**
- **Format:** pass/fail designation; unanswered questions score as incorrect (no guessing penalty)
- **Scenarios at exam time:** 4 of the 6 scenarios above, chosen at random
- **Guide version:** 0.1, last updated Feb 10 2025
