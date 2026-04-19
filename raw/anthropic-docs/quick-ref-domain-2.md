# Quick Reference: Domain 2 — Tool Design & MCP Integration (18%)

## Tool Description Design

Tool descriptions are the primary mechanism Claude uses to select which tool to call. They matter more than tool names.

What to include in a tool description:

- What the tool does (one sentence)
- Expected input formats and constraints
- What it returns (shape of the response)
- Boundary conditions (what it does NOT do)
- Example queries that would trigger this tool

**Optimisation sequence:** Enhance descriptions first → add few-shot examples → consolidate tools. Never start by reducing the number of tools — start by making descriptions clearer.

## Schema Design Rules

- 4–5 tools per agent maximum. More tools increase selection errors.
- Use descriptive parameter names — `customer_email` not `email`, `order_date_range` not `range`.
- Mark parameters as required only when truly mandatory. Optional parameters with defaults reduce friction.
- Use enum types for constrained choices — they guide the model better than freeform strings.
- Expand descriptions before consolidating tools. If Claude misselects a tool, the first fix is a better description, not fewer tools.

## tool_choice Modes

| Mode | Behaviour | Use When |
|---|---|---|
| auto | Model decides whether to call a tool | Default for most agentic loops |
| any | Model must call at least one tool (chooses which) | Force tool use when you know a tool is needed |
| tool (forced) | Model must call a specific named tool | Guaranteed schema compliance; structured output extraction |

**Key exam point:** Use `tool_choice: { type: "tool", name: "extract_data" }` when you need guaranteed structured output. This forces Claude to produce output matching the tool's schema every time.

`auto` is the correct default for agentic loops — the model needs freedom to decide when to call tools and when to respond with text.

## MCP Architecture

Three-layer model: Client ↔ Host ↔ Server

| Layer | Role | Example |
|---|---|---|
| Client | Connects to servers, routes tool calls | Claude Desktop, IDE extension |
| Host | Application managing client lifecycle | The desktop app process itself |
| Server | Exposes tools, resources, prompts | A database connector, file system server |

**Protocol:** JSON-RPC 2.0 over stdio or HTTP/SSE.

**Configuration files:**

- `.mcp.json` in project root — project-level MCP servers (shared with team)
- `~/.claude.json` — personal/global MCP servers (not committed)

**Key rule:** Use community MCP servers first. Only build custom servers when no community server meets your requirements.

## Tool Error Handling

Structured error metadata (the exam-tested pattern):

```json
{
  "errorCategory": "authentication" | "not_found" | "rate_limit" | "validation" | "internal",
  "isRetryable": true | false,
  "retryAfterMs": 5000,
  "partialResult": { ... },
  "suggestion": "Check API key permissions"
}
```

**Critical distinction:**

- **Access failure** (auth error, network timeout) → Retry or escalate. Something went wrong.
- **Valid empty result** (search returned 0 results) → Accept. The absence of data IS the answer.

Never treat a valid empty result as an error. Never silently swallow an access failure.

## Tool Selection in Claude Code

| Tool | Purpose | Use When |
|---|---|---|
| Grep | Search file contents by pattern | Looking for code patterns, string occurrences |
| Glob | Find files by name/path pattern | Looking for files by extension or naming convention |
| Read | Read a specific file | You know the exact file path |
| Edit | Modify file contents | Making targeted changes to existing files |
| Bash | Run shell commands | Build, test, git operations, anything not covered above |

**Selection principle:** Use the most specific tool. Grep for content search, Glob for file discovery, Read for known files. Avoid Bash for tasks that specialised tools handle better.

## Decision Rules for the Exam

| If the question says... | The answer is likely... |
|---|---|
| "Claude keeps picking the wrong tool" | Improve tool descriptions first |
| "guaranteed structured output" | Forced tool_choice with specific tool name |
| "model should decide which tool" | tool_choice: auto |
| "must call a tool but can choose which" | tool_choice: any |
| "search returned no results" | Valid empty result — accept it |
| "API returned 401/timeout" | Access failure — retry or escalate |
| "too many tools, selection errors" | Scope to 4–5 per agent, improve descriptions |
| "need a custom MCP server" | Check community servers first |
| "project-wide MCP config" | .mcp.json in project root |
| "personal MCP config" | ~/.claude.json |

## Common Exam Traps

| Trap | Correct Answer |
|---|---|
| "Reduce tools to fix misselection" | Wrong first step — improve descriptions first |
| "tool_choice: any guarantees a specific tool" | Wrong — any forces a tool call, not a specific one |
| "MCP servers connect directly to each other" | Wrong — all communication goes through the client/host |
| "Empty search results mean the tool failed" | Wrong — absence of data is a valid result |
| "Return generic error string from tools" | Wrong — return structured metadata (category, retryable, suggestion) |
| "Build a custom MCP server for common integrations" | Wrong — check community servers first |
| "Tool name is the primary selection signal" | Wrong — tool description is the primary signal |
