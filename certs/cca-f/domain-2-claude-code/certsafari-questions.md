---
cert: cca-f
domain: domain-2-claude-code
status: done
source: certsafari
tags: [seeded, certsafari]
---

# CertSafari Practice Questions — Domain 3: Claude Code Configuration & Workflows

73 questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.
```question
id: certsafari-domain-2-claude-code-001
domain: domain-2-claude-code
difficulty: medium
stem: |
  A company is integrating Claude Code into its CI/CD pipeline to automate code reviews. When a developer pushes an update to an existing pull request, the company wants to avoid repeated feedback on code that has already been reviewed in previous commits within that same PR. What is the most effective way to ensure Claude only provides feedback on new or modified code in the subsequent run?
options:
  A: "Include the prior review findings in the context of the new run and explicitly instruct Claude to report only new or still-unaddressed issues."
  B: "Use the `--diff-only` flag so Claude only analyzes the exact lines changed in the most recent commit."
  C: "Clear the `CLAUDE.md` file dynamically before the second run to reset the review context."
  D: "Pass the `--incremental-review` flag to automatically suppress previously generated comments."
correct: A
explanation: |
    A: Correct. This aligns with Anthropic's documented 'evaluator-optimizer' and 'refinement cycle' workflows. By providing the previous review's output as context, the model can understand what has already been flagged and can be instructed to focus only on new changes or unaddressed issues, making the feedback more effective and less redundant.
    B: Incorrect. According to Anthropic's documentation, there is no such feature as a `--diff-only` flag. In fact, Anthropic's Code Review feature is designed to analyze changes in the context of the surrounding code and the full codebase to provide more comprehensive feedback, not just isolated line changes.
    C: Incorrect. The `CLAUDE.md` file is used to provide persistent, project-specific instructions and context to Claude. Clearing this file would remove important guidance for the review process and would be counterproductive to achieving a focused, incremental review.
    D: Incorrect. The `--incremental-review` flag is not a documented feature or command for Claude Code. Achieving an incremental review is done through effective prompting and context management, not a specific, built-in flag.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28728)
```

```question
id: certsafari-domain-2-claude-code-002
domain: domain-2-claude-code
difficulty: medium
stem: |
  Due to a rebranding effort, you need to rename a core database table from `tbl_customer_records` to `tbl_client_profiles`. This change requires updating all corresponding ORM models, repository layers, API controllers, and unit tests, affecting approximately 45 files. To prevent costly rework, you want to ensure all dependencies are mapped out before any files are altered. Which approach is best?
options:
  A: "Use direct execution to perform a global find-and-replace across the 45 files."
  B: "Use the Explore subagent to perform the renaming in a background thread to preserve context."
  C: "Use plan mode to safely explore the codebase and design the multi-file modification strategy before committing to changes."
  D: "Use direct execution, but prompt Claude to pause and ask for confirmation after every 5 file modifications."
correct: C
explanation: |
    A: Direct execution for a global find-and-replace is highly risky for core architectural changes. It fails to account for context-sensitive references, naming conventions in different layers (e.g., camelCase vs snake_case), and can break migrations or unit tests without a cohesive strategy, leading to significant manual rework.
    B: While the Explore subagent is helpful for gathering information, background execution does not provide the structured planning phase required for a 45-file refactor. It doesn't allow for a formal review of the proposed changes across all architectural layers before execution begins.
    C: Plan mode is specifically designed for complex, multi-file tasks where dependency mapping is critical. It allows Claude to explore the codebase, identify all affected modules (ORM, API, Tests), and present a coordinated modification strategy. This ensures the user can verify the approach and catch missing dependencies before any files are actually modified.
    D: Pausing for confirmation during direct execution is an ad-hoc mitigation that remains reactive rather than proactive. It does not provide a holistic view of the impact on the system and is inefficient for ensuring that all 45 files are updated in a consistent and technically sound order.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23996)
```

```question
id: certsafari-domain-2-claude-code-003
domain: domain-2-claude-code
difficulty: medium
stem: |
  When integrating `Claude Code` into a CI/CD pipeline for automated code reviews, which approach ensures the output is machine-parseable and can be used to programmatically fail a build based on specific criteria?
options:
  A: "Use the `--format structured-text` flag to force Claude to use a predictable markdown table format."
  B: "Append \"Return ONLY valid JSON\" to the prompt and parse the output using `jq`."
  C: "Use the `--output-format json` and `--json-schema` CLI flags to enforce machine-parseable structured findings."
  D: "Use the `--inline-comments` flag to allow `Claude Code` to interact directly with the GitHub API."
correct: C
explanation: |
    A: Incorrect. The research does not mention a `--format structured-text` flag for `Claude Code`. While markdown can be parsed, JSON with a defined schema is a more robust and reliable method for machine-parseable output in an automated CI/CD pipeline.
    B: Incorrect. According to Anthropic's documentation, relying on prompt engineering to generate JSON is not a recommended or reliable approach for production systems. This method can produce malformed JSON or include conversational filler, which would break an automated process. The dedicated Structured Outputs feature or specific CLI flags should be used instead for guaranteed schema compliance.
    C: Correct. The research explicitly states that to generate 'machine-parseable findings' for CI/CD pipelines, users should run `Claude Code` with flags like `--output-format json` and `--json-schema`. This approach ensures the output is structured and conforms to a predefined schema, making it reliable for automated parsing and for making decisions like failing a build.
    D: Incorrect. This option describes a potential subsequent action (posting comments) rather than the method for generating the machine-parseable data needed to make a decision. The core requirement is to first generate structured findings that the CI/CD system can parse; this is achieved using the `--output-format json` flag, not a flag for posting comments.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=27611)
```

```question
id: certsafari-domain-2-claude-code-004
domain: domain-2-claude-code
difficulty: medium
stem: |
  A team's root `CLAUDE.md` has grown to 800 lines, causing Claude to occasionally miss specific testing instructions due to context dilution. The architect wants to refactor this without requiring developers to manually import files in every subdirectory. What is the most effective approach?
options:
  A: "Split the file into multiple `CLAUDE-*.md` files in the root directory and configure the `.claudeignore` file to prioritize them."
  B: "Move the testing instructions to `~/.claude/CLAUDE.md` so they are loaded globally before the project-level rules."
  C: "Create a `.claude/memory.json` file that maps specific prompt keywords to the respective markdown files."
  D: "Move the topic-specific instructions into separate markdown files within the `.claude/rules/` directory so Claude can automatically discover and apply them."
correct: D
explanation: |
    A: Incorrect. Splitting files in the root directory does not provide automatic discovery or hierarchical scoping. Furthermore, `.claudeignore` is intended to exclude files from the context, not to define priority or include them for specific tasks.
    B: Incorrect. Global configuration files in the user's home directory (`~/.claude/CLAUDE.md`) are environment-specific rather than project-specific. This breaks project portability and can lead to instruction leakage across unrelated projects.
    C: Incorrect. Using a `memory.json` file for keyword mapping is not a supported or standard discovery mechanism in the Claude ecosystem. This would require custom implementations and increase maintenance complexity.
    D: Correct. The `.claude/rules/` directory is the standard location for modular instructions. Files stored here are automatically discovered and applied by Claude Code, allowing the architect to break down a massive root file into focused, topic-specific rules (like testing) while maintaining a clean, manageable hierarchy.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24315)
```

```question
id: certsafari-domain-2-claude-code-005
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer observes that a long-running Claude agent, which was correctly adhering to the project's strict TypeScript interfaces in the morning, begins generating code with `any` types in the afternoon. The project's codebase has not been modified. What is the most effective first step to troubleshoot this degradation in behavior, which is likely caused by context window limitations?
options:
  A: "Check for recent infrastructure issues on Anthropic's status page, as 'output corruption' bugs have been known to cause this."
  B: "Move all TypeScript rules from the `.claude/rules/` directory into the root `CLAUDE.md` file to ensure they are always loaded and never expire from context."
  C: "Use a command to inspect the agent's current context or memory, comparing its state from the morning session to the afternoon session to confirm if the relevant TypeScript rule files have been dropped."
  D: "Pin the `@anthropic-ai/sdk` version to an older, compatible one to resolve potential type incompatibilities with other Anthropic packages."
correct: C
explanation: |
    A: Incorrect. While infrastructure issues like 'output corruption' can cause inconsistent output, as noted in a September 2025 postmortem, the described pattern of degradation over a single, long session is a classic symptom of the agent's context window filling up and 'forgetting' initial instructions, which is a more likely and immediate cause to investigate.
    B: Incorrect. According to Anthropic's best practices, this action would worsen the problem. Moving all rules into `CLAUDE.md` forces them into the context for every task, which bloats the context window and can accelerate context expiration, rather than prevent it. The recommended approach is to keep `CLAUDE.md` concise and use `.claude/rules/` for path-filtered, specific instructions.
    C: Correct. This is the most direct troubleshooting step to diagnose the problem. The behavior described is a strong indicator of context expiration, where the agent 'forgets' earlier instructions as the conversation history grows. Inspecting the agent's active context or memory would verify if the files containing the TypeScript rules are no longer loaded, confirming the root cause of the behavioral degradation.
    D: Incorrect. While SDK version mismatches can cause type inconsistencies, this issue would be present from the start of the session, not appear gradually over several hours. The scenario states that the project files haven't changed, so a package version conflict would not suddenly manifest in the middle of a single, continuous session.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28734)
```

```question
id: certsafari-domain-2-claude-code-006
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your organization is upgrading a core UI framework from version 17 to 18. This upgrade introduces several breaking changes that will affect multiple components. You need to identify these breaking changes, decide on a repository-wide migration strategy, and then apply the code modifications. Which workflow represents the optimal use of Claude Code for this multi-phase task?
options:
  A: "Use direct execution for the entire process, allowing Claude to discover and fix breaking changes dynamically as it encounters them."
  B: "Use the Explore subagent to both investigate the breaking changes and implement the code modifications in an isolated environment."
  C: "Use plan mode to investigate the breaking changes and formulate a migration strategy, followed by direct execution to implement the planned approach."
  D: "Use direct execution to investigate the breaking changes, followed by plan mode to safely apply the code modifications across the repository."
correct: C
explanation: |
    A: Using direct execution for a complex, multi-phase migration is risky and inefficient. Direct execution is best suited for straightforward, low-risk changes. It lacks the structured discovery and strategic planning required to manage repository-wide breaking changes effectively, which can lead to inconsistent or unplanned modifications.
    B: While the Explore subagent is excellent for discovery and investigating codebase semantics, it is not designed to implement large-scale modifications across a repository. Mixing investigation and implementation in one step bypasses the necessary review and validation steps required for a coordinated migration.
    C: This represents the optimal workflow for complex refactoring. Plan mode allows Claude to explore the codebase, identify breaking changes, and formulate a comprehensive migration strategy that can be reviewed before any code is changed. Once the strategy is validated, direct execution provides a systematic way to apply the planned modifications reliably across the repository.
    D: This approach is logically reversed. Investigation and strategy formulation should occur in plan mode where architectural decisions are evaluated proactively. Using direct execution for discovery is less effective, and applying plan mode only during the implementation phase fails to leverage the tool's ability to safely design and review changes before they occur.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23992)
```

```question
id: certsafari-domain-2-claude-code-007
domain: domain-2-claude-code
difficulty: medium
stem: |
  An engineer wants to ensure the Claude Code agent consistently follows a specific logging format for all background worker scripts within their project. They have documented the format and the rules for its application. According to official documentation, what is the recommended approach to make these instructions persistent and automatically recognized by Claude at the start of every session?
options:
  A: "Define a new skill in a `SKILL.md` file with `name: logging-rules` and a detailed `description` of the format."
  B: "Place the rules in a `.claude/hooks/pre-action.sh` script to validate the code before Claude commits it."
  C: "Create a file named `CLAUDE.md` in the project's root directory and add the logging format rules to it."
  D: "Export the rules as an audit log via the Compliance API so Claude can reference past events."
correct: C
explanation: |
    A: Incorrect. While `SKILL.md` files are used to extend Claude's functionality, they are designed for specific, repeatable workflows that Claude decides to use based on the `description`. They are not the primary mechanism for providing persistent, project-wide instructions like coding standards.
    B: Incorrect. Hooks are used to run shell commands before or after Claude Code actions, which can provide deterministic guardrails. However, they do not provide instructional context to the model on *how* to write the code in the first place.
    C: Correct. The official documentation states that a `CLAUDE.md` file in the project root acts as a 'permanent instruction manual' or 'standing brief'. It is automatically read by the Claude Code agent at the start of every session to provide persistent context on coding standards, architectural decisions, and behavioral rules.
    D: Incorrect. Audit logs are an Enterprise feature available through the Compliance API for recording organizational events like user sign-ins and project modifications. They are used for security and compliance purposes, not for providing coding instructions to the Claude agent.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=31738)
```

```question
id: certsafari-domain-2-claude-code-008
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are managing a large monorepo and want to provide specific guidelines for Claude Code to follow, but only when it is working on the Terraform files located in the `infrastructure/` subdirectory. According to Anthropic's recommended practices, how should you configure your repository to apply these infrastructure-specific guidelines conditionally?
options:
  A: "Create a `CLAUDE.md` file within the `infrastructure/` directory containing the Terraform-specific guidelines."
  B: "In the root `CLAUDE.md` file, add a special directive: `@claude-path: infrastructure/**/*.tf`."
  C: "In the `.claude/settings.json` file, add a rule entry mapping the guidelines file to the `infrastructure/` path."
  D: "Create a single `CLAUDE.md` file at the root and add YAML frontmatter to specify the conditional path: `---\npaths: [\"infrastructure/**/*.tf\"]\n---`."
correct: A
explanation: |
    A: Correct. Anthropic documentation specifies that Claude Code supports a hierarchical context system using `CLAUDE.md` files. Placing a `CLAUDE.md` file in a subdirectory provides domain-specific rules for that part of the repository, which are merged with any global rules from a `CLAUDE.md` file at the repository root.
    B: Incorrect. The research explicitly notes that the `@claude-path` syntax does not appear in any official Anthropic documentation. The correct mechanism for path-based context is the physical location of the `CLAUDE.md` file, not an in-file directive.
    C: Incorrect. The `.claude/settings.json` file is used for configuring Claude Code settings, such as creating allowlists for shell commands to reduce permission prompts. It is not used for defining the scope of contextual guidelines from `.md` files.
    D: Incorrect. While some documentation tools use YAML frontmatter for metadata, this is not the documented mechanism for applying conditional context in `CLAUDE.md` files. The correct approach is to leverage the hierarchical file placement system.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32815)
```

```question
id: certsafari-domain-2-claude-code-009
domain: domain-2-claude-code
difficulty: medium
stem: |
  During a production deployment, an alert triggers indicating that a specific date parser in `utils/dateFormatter.ts` is throwing a NullPointerException when handling leap years. The operations team provides a clear stack trace pointing exactly to line 42 of the file. You need to implement a conditional check to handle the null value. How should you instruct Claude to handle this task?
options:
  A: "Initiate plan mode to evaluate how the date parser affects the overall system architecture before applying the fix."
  B: "Deploy the Explore subagent to summarize all date formatting functions across the codebase to ensure consistency."
  C: "Use direct execution to immediately implement the well-scoped conditional validation check in the single file."
  D: "Combine plan mode for investigating the stack trace with the Explore subagent for implementing the bug fix."
correct: C
explanation: |
    A: Incorrect. Plan mode is designed for complex, multi-step tasks or architectural changes. Using it for a localized, well-defined bug with a precise stack trace introduces unnecessary overhead and delays the production fix.
    B: Incorrect. Using the Explore subagent to audit the entire codebase is a heavyweight operation suited for ensuring consistency or finding patterns. In an urgent production fix scenario, the priority is targeted remediation, not global summarization.
    C: Correct. Direct execution is the most efficient choice when the problem is well-scoped, the location is known (line 42 of a specific file), and the fix is straightforward. This allows for rapid remediation with minimal process overhead.
    D: Incorrect. Combining plan mode and the Explore subagent is overkill for a simple null check. This complex workflow is better reserved for large-scale refactors or deep investigative work where the solution is not yet identified.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23990)
```

```question
id: certsafari-domain-2-claude-code-010
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your application has a complex authorization model. Whenever a developer edits any file named permissions.ts—regardless of whether it resides in the backend/, frontend/, or shared/ directories—Claude must be aware of the security matrix. How should you configure this requirement to ensure the rules are loaded appropriately?
options:
  A: "Place a CLAUDE.md file containing the security matrix inside the backend/, frontend/, and shared/ root folders."
  B: "Create .claude/rules/auth.md with YAML frontmatter paths: [\"**/permissions.ts\"]."
  C: "Add the security matrix to the global ~/.claude.json configuration file under the permissions key."
  D: "Create a .claude/rules/permissions.ts.md file and omit the YAML frontmatter, relying on the filename matching."
correct: B
explanation: |
    A: Placing a CLAUDE.md file in multiple directories is manual, repetitive, and does not provide targeted triggering for specific file patterns. While CLAUDE.md provides context for a directory, it lacks the fine-grained glob matching required to specifically target all permissions.ts files across the project hierarchy.
    B: This is the correct approach. Claude Code uses Markdown files in the .claude/rules/ directory to define specific conventions. By including YAML frontmatter with a `paths` array and glob patterns (like "**/permissions.ts"), Claude ensures that the specified context or rules are loaded only when files matching those paths are being edited.
    C: The global ~/.claude.json configuration file is used for client-level settings and user preferences, not for project-specific architectural rules or conditional context loading based on repository file paths.
    D: Files in .claude/rules/ must include YAML frontmatter with the `paths` key to define their scope. Simply naming the file permissions.ts.md without frontmatter does not establish the necessary glob matching for Claude to automatically load the rules for files in different subdirectories.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24246)
```

```question
id: certsafari-domain-2-claude-code-011
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer creates a personal skill in `~/.claude/skills/test-gen/SKILL.md` to generate unit tests using a specific mocking library they prefer. However, the team repository already contains a project-scoped skill located at `.claude/skills/test-gen/SKILL.md` that uses a different library. The developer notices unpredictable behavior when invoking `/test-gen`. How should the developer resolve this while maintaining their personal workflow and not affecting the team?
options:
  A: "Add `override: true` to the frontmatter of their personal `SKILL.md` file."
  B: "Delete the project-scoped skill from their local `.claude/skills/` directory and add it to `.gitignore`."
  C: "Rename their personal skill directory to `~/.claude/skills/my-test-gen/` to avoid naming collisions."
  D: "Move their personal skill into the `.claude/commands/` directory to give it higher precedence."
correct: C
explanation: |
    A: Frontmatter tags like `override: true` are not a standard or documented mechanism for resolving path-based naming collisions between personal and project-level skills in Claude Code. Even if such a flag existed, it would not address the ambiguity of having two distinct definitions for the same command identifier.
    B: Modifying the project-scoped directory and altering `.gitignore` is poor practice. It risks disrupting the canonical project state, creating merge conflicts, or accidentally committing environment-specific changes that affect other team members.
    C: Renaming the personal skill directory (e.g., to `my-test-gen`) assigns a unique identifier to the skill. This allows the personal skill (`/my-test-gen`) and the project skill (`/test-gen`) to coexist without collision, ensuring predictable behavior while maintaining the developer's custom workflow without impacting the shared repository.
    D: The `.claude/commands/` directory is typically reserved for executable scripts or binaries that act as slash commands, whereas skills are defined via Markdown files in the `skills/` directory. Moving a skill to the commands directory would likely break its functionality or lead to improper loading semantics.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24310)
```

```question
id: certsafari-domain-2-claude-code-012
domain: domain-2-claude-code
difficulty: medium
stem: |
  After Claude generates a complex React component, a developer notices three distinct bugs: 1) A state update causes an infinite re-render loop, 2) The API call inside the `useEffect` hook relies on that looping state, causing network spam, and 3) A CSS class name on a footer button is misspelled. How should the developer structure their follow-up prompts to fix these issues efficiently?
options:
  A: "Report all three bugs in three separate, sequential prompts to avoid overwhelming Claude's context window."
  B: "Report the state loop and API call issues in a single detailed message since they interact, then fix the CSS typo in a subsequent prompt."
  C: "Report the CSS typo first, wait for the fix, then report the API call, and finally report the state loop."
  D: "Ask Claude to rewrite the entire component from scratch, mentioning that the previous version had multiple bugs."
correct: B
explanation: |
    A: Reporting all three bugs in separate, sequential prompts is inefficient. Specifically, the state loop and the API call are interdependent; splitting them into separate prompts forces Claude to reason about the logic twice and increases the risk of the model creating a fix for one that doesn't account for the other.
    B: This approach represents the best practice for iterative refinement. Grouping the state loop and API call issues allows Claude to address the interdependent logic and lifecycle dependencies simultaneously, ensuring a coherent functional fix. Separating the trivial CSS typo ensures the primary logic fix remains clean and focused.
    C: Addressing a minor CSS typo first is poor prioritization, as the infinite loop and network spam are critical performance issues. Furthermore, separating the API logic from the state logic makes it more difficult for Claude to correctly optimize hook dependencies in one pass.
    D: Asking for a full rewrite is a heavy-handed approach that is generally unnecessary for targeted bugs. It increases the likelihood of introducing new regressions and is more resource-intensive than applying surgical, iterative improvements to the existing code.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24016)
```

```question
id: certsafari-domain-2-claude-code-013
domain: domain-2-claude-code
difficulty: medium
stem: |
  A lead engineer wants to ensure that all new hires automatically have Claude Code configured to use the company's proprietary internal package registry. The solution must be centrally managed and require no manual configuration on the new hires' machines. Which approach aligns with Anthropic's recommended practices for enterprise environments?
options:
  A: "Commit a `.claude/settings.json` file containing the registry configuration to the root of every company repository."
  B: "Provide an onboarding script that appends the registry configuration to each new hire's user-specific `~/.claude/settings.json` file."
  C: "Use a central management tool (MDM) or OS-level policies to deploy a managed settings file or apply the configuration directly, for example, via Windows Registry keys."
  D: "Add the registry instructions to a `CLAUDE.md` file and use a server-managed setting to push this file to all new hires."
correct: C
explanation: |
    A: Incorrect. While using a project-specific `.claude/settings.json` file is a valid way to configure Claude Code for a particular project, it is not a centrally managed solution for a user. This approach would not apply the setting globally for the new hire and would require maintaining the configuration file across all repositories.
    B: Incorrect. Although this would configure the tool for the user, it relies on modifying a user-level configuration file via a script. The official documentation recommends a more robust, centrally managed approach for enterprise environments that prevents users from accidentally overriding critical settings.
    C: Correct. According to official documentation, Claude Code supports managed settings for centralized enterprise control. This can be achieved through file-based settings in system directories or via MDM/OS-level policies, such as using the `HKLM\SOFTWARE\Policies\ClaudeCode` Registry key on Windows. This method enforces the configuration for all users on a machine without requiring any manual setup.
    D: Incorrect. The `CLAUDE.md` file's purpose is to provide rules for correcting Claude's mistakes and teaching it to avoid them in the future. It is not used for tool configuration, such as setting a package registry. Configuration settings belong in a `settings.json` file.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28767)
```

```question
id: certsafari-domain-2-claude-code-014
domain: domain-2-claude-code
difficulty: medium
stem: |
  A data engineer is using Claude to parse a complex, legacy proprietary log format into structured JSON. The engineer has written a detailed three-paragraph prompt explaining the extraction rules, delimiters, and edge cases in natural language. However, Claude consistently misinterprets how to handle nested brackets within the log strings. Which approach should the engineer take to most effectively correct Claude's transformation logic?
options:
  A: "Rewrite the natural language prompt using more precise academic terminology regarding parsing algorithms and abstract syntax trees."
  B: "Provide 2-3 concrete examples of the raw log lines alongside their exact expected JSON outputs to clarify the transformation requirements."
  C: "Ask Claude to generate a Python script that uses regular expressions, then manually debug the regex until it works."
  D: "Break the prompt into ten sequential steps, asking Claude to confirm understanding after each natural language instruction."
correct: B
explanation: |
    A: Using academic terminology regarding parsing algorithms and ASTs is unlikely to resolve specific logic errors. Claude performs better with concrete patterns than with abstract theoretical jargon when tasked with processing idiosyncratic or proprietary formats.
    B: Providing concrete examples (few-shot prompting) of raw log lines paired with their expected JSON outputs is the most effective way to clarify complex transformation logic. This allows Claude to infer patterns and edge-case handling (like nested brackets) from evidence, which is typically more successful than natural language descriptions alone.
    C: Generating Python scripts using regular expressions is often ineffective for nested structures, as standard regex is not context-free. Furthermore, manual debugging shifts the burden of work to the engineer and does not leverage the model's iterative refinement capabilities for the extraction task itself.
    D: While breaking tasks into steps is a valid prompt engineering technique, sequential natural language confirmation often leads to 'hallucinated agreement' where the model confirms understanding but fails in execution. It is less reliable for structured data transformation than providing high-signal input-output examples.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24013)
```

```question
id: certsafari-domain-2-claude-code-015
domain: domain-2-claude-code
difficulty: medium
stem: |
  An architect is using Claude to refactor a complex authentication module. They want to use a custom skill `/brainstorm-auth` to generate five radically different architectural alternatives. They want to review these alternatives but keep the main conversation focused strictly on the current refactoring task, without Claude getting confused by the generated alternatives in subsequent prompts. Which configuration achieves this workflow?
options:
  A: "Define the skill with `allowed-tools: []` to prevent it from writing the alternatives to disk."
  B: "Define the skill with `context: fork` so the brainstorming happens in an isolated sub-agent context."
  C: "Place the skill in `~/.claude/skills/` so it runs outside the project's context window."
  D: "Add an `argument-hint` that forces the user to specify a temporary file for the output."
correct: B
explanation: |
    A: Incorrect. The `allowed-tools` parameter restricts the external tools (like file system access or shell commands) the skill can invoke, but it does not create an isolated conversational context. Outputs would still appear in the main chat history.
    B: Correct. Defining a skill with `context: fork` (or utilizing the sub-agent forking mechanism) runs the skill in an isolated sub-session. This allows the model to explore complex alternatives without injecting that lengthy, distracting history into the primary conversation, preventing 'context pollution'.
    C: Incorrect. The directory `~/.claude/skills/` is used for the global discovery and storage of skills across projects. It affects where the skill is defined, but it has no impact on the runtime context isolation of an active chat session.
    D: Incorrect. An `argument-hint` is metadata used to guide the user on what input to provide for the skill's parameters. While forcing a file output might keep the code out of the chat, it does not programmatically isolate the model's reasoning or conversation state.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24309)
```

```question
id: certsafari-domain-2-claude-code-016
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your team is migrating a legacy monolithic application to a microservices architecture. The first phase requires extracting the authentication module, which currently touches over 50 files across the repository. You need Claude to evaluate two different OAuth2 integration approaches and determine the necessary infrastructure changes before any code is modified. Which Claude Code workflow is most appropriate for this scenario?
options:
  A: "Use direct execution to iteratively update the 50+ files, allowing Claude to resolve integration errors as they appear during the build process."
  B: "Use plan mode to safely explore the codebase, evaluate the architectural implications of both OAuth2 approaches, and design the migration strategy without committing to changes."
  C: "Use the Explore subagent to rewrite the authentication module in an isolated context, then merge the changes into the main branch."
  D: "Use direct execution with a strict prompt instructing Claude to only modify one file at a time to prevent context window exhaustion."
correct: B
explanation: |
    A: Direct execution is not suitable for this scenario because it involves making immediate, potentially destructive changes to the codebase. Iteratively updating 50+ files without a preliminary plan increases the risk of cascading errors and makes it difficult to reason about cross-cutting architectural impacts before evaluating the architecture.
    B: Plan mode is the most appropriate workflow for this scenario as it is designed for safely exploring the codebase and evaluating architectural implications before committing changes. It enables the design of a migration strategy and the identification of infrastructure changes, producing a vetted plan that can be reviewed prior to any code modification.
    C: While the Explore subagent is useful for isolated experimentation, rewriting a module and merging it immediately bypasses the higher-level architectural evaluation required across many files. This approach may fail to capture necessary infrastructure and integration considerations across the entire repository.
    D: Using direct execution with a file-by-file constraint is still an execution-first approach. It does not provide the upfront architectural analysis or coordinated infrastructure planning required for a large-scale refactor, and it ignores the requirement to evaluate options before modifying code.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23989)
```

```question
id: certsafari-domain-2-claude-code-017
domain: domain-2-claude-code
difficulty: medium
stem: |
  When integrating Claude Code into a CI/CD pipeline, how can you configure the workflow to evaluate a new code commit specifically against findings from a previous JSON report?
options:
  A: "Use the --verify-previous flag pointing to the file path of the old JSON report."
  B: "Rely on Claude's automatic cross-run memory by providing the same --session-id flag in the CI script."
  C: "Pass the previous JSON report as context in the new prompt and instruct Claude to evaluate only the status of those specific findings."
  D: "Upload the previous JSON report to the Anthropic API console and reference it using the --reference-doc flag."
correct: C
explanation: |
    A: There is no standard --verify-previous flag in the Claude Code CLI. Comparing changes across commits is typically handled by providing context manually or using CI artifacts, rather than relying on a non-existent CLI flag.
    B: While Claude Code supports session management via --session-id, this is generally inappropriate for deterministic CI/CD pipelines. Session memory is often ephemeral or tied to local filesystem state, which does not persist reliably across different CI runner instances.
    C: This is the recommended architectural pattern. By passing the previous findings directly into the prompt context, you enable Claude to perform a targeted comparison. This ensures the workflow is stateless, reproducible, and compatible with standard artifact storage practices in CI/CD.
    D: There is no --reference-doc flag or mechanism in the Anthropic API console that allows for referencing uploaded reports in this manner. All relevant context must be supplied programmatically within the API request or prompt.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24214)
```

```question
id: certsafari-domain-2-claude-code-018
domain: domain-2-claude-code
difficulty: medium
stem: |
  A DevOps engineer is creating a skill `/gen-infra` to help junior developers generate boilerplate Terraform code. To prevent the skill from accidentally executing shell commands that might delete existing local state files during the generation process, the engineer needs to strictly limit what Claude can do while running this skill. What is the most secure way to enforce this when developing for the Claude Code CLI?
options:
  A: "Include a strict prompt in the `SKILL.md` body stating: 'Do not execute any shell commands or delete files.'"
  B: "Configure `allowed-tools` in the skill's frontmatter to explicitly list only safe file read and write operations."
  C: "Use `context: fork` in the frontmatter to isolate the skill's execution environment from the local filesystem."
  D: "Place the skill in `~/.claude/skills/` so it runs with restricted user-level permissions instead of project-level permissions."
correct: B
explanation: |
    A: Incorrect. While providing clear instructions in a prompt is a good practice for guiding the model's behavior, it is not a reliable security mechanism. The model could fail to adhere to these natural language constraints, making it an insufficient method for enforcing a strict security boundary.
    B: Correct. The research confirms that `allowed-tools` in the skill's frontmatter is the officially recommended approach for creating a security boundary for Claude Code CLI skills. This feature explicitly defines which tools a skill can access, preventing it from using unintended operations like shell execution if they are not on the allowlist. This is the most direct and secure method described for controlling a skill's capabilities.
    C: Incorrect. The provided research does not mention a `context: fork` setting or a similar feature for isolating a skill's execution environment. Security and permissions are managed through other documented configurations like `allowed-tools`.
    D: Incorrect. The research provides no information to suggest that a skill's directory location (`~/.claude/skills/` or elsewhere) affects its security permissions. Skill capabilities are defined within the skill's configuration, not by its location on the filesystem.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=31724)
```

```question
id: certsafari-domain-2-claude-code-019
domain: domain-2-claude-code
difficulty: medium
stem: |
  An enterprise team uses a centralized repository for company-wide coding standards. A local project needs to enforce these global standards alongside its own specific database migration rules. The architect wants to keep the local project's CLAUDE.md clean and modular. Which configuration strategy is best?
options:
  A: "Copy all global standards directly into the local ~/.claude/CLAUDE.md and place the database rules in the root CLAUDE.md."
  B: "Place the global standards in .claude/rules/global.md and use the /memory command to link it to the database migration rules."
  C: "Use @import in the local CLAUDE.md to reference the downloaded global standards file, and place the database migration rules in the local .claude/rules/ directory."
  D: "Create a symlink from the local CLAUDE.md to the global standards repository and append the database rules to the end of the symlink."
correct: C
explanation: |
    A: Copying global standards directly into local files creates duplication and a significant maintenance burden. Updates to central standards will not propagate automatically, and the local CLAUDE.md becomes large and difficult to manage, defeating the objective of modularity.
    B: The /memory command is designed for chat session context and agentic memory, not for linking or composing structural configuration files. This approach does not follow the established patterns for modular rule management in Claude Code.
    C: Using @import in the local CLAUDE.md is the best practice for modularity. It allows the project to reference centrally maintained standards files while keeping the main configuration clean. Placing specific database migration rules in the .claude/rules/ directory follows the recommended hierarchy for scoped, modular rules.
    D: Symlinks are fragile across different operating systems and CI/CD environments. Appending local rules to a symlinked file is architecturally unsound and complicates version control, making it a poor choice for a clean, modular setup.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24318)
```

```question
id: certsafari-domain-2-claude-code-020
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your team is tasked with migrating the application's database driver. The workflow requires three distinct steps: 1) Finding all usages of the old driver across thousands of files without cluttering the chat history, 2) Deciding on the architectural pattern for the new driver wrapper, and 3) Writing the actual code to replace the driver. Which combination of Claude Code features maps perfectly to this multi-phase task?
options:
  A: "1) Explore subagent for discovery, 2) Plan mode for strategy, 3) Direct execution for implementation."
  B: "1) Plan mode for discovery, 2) Explore subagent for strategy, 3) Direct execution for implementation."
  C: "1) Direct execution for discovery, 2) Plan mode for strategy, 3) Explore subagent for implementation."
  D: "1) Explore subagent for discovery, 2) Direct execution for strategy, 3) Plan mode for implementation."
correct: A
explanation: |
    A: Correct. The Explore subagent is specifically designed for deep codebase discovery across large file sets without cluttering the primary conversation history. Plan mode is the appropriate tool for high-level architectural and design strategy before code is written. Direct execution is the standard mode for implementing and applying the actual code changes and running commands.
    B: Incorrect. Plan mode is intended for architectural reasoning and workflow planning rather than the initial high-volume file discovery. The Explore subagent is the correct tool for the discovery phase.
    C: Incorrect. Direct execution is inefficient for scanning thousands of files and risks exceeding context limits or cluttering history compared to the Explore subagent. Furthermore, the Explore subagent is for information gathering, not for the final implementation of code changes.
    D: Incorrect. While using the Explore subagent for discovery is correct, swapping Direct execution for strategy and Plan mode for implementation is backwards; Plan mode is used to define the strategy, while Direct execution is used to perform the implementation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24000)
```

```question
id: certsafari-domain-2-claude-code-021
domain: domain-2-claude-code
difficulty: medium
stem: |
  A development team currently maintains 15 identical `CLAUDE.md` files distributed across 15 different feature directories just to enforce the exact same state management conventions. They want to consolidate this to reduce maintenance overhead while ensuring the rules only load when editing files within those specific feature directories. What is the architectural best practice?
options:
  A: "Delete the 15 `CLAUDE.md` files and create a single `.claude/rules/state.md` file using a YAML frontmatter `paths` array containing the glob patterns for all 15 feature directories."
  B: "Keep one `CLAUDE.md` in the root directory and use symlinks in the 15 feature directories pointing to the root file."
  C: "Consolidate the rules into the root `CLAUDE.md` and rely on Claude's semantic understanding to only apply them to the feature directories."
  D: "Create a `.claude/conventions.yaml` file at the root and map each feature directory path to the state management instructions."
correct: A
explanation: |
    A: This approach represents the standard architectural pattern for Claude Code. By centralizing rules in the `.claude/rules/` directory and utilizing YAML frontmatter (e.g., a `paths` or `globs` array), you enable conditional, path-scoped loading. This reduces duplication while ensuring rules are only included in the context window when relevant to the current file path.
    B: Using symlinks is not recommended as it introduces platform-specific brittleness (e.g., Windows vs. Linux/macOS) and increases repository complexity. It fails to leverage the native rule-loading logic built into Claude Code, which is specifically designed to handle path-based scoping through configuration rather than file system hacks.
    C: Placing specific feature rules in a root `CLAUDE.md` often leads to 'rule leakage' or 'context pollution,' where Claude might mistakenly apply those rules to unrelated parts of the codebase. Semantic understanding is less reliable than explicit path-based configuration for strict convention enforcement.
    D: While a centralized YAML mapping file might seem logical in other ecosystems, it is not the supported mechanism for Claude Code. The tool expects individual Markdown files within the `.claude/rules/` directory, where each file contains its own metadata and instruction set.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24249)
```

```question
id: certsafari-domain-2-claude-code-022
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are managing a project where UI components are stored in `src/components/` and utility functions in `src/utils/`. Both directories contain `.ts` and `.tsx` files. You want Claude to apply strict React hook rules ONLY to `.tsx` files in the `src/components/` directory. Which configuration achieves this most efficiently?
options:
  A: "Create a `CLAUDE.md` file inside `src/components/` and add YAML frontmatter `paths: [\"**/*.tsx\"]`."
  B: "Create `.claude/rules/hooks.md` with YAML frontmatter `paths: [\"**/*.tsx\"]` and add a markdown note telling Claude to ignore `src/utils/`."
  C: "Place a `CLAUDE.md` file in `src/components/` and a `.claudeignore` file in `src/utils/` targeting `.tsx` files."
  D: "Create `.claude/rules/hooks.md` with YAML frontmatter `paths: [\"src/components/**/*.tsx\"]`."
correct: D
explanation: |
    A: Incorrect. While `CLAUDE.md` provides project-level instructions, the standard for granular, path-specific rule application is the `.claude/rules/` directory. Scattering `CLAUDE.md` files throughout the directory tree is less maintainable than a centralized configuration and may not be supported by the rule-loading engine.
    B: Incorrect. The glob pattern `**/*.tsx` matches all TypeScript React files in the entire project. Relying on a natural language instruction to ignore `src/utils/` is less reliable and less efficient than using the built-in path filtering logic provided by YAML frontmatter.
    C: Incorrect. This configuration adds unnecessary complexity. `.claudeignore` is used to prevent files from being indexed or read by Claude entirely, whereas the requirement is simply to control the scope of specific rules. Managing multiple files across directories is also harder to maintain.
    D: Correct. This is the standard and most efficient way to apply path-specific rules in Claude Code. By placing a rule file in `.claude/rules/` and using the `paths` frontmatter with a specific glob pattern (`src/components/**/*.tsx`), you ensure the rules are only loaded and applied to the relevant files, keeping your configuration centralized and explicit.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24248)
```

```question
id: certsafari-domain-2-claude-code-023
domain: domain-2-claude-code
difficulty: medium
stem: |
  A security audit reveals that a deprecated API endpoint is still being referenced somewhere in your application's deeply nested legacy XML configurations and thousands of log files. You need Claude to search through these extensive directories to find all references. You anticipate the search will generate massive amounts of verbose output. Which feature should you use to perform this search?
options:
  A: "Plan mode, to ensure the search strategy is architecturally sound before execution."
  B: "Direct execution, because searching for a specific string is a simple, well-understood change."
  C: "The Explore subagent, to isolate the verbose discovery phase and prevent context window exhaustion."
  D: "Plan mode combined with direct execution to simultaneously search and delete the references."
correct: C
explanation: |
    A: Plan mode is designed for orchestrating complex, multi-step architectural changes and validating strategies before implementation. While it can define a search strategy, it does not provide the specific context management needed to handle the massive, verbose output of the actual search process.
    B: Direct execution is typically used for straightforward tasks. However, in this scenario, the 'thousands of log files' and 'massive amounts of verbose output' would likely flood the terminal history and exhaust the model's context window if executed directly in the main session.
    C: The Explore subagent is specifically designed for exploratory discovery and deep investigation tasks. It isolates the high-volume output of broad searches from the main conversation context, allowing Claude to summarize findings and identify references without crashing the session due to context window limits.
    D: Combining plan mode with direct execution to search and delete simultaneously is a high-risk approach. Best practices dictate isolating the discovery phase (finding the references) from the modification phase (deleting them), especially in legacy systems where global deletes can have unintended side effects.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23994)
```

```question
id: certsafari-domain-2-claude-code-024
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer is working on a Python project. They have a `CLAUDE.md` in the project root with Python formatting rules specifying 4 spaces. They also have a `~/.claude/CLAUDE.md` with personal preferences for using tabs instead of spaces. When running Claude Code in the project, Claude uses spaces instead of tabs. Why does this happen?
options:
  A: "User-level configurations are only applied if the project root lacks a `CLAUDE.md` file entirely."
  B: "The developer must explicitly @import their user-level configuration into the project-level `CLAUDE.md`."
  C: "The /memory command must be used to manually elevate the priority of the user-level configuration."
  D: "Project-level configurations override user-level configurations when there is a conflict in the hierarchy."
correct: D
explanation: |
    A: Incorrect. User-level configurations are still processed even when a project-level file exists; however, they do not take precedence. The statement is too absolute, as user settings aren't ignored entirely unless there is a specific conflict.
    B: Incorrect. There is no requirement to explicitly import user-level configurations. Claude Code automatically resolves the configuration hierarchy, and project-specific settings are designed to take priority over global preferences by default.
    C: Incorrect. The /memory command is utilized for managing persistent project context and task-specific information. It is not a mechanism for altering the resolution logic or priority of CLAUDE.md configuration files.
    D: Correct. In the Claude Code configuration hierarchy, project-level settings (found in the root directory) override user-level settings (found in ~/.claude/) when a conflict occurs. This ensures that project-wide standards, such as linting or formatting rules, are consistently applied by Claude regardless of individual user preferences.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24323)
```

```question
id: certsafari-domain-2-claude-code-025
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer is using Claude to build a custom markdown parser and has prepared a suite of 50 unit tests. Claude's initial implementation passes 42 tests but fails 8 tests specifically related to deeply nested blockquotes. What is the most effective way to iterate on this implementation?
options:
  A: "Paste the entire parser code back to Claude and ask, 'Why is this failing some tests?'"
  B: "Ask Claude to rewrite the 8 failing tests so they pass with the current implementation."
  C: "Paste the test execution output showing the 8 specific failures, including the expected versus actual outputs, and ask Claude to update the parser."
  D: "Prompt Claude to generate a completely new parser using a different regex strategy to avoid the blockquote issue."
correct: C
explanation: |
    A: Pasting the entire parser without specific failure context is vague and inefficient. Claude would be forced to scan the entire codebase without knowing which logic paths are actually failing, leading to a less focused and potentially hallucinated diagnosis.
    B: Rewriting tests to match a broken implementation is a logical fallacy in software engineering. This masks underlying bugs and invalidates the test suite as a source of truth for the desired behavior, defeating the purpose of iterative improvement.
    C: Providing specific test failures, including the delta between expected and actual outputs, provides Claude with precise, actionable data. This targeted feedback loop allows the model to diagnose the specific logic error in nested blockquote handling while preserving the functionality of the passing tests.
    D: Discarding a mostly functional implementation (passing 84% of tests) in favor of a full rewrite is risky and inefficient. It often introduces new regressions and ignores the progress already made, which is the opposite of iterative refinement.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24022)
```

```question
id: certsafari-domain-2-claude-code-026
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your enterprise application has a strict separation between public APIs and internal APIs. Public API routes are always named *public.route.ts and internal API routes are named *internal.route.ts, scattered across dozens of domain folders. You need Claude to apply strict rate-limiting conventions ONLY when editing public API routes. What is the most precise way to configure this?
options:
  A: "Create .claude/rules/rate-limiting.md with YAML frontmatter paths: [\"**/*public.route.ts\"]."
  B: "Create .claude/rules/rate-limiting.md with YAML frontmatter paths: [\"**/public/**/*.ts\"]."
  C: "Add the rate-limiting conventions to the root CLAUDE.md and instruct Claude to check the filename before applying them."
  D: "Create a CLAUDE.md file in every domain folder and use YAML frontmatter exclude: [\"*internal.route.ts\"]."
correct: A
explanation: |
    A: Correct. This option precisely targets all files ending with public.route.ts using a glob pattern (**/*public.route.ts) in the YAML frontmatter. This ensures that the rate-limiting conventions are automatically and deterministically loaded by Claude Code only when editing files that match the public API naming convention, regardless of which domain folder they reside in.
    B: Incorrect. The glob pattern **/public/**/*.ts matches TypeScript files located within a directory named 'public'. This does not align with the specified naming convention (files ending in public.route.ts) and would fail to apply rules to public routes stored in other directories or incorrectly apply them to unrelated files inside a 'public' folder.
    C: Incorrect. Adding conventions to the root CLAUDE.md relies on natural-language instruction rather than a declarative path rule. This is less precise, consumes unnecessary context when editing non-API files, and is more prone to error compared to Claude's purpose-built path-specific rule loading mechanism.
    D: Incorrect. Creating a CLAUDE.md file in every domain folder is unmaintainable and redundant across a large project. Additionally, using 'exclude' for internal files is a less direct and more error-prone approach than explicitly targeting the public filename pattern via a single centralized rule.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24252)
```

```question
id: certsafari-domain-2-claude-code-027
domain: domain-2-claude-code
difficulty: medium
stem: |
  Your team's Claude usage costs have spiked recently. Audit logs reveal that a massive set of database migration conventions is being loaded into the context window even when developers are exclusively editing frontend React components. How should you reconfigure the workspace to resolve this token bloat while preserving the conventions for database work?
options:
  A: "Keep the conventions in the root CLAUDE.md but wrap them in a <conditional path=\"db/migrations/**/*\"> XML tag."
  B: "Move the database conventions from the root CLAUDE.md into .claude/rules/db.md and add YAML frontmatter with paths: [\"db/migrations/**/*\"]."
  C: "Move the frontend components to a separate repository so they do not inherit the root CLAUDE.md database rules."
  D: "Create a .claudeignore file in the frontend directory and add the relative path to the root CLAUDE.md file."
correct: B
explanation: |
    A: Incorrect. Claude Code's convention system does not support path-specific logic via XML tags (like <conditional>) within a single CLAUDE.md file. Content in the root CLAUDE.md is generally treated as global context for the workspace.
    B: Correct. For granular control over context and cost optimization, Claude Code utilizes the .claude/rules/ directory. Files placed here can include YAML frontmatter with glob patterns (or paths), ensuring that specialized conventions are only loaded into the context window when the developer is working on files that match those patterns.
    C: Incorrect. While moving frontend components to a separate repository would technically isolate the context, it is an architectural anti-pattern for solving a configuration issue. It introduces significant operational overhead, repository management complexity, and breaks project cohesion.
    D: Incorrect. The .claudeignore file is used to prevent the AI from indexing or reading specific files or directories (similar to .gitignore). it is not designed for conditional loading of rules and would likely result in the conventions being ignored entirely or not solving the path-based inheritance issue.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24242)
```

```question
id: certsafari-domain-2-claude-code-028
domain: domain-2-claude-code
difficulty: medium
stem: |
  A lead architect is setting up a new microservices repository. They want to create a `/deploy-staging` command that all developers can use immediately after cloning the repository. Additionally, the architect wants a `/quick-test` command exclusively for their own local workflow without cluttering the team's shared repository. How should the architect configure these commands?
options:
  A: "Place `/deploy-staging` in `~/.claude/commands/` and `/quick-test` in `.claude/commands/`."
  B: "Place both commands in `.claude/commands/` but add a `user-scope: private` flag to the `/quick-test` frontmatter."
  C: "Place `/deploy-staging` in `.claude/commands/` and `/quick-test` in `~/.claude/commands/`."
  D: "Place both commands in `~/.claude/commands/` and use a symlink to share `/deploy-staging` with the team."
correct: C
explanation: |
    A: Incorrect. This reverses the required scopes. Placing `/deploy-staging` in the home directory (`~/.claude/commands/`) makes it local to the architect only, and placing `/quick-test` in the project directory (`.claude/commands/`) would share the private command with the entire team.
    B: Incorrect. Claude Code determines the scope and visibility of commands based on their directory location. There is no supported `user-scope: private` frontmatter flag that can hide files within the shared `.claude/commands/` project directory from other team members.
    C: Correct. Placing `/deploy-staging` in the repository's `.claude/commands/` directory ensures it is tracked by version control and available to all developers upon cloning. Placing `/quick-test` in the user's global `~/.claude/commands/` directory keeps the command restricted to the architect's local environment, preventing repository clutter.
    D: Incorrect. Files in `~/.claude/commands/` are outside the project's version control scope. Using symlinks is not a standard, portable, or recommended practice for distributing shared commands to a development team in Claude Code.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24301)
```

```question
id: certsafari-domain-2-claude-code-029
domain: domain-2-claude-code
difficulty: medium
stem: |
  During a complex refactoring session, Claude Code suddenly stops following the project's custom API error handling conventions. The developer suspects that the relevant configuration file is no longer in context. How should the developer diagnose this issue?
options:
  A: "Execute the /memory command to inspect which configuration and rule files are currently loaded in the session's context."
  B: "Run /config reload to force Claude to re-parse the .claude/rules/ directory."
  C: "Delete the .claude/CLAUDE.md file and recreate it to reset the context window."
  D: "Use the /import api-conventions.md command to forcefully inject the rules into the current prompt."
correct: A
explanation: |
    A: Correct. In the Claude Code CLI, the /memory command is the primary diagnostic tool used to inspect the current session context. It provides a summary of active rules, project state, and instructions that Claude is currently following, allowing the developer to verify if the API conventions are still being tracked.
    B: Incorrect. While forcing a refresh might be a reactive fix, Claude Code typically monitors the filesystem for changes automatically. Furthermore, /config reload is not the standard diagnostic command for inspecting the internal state of the current context window.
    C: Incorrect. Deleting and recreating the CLAUDE.md file is a destructive action and does not provide any diagnostic information regarding why the model stopped following the conventions. It is an inefficient way to reset context.
    D: Incorrect. There is no standard /import command in Claude Code for ad-hoc rule injection. Rules should be managed through the established hierarchy (.claude/rules/ or CLAUDE.md) to ensure they are properly scoped and maintained across the session.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24316)
```

```question
id: certsafari-domain-2-claude-code-030
domain: domain-2-claude-code
difficulty: medium
stem: |
  To ensure that Claude Code consistently adheres to repository-specific testing standards and utilizes custom test fixtures during automated workflows or developer interactions, which approach is recommended?
options:
  A: "Pass the directory containing the fixtures using the --fixtures-dir CLI flag during the CI invocation."
  B: "Document the testing standards, valuable test criteria, and available custom fixtures in the CLAUDE.md file."
  C: "Add a pre-commit hook that automatically rewrites unittest.mock calls to use the custom fixtures."
  D: "Execute Claude Code with the --strict-mocks=false flag to disable standard mocking libraries."
correct: B
explanation: |
    A: Incorrect. There is no standard --fixtures-dir CLI flag for Claude Code. Relying on non-existent or ad-hoc CLI flags in CI/CD is not a recommended best practice for sharing project-specific test artifacts or standards.
    B: Correct. The CLAUDE.md file is the primary mechanism for providing repository-level context, guidelines, and standards to Claude. Documenting custom fixtures and testing criteria here ensures consistency, discoverability, and adherence to project requirements across all team members and pipelines.
    C: Incorrect. Automatically rewriting code using pre-commit hooks is intrusive and brittle. It can introduce bugs and change test semantics unexpectedly. It is safer to document preferred usage in CLAUDE.md or use standard linting tools.
    D: Incorrect. Disabling standard mocking libraries is not a standard practice for Claude Code and would likely reduce test reliability. This does not address the need to integrate custom fixtures and would undermine predictable testing behavior.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24209)
```

```question
id: certsafari-domain-2-claude-code-031
domain: domain-2-claude-code
difficulty: medium
stem: |
  A senior developer sets up Claude Code for a new microservices project, configuring custom build commands and linting rules. When a junior developer clones the repository and runs Claude Code, the agent hallucinates standard build commands instead of using the custom ones. The senior developer's environment works perfectly. What is the most likely cause of this discrepancy?
options:
  A: "The junior developer needs to run /memory load to fetch the project-level configuration from the remote repository."
  B: "The senior developer placed the configuration in ~/.claude/CLAUDE.md instead of the project-level .claude/CLAUDE.md."
  C: "The project root CLAUDE.md is missing an @import statement for the junior developer's specific OS environment."
  D: "The junior developer's Claude Code CLI version is incompatible with the .claude/rules/ directory structure."
correct: B
explanation: |
    A: Incorrect. There is no /memory load command required to fetch project-level CLAUDE.md configurations. Claude Code automatically reads these files from the project hierarchy upon initialization.
    B: Correct. Claude Code looks for configuration files in a specific hierarchy: first in the current directory (CLAUDE.md or .claude/CLAUDE.md), then in parent directories, and finally in the user's home directory (~/.claude/CLAUDE.md). If the senior developer placed the custom commands in their global home directory config, those changes were never committed to the repository, meaning the junior developer's environment has no access to them and falls back to default agent behaviors.
    C: Incorrect. While missing imports for OS-specific modules might cause specific platform issues, it would not explain why standard commands are being used instead of project-wide custom commands. The most likely cause is the file being outside the version-controlled directory.
    D: Incorrect. CLI version mismatches usually result in syntax errors, ignored new features, or explicit error messages about directory structures, rather than the agent seamlessly falling back to hallucinating standard build commands.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24313)
```

```question
id: certsafari-domain-2-claude-code-032
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are tasked with refactoring a legacy billing system. Before proposing a new design, you must understand the current data flow, which spans across 200 undocumented files. You are concerned that reading through all these files will exhaust Claude's main conversation context window, leaving no room for the actual refactoring work later. Which approach best mitigates this risk?
options:
  A: "Use plan mode to sequentially open and read all 200 files, storing the architectural decisions in memory."
  B: "Use the Explore subagent to isolate the verbose discovery output and return a concise summary of the data flow to the main conversation."
  C: "Use direct execution to add inline documentation to all 200 files so the context is permanently saved in the codebase."
  D: "Use direct execution with a prompt constraint to only read 10 files per prompt, manually summarizing the results yourself."
correct: B
explanation: |
    A: Plan mode is designed for structuring multi-step tasks, but it does not inherently isolate the content of files read during the process. Sequentially reading 200 files in this mode would still accumulate significant tokens in the main conversation history, leading to context window exhaustion.
    B: The Explore subagent in Claude Code is specifically designed to perform discovery and analysis in a separate context. By isolating the verbose exploration of the 200 files, the subagent can return a concise, high-level summary of findings to the main conversation, preserving the primary context window for the design and refactoring phase.
    C: Direct execution for adding documentation modifies the codebase but doesn't address the immediate need for a summary to guide refactoring. Furthermore, documenting every file would still require reading them, potentially exhausting context, and premature code modification is a risky strategy for initial discovery.
    D: Manually batching and summarizing files is inefficient, time-consuming, and error-prone. It fails to utilize the automated discovery capabilities of Claude Code and still results in manual summary entries that consume context window space without the benefit of the agent's internal synthesis.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23991)
```

```question
id: certsafari-domain-2-claude-code-033
domain: domain-2-claude-code
difficulty: medium
stem: |
  A platform team maintains a shared library of Claude instructions (e.g., security-scans.md, accessibility.md) in a git submodule located at vendor/claude-standards/. A specific microservice only needs the security scanning instructions. How should the microservice be configured?
options:
  A: "Copy the security-scans.md file into the microservice's .claude/rules/ directory."
  B: "Run /memory add vendor/claude-standards/security-scans.md in the microservice directory."
  C: "Add @import vendor/claude-standards/security-scans.md to the microservice's CLAUDE.md file."
  D: "Configure the user-level ~/.claude/CLAUDE.md to globally import the entire vendor/claude-standards/ directory."
correct: C
explanation: |
    A: Incorrect. Copying the file creates technical debt and breaks the link to the shared submodule. This makes it difficult to maintain consistency and receive updates from the central platform team without manual copying.
    B: Incorrect. Running /memory add is used for adding context to Claude's short-term memory or session-specific context. It is not the standard or persistent mechanism for configuring project-wide, scoped instructions or architectural standards.
    C: Correct. Using the @import directive in the microservice's CLAUDE.md file is the best practice for modularity. It allows the microservice to reference only the specific instructions it needs while maintaining a link to the central repository in the vendor submodule, ensuring updates flow through naturally.
    D: Incorrect. Configuring user-level global imports is too broad and violates scoping best practices. This would force all instructions (including irrelevant ones like accessibility.md) into every project the developer works on, potentially leading to context window bloat and instruction conflicts.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24322)
```

```question
id: certsafari-domain-2-claude-code-034
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer on your team complains that Claude is ignoring the API design guidelines when they edit files in the `src/api/` directory. You inspect the repository and find the guidelines written in `.claude/rules/api-guidelines.md`. The file contains only standard markdown text with no headers. Why is Claude failing to load these rules conditionally?
options:
  A: "Rule files must be named exactly `CLAUDE.md` regardless of which directory they are placed in."
  B: "The `.claude/rules/` directory is only evaluated during initial project setup, so the Claude Code server needs to be restarted."
  C: "The file is missing YAML frontmatter with a `paths` field specifying the `src/api/**/*` glob pattern."
  D: "Conditional rules can only be applied to file extensions (e.g., `*.ts`), not to specific directory paths."
correct: C
explanation: |
    A: Incorrect. While `CLAUDE.md` is the default project-wide convention file at the root, path-specific rules in the `.claude/rules/` directory can have any name as long as they are properly formatted with the required metadata.
    B: Incorrect. Claude Code typically monitors the filesystem or re-parses rules when files change; a full server restart is not the primary requirement for rule activation. The core issue here is the structure of the rule file itself.
    C: Correct. Path-specific rules in Claude Code require YAML frontmatter (metadata) at the top of the file. This frontmatter must include a `paths` or `globs` field defining which directory or file patterns the rule applies to (e.g., `paths: ["src/api/**/*"]`). Without this header, Claude does not know which files to associate with the markdown content.
    D: Incorrect. The YAML frontmatter supports powerful glob patterns that can target specific directories, subdirectories, or file groups (e.g., `src/api/**/*`), and is not restricted solely to file extensions.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24245)
```

```question
id: certsafari-domain-2-claude-code-035
domain: domain-2-claude-code
difficulty: medium
stem: |
  An architect is managing a monorepo with a React frontend and a Python backend. They want Claude to follow strict React hooks rules only in the frontend directory, and PEP8 rules only in the backend directory, while sharing general git commit rules across both. How should the architect configure the workspace?
options:
  A: "Place all rules in .claude/rules/ and use the /memory command in each directory to manually toggle the active rule files before prompting."
  B: "Put the React rules in ~/.claude/CLAUDE.md for frontend devs and PEP8 rules in ~/.claude/CLAUDE.md for backend devs."
  C: "Create a root CLAUDE.md with general rules, and in frontend/CLAUDE.md and backend/CLAUDE.md, use @import to pull in react-rules.md and pep8-rules.md respectively."
  D: "Create a single root CLAUDE.md and use conditional YAML tags like if-path: frontend/ to apply the specific rules."
correct: C
explanation: |
    A: Manual toggling using the /memory command is not scalable or maintainable in a professional monorepo setup. It introduces high risk for human error and lacks the automated, context-aware application that a directory-scoped configuration provides.
    B: Global home-directory configuration (~/.claude/CLAUDE.md) is user-specific rather than project-specific. It fails to provide directory-level granularity within a monorepo and prevents team-wide standardization of repository rules.
    C: This is the best-practice approach for modular organization. A root CLAUDE.md establishes shared standards (like git workflows), while subdirectory-specific CLAUDE.md files provide localized context (React vs. PEP8). Using modular imports keeps the configuration maintainable and logically separated.
    D: Claude Code's configuration system does not currently support conditional YAML logic based on file paths within a single root file. Sub-directory scoping via the file system hierarchy is the standard mechanism for rule application.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24314)
```

```question
id: certsafari-domain-2-claude-code-036
domain: domain-2-claude-code
difficulty: medium
stem: |
  A software engineer is using Claude to optimize a critical path algorithm in a high-frequency trading application. The strict requirement is that the algorithm must execute in under 2 milliseconds. Which approach best utilizes test-driven iteration to achieve this goal?
options:
  A: "Ask Claude to write the fastest possible algorithm and trust its internal optimization capabilities."
  B: "Prompt Claude to include inline comments explaining the Big-O time complexity of each line of code to ensure it is fast."
  C: "Write a benchmark test suite that fails if execution exceeds 2ms, prompt Claude to write the algorithm, and iteratively feed the benchmark results back to Claude."
  D: "Ask Claude to generate a mathematical proof demonstrating that the generated algorithm will always run in under 2ms."
correct: C
explanation: |
    A: Simply trusting Claude's initial output without empirical verification fails to account for hardware-specific constraints and lacks the measurement and iterative refinement necessary to converge on a strict real-world performance target.
    B: While Big-O analysis is valuable for understanding asymptotic complexity, it does not provide concrete execution-time guarantees in milliseconds, nor does it account for constant factors or platform-specific behavior. Annotations alone do not form a test-driven feedback loop.
    C: This approach establishes a robust test-driven feedback loop. By creating a benchmark suite that enforces the 2ms requirement and feeding the empirical results back to the model, the user provides the necessary context for the model to iteratively refine the implementation until it meets the specific performance goal in its target environment.
    D: Mathematical proofs are often impractical for strict millisecond-level requirements because runtime depends on hardware, compiler optimizations, and constant factors that asymptotic analysis doesn't capture. Formal proofs cannot replace empirical benchmarks and iterative tuning for concrete hardware-dependent bounds.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24019)
```

```question
id: certsafari-domain-2-claude-code-037
domain: domain-2-claude-code
difficulty: medium
stem: |
  A team has a custom skill `/deploy-cloud` that requires a `region` parameter. The `SKILL.md` body contains the instruction: 'If the user does not provide a region, ask them for it before proceeding.' Despite this, Claude occasionally infers the region from previous chats and executes the deployment without asking, causing deployments to the wrong region. How can the architect strictly enforce that Claude prompts the user if the argument is missing?
options:
  A: "Remove the instruction from the body and add `argument-hint: \"Requires region parameter\"` to the frontmatter."
  B: "Change the skill to a project-scoped command in `.claude/commands/` which natively enforces strict arguments."
  C: "Add `allowed-tools: [PromptUser]` to the frontmatter to ensure Claude has permission to ask questions."
  D: "Add `context: fork` to the frontmatter so the skill runs in isolation and cannot read previous chat history."
correct: D
explanation: |
    A: Adding an `argument-hint` to the frontmatter provides a visual hint or placeholder in the CLI UI for the user, but it does not modify Claude's reasoning or prevent it from using available chat history to infer missing parameters.
    B: While project-scoped commands in `.claude/commands/` are handled differently than skills, simply moving the logic there does not inherently enforce strict argument validation by the LLM unless a specific validation schema is implemented, and it does not address the core issue of information leakage from the chat history.
    C: This is incorrect as `allowed-tools: [PromptUser]` is not a standard configuration property in Claude Code skills. Claude does not require a specific tool permission to ask for user input; it does so through natural dialogue.
    D: Correct. In Claude Code, the `context` frontmatter property controls the scope of the conversation history visible to a skill. By setting `context: fork` (or `none`), the skill's execution is isolated from the previous conversation history. This ensures Claude cannot see or infer the region from earlier messages, forcing it to adhere to the instruction to ask the user when the parameter is not provided in the current turn.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24312)
```

```question
id: certsafari-domain-2-claude-code-038
domain: domain-2-claude-code
difficulty: medium
stem: |
  A DevOps engineer is integrating Claude Code into a CI/CD pipeline (such as GitHub Actions) to perform automated code reviews. However, the pipeline job consistently hangs during the step that executes Claude Code. What is the most likely cause, and how should it be resolved?
options:
  A: "The pipeline is missing the --ci-mode flag, which disables all interactive prompts."
  B: "The command should include the -p or --print flag to run Claude Code in non-interactive mode."
  C: "The CLAUDE_AUTO_APPROVE environment variable must be set to true in the CI runner."
  D: "The command requires the --background flag to allow the CI runner to proceed asynchronously."
correct: B
explanation: |
    A: There is no standard --ci-mode flag for the Claude Code CLI. Using an unsupported or non-existent flag will not disable interactive prompts and will not resolve the hanging issue in a headless CI/CD environment.
    B: Claude Code is interactive by default. The -p or --print flag is specifically used to run the tool in non-interactive mode, which prints results to stdout and terminates. This is essential for CI/CD pipelines that cannot handle interactive prompts, as it prevents the job from waiting indefinitely for user input.
    C: CLAUDE_AUTO_APPROVE is not a documented environment variable for Claude Code CI integration. Standard tool behavior for non-interactive execution is typically managed via command-line flags rather than environment variables.
    D: The --background flag is not a valid flag for Claude Code. Even if it were, running CI steps in the background would not solve interactivity issues and would likely cause the job to terminate before the task is complete, preventing the pipeline from capturing status codes or logs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24205)
```

```question
id: certsafari-domain-2-claude-code-039
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are designing a new caching layer for a high-traffic API. You have three potential approaches: Redis, Memcached, or an in-memory solution. Each approach has different infrastructure requirements and will impact the codebase differently. You want Claude to help you choose the best approach based on your current repository structure without writing any implementation code yet. Which mode should you select?
options:
  A: "Plan mode, because it is designed for complex tasks involving architectural decisions and multiple valid approaches without committing to changes."
  B: "Direct execution, because evaluating infrastructure requirements is a well-scoped task that does not require multi-file modifications."
  C: "Explore subagent, because evaluating multiple caching strategies requires isolating verbose discovery output."
  D: "Direct execution, provided you explicitly instruct Claude to use a 'dry-run' flag to prevent code modifications."
correct: A
explanation: |
    A: Correct. Plan mode is specifically designed for complex tasks that require multi-step thinking, architectural decisions, and evaluating various strategies. It allows Claude to explore the codebase and propose a structured approach or decision-making framework for the user to review before any files are modified.
    B: Incorrect. While direct execution can be used for simple read-only queries, architectural evaluation of three distinct strategies is a complex task. Direct execution is optimized for immediate, well-scoped tasks and might not provide the same level of deliberate planning or multi-file context evaluation as plan mode.
    C: Incorrect. The explore subagent is utilized for deep, verbose discovery and information gathering across a repository, but it is not the primary workflow mode for making high-level architectural decisions or choosing between implementation paths.
    D: Incorrect. While a 'dry-run' flag can prevent unintended changes, it does not substitute for selecting the mode that matches the cognitive complexity of the task. Plan mode is the native workflow for evaluating strategies and obtaining recommendations before proceeding to implementation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23993)
```

```question
id: certsafari-domain-2-claude-code-040
domain: domain-2-claude-code
difficulty: medium
stem: |
  A backend team is migrating a monolithic database to a sharded architecture. The lead developer is using Claude to help design the migration strategy but is unfamiliar with all the potential failure modes and cache invalidation strategies specific to sharding. How should the developer prompt Claude to ensure a robust design before implementation begins?
options:
  A: "'Write a database sharding migration script and ensure you include robust cache invalidation and failure handling.'"
  B: "'I am migrating to a sharded database. Ask me questions one by one to surface design considerations like cache invalidation and failure modes before we write any code.'"
  C: "'Provide a comprehensive list of the top 50 best practices for database sharding and cache invalidation.'"
  D: "'Here is my current database schema. Please guess the best sharding key and write the migration logic immediately.'"
correct: B
explanation: |
    A: This prompt is too vague and attempts a 'one-shot' approach for a complex architectural task. It assumes Claude can address all concerns without sufficient context or discovery of the existing system's constraints, often leading to missed edge cases.
    B: This is the best approach for iterative refinement. By asking Claude to query the developer for context before writing code, it leverages Claude as an architectural consultant. This surfaces design considerations like workload characteristics and failure modes tailored to the specific environment, ensuring a robust design before implementation.
    C: While best practices are useful, a generic list of 50 is not tailored to the team's specific system or constraints. It is a static request that does not engage Claude in an iterative, collaborative design process, making it less effective for surfacing unique project risks.
    D: This is highly risky. Selecting a sharding key requires deep knowledge of data access patterns and distribution. Asking Claude to 'guess' and generate logic immediately skips the critical discovery and design phase, which can lead to catastrophic performance issues or data consistency errors.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24015)
```

```question
id: certsafari-domain-2-claude-code-041
domain: domain-2-claude-code
difficulty: medium
stem: |
  When integrating Claude Code into an automated CI/CD pipeline, which approach provides the most robust mechanism for ensuring that the model's output is machine-parseable and can be reliably processed by downstream tools like `jq`?
options:
  A: "Add a `sed` command to strip out all non-bracket characters before piping the output to `jq`."
  B: "Use the `--output-format json` and `--json-schema` CLI flags to enforce strict, machine-parseable structured output without conversational filler."
  C: "Append the phrase \"Return ONLY valid JSON and absolutely no other text\" to the end of the prompt."
  D: "Use the `--quiet` flag to suppress all conversational filler and logging output from Claude Code."
correct: B
explanation: |
    A: Using post-processing scripts like `sed` to strip non-bracket characters is a brittle workaround. It can easily corrupt valid JSON by removing necessary whitespace, quotes, or characters inside strings, and it does not validate the internal structure against a schema.
    B: Utilizing dedicated CLI flags such as `--output-format json` and `--json-schema` is the standard architectural approach for automation. This instructs Claude Code to bypass conversational filler and strictly adhere to a defined schema, providing a programmatic guarantee of structural correctness for CI/CD workflows.
    C: Relying on prompt-engineering phrases like "Return ONLY JSON" is not a robust method for production pipelines. Models can occasionally ignore such instructions or include subtle conversational prefixes that break strict JSON parsers.
    D: The `--quiet` flag generally suppresses CLI logs and verbosity (logging output), but it does not control the actual formatting of the model's response or eliminate potential conversational filler within the generated payload.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24216)
```

```question
id: certsafari-domain-2-claude-code-042
domain: domain-2-claude-code
difficulty: medium
stem: |
  A junior developer asks for your help with a specific task: they need to add a standard email regex validation check to the `email` input field in `RegistrationForm.tsx`. The scope is entirely contained within this single function. As an architect, what Claude Code workflow do you recommend they use?
options:
  A: "Plan mode, to ensure the regex does not conflict with other validation schemas in the application."
  B: "Direct execution, because it is appropriate for simple, well-scoped changes like adding a single validation check."
  C: "The Explore subagent, to summarize how email validation is handled elsewhere before making the change."
  D: "Plan mode for drafting the regex, followed by the Explore subagent for injecting it into the file."
correct: B
explanation: |
    A: Incorrect. Plan mode is intended for larger, multi-step changes that may affect multiple files or require explicit coordination. Using it for a localized change inside a single function adds unnecessary overhead and slows down a low-risk development task.
    B: Correct. Direct execution is the most efficient workflow for simple, well-scoped changes confined to a single file or function. Because the task is straightforward and the logic is localized, direct execution allows the developer to implement and validate the change quickly without the friction of a planning phase.
    C: Incorrect. The Explore subagent is primarily used for codebase discovery and summarizing implementation patterns across many files. Since the problem statement specifies the scope is entirely contained within one function, invoking a subagent for discovery is unnecessary.
    D: Incorrect. This combination is over-engineered for the requirement. Combining plan mode and the Explore subagent for a single regex injection introduces excessive steps and complexity for a task that can be handled efficiently with a single direct instruction.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23995)
```

```question
id: certsafari-domain-2-claude-code-043
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are proposing a shift from a REST API to a GraphQL API for your application's frontend data fetching. You want Claude to map out the current REST endpoints and draft a proposed GraphQL schema based on those endpoints. You explicitly do not want Claude to modify any existing routing or controller files during this phase. Which mode is specifically designed for this type of safe codebase exploration and design?
options:
  A: "Plan mode"
  B: "Direct execution"
  C: "Explore subagent"
  D: "Read-only execution mode"
correct: A
explanation: |
    A: Correct. Plan mode (invoked via /plan or --plan) is specifically designed for safe codebase exploration, high-level architecture review, and design tasks. It allows Claude to analyze files, map endpoints, and produce proposed schemas or step-by-step plans without making any modifications to the repository files, providing a non-destructive workflow for review before execution.
    B: Incorrect. Direct execution is the standard mode where Claude is permitted to perform changes or run actions that modify the codebase. This mode is inappropriate when the user explicitly requires that no existing files be modified during the exploration and design phase.
    C: Incorrect. This is not a recognized workflow mode within the Claude Code configuration. While Claude may use internal mechanisms for exploration, the user-facing control for avoiding modifications while planning is Plan mode.
    D: Incorrect. While 'read-only' describes the behavior of the session, 'Plan mode' is the canonical and documented feature name in Claude Code for achieving this specific outcome of analysis and design without file modification.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23998)
```

```question
id: certsafari-domain-2-claude-code-044
domain: domain-2-claude-code
difficulty: medium
stem: |
  A monorepo contains multiple microservices. The root `CLAUDE.md` defines standard Docker build commands. The `services/payment/` directory requires a specialized Bazel build command. How should the architect configure the workspace so Claude automatically uses Bazel only when working within the payment service?
options:
  A: "Add an `@import services/payment/bazel.md` statement to the user-level `~/.claude/CLAUDE.md` file."
  B: "Create a `CLAUDE.md` file inside the `services/payment/` directory with instructions for Claude on how to use the specialized Bazel build commands for that service."
  C: "Place a `bazel-rules.md` file in the root `.claude/rules/` directory and delete the root `CLAUDE.md`."
  D: "Modify the root `CLAUDE.md` to include a bash script that detects the current working directory before executing a build."
correct: B
explanation: |
    A: Incorrect. The documentation does not describe a user-level `~/.claude/CLAUDE.md` file or an `@import` syntax for markdown files. Global user settings are managed in `~/.claude/config.json`, while project-specific context is provided by `CLAUDE.md` files within the repository itself.
    B: Correct. This follows the recommended "Progressive Disclosure" pattern. According to the documentation, placing a `CLAUDE.md` in a subdirectory provides specialized context that augments the root `CLAUDE.md`. When Claude operates within `services/payment/`, it uses the more specific, local context to guide its actions, such as using the correct Bazel commands for that service.
    C: Incorrect. The documentation does not specify a `.claude/rules/` directory for this purpose. Deleting the root `CLAUDE.md` is also the wrong approach, as it would remove the standard Docker build instructions and other shared context required for all other microservices in the monorepo.
    D: Incorrect. While a complex script might work, it is not the idiomatic or recommended approach. The intended method is to provide declarative context through the hierarchical `CLAUDE.md` file system. This allows Claude to interpret the context directly, which is more efficient and maintainable than parsing and executing conditional logic in a shell script.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28370)
```

```question
id: certsafari-domain-2-claude-code-045
domain: domain-2-claude-code
difficulty: medium
stem: |
  A legacy project contains both old JavaScript tests (`*.spec.js`) and newly migrated TypeScript tests (`*.test.ts`). You have drafted a unified testing strategy document for Claude. How should you configure the `.claude/rules/testing.md` file so that Claude loads these instructions when editing either type of test file?
options:
  A: "Include YAML frontmatter with `paths: [\"**/*.spec.js\", \"**/*.test.ts\"]`."
  B: "Create two separate rule files, one for each file extension, as the `paths` field only accepts a single string value."
  C: "Use a regex pattern in the YAML frontmatter: `paths: [\"**/*.(spec\\\\.js|test\\\\.ts)\"]`."
  D: "Place the rule file in the root directory and name it `CLAUDE.test.md` to automatically target all test extensions."
correct: A
explanation: |
    A: Correct. Claude Code rule files use YAML frontmatter where the `paths` field accepts an array of glob patterns. Listing both file patterns in this array ensures the rule is applied when editing either `.spec.js` or `.test.ts` files. This is the standard, most maintainable way to target multiple extensions.
    B: Incorrect. The `paths` field in the YAML frontmatter supports an array of strings. Creating separate rule files for each extension is unnecessary and makes managing a unified testing strategy more difficult.
    C: Incorrect. The `paths` field in Claude rule files expects glob patterns rather than raw regular expressions. Standard glob syntax does not support the parenthesized regex groups (e.g., `(a|b)`) shown here. Using an array of distinct glob strings is the correct method.
    D: Incorrect. Claude relies on the YAML frontmatter inside files located in `.claude/rules/` to determine path-specific triggers. Simply naming a file `CLAUDE.test.md` in the root directory will not automatically target specific file extensions; only the root `CLAUDE.md` is automatically loaded for the entire project.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24244)
```

```question
id: certsafari-domain-2-claude-code-046
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are halfway through a complex, multi-file refactoring session using Claude Code. You suddenly realize you need to look up how a specific third-party payment webhook is handled in a massive, unrelated legacy module. You need this information to continue, but you cannot afford to lose the context of your current refactoring session. What is the most architecturally sound way to retrieve this information?
options:
  A: "Switch to plan mode to investigate the legacy module, then switch back to direct execution."
  B: "Use the Explore subagent to investigate the legacy module, isolating the verbose output and returning only the necessary summary."
  C: "Use direct execution to query the legacy module, as Claude's context window is large enough to handle both tasks simultaneously."
  D: "Commit your current refactoring changes, clear the context window, use direct execution to find the webhook info, and then resume refactoring."
correct: B
explanation: |
    A: Plan mode is intended for outlining and validating multi-step plans before execution within the current scope. It does not provide the necessary isolation to investigate unrelated modules without polluting the active session's context window.
    B: The Explore subagent is the architecturally correct tool for this scenario. It allows for isolated, investigative work in a separate context, capturing verbose diagnostic or exploratory output and returning only the essential summary to the main session. This prevents context bloat and maintains the focus of the primary refactoring task.
    C: While Claude has a significant context window, using direct execution for exploratory tasks in the main session risks 'context poisoning.' Injecting large amounts of unrelated legacy code can dilute the model's focus on the active refactoring and may lead to reaching token limits prematurely.
    D: This is a heavyweight and disruptive approach. Committing changes prematurely and clearing the context destroys the immediate state and historical nuances of the refactoring session, which sub-agent workflows are specifically designed to avoid.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23997)
```

```question
id: certsafari-domain-2-claude-code-047
domain: domain-2-claude-code
difficulty: medium
stem: |
  When integrating Claude Code into a CI/CD pipeline for automated test generation, what is the most effective way to ensure the model focuses on untested scenarios rather than duplicating existing test coverage?
options:
  A: "Add the --exclude-covered flag to the Claude Code command in the CI script."
  B: "Provide the existing test files in the context of the prompt so Claude knows which scenarios are already covered."
  C: "Update the CLAUDE.md file to set the test_generation_mode parameter to strict."
  D: "Run Claude Code with the --coverage-aware flag pointing to the project's coverage.xml file."
correct: B
explanation: |
    A: There is no standard --exclude-covered flag in the Claude Code CLI. Logic to exclude already-covered scenarios must be handled through providing relevant context or orchestration rather than a single CLI flag.
    B: Claude Code generates outputs based on the context it is provided. By including existing test files or coverage summaries in the prompt context, the model can identify gaps in the current test suite and generate only the missing or complementary tests, preventing duplication.
    C: While CLAUDE.md is a recognized convention for providing project-specific instructions to Claude, it does not support a built-in 'test_generation_mode' parameter to automate coverage analysis.
    D: Claude Code does not natively support a --coverage-aware flag or the direct ingestion of coverage.xml files through a specific CLI argument to automatically filter its test generation logic.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24208)
```

```question
id: certsafari-domain-2-claude-code-048
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer is integrating the `claude-code` command-line tool into a CI/CD pipeline. A step in the pipeline successfully generates a new Python module. The subsequent step, intended to perform a security analysis on the generated code, fails to produce a security report and instead returns a generic conversational response. The developer's script issued the prompt: "Review the new module for security vulnerabilities." What is the most likely reason the dedicated security analysis was not performed?
options:
  A: "The CI/CD runner lacks the necessary sandboxing configuration, which is a mandatory prerequisite for running any security analysis within `claude-code`."
  B: "The developer used a generic natural language prompt instead of the required built-in `/security-review` slash command to trigger the specialized security analysis feature."
  C: "The `--security-scan` flag was omitted from the `claude-code` command, causing it to default to a standard conversational response."
  D: "The pipeline is using a base Claude model via an API, which does not support the specialized commands available in the full `claude-code` tool."
correct: B
explanation: |
    A: Incorrect. While `claude-code` does feature a sandboxed bash tool for isolated command execution, the research does not state that sandboxing is a prerequisite for triggering the security analysis feature itself. The failure mode described—a generic conversational response—points to an incorrect invocation method rather than a misconfigured execution environment.
    B: Correct. The research explicitly states that `claude-code` includes a built-in `/security-review` slash command for comprehensive security analysis. Using a generic natural language prompt bypasses this specialized functionality, causing Claude to treat it as a standard conversational query. The official documentation identifies the `/security-review` command as the recommended method for this task.
    C: Incorrect. The provided research makes no mention of a `--security-scan` flag for the `claude-code` tool. Specialized features like security reviews are invoked using built-in slash commands, such as `/security-review`, not command-line flags appended to a prompt.
    D: Incorrect. The scenario specifies that the developer is integrating the `claude-code` tool, which is a distinct command-line application with its own set of built-in commands. The issue is not the underlying model but the failure to use the correct command (`/security-review`) provided by the tool itself.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32443)
```

```question
id: certsafari-domain-2-claude-code-049
domain: domain-2-claude-code
difficulty: medium
stem: |
  A frontend developer is tasked with setting up a Kubernetes cluster with an Istio service mesh. The developer has zero experience with infrastructure-as-code or Kubernetes networking. They want to use Claude to generate the necessary YAML configuration files. Which prompting strategy should the developer use to ensure a secure and appropriate architecture?
options:
  A: "Prompt Claude to generate standard, production-ready Kubernetes and Istio YAML files based on industry best practices."
  B: "Prompt Claude to act as a Kubernetes expert and ask the developer questions about their application's traffic patterns, security needs, and scale before generating any YAML."
  C: "Ask Claude to provide a comprehensive tutorial on Kubernetes and Istio, read it, and then attempt to write the YAML manually."
  D: "Provide Claude with the frontend source code and ask it to automatically infer and generate the necessary Kubernetes configuration."
correct: B
explanation: |
    A: Incorrect. While this approach might generate standard functional YAML files, it fails to account for the specific context of the application. Production readiness depends on application-specific traffic patterns and security policies; without clarification, the generated YAML may include unsafe defaults or miss required controls like mTLS, specific network policies, or resource limits.
    B: Correct. This strategy leverages an interactive, iterative approach where Claude acts as a subject matter expert to gather essential context before generation. By asking targeted questions about traffic, security, and scale, Claude can ensure the generated manifests are tailored to the application's actual needs, reducing misconfiguration risk and supporting progressive refinement toward a secure architecture.
    C: Incorrect. While educational, reading a tutorial and attempting manual drafting is highly time-consuming and error-prone for a developer with no experience. This approach ignores the efficiency and safety provided by an AI assistant capable of expert-guided generation and refinement based on specific technical requirements.
    D: Incorrect. Frontend source code typically lacks the necessary operational, networking, and security context required for infrastructure configuration. Inferring infrastructure requirements solely from source code is fragile and likely to result in incomplete or insecure configurations that miss external dependencies and runtime constraints.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24020)
```

```question
id: certsafari-domain-2-claude-code-050
domain: domain-2-claude-code
difficulty: medium
stem: |
  An architect is designing a multi-stage, automated CI/CD workflow using Claude. The first stage generates code based on a specification, and the second stage performs a critical review of that generated code. According to Anthropic's documented best practices, which architectural pattern is most effective for ensuring a reliable and unbiased review?
options:
  A: "Combine the generation and review tasks into a single, complex prompt to ensure the model has all context simultaneously."
  B: "Invoke the review stage using a specialized, built-in `--review-mode` flag that forces the model to re-evaluate its own output."
  C: "Implement a multi-agent or prompt chaining pattern, where a 'generator' agent completes the first stage and passes its code output to a separate 'reviewer' agent for the second stage."
  D: "Run the generation and review steps sequentially within the same long-running session to preserve the entire context history."
correct: C
explanation: |
    A: Incorrect. Anthropic's documentation recommends breaking down complex tasks into sequential steps, a technique known as 'prompt chaining'. A single, large prompt for both generation and review is less reliable, harder to debug, and less accurate than a multi-step approach.
    B: Incorrect. Anthropic's official documentation does not describe a `--review-mode` flag or a similar built-in mechanism for this purpose. Reliable multi-stage workflows should be built using documented architectural patterns like prompt chaining or multi-agent systems.
    C: Correct. This approach aligns with the 'coordinator-subagent' pattern and 'prompt chaining' best practices covered in the Claude Certified Architect exam. Using a separate agent or a distinct step for review isolates concerns, manages context effectively by passing only the necessary data (the code), and avoids potential self-review bias, leading to a more robust and rigorous workflow.
    D: Incorrect. While this might seem to preserve context, long-running sessions can suffer from 'context rot,' where model accuracy degrades as the token count grows. The recommended practice is to pass the specific output of one step (the generated code) as a clean input to the next, rather than accumulating the entire conversational history.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28009)
```

```question
id: certsafari-domain-2-claude-code-051
domain: domain-2-claude-code
difficulty: medium
stem: |
  A software engineering team is integrating Claude Code into their CI/CD pipeline to automate accessibility reviews across multiple repositories. They need a solution that ensures review criteria are version-controlled, easy to update, and consistently applied across different environments. What is the most effective way to configure these accessibility standards?
options:
  A: "Create a global ~/.claude_a11y.json configuration file on the CI runner instances."
  B: "Move the accessibility review criteria and testing standards into each repository's CLAUDE.md file."
  C: "Use the --review-profile wcag flag to activate Claude's built-in accessibility ruleset."
  D: "Set the CLAUDE_REVIEW_CRITERIA environment variable in the CI/CD platform settings."
correct: B
explanation: |
    A: Global configuration files on CI runners are brittle because runners are typically ephemeral or autoscaled. This approach lacks versioning, is difficult to maintain across multiple runner types, and prevents repository-specific customization.
    B: The CLAUDE.md file is the primary mechanism for providing repository-specific context and instructions to Claude Code. Placing accessibility standards in this file ensures they are version-controlled alongside the source code, easily discoverable by contributors, and automatically picked up by Claude during CI/CD pipeline execution.
    C: This assumes the existence of a specific built-in CLI flag that may not exist or may be too generic for specific project needs. Best practice favors explicit, project-level instructions in CLAUDE.md over relying on hypothetical default profiles.
    D: Environment variables are difficult to manage for complex, multi-line review criteria and do not provide a clear audit trail or version history within the code repository itself. They also make local reproduction of CI/CD failures more difficult for developers.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24212)
```

```question
id: certsafari-domain-2-claude-code-052
domain: domain-2-claude-code
difficulty: medium
stem: |
  A security engineer is designing a skill `/exploit-test` that brainstorms potential attack vectors on a given endpoint. The brainstorming process is highly exploratory and should not pollute the main chat history. Furthermore, to ensure safety, the skill must absolutely not execute any network requests or shell commands during the brainstorming phase. How should the `SKILL.md` frontmatter be configured to meet both requirements?
options:
  A: "Include `context: fork` and `allowed-tools: [ReadFile, WriteFile]` in the frontmatter."
  B: "Include `isolate-chat: true` and `argument-hint: \"safe-mode\"` in the frontmatter."
  C: "Include `context: fork` and add a strict system prompt in `CLAUDE.md` disabling network tools."
  D: "Include `allowed-tools: [None]` and `user-scope: private` in the frontmatter."
correct: A
explanation: |
    A: This is the correct configuration. `context: fork` ensures that the skill runs in a new, isolated chat context, preventing it from polluting the main history. Setting `allowed-tools` to a specific list (like `ReadFile` and `WriteFile`) acts as a strict whitelist; since shell execution (`bash`) and network requests (`curl`) are not in the list, they are prohibited by the system, meeting the safety requirement directly within the frontmatter.
    B: Incorrect. `isolate-chat` is not the standard terminology for Claude Code skill configuration. Additionally, `argument-hint` is a UI feature that provides hints in the CLI; it is not a security control and cannot prevent the model from attempting tool execution.
    C: Incorrect. While `context: fork` addresses history isolation, the question specifically asks how the `SKILL.md` frontmatter should be configured to meet both requirements. Placing security instructions in `CLAUDE.md` (a separate project-level file) fails the requirement to configure the specific skill's frontmatter for safety.
    D: Incorrect. While `allowed-tools: [None]` would strictly prevent all tool usage, `user-scope: private` governs permissions and visibility rather than session context or history isolation. It does not address the requirement to avoid polluting the main chat history.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24307)
```

```question
id: certsafari-domain-2-claude-code-053
domain: domain-2-claude-code
difficulty: medium
stem: |
  A frontend team is migrating a large application from React to Vue. They want Claude to help translate specific components. However, they only want this translation behavior to occur when explicitly requested, as they are still maintaining the React codebase for bug fixes and do not want Claude to accidentally generate Vue code during routine React maintenance tasks. Where should the architect configure the translation instructions?
options:
  A: "In the project's `CLAUDE.md` file, enclosed in a conditional markdown block."
  B: "In a custom skill (e.g., `.claude/skills/translate-vue/SKILL.md`) so it is only invoked on-demand."
  C: "In a user-scoped command (e.g., `~/.claude/commands/translate-vue`) shared via a gist."
  D: "In the project's `CLAUDE.md` file, using the `context: fork` frontmatter option."
correct: B
explanation: |
    A: Incorrect. Instructions in a project's `CLAUDE.md` file provide persistent context for all interactions within that project. This would cause Claude to consider the translation rules at all times, which is the opposite of the desired on-demand behavior. Conditional markdown blocks are not a standard feature for controlling instruction invocation.
    B: Correct. According to Anthropic's documentation, custom skills are the recommended way to encapsulate specialized instructions. To ensure a skill is only invoked on-demand by the user (e.g., with a slash command) and not automatically by the model, the `disable-model-invocation: true` flag should be set in the `SKILL.md` frontmatter. This prevents Claude from accidentally applying the translation logic during unrelated tasks.
    C: Incorrect. The official mechanism for creating reusable, on-demand instructions is a 'skill', which is defined in a `SKILL.md` file, not a 'command' in a separate `commands` directory. While skills can be user-scoped, this option describes an incorrect file structure and mechanism.
    D: Incorrect. The `context: fork` option is not a documented feature for `CLAUDE.md` frontmatter. Placing the instructions in the main project `CLAUDE.md` file would make them part of the default context, leading to the unwanted behavior of Claude applying them during all tasks.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28016)
```

```question
id: certsafari-domain-2-claude-code-054
domain: domain-2-claude-code
difficulty: medium
stem: |
  You are architecting a large monorepo with 40 distinct microservices. Each microservice has its own tests/ directory. You need Claude to follow a strict mocking convention whenever it edits any test file across the entire repository. You want to minimize maintenance overhead and avoid duplicating instructions. Which approach should you implement?
options:
  A: "Create a .claude/rules/testing.md file with YAML frontmatter paths: [\"**/tests/**/*\"]."
  B: "Create a CLAUDE.md file in the root directory and use markdown headers to specify the **/tests/**/* path."
  C: "Write a CI/CD script to automatically generate and sync a CLAUDE.md file into each of the 40 tests/ directories."
  D: "Add the testing conventions to the root CLAUDE.md file and instruct Claude in plain text to only read them when editing test files."
correct: A
explanation: |
    A: This is the correct approach. Claude Code uses files in the `.claude/rules/` directory with YAML frontmatter to support conditional rule loading. Using a glob pattern like `**/tests/**/*` allows a single configuration file to apply rules to matching directories throughout a large monorepo, centralizing the logic and minimizing maintenance overhead.
    B: A root-level `CLAUDE.md` file is used for general project context. It does not support the declarative, path-specific rule filtering mechanism provided by the `.claude/rules/` system. Markdown headers are treated as content rather than functional filters for loading specific conventions.
    C: Synchronizing 40 identical files across the repository creates significant maintenance debt and violates the requirement to avoid instruction duplication. This approach is prone to drift and bypasses the native, more efficient rule-loading features of the tool.
    D: Plain-text instructions in the root `CLAUDE.md` are less reliable and less efficient. Claude reads the root file on every interaction, whereas the rules engine only loads specific rule files when the file being edited matches the defined paths, saving tokens and improving adherence.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24241)
```

```question
id: certsafari-domain-2-claude-code-055
domain: domain-2-claude-code
difficulty: medium
stem: |
  During a complex refactoring task involving both Python backend files and React frontend files simultaneously, a developer notices Claude is dropping earlier conversation history faster than usual. The repository has a massive root CLAUDE.md covering all stack conventions. How does migrating to .claude/rules/ with path-specific rules resolve this specific issue?
options:
  A: "It automatically compresses the markdown text in the .claude/rules/ directory using a token-efficient binary format before sending it to the LLM."
  B: "It reduces irrelevant context and token usage by only loading the Python rules when a Python file is edited, and React rules when a React file is edited, preserving more of the context window for conversation history."
  C: "It bypasses the standard context window entirely by loading the rules into a separate vector database for semantic retrieval."
  D: "It increases the maximum token limit of the underlying Claude model by signaling that the workspace is using an advanced configuration."
correct: B
explanation: |
    A: Incorrect. Migrating to .claude/rules/ does not involve binary compression or a change in file format. The rules are still processed as text; the system simply manages which text files are included in the prompt based on file paths.
    B: Correct. Path-specific rules allow Claude Code to conditionally load only the instructions relevant to the files currently being modified. By replacing a monolithic CLAUDE.md (which is sent in every request) with targeted rules, the system minimizes 'token bloat' from irrelevant context, thereby maximizing the remaining context window available for conversation history.
    C: Incorrect. While some RAG (Retrieval-Augmented Generation) systems use vector databases, Claude's path-specific rules feature is based on glob-pattern matching for conditional loading into the standard context window, not semantic retrieval from an external database.
    D: Incorrect. The maximum token limit is a hard constraint of the specific Claude model version being used and cannot be increased by workspace configuration files. The advantage of .claude/rules/ is the efficient utilization of the existing limit.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24250)
```

```question
id: certsafari-domain-2-claude-code-056
domain: domain-2-claude-code
difficulty: medium
stem: |
  Claude has generated a Python script to migrate user profiles from a legacy system to a new database. The script works perfectly for 95% of the records but crashes with a `TypeError` when it encounters legacy profiles where the `last_login` field is `null`. What is the most effective way to guide Claude to fix this specific edge case?
options:
  A: "Prompt Claude with: 'The script crashes on null values. Please rewrite it to be more robust.'"
  B: "Ask Claude to wrap the entire migration loop in a generic `try/except` block to bypass errors."
  C: "Provide Claude with a specific test case showing a JSON profile with a `null` `last_login` field and the exact expected SQL output for that record."
  D: "Request that Claude switch the script to a strongly-typed language like Java to automatically handle null references."
correct: C
explanation: |
    A: This prompt is too vague. Terms like 'more robust' do not provide a reproducible example or specific expected behavior. Iterative refinement is most effective when you provide concrete failing cases rather than broad instructions.
    B: Wrapping a loop in a generic `try/except` block is an anti-pattern that hides the underlying issue. It reduces observability and data correctness by silently skipping records or masking other potential bugs instead of addressing the logic error.
    C: Providing a minimal reproducible test case with the specific failing data and the desired output is the most effective way to guide Claude. This follows best practices for iterative refinement by defining the failure domain and giving Claude the concrete stimulus needed to produce a precise fix.
    D: Switching to a different programming language is an unnecessary, heavyweight solution that requires a complete rewrite. Furthermore, strongly-typed languages like Java still require explicit handling of null references, so it would not automatically solve the logic issue.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24017)
```

```question
id: certsafari-domain-2-claude-code-057
domain: domain-2-claude-code
difficulty: medium
stem: |
  A DevOps engineer is building a CI/CD pipeline that uses an Anthropic model to generate documentation updates. The pipeline requires the model's output to be a JSON object containing a specific array of strings. The current implementation sometimes produces malformed JSON or an incorrect structure. According to Anthropic's documentation, what is the most reliable method to ensure the model consistently returns valid JSON that adheres to the required schema?
options:
  A: "Use the \"Structured Outputs\" feature by defining a JSON schema for the desired array structure and including it in the `output_config.format` parameter of the API request."
  B: "Add a detailed example of the desired JSON array format to the system prompt and instruct the model to follow it precisely."
  C: "Include a `CLAUDE.md` file in the project with a section dedicated to output formatting, showing an example of the correct JSON array."
  D: "Implement a post-processing script that validates the model's output and attempts to correct it by wrapping single objects in an array."
correct: A
explanation: |
    A: Correct. According to Anthropic's documentation, the "Structured Outputs" feature is the officially recommended and most reliable method for ensuring model output conforms to a specific JSON schema. By providing the schema in the `output_config.format` parameter, you guarantee that the model's response will be valid JSON that matches your defined structure, eliminating parsing errors and schema non-compliance.
    B: Incorrect. While providing examples in the prompt (prompt engineering) can guide the model, it does not guarantee compliance. The model might still deviate from the requested format. The research indicates that the API-native "Structured Outputs" feature provides more robust enforcement than prompt engineering alone.
    C: Incorrect. The research specifies that `CLAUDE.md` files are used by Claude Code to load project context and guide the model's understanding. They are not a mechanism for the strict enforcement of output formats like a JSON schema. Relying on this for format consistency is not the recommended approach.
    D: Incorrect. While a post-processing script is a possible workaround, it is not the recommended best practice. This approach adds complexity and fragility to the pipeline and does not solve the root cause of inconsistent output. The native "Structured Outputs" feature is a more direct and reliable solution provided by the Anthropic API.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28363)
```

```question
id: certsafari-domain-2-claude-code-058
domain: domain-2-claude-code
difficulty: medium
stem: |
  A junior engineer wants to enforce a specific logging format for all background worker scripts. They create a file with the correct YAML frontmatter `globs: ["workers/**/*.js"]` and save it as `docs/logging-rules.md`. After a week, they report that Claude has never followed these logging formats. What is the most likely reason the rule is not being applied?
options:
  A: "The file extension must be changed from `.md` to `.yaml` so Claude can parse the frontmatter correctly."
  B: "The `globs` array must use absolute file paths instead of relative glob patterns."
  C: "The file must be renamed to `CLAUDE.md` to be recognized by the Claude Code agent."
  D: "The file must be moved to the `.claude/rules/` directory, as Claude only scans this specific directory for path-scoped rules."
correct: D
explanation: |
    A: Incorrect. According to Anthropic's documentation, rules for Claude Code, including path-scoped rules and Skills, are defined within Markdown (`.md`) files. The YAML frontmatter is parsed from within the `.md` file itself.
    B: Incorrect. Path-scoping in Claude Code rules is designed to use relative glob patterns that match files within the project's directory structure. Requiring absolute paths would make the rules non-portable and is not the documented behavior.
    C: Incorrect. The `CLAUDE.md` file is used for providing persistent, project-wide context and does not use frontmatter for path-scoping. The scenario describes a modular, path-scoped rule, which requires a different mechanism.
    D: Correct. The research confirms that for modular and path-scoped rules, Claude Code is designed to automatically discover and load `.md` files from the `.claude/rules/` directory. Placing the rule file in `docs/` means the agent will not find or apply it.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=31737)
```

```question
id: certsafari-domain-2-claude-code-059
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer wants to modify a team-wide skill `/review-pr` located in `.claude/skills/review-pr/SKILL.md` to include a personal checklist for accessibility standards. They want to use this modified version daily but must ensure their changes do not alter the team's shared version or cause version control conflicts. What is the recommended approach?
options:
  A: "Edit `.claude/skills/review-pr/SKILL.md` and add the file to the repository's `.gitignore`."
  B: "Create a new skill in `~/.claude/skills/my-review-pr/SKILL.md` containing the customized instructions."
  C: "Add the personal checklist to their global `~/.claude/CLAUDE.md` file to override the project skill."
  D: "Use the `context: fork` option in the existing project skill to branch the logic for their specific user ID."
correct: B
explanation: |
    A: Editing the team-wide skill directly will change the shared repository file and can introduce conflicts for other team members. Adding the file to .gitignore does not untrack a file that is already committed, so this doesn't reliably prevent version-control issues and risks accidental commits of personal changes.
    B: Placing a customized skill in the user-specific directory (~/.claude/skills/) allows the developer to maintain a personal variant of the skill. This keeps the modifications local to the developer's machine, avoids version-control conflicts in the project repo, and preserves the shared team skill for the rest of the contributors while allowing daily use of the personal checklist.
    C: The global ~/.claude/CLAUDE.md file is used for providing high-level instructions and global project context to Claude, not for defining or overriding the specific logic of slash command skills. It lacks the structure required to define a new command or properly override an existing skill's behavior.
    D: There is no supported 'context: fork' option in the Claude Code skill specification for branching logic based on user ID. Attempting to use non-existent configuration options would not work, and modifying the project skill file still introduces potential conflicts and unintended shared changes.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24306)
```

```question
id: certsafari-domain-2-claude-code-060
domain: domain-2-claude-code
difficulty: medium
stem: |
  A development team relies on a custom skill called `/analyze-legacy` to perform deep static analysis on a monolithic codebase. Developers complain that invoking this skill generates extremely verbose output that overwhelms the main conversation, causing Claude to lose track of the original refactoring task they were discussing. Which configuration change will resolve this issue?
options:
  A: "Add `context: fork` to the frontmatter of the `SKILL.md` file."
  B: "Move the skill from `.claude/skills/` to `~/.claude/skills/`."
  C: "Add `allowed-tools: [ReadFile]` to the frontmatter of the `SKILL.md` file."
  D: "Migrate the instructions from the `SKILL.md` file into the project's `CLAUDE.md` file."
correct: A
explanation: |
    A: Correct. Adding `context: fork` to the frontmatter of the `SKILL.md` file directs Claude Code to execute the skill in a separate, isolated conversation thread. This ensures that the verbose output or tool logs from the skill do not flood the main conversation history, thereby preserving the original task's context window and preventing the model from losing track of the discussion.
    B: Incorrect. Moving the skill from the project-level directory (`.claude/skills/`) to the user-level global directory (`~/.claude/skills/`) only changes the scope of where the skill is available. It does not alter how the output is presented or how it impacts the conversation context.
    C: Incorrect. The `allowed-tools` directive is used to restrict the specific tools (e.g., ReadFile, WriteFile) the skill is permitted to use. This provides a security or capability boundary but does not address context isolation or output verbosity.
    D: Incorrect. `CLAUDE.md` is used for general project guidelines and context, not for defining the execution logic of slash commands. Moving instructions there would not change the execution context or prevent output from cluttering the main conversation thread.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24302)
```

```question
id: certsafari-domain-2-claude-code-061
domain: domain-2-claude-code
difficulty: medium
stem: |
  A newly onboarded developer clones the company's microservice repository. They attempt to use a `/build-docker` skill that senior developers frequently use, but Claude responds that the skill is unrecognized. The senior developers demonstrate that the skill works perfectly on their local machines within the same repository. What is the most likely architectural reason for this discrepancy?
options:
  A: "The senior developers defined the skill in their personal `~/.claude/skills/` directory, not in the project's shared `.claude/skills/` directory."
  B: "The new developer has not yet run the `claude sync` command to download project-scoped skills."
  C: "The skill is configured with `context: private`, which restricts its usage to the original author's user account."
  D: "The skill definition exists in the project's `.claude/skills/` directory but is missing a required `ANTHROPIC_API_KEY` in its configuration."
correct: A
explanation: |
    A: Correct. Claude Code loads skills from two primary locations: a personal directory (`~/.claude/skills/`) and a project-scoped directory (`.claude/skills/` within the repository). If the skill was defined in the senior developers' personal directories, it would not be part of the version-controlled repository and therefore would not be available to the new developer after cloning, leading to the 'unrecognized' error.
    B: Incorrect. The `claude sync` command is not an official Anthropic utility. It refers to community-developed, third-party tools created to solve the problem of synchronizing Claude configurations. The official and recommended approach for sharing project-scoped skills is to commit them to a version control system like Git, which the new developer has already cloned.
    C: Incorrect. There is no `context: private` configuration for skills mentioned in Anthropic's official documentation or related research. Skill visibility is determined by its location (personal, project, or enterprise), not by a metadata flag within the skill's definition file.
    D: Incorrect. A missing API key or other configuration issue within the skill's files would likely cause an authentication or execution error when the skill is run. It would not prevent Claude from recognizing the skill's existence, as the 'unrecognized' error indicates that Claude cannot find the skill definition file itself.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=25810)
```

```question
id: certsafari-domain-2-claude-code-062
domain: domain-2-claude-code
difficulty: medium
stem: |
  A project's `CLAUDE.md` contains 50 lines of git commit standards, 100 lines of UI component guidelines, and 80 lines of database schema rules. The team wants Claude to only load the database rules when actively working on backend files, reducing token usage and distraction. What is the correct architectural approach?
options:
  A: "Keep all rules in the root CLAUDE.md but wrap them in XML tags like <backend> and <frontend>."
  B: "Move the database rules to backend/CLAUDE.md, the UI rules to frontend/CLAUDE.md, and keep the git standards in the root CLAUDE.md."
  C: "Move all rules into .claude/rules/ and delete the root CLAUDE.md entirely."
  D: "Place the database rules in ~/.claude/CLAUDE.md so they are only loaded for backend developers."
correct: B
explanation: |
    A: Wrapping rules in XML-style tags inside a single root CLAUDE.md file does not prevent the entire file from being loaded into Claude's context. The model still consumes the full token count and must process the irrelevant sections, which fails to meet the goal of reducing distraction and token usage.
    B: The recommended architecture for Claude Code involves a directory-based hierarchy. By placing database-specific rules in `backend/CLAUDE.md` and UI rules in `frontend/CLAUDE.md`, Claude selectively loads only the relevant instructions based on the current working directory. The root `CLAUDE.md` remains the appropriate place for global standards like git commit rules, ensuring clean inheritance and reduced context window pressure.
    C: Moving all rules to a hidden subdirectory and removing the root CLAUDE.md breaks the conventional discovery mechanism for project-wide standards. It also centralizes information in a way that defeats directory-based scoping, potentially leading to all rules being loaded or none at all depending on the specific tool's discovery logic.
    D: Placing rules in the user's home directory (`~/.claude/`) makes them machine-local rather than project-scoped. This prevents the team from sharing the same standards and does not address the requirement to scope loading based on specific backend file paths within the repository.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24321)
```

```question
id: certsafari-domain-2-claude-code-063
domain: domain-2-claude-code
difficulty: medium
stem: |
  A software team has two distinct requirements for Claude. First, all Python code generated in the repository must strictly adhere to PEP-8 and utilize type hints. Second, developers occasionally need Claude to generate a comprehensive, multi-page security audit report for specific modules. How should the architect implement these requirements to optimize Claude's context and workflow?
options:
  A: "Implement both the Python coding standards and the security audit instructions as custom skills in .claude/skills/."
  B: "Place the Python coding standards in CLAUDE.md and create a custom skill for the security audit report."
  C: "Place both the Python coding standards and the security audit instructions in the project's CLAUDE.md file."
  D: "Create a custom skill for the Python coding standards and place the security audit instructions in CLAUDE.md."
correct: B
explanation: |
    A: Incorrect. Custom skills typically require explicit invocation or specific task triggers. Implementing coding standards as a skill would mean they are not automatically enforced across every standard code generation task, requiring developers to remember to invoke the skill for basic compliance.
    B: Correct. CLAUDE.md is the appropriate location for persistent, repository-wide guidelines such as style standards (PEP-8) and type hinting rules, ensuring they are always in context. Custom skills are ideal for specialized, complex, or occasional workflows like a multi-page security audit, as they provide structured execution without bloating the default context for routine tasks.
    C: Incorrect. Including verbose, occasional-use instructions like a multi-page security audit in CLAUDE.md would unnecessarily consume context tokens for every interaction. This leads to context bloat and can degrade model performance on simple, unrelated coding tasks.
    D: Incorrect. This reverses the optimal configuration. Coding standards should be automatic and persistent (CLAUDE.md), while complex, intermittent reports should be encapsulated as skills to maintain a clean default context.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24305)
```

```question
id: certsafari-domain-2-claude-code-064
domain: domain-2-claude-code
difficulty: medium
stem: |
  A developer is using Claude to transform deeply nested XML payloads into flat CSV rows. Despite providing a detailed, multi-paragraph explanation of how sibling nodes should be concatenated, Claude's output consistently misaligns the columns. Which iterative refinement technique will most quickly resolve this misalignment?
options:
  A: "Increase the temperature parameter to allow Claude more creative freedom in interpreting the XML structure."
  B: "Provide a snippet of the nested XML alongside the exact corresponding CSV row output as a concrete example."
  C: "Write a detailed pseudocode algorithm for Claude to translate into the target programming language."
  D: "Ask Claude to explain its understanding of XML parsing before attempting the transformation task again."
correct: B
explanation: |
    A: Increasing the temperature increases randomness and variability, which is the opposite of what is needed for strict structural tasks like CSV alignment. It would likely exacerbate consistency issues and lead to even more unpredictable formatting errors.
    B: This is a few-shot prompting technique. Providing a concrete input-output mapping (the XML snippet and corresponding CSV row) eliminates ambiguity by demonstrating the exact expected format and column alignment. Few-shot examples are often the fastest way to refine a model's output when complex natural language instructions fail to convey specific structural nuances.
    C: Writing detailed pseudocode focuses on the logic of the transformation rather than the direct output format. While it can help with complex logic, it is more indirect and time-consuming than providing a direct example, and the model might still misalign the resulting columns.
    D: Asking for an explanation is a diagnostic or 'Chain of Thought' step. While helpful for identifying misunderstandings in the model's logic, it does not provide the corrective structural data needed to fix the output alignment as quickly as a direct example does.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24018)
```

```question
id: certsafari-domain-2-claude-code-065
domain: domain-2-claude-code
difficulty: medium
stem: |
  A data engineering team uses a custom tool, invoked as `/migrate-schema`, to manage database migrations. The tool requires a `table_name` parameter to function correctly. When developers forget to provide the table name, the tool fails. How can an architect ensure that Claude's tool-use call always includes the required `table_name` parameter and that the model doesn't attempt to run the tool without it?
options:
  A: "Define an `input_schema` for the `/migrate-schema` tool that specifies `table_name` as a required property, and enable strict tool use mode by setting `strict: true` in the tool definition."
  B: "Add `require-args: true` to the project's `CLAUDE.md` file."
  C: "Use the Structured Outputs feature by setting `output_config.format` to `json` in the API call."
  D: "Increase the size of the database schema passed to the model using the `_meta[\"anthropic/maxResultSizeChars\"]` annotation."
correct: A
explanation: |
    A: Correct. According to Anthropic's documentation, the standard way to define the parameters a tool accepts is by providing a JSON schema in the `input_schema` field. To guarantee the model's output conforms to this schema, you should also enable strict tool use mode by adding `strict: true` to the tool definition. This combination ensures the model will not attempt a tool call without the required `table_name` parameter.
    B: Incorrect. Research of official documentation confirms that `require-args: true` is not a valid or recognized configuration for `CLAUDE.md` files. The `CLAUDE.md` file is used to provide high-level, persistent context and project conventions to Claude, not for defining strict argument validation for tools.
    C: Incorrect. The Structured Outputs feature is used to constrain the model's final response to the user into a specific JSON schema. It does not enforce the structure of arguments for a tool call that happens mid-turn. The correct feature for defining and enforcing tool parameters is Tool Use with an `input_schema` and `strict: true`.
    D: Incorrect. The `_meta["anthropic/maxResultSizeChars"]` annotation is a feature of Claude Code used to override the default size limit for tool results passed back to the model. This is useful for preventing truncation of large outputs, such as a database schema, but it is unrelated to enforcing required input arguments for a tool.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28768)
```

```question
id: certsafari-domain-2-claude-code-066
domain: domain-2-claude-code
difficulty: medium
stem: |
  A critical security vulnerability (SQL Injection) has been identified in `SearchController.java`. The security team has provided the exact sanitization function that needs to be wrapped around the `userInput` parameter on line 112. The fix is fully understood, urgent, and isolated to this single line. Which Claude Code workflow is most appropriate?
options:
  A: "Plan mode, because security vulnerabilities inherently have architectural implications."
  B: "The Explore subagent, to ensure no other files have similar vulnerabilities before fixing this one."
  C: "Direct execution, because the change is well-understood, simple, and has a clear scope."
  D: "Plan mode to draft the sanitization wrapper, followed by direct execution to apply it."
correct: C
explanation: |
    A: While security issues can have architectural impact, this particular fix is isolated, fully specified, and urgent. Plan mode is better suited for complex, multi-file design changes rather than a single-line sanitation wrap, and its overhead is unnecessary in this context.
    B: The Explore subagent is useful for broad discovery and identifying patterns across a codebase. However, when an urgent, well-scoped fix for a known critical vulnerability is available, delaying remediation to run explorations would unnecessarily prolong the system's exposure to the threat.
    C: Direct execution is the most appropriate workflow when the change is simple, fully understood, and constrained to a single line. This approach minimizes delay and overhead, allowing the developer to address the critical security vulnerability immediately.
    D: Drafting in plan mode before executing adds unnecessary steps for a trivial, well-specified fix. This multi-step workflow is intended for changes that require coordination across files or complex reasoning, neither of which are required for a single-line wrapper.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23999)
```

```question
id: certsafari-domain-2-claude-code-067
domain: domain-2-claude-code
difficulty: medium
stem: |
  A large enterprise application has a root directory, a `frontend/` directory, and a `backend/` directory. The architect wants to enforce company-wide security rules globally, React rules in the frontend, and Django rules in the backend. They also want to ensure that if a developer asks about database schemas while in the `frontend/` directory, Claude does NOT get confused by backend rules. How should the files be organized?
options:
  A: "Place all rules in the root .claude/rules/ directory and rely on Claude's semantic search to filter out backend rules when in the frontend directory."
  B: "Place security rules in the root CLAUDE.md. Place React rules in frontend/CLAUDE.md and Django rules in backend/CLAUDE.md."
  C: "Create a root CLAUDE.md that uses @import frontend/react.md and @import backend/django.md, ensuring all rules are loaded globally."
  D: "Instruct developers to configure their ~/.claude/CLAUDE.md with the specific rules for the stack they are currently working on."
correct: B
explanation: |
    A: Incorrect. Placing all rules in a flat directory and relying on semantic search is brittle. It does not provide strict scoping, meaning backend rules may still surface as context when working on the frontend, potentially leading to hallucinated or irrelevant suggestions.
    B: Correct. This approach leverages the hierarchical nature of CLAUDE.md files. Rules in the root apply project-wide (security), while directory-specific CLAUDE.md files ensure that React or Django context is only loaded when the developer is working within those respective subdirectories, effectively preventing cross-stack confusion.
    C: Incorrect. Using @import in the root CLAUDE.md flattens the hierarchy into a global context. It forces Claude to load all rules regardless of the current working directory, which defeats the purpose of scoping and increases the risk of conflicting instructions between frontend and backend stacks.
    D: Incorrect. Global user configurations (~/.claude/CLAUDE.md) are not part of the project repository, making them impossible to share across a team. Furthermore, they do not provide the directory-level scoping required to distinguish between frontend and backend contexts within a mono-repo structure.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24324)
```

```question
id: certsafari-domain-2-claude-code-068
domain: domain-2-claude-code
difficulty: medium
stem: |
  A project has a 1,000-line `CLAUDE.md` file at the root. 400 lines are dedicated to CSS styling conventions, 400 lines to database query optimization, and 200 lines to general git workflows. Developers report that Claude's responses are slow and sometimes hallucinate mixed contexts. As an architect, how should you refactor this setup?
options:
  A: "Split the file into `CLAUDE-css.md`, `CLAUDE-db.md`, and `CLAUDE-git.md` in the root directory, and Claude will automatically infer the context based on the file contents."
  B: "Keep the monolithic `CLAUDE.md` but add XML tags like `<scope path=\"**/*.css\">` around the specific sections to prevent Claude from reading the whole file."
  C: "Extract the CSS and database conventions into separate files in `.claude/rules/`, using YAML `paths` frontmatter to scope them to `**/*.css` and `db/**/*` respectively, leaving only the git workflows in the root `CLAUDE.md`."
  D: "Move the entire `CLAUDE.md` into `.claude/rules/global.md` and set `paths: [\"*\"]` to force Claude to process the file more efficiently."
correct: C
explanation: |
    A: Claude does not automatically infer context from custom-named files in the root like `CLAUDE-css.md`. Only the standard `CLAUDE.md` file or files within the `.claude/rules/` directory are processed as convention files.
    B: Claude's convention-loading system does not support using XML tags within a single file to conditionally prune content based on file paths. If `CLAUDE.md` is present, the entire content is loaded, which maintains the context bloat and hallucination risks.
    C: This is the recommended best practice. Placing domain-specific rules in `.claude/rules/` with YAML frontmatter `paths` allows Claude to conditionally load conventions only when working on relevant files. This reduces the token count in the prompt, improves response speed, and prevents context mixing between unrelated domains (like CSS and DB).
    D: Setting a rule with `paths: ["*"]` makes it global. Moving the monolithic file into a global rule does not address the performance or hallucination issues because the entire set of conventions is still injected into every prompt regardless of the task.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24247)
```

```question
id: certsafari-domain-2-claude-code-069
domain: domain-2-claude-code
difficulty: medium
stem: |
  A team is using Claude to write a data transformation script. The script works well generally, but fails when processing user records that lack a `timezone` field. The team wants the script to default to 'UTC' when this field is missing. Which approach best utilizes iterative refinement techniques to solve this?
options:
  A: "Instruct Claude to ignore any records that throw an error during the transformation process."
  B: "Provide Claude with a specific JSON test case of a user record missing the `timezone` field, and specify that the expected output should include `'timezone': 'UTC'`."
  C: "Ask Claude to write a separate, secondary script exclusively for processing records that lack a timezone."
  D: "Tell Claude to add a generic error handler that logs the missing field error and halts the script execution."
correct: B
explanation: |
    A: This approach is incorrect as it fails to address the root cause and leads to data loss by omitting problematic records. Iterative refinement focuses on identifying failing inputs and specifying expected behavior to guide the model toward a robust solution rather than avoiding the error.
    B: This is the correct approach. Iterative refinement is best achieved by providing concrete test cases (e.g., a JSON record missing the field) and the specific desired outcome (e.g., defaulting to 'UTC'). This example-driven method creates a reproducible failing case and clear instructions, allowing Claude to refine the script logic to handle edge cases gracefully.
    C: This is incorrect because creating a separate script for edge cases adds unnecessary complexity and fragments the logic. Iterative refinement aims to improve the primary transformation pipeline so it can handle a variety of inputs within a single, maintainable solution.
    D: This is incorrect as it merely halts the script rather than implementing the requested 'UTC' default. Iterative refinement should focus on modifying the behavior to meet requirements through targeted feedback and testing rather than simple error logging or termination.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24023)
```

```question
id: certsafari-domain-2-claude-code-070
domain: domain-2-claude-code
difficulty: medium
stem: |
  A development team wants to integrate Claude into their CI/CD pipeline to automatically analyze code complexity. To ensure the analysis results can be programmatically parsed and used in subsequent pipeline steps, the output must strictly adhere to a predefined JSON schema. Which API parameter should be used in the request to Claude to enforce this structured output?
options:
  A: "A system prompt that includes the instruction \"Always respond in JSON format matching the following schema: ...\"."
  B: "The `output_config.format` parameter, with `type` set to `json_schema` and the schema definition provided."
  C: "The `tool_choice` parameter, with the `type` set to `json_tool` and the schema provided as the tool definition."
  D: "The top-level `json_schema` parameter in the API request body."
correct: B
explanation: |
    A: Incorrect. While providing instructions in a prompt can guide the model, it does not guarantee that the output will be valid JSON or strictly adhere to the schema. For programmatic use cases like a CI/CD pipeline, a more reliable enforcement mechanism is required.
    B: Correct. According to Anthropic's documentation, the `output_config.format` parameter with `type: "json_schema"` is the officially supported method to constrain the model's output to a specific JSON schema. This ensures the response is always valid, machine-readable JSON, which is essential for automated downstream processing in a CI/CD pipeline.
    C: Incorrect. The `tool_choice` parameter is used to force the model to call a specific tool (function). While tool definitions use a JSON schema for their inputs, this parameter's purpose is to invoke a function, not to format the model's final text response into a specific JSON structure.
    D: Incorrect. The Claude Messages API does not have a top-level `json_schema` parameter. The correct way to specify a schema is by nesting it within the `output_config.format` parameter, as this is the designated mechanism for controlling structured outputs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=27616)
```

```question
id: certsafari-domain-2-claude-code-071
domain: domain-2-claude-code
difficulty: medium
stem: |
  Claude has generated a complex SQL query for a data analyst:
  `WITH raw_data AS (
    SELECT id, val FROM table1 JOIN table2 ON table1.id = table2.id
  )
  SELECT AVG(val) FROM raw_data;`
  The analyst notices that the `JOIN` in the CTE creates duplicate rows, which in turn causes the final `AVG(val)` aggregation to be mathematically incorrect. How should the analyst prompt Claude to fix this?
options:
  A: "Tell Claude to fix the duplicate rows in the CTE first, wait for the response, and then tell it to fix the average calculation."
  B: "Provide a single prompt explaining that the duplicate rows in the CTE are causing the final aggregation to calculate the average incorrectly, asking for a comprehensive fix."
  C: "Ask Claude to break the query into separate physical tables and fix the data insertion one step at a time."
  D: "Provide the correct average numerical value to Claude and ask it to adjust the query until the output matches that number."
correct: B
explanation: |
    A: This sequential approach is inefficient and hinders Claude's ability to reason about the relationship between the JOIN logic and the final aggregation. Providing the full context of the logical error allows for a more holistic and accurate correction in a single pass.
    B: Explaining the root cause (duplicate rows from the JOIN) and how it impacts the final result (incorrect average) allows Claude to diagnose the logic and provide a comprehensive solution—such as deduplication, distinct aggregation, or subqueries—in a single, coherent update. This is the most effective use of iterative refinement.
    C: Breaking the query into separate physical tables is an architectural overkill. The issue is purely logical within the query structure and should be resolved by correcting the SQL syntax or logic rather than creating permanent database objects.
    D: Supplying the target output without explaining the logic error leads to 'result-oriented' programming. This encourages Claude to 'hack' the query to match a specific number rather than fixing the underlying mathematical inaccuracy, which would likely fail on different datasets.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24021)
```

```question
id: certsafari-domain-2-claude-code-072
domain: domain-2-claude-code
difficulty: medium
stem: |
  Claude generated a Python Flask application for a developer. Upon review, the developer notices two completely unrelated issues: the application logging format is missing timestamps, and the database connection string is hardcoded instead of using environment variables. What is the recommended workflow for addressing these issues?
options:
  A: "Combine both issues into a single complex prompt detailing how logging and database connections interact."
  B: "Address the logging format in one prompt, verify the fix, and then address the database connection string in a subsequent prompt."
  C: "Ask Claude to rewrite the entire application following 12-factor app principles to automatically resolve both issues."
  D: "Fix the database connection string manually, then ask Claude to fix the logging format."
correct: B
explanation: |
    A: Combining unrelated issues into a single complex prompt increases the cognitive load on the model and the risk of hallucination or incomplete fixes. Iterative refinement best practices recommend isolating independent fixes so you can validate each change individually and maintain clear context.
    B: Addressing issues sequentially follows the principles of iterative refinement. By isolating concerns into separate prompts and verifying each fix before proceeding, the developer ensures that each change is correct, reduces the chance of introducing regressions, and makes debugging much simpler.
    C: Requesting a complete rewrite for specific, minor issues is an inefficient approach that introduces unnecessary risk. Full rewrites can cause scope creep, change parts of the code that were already working correctly, and make it difficult to verify the specific fixes for the original problems.
    D: While manual fixes are sometimes necessary, mixing manual edits with model-driven changes in the middle of a refinement cycle can reduce reproducibility and break the coherent workflow. It is better to use focused, sequential prompts to handle each issue within the AI-assisted development cycle.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24024)
```

```question
id: certsafari-domain-2-claude-code-073
domain: domain-2-claude-code
difficulty: medium
stem: |
  An architect is building a distributed rate-limiting middleware using Claude. The middleware must handle specific race conditions and meet strict performance thresholds. The architect wants to ensure progressive improvement and correctness throughout the implementation process. Which workflow represents the best application of test-driven iteration with Claude?
options:
  A: "Ask Claude to write the middleware implementation first, manually deploy it to a staging environment, and report any observed bugs back to Claude."
  B: "Ask Claude to generate both the middleware code and the test suite in a single prompt to ensure the tests perfectly match the implementation."
  C: "Write a comprehensive test suite covering edge cases and performance requirements first, run it against Claude's initial implementation, and share the test failures to guide refinement."
  D: "Have Claude explain the rate-limiting algorithm step-by-step in natural language, approve the logic, and then ask for the final code."
correct: C
explanation: |
    A: This approach fails to follow test-driven iteration principles. Relying on manual deployment and reporting creates a slow, subjective feedback loop that does not leverage Claude's ability to drive implementation based on specific, automated failure signals.
    B: Generating implementation and tests in the same prompt risks coupling the tests to the code's logic, including potential errors. This reduces the independence of the validation artifacts and skips the iterative refinement loop necessary for complex distributed systems.
    C: This is the most effective iterative workflow. By defining expectations through a comprehensive test suite first, the architect provides Claude with an objective, repeatable benchmark. Sharing specific test failures allows Claude to perform targeted refinements to address complex issues like race conditions and performance bottlenecks progressively.
    D: While explaining the logic is a good preliminary design step, it lacks the executable verification needed for production-grade middleware. Natural language approval cannot guarantee the absence of race conditions or ensure that performance thresholds are met under load.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24014)
```
