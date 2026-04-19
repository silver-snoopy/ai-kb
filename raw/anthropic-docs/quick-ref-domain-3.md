# Quick Reference: Domain 3 — Claude Code Configuration & Workflows (20%)

## Configuration Hierarchy

Settings are loaded in this order, with later entries overriding earlier ones:

| Priority | Location | Scope | Committed to Git? |
|---|---|---|---|
| 1 (lowest) | `~/.claude/CLAUDE.md` | User-global, all projects | No |
| 2 | `.claude/CLAUDE.md` (project root) | Project-wide | Yes |
| 3 | `CLAUDE.md` (any directory) | Directory and below | Yes |
| 4 (highest) | `.claude/rules/*.md` | Conditional, path-matched | Yes |

**Key rule:** More specific scopes override broader ones. A directory-level CLAUDE.md overrides the project-level one for files in that directory.

## .claude/rules/ — Conditional Rules

Files in `.claude/rules/` use YAML frontmatter with a `paths` field for conditional loading:

```yaml
---
paths:
  - "src/api/**"
  - "src/middleware/**"
---
Always validate authentication tokens before processing API requests.
Use structured error responses with proper HTTP status codes.
```

Rules are loaded only when Claude Code operates on files matching the glob patterns. This prevents irrelevant rules from consuming context window space.

## Skills System

| Property | Project Skills | Personal Skills |
|---|---|---|
| Location | `.claude/skills/` | `~/.claude/skills/` |
| Entry point | `SKILL.md` in skill directory | `SKILL.md` in skill directory |
| Shared with team | Yes (committed) | No (personal) |

Skill properties:

- `allowed-tools` — Restricts which tools the skill can use
- `context: fork` — Runs in a forked context so skill execution does not pollute the main conversation

Skills are reusable capability modules. They encapsulate a workflow (e.g., "run tests", "deploy to staging") with constrained tool access.

## Commands

| Type | Location | Scope |
|---|---|---|
| Project commands | `.claude/commands/` | Shared with team |
| Personal commands | `~/.claude/commands/` | Personal only |

Commands are invoked with `/` prefix. They are templates — predefined prompts that can include `$ARGUMENTS` placeholders for user input.

**Difference from skills:** Commands are prompt templates. Skills are capability modules with tool restrictions and isolated context.

## Hooks — Deterministic Enforcement

| Hook | Fires When | Use For |
|---|---|---|
| PreToolUse | Before a tool executes | Block dangerous calls, validate parameters, require confirmation |
| PostToolUse | After a tool returns | Validate output, sanitise results, audit logging, trigger side effects |

**Critical property:** Hooks are deterministic — they run as code, not as model instructions. They cannot be bypassed by prompt injection or model reasoning.

Contrast with prompt instructions:

- Prompt: "Never delete production files" → Probabilistic, may be violated
- PreToolUse hook blocking `rm` on `/prod/` paths → Deterministic, cannot be violated

## Working Modes

| Mode | When to Use |
|---|---|
| Plan mode | Complex tasks, multiple possible approaches, need to think before acting |
| Direct execution | Clear scope, well-defined task, no ambiguity about approach |
| -p flag (non-interactive) | CI/CD pipelines, automated workflows, no human present |

**Plan mode signals:** The task is complex, has multiple valid approaches, or the consequences of a wrong approach are high. Plan mode forces Claude to outline its approach before executing.

**-p flag:** Runs Claude Code in non-interactive mode. Essential for CI/CD integration. No confirmation prompts, no interactive input — the command must be self-contained.

## Feedback Techniques

- Concrete examples beat prose descriptions. Show the code you want, not a paragraph describing it.
- Batch independent fixes in a single message. Sequence dependent ones (fix A, then fix B that depends on A).
- **Independent review sessions:** Never review code in the same session that wrote it. The model retains reasoning bias from the writing session. Start a fresh session for review.
- **Severity calibration:** Use examples to show what constitutes a critical issue vs. a minor style nit. Without calibration, the model treats all issues as equally important.

## Permissions & Security

- Permissions are controlled at the tool level — you grant or deny access to specific tools.
- The `allowedTools` field in agent/skill configuration restricts the tool set.
- Principle of least privilege: Each agent/skill should have access only to the tools it needs.
- Project-level settings (`.claude/`) are committed and shared. Personal settings (`~/.claude/`) are not.

## Decision Rules for the Exam

| If the question says... | The answer is likely... |
|---|---|
| "guaranteed enforcement", "cannot be bypassed" | Hooks (PreToolUse/PostToolUse) |
| "style guidance", "preferred approach" | Prompt instructions in CLAUDE.md |
| "applies only to specific file paths" | .claude/rules/ with paths frontmatter |
| "reusable workflow with restricted tools" | Skills (.claude/skills/) |
| "prompt template with arguments" | Commands (.claude/commands/) |
| "CI/CD pipeline", "automated", "non-interactive" | -p flag |
| "review quality of generated code" | Independent session (not the writing session) |
| "multiple approaches, complex task" | Plan mode first |
| "personal preference, not shared" | ~/.claude/ (user-level config) |

## Common Exam Traps

| Trap | Correct Answer |
|---|---|
| "Put all rules in the project CLAUDE.md" | Wrong — use .claude/rules/ for path-specific rules |
| "Hooks are prompt-based guardrails" | Wrong — hooks are deterministic code, not prompt instructions |
| "Review code in the same session that wrote it" | Wrong — model retains reasoning bias; use independent session |
| "Skills and commands are the same thing" | Wrong — skills have tool restrictions and forked context; commands are prompt templates |
| "User CLAUDE.md overrides project CLAUDE.md" | Wrong — project is higher priority than user-global |
| "-p flag enables plan mode" | Wrong — -p enables non-interactive (piped) mode for CI/CD |
