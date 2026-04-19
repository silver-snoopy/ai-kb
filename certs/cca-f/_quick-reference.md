---
cert: cca-f
status: done
source: claudecertifications.com + claudecertificationguide.com
tags: [seeded, cheat-sheet]
---

# CCA-F Consolidated Quick Reference

Synthesized from the 5 domain cheat sheets (claudecertificationguide.com) + the domains overview page (claudecertifications.com). Organized by vault-folder slug. Decision rules and exam traps only.

**Domain weights:** D1 Agentic 27% · D2 Tool/MCP 18% · D3 Claude Code 20% · D4 Prompt 20% · D5 Context 15%

---

## domain-1-agentic (D1 Agentic Architecture & Orchestration — 27%)

### Core decision rules

- **Agentic loop termination:** Check `stop_reason`. `tool_use` → continue. `end_turn` → stop. Never parse natural language, never use `content[0].type == "text"`.
- **Iteration caps:** Safety net only, never the primary control.
- **Guardrails:** Prompts are probabilistic → hooks are deterministic. For "must", "guaranteed", "enforce", "compliance", "audit" → hooks (PreToolUse / PostToolUse).
- **Orchestration:** Parallel = independent subtasks. Sequential = each step needs prior output. Dynamic adaptive = decomposition unknown at design time. Hub-and-spoke = coordinator + specialists.
- **Agent SDK:** `AgentDefinition` + `allowedTools` (4–5 per agent max). Task tool delegates to subagents in isolated context. Handoffs do NOT inherit conversation history.
- **Subagents:** No shared memory. Pass context explicitly per task, never the full coordinator history.
- **Escalation:** Policy gaps, capability limits, explicit requests, business thresholds. NEVER sentiment or self-reported confidence.
- **Structured handoff:** Customer ID · Summary · Root cause · Recommended action.
- **Error recovery:** `fork_session` for divergent exploration; fresh start + summary injection for stale context; retry-with-error-feedback for transient failures.

### Exam traps

- "Increase iteration cap" to fix premature termination → wrong; fix the stop_reason check.
- "Subagents can read coordinator context" → wrong; always explicit passing.
- "System prompt rules guarantee compliance" → wrong; hooks guarantee.
- "One agent with many tools for simplicity" → wrong; 4–5 tools per agent.
- "Text content means agent is done" → wrong; text can coexist with `tool_use` blocks.

---

## domain-4-mcp (D2 Tool Design & MCP Integration — 18%)

### Core decision rules

- **Misselection fix order:** descriptions first → few-shot examples → consolidate tools. Never start by reducing tool count.
- **Tool description contents:** what it does, input constraints, return shape, boundaries (what it does NOT do), example triggers.
- **Schema rules:** 4–5 tools max per agent; descriptive param names; optional/default where possible; enums for constrained choices.
- **tool_choice:** `auto` = default agentic loops. `any` = model must call *some* tool. `tool` (forced with name) = guaranteed schema compliance for structured output.
- **MCP architecture:** Client ↔ Host ↔ Server over JSON-RPC 2.0 (stdio or HTTP/SSE). `.mcp.json` = project, version-controlled. `~/.claude.json` = personal.
- **Secrets:** `${ENV_VAR}` in `.mcp.json`, never hardcoded.
- **Custom MCP server:** check community servers FIRST.
- **Error handling:** structured metadata — `errorCategory`, `isRetryable`, `retryAfterMs`, `partialResult`, `suggestion`.
- **Access failure vs valid empty:** 401/timeout/429 = access failure (retry/escalate). 0 search results / empty DB = valid empty (accept).
- **Built-in tools:** Read (known path), Edit (targeted change), Grep (content search), Glob (file discovery), Write (new files only), Bash (last resort). Never use Bash when a specialized tool exists. Write overwrites entire files — use Edit on existing.

### Exam traps

- "Reduce tools" as first fix → wrong; improve descriptions first.
- "`tool_choice: any` guarantees a specific tool" → wrong; forced `tool` by name does.
- "MCP servers connect directly" → wrong; everything routes through client/host.
- "Empty results = tool failure" → wrong; valid result.
- "Tool name is the primary selection signal" → wrong; description is.

---

## domain-2-claude-code (D3 Claude Code Configuration & Workflows — 20%)

### Core decision rules

- **Configuration hierarchy (low → high priority):** `~/.claude/CLAUDE.md` (user-global) → `.claude/CLAUDE.md` (project) → `CLAUDE.md` in subdirs → `.claude/rules/*.md` (path-matched). Later overrides earlier. **Project overrides user**, not the reverse.
- **`.claude/rules/`:** YAML frontmatter with `paths:` glob list — loads conditionally, saves context.
- **Skills vs Commands:** Skills = capability modules with `allowed-tools` + `context: fork`. Commands = prompt templates with `$ARGUMENTS`, run in current session. Complex/isolated work → skills. Simple templates → commands.
- **Personal vs project:** Team standards in `.claude/CLAUDE.md` (committed). Personal prefs in `~/.claude/CLAUDE.md` (not committed).
- **Hooks:** PreToolUse (before) / PostToolUse (after). Deterministic code-level enforcement — cannot be bypassed by prompt injection.
- **Working modes:** Plan mode = complex / multi-approach / high-consequence. Direct = clear well-defined scope. `-p` flag = non-interactive (CI/CD), JSON output via `--output-format json`, structure enforced via `--json-schema`.
- **Review:** NEVER review in the session that generated the code — confirmation bias. Use a separate/fresh session.
- **Batch API for CI/CD:** 50% cost savings for non-urgent nightly work (up to 24h latency).
- **Permissions:** least-privilege via `allowedTools`; committed `.claude/` for team, `~/.claude/` for personal.

### Exam traps

- "Put all rules in project CLAUDE.md" → wrong; use `.claude/rules/` for path-specific.
- "Hooks are prompt-based guardrails" → wrong; hooks are code.
- "Same-session self-review" → wrong; use independent session.
- "Skills and commands are the same" → wrong; skills have tool restrictions and forked context.
- "User CLAUDE.md overrides project" → wrong; project has higher priority.
- "`-p` enables plan mode" → wrong; `-p` = non-interactive.

---

## domain-3-prompt-engineering (D4 Prompt Engineering & Structured Output — 20%)

### Core decision rules

- **System prompt structure:** role/context → rules → output format → calibration examples. Concrete code examples beat prose. Cached via prompt caching.
- **Severity calibration:** 2–3 examples showing critical-vs-minor. Without them, the model treats all issues equally.
- **Structured output:** forced `tool_choice: { type: "tool", name: "..." }` → schema guaranteed by API. Prompt-based JSON is prototyping only.
- **Structure vs semantics:** `tool_use` guarantees STRUCTURE only. Semantic correctness requires separate business-rule validation.
- **Fabrication prevention:** make optional fields `nullable: true` / `required: false`. Required + missing data → model will fabricate.
- **Few-shot:** 2–4 examples is the sweet spot. Include reasoning, cover edge cases. Diminishing returns past ~4.
- **Prompt chaining:** decompose into focused steps (extract → validate → format → synthesize). Use when the task has distinct phases.
- **Retry pattern:** retry-with-error-feedback = original prompt + failed output + SPECIFIC error. Never say "try again".
- **Retry vs escalate:** retry on fixable validation/format errors; escalate after >2 failures or fundamental misinterpretation.
- **Batch API:** 50% cheaper, up to 24h latency. NEVER for real-time / user-facing.
- **Self-review:** same session = biased by prior reasoning. Use a separate instance.
- **Large inputs:** per-file passes + cross-file integration pass (mitigates attention dilution).
- **Iterative refinement:** TDD (failing test → implement → verify), not vague "make it better".

### Exam traps

- "Prompt-based JSON for production" → wrong; forced tool_choice.
- "Just say 'try again'" → wrong; include specific error.
- "Batch API for faster responses" → wrong; it's cost-at-expense-of-latency.
- "Review in same conversation" → wrong; separate instance.
- "10+ few-shot examples" → wrong; 2–4.
- "Required fields prevent fabrication" → wrong; required + absent = fabrication.
- "One big prompt handles everything" → wrong when phases differ.
- "Output as JSON" prompt for guaranteed structure → wrong.

---

## domain-5-context (D5 Context Management & Reliability — 15%)

### Core decision rules

- **Progressive summarization = trap.** Each pass loses names, IDs, dates, amounts. Use immutable persistent fact blocks carried forward verbatim.
- **Case facts block:** at start of context, structured (Customer / Order / Issue / Status). Never summarized.
- **Scratchpad files:** external on-disk persistence for multi-step exploration. Survives context reset; conversation history does not.
- **Error propagation:** failure type · partial results · alternatives tried · suggested action. Never generic "something went wrong".
- **Access failure vs valid empty:** 0 results / empty set / no match = accept. 401 / timeout / 429 = retry or escalate.
- **Stratified validation:** per-type accuracy, not aggregate. An overall 95% can mask a 60% per-category failure.
- **Stratified random sampling:** draw validation samples proportionally from each category to surface novel error patterns.
- **Source attribution:** structured claim-source mappings (`{ claim, source, url, date }`) survive synthesis. Inline links get stripped.
- **Conflicting sources:** annotate both with provenance + dates; never average, never silently pick one.
- **Information provenance for multi-agent:** source, confidence, timestamp, agent ID for all data.
- **Monitoring:** per-type error rates, calibration curves, context utilization, retry success rates. Alert on per-category drops, not just overall drops.
- **Context window strategies:** persistent fact blocks, scratchpad files, per-file + integration passes, fresh start + summary injection, prompt caching.
- **Context pressure signals:** repetition, contradictions, ignoring recent info → fresh start, not "more context".

### Exam traps

- "Summarize the conversation to save context" → wrong; persistent fact blocks.
- "95% overall = reliable" → wrong; check per-type.
- "Pick the more recent source" → wrong; annotate both, let consumer decide.
- "No results found, try again" → wrong when legitimately empty.
- "Inline citations are sufficient" → wrong for production; use structured mappings.
- "Monitor overall error rate" → wrong; per-type error rates.
- "Keep all context in conversation history" → wrong; scratchpad files for cross-boundary persistence.
