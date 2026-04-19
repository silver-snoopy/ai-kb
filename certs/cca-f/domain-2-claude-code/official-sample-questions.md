---
cert: cca-f
domain: domain-2-claude-code
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, sample-questions]
---

# Official Sample Questions — Domain 2 (vault) / Domain 3 (exam guide): Claude Code Configuration & Workflows

Verbatim from the official CCA-F exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`). These are the sample questions whose primary tested domain (per the exam guide's numbering) is Claude Code Configuration & Workflows.

```question
id: official-domain-2-claude-code-01
domain: domain-2-claude-code
difficulty: medium
stem: |
  Scenario: Code Generation with Claude Code.

  You want to create a custom /review slash command that runs your team's standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?
options:
  A: In the .claude/commands/ directory in the project repository
  B: In ~/.claude/commands/ in each developer's home directory
  C: In the CLAUDE.md file at the project root
  D: In a .claude/config.json file with a commands array
correct: A
explanation: |
  Project-scoped custom slash commands should be stored in the .claude/commands/ directory within the repository. These commands are version-controlled and automatically available to all developers when they clone or pull the repo. Option B (~/.claude/commands/) is for personal commands that aren't shared via version control. Option C (CLAUDE.md) is for project instructions and context, not command definitions. Option D describes a configuration mechanism that doesn't exist in Claude Code.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-2-claude-code-02
domain: domain-2-claude-code
difficulty: medium
stem: |
  Scenario: Code Generation with Claude Code.

  You've been assigned to restructure the team's monolithic application into microservices. This will involve changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?
options:
  A: Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.
  B: Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.
  C: Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.
  D: Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation.
correct: A
explanation: |
  Plan mode is designed for complex tasks involving large-scale changes, multiple valid approaches, and architectural decisions—exactly what monolith-to-microservices restructuring requires. It enables safe codebase exploration and design before committing to changes. Option B risks costly rework when dependencies are discovered late. Option C assumes you already know the right structure without exploring the code. Option D ignores that the complexity is already stated in the requirements, not something that might emerge later.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-2-claude-code-03
domain: domain-2-claude-code
difficulty: medium
stem: |
  Scenario: Code Generation with Claude Code.

  Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., Button.test.tsx next to Button.tsx), and you want all tests to follow the same conventions regardless of location. What's the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?
options:
  A: Create rule files in .claude/rules/ with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths
  B: Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies
  C: Create skills in .claude/skills/ for each code type that include the relevant conventions in their SKILL.md files
  D: Place a separate CLAUDE.md file in each subdirectory containing that area's specific conventions
correct: A
explanation: |
  Option A is correct because .claude/rules/ with glob patterns (e.g., **/*.test.tsx) allows conventions to be automatically applied based on file paths regardless of directory location—essential for test files spread throughout the codebase. Option B relies on inference rather than explicit matching, making it unreliable. Option C requires manual skill invocation or relies on Claude choosing to load them, contradicting the need for deterministic "automatic" application based on file paths. Option D can't easily handle files spread across many directories since CLAUDE.md files are directory-bound.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-2-claude-code-04
domain: domain-2-claude-code
difficulty: medium
stem: |
  Scenario: Claude Code for Continuous Integration.

  Your pipeline script runs claude "Analyze this pull request for security issues" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What's the correct approach to run Claude Code in an automated pipeline?
options:
  A: Add the -p flag, claude -p "Analyze this pull request for security issues"
  B: Set the environment variable CLAUDE_HEADLESS=true before running the command
  C: Redirect stdin from /dev/null, claude "Analyze this pull request for security issues" < /dev/null
  D: Add the --batch flag, claude --batch "Analyze this pull request for security issues"
correct: A
explanation: |
  The -p (or --print) flag is the documented way to run Claude Code in non-interactive mode. It processes the prompt, outputs the result to stdout, and exits without waiting for user input—exactly what CI/CD pipelines require. The other options reference non-existent features (CLAUDE_HEADLESS environment variable, --batch flag) or use Unix workarounds that don't properly address Claude Code's command syntax.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```
