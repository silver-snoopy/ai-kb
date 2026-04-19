---
cert: cca-f
domain: domain-4-mcp
status: done
source: certsafari
tags: [seeded, certsafari]
---

# CertSafari Practice Questions — Domain 2: Tool Design & MCP Integration

60 questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.
```question
id: certsafari-domain-4-mcp-001
domain: domain-4-mcp
difficulty: medium
stem: |
  An HR assistant is equipped with a suite of tools: `get_pto`, `get_benefits`, `get_payroll`, and `get_holidays`. To save tokens, the developer provided only the tool names and parameter schemas (e.g., `employee_id`), leaving the descriptions blank. Claude frequently hallucinates parameters or selects `get_benefits` when asked about upcoming company holidays. What is the primary cause of this unreliable selection?
options:
  A: "The context window is too small to process four tools simultaneously without descriptions."
  B: "Minimal descriptions force the LLM to guess the tool's purpose based solely on its name, leading to unreliable selection among similar tools."
  C: "The tools should be grouped into a single `hr_query` tool with an `action_type` parameter to reduce the number of choices."
  D: "The system prompt lacks an instruction telling Claude to map user keywords to tool names."
correct: B
explanation: |
    A: Incorrect. Modern LLMs like Claude have context windows far larger than the requirements for four tools. The issue is a lack of semantic information, not context capacity.
    B: Correct. Claude relies heavily on tool descriptions to understand the specific purpose, logic, and boundaries of a tool. Without these descriptions, the model is forced to infer functionality from names alone, which often leads to errors and hallucinations when tools are conceptually related (like PTO and Holidays).
    C: Incorrect. While consolidating tools is an architectural pattern, it does not address the root cause. A single tool with multiple actions would still require detailed descriptions for each action to prevent the same ambiguity issues.
    D: Incorrect. While a system prompt can provide high-level guidance, tool metadata (names and descriptions) is the primary mechanism Claude uses to decide which tool to call. Missing metadata cannot be reliably compensated for by a simple mapping instruction.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24115)
```

```question
id: certsafari-domain-4-mcp-002
domain: domain-4-mcp
difficulty: medium
stem: |
  A lead architect is deploying Claude Code for a development team of 20 engineers. The team requires access to a shared corporate GitLab MCP server for repository management. Simultaneously, the architect is developing a highly experimental internal deployment MCP server that is not yet ready for team use, but needs to be tested locally during daily workflows. How should the architect configure these MCP servers to meet both requirements?
options:
  A: "Configure both the GitLab and experimental servers in the repository's .mcp.json file, but use an environment variable flag to disable the experimental server for other developers."
  B: "Configure the GitLab server in the repository's .mcp.json file and configure the experimental deployment server in the architect's ~/.claude.json file."
  C: "Configure both servers in the architect's ~/.claude.json file and instruct the team to manually copy the GitLab configuration to their local environments."
  D: "Create a monolithic MCP server that routes requests to either GitLab or the deployment system based on the user's IAM role, configured in .mcp.json."
correct: B
explanation: |
    A: Incorrect. Committing configuration to the repository's .mcp.json file would expose the experimental server setup to all developers. Relying on environment variables to toggle visibility is fragile, difficult to maintain, and does not provide clean separation of stable versus development-stage tools.
    B: Correct. In Claude Code and MCP-enabled workflows, .mcp.json files at the repository root are typically version-controlled and shared across the team, making them the standard location for stable, required tools like a corporate GitLab server. Global configuration files (such as ~/.claude.json) are local to the user's machine, allowing the architect to test experimental servers in isolation without impacting the shared team environment.
    C: Incorrect. This approach lacks a single source of truth for the project. Manual configuration management is unscalable for a team of 20 and increases the likelihood of configuration drift, onboarding friction, and setup errors among the engineers.
    D: Incorrect. Implementing a monolithic router server with IAM-based logic introduces significant architectural complexity and a single point of failure. The Model Context Protocol is designed to natively support multiple distinct servers through configuration scopes, making a complex custom routing layer unnecessary for simple environment separation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24061)
```

```question
id: certsafari-domain-4-mcp-003
domain: domain-4-mcp
difficulty: medium
stem: |
  A financial analysis agent uses a generic `run_python_code` tool to calculate portfolio risk metrics based on user portfolios. Security audits reveal the agent occasionally writes inefficient code that times out, or attempts to import unauthorized libraries. How can the architect improve reliability and security while still fulfilling the user's request?
options:
  A: "Set `tool_choice: {\"type\": \"any\"}` to ensure the agent always runs code instead of guessing the risk metrics."
  B: "Replace the generic `run_python_code` tool with a constrained `calculate_portfolio_risk` tool that accepts specific portfolio parameters."
  C: "Add a `verify_code` tool and force the agent to call it before calling `run_python_code`."
  D: "Implement a system prompt that lists the allowed Python libraries and maximum execution time."
correct: B
explanation: |
    A: Setting `tool_choice: {"type": "any"}` forces the agent to use a tool but does nothing to address the security or efficiency issues of the generic tool itself. It does not prevent unauthorized imports or execution timeouts.
    B: Replacing a generic code executor with a constrained, purpose-built tool eliminates arbitrary code execution. This approach enforces specific parameters and uses pre-approved, optimized backend logic, which prevents unauthorized library usage and ensures consistent performance.
    C: Adding a verification tool introduces architectural complexity without fundamentally solving the risk. The agent could still generate inefficient code that the verifier might miss, and it does not eliminate the security surface area of an arbitrary code execution environment.
    D: System prompts are advisory and can be ignored or bypassed by the model. They do not provide programmatic enforcement of library restrictions or execution time limits at the infrastructure level, making them insufficient for strict security requirements.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24155)
```

```question
id: certsafari-domain-4-mcp-004
domain: domain-4-mcp
difficulty: medium
stem: |
  A financial research agent has two tools: `analyze_content` (fetches and parses live news articles from URLs) and `analyze_document` (extracts text from uploaded PDF reports). Claude frequently attempts to pass web URLs into `analyze_document`, resulting in backend errors. How should the architect redesign the tool interfaces to prevent this?
options:
  A: "Rename `analyze_content` to `extract_web_results` and update its description to explicitly state it is for web URLs, while clarifying `analyze_document` is strictly for uploaded files."
  B: "Modify the system prompt to strictly forbid the use of `analyze_document` when a URL is present in the user prompt."
  C: "Update the `analyze_document` tool's backend logic to automatically route URLs to the `analyze_content` tool."
  D: "Merge both tools into `analyze_source` and let the backend determine if the input is a URL or a PDF."
correct: A
explanation: |
    A: Renaming tools and updating their descriptions to be highly specific is the primary method for improving tool selection in Claude. Providing distinct names like 'extract_web_results' and explicit descriptions regarding input types (URLs vs. Files) establishes the clear boundaries necessary for the model to differentiate between similar functionalities.
    B: Relying on a system prompt to forbid specific tool usage is less robust than defining clear tool interfaces. Prompt-based constraints are more likely to be ignored or misapplied compared to well-defined, semantically distinct tool names and descriptions.
    C: Updating backend logic to route inputs may prevent immediate errors, but it creates a 'shadow' behavior that complicates debugging and auditing. It fails to address the root cause: the model's confusion at the interface level.
    D: Merging tools into a single generic interface like 'analyze_source' removes the explicit boundaries that help the model understand the underlying data requirements. Clear, distinct tool interfaces are preferred for predictable behavior and enforcing specific input-type constraints.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24111)
```

```question
id: certsafari-domain-4-mcp-005
domain: domain-4-mcp
difficulty: medium
stem: |
  A document synthesis agent is designed to summarize legal contracts provided in the user prompt. A developer added a `web_search` tool to the agent so it could look up legal precedents if explicitly asked. However, the agent frequently ignores the provided contract text and attempts to use the `web_search` tool to find generic contract templates online. How should the architect resolve this misuse?
options:
  A: "Add a system prompt instruction explicitly forbidding the use of `web_search` unless the user prompt is empty."
  B: "Remove the `web_search` tool from the synthesis agent and route precedent research tasks to a dedicated legal research subagent."
  C: "Change the `tool_choice` parameter to `{\"type\": \"tool\", \"name\": \"web_search\"}` to control exactly when the tool fires."
  D: "Replace the `web_search` tool with a `fetch_url` tool so the agent must know the exact URL of the legal precedent."
correct: B
explanation: |
    A: Adding a system prompt instruction to forbid the use of the tool based on arbitrary conditions (like the prompt being empty) is brittle and often ignored by models when they perceive a tool to be relevant. It does not resolve the underlying architectural issue of tool distraction.
    B: This is the most robust solution. By applying the principle of separation of concerns, the architect removes the 'distraction' from the synthesis agent. Dedicated subagents allow for specialized system prompts, tailored toolsets, and clearer execution boundaries, ensuring the synthesis agent remains focused solely on the provided contract text.
    C: Specifying a tool name in the `tool_choice` parameter forces the model to use that specific tool in its response. This would make the problem worse by requiring the agent to use `web_search` even when it is not needed.
    D: Replacing one tool with a more restrictive one (fetch_url) does not address the core problem of the agent choosing to use external tools instead of focusing on the provided context. It merely changes the mechanism of the failure rather than fixing the agent's logic or architecture.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24145)
```

```question
id: certsafari-domain-4-mcp-006
domain: domain-4-mcp
difficulty: medium
stem: |
  A customer service agent uses an MCP tool to process refunds. A user requests a refund for an item purchased 45 days ago, but the company policy strictly limits refunds to a 30-day window. Currently, the tool returns a generic 'Operation failed' error, which causes the agent to repeatedly retry the tool with different arguments, wasting tokens and frustrating the user. How should the architect redesign the tool's error response to resolve this?
options:
  A: "Return an MCP response with `isError: true`, `errorCategory: \"validation\"`, and `isRetryable: true` so the agent can ask the user to provide a different purchase date."
  B: "Return an MCP response with `isError: true`, `errorCategory: \"business\"`, `isRetryable: false`, and a customer-friendly explanation of the 30-day policy so the agent can inform the user."
  C: "Return an MCP response with `isError: false` and a text payload of 'Operation failed' to prevent the agent from triggering its internal error-handling loop."
  D: "Return an MCP response with `isError: true`, `errorCategory: \"permission\"`, and `isRetryable: false` because the user lacks the administrative authority to override the 30-day policy."
correct: B
explanation: |
    A: Incorrect. Categorizing a business policy violation as a 'validation' error and marking it 'isRetryable: true' is misleading. The issue is not with the data format but with a non-negotiable business constraint; marking it retryable will cause the agent to waste tokens on futile retries.
    B: Correct. Surfacing this as a 'business' error (policy violation) and marking it as 'isRetryable: false' prevents the model from entering a retry loop. Including a customer-friendly explanation allows the agent to provide the user with clear reasoning for the rejection.
    C: Incorrect. Setting 'isError: false' misrepresents the outcome and prevents the model's internal error-handling logic from functioning. Furthermore, a generic 'Operation failed' message does not provide the agent with the necessary information to explain the policy to the user.
    D: Incorrect. A permission error implies that the agent or user lacks the specific authorization or credentials required to perform the action. The issue here is a business rule regarding the purchase date, which is unrelated to the user's administrative authority.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24265)
```

```question
id: certsafari-domain-4-mcp-007
domain: domain-4-mcp
difficulty: medium
stem: |
  A frontend architect needs to analyze all end-to-end test files to evaluate a migration from Cypress to Playwright. The test files are distributed across dozens of nested feature directories but all share the `.cy.ts` extension. What is the most effective way to locate these files?
options:
  A: "Use Grep with the search pattern `describe(` to find all test files, then filter the results manually."
  B: "Use Glob with the pattern `**/*.cy.ts` to efficiently match and return the specific file paths."
  C: "Use Read on the root directory to recursively list all files and parse the output for the extension."
  D: "Use the Edit tool to temporarily rename all `.cy.ts` files to a single directory for easier analysis."
correct: B
explanation: |
    A: Using Grep with the search pattern `describe(` focuses on file content rather than file names. This approach is inefficient because it requires scanning the contents of all files, may return non-test files that happen to use that keyword, and requires manual filtering of results.
    B: Using Glob with the pattern `**/*.cy.ts` is the most effective and idiomatic way to locate files by extension. The `**` wildcard allows for recursive matching across all nested directories, returning exact file paths efficiently without the overhead of reading file contents.
    C: Recursively reading the root directory to list all files and then parsing the output is functionally possible but inefficient. This method creates unnecessary I/O and requires additional logic to filter for the extension, whereas globbing handles this natively and more performantly.
    D: Using an Edit tool to rename or move files is a destructive and unnecessary action for a discovery task. Modifying the repository state just to locate files is poor practice, as it can break dependencies and risks altering the codebase.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24283)
```

```question
id: certsafari-domain-4-mcp-008
domain: domain-4-mcp
difficulty: medium
stem: |
  An IT support bot has `reset_password`, `unlock_account`, and `provision_software` tools. The system prompt includes the phrase: 'Your primary goal is to help users unlock their potential and access their accounts.' When a user asks for a password reset, Claude frequently calls `unlock_account` instead. What is the root cause and best solution for this behavior?
options:
  A: "The tool names are too similar; rename `reset_password` to `change_credentials`."
  B: "The tools have functional overlap; combine `reset_password` and `unlock_account` into a single tool."
  C: "Keyword-sensitive instructions in the system prompt are creating unintended tool associations; remove the metaphorical phrase."
  D: "The tool descriptions lack negative constraints; add 'Do not use for password resets' to the `unlock_account` description."
correct: C
explanation: |
    A: Renaming the target tool does not address the underlying semantic bias. The issue is not that 'reset_password' is vague, but that the system prompt is actively steering the model toward the 'unlock' keyword.
    B: Combining distinct functions like password resets and account unlocks into a single tool is poor design. It conflates different administrative actions, complicates the backend logic, and reduces auditing granularity without addressing the prompt's influence.
    C: LLMs are highly sensitive to keywords in the system prompt. The metaphorical use of 'unlock' ('unlock their potential') creates a strong semantic bias that causes the model to prefer the tool with the matching name 'unlock_account', even when the user's intent (password reset) matches a different tool. Removing or rephrasing the metaphor is the most effective architectural fix.
    D: While negative constraints (telling a model what not to do) can sometimes be a temporary patch, they are brittle and often ignored. The best practice is to eliminate the ambiguity at the source by cleaning up the prompt instructions.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24120)
```

```question
id: certsafari-domain-4-mcp-009
domain: domain-4-mcp
difficulty: medium
stem: |
  You need to append a new utility function `export const validateEmail = (email) => { ... }` to the very end of a 3,000-line `validators.ts` file. You want to accomplish this with the least amount of token overhead. Which approach is optimal?
options:
  A: "Use the Read tool to load the entire file, append the function in memory, and use the Write tool to save the full file."
  B: "Use the Edit tool, matching the last few lines of the file as the anchor text, and replacing them with those same lines followed by the new function."
  C: "Use the Grep tool to find the EOF character and pipe the new function into it."
  D: "Use the Write tool to overwrite the file, providing only the new function."
correct: B
explanation: |
    A: Reading and writing a 3,000-line file consumes a significant number of tokens in both input and output. Loading the entire content into the model's context just to add a small snippet is the least efficient method for this task.
    B: The Edit tool is the most token-efficient choice for surgical modifications. By matching a small anchor (the last few lines of the file) and providing a replacement that includes those lines plus the new function, only a tiny fraction of the file's content needs to be processed as tokens.
    C: The Grep tool is a search utility and cannot be used to modify or append content to a file. Furthermore, piping within the Grep tool interface is not a standard way to perform file writes in the MCP context.
    D: The Write tool completely overwrites the target file. Using it to save only the new function would result in the loss of the original 3,000 lines of code, making this approach destructive rather than an append.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24285)
```

```question
id: certsafari-domain-4-mcp-010
domain: domain-4-mcp
difficulty: medium
stem: |
  A multi-agent system features a Researcher agent with 10 deep-dive search tools and a Writer agent with 2 formatting tools. The Writer agent frequently encounters minor factual gaps (e.g., needing to verify a specific date) while drafting. Currently, the Writer must yield back to the Coordinator, which calls the Researcher, adding 3-4 extra turns and increasing latency. How should the architect optimize this workflow?
options:
  A: "Merge the Researcher and Writer agents into a single agent with all 12 tools to eliminate routing latency entirely."
  B: "Provide the Writer agent with a scoped verify_fact tool for high-frequency minor lookups, while routing complex research back to the Coordinator."
  C: "Force the Writer agent to use tool_choice: {\"type\": \"any\"} to ensure it resolves all factual gaps before generating any text."
  D: "Give the Writer agent the full suite of 10 research tools but use system prompts to restrict their usage to minor factual lookups."
correct: B
explanation: |
    A: Merging the Researcher and Writer agents into a single agent eliminates routing latency but creates a bloated agent. This violates the principle of separation of concerns, increases cognitive load, and forces the model to manage many irrelevant tools during simple tasks, potentially reducing accuracy.
    B: This is the optimal architectural choice. Providing the Writer with a specialized, scoped tool for high-frequency, low-complexity lookups allows it to resolve minor gaps locally, significantly reducing latency. Complex research is still delegated to the specialized Researcher agent, maintaining a clean multi-agent separation.
    C: Forcing tool usage via tool_choice: {"type": "any"} does not provide the Writer with the capability to perform lookups if it doesn't have the tools. It also leads to brittle behavior and does not solve the underlying latency issue caused by the current routing logic.
    D: Giving the Writer the full suite of research tools is insecure and inefficient. Relying on system prompts to restrict usage is fragile compared to proper tool scoping. It increases the context window usage and the risk of tool hallucination or misuse.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24147)
```

```question
id: certsafari-domain-4-mcp-011
domain: domain-4-mcp
difficulty: medium
stem: |
  After using Grep, you discover that a `PaymentGateway` class is instantiated inside `src/checkout/processor.ts`. You need to understand what arguments the `PaymentGateway` constructor requires to add a new feature. What is the most appropriate next step?
options:
  A: "Use Glob to search for files named PaymentGateway.ts."
  B: "Use Grep to search for constructor( across the entire codebase."
  C: "Use Read on src/checkout/processor.ts to see how it is instantiated and follow its import statement to Read the actual PaymentGateway class definition."
  D: "Use the Edit tool to insert a console.log(PaymentGateway) statement in the processor file and run the code."
correct: C
explanation: |
    A: Incorrect. Searching for files named PaymentGateway.ts using Glob assumes the filename matches the class name exactly, which may not be the case (e.g., it could be in an index.ts or a kebab-case file). It is less direct than following the code's own import path.
    B: Incorrect. Grepping for 'constructor(' across the entire project is too broad and will produce many unrelated hits, making it inefficient to locate the specific constructor signature for the PaymentGateway class.
    C: Correct. Reading the file where the class is used (src/checkout/processor.ts) provides two vital pieces of information: the current instantiation pattern and the import statement. Following that import directly to the source file is the most reliable way to find the authoritative class definition and its constructor requirements.
    D: Incorrect. Using the Edit tool to insert runtime logging is intrusive and inefficient for static analysis. It requires the ability to execute the code and may not clearly reveal the constructor's expected arguments compared to simply reading the source code definition.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24287)
```

```question
id: certsafari-domain-4-mcp-012
domain: domain-4-mcp
difficulty: medium
stem: |
  You are deprecating a legacy utility library `moment.js` in favor of `date-fns`. Before making any changes, you need to find every file in the project that imports `moment`. What is the most efficient way to gather this list?
options:
  A: "Use Glob to find all files named `moment.js` or `moment.ts` in the project."
  B: "Use Grep with the search pattern `import .* from ['\"]moment['\"]` or `require(['\"]moment['\"])` to search file contents for the import statements."
  C: "Use Read on the `package.json` file to confirm `moment` is a dependency, then use Edit to remove it and see where the build fails."
  D: "Use the Bash tool to uninstall the package and rely on the TypeScript compiler to list the affected files."
correct: B
explanation: |
    A: Glob matches file names and paths, not the contents of files. This would only find files actually named 'moment', missing all other files that import the library but have different filenames.
    B: Grep (Global Regular Expression Print) is the standard tool for searching file contents. Using a regular expression that matches common import and require patterns is the most direct, efficient, and non-destructive way to locate every reference to the module across the entire codebase.
    C: Reading package.json only confirms the library is a dependency. Removing it and waiting for build failures is an inefficient 'scream test' that is destructive and may miss usages in non-compiled files or files not currently covered by the build pipeline.
    D: Uninstalling the package and relying on compiler/runtime errors is disruptive and unreliable. The compiler may not provide a comprehensive list of all files, and this approach can cause unnecessary broken states in the development environment compared to a simple search.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24299)
```

```question
id: certsafari-domain-4-mcp-013
domain: domain-4-mcp
difficulty: medium
stem: |
  An application that uses Anthropic's APIs to process data from a Kafka stream is crashing on startup with the log output `[FATAL] Missing required environment variable: KAFKA_BROKER_URL`. You have access to the application's large monorepo but are unfamiliar with its directory structure. What is the most efficient initial step to diagnose where this error originates using standard command-line tools?
options:
  A: "Use a file search utility like `find` or `glob` to locate all `.env` and configuration files, then read them to see if `KAFKA_BROKER_URL` is defined."
  B: "Use `grep` to search the codebase for the exact string `[FATAL] Missing required environment variable: KAFKA_BROKER_URL` to find the file and line number where the error is thrown."
  C: "Start by reading the application's main entry point (e.g., `index.ts` or `main.py`) and manually follow every import and function call to trace the execution path."
  D: "Immediately attempt to run the application locally with a debugger attached to set a breakpoint on the exception."
correct: B
explanation: |
    A: Incorrect. This step confirms the symptom (the variable is missing) but does not help locate the source of the error in the code. The goal is to find which part of the application requires this variable, not just to verify that it's unset.
    B: Correct. As confirmed by research, using `grep` to search for the exact error message is a valid and highly practical debugging method. In a large, unfamiliar codebase, this is the most efficient initial step to pinpoint the exact file and line number where the application checks for the `KAFKA_BROKER_URL` variable and throws the fatal error.
    C: Incorrect. Manually tracing the execution path in a large and unfamiliar monorepo is extremely time-consuming and inefficient. This approach is not practical as an initial diagnostic step compared to a targeted search.
    D: Incorrect. While a debugger is a powerful tool, setting it up for a large, unfamiliar application can be complex and time-consuming. A simple `grep` command is a much faster and more efficient *initial* step to locate the source of the error before deciding if a debugger is needed for further analysis.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32440)
```

```question
id: certsafari-domain-4-mcp-014
domain: domain-4-mcp
difficulty: medium
stem: |
  You are tasked with modifying the authentication flow in a 500-file repository. You have no prior knowledge of the codebase. A junior developer suggests using Glob to find all files containing 'auth' in the name and Reading them all at once to build context. As an architect, why should you reject this approach and what should you do instead?
options:
  A: "Reject it because Glob cannot filter by filename; instead, use Bash `find` and Read the results."
  B: "Reject it because Reading all files upfront overwhelms the context window; instead, use Grep to find the login entry point, then use Read to follow imports sequentially."
  C: "Reject it because Edit is faster; instead, use Edit to inject logging into all files simultaneously to trace the flow."
  D: "Reject it because authentication flows are usually in the database; instead, use Read on the database schema files only."
correct: B
explanation: |
    A: Glob is explicitly designed for pattern matching filenames (e.g., *auth*), so the premise that it cannot filter is incorrect. Furthermore, using Bash find to read all results would still result in the same context-window saturation problem as the original suggestion.
    B: Large-scale context ingestion is inefficient and prone to noise, often exceeding the LLM's effective context window. The architecturally sound approach is to use discovery tools like Grep to identify functional entry points and then perform a targeted, incremental traversal of the logic by following imports and call sequences.
    C: The Edit tool is intended for modifications, not discovery. Mass-injecting logging into many files is a destructive, noisy, and risky approach that could introduce bugs or performance issues before the system architecture is even understood.
    D: Authentication flows are rarely confined to database schema files; they typically span controllers, services, middleware, and application logic. Focusing solely on schemas would miss the critical implementation details and security logic.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24291)
```

```question
id: certsafari-domain-4-mcp-015
domain: domain-4-mcp
difficulty: medium
stem: |
  A senior developer uses a niche, personal time-tracking CLI application that is installed locally on their machine. They want Claude Code to automatically log their coding activities to this application. The developer works across five different company repositories, none of which use this time-tracking software. Where is the most appropriate place to configure this MCP server?
options:
  A: "In the .mcp.json file of the most frequently used company repository."
  B: "In a global /etc/mcp/config.json file to ensure system-wide availability."
  C: "In the developer's user-scoped ~/.claude.json file."
  D: "In a dedicated time-tracking repository, requiring the developer to symlink the .mcp.json to their active projects."
correct: C
explanation: |
    A: Placing the configuration in a project-specific .mcp.json file limits the tool's availability to only that repository. Furthermore, it risks accidentally committing personal tool configurations into shared company source control, which is inappropriate for personal workflows.
    B: While system-wide files like /etc/mcp/config.json provide broad availability, they typically require root/administrative privileges and affect every user on the system. This is an inappropriate scope for a personal user tool and poses potential security and privacy risks on shared machines.
    C: The user-scoped ~/.claude.json file is the standard and most appropriate location for personal MCP configurations. It ensures the time-tracking tool is available to Claude Code across all local directories and repositories the developer works in, without polluting project files or affecting other system users.
    D: Creating a dedicated repository and using symbolic links adds unnecessary architectural complexity and maintenance overhead. This approach is prone to breaking across environments and is less efficient than using the native user-scoped configuration file provided by Claude Code.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24068)
```

```question
id: certsafari-domain-4-mcp-016
domain: domain-4-mcp
difficulty: medium
stem: |
  An e-commerce agent uses an MCP tool to apply discount codes to a user's cart. A user provides an expired code. The tool returns `isError: true` but omits the `isRetryable` flag and error category. The agent attempts to apply the code three more times before giving up. How should the architect fix this to prevent wasted retry attempts?
options:
  A: "Add `isRetryable: true` to the response so the agent explicitly knows it is allowed to retry the operation."
  B: "Change the tool to return `isError: false` with a message 'Code expired' so the agent's internal retry logic is completely bypassed."
  C: "Implement a rate limiter in the tool that blocks the agent after the first attempt, returning a 429 HTTP status code."
  D: "Add `isRetryable: false` and `errorCategory: \"business\"` with a message explaining the code is expired, so the agent immediately informs the user."
correct: D
explanation: |
    A: Adding `isRetryable: true` would explicitly signal to the agent that the failure is safe to retry. Since an expired code is a permanent business-level condition, this would encourage more wasted attempts rather than preventing them.
    B: Returning `isError: false` misrepresents a failure as a success. This hides the business error from the agent's logic, potentially leading the agent to tell the user the code worked when it actually did not.
    C: A rate limiter (HTTP 429) addresses traffic and throttling issues. It does not convey that the specific input is invalid for business reasons, and the agent might still try to retry once the rate limit window resets.
    D: Explicitly returning `isRetryable: false` tells the agent that further attempts will not succeed. Categorizing it as a 'business' error clarifies that the failure is due to business logic (expired code) rather than a transient technical issue, allowing the agent to immediately halt retries and inform the user.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24271)
```

```question
id: certsafari-domain-4-mcp-017
domain: domain-4-mcp
difficulty: medium
stem: |
  A monolithic customer service agent is equipped with 19 different tools to handle billing, technical support, account management, and sales inquiries. During peak hours, logs reveal that the agent frequently hallucinates tool arguments or selects the `reset_password` tool when users ask about billing cycles. What is the most architecturally sound solution to improve tool selection reliability?
options:
  A: "Increase the model's temperature to allow for more creative and flexible tool selection across the 19 options."
  B: "Combine the 19 tools into a single `execute_action` tool that accepts a complex JSON payload to reduce the number of tools."
  C: "Implement a supervisor agent that routes requests to specialized subagents, each equipped with only 4-5 role-specific tools."
  D: "Set `tool_choice: {\"type\": \"any\"}` to force the model to evaluate all 19 tools before generating a response."
correct: C
explanation: |
    A: Increasing the model's temperature raises randomness and entropy, which typically exacerbates hallucinations and inconsistent tool selection. For deterministic tasks like tool selection and parameter generation, a lower temperature is generally preferred.
    B: Combining tools into a single complex entry shifts the complexity from tool selection to argument generation. This often leads to more frequent argument hallucinations and makes validation, auditing, and fine-grained permissions significantly more difficult.
    C: Implementing a supervisor-subagent pattern is the most architecturally sound approach. By decomposing the monolithic agent into specialized subagents, you reduce the decision space for each model call. Limiting each agent to 4-5 role-specific tools minimizes confusion, improves accuracy, and allows for better scalability and maintenance.
    D: Setting tool_choice to 'any' forces the model to select a tool but does not improve its ability to distinguish between 19 options. This treats the symptom rather than the root cause and may actually prevent the model from asking clarifying questions when user intent is ambiguous.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24144)
```

```question
id: certsafari-domain-4-mcp-018
domain: domain-4-mcp
difficulty: medium
stem: |
  An architect is reviewing a pull request that adds a new custom MCP server to a team's repository. The server provides a tool called `analyze_logs` for querying a proprietary log aggregation system. During testing, the architect notices that Claude Code frequently ignores this tool and instead tries to write custom Python scripts to download and parse raw log files. What is the most likely cause of this behavior that the architect should address in the pull request?
options:
  A: "The custom MCP server was configured in the ~/.claude.json file instead of the project's .mcp.json file."
  B: "The `analyze_logs` tool description lacks sufficient detail about its capabilities, outputs, and why it is superior to manual script execution."
  C: "The log aggregation system's API is returning data in JSON format, which Claude Code cannot process natively without a conversion tool."
  D: "The environment variables for the log aggregation system were not properly expanded in the .mcp.json configuration."
correct: B
explanation: |
    A: The location of the configuration file (~/.claude.json vs .mcp.json) determines the scope and discovery of the server, but if the tool is being 'ignored' while testing the environment where it is registered, the issue is with selection logic rather than discovery. If the tool weren't discovered, Claude wouldn't even know it existed to ignore it.
    B: This is the most likely cause. LLMs, including those powering Claude Code, rely on tool descriptions and metadata to decide whether a tool is suitable for a task. If the description is vague or lacks clear information about its efficiency and schema, the model may default to its inherent capability to write and execute scripts as a 'safer' or more understood path.
    C: Claude Code and modern LLM agents process JSON natively and efficiently. The format of the output data is not a reason for the model to avoid using a tool; if anything, JSON is a preferred format for tool interaction.
    D: Improperly configured environment variables would cause the tool to fail with an error at runtime (e.g., authentication failure or connection error) when Claude attempts to call it. It would not cause the model to proactively decide to write a custom script instead of attempting to use the tool in the first place.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24072)
```

```question
id: certsafari-domain-4-mcp-019
domain: domain-4-mcp
difficulty: medium
stem: |
  A security operations team is configuring an Anthropic Model Context Protocol (MCP) server to integrate with a third-party SIEM platform. The integration requires a `SIEM_API_KEY` and a `SIEM_REGION`. The region is static for the entire team (`us-east-1`), but the API key is a unique secret for each analyst. How should the team configure the `.mcp.json` file in their shared code repository to securely and efficiently manage these arguments?
options:
  A: "Hardcode both the `SIEM_API_KEY` and the `SIEM_REGION` in the `.mcp.json` to ensure consistent behavior across the team."
  B: "Use environment variable expansion for both arguments: `${SIEM_API_KEY}` and `${SIEM_REGION}`, requiring analysts to set both variables in their local environment."
  C: "Hardcode the region as `us-east-1` in the `.mcp.json` arguments, and use environment variable expansion `${SIEM_API_KEY}` for the credential."
  D: "Omit both arguments from the `.mcp.json` and require the MCP server to prompt the user interactively for the values upon connection."
correct: C
explanation: |
    A: Incorrect. Hardcoding sensitive credentials like an API key in a shared configuration file is a major security vulnerability. Official documentation and security best practices strongly recommend storing API keys securely, for example, as environment variables, to prevent them from being exposed in code repositories.
    B: Incorrect. While using an environment variable for the `SIEM_API_KEY}` is the correct approach for a secret, it is unnecessary for the `SIEM_REGION`. Since the region is a non-sensitive, static value for the entire team, hardcoding it in the configuration simplifies setup and reduces the chance of misconfiguration, as analysts would not need to set an extra environment variable.
    C: Correct. This approach follows security and operational best practices. The sensitive, per-user credential (`SIEM_API_KEY`) is securely managed using an environment variable, preventing it from being committed to the shared repository. The non-sensitive, static value (`SIEM_REGION`) is hardcoded for consistency and ease of use, eliminating an unnecessary configuration step for each team member.
    D: Incorrect. While this would avoid hardcoding secrets, it is not a practical or scalable solution. Interactive prompts prevent automation (e.g., in CI/CD pipelines or scripts) and create a cumbersome user experience for analysts who would have to re-enter the information frequently.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=27617)
```

```question
id: certsafari-domain-4-mcp-020
domain: domain-4-mcp
difficulty: medium
stem: |
  A development team has configured three shared MCP servers in their project's .mcp.json: a GitHub server, a CI/CD server, and a Cloud Monitoring server. A developer initiates a complex prompt asking Claude Code to 'Check the latest failing CI build, find the corresponding commit in GitHub, and check if the monitoring server shows any CPU spikes at that time.' How does Claude Code manage the tools required for this request?
options:
  A: "Claude Code connects to the CI/CD server first, disconnects, connects to GitHub, disconnects, and finally connects to the Monitoring server."
  B: "Claude Code requires the developer to specify which server to activate using a --server flag before executing the prompt."
  C: "Claude Code discovers tools from all three configured servers at connection time and makes them available simultaneously to the agent to orchestrate the workflow."
  D: "Claude Code merges the three servers into a temporary local SQLite database and queries the tools using a unified GraphQL interface."
correct: C
explanation: |
    A: This approach is incorrect because Claude Code does not connect and disconnect sequentially. Operating in serial would be highly inefficient and would prevent the agent from planning a holistic workflow that requires referencing data from multiple tools across different services in a single turn.
    B: Claude Code utilizes the .mcp.json configuration to automatically manage server connectivity. Manual activation via flags for every prompt is not required, as the shared configuration is designed to provide a persistent and seamless tool discovery experience for the agent.
    C: This is correct. Upon initialization, Claude Code reads the configuration, connects to all defined MCP servers, and performs tool discovery. All discovered tools are presented to the agent's tool-calling interface simultaneously, allowing Claude to orchestrate complex, multi-step workflows that span across multiple disparate services.
    D: This is incorrect. MCP (Model Context Protocol) relies on a standardized protocol for tool invocation and resource access; it does not consolidate remote server data into a local SQLite database or use GraphQL as a unified abstraction layer for tool execution.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24071)
```

```question
id: certsafari-domain-4-mcp-021
domain: domain-4-mcp
difficulty: medium
stem: |
  You attempt to use the Edit tool to change a generic `<li>Item</li>` tag to `<li>Updated Item</li>` in a large HTML template. The tool fails and returns an error stating 'Target text is not unique'. Expanding the target text to include surrounding lines still results in a non-unique match error because the exact block structure is repeated identically in a static list. According to best practices, what must you do next?
options:
  A: "Use the Bash tool to execute an `awk` script to count the `<li>` tags and replace the specific nth occurrence."
  B: "Use the Read tool to load the full file contents, perform the targeted modification using your full context awareness, and use the Write tool to save the file."
  C: "Use the Grep tool to isolate the specific line number, then use the Edit tool with the line number as the sole matching criterion."
  D: "Use the Glob tool to find smaller partial templates and modify those instead of the main HTML file."
correct: B
explanation: |
    A: While a Bash or awk script could technically target a specific occurrence, this approach is brittle, complex, and error-prone for HTML templates. It is not the recommended best practice in an MCP workflow when safer context-aware tools are available.
    B: Correct. When the Edit tool (which relies on unique string matching) fails due to non-uniqueness, the standard best practice is to fallback to the Read/Write cycle. By reading the entire file, the model can use its full context to identify and modify the correct section accurately, then overwrite the file with the updated content.
    C: Grep is primarily for searching and does not resolve the Edit tool's requirement for a unique string block. Furthermore, relying on line numbers for edits is brittle and often not supported as a primary matching criterion in precision-based Edit tools.
    D: Glob is designed for file discovery and pattern matching across file systems. It does not address the issue of resolving identical, non-unique text blocks within a single file.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24296)
```

```question
id: certsafari-domain-4-mcp-022
domain: domain-4-mcp
difficulty: medium
stem: |
  A travel booking agent uses an MCP tool to check flight availability. The tool requires the date format to be exactly `YYYY-MM-DD`. The agent accidentally passes `MM/DD/YYYY`, causing the tool's backend to throw a parsing exception. How should the MCP tool be designed to correct the agent's behavior efficiently?
options:
  A: "Return `isError: true`, `errorCategory: \"business\"`, `isRetryable: false`, and a message stating the flight cannot be booked."
  B: "Automatically and silently convert the date format inside the tool's backend without informing the agent, to save tokens and reduce latency."
  C: "Return `isError: true`, `errorCategory: \"validation\"`, `isRetryable: true`, and a message explicitly stating the required `YYYY-MM-DD` format."
  D: "Return `isError: false` with an empty flight list, assuming the invalid date means no flights exist for that timeframe."
correct: C
explanation: |
    A: Incorrect. This response misclassifies the error as a business logic error rather than a data validation issue. Additionally, marking the error as non-retryable prevents the agent from correcting the date and attempting the request again, which is inefficient for a simple formatting mistake.
    B: Incorrect. While silent conversion might seem to save tokens, it lacks transparency and can lead to unexpected behavior if the tool's conversion logic misinterprets the input. Best practices for MCP tools suggest providing explicit feedback so the agent understands the tool's constraints and can adjust its behavior accordingly.
    C: Correct. Using a structured validation error response with `isError: true`, `errorCategory: "validation"`, and `isRetryable: true` is the optimal approach. By providing a clear message about the required `YYYY-MM-DD` format, the tool gives the agent the specific context needed to fix the input and immediately retry the call.
    D: Incorrect. This is a form of 'silent failure' that misleads the agent. Returning an empty result list implies that there are no flights available for the requested time, when in reality the query was never successfully processed. This prevents proper error recovery and debugging.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24270)
```

```question
id: certsafari-domain-4-mcp-023
domain: domain-4-mcp
difficulty: medium
stem: |
  A data engineering agent is designed to write complex SQL queries across a massive data warehouse containing over 800 tables. During testing, the agent frequently hallucinates column names or wastes significant time executing `DESCRIBE TABLE` tool calls for dozens of tables before writing the actual query. What is the most effective architectural solution to provide the agent with the necessary context?
options:
  A: "Expose the database schemas as an MCP resource, giving the agent immediate visibility into the schema catalog without exploratory tool calls."
  B: "Update the system prompt to include the complete schema definition for all 800 tables so the agent has it in context at all times."
  C: "Create a guess_schema tool that uses a smaller, faster LLM to predict column names based on the table name, reducing the load on the main agent."
  D: "Restrict the agent's access to only 10 tables per session by configuring a dynamic whitelist in the .mcp.json file."
correct: A
explanation: |
    A: Correct. In the Model Context Protocol (MCP), resources are designed to expose structured, read-only data (like a database schema catalog) to the agent. This provides an authoritative source of truth that the model can reference as needed, significantly reducing the overhead and latency associated with sequential tool calls and preventing hallucinations.
    B: Incorrect. Including schema definitions for 800 tables in the system prompt would likely exceed the model's context window or at least bloat it significantly, leading to high token costs, increased latency, and a loss of focus for the primary reasoning task.
    C: Incorrect. A guessing tool relies on prediction rather than authoritative metadata, which exacerbates the core problem of hallucination. Data engineering tasks require absolute accuracy to ensure SQL queries do not fail in production.
    D: Incorrect. Restricting the agent's scope is a brittle workaround that limits its ability to handle complex queries across the full warehouse. It does not address the fundamental need for a scalable way to discover metadata within the allowed scope.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24067)
```

```question
id: certsafari-domain-4-mcp-024
domain: domain-4-mcp
difficulty: medium
stem: |
  A multi-agent system features a Data Gathering subagent that queries three different external databases via MCP tools to build a comprehensive user profile. During a query, Database B experiences a transient timeout, while Databases A and C return successfully. The subagent needs to report back to the Coordinator agent. What is the most resilient architectural approach?
options:
  A: "The subagent should immediately halt and return `isError: true` to the Coordinator with no data, forcing the Coordinator to restart the entire workflow from scratch."
  B: "The subagent should retry Database B indefinitely until it recovers, ensuring the Coordinator always receives a complete dataset regardless of how long it takes."
  C: "The subagent should attempt local retries for Database B. If it still fails, it should return `isError: false` to the Coordinator containing the partial results from A and C, alongside structured metadata detailing the failure of B and what was attempted."
  D: "The subagent should return `isError: true` to the Coordinator, but mask the failure of Database B by hallucinating expected values based on the successful responses from Databases A and C."
correct: C
explanation: |
    A: This approach is brittle and inefficient. Halting and returning an error with no data wastes the successful work of the other tools and forces unnecessary full-workflow restarts instead of allowing the system to progress with partial data.
    B: Indefinite retries block the system, consume resources, and create unpredictable latency for the Coordinator. A resilient architecture uses bounded retries with backoff and reports status so the system can make progress rather than waiting indefinitely for a single dependency.
    C: This approach represents the most resilient design. By attempting limited local retries and then returning partial results with structured metadata, the subagent supports graceful degradation. This allows the Coordinator to decide whether to proceed with missing data, seek alternative sources, or trigger a specific recovery routine.
    D: Fabricating or hallucinating values to mask failures is dangerous. It corrupts data integrity and undermines trust in the multi-agent system. Transparent, structured error reporting is required to ensure downstream components make decisions based on factual status.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24266)
```

```question
id: certsafari-domain-4-mcp-025
domain: domain-4-mcp
difficulty: medium
stem: |
  A DevOps assistant has tools for `restart_server`, `view_logs`, and `escalate_incident`. The system prompt states: 'If a user reports a server crash, you must immediately escalate the incident.' A user says, 'The web server crashed, but I just want to view the logs to see why before we wake anyone up.' Claude ignores the user's request and calls `escalate_incident`. How should the architect resolve this conflict?
options:
  A: "Delete the escalate_incident tool so Claude is forced to use view_logs."
  B: "Update the view_logs tool description to say 'USE THIS EVEN IF THE SERVER CRASHED'."
  C: "Review and revise the system prompt to remove the rigid, keyword-sensitive instruction that overrides the user's specific request and tool descriptions."
  D: "Change the user interface to only allow predefined button clicks instead of natural language."
correct: C
explanation: |
    A: Deleting the escalate_incident tool is a destructive action that removes necessary functionality. It prevents Claude from escalating incidents when truly required and does not address the underlying logic conflict in the system instructions.
    B: Updating the tool description with 'shouty' text is a brittle, ad-hoc workaround. Tool descriptions are typically subordinate to the system prompt in Claude's instruction hierarchy; therefore, a rigid system prompt instruction will likely continue to override tool-level descriptions.
    C: The root cause is a rigid, keyword-sensitive directive in the system prompt that forces a specific action regardless of context. Revising the prompt to allow for nuance and context enables Claude to balance safety/escalation policies with the user's explicit intent and tool-level descriptions.
    D: Switching to button clicks is a UI-level workaround that ignores the failure in the AI's reasoning logic. This approach sacrifices the benefits of natural language interaction and usability without fixing the conflicting system instructions.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24116)
```

```question
id: certsafari-domain-4-mcp-026
domain: domain-4-mcp
difficulty: medium
stem: |
  A DevOps team is integrating a cloud infrastructure MCP server into their shared repository via .mcp.json. The server requires a highly privileged API token to provision resources. Security policies strictly prohibit committing plaintext secrets or using shared service accounts for local development; each developer must use their own temporary credentials. Which configuration approach satisfies these security requirements?
options:
  A: "Store the API token in a secure AWS Secrets Manager vault and configure the .mcp.json to fetch the secret at runtime using a built-in Claude Code secret retrieval tool."
  B: "Encrypt the API token using a team-shared GPG key, commit the encrypted string to .mcp.json, and have the MCP server decrypt it locally."
  C: "Use environment variable expansion by configuring the token argument as ${INFRA_API_TOKEN} in the .mcp.json, requiring developers to set this variable in their local shell."
  D: "Prompt the user for the API token via a CLI interactive input every time Claude Code initializes the MCP server from the .mcp.json configuration."
correct: C
explanation: |
    A: Incorrect. Claude Code does not natively resolve external vault secrets (like AWS Secrets Manager) directly within the .mcp.json configuration file. Furthermore, accessing a central vault often requires a shared identity or secret to authenticate the fetch, which may violate the requirement for individual temporary credentials.
    B: Incorrect. This method involves a shared team secret (the GPG key) and results in every developer using the same underlying credential. This violates the security policy against shared service accounts and the requirement for each developer to use their own temporary credentials.
    C: Correct. Environment variable expansion is the standard and recommended way to inject secrets into MCP servers via .mcp.json. It ensures no secrets are committed to the repository and allows each developer to provide their own ephemeral, personal token (obtained via their local authentication flow) in their local shell environment.
    D: Incorrect. While interactive prompts might avoid plaintext storage, .mcp.json configurations are used to spawn the MCP server as a background child process. Requiring interactive input during the initialization of the server process is non-standard, can cause the process to hang, and is not a built-in feature of the .mcp.json configuration schema.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24062)
```

```question
id: certsafari-domain-4-mcp-027
domain: domain-4-mcp
difficulty: medium
stem: |
  An e-commerce bot has `refund_order`, `cancel_order`, and `return_order` tools. A user says, 'I want my money back for order #123, it hasn't shipped yet.' Claude calls `refund_order`, which fails because the backend requires the order to be shipped first; it should have used `cancel_order`. How can the architect prevent this misrouting?
options:
  A: "Merge all three tools into a single `manage_order` tool and let the backend resolve the logic based on the order state."
  B: "Add explicit boundary explanations in the tool descriptions detailing the specific order state (e.g., 'unshipped' vs 'delivered') required for each tool."
  C: "Modify the system prompt to instruct Claude to always call `check_order_status` before taking any action."
  D: "Rename `refund_order` to `process_money_back` to better match user intent."
correct: B
explanation: |
    A: Merging tools into a single 'god tool' creates ambiguity and shifts the responsibility of determining the correct action entirely to the backend. This obscures the tool boundaries and makes it harder for the model to reason about specific preconditions.
    B: Adding explicit boundary explanations and preconditions (e.g., 'use cancel_order for unshipped orders' vs 'use refund_order only for delivered items') provides the model with the necessary context to choose the correct tool based on the specific state of the order, which is a best practice for tool design.
    C: While a status check is a good complementary safety measure, forcing it via the system prompt is a brittle solution that adds latency and cost. It is more efficient and robust to define clear contracts and boundaries within the tool descriptions themselves.
    D: Superficial renaming does not address the underlying semantic mismatch regarding the order's state. In fact, a generic name like 'process_money_back' might actually increase misrouting by failing to convey the technical constraints of the backend.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24118)
```

```question
id: certsafari-domain-4-mcp-028
domain: domain-4-mcp
difficulty: medium
stem: |
  An agent uses an MCP tool to translate text via a third-party API. The API has a strict rate limit of 10 requests per minute and returns a 429 status code when exceeded. The agent frequently hits this limit, receives a generic error, and immediately fails the user's request. How should the architect implement local error recovery for this transient failure?
options:
  A: "The MCP tool should immediately return `isError: true`, `errorCategory: \"transient\"`, and `isRetryable: false` so the agent stops translating and informs the user."
  B: "The agent's system prompt should be updated to include a mandatory `time.sleep(60)` command before calling the translation tool."
  C: "The MCP tool should catch the 429 error, implement an exponential backoff and retry loop internally, and only return `isError: true` to the agent if the internal retries are exhausted."
  D: "The MCP tool should return `isError: false` and return the original untranslated text to keep the conversation flowing without interruption."
correct: C
explanation: |
    A: Incorrect. Marking a transient error as non-retryable (`isRetryable: false`) prevents the agent from attempting any recovery, which forces an immediate failure for the user rather than addressing the rate limit issue.
    B: Incorrect. System prompts are intended for high-level instructions and behavioral guidance, not for imperative control flow or runtime execution commands like `sleep`. This approach is brittle and violates the separation of concerns.
    C: Correct. This is the standard architectural pattern for handling transient failures. By implementing exponential backoff and retries within the MCP tool itself, the error can be resolved transparently. This keeps the retry logic centralized and avoids exposing temporary infrastructure limitations to the model or user.
    D: Incorrect. Returning untranslated text while signaling success (`isError: false`) is a silent failure. This results in incorrect output and degrades the quality of the interaction, as the user is not aware that the translation failed.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24273)
```

```question
id: certsafari-domain-4-mcp-029
domain: domain-4-mcp
difficulty: medium
stem: |
  You need to find all files that contain the hardcoded IP address `192.168.1.50`. The files could be named anything and have any extension (e.g., `.txt`, `.config`, `.ts`, `.md`). Which tool is the most appropriate for this task?
options:
  A: "Use Glob with the pattern **/*192.168.1.50* to find the files."
  B: "Use Grep with the search string 192.168.1.50 to search the contents of all files across the codebase."
  C: "Use Read on the root directory and manually scan the output for the IP address."
  D: "Use the Edit tool to replace the IP address globally without searching first."
correct: B
explanation: |
    A: Glob is used for pattern matching filenames and directory paths, not for searching within file contents. The pattern `**/*192.168.1.50*` would only identify files where the IP address is part of the filename itself, missing instances where the IP is hardcoded inside files with standard names like `.config` or `.ts`.
    B: Grep is the primary tool designed to search for specific strings or patterns within the contents of files. It can recursively scan a codebase to locate occurrences of a string like `192.168.1.50` regardless of the filename or extension, making it the most appropriate and efficient tool for finding hardcoded data.
    C: Using the Read tool to manually scan for a string is highly inefficient and impractical, especially in large codebases. Read is meant for retrieving the content of a specific file once the location is known, whereas Grep provides an automated, recursive search mechanism.
    D: The Edit tool is used for modifying files, not for searching. Attempting a global replacement without first identifying and reviewing occurrences via a search tool could lead to unintended side effects and does not satisfy the requirement to locate the files first.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24298)
```

```question
id: certsafari-domain-4-mcp-030
domain: domain-4-mcp
difficulty: medium
stem: |
  An internal knowledge-base agent uses a generic `fetch_url` tool to retrieve company documents. Production logs show the agent occasionally attempts to fetch external public URLs or hallucinates internal IP addresses, leading to timeouts and security alerts. Which modification best resolves this issue while maintaining the agent's core functionality?
options:
  A: "Replace `fetch_url` with a constrained `load_internal_document` tool that accepts document IDs and validates them against the internal directory."
  B: "Set `tool_choice: {\"type\": \"auto\"}` so the model can decide whether the URL is internal or external before executing the tool call."
  C: "Implement a pre-processing agent that uses regex to validate URLs before passing them to the `fetch_url` tool."
  D: "Update the `fetch_url` tool's description to explicitly warn the model about the consequences of fetching external URLs."
correct: A
explanation: |
    A: Correct. Replacing a broad, generic tool like `fetch_url` with a specific, ID-based tool follows the principle of least privilege and strict input validation. By requiring document IDs and validating them against an internal source-of-truth, you eliminate the model's ability to hallucinate arbitrary IP addresses or attempt to reach external URLs, while providing a programmatic guardrail at the tool boundary.
    B: Incorrect. `tool_choice: {"type": "auto"}` is often the default behavior and simply allows the model to decide whether to use a tool or not. It does not provide constraints on the input parameters themselves, meaning the model can still generate hallucinated or insecure URLs when it decides to call the tool.
    C: Incorrect. While validation is good, using regex and a separate agent adds unnecessary complexity and is brittle. Regex often misses edge cases in URL schemes and cannot verify if a document actually exists in the internal directory. Constraining the tool schema (Option A) is a more robust architectural pattern.
    D: Incorrect. Descriptive warnings are considered 'soft constraints' and are unreliable. Models may ignore or overlook instructions in the tool description, especially in complex reasoning chains. Secure tool design requires 'hard constraints' such as schema validation and restricted input sets.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24148)
```

```question
id: certsafari-domain-4-mcp-031
domain: domain-4-mcp
difficulty: medium
stem: |
  An HR agent uses an MCP tool to search for employee records matching specific technical skills. A user asks the agent to find employees with 'Cobol' experience. The database query executes successfully but finds zero matches. The tool currently returns `isError: true` with the message 'No records found.' Consequently, the agent apologizes to the user, stating that the database is down. How should the tool's response be modified?
options:
  A: "Change the tool to return `isError: false` with an empty list `[]` and a message indicating a successful query with zero matches, distinguishing a valid empty result from an access failure."
  B: "Keep `isError: true` but add `isRetryable: false` to the structured metadata so the agent knows the database is functioning but should not try the query again."
  C: "Change the tool to return `isError: false` but include a mock employee record in the response so the agent does not misinterpret the empty array as a system failure."
  D: "Change the tool to return `isError: true` with `errorCategory: \"validation\"` to indicate to the agent that the search term 'Cobol' was invalid."
correct: A
explanation: |
    A: In tool design, a query that executes correctly but finds zero matches is a successful operation, not a system error. By returning `isError: false` with an empty set, the agent understands the infrastructure is healthy and can accurately inform the user that no records exist for that specific criteria, rather than hallucinating a system outage.
    B: Keeping `isError: true` is fundamentally misleading because the tool did not fail to execute. While `isRetryable: false` prevents unnecessary retries, it does not fix the root issue: the agent still interprets any `isError: true` as a failure of the tool or underlying system.
    C: Including mock data violates data integrity and could lead the agent to provide false information to the user. Tools should provide honest, empty results for valid queries with no matches.
    D: Searching for a term like 'Cobol' is not a validation error if the input format was correct. Using an error category like 'validation' would incorrectly signal to the agent that the user's input was malformed or prohibited, rather than simply being absent from the database.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24267)
```

```question
id: certsafari-domain-4-mcp-032
domain: domain-4-mcp
difficulty: medium
stem: |
  A data extraction agent is designed to read unstructured emails and output structured JSON exclusively via a `save_extracted_data` tool. However, for very short emails, the agent sometimes bypasses the tool and simply replies with conversational text like, "Here is the JSON you requested: {...}". How can the architect strictly enforce that the data is sent through the tool?
options:
  A: "Set `tool_choice: {\"type\": \"auto\"}` and remove all conversational examples from the system prompt."
  B: "Set `tool_choice: {\"type\": \"any\"}` to guarantee the model calls a tool rather than returning conversational text."
  C: "Use `tool_choice: {\"type\": \"tool\", \"name\": \"save_extracted_data\"}` on every single turn, including follow-up conversational turns."
  D: "Implement a post-processing script that parses the conversational text to extract the JSON payload."
correct: C
explanation: |
    A: Incorrect. Setting `tool_choice: {"type": "auto"}` allows the model to decide whether to call a tool or return text. This does not strictly enforce tool usage, and even without conversational examples, the model may still default to a text response for short inputs.
    B: Incorrect. While `tool_choice: {"type": "any"}` does force the model to use at least one of the provided tools (preventing a pure text response), it is less precise than forcing a specific tool by name. To ensure the output specifically follows the `save_extracted_data` schema in a single-purpose agent, type 'tool' is preferred.
    C: Correct. Using `tool_choice: {"type": "tool", "name": "save_extracted_data"}` explicitly forces Claude to use that specific tool. This overrides the model's internal heuristic to reply conversationally and ensures that all output is delivered through the defined tool schema, which is the standard method for strict enforcement in the Messages API.
    D: Incorrect. Relying on post-processing is a brittle workaround that does not solve the underlying reliability issue. It reintroduces the risk of parsing errors and fails to leverage the built-in API constraints designed to guarantee structured tool calls.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24150)
```

```question
id: certsafari-domain-4-mcp-033
domain: domain-4-mcp
difficulty: medium
stem: |
  A Level 1 IT Support agent has a `check_ticket_status` tool. Users frequently ask to escalate tickets, which requires interacting with Jira, PagerDuty, and Slack APIs. When the architect added these 3 escalation tools to the L1 agent, it started misusing the PagerDuty tool for low-priority password resets. What is the best architectural approach to handle escalations?
options:
  A: "Keep all tools on the L1 agent but use `tool_choice: {\"type\": \"any\"}` to force the agent to evaluate priority before calling PagerDuty."
  B: "Remove the 3 escalation tools from the L1 agent, keep the `check_ticket_status` tool, and route escalation requests to a specialized L2 Escalation agent."
  C: "Replace the 3 escalation tools with a single `escalate_ticket` tool that triggers a hardcoded script, bypassing the LLM's decision-making entirely."
  D: "Give the L1 agent a `web_search` tool so it can look up the correct PagerDuty escalation policies before acting."
correct: B
explanation: |
    A: Incorrect. Using `tool_choice: {"type": "any"}` forces the model to select a tool but does not improve reasoning or priority evaluation. It fails to address the underlying issue of high-impact tools being accessible to a general-purpose L1 agent, and can actually lead to more errors by forcing tool calls even when they aren't appropriate.
    B: Correct. This approach follows the architectural principles of separation of concerns and least privilege. By moving high-stakes tools to a specialized L2 agent, you reduce the 'noise' and potential for misuse in the L1 agent while ensuring complex escalations are handled by an agent with more focused instructions and restricted access.
    C: Incorrect. While a hardcoded script provides control, it is brittle and lacks the flexibility to handle nuanced escalation paths across multiple platforms (Jira, Slack, PagerDuty). Using a specialized agent (as in Option B) provides better maintainability and observability while utilizing LLM reasoning for orchestration.
    D: Incorrect. Adding a `web_search` tool increases complexity and token usage without addressing the root cause. Knowledge of policies does not prevent the agent from making execution errors or misidentifying priority in the heat of a user request.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24151)
```

```question
id: certsafari-domain-4-mcp-034
domain: domain-4-mcp
difficulty: medium
stem: |
  A company is adopting Claude Code and needs to integrate it with their standard Atlassian Jira instance for issue tracking, as well as a highly customized, proprietary internal system used for hardware inventory management. The engineering manager asks the architect for the most efficient strategy to implement these integrations. Which strategy should the architect recommend?
options:
  A: "Build custom MCP servers for both Jira and the inventory system to ensure uniform logging and security controls across all agent interactions."
  B: "Choose an existing community MCP server for the standard Jira integration, and reserve custom MCP server development exclusively for the proprietary inventory system."
  C: "Utilize community MCP servers for both systems by mapping the proprietary inventory system's API to a standard community template."
  D: "Develop a single custom MCP server that handles both Jira and the inventory system to minimize the number of connections Claude Code needs to establish."
correct: B
explanation: |
    A: Building custom MCP servers for both systems is inefficient and redundant. Creating a custom server for a standard product like Jira where well-tested community or vendor-supported integrations likely already exist wastes engineering resources and increases the long-term maintenance burden.
    B: This is the most efficient strategy. Leveraging a community-maintained MCP server for standard tools like Jira speeds up deployment and ensures reliability. Reserving custom development for the proprietary inventory system allows the team to focus on the unique authentication, data mapping, and security requirements of their internal hardware inventory system.
    C: Attempting to map a highly customized proprietary system to a standard community template is often unfeasible or results in a brittle, incomplete integration. Proprietary systems typically have unique schemas and business logic that require a bespoke MCP implementation to function correctly within an agentic workflow.
    D: Developing a single monolithic MCP server to handle two unrelated systems couples unrelated concerns, increases architectural complexity, and creates a larger security blast radius. It is better to maintain modularity by using separate integrations for distinct functional areas.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24066)
```

```question
id: certsafari-domain-4-mcp-035
domain: domain-4-mcp
difficulty: medium
stem: |
  A technical writing agent is tasked with updating API documentation based on recent codebase changes. Currently, the agent executes a `list_directories` tool, followed by multiple `read_file` tool calls just to understand the existing documentation hierarchy before making any edits. This exploratory process consumes excessive tokens and increases latency. How should the architect optimize this workflow?
options:
  A: "Combine the `list_directories` and `read_file` tools into a single `explore_docs` tool that recursively returns all file contents in one massive string."
  B: "Expose the documentation hierarchy as an MCP resource, allowing the agent to read the content catalog directly without requiring exploratory tool calls."
  C: "Instruct the agent via the system prompt to guess the file paths based on standard REST API naming conventions instead of exploring the directory."
  D: "Move the documentation repository to a separate MCP server to isolate the token usage from the main codebase operations."
correct: B
explanation: |
    A: Incorrect. This approach would likely worsen the problem by loading all file contents into the context window at once, dramatically increasing token consumption and latency. Anthropic's best practices for agent design emphasize efficient context management and "just-in-time" data loading to avoid overwhelming the model.
    B: Correct. According to Anthropic's documentation, this is a recommended approach. The Model Context Protocol (MCP) is an open standard designed to connect AI systems with external data. Exposing the documentation as an MCP resource allows the agent to read a structured content catalog directly, which is far more efficient than making numerous exploratory tool calls to discover the hierarchy.
    C: Incorrect. Relying on the agent to guess file paths is a brittle and unreliable strategy. This approach can easily lead to errors, missed files, or incomplete updates. A robust architectural solution should provide the agent with a deterministic way to discover information, not rely on guesswork.
    D: Incorrect. While using an MCP server is part of the correct solution, simply moving the repository to a different server does not solve the core problem of inefficient, exploratory tool calls. The key optimization comes from changing the access pattern (from iterative calls to reading a catalog), not just changing the location of the data.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32826)
```

```question
id: certsafari-domain-4-mcp-036
domain: domain-4-mcp
difficulty: medium
stem: |
  A software development multi-agent system includes a 'Code Writer' agent and a 'QA Tester' agent. To speed up the workflow, the developer gave the Code Writer agent access to the `run_integration_tests` tool. Now, the Code Writer frequently attempts to run tests before finishing the code generation, causing pipeline failures. What is the most appropriate architectural fix?
options:
  A: "Force the Code Writer to use `tool_choice: {\"type\": \"any\"}` so it must write code and run tests in the same turn."
  B: "Restrict the Code Writer's toolset to code generation tools and route testing tasks exclusively to the QA Tester agent."
  C: "Update the `run_integration_tests` tool description to warn the Code Writer not to use it until the code is complete."
  D: "Merge the Code Writer and QA Tester into a single agent so it has full context of when to run the tests."
correct: B
explanation: |
    A: Using `tool_choice: {"type": "any"}` forces the model to call at least one tool, which does not address the sequencing issue. In fact, forcing the model to use tools might encourage it to call the testing tool prematurely to satisfy the requirement, worsening the timing problem rather than enforcing a proper workflow.
    B: This is the most robust architectural fix. Restricting tools based on the specific role of the agent enforces a clear separation of concerns. By removing the testing tool from the Code Writer, you create a deterministic boundary that ensures code must be completed and passed to the QA Tester before verification can occur, aligning with best practices for multi-agent orchestration.
    C: Updating tool descriptions is a prompt-based mitigation that relies on the model's adherence to instructions. While helpful, it is probabilistic and less reliable than an architectural restriction. In complex workflows, agents may still ignore warnings if they are incentivized to reach an end goal quickly.
    D: Merging agents reduces modularity and increases the complexity of the prompt and toolset for a single agent. While it provides more context to a single LLM call, it often results in lower performance compared to specialized agents and does not resolve the core issue of the model attempting to skip steps in the development lifecycle.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24156)
```

```question
id: certsafari-domain-4-mcp-037
domain: domain-4-mcp
difficulty: medium
stem: |
  An enterprise search assistant has two tools: `query_confluence` and `query_jira`. The system prompt includes the following instruction: 'You are an internal assistant. Always search the Confluence knowledge base first for any user questions to ensure accurate answers.' Users complain that when they explicitly ask 'What is the status of Jira ticket PROJ-123?', Claude still uses `query_confluence` instead of `query_jira`. What is the most effective way to fix this misrouting?
options:
  A: "Rename `query_jira` to `search_confluence_for_jira_tickets` to trick the model into using it."
  B: "Add a negative constraint to the `query_confluence` tool description instructing it to ignore ticket IDs."
  C: "Remove the keyword-sensitive instruction from the system prompt that biases the model toward Confluence."
  D: "Combine both tools into a single `search_internal_systems` tool and let the backend handle the routing."
correct: C
explanation: |
    A: Incorrect. Renaming tools to 'trick' the model is a brittle and deceptive practice. It misrepresents the tool's purpose, leading to maintenance difficulties and potentially confusing the model's semantic understanding of the tool's true function.
    B: Incorrect. While negative constraints in tool descriptions are generally helpful for defining boundaries, they are often subordinate to explicit 'hard' instructions in the system prompt. If the system prompt mandates 'Always search Confluence first', the model will prioritize that instruction over the tool's specific description, leading to continued misrouting or redundant tool calls.
    C: Correct. This addresses the root cause of the issue. The 'Always search... first' instruction creates a rigid bias that overrides Claude's reasoning and ability to select the most relevant tool based on user intent. Removing this blanket instruction allows the model to utilize the semantic context of the user's request (e.g., a Jira ticket ID) to route the query to the correct tool appropriately.
    D: Incorrect. Combining both tools into a single backend-routed tool shifts the routing responsibility away from the model. While this might solve the routing, it reduces transparency and the model's ability to reason about which system it is interacting with, making multi-step reasoning and error handling more difficult.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24110)
```

```question
id: certsafari-domain-4-mcp-038
domain: domain-4-mcp
difficulty: medium
stem: |
  A real estate bot has a `calculate_mortgage` tool. It works perfectly for standard fixed-rate mortgages. However, when users ask about 'reverse mortgages' or 'HELOCs', Claude attempts to use the tool, passing invalid parameters that crash the backend calculator. What is the best approach to handle these edge cases?
options:
  A: "Implement a try-catch block in the backend to silently fail and return a generic error message to Claude."
  B: "Update the tool description to explicitly list supported mortgage types and add boundary explanations instructing Claude not to use the tool for reverse mortgages or HELOCs."
  C: "Create dummy parameters in the tool schema for reverse mortgages and HELOCs that return static text."
  D: "Remove the `calculate_mortgage` tool and rely on Claude's internal knowledge for all financial calculations."
correct: B
explanation: |
    A: Incorrect. While backend error handling prevents server crashes, silently failing with a generic message does not guide Claude on proper tool usage. This results in the model repeatedly attempting the same incorrect action or providing confusing responses to the user without understanding the root cause.
    B: Correct. Updating the tool description to explicitly list supported mortgage types and adding boundary instructions is the recommended practice for safe tool use. By making the tool's limitations clear in the prompt/schema, Claude can reason that it should not use the tool for unsupported scenarios, thereby preventing invalid calls and backend crashes.
    C: Incorrect. Creating dummy parameters is deceptive and increases schema complexity. It forces the model to provide static or potentially misleading results rather than allowing the model to transparently communicate that it cannot handle those specific financial products.
    D: Incorrect. Removing the tool entirely sacrifices the precision and deterministic accuracy that programmatic calculators provide for supported mortgage types. LLMs are often unreliable for complex financial calculations, so the best approach is to retain the tool but strictly define its operational boundaries.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24114)
```

```question
id: certsafari-domain-4-mcp-039
domain: domain-4-mcp
difficulty: medium
stem: |
  A medical triage agent must collect patient symptoms and then call `query_medical_database`. However, the agent sometimes tries to call `query_medical_database` before asking the patient for their symptoms, resulting in poor search results. The architect wants to force the agent to call an `ask_symptoms` tool first, but allow it to query the database later. How should this be implemented?
options:
  A: "Set `tool_choice: {\"type\": \"tool\", \"name\": \"ask_symptoms\"}` on the initial turn, then switch to `tool_choice: {\"type\": \"auto\"}` for subsequent turns."
  B: "Set `tool_choice: {\"type\": \"any\"}` and provide a system prompt that strictly orders the tools."
  C: "Combine `ask_symptoms` and `query_medical_database` into a single tool that executes both actions simultaneously."
  D: "Remove `query_medical_database` from the agent and require a human doctor to perform the database query."
correct: A
explanation: |
    A: Correct. Using `tool_choice: {"type": "tool", "name": "tool_name"}` allows the developer to programmatically force the model to use a specific tool in a specific turn. This is the most reliable way to enforce an order of operations. Once the required step is complete, switching back to `tool_choice: {"type": "auto"}` allows the model to regain its reasoning capabilities to decide which tool to use next.
    B: Incorrect. Setting `tool_choice: {"type": "any"}` forces the model to use at least one tool from the set of provided tools, but it does not specify which one. Relying on a system prompt to order tool execution is less reliable than using explicit tool choice parameters to enforce the workflow.
    C: Incorrect. Combining independent actions into a single tool reduces modularity and creates a rigid workflow that may not adapt well to different patient scenarios. It also makes the tool logic significantly more complex to maintain and test.
    D: Incorrect. Removing automation is a regressive solution that does not address the core architectural need of sequencing tool calls. The objective is to refine the agent's behavior, not to eliminate the agent's utility.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24154)
```

```question
id: certsafari-domain-4-mcp-040
domain: domain-4-mcp
difficulty: medium
stem: |
  A data science agent uses a generic `analyze_dataset` tool. Users ask it to perform tasks ranging from simple row counts to complex anomaly detection. The tool frequently times out on complex requests because the backend tries to run a massive, monolithic analysis script every time. Which tool design strategy should be applied?
options:
  A: "Increase the API timeout threshold to 5 minutes to accommodate the monolithic script."
  B: "Split the generic tool into purpose-specific tools like `get_row_count`, `generate_statistical_summary`, and `detect_anomalies` with defined input/output contracts."
  C: "Instruct Claude in the system prompt to warn users that complex queries might take a long time."
  D: "Add a `complexity_score` parameter to the `analyze_dataset` tool so the backend knows how much compute to allocate."
correct: B
explanation: |
    A: Incorrect. Increasing the API timeout threshold is a 'band-aid' fix that does not address the root cause: an inefficient, monolithic tool design. This approach leads to poor resource utilization, decreased responsiveness for simple tasks, and poor scalability as the tool's scope grows.
    B: Correct. Decomposing a monolithic tool into smaller, purpose-specific tools aligns with best practices for MCP integration. This allows for targeted backend processing, clearer input/output contracts for the LLM to follow, and better error handling. It enables the backend to implement optimized, lightweight handlers for simple tasks while reserving heavy compute for specific complex analyses, preventing unnecessary timeouts.
    C: Incorrect. While warning users about potential latency is a helpful user experience mitigation, it does not solve the underlying technical failure of the monolithic script causing timeouts. It leaves the systemic architectural problem unresolved.
    D: Incorrect. Adding a complexity score might help with backend routing, but it relies on the LLM accurately estimating task complexity, which can be inconsistent. It adds operational complexity and ambiguity without fixing the fundamental issue of the monolithic script execution.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24117)
```

```question
id: certsafari-domain-4-mcp-041
domain: domain-4-mcp
difficulty: medium
stem: |
  An internal IT support agent uses an MCP tool to reset user passwords. A junior helpdesk staff member asks the agent to reset the CEO's password. The tool's backend denies the request due to insufficient privileges. How should the tool's error response be structured to ensure the agent handles this scenario correctly without hallucinating or retrying?
options:
  A: "Set `isError: true`, `errorCategory: \"transient\"`, `isRetryable: true`, and `message: \"Access denied. Please try again later.\"` transition"
  B: "Set `isError: true`, `errorCategory: \"permission\"`, `isRetryable: false`, and `message: \"Insufficient privileges to reset executive passwords. Escalation to Tier 3 required.\"`"
  C: "Set `isError: true`, `errorCategory: \"validation\"`, `isRetryable: true`, and `message: \"Invalid user ID. Please provide a different user.\"`"
  D: "Set `isError: false` and `message: \"Password reset failed due to permissions.\"` so the agent does not trigger its internal error recovery loop."
correct: B
explanation: |
    A: Incorrect. This option suggests that the error is transient and retryable, which is misleading. Labeling a permission denial as retryable encourages the agent to make repeated, unnecessary attempts or hallucinate that the issue is temporary, rather than addressing the permanent authorization failure.
    B: Correct. Marking `isError: true` with `errorCategory: "permission"` and `isRetryable: false` clearly signals a non-recoverable authorization failure to the agent. This prevents automated retry loops and provides a clear, actionable message that guides the agent toward the correct escalation path.
    C: Incorrect. This option incorrectly categorizes the error as a validation issue regarding the user ID. Since the user ID is likely valid but the agent lacks permission, this classification is factually wrong and would mislead the agent into asking for different user inputs rather than recognizing the permission barrier.
    D: Incorrect. Setting `isError: false` despite the backend denial is improper tool design. It suppresses the agent's internal error-handling logic, making it difficult for the model to distinguish between a successful operation and a failed one, which often leads to confusion or incorrect status reporting to the user.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24269)
```

```question
id: certsafari-domain-4-mcp-042
domain: domain-4-mcp
difficulty: medium
stem: |
  A platform engineering team built a custom semantic search MCP tool designed to find code snippets based on natural language intent. However, when developers ask Claude Code to 'find where we handle payment retries', the agent consistently ignores the custom semantic search tool and defaults to using the built-in `grep` tool, often missing relevant results that don't contain the exact keyword. How should the team resolve this issue?
options:
  A: "Disable the built-in `grep` tool in the ~/.claude.json file to force the agent to use the custom semantic search tool."
  B: "Rename the custom tool to `grep_advanced` so the agent recognizes it as an upgrade to the built-in tool."
  C: "Enhance the custom MCP tool's description to explicitly detail its semantic capabilities, output format, and specific scenarios where it outperforms standard text matching."
  D: "Change the custom tool's execution environment to run synchronously, as agents prefer built-in tools because they do not require asynchronous waiting."
correct: C
explanation: |
    A: Disabling built-in tools like `grep` is a heavy-handed and brittle approach that may break standard workflows or be unsupported. It fails to address the underlying issue: the agent does not understand the value proposition of the custom tool.
    B: Renaming the tool is a superficial fix. Claude's tool selection logic is driven by functional metadata and descriptions rather than name matching. A misleading name could also cause confusion for human developers and maintainers.
    C: Correct. Claude selects tools based on their descriptions, schemas, and usage examples. By explicitly detailing the tool's semantic capabilities—specifically how it handles natural language intent and concepts rather than just literal strings—the agent will understand when to prioritize this custom tool over keyword-based utilities like `grep`.
    D: Tool selection is determined by the agent's reasoning over tool metadata, not by whether the execution environment is synchronous or asynchronous. Changing the execution mode would not influence the agent's preference during the planning phase.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24065)
```

```question
id: certsafari-domain-4-mcp-043
domain: domain-4-mcp
difficulty: medium
stem: |
  A security patch requires changing the signature of the `verifyToken(token)` function to `verifyToken(token, options)`. The function is used extensively across a large monolithic backend. What is the most efficient way to locate every file that needs to be updated?
options:
  A: "Use Glob to find all .js and .ts files, then Read each one sequentially to check for the function invocation."
  B: "Use Grep with the pattern verifyToken( to search the file contents and identify all caller files and their contexts."
  C: "Use the Edit tool with a wildcard pattern verifyToken(*) to automatically update all signatures in one pass."
  D: "Use the Bash tool to run the test suite and only modify the files that throw compilation errors regarding verifyToken."
correct: B
explanation: |
    A: Incorrect. While this approach would eventually locate all relevant files, it is inefficient. Reading each file sequentially via the Read tool to check for a specific function invocation is time-consuming and resource-intensive compared to using a content-search optimized tool like Grep.
    B: Correct. Grep is the most efficient tool for searching file contents directly. It is designed for pattern-matching tasks and can quickly scan through a large codebase to locate call sites, providing line numbers and context for the required updates.
    C: Incorrect. The Edit tool is intended for modification rather than discovery. Furthermore, attempting a global wildcard update without reviewing the specific context of each call is risky and likely to introduce syntax errors or unintended side effects.
    D: Incorrect. This is a reactive and incomplete approach. It relies entirely on test coverage and the compilation process, which may miss occurrences in untested code paths or configuration files that do not trigger a compilation failure.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24289)
```

```question
id: certsafari-domain-4-mcp-044
domain: domain-4-mcp
difficulty: medium
stem: |
  A research agent uses an MCP tool to summarize a batch of three PDF documents. The tool successfully processes Doc1 and Doc2, but Doc3 is corrupted and cannot be read. The agent needs the summaries of Doc1 and Doc2 to continue its workflow. How should the tool respond to ensure the agent can proceed while acknowledging the error?
options:
  A: "Return `isError: true` with a message about Doc3, discarding the summaries of Doc1 and Doc2 to maintain strict data consistency."
  B: "Return `isError: true` with `isRetryable: true` so the agent keeps retrying the entire batch until Doc3 is fixed by the user."
  C: "Return `isError: false` and hallucinate a generic summary for Doc3 so the agent receives the expected array length and does not crash."
  D: "Return `isError: false` containing the successful summaries of Doc1 and Doc2, and include a structured metadata section detailing the failure of Doc3 (e.g., `partial_success: true`, `failed_items: [\"Doc3\"]`)."
correct: D
explanation: |
    A: Incorrect. Discarding successful summaries prevents the agent from progressing and wastes completed work. Strict all-or-nothing behavior is generally inappropriate in agentic workflows when partial results are usable.
    B: Incorrect. Marking the entire response as an error and retryable will cause the agent to repeatedly retry the whole batch, blocking progress on Doc1 and Doc2. This is inefficient, especially for non-transient errors like file corruption.
    C: Incorrect. Fabricating or hallucinating a summary for a document that could not be read is unsafe, misleading, and undermines the reliability of tool outputs. Tools should always provide accurate metadata rather than invented content.
    D: Correct. Returning partial success (isError: false) along with the successful data and structured metadata about failures allows the agent to proceed with available information. This provides machine-readable details so the agent can intelligently decide whether to retry, skip, or ask the user for remediation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24275)
```

```question
id: certsafari-domain-4-mcp-045
domain: domain-4-mcp
difficulty: medium
stem: |
  You are analyzing a hypothetical software engineering scenario. A core calculation function `computeTax` is defined in `math.ts`. It is imported into `utils.ts` and re-exported as `getTax`. `getTax` is then imported into `invoice.ts` and re-exported as `calculateInvoiceTax`. If you need to modify the original `computeTax` logic and verify all downstream usages, which of the following are valid strategies?
options:
  A: "Read `math.ts` to understand the function. Grep for `computeTax` to find `utils.ts`. Read `utils.ts` to find the `getTax` re-export. Grep for `getTax` to find `invoice.ts`. Read `invoice.ts` to find the `calculateInvoiceTax` re-export. Finally, Grep for `calculateInvoiceTax` to find all its usages."
  B: "Use a file search tool (Glob) to find all files containing the word 'tax', then read all of them to mentally map out the dependencies."
  C: "Use a global search tool (Grep) to search for `computeTax`, and assume that any file not directly importing it will be unaffected by the logic change."
  D: "Use an automated refactoring approach: Rename `computeTax` to `computeTax_v2` in `math.ts`, and then run the full test suite. The resulting compilation errors and test failures will identify all downstream dependencies."
correct: A
explanation: |
    A: This is a correct and methodical, albeit manual, approach. It correctly follows the chain of re-exports (`computeTax` -> `getTax` -> `calculateInvoiceTax`), which is crucial for understanding the full impact of a change. Failing to trace re-exports is a common source of bugs, so this diligent, step-by-step verification is a valid engineering practice.
    B: This approach is incorrect because it is imprecise and inefficient. Searching for a generic term like 'tax' will return many irrelevant results from comments, documentation, and unrelated variables, making it difficult to isolate the specific dependency chain of the `computeTax` function.
    C: This is incorrect and dangerous. The scenario explicitly describes that `computeTax` is re-exported under different names. A search for only the original function name will miss all downstream dependencies that import the re-exported versions, leading to unverified and potentially broken code.
    D: This is a valid and common software engineering strategy for identifying all usages of a function. By renaming the source function, you intentionally 'break the build,' allowing the compiler, linter, or test runner to automatically report every location that needs to be updated. This is often faster and more reliable than manual tracing.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=31739)
```

```question
id: certsafari-domain-4-mcp-046
domain: domain-4-mcp
difficulty: medium
stem: |
  You need to update a single API key variable `const STRIPE_SECRET_KEY = 'sk_test_old_123';` to a new value in a 5,000-line configuration file. The variable name and value are completely unique within the file. Which tool approach is the most efficient and minimizes context window usage?
options:
  A: "Use the Read tool to load the entire 5,000-line file, modify the key in memory, and use the Write tool to save it."
  B: "Use the Edit tool, providing `const STRIPE_SECRET_KEY = 'sk_test_old_123';` as the unique anchor text to perform a targeted modification."
  C: "Use the Grep tool to find the exact line number, then use the Write tool to overwrite that specific line."
  D: "Use the Bash tool with a `sed` command to perform an inline replacement to avoid using the built-in file tools entirely."
correct: B
explanation: |
    A: Using the Read tool to load the entire 5,000-line file is highly inefficient and consumes a significant portion of the context window unnecessarily. This approach scales poorly as file sizes increase.
    B: The Edit tool is specifically designed for targeted modifications using unique anchor text (the 'old' string). By providing the unique variable declaration as the anchor, the assistant avoids reading the full 5,000-line file into its context, making it the most token-efficient and safest choice for precise updates.
    C: This approach is inefficient because it requires multiple tool calls (Grep followed by Write). Furthermore, the built-in Write tool typically overwrites entire files or blocks; it is not as natively suited for single-line contextual replacements as the Edit tool.
    D: While a Bash command like `sed` can perform inline replacements without loading the file into context, it bypasses the built-in Edit tool semantics which provide better safety checks and integration with the model's environment. For standard file edits, the built-in Edit tool is the preferred best practice over raw shell commands.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24281)
```

```question
id: certsafari-domain-4-mcp-047
domain: domain-4-mcp
difficulty: medium
stem: |
  An enterprise architecture team is designing an agentic workflow that requires interacting with three distinct systems: a PostgreSQL database, a Jira instance, and a proprietary internal CRM. The team is debating whether to build a single 'Orchestrator' MCP server that wraps all three APIs or to deploy three separate MCP servers. What is the most architecturally sound approach regarding tool discovery and availability?
options:
  A: "Deploy three separate MCP servers; Claude discovers tools from all configured servers at connection time and makes them available simultaneously to the agent."
  B: "Build a single Orchestrator MCP server, because Claude can only maintain an active connection to one MCP server per session."
  C: "Deploy three separate MCP servers, but configure the agent to explicitly switch contexts between servers using a `switch_server` tool call during the workflow."
  D: "Build a single Orchestrator MCP server to prevent the agent from hallucinating tool names, as multiple servers will cause namespace collisions in the tool registry."
correct: A
explanation: |
    A: Deploying three separate MCP servers follows architectural best practices for modularity, separation of concerns, and independent scaling. Claude is designed to connect to multiple MCP servers simultaneously, discovering and aggregating tools from all configured sources into its tool registry at connection time, making them available to the agent without manual intervention.
    B: Incorrect. Claude can maintain connections to multiple MCP servers at once. Forcing all integrations into a single 'Orchestrator' server creates a monolithic architecture that increases coupling, security blast radius, and maintenance complexity.
    C: Incorrect. While separate servers are correct, the implementation detail is wrong. Claude automatically aggregates tools from all configured MCP servers at the start of the session; there is no architectural requirement or standard protocol for an agent to manually 'switch' between servers using a tool call.
    D: Incorrect. Building a single server to avoid hallucinations or namespace collisions is a poor trade-off. Namespace management is best handled through clear, system-specific tool naming (e.g., jira_create_issue). Multiple servers do not inherently increase hallucination risk compared to a single server with many tools.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24063)
```

```question
id: certsafari-domain-4-mcp-048
domain: domain-4-mcp
difficulty: medium
stem: |
  A travel booking assistant uses a `search_flights` tool that requires dates in a strict `YYYY-MM-DD` format. When users provide relative dates like 'next Friday' or 'tomorrow', Claude passes these natural language values directly to the tool, causing API errors. The current tool description is: 'Searches for available flights between two cities on specific dates.' What is the most robust and recommended way to ensure Claude provides the correct date format?
options:
  A: "Add a pre-processing script to the application backend to convert natural language dates to `YYYY-MM-DD` before calling the flight search API."
  B: "Update the tool description to explicitly state the required `YYYY-MM-DD` input format and add an `input_examples` section demonstrating the correct usage."
  C: "Change the `departure_date` parameter's `type` from `string` to `date` in the tool's `input_schema` to enforce strict typing."
  D: "Instruct Claude in the system prompt to always use a separate `get_current_date` tool before calling `search_flights` to resolve the date first."
correct: B
explanation: |
    A: Incorrect. While this is a valid backend engineering pattern, it is not the recommended approach for guiding Claude. This method corrects the error after the model has already failed to provide the correct format. The Anthropic-native solution is to improve the tool definition itself to teach the model how to correctly format its output from the start.
    B: Correct. According to Anthropic's documentation, providing detailed descriptions and `input_examples` is the most effective way to improve tool performance, especially for format-sensitive parameters like dates. The description should explicitly state the `YYYY-MM-DD` requirement, and the examples should provide concrete demonstrations, which significantly improves Claude's ability to generate the correct format.
    C: Incorrect. The JSON Schema used for the `input_schema` does not have a primitive `date` type; the correct type is `string`. While you can use `"format": "date"` for validation, the research emphasizes that providing `input_examples` is the most effective method for teaching Claude the specific `YYYY-MM-DD` usage pattern, which is the core of the problem.
    D: Incorrect. This approach adds unnecessary complexity and latency by forcing a multi-tool workflow. Claude is capable of resolving relative dates internally. The most direct and recommended solution is to improve the `search_flights` tool definition itself with clear descriptions and examples, rather than creating a more complex process.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32832)
```

```question
id: certsafari-domain-4-mcp-049
domain: domain-4-mcp
difficulty: medium
stem: |
  You need to completely replace the contents of a legacy `webpack.config.js` file with a brand new, standardized 20-line configuration provided by the platform team. The old file contains 300 lines of outdated custom plugins. Which tool application is most appropriate?
options:
  A: "Use the Edit tool, matching the first and last lines of the old file, and replacing the entire block with the new configuration."
  B: "Use the Grep tool to delete the old contents line-by-line, then use the Write tool to insert the new configuration."
  C: "Use the Write tool directly to overwrite the entire `webpack.config.js` file with the new 20-line configuration."
  D: "Use the Bash tool to `rm` the file, then use the Edit tool to create a new file with the same name."
correct: C
explanation: |
    A: Using the Edit tool to match the first and last lines of a large 300-line file is brittle and error-prone. The Edit tool is optimized for targeted, contextual modifications rather than full-file replacements.
    B: Grep is a search utility, not a tool for deleting file contents. Attempting to use search tools for deletion is inefficient and structurally incorrect when a direct replacement tool exists.
    C: The Write tool is the most efficient and direct method for this task because it is designed to atomically create or overwrite a file's entire content. It ensures a clean replacement without the complexity of pattern matching or multi-step operations.
    D: Using Bash to delete the file followed by the Edit tool to recreate it is unnecessarily complex. This approach can lead to file system churn and potential issues with file permissions or metadata, whereas Write handles the overwrite natively.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24293)
```

```question
id: certsafari-domain-4-mcp-050
domain: domain-4-mcp
difficulty: medium
stem: |
  A legal assistant has two tools: `search_case_law` (for past court rulings) and `search_statutes` (for current legislation). When users ask 'What are the laws regarding tenant eviction?', Claude randomly selects between the two tools, often missing critical context. How should the tool descriptions be improved to fix this?
options:
  A: "Combine the tools into `search_legal_database` to allow the backend search engine to handle the routing."
  B: "Update both tool descriptions to explicitly define when to use each tool versus the other, including boundary explanations for ambiguous terms like 'laws'."
  C: "Add a `routing_tool` that Claude must call first to determine which legal database to query."
  D: "Modify the system prompt to require Claude to always call both tools sequentially for any legal query."
correct: B
explanation: |
    A: Combining tools into a single interface removes explicit intent signals and semantic boundaries, offloading the routing responsibility to a backend search engine. This makes it harder for Claude to distinguish between different types of legal sources (statutes vs. case law) and may lead to less precise results.
    B: This is the optimal solution. Claude relies on tool descriptions to map user intent to specific tool functionality. By explicitly defining when to use one tool over the other and providing boundary explanations for ambiguous terms, the model can reliably select the appropriate source or determine if both are necessary based on the user's query.
    C: Adding a dedicated routing tool introduces unnecessary complexity, increased latency, and extra token costs. It attempts to solve via orchestration what should be solved via clear interface definitions, treating the symptom rather than the cause of the ambiguity.
    D: Forcing the model to call both tools sequentially for every query is inefficient and increases operational costs. It fails to utilize the LLM's reasoning capabilities and may produce redundant information when only one source is truly relevant.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24113)
```

```question
id: certsafari-domain-4-mcp-051
domain: domain-4-mcp
difficulty: medium
stem: |
  A healthcare application uses a single `process_patient_record` tool. It handles extracting vitals, summarizing medical history, and verifying insurance. Claude frequently times out or returns incomplete JSON because the tool's output schema is massive and the model struggles to populate all fields accurately in a single pass. Which architectural change best resolves this issue while adhering to tool design best practices?
options:
  A: "Increase the API timeout limit and use a higher-tier model to handle the massive schema."
  B: "Split the generic tool into `extract_patient_vitals`, `summarize_medical_history`, and `verify_insurance_status` with defined input/output contracts."
  C: "Update the system prompt to instruct Claude to only request one piece of information at a time using the existing tool."
  D: "Add few-shot examples to the `process_patient_record` description showing partial data extraction to teach the model to return smaller payloads."
correct: B
explanation: |
    A: Increasing timeouts and upgrading models are brittle workarounds that treat the symptoms rather than the cause. A monolithic tool with an oversized schema increases cognitive load and token usage, which leads to higher costs and latency without resolving the underlying reliability issues.
    B: Splitting the monolithic tool into specialized, modular tools follows the core architectural best practice of creating clear boundaries and focused responsibilities. This reduces the schema size per call, improves model accuracy by narrowing the context, simplifies unit testing, and allows the model to compose tasks more reliably.
    C: Instructing the model via prompting is less reliable than structural changes. Even if the model only requests partial data, the entire massive schema must still be included in every API call, consuming context and maintaining a high risk of validation errors.
    D: Few-shot examples can bloat the prompt and do not solve the fundamental issue of an overly complex tool interface. While they might nudge the model toward better performance, they don't address the architectural debt of a poorly scoped tool.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24109)
```

```question
id: certsafari-domain-4-mcp-052
domain: domain-4-mcp
difficulty: medium
stem: |
  A healthcare scheduling agent uses an MCP tool to book appointments. A user tries to book a specialist without a required primary care referral. The backend API returns a raw database error: `ConstraintViolationException: FK_Referral_Missing`. If passed directly to the agent, the agent might confuse the user with technical jargon. What is the best MCP tool design for this scenario?
options:
  A: "Catch the exception and return `isError: true`, `errorCategory: \"business\"`, `isRetryable: false`, and a customer-friendly message: 'A primary care referral is required to book this specialist. Please ask the user to obtain a referral first.'"
  B: "Pass the raw `ConstraintViolationException` but set `isError: true` and `errorCategory: \"transient\"` so the agent knows it is a technical issue and can retry."
  C: "Return `isError: false` and a message 'Booking successful' but flag the appointment as 'Pending Referral' in the database to avoid agent confusion."
  D: "Return `isError: true`, `errorCategory: \"validation\"`, and ask the agent to retry the booking using a different specialist."
correct: A
explanation: |
    A: Correct. This approach follows MCP best practices by abstracting low-level database constraints into a structured response. Mapping a raw DB constraint to `errorCategory: "business"` with `isRetryable: false` informs the agent that a business rule was violated and retrying won't resolve it. This allows the agent to provide clear, non-technical feedback to the user.
    B: Incorrect. Exposing internal database implementation details is a security risk and provides poor user experience. Furthermore, categorizing a missing referral as a 'transient' error is incorrect; transient errors are for temporary technical issues (like network timeouts) where a retry might succeed.
    C: Incorrect. Returning `isError: false` when a core action failed is misleading and creates state inconsistency. This could lead to the agent falsely confirming an appointment to the user, violating business rules and leading to downstream processing errors.
    D: Incorrect. While labeling the error is better than ignoring it, 'validation' typically refers to input format issues. Suggesting a retry with a different specialist is illogical because the missing referral is a prerequisite for the user/appointment type, not specific to one specialist choice.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24272)
```

```question
id: certsafari-domain-4-mcp-053
domain: domain-4-mcp
difficulty: medium
stem: |
  An enterprise AI assistant has access to 18 different tools ranging from calendar management to database querying. Users report that the assistant frequently hallucinates tool arguments or selects the wrong tool entirely when given complex, multi-part requests. What is the primary cause of this behavior and the recommended architectural solution?
options:
  A: "The context window is overflowing; the solution is to compress the tool descriptions using abbreviations."
  B: "The model lacks sufficient training data for 18 tools; the solution is to fine-tune the model on tool-use examples."
  C: "Giving an agent too many tools degrades selection reliability; the solution is to distribute the tools across specialized subagents with 4-5 tools each."
  D: "The tool_choice parameter is set to {\"type\": \"auto\"}; the solution is to set it to {\"type\": \"any\"} to force stricter evaluation."
correct: C
explanation: |
    A: Incorrect. Compressing tool descriptions with abbreviations reduces clarity and context for the model, likely worsening the issue. While long context can cause some performance degradation, the primary cause of tool hallucination in this scenario is selection overload, not marginal context overflow.
    B: Incorrect. While fine-tuning can improve adherence to specific formats, the core issue with large toolsets is the combinatorial decision difficulty. The primary architectural recommendation for managing tool complexity in agentic systems is architectural decomposition rather than model training.
    C: Correct. Providing a single agent with a very large set of tools (typically exceeding 10-15) increases selection noise and causes the model to hallucinate arguments or pick inappropriate tools. Splitting functionality into specialized subagents—each with a small, focused toolset (around 4–5 tools)—reduces ambiguity and improves reliability. This pattern, often involving an orchestrator or router, is the standard architectural fix for tool-heavy implementations.
    D: Incorrect. The `tool_choice` parameter 'any' forces the model to select a tool, but it does not address selection accuracy or the correctness of the arguments generated. Configuration flags cannot resolve the underlying issue of scope and decision complexity resulting from an over-populated toolset.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24153)
```

```question
id: certsafari-domain-4-mcp-054
domain: domain-4-mcp
difficulty: medium
stem: |
  An engineer is building a tool that uses the Claude API to process user-provided data, such as a `zip_code` and `item_description`. The tool must handle potential API errors gracefully. The API can return a `400 Bad Request` if the `zip_code` is malformed, or a `503 Service Unavailable` if Anthropic's service is temporarily overloaded. How should the tool's error handling logic be structured to correctly manage these two scenarios?
options:
  A: "Return `isError: true` for both. For the `400` error, return `errorCategory: \"validation\"`, `isRetryable: true`, and prompt the user for a valid zip code. For the `503` error, return `errorCategory: \"transient\"`, `isRetryable: true`, and suggest retrying later."
  B: "Return `isError: true` for both. For the `400` error, return `errorCategory: \"validation\"`, `isRetryable: false`, and prompt the user for a valid zip code. For the `503` error, return `errorCategory: \"transient\"`, `isRetryable: true`, and suggest retrying later."
  C: "Return `isError: true` for both. For the `400` error, set `isRetryable: true`. For the `503` error, set `isRetryable: false` to avoid overwhelming the service."
  D: "Return `isError: true` for both. For the `400` error, use `errorCategory: \"transient\"`. For the `503` error, use `errorCategory: \"validation\"`."
correct: B
explanation: |
    A: This is incorrect because a `400 Bad Request` error is a client-side validation error and is not retryable. As confirmed by API best practices, retrying the exact same invalid request will only result in the same error. The client must modify the request (e.g., correct the zip code) before sending it again.
    B: This is the correct approach. A `400 Bad Request` is a client-side validation error that is not retryable without modification, so `isRetryable: false` is appropriate. A `503 Service Unavailable` is a transient, server-side error, making it suitable for retries (ideally with exponential backoff), so `isRetryable: true` is correct.
    C: This reverses the correct logic. Client-side `400` errors are not retryable, while server-side `503` errors are. Implementing retries with exponential backoff for `503` errors is a standard practice to manage load, not avoiding retries altogether.
    D: This incorrectly assigns the error categories. A `400` error is a `validation` error because the client's input is invalid. A `503` error is a `transient` error because the server is temporarily unavailable.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32827)
```

```question
id: certsafari-domain-4-mcp-055
domain: domain-4-mcp
difficulty: medium
stem: |
  An automated project management agent needs to generate a daily digest of all active Jira issues. Currently, the agent uses a `search_issues` tool to get a list of issue IDs, and then calls a `get_issue_details` tool 100 times in a loop to read each issue. This frequently triggers API rate limits and takes several minutes to complete. Which MCP feature should the architect implement to resolve this?
options:
  A: "Implement an exponential backoff retry mechanism within the `get_issue_details` tool to handle the rate limits gracefully."
  B: "Expose a pre-compiled catalog of issue summaries as an MCP resource, allowing the agent to read the aggregated data in a single action."
  C: "Increase the agent's parallel execution limit in the .mcp.json file so it can execute all 100 tool calls simultaneously."
  D: "Modify the `search_issues` tool description to explicitly forbid the agent from calling `get_issue_details` more than 10 times per session."
correct: B
explanation: |
    A: While exponential backoff is a best practice for handling transient rate-limit errors, it does not address the fundamental architectural inefficiency of making 100 individual API calls. The process would remain slow and would still likely hit cumulative quota limits over time.
    B: MCP Resources are designed for reading data (like logs, files, or catalogs) rather than performing actions. By exposing a pre-compiled catalog or aggregated summary as a resource, the agent can fetch all required data in a single 'read' operation. This avoids the overhead of tool-calling loops and prevents rate-limit exhaustion by reducing the number of requests to the underlying API.
    C: Increasing parallel execution does not reduce total API usage and would likely exacerbate rate-limit issues by sending a massive burst of requests to the Jira API simultaneously. It also does not solve the underlying performance issue of the agent needing to process 100 separate tool responses.
    D: Modifying the tool description is a prompt engineering tactic that restricts the agent's functionality. This would prevent the agent from fulfilling the requirement of generating a complete digest of 'all' active issues, failing to solve the technical bottleneck.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24070)
```

```question
id: certsafari-domain-4-mcp-056
domain: domain-4-mcp
difficulty: medium
stem: |
  An agent is tasked with provisioning cloud infrastructure using an MCP tool. The tool requires a specific instance type. The agent requests an instance type that is currently out of stock in the selected region (a capacity issue that might resolve in a few hours). The tool currently returns `isError: true` with `isRetryable: false`. What is the consequence of this configuration?
options:
  A: "The agent will recognize the capacity issue and automatically switch to a different region without prompting the user."
  B: "The agent will treat the error as a permanent failure (like a validation or permission error) and will not attempt to retry the operation later, even if instructed to wait."
  C: "The agent will ignore the isRetryable: false flag because capacity issues are inherently transient, and it will retry immediately."
  D: "The MCP protocol will override the isRetryable: false flag and force the agent into an exponential backoff loop."
correct: B
explanation: |
    A: Incorrect. Returning isRetryable: false indicates a terminal state. The agent does not have inherent logic to automatically switch regions unless specifically programmed to handle that fallback; the flag itself merely signals that the current request should not be repeated.
    B: Correct. In the MCP (Model Context Protocol) framework, isRetryable: false signals to the agent that the error is non-transient (e.g., a syntax or permission error). If a transient capacity issue is mislabeled this way, the agent will treat it as a permanent failure and will not attempt a retry, even if the user or a timer suggests waiting.
    C: Incorrect. Agents are designed to adhere to the structured responses provided by tools to ensure predictable behavior. The agent will respect the isRetryable: false flag rather than attempting to infer that the underlying problem might be temporary.
    D: Incorrect. The MCP protocol does not possess autonomous logic to override tool-defined flags. Backoff or retry behavior is driven by the tool's response flags and the agent's implementation of those flags.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24276)
```

```question
id: certsafari-domain-4-mcp-057
domain: domain-4-mcp
difficulty: medium
stem: |
  An automated invoice processing pipeline uses Claude to extract line items and then categorize them using a `categorize_items` tool. The system architecture requires that Claude always calls the `extract_metadata` tool first to log the invoice ID and vendor before doing any categorization. Occasionally, Claude skips extraction and goes straight to categorization. How can the architect guarantee the correct sequence?
options:
  A: "Set `tool_choice: {\"type\": \"any\"}` on the first turn to ensure Claude picks at least one of the two tools."
  B: "Use `tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"}` on the first turn, process the result, and then allow `{\"type\": \"auto\"}` for subsequent turns."
  C: "Remove the `categorize_items` tool entirely and merge its functionality into the `extract_metadata` tool payload."
  D: "Add a system prompt instructing Claude to \"Think step-by-step: 1. Extract metadata, 2. Categorize items.\""
correct: B
explanation: |
    A: Setting `tool_choice: {"type": "any"}` forces Claude to use at least one tool from the available list, but it does not specify which one. Claude could still choose to call `categorize_items` first, which fails the architectural requirement.
    B: Using `tool_choice` with a specific tool name (e.g., `{"type": "tool", "name": "extract_metadata"}`) provides a programmatic guarantee that Claude will call that specific tool first. This is the recommended architectural pattern for enforcing sequences in tool-calling workflows. Once the metadata is extracted and the result is returned to Claude, the developer can switch back to `auto` for more flexible tool selection.
    C: Merging tools technically ensures the logic happens at once, but it is a poor design choice that violates the principle of modularity and separation of concerns. It makes tools harder to maintain, audit, and reuse, and it is unnecessary because tool-calling order can be managed via the API.
    D: System prompts provide guidance and instruction, but they do not act as a strict enforcement mechanism. Under high complexity or specific input conditions, Claude may deviate from prompt-based instructions. The Tool Choice parameter is the intended feature for strict control over model behavior.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24149)
```

```question
id: certsafari-domain-4-mcp-058
domain: domain-4-mcp
difficulty: medium
stem: |
  A customer support agent has a `translate_message` tool that only supports English, Spanish, French, German, and Japanese. When users paste text in Italian, Claude attempts to use the tool, resulting in a backend `UnsupportedLanguageError`. What is the most effective way to handle this edge case at the tool interface level?
options:
  A: "Update the tool description to explicitly list the supported languages and instruct Claude on how to handle unsupported languages."
  B: "Add a `detect_language` tool that Claude must call first, and update the system prompt to enforce this sequence."
  C: "Modify the backend to automatically fall back to a third-party translation API if the primary one fails."
  D: "Change the tool's parameter schema to use an `enum` of all world languages to prevent hallucinated language codes."
correct: A
explanation: |
    A: Correct. Providing clear boundaries in the tool's description is the most effective and efficient way to guide Claude's behavior. By explicitly listing supported languages and providing instructions on what to do if a language is not supported (e.g., 'inform the user that translation is unavailable'), you prevent the model from attempting invalid tool calls.
    B: Incorrect. While a detection tool provides an extra layer of verification, it increases latency and token costs by requiring multiple turns. It also doesn't solve the core issue of defining the translation tool's boundaries effectively.
    C: Incorrect. This is a backend architectural change rather than a tool interface design. It masks the issue rather than helping the model understand the tool's specific capabilities and limitations.
    D: Incorrect. An enum containing all world languages would actually worsen the problem, as it would signal to Claude that the tool is capable of handling any language in that list, leading to more frequent backend errors.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24119)
```

```question
id: certsafari-domain-4-mcp-059
domain: domain-4-mcp
difficulty: medium
stem: |
  A customer onboarding agent needs to greet users, answer basic questions, and eventually call a `provision_account` tool when the user explicitly agrees to the terms of service. The developer set `tool_choice: {"type": "any"}` to ensure the agent utilizes its tools. Now, the agent calls `provision_account` immediately upon greeting the user, before they agree to the terms. What is the correct configuration?
options:
  A: "Keep `tool_choice: {\"type\": \"any\"}` but add a `greet_user` tool so the agent has a harmless tool to call for greetings."
  B: "Change `tool_choice` to `{\"type\": \"auto\"}` so the agent can choose to respond with conversational text until the conditions for provisioning are met."
  C: "Change `tool_choice` to `{\"type\": \"tool\", \"name\": \"provision_account\"}` but add a system prompt requiring user consent."
  D: "Remove the `provision_account` tool and require the user to click a UI button to provision the account."
correct: B
explanation: |
    A: Keeping `tool_choice: {"type": "any"}` forces the agent to call at least one tool. While adding a harmless tool like `greet_user` provides an alternative, it does not guarantee the agent won't pick the sensitive tool prematurely. This approach is fragile as it relies on the model's stochastic selection rather than structural control.
    B: Changing `tool_choice` to `{"type": "auto"}` allows the agent to decide whether to respond with a tool call or conversational text. This configuration enables the agent to interact with the user, answer questions, and wait for explicit consent before deciding that a tool call is appropriate.
    C: Setting `tool_choice: {"type": "tool", "name": "provision_account"}` forces the agent to always call that specific tool immediately. Relying solely on a system prompt for consent is insufficient because the tool selection policy would compel the agent to invoke the provisioning tool regardless of the instruction.
    D: Removing the tool avoids the accidental invocation but eliminates the benefit of AI-driven automation. The better solution is to correctly configure tool selection policies (using `auto`) to manage the workflow rather than removing the capability entirely.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24152)
```

```question
id: certsafari-domain-4-mcp-060
domain: domain-4-mcp
difficulty: medium
stem: |
  An automated financial analysis agent uses an MCP tool to pull stock market data from a third-party API. The tool currently wraps all API exceptions—including rate limits, invalid ticker symbols, and unauthorized access—into a single uniform response: `{ "isError": true, "message": "API Request Failed" }`. What is the primary architectural risk of this design?
options:
  A: "The MCP protocol will automatically reject any error response that does not contain a stack trace, causing the agent's session to crash."
  B: "The agent will assume the tool is deprecated and permanently remove it from its available tool list for all future user sessions."
  C: "The agent will attempt to bypass the tool entirely and write its own Python code to call the API directly, violating security boundaries."
  D: "The agent cannot distinguish between a rate limit (requiring a wait and retry) and an invalid ticker (requiring user clarification), leading to wasted retry attempts or premature task failure."
correct: D
explanation: |
    A: The Model Context Protocol (MCP) does not mandate stack traces in error responses. While providing context is helpful, the absence of a stack trace will not cause a protocol-level rejection or a session crash.
    B: LLM-based agents do not have a built-in mechanism to permanently deprecate or remove tools from their system-level configuration based on a single uniform error response.
    C: While an agent might attempt to use other available tools if one fails, it cannot violate enforced security boundaries to write and execute unauthorized code for direct API access unless specifically configured to do so.
    D: The primary architectural risk of unstructured error responses is the loss of actionable context. If the agent cannot distinguish between transient errors (like rate limits that require backoff/retry) and terminal or input-driven errors (like invalid ticker symbols requiring user correction), it cannot make informed decisions about how to recover, leading to inefficient loops or unnecessary task failure.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24268)
```
