---
cert: cca-f
domain: domain-1-agentic
status: done
source: certsafari
tags: [seeded, certsafari]
---

# CertSafari Practice Questions — Domain 1: Agentic Architecture & Orchestration

29 questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.
```question
id: certsafari-domain-1-agentic-001
domain: domain-1-agentic
difficulty: medium
stem: |
  A financial agent is comparing two stocks. Claude returns a `stop_reason` of `tool_use` and includes two separate `get_stock_price` tool use blocks in the `content` array. The developer's loop extracts the first tool use, executes it, and sends back a single `tool_result`. Claude repeatedly asks for the second stock's price in subsequent turns. How should the loop be redesigned?
options:
  A: "The loop should execute the first tool, send the result, and wait for Claude to request the second tool in the next turn to maintain sequential processing."
  B: "The loop must iterate through all `tool_use` blocks, execute them, and append a single `user` message containing multiple `tool_result` blocks matching each `tool_use_id`."
  C: "The loop must execute all `tool_use` blocks and append multiple `user` messages to the history, creating one distinct message for each `tool_result`."
  D: "The developer should set the `tool_choice` parameter to `disable_parallel` to prevent Claude from returning multiple tool use blocks in a single response."
correct: B
explanation: |
    A: This approach is inefficient and incorrect for the Anthropic Messages API. If Claude requests multiple tools in a single turn, it expects the results for all of them in the next response. Forcing sequential processing leads to redundant turns and context window bloat.
    B: Correct. Claude is capable of parallel tool use. When the model returns multiple `tool_use` blocks in the `content` array, the developer must process every block and return a single `user` message containing a `tool_result` for each corresponding `tool_use_id`. This satisfies the model's requests in one turn.
    C: While sending multiple user messages might be supported by some chat interfaces, the official Anthropic SDK and API pattern is to provide all results from a single turn's tool requests within the same `user` role message. Creating distinct messages is non-standard and complicates conversation history.
    D: There is no `disable_parallel` parameter within the `tool_choice` object for the Anthropic API. Furthermore, restricting the model's ability to reason in parallel would decrease the efficiency of the agentic system.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24170)
```

```question
id: certsafari-domain-1-agentic-002
domain: domain-1-agentic
difficulty: medium
stem: |
  A developer is using an agentic tool with Claude to troubleshoot a bug in a session named `payment-bug`. After several turns of investigation, the developer modifies the file `stripe_handler.ts` locally to fix a logic error. Which action is the most efficient way to continue the session while ensuring the model is aware of the code changes?
options:
  A: "Start a completely new session, as any changes to previously analyzed files render the entire session context permanently invalid."
  B: "Run `--resume payment-bug` and immediately inform Claude that `stripe_handler.ts` has been modified, requesting a targeted re-analysis of that specific file."
  C: "Run `--resume payment-bug` and ask Claude to proceed; Claude's background file-watching tools will automatically detect the changes."
  D: "Use `fork_session` to create a new branch, which automatically forces Claude to re-read all files in the repository."
correct: B
explanation: |
    A: Starting a completely new session is inefficient as it discards the troubleshooting progress and context already established. Agentic workflows are designed to handle updates without requiring a full restart of the conversational history.
    B: Running `--resume` and explicitly notifying Claude of the specific file change is the most efficient workflow. This allows the model to retain the established context and history while specifically updating its internal state for the modified file, which aligns with best practices for targeted resumption.
    C: While some specialized environments might have file-watching, standard agentic interfaces typically require explicit instructions to re-read or re-analyze a file changed on disk. Relying on passive detection risks the model using stale data from its previous context window.
    D: The `fork_session` command is intended for creating divergent conversational branches for experimentation or 'what-if' scenarios. It does not inherently trigger a full repository re-scan or an automatic refresh of all local files.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24231)
```

```question
id: certsafari-domain-1-agentic-003
domain: domain-1-agentic
difficulty: medium
stem: |
  A marketing agent uses a `send_sms` tool connected to a third-party API. The API strictly limits requests to 10 per minute. If the agent exceeds this, the API bans the account for 24 hours. The agent sometimes generates a loop of rapid tool calls, risking a ban. How can you protect the API account using Anthropic's tool use features?
options:
  A: "Add a system prompt instruction: 'Do not call `send_sms` more than 10 times per minute. Keep track of your calls.'"
  B: "Implement a `PreToolCall` hook that checks a local token bucket rate limiter. If the limit is reached, the hook blocks the execution and returns a simulated tool result telling the model to wait."
  C: "Implement a `PostToolCall` hook that checks the API's response headers for rate limit warnings and tells the model to sleep."
  D: "Configure the orchestrator to automatically terminate the agent session if it detects more than 10 tool calls in a single turn."
correct: B
explanation: |
    A: Incorrect. While system prompts can guide the model's behavior, they are not a reliable enforcement mechanism for strict, hard limits. The model may fail to adhere to the instruction, especially in complex scenarios or loops, leaving the API account vulnerable to being banned.
    B: Correct. According to documentation, hooks can be used for enforcement to intercept AI behavior and block non-compliant actions before they occur. A `PreToolCall` hook runs before the tool is executed, making it the ideal place to implement a preventative, client-side rate limiter like a token bucket. Blocking the call and informing the model allows for graceful handling without risking the API account.
    C: Incorrect. A `PostToolCall` hook executes *after* the API call has already been made. This approach is reactive, not preventative. By the time this hook runs, the call that exceeds the rate limit may have already been sent, resulting in an immediate account ban. This method cannot prevent the ban from happening.
    D: Incorrect. This is a blunt and disruptive approach. It terminates the entire session, leading to a poor user experience and loss of context. A `PreToolCall` hook provides a much more granular and graceful solution by managing the rate of calls without ending the user's task.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32816)
```

```question
id: certsafari-domain-1-agentic-004
domain: domain-1-agentic
difficulty: medium
stem: |
  A developer is building an autonomous research agent. To determine when the agent has finished its research, the developer's code checks if the assistant's response contains the phrase 'Research complete:'. If this phrase is found, the agent's main loop terminates. What is the architectural assessment of this approach?
options:
  A: "This is a best practice, provided the system prompt strongly enforces the exact phrasing of 'Research complete:' using XML tags."
  B: "This is an anti-pattern because it relies on parsing non-deterministic natural language for control flow. The developer should instead instruct the model to call a specific tool, such as `research_complete()`, to signal task completion."
  C: "This is an anti-pattern; the developer should instead evaluate if `stop_reason` equals `end_turn` to safely and deterministically terminate the loop."
  D: "This is an anti-pattern; the developer should instead check for a specific `stop_sequence` like `</research_complete>` in the API request."
correct: B
explanation: |
    A: Incorrect. This is an anti-pattern. While strong prompting and XML tags can increase the likelihood of the model producing the desired phrase, it does not guarantee it. Relying on parsing a model's non-deterministic natural language output for critical control flow is unreliable and can lead to unpredictable behavior.
    B: Correct. This approach is an anti-pattern. According to Anthropic's best practices, critical control flow should be managed by deterministic rules, not by parsing non-deterministic model output. The recommended approach is to use Tool Use (also known as function calling), instructing the model to call a specific tool like `research_complete()` to provide a structured, reliable signal that the task is finished.
    C: Incorrect. The `stop_reason` of `end_turn` indicates that the model completed its turn of generation naturally. In a multi-step agentic workflow, research may require many turns. Terminating the loop on the first `end_turn` would prematurely stop the agent before its overall task is complete.
    D: Incorrect. While using a `stop_sequence` is more deterministic than parsing a natural language phrase, it is not the recommended architectural pattern for this use case. Tool Use is superior because it provides a structured way for the model to signal completion and can include structured data in its response (e.g., a summary or list of sources). Tool Use is the preferred method for managing agentic control flow.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32835)
```

```question
id: certsafari-domain-1-agentic-005
domain: domain-1-agentic
difficulty: medium
stem: |
  A developer is using a Claude-powered agent to assist in migrating a legacy monolithic application to a microservices architecture. The developer has already used Claude to analyze the existing repository and identify potential service boundaries. Now, the developer wants to compare two different migration paths: one focusing on AWS Lambda for serverless execution and another focusing on Amazon ECS for containerized execution. What is the most efficient architectural approach to handle this exploration using session management features?
options:
  A: "Use `fork_session` twice from the current state to create two independent branches for parallel exploration of the Lambda and ECS approaches."
  B: "Start two completely new sessions and ask Claude to re-analyze the repository from scratch in each, focusing on the respective target architectures."
  C: "Resume the current session, ask for the Lambda architecture, then use `--clear-context` and ask for the ECS architecture."
  D: "Export the current session's chat history, manually split it into two files, and import them into two new sessions."
correct: A
explanation: |
    A: Forking is the designated mechanism for session branching in agentic workflows. By forking twice from the point where the repository analysis is already complete, the developer creates two independent parallel threads. This preserves the shared context of the code analysis (saving tokens and time) while allowing distinct exploration paths for Lambda and ECS without context bleed.
    B: While starting from scratch ensures complete isolation, it is architecturally inefficient for large contexts like a code repository. This approach requires the model to re-analyze the entire codebase for each session, leading to higher token consumption and increased latency compared to leveraging existing session states through forking.
    C: Using a single session sequentially is problematic because the model's responses for the second architecture (ECS) would be influenced by the previous discussion about Lambda. Furthermore, clearing context usually removes the base repository analysis that both approaches require, forcing an inefficient restart.
    D: Manual management of chat history files is cumbersome and error-prone. It bypasses the native session management and forking capabilities designed into agentic frameworks, which are specifically meant to handle state divergence programmatically and efficiently.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24230)
```

```question
id: certsafari-domain-1-agentic-006
domain: domain-1-agentic
difficulty: medium
stem: |
  When managing an agentic session for system administration tasks, why might an architect avoid resuming a session that has been inactive for a significant period (e.g., 24 hours) using only the existing conversation history?
options:
  A: "Because Claude has a hard-coded time limit of 24 hours for any continuous session."
  B: "Because resuming with stale tool results (like outdated df -h or ls outputs) will confuse the agent and lead to incorrect diagnoses."
  C: "Because the --resume command does not support sessions that utilize external SSH tools."
  D: "Because fork_session is the only supported method for continuing multi-day administrative tasks."
correct: B
explanation: |
    A: Claude does not have a universal hard-coded 24-hour continuous session limit. Session lifetimes are typically determined by the hosting platform, API configuration, or the specific orchestration implementation rather than an intrinsic model constraint.
    B: Resuming a session with stale tool outputs (e.g., disk usage or directory listings from 24 hours ago) can mislead the agent. The environment may have changed significantly, and the model might make incorrect decisions based on artifacts that no longer reflect the current system state. Proper resumption workflows should re-run tools or validate the state to avoid acting on stale information.
    C: The ability to resume sessions using SSH tools is a function of the orchestration layer and tool integration. There is no inherent restriction in Claude or standard agentic patterns that prevents resuming such sessions, provided the state and connectivity are managed correctly by the developer.
    D: While fork_session is a valuable pattern for branching tasks or parallel exploration, it is not the only supported method for long-running tasks. Other strategies include session checkpoints, context injection, and explicitly re-validating environment state upon resumption.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24235)
```

```question
id: certsafari-domain-1-agentic-007
domain: domain-1-agentic
difficulty: medium
stem: |
  A customer support system categorizes incoming tickets into 5 distinct buckets, extracts the customer ID, and formats a JSON response. The engineering team initially implemented this using dynamic adaptive decomposition, allowing the agent to reason about how to process each ticket. However, latency and API costs are unacceptably high. What is the best architectural change?
options:
  A: "Keep the dynamic adaptive decomposition but switch to a smaller, faster model."
  B: "Switch to a fixed sequential pipeline (prompt chaining) because the task is a predictable, multi-aspect review."
  C: "Switch to a map-reduce pattern to process the ticket categorization and extraction in parallel."
  D: "Implement an adaptive investigation plan to only extract the customer ID if the ticket is marked as urgent."
correct: B
explanation: |
    A: While switching to a smaller model may reduce cost per token, it does not address the architectural overhead of dynamic adaptive decomposition. The 'reasoning loop' used in dynamic planning still requires multiple LLM calls to decide how to process the task, which is redundant for a predictable workflow.
    B: A fixed sequential pipeline (prompt chaining) is the most efficient pattern for tasks that are deterministic and follow a predictable sequence of steps (categorize -> extract -> format). By removing the planning and reasoning overhead of an agentic loop, latency and API costs are significantly reduced without sacrificing accuracy.
    C: Map-reduce is designed for parallelizing large datasets or long documents. For a single ticket involving simple categorization and extraction, the coordination and aggregation overhead of map-reduce would likely increase complexity and latency compared to a simple chain.
    D: Implementing an adaptive investigation plan adds conditional logic that complicates the system rather than simplifying it. Furthermore, skipping customer ID extraction based on urgency risks producing incomplete data for downstream processes and does not solve the root cause of the high orchestration costs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23987)
```

```question
id: certsafari-domain-1-agentic-008
domain: domain-1-agentic
difficulty: medium
stem: |
  A financial analysis system extracts quarterly earnings data using a 'DataMiner' subagent and generates a chart using a 'Grapher' subagent. When the DataMiner passes its findings back to the coordinator as a conversational summary, and the coordinator passes that summary to the Grapher, the Grapher frequently plots incorrect numbers or mislabels axes. What is the most robust architectural solution to this context passing issue?
options:
  A: "Instruct the DataMiner to output its findings as a structured CSV or JSON array, and have the coordinator pass this exact structured output in the prompt to the Grapher subagent."
  B: "Configure the Grapher subagent's AgentDefinition to use a lower temperature setting to prevent the hallucination of numbers during chart generation."
  C: "Use fork-based session management to allow the Grapher to iteratively query the DataMiner in a private thread until the chart is correct."
  D: "Add a DataValidation tool to the coordinator to check the Grapher's output against the DataMiner's summary before presenting it to the user."
correct: A
explanation: |
    A: Instructing the DataMiner to output its findings as a structured CSV or JSON array ensures that exact, machine-readable numeric and field semantics are preserved. This eliminates the ambiguity introduced by free-form conversational summaries, allowing the Grapher to process concrete values and labels directly. This is the most robust way to maintain data integrity across subagent boundaries.
    B: While lowering the temperature can reduce model sampling noise and randomness, it does not solve the underlying issue of data loss or ambiguity caused by the unstructured nature of the input text. If the source context is a vague summary, the model will still struggle to reconstruct precise data points regardless of temperature settings.
    C: Fork-based session management and iterative querying between agents introduce significant architectural complexity, latency, and tight coupling. While this might allow the Grapher to ask for clarification, it is far less efficient than simply passing a well-formatted, complete data object in the initial invocation.
    D: A DataValidation tool is a reactive measure that detects errors after they occur. While useful for quality assurance, it does not fix the root cause of the context-passing problem. A robust architecture should prioritize high-fidelity data transmission to prevent errors from occurring in the first place.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24059)
```

```question
id: certsafari-domain-1-agentic-009
domain: domain-1-agentic
difficulty: medium
stem: |
  An autonomous DevOps agent attempts to restart a server using a `restart_instance` tool. The tool execution fails because the instance ID provided by Claude is invalid. The developer wants Claude to autonomously realize the mistake, analyze the error, and try a different instance ID. How should the agentic loop handle this failure?
options:
  A: "Terminate the agentic loop, return the error to the user, and prompt the user to provide the correct instance ID manually."
  B: "Append a `tool_result` block to the conversation history containing the error message and set `is_error: true`, then continue the loop."
  C: "Delete the assistant's invalid `tool_use` message from the conversation history and resend the original prompt with a warning appended."
  D: "Modify the system prompt dynamically to include the error message and restart the entire conversation thread from the beginning."
correct: B
explanation: |
    A: Terminating the loop and requesting manual input prevents the agent from performing autonomous diagnosis or recovery. This approach forces human intervention for recoverable errors and disrupts the flow of an agentic architecture.
    B: According to Anthropic's tool-use specifications, the correct way to handle a tool failure is to append a `tool_result` block with the error message and set `is_error: true`. This provides Claude with structured context about the failure, enabling it to analyze the mistake and choose an alternative action or instance ID in the next iteration.
    C: Deleting the previous `tool_use` message removes the provenance of the failure. Without the history of the failed attempt, Claude cannot learn from the mistake and may repeat the same error. Maintaining the full conversation history is essential for iterative reasoning.
    D: Modifying the system prompt and restarting the conversation is an inefficient and heavy-handed approach. It discards useful execution history and state, making debugging harder and potentially causing the model to lose track of the original objective.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24169)
```

```question
id: certsafari-domain-1-agentic-010
domain: domain-1-agentic
difficulty: medium
stem: |
  A market intelligence platform uses a multi-agent system to research competitors. The Coordinator assigns the broad task "Research Competitor X's new product launch" to three identical Analyst subagents. The final synthesized report contains highly repetitive information, as all three subagents independently scraped the same press releases and news articles. How should the Coordinator be reconfigured to minimize this duplication?
options:
  A: "Implement a semantic deduplication script on the final output before presenting it to the user."
  B: "Partition the research scope by having the Coordinator assign distinct source types (e.g., social media, financial filings, press releases) or specific subtopics to each subagent."
  C: "Force the subagents to communicate directly with one another in real-time to coordinate which URLs they are currently visiting."
  D: "Reduce the number of Analyst subagents to one, relying on a larger context window to handle the entire research task naturally."
correct: B
explanation: |
    A: While post-processing deduplication reduces visible repetition for the end user, it fails to address the underlying inefficiency of the system. The subagents still waste computational resources and API calls performing redundant scraping and analysis.
    B: Partitioning the research scope is the most effective architectural fix. By assigning specific source types (e.g., filings vs. social media) or specific subtopics to different subagents, the Coordinator ensures complementary coverage, maximizes the use of parallel processing, and avoids the duplication of effort at the source.
    C: Introducing direct peer-to-peer communication increases system complexity, latency, and coupling. In a coordinator-subagent architecture, coordination is more robustly and simply handled by the Coordinator through structured task decomposition rather than real-time synchronization between subagents.
    D: Reducing the system to a single agent eliminates duplication but sacrifices the benefits of parallelism and specialization. Multi-agent systems are designed to scale coverage and throughput, which is better achieved through role differentiation than consolidation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24005)
```

```question
id: certsafari-domain-1-agentic-011
domain: domain-1-agentic
difficulty: medium
stem: |
  A telecommunications customer asks a support bot: 'Why is my bill so high this month, and can I upgrade to the premium plan?' To ensure low latency and high accuracy, how should the architect design the workflow for this multi-concern request?
options:
  A: "Process the request sequentially: first resolve the billing issue, then handle the upgrade, to avoid confusing the model's context window."
  B: "Prompt the main agent to use the check_bill and upgrade_plan tools in a single turn, relying on the LLM's internal parallel tool calling capabilities without shared context."
  C: "Use a router to decompose the request into 'billing' and 'upgrade' tasks, dispatch them to parallel sub-agents with shared user context, and use a synthesizer agent to merge the results."
  D: "Send the raw prompt to two separate agents simultaneously and concatenate their raw text responses with a newline character before sending to the user."
correct: C
explanation: |
    A: Sequential processing increases end-to-end latency by forcing the user to wait for each task to complete one after the other. It fails to utilize parallelization for independent concerns, leading to a suboptimal user experience.
    B: While LLMs can perform parallel tool calling, relying solely on internal coordination for complex business logic lacks deterministic orchestration and robust state management. This approach risks context contention and makes it difficult to enforce specific SLAs or policies for each distinct task.
    C: The router-orchestrator pattern is the most effective for multi-intent requests. Decomposing the prompt into specialized tasks allows for parallel execution (minimizing latency) and high domain-specific accuracy. Using shared context and a synthesizer ensures the final response is coherent, consistent, and addresses all user concerns accurately.
    D: Naive concatenation of raw text from multiple agents ignores the need for reconciliation and synthesis. This often results in redundant information, contradictory statements, or a disjointed tone, which reduces the overall accuracy and trustworthiness of the bot.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24075)
```

```question
id: certsafari-domain-1-agentic-012
domain: domain-1-agentic
difficulty: medium
stem: |
  An insurance claims bot is designed to issue payouts. The prompt states: 'Only issue payout if claim_status is APPROVED'. Despite this, it occasionally issues payouts for PENDING claims. To achieve a zero failure rate for this deterministic compliance requirement, what architectural change is required?
options:
  A: "Implement a self-correction loop where the bot double-checks its own work before finalizing the payout."
  B: "Remove the `issue_payout` tool from the LLM entirely. Instead, have the LLM call an `approve_claim` tool, and let the backend application logic deterministically trigger the payout system based on the claim status."
  C: "Rely on prompt-based guidance but switch to a more capable model like Claude 3.5 Sonnet to achieve 100% deterministic compliance."
  D: "Add a mandatory user confirmation step where the user must type 'I agree' before the bot can call the payout tool."
correct: B
explanation: |
    A: Implementing a self-correction loop keeps the decision and enforcement inside the LLM's non-deterministic behavior. While self-checking can reduce errors, it cannot guarantee a zero failure rate as the model may hallucinate that it followed the rules even when it did not.
    B: This is the 'Enforcement' or 'Hard Guardrail' pattern. By moving the sensitive action (payout) to the backend application logic, you ensure that compliance rules are executed by deterministic code rather than probabilistic model logic. The LLM acts as the orchestrator, but the authoritative system of record enforces the business rules.
    C: Upgrading to a more capable model like Claude 3.5 Sonnet improves performance and instruction following, but no LLM is 100% deterministic. Critical compliance requirements should never rely solely on model capability if a deterministic programmatic alternative exists.
    D: Adding a user confirmation step (Human-in-the-loop) adds friction and a safety layer, but it does not address the architectural flaw. Users can make mistakes or be social-engineered, and the final execution still relies on the LLM's non-deterministic decision to call the tool.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24094)
```

```question
id: certsafari-domain-1-agentic-013
domain: domain-1-agentic
difficulty: medium
stem: |
  An architect is designing an agentic system to add comprehensive unit tests to a massive, undocumented legacy codebase. The task is highly open-ended, and the dependencies between modules are unknown. What is the optimal decomposition strategy for this workflow?
options:
  A: "Implement a fixed prompt chain that iterates through the repository alphabetically, writing tests for each file."
  B: "First map the codebase structure, identify high-impact areas, and create a prioritized plan that adapts as dependencies are discovered."
  C: "Use a single prompt with the maximum context window to read all files and output all tests in one pass."
  D: "Deploy parallel agents to write tests for all files simultaneously, then use a map-reduce chain to merge them."
correct: B
explanation: |
    A: Implementing a fixed prompt chain that iterates alphabetically is brittle and ignores actual code structure or dependency relationships. This approach is rigid and fails to adapt when complex cross-file dependencies are encountered, likely leading to low-quality tests or system failure.
    B: This strategy uses a discovery-driven approach suitable for open-ended tasks with unknown dependencies. By mapping the codebase and identifying high-impact areas first, the system can prioritize critical modules and refine its strategy as it learns more about the codebase's interdependencies, allowing for efficient and accurate decomposition of a massive task.
    C: Attempting to process an entire massive codebase in a single context window is impractical due to token limits and the high risk of hallucination or detail loss. This method lacks the iterative discovery needed for undocumented code and usually results in shallow or incorrect outputs.
    D: While parallelization increases throughput, deploying agents without a prior understanding of the codebase leads to inconsistent assumptions and failure to handle integration points. A map-reduce approach alone cannot resolve the complex, unknown dependencies inherent in legacy systems without an initial coordination and mapping phase.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23980)
```

```question
id: certsafari-domain-1-agentic-014
domain: domain-1-agentic
difficulty: medium
stem: |
  A cloud infrastructure agent uses a `get_container_logs` tool. The tool often returns up to 20MB of raw JSON logs, which exceeds the model's context window and causes token limit errors. The agent only needs to analyze log lines marked as 'ERROR' or 'FATAL'. What is the most efficient way to handle this data?
options:
  A: "Update the system prompt to instruct the model to only request logs that contain 'ERROR' or 'FATAL'."
  B: "Implement a PreToolCall hook that intercepts the request and changes the tool name to `get_error_logs`."
  C: "Implement a PostToolUse hook that parses the 20MB JSON response, filters the array for entries matching 'ERROR' or 'FATAL', and returns only the filtered subset to the model."
  D: "Increase the `max_tokens` parameter in the agent's configuration to accommodate the 20MB payload."
correct: C
explanation: |
    A: Updating the system prompt influences the model's behavior but does not change the programmatic output of the tool. The `get_container_logs` tool would still return the full 20MB payload to the orchestrator, and if that payload is passed into the conversation history, it will still exceed the context window.
    B: While a PreToolCall hook can intercept and modify requests, this solution assumes a specialized `get_error_logs` tool exists and is available. It relies on tool redirection rather than addressing the core requirement of data normalization for the existing workflow.
    C: Correct. A PostToolUse hook is the standard architectural pattern for data normalization. It allows the orchestration layer to intercept the large raw response from the tool and filter or transform it before it is sent to the LLM. This significantly reduces the token count and ensures the model only receives the relevant 'ERROR' or 'FATAL' lines, staying within the context window limits.
    D: Increasing the `max_tokens` parameter generally refers to the model's output limit, not its input (context window). Furthermore, 20MB of raw logs could represent millions of tokens, which is far beyond the capacity of current model context windows and would be prohibitively expensive and slow to process.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24140)
```

```question
id: certsafari-domain-1-agentic-015
domain: domain-1-agentic
difficulty: medium
stem: |
  An automated software debugging system uses a coordinator to manage 'LogAnalyzer' and 'CodeFixer' subagents. The coordinator's system prompt contains a rigid 50-step procedural checklist for how to debug applications. The system frequently fails when encountering novel errors that do not perfectly match the checklist, as the coordinator forces subagents down incorrect paths. What is the best architectural change to improve adaptability?
options:
  A: "Break the 50-step checklist into smaller 5-step checklists and assign each to a different subagent AgentDefinition."
  B: "Redesign the coordinator's prompt to specify the overall debugging goals, success criteria, and available subagents, allowing the coordinator to adaptively determine the strategy."
  C: "Implement fork-based session management to try all 50 steps in parallel and return the first successful result to the user."
  D: "Add a ProceduralOverride tool to the coordinator's allowedTools so it can explicitly skip steps when an error is deemed novel."
correct: B
explanation: |
    A: Breaking the checklist into smaller chunks preserves the procedural, brittle architecture and fragments logic across many agents. This increases coordination complexity and coordination overhead without addressing the core issue that the system still lacks higher-level reasoning to handle novel errors.
    B: Redesigning the prompt to focus on high-level goals and success criteria (declarative) rather than rigid steps (procedural) leverages the coordinator's ability to reason. This allows the system to adapt strategies dynamically for novel errors, delegate to subagents appropriately, and evaluate progress based on outcomes rather than checklist completion.
    C: Trying all steps in parallel is computationally expensive and resource-intensive. Furthermore, it is logically flawed for debugging where steps are often sequential or interdependent, and it does not improve the system's underlying reasoning or ability to handle novel situations.
    D: Adding a ProceduralOverride tool is an ad-hoc patch that still keeps the coordinator tethered to a rigid procedural framework. It relies on heuristics to determine when to skip steps, which is error-prone and less robust than a complete shift to goal-directed planning.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24056)
```

```question
id: certsafari-domain-1-agentic-016
domain: domain-1-agentic
difficulty: medium
stem: |
  A financial advisor bot receives a multi-concern request: 'What is my current portfolio balance, and what are the tax implications of selling my Apple stock?' The architect wants to optimize for speed while ensuring accurate, holistic answers. Which approach best satisfies these requirements?
options:
  A: "Process the request sequentially using a single agent to ensure the tax calculation has access to the portfolio balance."
  B: "Decompose the request into two distinct items, investigate each in parallel using specialized sub-agents that access a shared context (user profile and holdings), and use a synthesizer agent to generate a unified resolution."
  C: "Route the entire prompt to a tax-specialized agent and rely on its internal knowledge to estimate the portfolio balance."
  D: "Reject the prompt and ask the user to submit the portfolio query and the tax query in separate sessions to maintain deterministic compliance."
correct: B
explanation: |
    A: Sequential processing through a single agent increases latency and reduces scalability. While it ensures context continuity, it fails to meet the 'optimize for speed' requirement because independent sub-tasks are serialized rather than executed concurrently.
    B: This approach utilizes the 'Parallel Sub-agents' or 'Orchestrator-Workers' pattern. Decomposing the request into distinct items allows for parallel execution to minimize latency. Utilizing a shared context ensures both sub-agents operate on authoritative data, and a synthesizer agent reconciles the outputs into a coherent, holistic response.
    C: Routing a multi-faceted request to a narrow specialized agent often leads to inaccuracies. A tax agent likely lacks authoritative access to real-time portfolio balance tools, leading to hallucinations or stale estimates, and it doesn't optimize for modularity or speed.
    D: Forcing users to split their queries manually is a poor user experience and an architectural failure. Multi-intent requests should be handled by the orchestration layer through routing or decomposition rather than being rejected.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24082)
```

```question
id: certsafari-domain-1-agentic-017
domain: domain-1-agentic
difficulty: medium
stem: |
  A financial agent is designed to analyze quarterly reports using multiple tools. The developer implements a `while` loop that terminates as soon as `response.content[0].type == "text"`, assuming that if Claude is outputting text, it has finished using tools. However, the agent frequently stops before completing the analysis. What is the correct way to resolve this?
options:
  A: "Increase the `temperature` parameter to prevent Claude from generating premature text before calling tools."
  B: "Change the loop termination condition to evaluate `stop_reason == \"end_turn\"`, as Claude often outputs 'Chain of Thought' text before a `tool_use` block in the same response."
  C: "Filter out all text blocks from the response and only append `tool_use` blocks to the conversation history to force continuous tool execution."
  D: "Instruct Claude in the system prompt to use the `yield` keyword when pausing tool execution to output text."
correct: B
explanation: |
    A: Incorrect. Temperature controls the randomness of token sampling but does not influence the structural logic of when Claude chooses to output text versus tool calls. Increasing temperature would not prevent the interleaving of text blocks with tool-use blocks.
    B: Correct. In the Anthropic Messages API, a single response can contain multiple content blocks (e.g., a text block followed by a tool_use block). The reliable way to determine if Claude is finished is by checking the `stop_reason`. If `stop_reason` is `tool_use`, the agent should process the tools and continue the loop; only when `stop_reason` is `end_turn` has the model completed its turn.
    C: Incorrect. Text blocks often contain Claude's internal reasoning (Chain of Thought). Filtering them out would break the context for subsequent turns and potentially confuse the model, while also failing to address the incorrect loop termination logic.
    D: Incorrect. Instructing an LLM to use programming keywords like `yield` to manage API flow is unreliable and not a feature of the Messages API protocol. The protocol already provides structured metadata (stop_reason) for this purpose.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24166)
```

```question
id: certsafari-domain-1-agentic-018
domain: domain-1-agentic
difficulty: medium
stem: |
  A data analysis agent is asked to 'Compare the Q3 revenue of Company A and Company B, then calculate the difference.' The agent successfully calls `get_revenue` for Company A. In the next iteration of the loop, the developer's code sends a new API request containing only the most recent `tool_result`, omitting the original user prompt. What is the architectural impact of this state management approach?
options:
  A: "Claude will successfully call `get_revenue` for Company B because the `tool_result` block inherently contains the necessary context from the previous turn."
  B: "Claude will likely fail to call `get_revenue` for Company B or calculate the difference, because it has lost the original instructions and the overarching goal of the task."
  C: "Claude will automatically query the `/v1/messages/history` endpoint to retrieve the missing user prompt before deciding on the next action."
  D: "The API will return a 400 Bad Request because every API call in an agentic loop must begin with a `system` prompt."
correct: B
explanation: |
    A: Incorrect. The `tool_result` block provides only the output of the specific tool execution (e.g., Company A's revenue). It does not encapsulate the original user instructions or the overarching task objective needed to proceed to Company B.
    B: Correct. Claude is stateless; robust agentic loops must persist the full conversation context (including user prompts, system instructions, and prior tool interactions) in each request. If only the most recent tool result is sent, Claude loses the 'overarching goal' (comparing A and B and calculating the difference) and cannot determine the next logical step.
    C: Incorrect. Claude does not automatically retrieve server-side history or call a `/v1/messages/history` endpoint. The Messages API requires the developer to manage and provide the conversation state within the request body.
    D: Incorrect. While a system prompt is highly recommended for guidance, it is not a syntactic requirement for the API. Omitting context causes a functional failure in the agent's logic, but it does not trigger a 400 Bad Request schema error.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24172)
```

```question
id: certsafari-domain-1-agentic-019
domain: domain-1-agentic
difficulty: medium
stem: |
  A global logistics agent uses three different MCP tools to query delivery statuses from regional carriers. Tool A returns timestamps in Unix epoch, Tool B uses ISO 8601, and Tool C uses DD-MM-YYYY format. The model occasionally miscalculates delivery SLAs because it misinterprets the heterogeneous date formats. As an architect, how should you resolve this issue to guarantee accurate SLA calculations?
options:
  A: "Update the system prompt with few-shot examples demonstrating how to convert Unix epoch and DD-MM-YYYY formats into ISO 8601 before calculating SLAs."
  B: "Implement a PostToolUse hook that detects the tool source, parses the specific date format into a standard ISO 8601 string, and replaces the raw output before returning the result to the model."
  C: "Implement a PreToolCall hook to inject a requested_format=\"ISO8601\" parameter into the outgoing tool arguments for all three carrier tools."
  D: "Create a separate DateConverter tool and instruct the model in the system prompt to call it every time it receives a date from the logistics tools."
correct: B
explanation: |
    A: While few-shot examples can improve model performance, they do not provide a technical guarantee. Relying on the model to perform manual data normalization is brittle, increases token usage, and is prone to reasoning errors, especially when handling multiple legacy formats.
    B: Implementing a PostToolUse hook is the architectural best practice for data normalization in agentic workflows. By intercepting the tool output and standardizing the date formats before the data reaches the model, you ensure that the model always receives consistent, high-quality data. This centralizes the logic and decouples data parsing from the LLM's reasoning.
    C: A PreToolCall hook modifies tool arguments before they are sent. However, this solution assumes that the underlying third-party MCP tools are designed to accept and process a format parameter, which is unlikely for heterogeneous regional carrier APIs. It does not solve the problem if the tool cannot change its output format.
    D: Creating an additional tool increases the complexity of the agentic loop, adds latency, and increases cost. It also relies on the model consistently deciding to call the converter tool, which introduces a point of failure if the model attempts to calculate the SLA using the raw data directly.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24133)
```

```question
id: certsafari-domain-1-agentic-020
domain: domain-1-agentic
difficulty: medium
stem: |
  A software development multi-agent system writes code based on user requirements. The Coordinator delegates code generation to a CoderAgent and then passes the output to a ReviewerAgent for evaluation. Often, the ReviewerAgent identifies critical security flaws, but the Coordinator simply outputs the flawed code along with the reviewer's warnings to the user. How should the Coordinator's logic be improved?
options:
  A: "The ReviewerAgent should be granted tool access to directly modify the code repository without Coordinator intervention."
  B: "The Coordinator should implement an iterative loop where it evaluates the ReviewerAgent's feedback, and if flaws exist, re-delegates the code and feedback back to the CoderAgent for fixing before final output."
  C: "The CoderAgent's system prompt should be updated to include a comprehensive list of all known security vulnerabilities to prevent flaws proactively."
  D: "The Coordinator should merge the CoderAgent and ReviewerAgent into a single prompt to avoid generating conflicting outputs."
correct: B
explanation: |
    A: Granting direct modification access to the ReviewerAgent bypasses the Coordinator's oversight and control, introduces significant security and auditability risks, and conflates the distinct roles of reviewer and executor. The Coordinator should remain the central point of mediation to ensure authorized and validated changes.
    B: This is the correct architectural approach. The Coordinator should implement an iterative refinement loop that evaluates feedback and re-delegates tasks until quality thresholds are met. This ensures flaws are remediated before reaching the user, preserves the separation of concerns, and leverages the specialized capabilities of each agent.
    C: While improving the CoderAgent's system prompt is a helpful proactive measure, it is insufficient to replace a feedback loop. LLMs cannot guarantee coverage of all vulnerabilities through a prompt alone; a robust orchestration pattern is required to verify outputs and handle edge cases dynamically.
    D: Merging the agents into a single prompt reduces modularity and compromises the benefits of specialization. Independent agents allow for unbiased reviews and clearer accountability. The issue lies in orchestration logic, not in agent separation; keeping them distinct provides a better 'double-check' mechanism.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24010)
```

```question
id: certsafari-domain-1-agentic-021
domain: domain-1-agentic
difficulty: medium
stem: |
  An ISP support bot must troubleshoot a connection, check for regional outages, and then schedule a technician if needed. The bot sometimes schedules a technician during a known regional outage, wasting resources. How can the architect enforce the correct workflow order?
options:
  A: "Implement a prerequisite gate in the orchestration layer that only adds the `schedule_technician` tool to the model's available tools after the `check_outage` tool returns a negative result."
  B: "Add a penalty to the model's generation if it attempts to output the `schedule_technician` tool call first."
  C: "Combine `check_outage` and `schedule_technician` into a single tool and let the LLM decide the internal execution order."
  D: "Use a prompt injection technique to remind the model of the correct order at every turn."
correct: A
explanation: |
    A: Correct. Implementing a prerequisite gate in the orchestration layer is a deterministic way to enforce workflow order. By only exposing the `schedule_technician` tool after `check_outage` has been called and returned a specific result, the orchestrator moves logic enforcement out of the model's 'soft' constraints and into the system's architecture, preventing invalid tool calls.
    B: Incorrect. Adding penalties (like logit bias) is a probabilistic approach and does not provide a hard guarantee. The model may still attempt to schedule a technician despite the penalty, especially if other parts of the context strongly suggest it.
    C: Incorrect. Combining tools into a single monolithic tool reduces observability, makes debugging harder, and still relies on the LLM (or internal code logic) to make the correct decision without the orchestrator's oversight. It does not provide the state-based enforcement needed for reliable workflows.
    D: Incorrect. Relying on prompts to remind the model of rules is a 'soft' constraint. Models can still hallucinate or skip steps when prompts are long or complex. Furthermore, 'prompt injection' is typically a security vulnerability rather than a design pattern.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24088)
```

```question
id: certsafari-domain-1-agentic-022
domain: domain-1-agentic
difficulty: medium
stem: |
  An e-commerce bot is authorized to process refunds. Occasionally, the bot calls the `process_refund` tool using hallucinated customer IDs or IDs that have not been verified in the current session. How can the architect prevent this behavior entirely?
options:
  A: "Add a system prompt instruction: 'Do not hallucinate customer IDs. Only use IDs returned by the get_customer tool.'"
  B: "Use a vector database to store valid customer IDs and use RAG to inject them into the prompt before the bot decides to refund."
  C: "Change the `process_refund` tool schema to make the `customer_id` parameter optional, allowing the backend to infer it."
  D: "Wrap the `process_refund` tool in application logic that checks for a verified customer ID in the session state, returning a programmatic error to the model if missing."
correct: D
explanation: |
    A: While system prompt instructions can guide the bot's behavior and reduce hallucinations, they are advisory constraints rather than enforceable programmatic guards. Models can still ignore or misapply instructions, meaning this does not provide an authoritative runtime guarantee.
    B: Using a vector database and RAG helps the model retrieve valid IDs, but it does not prevent the model from fabricating a value or selecting an ID that belongs to a different customer. It does not address session-level verification or provide a strict enforcement mechanism.
    C: Making the customer_id optional removes a critical safety check and forces the backend to guess or infer the identity. This increases the risk of processing refunds for the wrong user and weakens the tool's schema enforcement.
    D: The most robust architectural pattern is to wrap tool execution in application logic (a shim or middleware) that validates arguments against the current session state. By checking for a verified customer ID in the application context and returning a programmatic error to the model if the ID is missing or invalid, you ensure the refund cannot proceed unless session-level requirements are met.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24080)
```

```question
id: certsafari-domain-1-agentic-023
domain: domain-1-agentic
difficulty: medium
stem: |
  An engineering team is using Claude to review massive pull requests spanning over 50 files. They notice that while Claude catches local syntax errors, it frequently misses subtle cross-file dependency issues and suffers from attention dilution, hallucinating variable names from unrelated files. How should the architect redesign the review workflow?
options:
  A: "Split the workflow into per-file local analysis passes, followed by a separate cross-file integration pass."
  B: "Use dynamic adaptive decomposition to allow Claude to decide which files are most important to read."
  C: "Chunk the pull request into 5-file batches and run them completely independently to reduce context size."
  D: "Increase the model's temperature and use a single prompt with XML tags separating the files."
correct: A
explanation: |
    A: Correct. This is a classic decomposition strategy (Map-Reduce pattern). By splitting the task into local per-file passes, the architect reduces the context noise and attention dilution for individual file logic. The subsequent integration pass focuses specifically on the interaction between summarized symbols, allowing the model to focus on cross-file dependencies without the 'dilution' of full file contents.
    B: Incorrect. While adaptive decomposition is useful in some agentic workflows, allowing the model to decide 'which files are important' before it has fully analyzed the PR risks missing the 'subtle' dependencies mentioned in the prompt. It doesn't guarantee a comprehensive review of the entire code change.
    C: Incorrect. Running batches 'completely independently' is the fastest way to lose cross-file context. Dependencies between files in Batch 1 and Batch 2 would be entirely invisible to the model, failing the primary requirement of the redesign.
    D: Incorrect. Increasing temperature increases stochasticity (randomness), which generally increases hallucinations rather than reducing them. Furthermore, forcing all 50 files into a single prompt (even with XML tags) causes the 'attention dilution' and 'middle-of-the-context' neglect mentioned in the problem description.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23979)
```

```question
id: certsafari-domain-1-agentic-024
domain: domain-1-agentic
difficulty: medium
stem: |
  A retail banking agent processes customer fee reversals using a `reverse_fee` tool. Business rules dictate that any reversal exceeding $500 requires human manager approval. The current implementation relies on a system prompt instruction to enforce this rule, but the agent recently processed a $600 reversal autonomously. How should you redesign the architecture to strictly enforce this compliance rule?
options:
  A: "Decrease the model's temperature to 0.0 to ensure deterministic adherence to the system prompt instructions regarding the $500 limit."
  B: "Implement a PostToolUse hook that checks the API response for the reversed amount and immediately calls a `revert_transaction` tool if it exceeds $500."
  C: "Implement a PreToolCall hook on the `reverse_fee` tool that inspects the `amount` argument, blocks the execution if it exceeds 500, and returns a system message triggering the human escalation workflow."
  D: "Fine-tune the model on a dataset of 10,000 fee reversal scenarios where amounts over $500 are explicitly routed to human managers."
correct: C
explanation: |
    A: Lowering the model's temperature to 0.0 reduces randomness but does not provide a guarantee of adherence to business rules. Compliance must be enforced at the orchestration layer through deterministic hooks or guards rather than relying on the probabilistic sampling parameters of the LLM.
    B: A PostToolUse hook is reactive, meaning the unauthorized transaction has already occurred before the system attempts to revert it. This creates significant compliance, auditing, and customer-impact risks. Strict enforcement requires blocking disallowed actions before execution.
    C: A PreToolCall hook allows the orchestration layer to inspect tool arguments (like the reversal amount) before the tool is executed. This provides a deterministic, programmatic boundary that can block execution and trigger a human-in-the-loop escalation workflow, ensuring the rule is never bypassed.
    D: Fine-tuning is probabilistic and cannot guarantee 100% adherence to specific numerical constraints. Architectural controls (like SDK hooks) are the correct solution for provable, auditable enforcement of hard business rules.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24134)
```

```question
id: certsafari-domain-1-agentic-025
domain: domain-1-agentic
difficulty: medium
stem: |
  An agentic workflow involves Claude exploring a database schema via tool use to write complex SQL business logic. Halfway through the session, the underlying database schema is significantly altered. How should the architect handle the session state to ensure the highest accuracy for the remaining task?
options:
  A: "Use --resume to continue the previous session so Claude remembers the business logic, as the tool results will automatically update."
  B: "Start a new session providing a structured summary of the business goals and the new schema, because the prior tool results are now stale and misleading."
  C: "Use fork_session from the point before the SQL queries were executed to maintain the original context without the stale data."
  D: "Resume the session and instruct Claude to run a full database re-exploration script to overwrite its previous context."
correct: B
explanation: |
    A: Resuming a session preserves the exact conversation history, including previous tool outputs. These results are static and do not automatically update. Relying on this would lead to Claude using outdated and misleading information for its reasoning, as the prior schema exploration results are now incorrect.
    B: This is the best practice for handling significant environment changes. Starting a new session ensures a clean state without contamination from stale tool results. Providing a structured summary of the business goals preserves the relevant logic while introducing the new schema as the fresh source of truth, maximizing accuracy.
    C: Forking is typically used for exploring alternative reasoning paths or branching experiments. If the underlying schema has changed significantly, forking still carries the risk of including outdated context or assumptions from the original session that are no longer valid, making a clean session a more robust architectural pattern.
    D: Resuming and re-exploring is inefficient and risks context contamination. Claude would have both the old schema data and the new schema data in its context window, which can lead to confusion and reasoning errors. It is cleaner and more reliable to start a fresh session when the environment fundamentally shifts.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24229)
```

```question
id: certsafari-domain-1-agentic-026
domain: domain-1-agentic
difficulty: medium
stem: |
  A financial institution is building an automated compliance review system for standard vendor contracts. The workflow always requires extracting liability clauses, checking data privacy terms against a standard rubric, and generating a final risk score based on the extracted data. Which task decomposition strategy is most appropriate for this architecture?
options:
  A: "Dynamic adaptive decomposition, allowing the agent to determine the review order based on the contract's contents."
  B: "A fixed sequential pipeline (prompt chaining) that executes the extraction, rubric check, and scoring in a predictable order."
  C: "A single zero-shot prompt that asks the model to perform extraction, checking, and scoring simultaneously to save tokens."
  D: "Parallel independent agents that each read the document and vote on the final risk score."
correct: B
explanation: |
    A: Incorrect. Dynamic adaptive decomposition is best for complex tasks where the subtasks are not predefined. According to Anthropic's documentation, this 'Orchestrator-Workers' workflow is for when an orchestrator must dynamically determine steps. The scenario describes a fixed, predictable workflow, making a static approach more appropriate.
    B: Correct. Anthropic's official documentation recommends a fixed sequential pipeline (prompt chaining) for tasks that can be cleanly decomposed into fixed subtasks. This approach improves accuracy for each step, simplifies troubleshooting, and allows for programmatic checks or 'gates' between steps, which is critical for ensuring compliance and reliability in a financial institution's workflow.
    C: Incorrect. While a single prompt may use fewer tokens, decomposing a complex task into a chain of simpler, more focused prompts generally leads to higher accuracy and consistency. For a high-stakes compliance use case, the improved reliability and auditability of a multi-step process outweigh the benefits of token savings.
    D: Incorrect. The described workflow is inherently sequential; the rubric check depends on the output of the extraction, and the final score depends on the outputs of the first two steps. Parallel processing is not suitable because the tasks are dependent, not independent. Anthropic documentation suggests parallel workflows for tasks where multiple aspects can be processed concurrently.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28733)
```

```question
id: certsafari-domain-1-agentic-027
domain: domain-1-agentic
difficulty: medium
stem: |
  An architecture review agent is analyzing a 100-page technical specification. It must verify security compliance, performance requirements, and data model consistency. Currently, the agent is instructed to check all three domains in a single pass, but it frequently misses critical security flaws due to attention dilution. How should the architect restructure the workflow?
options:
  A: "Implement a fixed prompt chain that performs three separate sequential passes over the document, one dedicated to each specific domain."
  B: "Use dynamic decomposition to allow the agent to decide which pages are most relevant for security, performance, and data."
  C: "Compress the document using a summarization agent before performing the three-domain review."
  D: "Increase the context window size and use a more complex system prompt with strict XML formatting."
correct: A
explanation: |
    A: Correct. Implementing a fixed prompt chain with separate passes ensures that the agent focuses on one domain at a time (e.g., security), effectively eliminating attention dilution. This structured approach enhances thoroughness and recall, ensuring that every page is evaluated against a specific set of criteria without the interference of unrelated objectives.
    B: Incorrect. While dynamic decomposition can improve efficiency, it introduces a significant risk of 'selection bias.' If the agent misidentifies a section as irrelevant during the planning phase, critical security flaws in that section will be missed. For high-stakes compliance and verification tasks, exhaustive sequential review is more reliable than selective dynamic review.
    C: Incorrect. Summarization is a lossy process. Technical specifications contain nuanced details, and security vulnerabilities are often found in fine-grained implementation details that a summarization agent would likely strip away for brevity.
    D: Incorrect. Increasing the context window or the complexity of the prompt does not solve the cognitive load issue. LLMs consistently demonstrate higher accuracy when tasks are decomposed into focused sub-tasks rather than being asked to perform multiple complex analyses in a single, large-context pass.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=23984)
```

```question
id: certsafari-domain-1-agentic-028
domain: domain-1-agentic
difficulty: medium
stem: |
  A developer is building an autonomous research agent. To determine when the agent has finished its research, the developer's code checks if the assistant's response contains the phrase 'Research complete:'. If this phrase is found, the agent's main loop terminates. What is the architectural assessment of this approach?
options:
  A: "This is a best practice, provided the system prompt strongly enforces the exact phrasing of 'Research complete:' using XML tags."
  B: "This is an anti-pattern because it relies on parsing non-deterministic natural language for control flow. The developer should instead instruct the model to call a specific tool, such as `research_complete()`, to signal task completion."
  C: "This is an anti-pattern; the developer should instead evaluate if `stop_reason` equals `end_turn` to safely and deterministically terminate the loop."
  D: "This is an anti-pattern; the developer should instead check for a specific `stop_sequence` like `</research_complete>` in the API request."
correct: B
explanation: |
    A: Incorrect. Relying on parsing natural language for control flow is a known anti-pattern, as model outputs are non-deterministic. Even with strong prompting and XML tags, the model may not consistently produce the exact string, leading to a brittle and unreliable system. The architecturally sound approach is to use a deterministic mechanism.
    B: Correct. According to Anthropic's documentation and best practices, parsing natural language for control flow is unreliable. The recommended approach is to use the tool-use feature. Defining a `research_complete()` tool provides a structured, deterministic, and machine-readable signal for task completion. When the model calls this tool, the API responds with `stop_reason: "tool_use"`, which is the proper way to handle agentic control flow.
    C: Incorrect. The `stop_reason` `end_turn` indicates that the model has finished generating its content for a single API call. In a multi-step agentic loop, this would happen after every turn, causing the agent to terminate prematurely. It does not signify that the overall task is complete.
    D: Incorrect. While using a `stop_sequence` can halt text generation, it is a less robust and less explicit mechanism for agentic control flow compared to tool calling. Tool calling is the purpose-built feature for having the model signal a specific, structured action. It provides a clearer, more reliable architectural pattern for managing agent state and task completion.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32836)
```

```question
id: certsafari-domain-1-agentic-029
domain: domain-1-agentic
difficulty: medium
stem: |
  A travel booking system uses a pre-configured sequence in its code: `SearchFlights` -> `SelectCheapest` -> `BookFlight`. A user requests a flight, but adds 'Only book if it's under $500, otherwise just tell me the price.' The pre-configured sequence executes and books a $600 flight anyway. How should the architect redesign this to support the user's request?
options:
  A: "Add a `CheckPrice` tool to the pre-configured sequence between `SelectCheapest` and `BookFlight` to halt execution if the price exceeds $500."
  B: "Transition to a model-driven agentic loop where Claude evaluates the `SearchFlights` result against the user's constraints before autonomously deciding whether to call `BookFlight` or return text."
  C: "Implement an application-side `if/else` statement that parses Claude's text output for a dollar amount before allowing the pre-configured sequence to execute the booking tool."
  D: "Use the `tool_choice` parameter to force Claude to output a JSON object containing the price, then use a separate Python script to trigger the booking."
correct: B
explanation: |
    A: Adding a tool to a hardcoded sequence remains a rigid architectural approach. It fails to leverage the model's reasoning capabilities to interpret varied user constraints and requires manual updates to the code for every new type of user condition.
    B: A model-driven agentic loop allows Claude to observe the output of one tool (SearchFlights), reason about it in the context of the user's specific prompt (the $500 limit), and autonomously decide the next action. This provides the flexibility needed to handle dynamic constraints that fixed chains or DAGs cannot easily accommodate.
    C: Attempting to parse free-text output from an LLM to drive application logic is brittle and prone to failure if the model changes its phrasing. It also keeps the decision-making logic outside of the agent's context, leading to a fragmented architecture.
    D: While structured output (JSON) is useful, using external scripts to orchestrate the final tool call creates a disjointed system. This approach prevents the agent from performing self-correction or multi-step reasoning within a single conversational turn.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24160)
```
