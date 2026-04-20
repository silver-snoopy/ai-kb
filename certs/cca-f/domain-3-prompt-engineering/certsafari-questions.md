---
cert: cca-f
domain: domain-3-prompt-engineering
status: done
source: certsafari
tags: [seeded, certsafari]
---

# CertSafari Practice Questions — Domain 4: Prompt Engineering & Structured Output

72 questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.
```question
id: certsafari-domain-3-prompt-engineering-001
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A legal tech company uses Claude to review uploaded Non-Disclosure Agreements (NDAs) against a standard corporate playbook. The system currently flags every minor deviation, overwhelming the legal team with manual reviews. The architect needs to reduce the human review burden while ensuring critical risks are not missed. Which approach best achieves this?
options:
  A: "Modify the prompt to only output deviations that contain specific high-risk keywords like 'liability', 'indemnity', or 'jurisdiction'."
  B: "Add a verification pass where Claude evaluates the initial findings and self-reports a confidence score for its assessment; route low-confidence assessments and high-risk findings to the human legal team."
  C: "Instruct the original generation prompt to use a lower temperature and a top_p of 0.5 to ensure it only generates the most probable, high-confidence deviations."
  D: "Implement a multi-pass architecture where the NDA is split into individual clauses, and Claude reviews each clause in isolation to prevent attention dilution."
correct: B
explanation: |
    A: Incorrect. Relying solely on keyword-based filtering is brittle and context-blind. It will miss many semantically risky deviations that use different terminology, resulting in dangerous false negatives, and does not provide a graded triage mechanism.
    B: Correct. Adding a verification pass where the model evaluates its own findings and assigns a confidence score is a standard multi-pass architecture pattern. This enables automated triage where high-confidence/low-risk items can be auto-processed, while human reviewers focus only on high-risk findings or low-confidence assessments, effectively reducing workload without sacrificing safety.
    C: Incorrect. While lowering temperature and top_p increases the determinism of the output, it does not improve the model's ability to calibrate for risk or confidence. It does not provide a systematic triage workflow to solve the human review burden.
    D: Incorrect. Clause-by-clause review can improve accuracy by reducing context window pressure, but it doesn't solve the problem of flagging too many minor issues. In fact, it might increase the volume of flags and could cause the model to miss risks that only emerge when multiple clauses are read in context.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24183)
```

```question
id: certsafari-domain-3-prompt-engineering-002
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A healthcare company needs to extract structured patient data from 2 million historical medical records. They plan to use the Message Batches API to save costs. To minimize the risk of iterative resubmission costs due to parsing errors or hallucinations, what step should the architect mandate before processing the full dataset?
options:
  A: "Submit the entire dataset in a single batch to leverage economies of scale and minimize API overhead."
  B: "Run a representative sample set through the synchronous API to refine the prompt and validate the structured output format."
  C: "Split the 2 million records into 100 smaller batches and submit them concurrently to bypass the 24-hour processing window."
  D: "Use the lowest-cost model for the first pass and only use a more capable model for the requests that fail validation."
correct: B
explanation: |
    A: Submitting the entire dataset in a single batch without prior validation increases the risk of large-scale failures. If the prompt produces parsing errors or hallucinations across the set, the cost of reprocessing millions of records would be significant. Additionally, it may exceed API limits and makes debugging extremely difficult.
    B: This is the recommended best practice. Running a representative sample through the synchronous API allows for rapid, real-time prompt refinement and validation of the structured output (e.g., JSON schema) before committing to the 50% cost of a massive batch job. This catches errors early and prevents the need for costly iterative resubmissions across the full 2 million records.
    C: Splitting records into smaller concurrent batches might improve throughput but does nothing to address the risk of parsing errors or hallucinations. If the underlying prompt is flawed, all concurrent batches will produce invalid results, necessitating a full re-run.
    D: Using a lower-cost model initially often increases the risk of systematic errors or hallucinations that would necessitate expensive reprocessing. It is a more robust strategy to validate and refine the prompt on a sample using the target model rather than relying on a model that may not meet the necessary accuracy requirements for structured medical data.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24221)
```

```question
id: certsafari-domain-3-prompt-engineering-003
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are designing a JSON schema for an `extract_product_specs` tool. The source documents are marketing brochures that vary wildly in detail. If you make all fields required, Claude hallucinates missing values. If you make them optional, Claude sometimes skips extracting values that are actually present in the text. What is the best architectural solution?
options:
  A: "Make the fields optional in the schema, and add a system prompt explicitly instructing Claude to extract the values if they are present in the text."
  B: "Keep the fields required, but instruct Claude to output \"0\" or \"N/A\" for missing numerical values."
  C: "Use tool_choice: {\"type\": \"auto\"} so Claude can explain in text which fields are missing before calling the tool."
  D: "Create separate tools for each possible combination of fields and use tool_choice: {\"type\": \"any\"}."
correct: B
explanation: |
    A: While keeping fields optional maintains schema integrity, it relies entirely on the model's diligence. As noted in the problem description, this approach leads to omission (laziness), where the model ignores values present in the text because there is no structural requirement to include them.
    B: This is the most effective architectural solution for high-precision extraction. Making fields 'required' in the JSON schema creates a structural constraint that forces the model to address every field, effectively eliminating omission. Providing a specific placeholder (like 'N/A' or '0') for missing data gives the model a safe alternative to hallucination when the information is truly absent.
    C: Using tool_choice: 'auto' gives the model the option to bypass the tool entirely or provide a conversational preamble. It does not address the internal consistency of the JSON payload itself and introduces unnecessary latency and token usage.
    D: Creating separate tools for every combination of fields is not a scalable solution. It leads to a 'combinatorial explosion' that makes the schema difficult to maintain and consumes excessive context window space, while making it harder for the model to choose the correct tool.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24333)
```

```question
id: certsafari-domain-3-prompt-engineering-004
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An e-commerce platform processes 20,000 product reviews nightly using the Message Batches API. The backend database requires the sentiment analysis results to be updated against the exact review record. Since batch results are returned asynchronously and potentially out of order, how should the architect ensure accurate data mapping?
options:
  A: "Rely on the order of the JSONL output file, as the Batch API guarantees the output order matches the input file order."
  B: "Embed the database primary key within the prompt text and instruct Claude to output it in the response payload."
  C: "Map the database primary key to the custom_id field in the batch request and use it to correlate the responses upon completion."
  D: "Query the database using the exact text of the review to find the matching record when processing the batch results."
correct: C
explanation: |
    A: Incorrect. The Message Batches API processes requests asynchronously and does not guarantee that the order of results in the output JSONL file will match the order of the input file. Relying on file order is fragile and can lead to data corruption.
    B: Incorrect. Embedding identifiers in the prompt relies on the model correctly repeating the ID in the response. This increases token consumption, adds parsing complexity, and is prone to model hallucinations or formatting errors compared to using dedicated API metadata.
    C: Correct. The custom_id field in the Message Batches API is specifically designed for this purpose. It allows developers to provide a unique identifier (such as a database primary key) for each request, which Anthropic then includes in the response object, enabling reliable, deterministic mapping of asynchronous results back to source records.
    D: Incorrect. Querying the database by review text is inefficient and unreliable. Duplicate reviews (e.g., 'Great product!') would cause collisions, and minor normalization differences or variations in text could prevent successful lookups.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24222)
```

```question
id: certsafari-domain-3-prompt-engineering-005
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A company wants to build a robust content moderation system for user-submitted posts using the Claude API. The system must accurately classify posts against the company's specific `Usage Policy`. According to Anthropic's recommended practices, which approach is the most effective and reliable for implementing this moderation check?
options:
  A: "First, use a Claude API call to rewrite the user's post to remove potentially harmful language. Then, pass the rewritten post to a second API call for a final safety check."
  B: "Send the user's post to Claude and append the question: 'Is this post safe and compliant with our Usage Policy? Please answer only Yes or No.'"
  C: "Pass the original, unaltered user post to an independent Claude API call with a detailed prompt that defines moderation categories (e.g., `ALLOW`, `BLOCK`) and provides clear descriptions for each."
  D: "Rely solely on Claude's built-in, general safety training to refuse to process any harmful user submissions, without implementing a custom moderation prompt."
correct: C
explanation: |
    A: Incorrect. Rewriting a user's post before moderation is not a recommended practice. This could obscure the original intent of the user's submission, making it more difficult to accurately classify against a usage policy.
    B: Incorrect. While this approach might provide a basic signal, it is not the most effective or reliable method. Anthropic's documentation recommends a more structured prompt that includes explicit categories and detailed descriptions to ensure consistent and accurate classification against a specific policy.
    C: Correct. According to Anthropic's official documentation, the recommended approach is to create a detailed prompt for an independent API call. This prompt should define clear moderation categories (like `ALLOW` and `BLOCK`) with specific descriptions, and then include the unaltered user post for Claude to classify.
    D: Incorrect. While Claude models have built-in safety features based on Constitutional AI, relying solely on them is insufficient for enforcing a company's specific usage policy. Anthropic recommends a layered approach, which includes creating custom moderation filters via prompting to tailor the classification to your organization's rules.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32821)
```

```question
id: certsafari-domain-3-prompt-engineering-006
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system processes complex purchase orders where the final total is sometimes misprinted. To ensure accuracy, the architect wants to build a self-correction flow. The goal is to identify when the total amount printed on the order doesn't match the sum of its individual line items. Which schema design and prompt strategy is most robust for this purpose?
options:
  A: "Instruct the model to extract all line items, then in a separate call, ask it to extract the total. Compare the results in the application code."
  B: "Design the extraction schema to include fields for `stated_total` (the value printed on the document) and `calculated_total` (the sum of the extracted line items). The prompt should ask the model to populate both, allowing for a simple post-extraction comparison."
  C: "Use a prompt that tells the model to 'double-check your math' before returning the final total, relying on the instruction to ensure accuracy."
  D: "Extract only the line items and always calculate the total in the application code, ignoring the total printed on the document."
correct: B
explanation: |
    A: Incorrect. While this approach could work, it is not the most robust or efficient. It requires multiple API calls, which increases latency and cost, for a task that can be accomplished in a single, well-structured request.
    B: Correct. This is a highly recommended and robust validation technique. According to research, designing a schema with both `stated_total` and `calculated_total` allows for a direct, post-extraction consistency check. This is crucial because while Anthropic's structured outputs guarantee the *format*, they do not guarantee 100% accuracy, making this explicit validation step essential for production reliability.
    C: Incorrect. Relying solely on a natural language instruction like 'double-check your math' is not a robust architectural pattern. While prompt engineering is important, critical validation logic should be explicit and verifiable in the application code, not left to the model's interpretation of an instruction.
    D: Incorrect. This approach fails to meet the core requirement of the problem. The goal is to identify discrepancies between the printed total and the sum of the line items. By ignoring the printed total, the system cannot perform this comparison and cannot flag potentially misprinted documents.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32807)
```

```question
id: certsafari-domain-3-prompt-engineering-007
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An enterprise uses Claude to automatically categorize incoming customer support tickets and draft responses. They want to deploy this to production but are worried about sending incorrect responses to VIP clients. They need a calibrated review routing architecture. Which design is most appropriate?
options:
  A: "Route all VIP client tickets to human agents immediately, and let Claude handle all non-VIP tickets automatically."
  B: "Have Claude draft the response, then use a verification pass where Claude evaluates the draft against company policy, outputs a confidence score, and routes drafts below a specific threshold to human agents."
  C: "Prompt Claude to append 'Drafted by AI' to all responses so VIP clients know the response might contain errors."
  D: "Use a multi-pass architecture where Claude drafts the response, then a second Claude instance rewrites the response to be more polite, ensuring VIP standards are met."
correct: B
explanation: |
    A: While this approach is safe, it is a blunt instrument that fails to leverage Claude's capabilities for triage and efficiency. It does not constitute a 'calibrated review routing architecture' because it lacks any internal model-based evaluation or confidence-based decision logic, potentially overwhelming human agents with low-risk tasks.
    B: This is the correct approach for a calibrated review architecture. By implementing a multi-pass workflow where a verification step evaluates the initial draft against specific policies and generates a confidence score, the system can intelligently triage responses. This allows high-confidence responses to proceed while routing low-confidence or high-risk drafts to human agents for review, balancing automation with safety.
    C: Appending a disclaimer provides transparency but does not address the fundamental requirement of preventing incorrect responses or implementing a review architecture. It offers no protection against inaccuracies and lacks any routing or verification mechanism.
    D: A multi-pass approach focused solely on politeness improves tone but fails to verify factual accuracy or compliance with company policy. Without confidence scoring or a human-in-the-loop fallback for risky or low-quality scenarios, this design does not satisfy the requirements for a robust, calibrated safety system.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24190)
```

```question
id: certsafari-domain-3-prompt-engineering-008
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Claude categorizes customer support tickets into 'Urgent', 'Normal', and 'Low' priority. It inconsistently categorizes standard password reset requests as 'Urgent' instead of 'Normal'. The prompt currently defines Urgent as 'Requires immediate attention.' How can the architect fix this inconsistency?
options:
  A: "Instruct Claude to 'Never categorize password resets as Urgent.'"
  B: "Add 'Be conservative when assigning Urgent priority' to the prompt."
  C: "Define explicit criteria for each priority level, including concrete examples like 'Urgent: System outage affecting multiple users. Normal: Password reset request.'"
  D: "Ask Claude to assign a confidence score to its priority assignment and downgrade Urgent to Normal if confidence is below 95%."
correct: C
explanation: |
    A: Instructing Claude to 'Never' perform a specific action is a brittle, rule-based approach that can miss legitimate edge cases (e.g., a password reset linked to an active security breach). It fails to address the root cause of categorization ambiguity and does not provide a generalizable framework for the model to follow.
    B: This instruction is too vague and subjective. 'Be conservative' does not provide concrete boundaries or definitions, meaning the model's interpretation will remain inconsistent and subjective across different inputs.
    C: Providing explicit criteria and concrete examples is a core prompt engineering best practice. By mapping specific scenarios (e.g., system outages vs. password resets) to priority levels, you remove ambiguity, establish clear decision rules, and enable the model to apply consistent logic across all tickets.
    D: Relying on confidence scores treats the symptom rather than the root cause. Confidence calibration in LLMs can be unreliable, and using arbitrary thresholds adds unnecessary complexity without improving the model's fundamental understanding of the priority definitions.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24132)
```

```question
id: certsafari-domain-3-prompt-engineering-009
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  During a migration from Python 2 to Python 3, Claude is used to identify incompatible code. The prompt asks Claude to 'Find all Python 2 code.' Claude is flagging code that is perfectly valid in both Python 2 and 3, causing unnecessary manual rework for the developers. Which prompt adjustment will best solve this?
options:
  A: "Instruct Claude to 'Only flag code if you are 100% sure it will break in Python 3.'"
  B: "Add 'Be conservative when flagging Python 2 code' to the prompt."
  C: "Update the prompt to: 'Only flag code that uses Python 2 specific syntax that has been removed or changed in Python 3, such as print statements without parentheses. Skip code valid in both versions.'"
  D: "Ask Claude to provide a confidence score for each flagged line and filter out low-confidence findings in the application layer."
correct: C
explanation: |
    A: Instructing Claude to be '100% sure' is unrealistic and ineffective. LLMs cannot reliably assert absolute certainty and such a prompt is too restrictive, likely causing the model to miss legitimate issues or provide non-committal answers without actually defining what constitutes a valid issue.
    B: Terms like 'conservative' are subjective and vague. Without providing explicit, testable criteria or technical definitions of what to look for, the model's output will remain inconsistent and the reduction in false positives will be minimal.
    C: This is the best solution as it provides explicit criteria, actionable rules, and negative constraints (skip code valid in both versions). By focusing on specific syntax changes (e.g., print statements) rather than broad labels, Claude can more accurately distinguish between version-specific and cross-compatible code.
    D: Requesting confidence scores adds complexity to the application layer and doesn't address the root cause of the ambiguity in the prompt. Furthermore, LLM confidence estimates are often poorly calibrated and may not reliably reflect the technical accuracy of the finding.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24130)
```

```question
id: certsafari-domain-3-prompt-engineering-010
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An AI log analyzer categorizes system anomalies into 'Network', 'Database', and 'Application'. Following a recent infrastructure change, the 'Network' category is generating a massive amount of noise. The SRE team is frustrated and has stopped looking at the AI dashboard entirely. What is the most appropriate strategy to handle this?
options:
  A: "Add 'Ignore recent infrastructure changes' to the system prompt."
  B: "Instruct Claude to 'Only report Network anomalies if you are absolutely certain they are malicious.'"
  C: "Temporarily remove the 'Network' category from the prompt's allowed output categories until the criteria can be updated for the new infrastructure."
  D: "Ask Claude to assign a severity score to Network anomalies and only display Critical ones in the UI."
correct: C
explanation: |
    A: Adding vague instructions like 'ignore recent changes' is brittle and ineffective. Without explicit definitions of what constitutes a 'recent change' versus a 'real anomaly,' the model lacks the necessary criteria to make accurate distinctions, likely leading to both noise and missed critical issues.
    B: While instructing a model to only report items with high certainty can increase precision, this specific option introduces a scope error. Restricting the detection to 'malicious' anomalies ignores the original purpose of a system log analyzer, which is to detect performance and reliability issues as well as security threats.
    C: This is the most sound strategy to restore user trust and prevent alert fatigue. By removing the unreliable category from the prompt's allowed output, you immediately stop the noise while allowing the engineering team the necessary time to refine the prompt with explicit criteria that reflect the new infrastructure's behavior.
    D: Assigning severity scores is a useful post-processing step, but it does not address the root cause of the noise. If the model's baseline for what constitutes an anomaly is incorrect due to the infrastructure change, its severity assignments will likely be equally unreliable and continue to contribute to alert fatigue.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24126)
```

```question
id: certsafari-domain-3-prompt-engineering-011
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A content moderation bot for a competitive gaming forum needs to block genuine hate speech and toxicity, but allow aggressive in-game 'trash talk' and sports banter. Detailed rule-based instructions in the prompt are proving too rigid, causing Claude to block acceptable banter or fail on novel slang. How can you enable Claude to better generalize its judgment to novel patterns?
options:
  A: "Provide few-shot examples showing the reasoning behind allowing specific sports banter versus blocking actual toxicity."
  B: "Continuously update the system prompt with an exhaustive list of allowed slang terms and phrases."
  C: "Use a lower temperature setting to make the model's judgment more deterministic and strict."
  D: "Implement a keyword blocklist before sending the text to Claude to filter out obvious profanity."
correct: A
explanation: |
    A: Correct. Providing few-shot examples—especially those that include the reasoning or logic behind the classification—helps Claude understand the underlying principles and nuances of the task. This enables the model to generalize beyond rigid rules to novel slang, context, and intent that were not explicitly covered in the instructions.
    B: Incorrect. Maintaining an exhaustive list of slang is unscalable, brittle, and will inevitably lag behind emerging internet language. This approach relies on the same rigid, rule-based logic that is currently failing, rather than teaching the model to apply contextual judgment.
    C: Incorrect. Lowering the temperature makes the model's output more deterministic but does not improve its ability to understand context or linguistic nuance. It may actually worsen the issue by making the model even more rigid in its classifications.
    D: Incorrect. Keyword blocklists are context-blind and cannot distinguish between competitive 'trash talk' and genuine toxicity. This method increases false positives and fails to leverage Claude's reasoning capabilities for nuanced moderation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24089)
```

```question
id: certsafari-domain-3-prompt-engineering-012
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Claude is used to triage incoming bug reports and assign severity levels (Low, Medium, High, Critical). Currently, Claude inconsistently classifies minor UI glitches as 'High' severity. The prompt currently defines High as 'Major impact on user experience.' How should the architect modify the prompt to achieve consistent classification?
options:
  A: "Instruct Claude to 'Be conservative when assigning High severity to UI issues.'"
  B: "Ask Claude to output a confidence score for its severity assignment and downgrade High to Medium if confidence is below 90%."
  C: "Add a strict rule: 'Never classify UI glitches as High severity under any circumstances.'"
  D: "Define explicit severity criteria with concrete code and issue examples for each severity level directly in the prompt."
correct: D
explanation: |
    A: Instructing the model to 'be conservative' is subjective and lacks the concrete decision rules needed for reliable performance. It fails to provide clear, testable criteria to reduce classification errors and will not lead to consistent results across different types of bug reports.
    B: Confidence scores in LLMs are often poorly calibrated and do not necessarily correlate with factual accuracy. This approach treats the symptom rather than the root cause and adds complexity without addressing the underlying ambiguity in the severity definitions.
    C: An absolute ban is too rigid and fails to account for legitimate high-severity UI issues, such as those that block core functionality or prevent users from completing critical tasks. Effective guidance should define the conditions under which an issue becomes High rather than banning a category entirely.
    D: Providing explicit severity criteria along with concrete examples and snippets anchors the model to repeatable, objective rules. This 'few-shot' prompting technique reduces ambiguity and helps the model distinguish between edge cases, leading to significantly more consistent and accurate classifications.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24124)
```

```question
id: certsafari-domain-3-prompt-engineering-013
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A data pipeline extracts `transaction_date`, `merchant_name`, and `amount` from scanned receipts. The current implementation asks Claude to output JSON inside `<json>` tags. The pipeline frequently crashes because the output occasionally contains invalid JSON (e.g., unescaped quotes in the merchant name or missing commas). What is the most reliable architectural change to completely eliminate these syntax errors?
options:
  A: "Implement tool use (function calling) and pass the JSON schema as an input parameter."
  B: "Add a strict requirement to the system prompt to validate JSON syntax and use a lower temperature."
  C: "Use a post-processing script to sanitize unescaped quotes and missing commas before parsing."
  D: "Switch the requested output format from JSON to XML, which is less prone to syntax errors."
correct: A
explanation: |
    A: Correct. Implementing tool use (function calling) and passing a JSON schema is the Anthropic-recommended architectural pattern for enforcing structured output. This method forces the model to return arguments that the API layer validates against the provided schema, effectively eliminating syntax errors such as unescaped quotes or missing commas.
    B: Incorrect. While lowering temperature and adding strict prompt constraints can improve consistency, it remains a probabilistic approach. The model can still produce malformed JSON or ignore instructions, meaning it does not provide the deterministic enforcement required to completely eliminate errors.
    C: Incorrect. Post-processing scripts are brittle, complex to maintain, and often fail to catch all edge cases of malformed JSON. This approach attempts to patch symptoms rather than addressing the root cause at the generation stage.
    D: Incorrect. Switching to XML does not solve the problem. XML requires strict syntax (e.g., matching closing tags), and the model can produce malformed XML just as easily as malformed JSON. It adds unnecessary complexity without providing a reliable schema-enforcement mechanism.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24335)
```

```question
id: certsafari-domain-3-prompt-engineering-014
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are building a system to extract patient vitals from unstructured clinical notes. Your JSON schema requires a `blood_pressure` field. During testing, you notice that when a clinical note does not mention blood pressure, Claude hallucinates a standard value (e.g., "120/80") to satisfy the schema constraint. What is the best way to prevent this hallucination while maintaining structured output?
options:
  A: "Keep the field required, but add a system prompt instructing Claude to output \"N/A\" if the value is missing."
  B: "Change the `blood_pressure` field in the JSON schema to be optional (nullable) so Claude can omit it when the data is not present."
  C: "Set `tool_choice: {\"type\": \"auto\"}` so Claude can return a conversational response explaining that the data is missing."
  D: "Add a pre-processing step using a smaller model to check if blood pressure exists before calling the extraction tool."
correct: B
explanation: |
    A: Forcing a required field while using a system prompt to output "N/A" is brittle. If the schema expects a specific data type (like a number or nested object), a string like "N/A" will often cause validation errors. This approach conflates schema validation with prompt-level behavior rather than addressing the root cause: the schema forcing the presence of a value that may not exist.
    B: Making the field optional in the JSON schema (by removing it from the 'required' list) allows the model to omit the field entirely when the data is not present in the clinical notes. This is the most reliable way to prevent hallucination because it aligns the schema constraints with the reality of potentially missing data, removing the pressure on the model to fabricate a value.
    C: Using 'auto' tool choice allows the model to opt out of structured output entirely and return a conversational response. This violates the goal of maintaining structured output for downstream processing and does not fix the hallucination issue when the model actually decides to use the tool.
    D: Adding a pre-processing step with a smaller model introduces unnecessary latency, cost, and complexity. It adds another point of failure and does not solve the fundamental issue that the extraction schema itself is too rigid for the source material.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24327)
```

```question
id: certsafari-domain-3-prompt-engineering-015
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A medical research platform uses Claude to extract patient symptoms from clinical notes. The extraction is highly accurate but occasionally hallucinations symptoms. You want to implement a system that automatically accepts highly certain extractions but flags uncertain ones for a doctor's review. Which architecture best supports this requirement?
options:
  A: "Ask the extraction model to output a JSON boolean `is_certain: true` alongside the symptoms in the initial generation pass."
  B: "Implement a secondary verification pass where an independent Claude instance reviews the extracted symptoms against the clinical notes, outputs a confidence score, and routes low scores to a doctor."
  C: "Run the extraction prompt three times in parallel and only accept symptoms that appear in all three outputs, discarding the rest."
  D: "Increase the `top_k` parameter to ensure the model only selects from the most highly probable symptom tokens during extraction."
correct: B
explanation: |
    A: Self-reported certainty flags (e.g., `is_certain: true`) within a single pass are generally unreliable because LLMs are often poorly calibrated and may be overconfident even when hallucinating. This approach lacks the independent validation necessary for high-stakes medical use cases.
    B: A secondary verification pass using an independent model instance (multi-pass architecture) is the most robust approach. It allows the second instance to cross-check the extracted symptoms against the original source text to identify discrepancies or hallucinations. This architecture supports generating a confidence score or routing signal specifically for human-in-the-loop (HITL) review by a doctor.
    C: While consensus-based or n-of-m architectures can reduce inconsistency, they are less effective at identifying hallucinations if the model makes correlated errors across runs. Simply discarding symptoms that don't appear in all runs might also suppress valid clinical findings without providing a nuanced routing mechanism for clinician review.
    D: Adjusting sampling parameters like `top_k` controls token-level probability but does not provide a semantic verification mechanism. Furthermore, increasing `top_k` actually expands the pool of potential tokens, which can increase the likelihood of lower-probability tokens being selected and does not address the requirement for uncertainty flagging.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24187)
```

```question
id: certsafari-domain-3-prompt-engineering-016
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A legal document processing system uses Claude to extract referenced case law from legal briefs. Claude frequently confuses inline citations embedded within the text with the formal bibliography section at the end of the document, leading to duplicate and malformed extractions. Which approach will best resolve this issue?
options:
  A: "Truncate the document to remove the bibliography section entirely before prompting Claude."
  B: "Use few-shot examples demonstrating how to correctly handle and distinguish inline citations versus bibliographies."
  C: "Instruct Claude to only extract citations that are enclosed within parentheses."
  D: "Run two separate prompts—one for the main text and one for the bibliography—and merge the results programmatically."
correct: B
explanation: |
    A: Truncating the document is a destructive approach that leads to the loss of potentially valuable source information. It fails to address the underlying issue of the model's contextual understanding and may remove legitimate entries required for downstream tasks.
    B: Few-shot examples that explicitly demonstrate the distinction between inline citation formats and bibliography entries provide Claude with concrete patterns to emulate. This leverages the model's in-context learning capabilities to improve consistency and reduce confusion without discarding data or adding programmatic complexity.
    C: Restricting extraction to specific formatting like parentheses is brittle and will miss many standard legal citation forms, such as footnotes, bracketed citations, or unparenthesized references. This approach is prone to high false-negative rates and does not resolve the contextual confusion.
    D: Running separate prompts adds unnecessary architectural complexity and introduces a fragile post-processing step for merging and deduplication. It fails to address the model's comprehension directly and creates more opportunities for reconciliation errors compared to targeted few-shot prompting.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24093)
```

```question
id: certsafari-domain-3-prompt-engineering-017
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A software team built an AI coding assistant that generates unit tests. They notice that when the assistant generates a test that mocks the wrong database interface, its built-in self-correction loop almost always doubles down on the incorrect mock, adding more complex logic to make it work rather than fixing the root cause. What is the best architectural solution?
options:
  A: "Lower the temperature of the self-correction loop to prevent it from hallucinating complex logic."
  B: "Replace the self-correction loop with an independent review instance that evaluates the generated test without the original generation reasoning context."
  C: "Explicitly list all available database interfaces in the system prompt so the model can cross-reference them during self-correction."
  D: "Use a multi-pass review architecture where the assistant reviews the test file line-by-line in separate API calls."
correct: B
explanation: |
    A: Lowering the temperature may reduce randomness or creative hallucinations, but it does not address the underlying anchoring bias. A model that has already committed to a reasoning path in its context window will likely continue to follow that logic even at lower temperatures.
    B: This is the best solution. Replacing self-correction with an independent review instance removes the 'anchoring effect' and 'confirmation bias' inherent in self-correction loops. By evaluating the code without the original reasoning context, the reviewer can identify the root cause of the error rather than just patching the symptoms.
    C: While improving the system prompt with better reference data can help the initial generation, it does not solve the architectural failure of 'doubling down' once an error has occurred. The model may still justify its incorrect choice despite having the reference list.
    D: A line-by-line review increases granularity but does not fix the bias if the same instance or reasoning context is used. The problem is the lack of an independent perspective, and multiple passes by the same generator often reinforce the original error.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24189)
```

```question
id: certsafari-domain-3-prompt-engineering-018
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An architect is building a system to extract data from resumes. The validation rules are: (1) the `email` field must be a valid email format, and (2) the `years_of_experience` for a given skill must not exceed the candidate's total work history duration. What is the most efficient architectural approach for these two validation checks?
options:
  A: "Combine both checks into a single, complex retry prompt that explains all rules to the model."
  B: "Use a regular expression in the application code to validate the email format, and use a separate, semantic validation step (which may trigger a model retry) to check the experience logic."
  C: "Rely entirely on prompt engineering to instruct the model to follow both rules during the initial extraction."
  D: "Perform both validations in a post-processing step and always trigger a model retry if either one fails."
correct: B
explanation: |
    A: Combining deterministic and semantic checks into a single complex retry prompt is inefficient. It increases prompt length, latency, and cost while making it harder for the model to focus on specific errors. Mixing simple format rules with complex logic reduces the clarity of validation feedback.
    B: This is the most efficient approach because it separates deterministic validation (email format via Regular Expressions) from semantic validation (experience logic). Regular expressions are fast, free, and more reliable than LLMs for formatting. Semantic checks that require logical reasoning are better handled as a separate step, allowing the system to trigger targeted retries only when necessary, thereby minimizing model usage and cost.
    C: Relying solely on prompt engineering for structured rules like email formatting is brittle. Even with strict instructions, LLMs can hallucinate or fail to follow specific character-level patterns consistently. It is a waste of compute to use an LLM for a task that a simple regex can solve perfectly.
    D: Always triggering a model retry for any failure is inefficient. Deterministic failures (like a typo in an email) should be caught locally in code. Furthermore, retries should be conditional and specific to the failure type to avoid unnecessary latency and token consumption.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24175)
```

```question
id: certsafari-domain-3-prompt-engineering-019
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are extracting structured data (Patient ID, Diagnosis, Prescribed Medication) from varied clinical notes. Some notes do not mention a prescribed medication. In these cases, Claude inconsistently outputs 'None', omits the field from the JSON entirely, or hallucinates a common medication like 'Ibuprofen'. What is the most robust way to ensure consistent handling of these missing fields?
options:
  A: "Instruct Claude in the system prompt to always output 'N/A' for any missing fields."
  B: "Use a post-processing script to detect missing fields in the JSON and automatically insert 'None'."
  C: "Prompt Claude to only output the JSON object if all three required fields are explicitly present in the text."
  D: "Add few-shot examples showing correct extraction from documents with varied formats, specifically addressing how to handle empty/null extraction of required fields."
correct: D
explanation: |
    A: While system instructions provide a baseline for behavior, they are often insufficient on their own for complex tasks. Claude may still ignore the instruction in favor of perceived patterns or hallucinate values when the input text is ambiguous.
    B: Post-processing is a useful safety measure for schema enforcement, but it cannot correct hallucinations. If Claude provides a plausible but incorrect value (like 'Ibuprofen') when no medication was mentioned, a script will fail to detect the inconsistency.
    C: This approach is too restrictive and leads to significant data loss. In real-world clinical extraction, a record with a missing medication field is still highly valuable for its Patient ID and Diagnosis data.
    D: Few-shot prompting is the most effective way to align Claude's behavior for edge cases. By providing explicit examples of how to handle missing data (e.g., setting a field to 'None' or 'null'), you leverage Claude's pattern-following capabilities to reduce hallucinations and ensure a consistent output format across diverse inputs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24096)
```

```question
id: certsafari-domain-3-prompt-engineering-020
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A development team uses Claude to automatically review pull requests. The current prompt instructs Claude to 'Check that inline comments are accurate and flag any issues.' Developers are complaining that Claude is leaving dozens of nitpicky comments on PRs where the code comments are slightly outdated but harmless, causing review fatigue. Which prompt modification will most effectively improve precision and reduce these false positives?
options:
  A: "Add an instruction telling Claude to 'Only report high-confidence findings regarding comment accuracy.'"
  B: "Change the instruction to 'Flag comments only when the claimed behavior explicitly contradicts the actual code behavior.'"
  C: "Instruct Claude to 'Be extremely conservative and only flag comments if you are absolutely sure they will cause developer confusion.'"
  D: "Ask Claude to assign a confidence score from 1-10 for each flagged comment and filter out anything below 8 in the application logic."
correct: B
explanation: |
    A: Incorrect. Instructing Claude to report only 'high-confidence' findings is vague and lacks concrete criteria. LLMs often have difficulty calibrating confidence internally without explicit scoring rules, and this does not define what constitutes a reportable issue versus a nitpick.
    B: Correct. This modification introduces an explicit, objective criterion for flagging (explicit contradiction). By narrowing the scope from 'any issues' to 'contradicts code behavior,' the prompt significantly reduces subjective interpretation and false positives, focusing on clear discrepancies rather than stylistic or harmless outdated comments.
    C: Incorrect. Using terms like 'extremely conservative' or 'absolutely sure' introduces subjectivity and ambiguity. This often leads to inconsistent results because the model lacks a measurable rule to determine what might cause 'developer confusion,' which is a subjective outcome.
    D: Incorrect. While confidence scores can be helpful, LLM self-assessment scores are frequently uncalibrated and can be unreliable. This approach attempts to fix the noise via post-processing rather than addressing the root cause: the lack of clear, objective criteria in the prompt itself.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24121)
```

```question
id: certsafari-domain-3-prompt-engineering-021
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A large organization uses Claude for dozens of different extraction tasks, from processing HR forms to legal documents. They are building a central feedback database where user corrections are stored to generate few-shot examples for prompt improvement. The database stores the original text, the model's incorrect output, and the user's corrected output. What additional piece of metadata is most critical to include in each database entry to make this feedback loop effective at scale?
options:
  A: "The username of the person who made the correction, for auditing purposes."
  B: "The timestamp of the correction, to track improvement over time."
  C: "The specific prompt or task identifier (e.g., 'InvoiceExtractionV2'), to ensure corrections are used to build few-shot sets only for the relevant task."
  D: "The latency of the model's original response, to correlate errors with performance."
correct: C
explanation: |
    A: Incorrect. While a username is valuable for auditing, governance, and potentially seeking clarification on a correction, it is not the most critical piece of data for making the feedback loop functionally effective. The system can correctly apply a correction to improve a prompt without knowing who submitted it.
    B: Incorrect. A timestamp is useful for analytics, such as measuring the rate of corrections over time to see if prompt improvements are working. However, it is a secondary metric for analysis and does not enable the core function of the feedback loop, which is to apply the right correction to the right prompt.
    C: Correct. At scale, with dozens of distinct tasks, it is essential to associate each correction with its specific task. According to Anthropic's best practices for evaluation-driven development and context engineering, few-shot examples must be highly relevant to the task at hand. A task identifier ensures that a correction for an invoice is only used to improve the invoice extraction prompt, preventing it from incorrectly influencing an unrelated task like HR form processing.
    D: Incorrect. Latency is a performance metric that measures the speed of the model's response. While it can be useful for operational monitoring, it does not provide information about the semantic accuracy of the output. An incorrect extraction can be generated just as quickly as a correct one, so latency is not the key data point needed to improve the quality of the prompt.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32829)
```

```question
id: certsafari-domain-3-prompt-engineering-022
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system extracts the `project_deadline` from meeting transcripts. A transcript states, 'We need to have this completed by EOD next Thursday.' The system runs on Friday, October 4th. The model correctly infers the deadline as 'October 17th'. However, a validation rule requires that the extracted date must have been explicitly written in the text (e.g., 'October 17th'), not inferred from relative terms. The validation fails. What is the correct action?
options:
  A: "Retry with the error 'The date is incorrect. Please find the explicit date in the text.'"
  B: "Do not retry. Flag the extraction for manual review, noting that the deadline was specified in relative terms, which violates the validation rule."
  C: "Retry with a new prompt that includes the current date and asks the model to recalculate 'next Thursday' more accurately."
  D: "Accept the model's inferred date, as it is logically correct, and override the validation rule."
correct: B
explanation: |
    A: Retrying is ineffective in this scenario because the explicit date does not exist in the source transcript. Asking the model to 'find' something that isn't there often leads to hallucination or repeated failure, as the model cannot satisfy the validation requirement with the provided text.
    B: This is the correct architectural response. When validation fails because the source data cannot meet a specific business constraint (explicit vs. inferred) and a retry will not change the source text, the item should be flagged for manual human-in-the-loop (HITL) review. This preserves data integrity and provides a feedback loop for potential policy adjustments.
    C: Recalculating the inference with the current date may confirm the accuracy of the date (October 17th), but it fails to address the validation rule which specifically prohibits inferred dates. The issue is the source of the data, not the calculation logic.
    D: Overriding validation rules undermines the system's consistency, auditability, and reliability. If a rule is in place to ensure data is supported by verbatim text, bypassing it silently introduces risk and violates the established data extraction standards.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24176)
```

```question
id: certsafari-domain-3-prompt-engineering-023
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A legal tech startup is building a contract analysis tool. Users upload contracts through a web interface and expect a summary within 10 seconds. The startup also runs a monthly analysis on all contracts uploaded that month to generate macro-trends for an internal dashboard. Which API strategy best balances cost and user experience?
options:
  A: "Use the Batch API for user uploads and the synchronous API for the monthly analysis."
  B: "Use the synchronous API for user uploads and the Batch API for the monthly analysis."
  C: "Use the Batch API for both workloads to maximize the 50% cost savings."
  D: "Use the synchronous API for both workloads to simplify the system architecture and reduce maintenance."
correct: B
explanation: |
    A: This approach is inverted. The Batch API is designed for high-throughput, asynchronous tasks with completion windows up to 24 hours, making it unsuitable for a 10-second user expectation. Using the synchronous API for large-scale monthly analysis is unnecessarily expensive.
    B: This is the optimal strategy. Synchronous API calls provide the low-latency response required for the interactive 10-second user summary. The Message Batch API is perfect for the monthly analysis because it offers a 50% cost reduction and is specifically designed for non-time-sensitive, large-scale processing.
    C: While the Batch API provides significant cost savings, it does not guarantee the real-time response capability needed for the interactive contract summary tool. Using it for user uploads would result in an unacceptable user experience.
    D: While this simplifies the architecture, it is the least cost-effective method. It misses out on the 50% discount provided by the Batch API for the large volume of non-interactive, monthly background data, leading to higher operational costs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24224)
```

```question
id: certsafari-domain-3-prompt-engineering-024
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A DevOps team is integrating Claude into their CI/CD pipeline. They have two distinct workloads: a pre-merge code review that developers must wait for before merging pull requests, and a comprehensive weekly codebase security audit. How should the architect route these workloads to optimize for both developer experience and cost?
options:
  A: "Route both workloads to the Batch API to maximize the 50% cost savings across the engineering department."
  B: "Route the pre-merge checks to the synchronous API and the weekly audit to the Batch API."
  C: "Route the pre-merge checks to the Batch API and the weekly audit to the synchronous API."
  D: "Route both workloads to the synchronous API to ensure consistent latency and avoid pipeline bottlenecks."
correct: B
explanation: |
    A: While the Batch API provides significant cost savings (typically 50%), it introduces high latency as results can take up to 24 hours. Using it for pre-merge checks where developers are actively waiting would block the development pipeline and severely degrade the developer experience.
    B: This strategy correctly aligns workload requirements with API capabilities. The synchronous API provides the low-latency response needed for pre-merge reviews to keep developers productive. The Batch API is ideal for large-scale, non-urgent tasks like a weekly audit, offering significant cost savings and higher throughput limits for non-blocking jobs.
    C: This reverses the optimal configuration. Routing pre-merge checks to the Batch API would introduce unacceptable delays in the merge process, while using the synchronous API for a large-scale weekly audit would incur unnecessary costs and potential rate-limit contention for a task that does not require immediate results.
    D: Using the synchronous API for both workloads ensures low latency but is not cost-optimized. The weekly codebase audit is a non-time-sensitive, high-volume task that is a perfect candidate for the cost and throughput benefits of the Batch API.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24220)
```

```question
id: certsafari-domain-3-prompt-engineering-025
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A nightly batch job processes 100,000 research papers. After the batch completes, the results show that 450 requests failed with a `context_length_exceeded` error. What is the most cost-effective and architecturally sound way to handle these failures?
options:
  A: "Resubmit the entire batch of 100,000 using a model with a larger context window to ensure no failures."
  B: "Identify the failed requests using their `custom_id`, chunk the corresponding original documents, and submit a new batch with only the chunked documents."
  C: "Automatically truncate the failed documents and append them to the next night's batch job without modifying the `custom_id`."
  D: "Switch the failed requests to the synchronous API and process them sequentially using the exact same prompts."
correct: B
explanation: |
    A: Resubmitting the entire batch of 100,000 using a model with a larger context window is extremely wasteful and not cost-effective, as over 99.5% of the requests already succeeded. This approach incurs massive unnecessary costs without targeting the specific root cause of the failures.
    B: Identifying failed requests by their `custom_id` allows for targeted remediation. By chunking only the documents that exceeded the context limit and submitting a new, smaller batch, you minimize costs and ensure that the large documents are processed completely while respecting model constraints.
    C: Automatically truncating documents leads to data loss and potential quality issues in the results. Additionally, appending truncated pieces to the next night's job delays the results and risks further tracking errors if `custom_id` values are reused without differentiation.
    D: Switching to the synchronous API does not resolve the `context_length_exceeded` error, as model context limits apply to the underlying model regardless of the API endpoint used. Furthermore, synchronous processing is significantly more expensive and less efficient for handling hundreds of items compared to the Batch API.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24219)
```

```question
id: certsafari-domain-3-prompt-engineering-026
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An e-commerce routing agent powered by Claude must select between two tools: `process_return` and `escalate_to_human`. While the system prompt contains detailed instructions, Claude frequently makes incorrect tool selections when handling ambiguous customer requests, such as 'I want to return this but it arrived completely shattered and caused damage to my floor.' Which approach is the most effective way to improve Claude's tool selection for these edge cases?
options:
  A: "Add a strict negative prompt instructing Claude not to use `process_return` if the word 'damage' is present in the user's request."
  B: "Provide 2-4 targeted few-shot examples of ambiguous scenarios that explicitly show the reasoning for why one tool was chosen over plausible alternatives."
  C: "Lower the temperature parameter to 0.0 to ensure deterministic tool selection based strictly on the existing system instructions."
  D: "Implement a chain-of-thought prompt that asks Claude to list all possible tools before making a final selection, without providing examples."
correct: B
explanation: |
    A: Adding a strict negative prompt keyed to a specific word like 'damage' is brittle and inefficient. It fails to account for synonyms (e.g., 'scratched', 'ruined my carpet') and may cause false positives where a return is actually appropriate despite the mention of minor damage. It does not help the model learn the underlying decision logic.
    B: Few-shot prompting with targeted examples is the most effective method for teaching Claude how to navigate nuanced decision boundaries. Including reasoning within those examples (Chain-of-Thought within few-shot) helps the model internalize the criteria for when to escalate versus when to process a standard return in complex or ambiguous cases.
    C: Lowering the temperature to 0.0 makes the model's output deterministic but does not improve its underlying logic. If the model is already making incorrect selections based on the system prompt, it will simply continue to make those same incorrect selections with higher consistency.
    D: While asking Claude to reason through its selection can be helpful, doing so without examples (zero-shot CoT) is less effective than few-shot prompting for specific edge cases. Without demonstrations of the desired mapping between nuanced input and tool selection, the model's self-generated reasoning may still fail to reach the correct conclusion.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24077)
```

```question
id: certsafari-domain-3-prompt-engineering-027
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A contract analysis tool is designed to extract the 'governing_law_jurisdiction' from legal agreements. In a specific contract, the model correctly identifies that the jurisdiction is 'State of Delaware'. However, the tool's output schema was mistakenly configured to expect a two-letter state code (e.g., 'DE'), causing a validation failure. In this case, a retry-with-error-feedback loop is initiated. What is the likely outcome?
options:
  A: "The retry will be ineffective because the requested information ('DE') is absent from the source document, even though the concept is present."
  B: "The retry will be highly effective, as the model can easily infer 'DE' from 'State of Delaware' once it understands the format requirement from the error feedback."
  C: "The retry will fail because models are incapable of format conversion."
  D: "The retry will succeed, but only if few-shot examples of state-to-abbreviation conversions are also provided in the retry prompt."
correct: B
explanation: |
    A: Incorrect. Although the literal string 'DE' may not appear in the source, the model can perform straightforward normalization by mapping 'State of Delaware' to 'DE'. A retry that communicates the expected format will succeed because the absence of the exact token in the text does not stop the model from transforming the concept.
    B: Correct. A retry-with-error-feedback loop that identifies the validation failure and specifies the required format (e.g., 'return the two-letter state code') allows the model to apply its internal reasoning to convert 'State of Delaware' to 'DE'. This makes retries highly effective for normalization and schema-alignment tasks.
    C: Incorrect. Models are highly capable of format conversion and normalization tasks, such as standardizing dates, unit conversions, and abbreviations. This is a core strength of LLMs when guided by schema requirements.
    D: Incorrect. While few-shot examples can improve reliability in complex or ambiguous extraction scenarios, they are not strictly necessary for common transformations like US state abbreviations. A clear natural language instruction in the error feedback is typically sufficient.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24168)
```

```question
id: certsafari-domain-3-prompt-engineering-028
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system analyzes scientific papers to extract experimental parameters. A paper's 'Methods' section states a temperature of '37 C', while the 'Results' section abstractly refers to the experiment being conducted at 'ambient room temperature'. The system needs to capture this potential inconsistency. What is the best schema design to handle this?
options:
  A: "Extract a single `temperature` field and instruct the model to choose the more specific value."
  B: "Design the schema with `methods_temperature`, `results_temperature`, and a boolean `conflict_detected`. Prompt the model to extract both values and set the flag to `true` if they represent different temperatures."
  C: "Initiate a retry loop if two different temperatures are found, forcing the model to decide on a single canonical value."
  D: "Ignore the 'Results' section temperature, as the 'Methods' section is always the authoritative source."
correct: B
explanation: |
    A: Extracting a single temperature field collapses the data, losing provenance and hiding inconsistencies between sections. This prevents downstream consumers or human reviewers from understanding the conflict and makes the model's choice of the 'more specific' value arbitrary.
    B: This schema design preserves the distinct values from each section while explicitly flagging conflicts. Storing section-specific values with a machine-actionable conflict flag supports automated checks, principled reconciliation, and human review without losing information from either source.
    C: Forcing the model to decide on a single value through retries risks losing information and can cause the model to hallucinate a resolution. Retries are appropriate for low-confidence or parsing errors, but not for reconciling conflicting, provenance-bearing statements present in the source text.
    D: Ignoring specific sections assumes a hierarchy of authority that may not always be true. This approach loses potentially relevant data and encodes a brittle heuristic, preventing the detection of real discrepancies that require follow-up.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24171)
```

```question
id: certsafari-domain-3-prompt-engineering-029
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An AI agent categorizes financial transactions for a budgeting app. It struggles with ambiguous purchases, such as transactions at 'Target', which could be categorized as 'Groceries', 'Electronics', or 'Home Goods' depending on the surrounding context of the user's spending habits. How can you best improve the agent's accuracy in these ambiguous scenarios?
options:
  A: "Create 2-4 targeted few-shot examples for ambiguous scenarios that show the reasoning for why one category was chosen over plausible alternatives."
  B: "Instruct Claude to route all ambiguous transactions to a 'Miscellaneous' category for manual review."
  C: "Use a chain-of-thought prompt asking Claude to list all possible categories before making a final decision, without providing examples."
  D: "Implement a rule-based system outside of Claude to prioritize 'Groceries' for any transaction containing the word 'Target'."
correct: A
explanation: |
    A: Correct. Few-shot examples that include the reasoning process provide the model with concrete patterns and teach it which contextual cues (such as transaction amount or history) matter most. This leverages Claude's ability to learn from specific instances to resolve ambiguity without needing hundreds of training examples.
    B: Incorrect. While routing to a 'Miscellaneous' category avoids incorrect labels, it does not improve the model's accuracy or intelligence. It increases manual review workload and reduces the overall value of the automation.
    C: Incorrect. While Chain-of-Thought (CoT) can help the model reason, providing it without few-shot examples lacks the specific guidance or 'ground truth' logic needed to resolve industry-specific or user-specific ambiguities consistently.
    D: Incorrect. A rule-based system is too brittle for stores like Target that sell a wide variety of goods. This approach ignores the context of the specific purchase and user habits, leading to systematic misclassification of non-grocery items.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24095)
```

```question
id: certsafari-domain-3-prompt-engineering-030
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An architect is designing a system using Claude's tool use feature to extract data from financial statements into a JSON object with a strict schema. The schema requires `fiscal_year` to be an integer and `total_revenue` to be a positive number. A separate business rule, not enforceable by the schema, dictates that `net_income` cannot exceed `total_revenue`. Which statement best describes the validation strategy required?
options:
  A: "The tool use feature will handle all validation, as it can be configured with complex business rules like 'net_income <= total_revenue'."
  B: "The primary validation challenge is preventing schema syntax errors, such as the model returning '2023' as a string instead of an integer for `fiscal_year`."
  C: "The system needs a two-layered approach: rely on tool use to enforce schema syntax (e.g., data types), and implement a separate application-level check for semantic errors (the business rule comparing `net_income` and `total_revenue`)."
  D: "A retry-with-error-feedback loop is the best way to handle both schema syntax errors and semantic business rule violations."
correct: C
explanation: |
    A: Incorrect. While tool use leverages JSON schemas to guide the model's output, standard JSON schemas used in tool definitions cannot inherently enforce complex cross-field business logic or semantic relationships like 'net income must be less than or equal to total revenue'.
    B: Incorrect. While ensuring data types match the schema is an important technical baseline, it is not the 'primary' challenge in a business context. The question explicitly introduces a semantic rule that cannot be captured by the schema, making semantic validation a critical architectural requirement.
    C: Correct. A robust architecture for LLM-based extraction involves a tiered validation strategy. The first layer uses the tool's JSON schema to ensure structural and type integrity (syntactic validation). The second layer occurs at the application level to enforce business logic (semantic validation) that the schema cannot express.
    D: Incorrect. A retry-with-error-feedback loop is a mechanism for error recovery and correction, but it is not the validation strategy itself. You must first have the tiered validation checks (described in option C) to identify the errors before a feedback loop can be triggered.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24162)
```

```question
id: certsafari-domain-3-prompt-engineering-031
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A data engineering team uses Claude to generate complex SQL migration scripts. To ensure quality, they append `<instructions>Now review the script you just wrote for syntax errors and missing indexes.</instructions>` to the end of the generation prompt. However, the model frequently approves scripts that contain subtle syntax errors. As an AI architect, how should you redesign this workflow to catch these subtle issues?
options:
  A: "Increase the temperature parameter during the generation phase to encourage more creative error discovery during the self-review phase."
  B: "Implement a separate API call using a new Claude instance that only receives the generated SQL script and the review instructions, omitting the generation reasoning context."
  C: "Use the `extended_thinking` parameter in the original prompt to force the model to spend more tokens on the self-review step before outputting the final script."
  D: "Add a `<scratchpad>` before the review instructions so the model can explicitly write out its self-critique before outputting the final approval."
correct: B
explanation: |
    A: Increasing the temperature parameter makes the model's outputs more random and creative, which is counterproductive for finding subtle, deterministic syntax errors. Higher temperature reduces repeatability and can produce plausible-sounding but incorrect fixes rather than reliably catching mistakes.
    B: Implementing a separate API call to a fresh Claude instance (a multi-pass architecture) ensures that the review process is isolated from the generation context. This independent verifier avoids anchoring or self-approval bias that occurs when a model reviews its own output in the same session, leading to significantly higher accuracy in error detection.
    C: While the `extended_thinking` parameter helps with complex reasoning, performing the review in the same generation call still ties the audit to the original output. This often results in confirmation bias where the model rationalizes its previous output rather than objectively identifying flaws.
    D: Adding a scratchpad or chain-of-thought for self-critique can improve reasoning to some degree, but it does not address the core issue of context coupling. The model remains biased by its own recently generated tokens; isolation via a separate instance is the architecturally preferred method for high-stakes verification.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24181)
```

```question
id: certsafari-domain-3-prompt-engineering-032
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are designing an automated vulnerability patching system. The system must generate a patch, ensure the patch doesn't break existing functionality, and decide whether to auto-merge the patch or request human approval. Which architecture best utilizes Anthropic's recommended patterns for this workflow?
options:
  A: "A single prompt that generates the patch, self-reviews it for breaking changes, and outputs a boolean auto_merge flag based on its internal confidence."
  B: "Instance A generates the patch. Instance B (independent) reviews the patch for breaking changes. Instance C performs a verification pass on Instance B's findings, outputting a confidence score to route to auto-merge or human review."
  C: "Instance A generates the patch. The patch is split into individual lines. Instance B reviews each line in a separate multi-pass loop. The results are concatenated and sent to a human."
  D: "Instance A generates the patch and self-reviews it using extended thinking. If extended thinking takes more than 10 seconds, it is routed to a human; otherwise, it is auto-merged."
correct: B
explanation: |
    A: This approach centralizes all tasks in a single prompt, which lacks the independent verification recommended for high-stakes tasks. When one instance judges its own work, it is prone to correlated failures, as the same model instance is unlikely to identify its own logic errors.
    B: This architecture follows the recommended multi-instance and multi-pass review pattern. Decoupling generation, review, and verification across independent instances reduces correlated errors. The final verification pass provides a structured confidence score that enables safe routing for automation versus human review.
    C: Reviewing a patch line-by-line causes a loss of integration and semantic context, which is critical for detecting functional regressions. Additionally, this approach lacks a structured verification pass and doesn't leverage confidence scoring for automated routing.
    D: Using time-based heuristics or thinking duration as a proxy for reliability is brittle and inaccurate. This design still relies on self-review rather than independent verification and fails to provide an auditable signal to determine if a patch is truly safe.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24192)
```

```question
id: certsafari-domain-3-prompt-engineering-033
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A financial analytics firm is migrating a complex data extraction pipeline to Claude. The pipeline requires Claude to analyze a document, use a `calculate_risk` tool to compute a score based on the extracted data, and then output a final JSON report. The firm wants to use the Batch API for their nightly runs to save 50% on costs. What architectural change is required?
options:
  A: "The pipeline must be split: use the Batch API for extraction, run the calculation locally, and use a second Batch API request for the final report."
  B: "The tool definition must be updated to include `batch_mode: true` in the JSON schema to allow asynchronous execution."
  C: "The `calculate_risk` tool must be hosted on a publicly accessible endpoint so the Batch API can call it directly."
  D: "The pipeline can remain unchanged, as the Batch API natively supports multi-turn tool calling within a single request."
correct: A
explanation: |
    A: Correct. Currently, the Anthropic Messages Batch API does not support tool use or the `tools` parameter. To adapt a tool-based workflow for the Batch API, the process must be decomposed into discrete steps that do not require tool calling. The architect must extract the data in one batch, perform the logic (the calculation) in the application layer, and then use another batch request for any subsequent LLM tasks.
    B: Incorrect. There is no `batch_mode: true` parameter in the Anthropic API or tool definition schema. The Batch API documentation explicitly states that tool use is not supported.
    C: Incorrect. While external tools are often hosted on endpoints, the Batch API does not support the tool use orchestration needed to call them, regardless of their accessibility.
    D: Incorrect. The Batch API is designed for high-throughput processing of independent, single-turn messages. It does not support multi-turn tool calling or the interactive loop required for a model to request a tool and receive a response within a single batch job.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24228)
```

```question
id: certsafari-domain-3-prompt-engineering-034
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You have successfully implemented tool use with a strict JSON schema for extracting data from complex purchase orders. JSON syntax errors have dropped to zero. However, you notice that Claude sometimes extracts the `subtotal` value into the `tax_amount` field when the purchase order layout is highly unusual. Which statement best explains this behavior and how to fix it?
options:
  A: "Strict JSON schemas eliminate syntax errors but do not prevent semantic errors; you must add explicit definitions and layout hints in the system prompt."
  B: "The JSON schema is not strict enough; you must enforce strict type checking on the tax_amount field to prevent subtotal values from being accepted."
  C: "The tool_choice parameter is likely set to \"auto\"; switching to \"any\" will force Claude to map the fields correctly."
  D: "The tax_amount field is likely marked as required; making it optional will prevent Claude from mapping the wrong value to it."
correct: A
explanation: |
    A: Correct. Strict JSON schemas (and tool use enforcement) ensure that the output follows the correct format and data types (syntax), but they do not ensure that the model correctly interprets the context of the input (semantics). Adding descriptive field definitions within the JSON schema and providing layout-specific guidance or few-shot examples in the system prompt helps the model disambiguate similar data points in complex or unusual layouts.
    B: Incorrect. Strict type checking ensures a value is, for example, a 'number' rather than a 'string'. Since both subtotal and tax_amount are likely numeric, type checking will not prevent the model from swapping one for the other.
    C: Incorrect. The tool_choice parameter (auto, any, or tool) controls whether the model is forced to use a tool, but it has no impact on the accuracy of the data extraction within the tool's parameters.
    D: Incorrect. Making a field optional might allow the model to omit the field if it is confused, but it does not address the root cause of semantic mismapping. If the model believes the subtotal is the tax_amount, it will still populate the field regardless of whether it is required or optional.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24332)
```

```question
id: certsafari-domain-3-prompt-engineering-035
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A financial firm receives a continuous stream of transaction logs. Regulatory compliance dictates a strict 30-hour SLA for generating fraud analysis reports from the exact time a log is generated. Given that the Message Batches API has up to a 24-hour processing window, what is the most efficient batch submission strategy that guarantees compliance while maximizing batch sizes?
options:
  A: "Submit a new batch every 24 hours."
  B: "Submit a new batch every 6 hours."
  C: "Submit a new batch every 12 hours."
  D: "Submit a new batch every 30 hours."
correct: B
explanation: |
    A: Incorrect. Submitting a new batch every 24 hours means a log generated immediately after a submission could wait up to 24 hours before being sent. Combined with the 24-hour processing window, the total latency could be up to 48 hours, which fails the 30-hour SLA.
    B: Correct. To meet a 30-hour SLA where processing takes up to 24 hours, the submission interval (waiting time) must be no more than 6 hours (30 - 24 = 6). This strategy ensures the maximum time a log waits before processing is 6 hours, guaranteeing compliance while maximizing the number of logs per batch compared to more frequent intervals.
    C: Incorrect. Submitting every 12 hours results in a maximum wait time of 12 hours. When added to the up-to-24-hour processing window, the total time could reach 36 hours, violating the 30-hour SLA.
    D: Incorrect. Submitting every 30 hours is non-compliant. Some logs would be submitted after the 30-hour SLA has already elapsed. With the additional 24-hour processing window, total latency could reach 54 hours.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24217)
```

```question
id: certsafari-domain-3-prompt-engineering-036
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A sentiment analysis pipeline processes product reviews using a tool with a `sentiment` enum field restricted to `["positive", "negative", "neutral"]`. For highly sarcastic or contradictory reviews, Claude struggles to classify the text and randomly selects "positive" or "negative", which skews your analytics. How should you adjust your schema design to handle this?
options:
  A: "Add `\"unclear\"` to the `sentiment` enum values and instruct Claude to use it for ambiguous or highly sarcastic text."
  B: "Change the schema to output a float between -1.0 and 1.0 to capture the nuance of sarcasm."
  C: "Force Claude to output a chain-of-thought reasoning field before the sentiment field to improve its final classification."
  D: "Use `tool_choice: {\"type\": \"auto\"}` so Claude can refuse to answer when the sentiment is too difficult to determine."
correct: A
explanation: |
    A: Adding an explicit enum value such as 'unclear', 'mixed', or 'ambiguous' provides the model with a 'safe' structured option to use when text doesn't fit the standard categories. This reduces the frequency of forced random guesses, which protects the integrity of the analytics and allows for easy filtering of data points that may require manual review.
    B: Switching to a continuous float (e.g., -1.0 to 1.0) can express intensity but does not solve the classification logic problem for sarcasm. Models may still map sarcastic text to extreme values arbitrarily, and continuous values are significantly harder to interpret and threshold for categorical analytics compared to a discrete 'unclear' category.
    C: While adding a reasoning or explanation field (often called 'thinking' or 'rationale') can improve the model's internal logic and final accuracy, it does not resolve the structural issue of how to represent ambiguous or sarcastic sentiment in the output schema without forcing it into one of the existing incorrect buckets.
    D: Setting tool_choice to 'auto' is the default behavior and does not provide a reliable mechanism for handling ambiguity. If Claude 'refuses' to answer by returning a text response instead of a tool call, it often breaks automated processing pipelines that expect structured JSON tool results.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24331)
```

```question
id: certsafari-domain-3-prompt-engineering-037
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are building an automated code review assistant using a Claude model. The assistant is instructed to output a JSON object containing exactly four fields for every vulnerability found: `location`, `issue`, `severity`, and `suggested_fix`. Despite detailed schema definitions in the prompt, the model occasionally merges the `location` and `issue` fields or omits the `severity` field entirely. What is the most reliable method to enforce this specific output format for programmatic use?
options:
  A: "Include few-shot examples in the prompt that demonstrate the specific desired output format with all four fields correctly populated."
  B: "Increase the `max_tokens` parameter to ensure Claude has enough space to generate the complete JSON structure."
  C: "Add an instruction to the system prompt stating: 'CRITICAL: You will be penalized if you do not include location, issue, severity, and suggested_fix.'"
  D: "Define a tool with an input schema matching the four required fields (`location`, `issue`, `severity`, `suggested_fix`) and force the model to call this tool."
correct: D
explanation: |
    A: Incorrect. While including few-shot examples is a valid and recommended prompt engineering technique to guide the model, it does not guarantee the output structure. The model can still occasionally deviate, making this method less reliable for programmatic use than more deterministic approaches like Tool Use.
    B: Incorrect. The `max_tokens` parameter controls the maximum length of the model's output. The problem described is a failure to adhere to a specific format, not a truncation of the output due to length constraints. Increasing `max_tokens` will not solve the structural inconsistency.
    C: Incorrect. While clear instructions are important, phrasing them as a threat or penalty is a less effective form of prompt engineering. Models respond more reliably to structural constraints and concrete examples rather than abstract negative reinforcement.
    D: Correct. According to Anthropic's documentation, using Tool Use is a highly recommended and reliable method for ensuring consistent structured output. By defining a tool with a specific input schema and forcing the model to use it, you constrain the output to a predictable JSON object that strictly adheres to the defined fields, making it the most reliable option for this programmatic use case.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32441)
```

```question
id: certsafari-domain-3-prompt-engineering-038
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A financial auditing application feeds a 200-page annual report into Claude to identify discrepancies between the 'Management Discussion' section and the 'Financial Footnotes' section. Claude successfully identifies major thematic differences but consistently misses specific numerical contradictions. How should the architect redesign the system to catch these numerical issues?
options:
  A: "Implement a multi-pass review extracting relevant numerical claims locally from each section first, then comparing them in a separate cross-reference integration pass."
  B: "The context window is exceeded, causing Claude to silently truncate the middle of the document; the document must be summarized before processing."
  C: "The prompt lacks a system message instructing Claude to act as an expert financial auditor, which lowers the baseline accuracy of numerical comparisons."
  D: "The application should use a separate Claude instance to generate the Financial Footnotes from scratch and compare them against the original document."
correct: A
explanation: |
    A: Correct. Implementing a multi-pass review allows for focused extraction and comparison. By extracting numerical claims locally from each section first, the model can focus its attention on specific data points without being overwhelmed by the total document length. A subsequent integration pass then performs a structured, deterministic cross-reference, which is significantly more reliable for detecting contradictions than a single end-to-end pass over a 200-page context.
    B: Incorrect. While context window management is a valid concern, the scenario states Claude is successfully identifying thematic differences, suggesting the sections are being read. Summarizing the document before processing is counter-productive for an audit, as the summarization process itself often strips away the precise numerical details needed to find contradictions.
    C: Incorrect. Adding a system message to frame the model as an expert auditor can improve the tone and general focus, but it does not address the underlying procedural limitation of processing dense numerical data across a massive context. This is an architectural issue related to attention and data extraction rather than a persona framing issue.
    D: Incorrect. Generating financial footnotes from scratch would produce synthetic data that may hallucinate or diverge from the original source. A reliable audit must be based on deterministic extraction from the authoritative document, not on content regenerated by the LLM, which would make the comparison meaningless.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24185)
```

```question
id: certsafari-domain-3-prompt-engineering-039
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system is designed to extract the 'shipper_reference_id' from bills of lading. After several failed attempts and retries on a specific document, the model consistently returns `null` for this field. A manual review of the document confirms that the shipper reference ID is not present anywhere in the provided text; it was only mentioned in the email that the document was attached to. What is the most appropriate system action in this scenario?
options:
  A: "Continue the retry loop with more aggressive prompts, such as 'The shipper_reference_id MUST be in the document. Find it.'"
  B: "Log the failure, halt the retry loop for this document, and flag it for manual review with a reason of 'Required information not present in source document.'"
  C: "Switch to a more advanced model and attempt the extraction again, as it may be able to infer the missing information."
  D: "Modify the prompt to ask the model to search the document's metadata for the missing ID."
correct: B
explanation: |
    A: Continuing the retry loop with aggressive prompts that insist a field exists when it does not is a primary driver of model hallucinations. It wastes computational resources and will not yield valid results if the source data is missing.
    B: This is the most robust approach for an automated pipeline. Logging the specific failure and halting the retry loop prevents wasted tokens and hallucinations. Flagging for manual review allows a human to reconcile the missing data (e.g., by checking the associated email body) and provides an audit trail for data quality issues.
    C: Switching to a more advanced model will not solve the issue because no model can extract information that is not present in its input context. This would likely increase costs and might even result in more 'confident' hallucinations as the model tries to infer non-existent data.
    D: Modifying the prompt to search metadata is only useful if metadata was actually provided to the model and contains the ID. In this scenario, the information was specifically stated to be in the email body, not the document itself, making this action ineffective.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24158)
```

```question
id: certsafari-domain-3-prompt-engineering-040
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A company is migrating a monolithic application to microservices. They use Claude to analyze the 50-file monolith and propose service boundaries. When analyzing all 50 files in one prompt, Claude's proposed boundaries are superficial and miss deep coupling between distant files. How should the architect redesign the analysis process?
options:
  A: "Wait for a model with a larger context window to perform this analysis effectively in a single pass."
  B: "Split the task into per-file local analysis passes to extract dependencies and domain entities, followed by a cross-file integration pass that analyzes the extracted data to propose service boundaries."
  C: "Use an independent review instance to critique the superficial boundaries, which will force the original instance to look deeper into the code."
  D: "Increase the max_tokens parameter to allow Claude to write a longer, more detailed analysis of the 50 files."
correct: B
explanation: |
    A: Relying on a future model with a larger context window is a passive approach that does not address the current need for structural analysis. Even with larger windows, models can suffer from 'lost in the middle' effects or attention dilution when processing massive inputs. Good architecture utilizes multi-pass strategies that work within existing model constraints.
    B: This is the ideal multi-pass approach for complex codebase analysis. By decomposing the task into local extraction passes followed by a global integration pass, the model can focus its attention on specific dependencies and domain entities. This structured intermediate data then allows the integration pass to identify deep, distributed couplings that are often overlooked in a single-pass holistic analysis.
    C: While a multi-instance review (critic/refiner pattern) is valuable for quality control, it is insufficient if the model cannot effectively digest the volume of raw data in a single pass. Without first decomposing and structuring the dependency data, the critic instance would likely repeat the same superficial mistakes as the original instance.
    D: Increasing the max_tokens parameter only increases the potential length of the model's response; it does not expand the model's input context or fundamentally improve its ability to reason across many files. The problem is related to the depth of analysis and data processing architecture, not the output length.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24191)
```

```question
id: certsafari-domain-3-prompt-engineering-041
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A data pipeline submits a batch of 50,000 requests. Upon completion, the system detects that 1,200 requests failed due to transient server errors. What is the most efficient recovery strategy?
options:
  A: "Parse the output file, extract the custom_id of the 1,200 failed requests, and submit a new batch containing only those requests."
  B: "Resubmit the original batch file; the API will automatically skip the 48,800 successful requests based on their custom_id."
  C: "Write a script to process the 1,200 failed requests through the synchronous API immediately to avoid another 24-hour wait."
  D: "Discard the failed requests, as a 2.4% error rate is generally acceptable for latency-tolerant batch processing workloads."
correct: A
explanation: |
    A: Correct. This is the standard and most efficient recovery pattern for the Message Batches API. Since batches are immutable and charged per request, parsing the results to isolate and resubmit only the failed custom_ids into a new, smaller batch minimizes both costs (50% discount compared to synchronous) and processing time.
    B: Incorrect. The Anthropic Message Batches API does not provide automatic server-side deduplication or 'skipping' of previously successful requests across different batch jobs. Resubmitting the original 50,000-request file would result in processing and being billed for all requests again, leading to duplicates and unnecessary costs.
    C: Incorrect. While processing failed requests synchronously avoids the batch queue, 1,200 requests is a high volume for synchronous calls. This would likely hit rate limits and would be significantly more expensive than using the Batch API, which is designed for this scale of throughput.
    D: Incorrect. Transient server errors (such as 5xx errors) are recoverable and should be retried to ensure data integrity. A 2.4% failure rate (1,200 items) is substantial in production workloads and discarding them would result in significant data loss.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24225)
```

```question
id: certsafari-domain-3-prompt-engineering-042
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An ingestion pipeline receives a continuous stream of mixed documents, including resumes, invoices, and legal contracts. You have defined three distinct extraction tools (`extract_resume`, `extract_invoice`, `extract_contract`), each with a strict JSON schema. You need Claude to always output structured data using exactly one of these schemas based on the document content, and it must never output conversational text. How should you configure the API request?
options:
  A: "Set `tool_choice: {\"type\": \"auto\"}` and provide a system prompt forbidding conversational text."
  B: "Set `tool_choice: {\"type\": \"any\"}` and provide all three tools in the request."
  C: "Set `tool_choice: {\"type\": \"tool\", \"name\": \"extract_resume\"}` and dynamically change it based on a pre-processing classification step."
  D: "Combine all three schemas into a single, deeply nested JSON schema and set `tool_choice: {\"type\": \"auto\"}`."
correct: B
explanation: |
    A: Incorrect. Setting `tool_choice` to `auto` gives Claude the discretion to decide between calling a tool or responding with a regular text message. Even with a system prompt forbidding conversational text, this does not provide a programmatic guarantee that the model will skip the preamble or always invoke a tool.
    B: Correct. In the Anthropic API, setting `tool_choice: {"type": "any"}` forces Claude to use at least one of the provided tools. Crucially, when a tool is forced, Claude automatically suppresses conversational text (the preamble), starting the response directly with the tool use block. This allows Claude to dynamically choose the correct schema (tool) based on the content while meeting the 'no conversational text' requirement.
    C: Incorrect. While forcing a specific tool name is a valid way to ensure structured output, this approach requires an external classification step to identify the document type before sending the extraction request. Using `tool_choice: any` is more efficient as it allows Claude to handle both classification and extraction in a single call.
    D: Incorrect. Combining schemas into one large object increases complexity and potential for errors. Furthermore, using `tool_choice: auto` still allows for conversational text, which violates the requirement to only output structured data.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24326)
```

```question
id: certsafari-domain-3-prompt-engineering-043
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A legacy codebase is being migrated, and Claude is tasked with reviewing the new code. The prompt asks Claude to 'Find all issues in the code.' The output is flooded with minor formatting inconsistencies and local naming pattern deviations, burying actual logic bugs. Which prompt update will best resolve this issue?
options:
  A: "Update the prompt to: 'Only report high-confidence findings and be conservative with style issues.'"
  B: "Update the prompt to: 'Report only logic bugs and security vulnerabilities. Explicitly skip minor style issues, formatting, and local naming conventions.'"
  C: "Use a post-processing script to filter out any Claude output containing the words 'style', 'formatting', or 'naming'."
  D: "Ask Claude to categorize findings and only output the top 3 most important issues per file."
correct: B
explanation: |
    A: While this prompt encourages caution, it remains vague and subjective. Terms like 'high-confidence' and 'conservative' lack explicit boundaries, often leading the model to continue reporting minor style issues if it perceives them as high-confidence deviations from standard patterns. It fails to provide a clear scope of what to ignore.
    B: This is the most effective update because it provides clear, explicit criteria for inclusion (logic bugs and security vulnerabilities) and specific negative constraints for exclusion (style, formatting, and naming). By defining the narrow scope, it directly improves precision and ensures that the model ignores low-value noise.
    C: Post-processing scripts are brittle and do not improve the model's focus during the generation phase. Filtering based on keywords might accidentally remove legitimate logic bugs that use those terms, and it does not prevent the model from wasting its context window and tokens on irrelevant analysis.
    D: While prioritization can be helpful, limiting output to a fixed number (top 3) does not explicitly exclude minor issues. If a file contains no major bugs, the model will still fill the list with style issues. Conversely, if a file has many critical bugs, several may be omitted due to the arbitrary limit.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24125)
```

```question
id: certsafari-domain-3-prompt-engineering-044
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are designing a pipeline to extract methodology details from thousands of academic research papers. Claude performs well when a paper has a dedicated 'Methodology' section, but fails to extract the required information when the methodology details are embedded within the 'Introduction' section. Which prompt engineering technique will best resolve this issue?
options:
  A: "Pre-process the documents using a separate model to extract only the paragraphs containing the word 'methodology'."
  B: "Instruct Claude to search the entire document twice before generating the final extraction."
  C: "Use few-shot examples demonstrating correct handling of varied document structures, including both dedicated sections and embedded details."
  D: "Break the task into two separate prompts: one specifically for the 'Methodology' section and one for the 'Introduction' section."
correct: C
explanation: |
    A: Pre-processing using keyword matching (e.g., searching for 'methodology') is brittle and will miss cases where methodology is described using synonyms or within an Introduction. This approach adds architectural complexity without teaching the model how to recognize the semantic meaning of methodological descriptions.
    B: Instructing the model to 'search twice' is a vague instruction that doesn't provide a concrete strategy for identifying information in unexpected sections. LLMs do not perform deterministic document searches like humans, and this technique is unlikely to improve performance on varied structures.
    C: Few-shot prompting is the most effective way to improve output consistency and generalization across diverse inputs. By providing examples that cover both explicit 'Methodology' headers and cases where the info is embedded in the 'Introduction', Claude learns the semantic patterns to look for regardless of the document structure.
    D: While breaking tasks into smaller prompts can sometimes help, this specific strategy relies on rigid assumptions about document structure and requires complex routing logic. It is less scalable and generalizable than teaching the model to handle varied structures through few-shot examples.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24083)
```

```question
id: certsafari-domain-3-prompt-engineering-045
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A customer service bot uses `tool_choice: {"type": "auto"}` with a `log_complaint` tool. When users send long, detailed emails, the bot successfully calls the tool. However, when users send short messages like "Fix my billing!", the bot often replies with conversational text (e.g., "I understand you're frustrated, I will log this") instead of calling the tool. You want to force the bot to always log the complaint via the tool, regardless of message length. What is the correct configuration?
options:
  A: "Change `tool_choice` to `{\"type\": \"any\"}`."
  B: "Add a second tool called `log_short_complaint`."
  C: "Increase the `temperature` parameter to 1.0."
  D: "Add a system prompt telling Claude to be less empathetic."
correct: A
explanation: |
    A: Correct. In the Anthropic Messages API, setting `tool_choice` to `{"type": "any"}` forces Claude to call at least one of the provided tools. This prevents the model from choosing a conversational text response, which it often defaults to in `auto` mode when input is brief or lacks sufficient context for a specific tool mapping.
    B: Incorrect. Adding more tools does not change the core decision logic of the `auto` tool selection mode. Even with multiple tools, Claude may still decide that a text-based response is more appropriate for short messages. To enforce tool usage, you must use the `tool_choice` parameter.
    C: Incorrect. The `temperature` parameter controls the randomness and creativity of the generated tokens. It does not dictate the structural decision of whether to use a tool versus returning a standard text block. High temperature can actually make tool invocation less predictable.
    D: Incorrect. While a system prompt can influence the model's tone and likelihood of using a tool, it is a 'soft' constraint. To programmatically guarantee that a tool is called every single time, the API-level `tool_choice` configuration must be used.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24334)
```

```question
id: certsafari-domain-3-prompt-engineering-046
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An automated code review assistant processes pull requests containing up to 20 files. Currently, all 20 files are concatenated into a single prompt for Claude to review. Developers report that Claude misses obvious local syntax errors in smaller files and fails to catch mismatched function signatures between files. Which architectural change will best resolve these issues?
options:
  A: "Switch to a larger context window model and increase the `max_tokens` to ensure Claude has enough output space to list all errors across the 20 files."
  B: "Split the review into two phases: parallel per-file prompts to identify local issues, followed by a single integration prompt containing the summaries and file interfaces to check cross-file data flow."
  C: "Implement a recursive summarization loop where Claude reviews file 1, appends the result to file 2, reviews file 2, and continues sequentially through all 20 files."
  D: "Prompt Claude to first output a JSON array of all file names, then iterate through them using tool calls to request the contents of each file one by one."
correct: B
explanation: |
    A: Incorrect. Increasing the context window and max_tokens does not solve context dilution or the 'lost in the middle' phenomenon. While a larger window permits more data, it does not improve the model's granular focus on small files or its ability to systematically compare signatures across a massive input block.
    B: Correct. This two-phase architecture follows a 'divide and conquer' approach. Parallel per-file prompts provide maximum focused attention for catching local syntax errors, while the subsequent integration phase focuses specifically on high-level interfaces and summaries. This reduces context noise and ensures global consistency (like function signatures) is reviewed without implementation details cluttering the prompt.
    C: Incorrect. Sequential recursive loops often suffer from context drift and information loss, where details from earlier files are compressed or forgotten as the chain progresses. It is also significantly slower than a parallel architecture and does not provide a dedicated global reconciliation pass.
    D: Incorrect. This change modifies the retrieval/IO flow rather than the reasoning architecture. Even if Claude fetches files individually, without a structured multi-pass review process, it still lacks the architectural separation needed to focus on local syntax vs. global integration simultaneously.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24182)
```

```question
id: certsafari-domain-3-prompt-engineering-047
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An automated system extracts required fields (Name, Date, Invoice Number, Tax ID) from vendor invoices using a Claude model. When an invoice lacks a Tax ID, the model frequently hallucinates a 9-digit number or returns a malformed JSON object, which breaks the downstream application. According to Anthropic's recommended practices, which approach is best for improving the model's reliability in handling this missing field?
options:
  A: "Set the `top_p` parameter to 0.1 to restrict the model's vocabulary and reduce the likelihood of hallucinations."
  B: "Add few-shot examples to the prompt that show correct extraction from varied formats, specifically demonstrating how to output a `null` or empty value when a required field is missing."
  C: "Instruct Claude in the system prompt to invent a standard placeholder value like '000-00-0000' if the Tax ID is missing."
  D: "Use a separate validation script to check if the document contains a Tax ID before sending it to Claude for extraction."
correct: B
explanation: |
    A: Incorrect. While adjusting sampling parameters like `top_p` can influence output randomness, it is not the recommended or most effective method for enforcing structural rules or handling missing data. The primary recommended strategies involve explicit prompt engineering.
    B: Correct. Anthropic's documentation explicitly recommends using few-shot examples to improve output consistency and quality, especially for empty or null extraction. This technique guides the model on the correct behavior when a field is not present, directly addressing the hallucination issue.
    C: Incorrect. This approach encourages the model to fabricate information, which is a form of controlled hallucination. Anthropic's best practices aim to reduce hallucinations by instructing the model to state uncertainty (e.g., "I don't know") or use a specific null representation, not to invent data.
    D: Incorrect. While this is a valid architectural pattern, it acts as a workaround rather than solving the core problem with the model's behavior. The question asks for the best way to improve the model's reliability, which is best achieved through prompt engineering techniques like few-shot examples or explicit instructions.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=30671)
```

```question
id: certsafari-domain-3-prompt-engineering-048
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A financial application uses Claude to extract invoice data via a strict JSON schema tool. The pipeline successfully parses the JSON 100% of the time without syntax errors. However, the `total_amount` field occasionally does not match the mathematical sum of the extracted `line_items`. What is the most effective architectural approach to resolve this issue?
options:
  A: "Switch the tool configuration to `tool_choice: {\"type\": \"any\"}` to force Claude to re-evaluate the schema."
  B: "Add explicit instructions in the system prompt directing Claude to calculate and verify the sum of the line items before populating the `total_amount` field."
  C: "Update the JSON schema to include a mathematical validation constraint on the `total_amount` property."
  D: "Increase the `temperature` parameter to allow Claude more creative freedom in interpreting the invoice layout."
correct: B
explanation: |
    A: Incorrect. Switching tool_choice to 'any' allows the model to choose between using a tool or providing a text response. This loosens constraints rather than enforcing arithmetic logic, and does not address the internal consistency of the data extracted.
    B: Correct. Directing Claude to perform explicit calculations and verification steps within the system prompt leverages its reasoning capabilities to ensure internal consistency. By instructing the model to verify the sum before populating the schema, you reduce the risk of hallucinated totals or extraction errors that conflict with the line items.
    C: Incorrect. Standard JSON Schema specifications do not natively support cross-field arithmetic validation (e.g., enforcing that one property equals the sum of an array of properties). This type of logic must be handled by the model's instructions or post-processing code.
    D: Incorrect. Increasing temperature increases the randomness of the output. For extraction and arithmetic tasks where precision is critical, a lower temperature (closer to 0) is preferred to ensure consistency and accuracy.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24325)
```

```question
id: certsafari-domain-3-prompt-engineering-049
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are using Claude to parse historical construction logs and extract material quantities into a structured database. The logs frequently use informal measurements like 'a cartload', 'three paces', or 'a handful'. Claude keeps hallucinating conversions of these informal measurements into standard metric units (e.g., converting 'a cartload' to '500 kg'). What is the most effective way to stop this hallucination and ensure the informal measurements are extracted exactly as written?
options:
  A: "Provide a comprehensive conversion table in the system prompt mapping informal terms to metric units."
  B: "Instruct Claude to completely ignore any sentence that contains an informal measurement."
  C: "Use few-shot examples demonstrating the extraction of informal measurements exactly as written, without hallucinating conversions."
  D: "Implement a multi-turn conversation where Claude must ask for clarification every time it encounters an informal measurement."
correct: C
explanation: |
    A: Incorrect. This approach would encourage the exact behavior you are trying to prevent. Providing a conversion table instructs Claude on *how* to convert the units, rather than telling it to stop converting them and extract the text verbatim.
    B: Incorrect. This would lead to significant data loss. The goal is to extract the informal measurements as they appear in the logs, not to discard the data records that contain them.
    C: Correct. According to Anthropic's recommended practices, few-shot prompting is a powerful technique for in-context learning. By providing examples that show the input text and the desired output (e.g., `input: '...added a cartload of stone...' -> output: {quantity: 'a cartload'}`), you directly teach the model the pattern of extracting the measurement verbatim. This helps ground the model's response and prevent 'paraphrase-drift' where meaning is altered.
    D: Incorrect. This is not a scalable or efficient solution for a bulk data processing task like parsing logs. While iterative refinement can be a useful technique, requiring human-in-the-loop clarification for every instance would be prohibitively slow and expensive, defeating the purpose of automation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=31726)
```

```question
id: certsafari-domain-3-prompt-engineering-050
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A security team uses Claude to assign CVSS-like severity scores to newly discovered vulnerabilities based on their descriptions. Claude struggles to differentiate between Medium and High severity for privilege escalation bugs, leading to inconsistent reporting. What is the best way to improve the prompt's precision?
options:
  A: "Instruct Claude to 'Default to Medium severity for privilege escalation unless you are highly confident it is High.'"
  B: "Add a prompt instruction: 'Be extremely precise and conservative when scoring privilege escalation vulnerabilities.'"
  C: "Provide explicit definitions for Medium and High severity, accompanied by concrete examples of privilege escalation vulnerabilities for each level."
  D: "Ask Claude to output a chain-of-thought explaining its reasoning before outputting the severity score, ensuring it mentions 'confidence'."
correct: C
explanation: |
    A: This approach introduces a systematic bias and a 'hedging' behavior rather than improving the model's actual understanding. It often leads to under-reporting of high-severity issues (false negatives) without resolving the ambiguity of the criteria.
    B: Vague behavioral instructions like 'be precise' or 'be conservative' are subjective and lack actionable criteria. Claude performs best when given clear, technical rules rather than abstract adjectives.
    C: This is the gold standard for prompt engineering. Providing explicit definitions (a rubric) and concrete few-shot examples helps the model understand the exact boundary between classes. This reduces ambiguity and ensures the model uses the same logic for every evaluation, leading to much higher precision.
    D: While Chain-of-Thought (CoT) is an excellent technique for improving reasoning, it cannot solve an inconsistency problem if the underlying scoring criteria are undefined. CoT must be paired with clear definitions (as in Option C) to be truly effective in classification tasks.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24128)
```

```question
id: certsafari-domain-3-prompt-engineering-051
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An automated invoice processing system uses Claude to extract line items and a total amount. For one invoice, the model extracts a `total_amount` of $550.00, but the sum of the extracted `line_item_amounts` is $505.00. The system's validation logic catches this discrepancy. What is the most effective way to structure the follow-up request to the model for self-correction?
options:
  A: "Resubmit the original prompt and invoice, but with a higher temperature setting to encourage a different result."
  B: "Send a new prompt with only the line items and ask the model to calculate the sum."
  C: "Resubmit the original invoice, the failed JSON extraction, and append a specific error message: 'Validation Error: The extracted 'total_amount' ($550.00) does not match the sum of 'line_item_amounts' ($505.00). Please re-examine the invoice and correct the extraction.'"
  D: "Resubmit the original prompt with a generic instruction added, such as 'Please be more careful with calculations.'"
correct: C
explanation: |
    A: Increasing the temperature setting introduces more randomness in the output but does not provide specific guidance to the model about what needs to be corrected. Effective self-correction requires explicit feedback regarding the validation failure rather than stochastic variability.
    B: While this verifies the arithmetic of the extracted items, it removes the context of the original invoice. It prevents the model from re-examining the source document for potential OCR or extraction errors that caused the discrepancy in the first place.
    C: This is the most effective approach for iterative self-correction. Providing the original context (the invoice), the erroneous state (the failed JSON), and a precise error message identifying the specific values that mismatched allows the model to reconcile the data with the source document and perform a targeted fix.
    D: Vague instructions like 'be more careful' do not specify what went wrong or where the model should look. Without pointing out the exact discrepancy or providing the original data for comparison, the model is unlikely to reliably identify and fix the extraction error.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24157)
```

```question
id: certsafari-domain-3-prompt-engineering-052
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An IT support application uses Claude to generate incident response playbooks from post-mortem documents. Despite detailed instructions demanding a 'concise, actionable checklist', Claude consistently generates long-winded, descriptive paragraphs that are difficult for engineers to use during an outage. What is the most effective technique to fix this?
options:
  A: "Add a frequency penalty to the API call to discourage the model from generating repetitive descriptive text."
  B: "Prompt Claude to summarize the post-mortem document first, and then generate the playbook in a second API call."
  C: "Use few-shot examples, as they are the most effective technique for achieving consistently formatted, actionable output when instructions fail."
  D: "Switch to a smaller, faster model for the generation step to naturally limit the verbosity of the output."
correct: C
explanation: |
    A: Frequency penalties are designed to reduce the repetition of specific tokens or phrases. They do not guide the model toward a specific structural format (like a checklist) or effectively curb overall verbosity when the model believes descriptive prose is the correct response.
    B: While a two-step 'chaining' process can help distill information, it does not guarantee that the final output will adhere to the specific 'checklist' formatting requirements. If the instructions in the second call are the same ones already failing in the zero-shot attempt, the model may still produce paragraphs.
    C: Few-shot prompting is the most powerful technique for controlling style, tone, and structure. By providing concrete examples of input (post-mortem) and the desired output (concise checklist), the model learns the pattern of the expected response, which is significantly more effective than descriptive instructions alone.
    D: Switching to a smaller model is not a reliable method for controlling output length or format. In fact, smaller models often have harder times following complex formatting constraints than larger, more capable models like Claude 3 Opus or Sonnet.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24092)
```

```question
id: certsafari-domain-3-prompt-engineering-053
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Claude is extracting 'Action Items' from meeting transcripts. The prompt says 'Extract all action items.' It frequently extracts vague statements like 'We should look into that eventually' as action items, which frustrates project managers. Which prompt modification is the most effective way to reduce these false positives?
options:
  A: "Change the prompt to: 'Extract action items only when there is a specific task assigned to a named individual with a clear deliverable.'"
  B: "Change the prompt to: 'Be conservative when extracting action items. Only extract high-confidence action items.'"
  C: "Instruct Claude to 'Filter out vague statements from the action items list before generating the final output.'"
  D: "Ask Claude to rate the actionability of each item from 1-10 and only output those scoring 8 or higher."
correct: A
explanation: |
    A: Correct. Providing explicit criteria (specific task, named individual, clear deliverable) is the most effective prompt engineering technique for increasing precision. By defining the necessary components of an action item, the model has a clear checklist to differentiate between actual tasks and vague aspirational statements, thereby reducing false positives.
    B: Incorrect. Instructions like 'be conservative' or 'high-confidence' are subjective and provide no concrete guidance to the model. Without specific definitions of what constitutes a 'high-confidence' item, the model's output will remain inconsistent.
    C: Incorrect. This instruction is vague and reactive. Asking the model to filter 'vague statements' without defining what qualifies as vague is likely to result in the same internal logic that produced the false positives in the first place.
    D: Incorrect. While scoring can be a useful intermediate step, it still relies on the model's subjective judgment. Without the explicit criteria found in Option A to calibrate the scoring, the results will remain unreliable and add unnecessary complexity to the prompt.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24127)
```

```question
id: certsafari-domain-3-prompt-engineering-054
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A CI/CD pipeline uses Claude to categorize code smells into 'Security', 'Performance', and 'Style'. The 'Style' category currently has a 65% false positive rate, while 'Security' is 98% accurate. Telemetry shows developers have started ignoring the entire automated review output, including critical security alerts. What is the best immediate action to take?
options:
  A: "Add a prompt instruction: 'Ensure Style recommendations are 100% accurate before outputting them to the user.'"
  B: "Instruct Claude to output a disclaimer at the top of the review: 'Style suggestions may contain false positives, please review carefully.'"
  C: "Temporarily disable the 'Style' category in the prompt to restore developer trust while refining the style criteria offline."
  D: "Change the prompt to require Claude to provide a detailed, step-by-step justification for every 'Style' finding."
correct: C
explanation: |
    A: Demanding 100% accuracy via prompt instruction is unrealistic for LLMs and cannot be reliably enforced. Such a constraint may lead to the model withholding valid suggestions or hallucinating justifications to appear compliant, and it fails to address the immediate issue of alert fatigue.
    B: While a disclaimer provides transparency, it does not reduce the volume of noisy 'Style' outputs. Because the false positive rate remains high, developers are likely to continue ignoring the entire report, including high-value security alerts.
    C: This is the most effective immediate action to restore the signal-to-noise ratio. By removing the category with the 65% false positive rate, you immediately increase the overall reliability of the output, ensuring that critical security alerts (98% accuracy) are noticed while the style criteria are refined and validated in a non-production environment.
    D: Requiring justifications increases the verbosity of the output and the cognitive load for developers without necessarily improving accuracy. This approach makes the noisy output even more burdensome to parse and does not solve the fundamental trust issue caused by the high false positive rate.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24123)
```

```question
id: certsafari-domain-3-prompt-engineering-055
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A multi-agent system features a "Researcher" agent equipped with `search_database`, `calculate_metrics`, and `format_report` tools. For a specific user query, you know the agent must start by querying the database, but during testing, the agent sometimes tries to calculate metrics first based on its internal knowledge. How can you guarantee the agent calls the database tool first without removing the other tools from its context?
options:
  A: "Set `tool_choice: {\"type\": \"tool\", \"name\": \"search_database\"}` for the initial API request."
  B: "Set `tool_choice: {\"type\": \"any\"}` and rely on the system prompt to guide the order of operations."
  C: "Add a system prompt stating \"CRITICAL: You must use search_database first.\""
  D: "Set `tool_choice: {\"type\": \"auto\"}` and use a temperature of 0.0 to ensure deterministic tool selection."
correct: A
explanation: |
    A: Correct. In the Claude API, setting `tool_choice` to a specific tool name via the `tool` type forces the model to use that specific tool in its response. This is the only programmatic way to guarantee a specific tool is called first, regardless of the model's internal reasoning or planning.
    B: Incorrect. Setting `tool_choice` to `any` forces the model to use *at least one* tool from the provided list, but it still allows the model to choose *which* tool to use. This does not solve the problem of the agent selecting the wrong tool first.
    C: Incorrect. While strong system prompts are useful for guidance, they are 'soft' constraints. The model can still deviate from instructions if its training data or reasoning suggests another path. Technical enforcement via API parameters is required for a 'guarantee'.
    D: Incorrect. `auto` allows the model to decide whether to use a tool at all. While a temperature of 0.0 makes the selection deterministic, it will consistently select the tool the model thinks is best, which in this scenario is already the incorrect tool.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24336)
```

```question
id: certsafari-domain-3-prompt-engineering-056
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A customer support platform categorizes incoming tickets using a tool with an `issue_type` enum field containing five fixed categories. Users frequently submit tickets that do not fit into these five categories, causing Claude to force them into incorrect classifications. You need to capture these novel issue types for future analysis while strictly adhering to the JSON schema. Which schema design modification is most appropriate?
options:
  A: "Remove the enum constraint entirely and make `issue_type` a free-text string field."
  B: "Add \"other\" to the `issue_type` enum values and introduce a new optional string field named `issue_type_other_detail` to capture the novel category."
  C: "Instruct Claude in the system prompt to append \"- Other\" to the closest matching enum value."
  D: "Set `tool_choice: {\"type\": \"auto\"}` so Claude can dynamically generate new JSON keys when a novel issue type is detected."
correct: B
explanation: |
    A: Removing the enum constraint entirely sacrifices the structured nature of the data and loses the benefits of a controlled vocabulary for the majority of cases, making downstream automated processing and reporting significantly more difficult.
    B: This is a standard design pattern for handling 'out-of-bounds' data in structured schemas. Adding 'other' to the enum maintains the strict validation for known categories, while the optional 'detail' field provides a machine-parseable way to collect novel data for future taxonomy expansion.
    C: Instructing Claude to append text to an enum value would result in a validation error because the resulting string would no longer match the predefined enum constants. It also creates messy data by mixing primary categories with free-text suffixes.
    D: The 'tool_choice' parameter only determines whether the model must use a tool or can choose to use a tool; it does not grant the model the ability to modify the tool's JSON schema at runtime. All outputs must still conform to the schema defined in the API call.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24328)
```

```question
id: certsafari-domain-3-prompt-engineering-057
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An architect is designing a pipeline to process 50,000 customer feedback emails nightly using the Message Batches API. The current synchronous implementation uses a tool called `query_crm` to fetch customer purchase history mid-request before generating a personalized response. How must the architect adapt this workflow for the Batch API?
options:
  A: "Wrap the tool call in a `batch_tool_choice` object to allow asynchronous execution."
  B: "Pre-fetch the purchase history from the CRM and include it directly in the prompt payload for each email."
  C: "Submit the batch and configure a webhook endpoint to handle the tool call asynchronously when Claude requests it."
  D: "Use the `custom_id` field to link the batch request to a separate CRM batch job that runs in parallel."
correct: B
explanation: |
    A: Incorrect. The `batch_tool_choice` object is fictitious and not part of the Anthropic API. Tool use in a batch context is restricted because the API is designed for non-interactive processing, meaning the model cannot pause to wait for tool output before continuing a turn.
    B: Correct. Since the Batch API processes requests asynchronously and does not support interactive tool-calling loops (where the model waits for external data mid-inference), all necessary context—such as purchase history—must be pre-fetched and injected directly into the prompt payload for each item in the batch.
    C: Incorrect. The Message Batches API does not support live, per-item webhooks to handle tool execution during inference. While webhooks can be used for batch completion notifications, they cannot facilitate real-time data retrieval for the model during the batch run.
    D: Incorrect. The `custom_id` field is a user-provided string used solely to correlate input requests with output results in the final batch file. It does not provide a mechanism for the model to access external data or trigger parallel processing jobs.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24218)
```

```question
id: certsafari-domain-3-prompt-engineering-058
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An automated security scanner powered by Claude is analyzing an internal admin tool. The tool does not accept external user input, but Claude is generating a high volume of false positives for SQL injection vulnerabilities. The architect previously added the instruction 'Be conservative when flagging SQL injection,' but the false positive rate remained unchanged. What is the most architecturally sound approach to fix this?
options:
  A: "Replace the 'be conservative' instruction with explicit categorical criteria: 'Only flag SQL injection if the query concatenates un-sanitized variables originating from external HTTP requests.'"
  B: "Implement a multi-shot prompt with examples of both true and false positives, while keeping the 'be conservative' instruction."
  C: "Tell Claude to 'Only report high-confidence SQL injection findings' to force the model's internal probability threshold higher."
  D: "Lower the temperature parameter to 0.0 to make the model more deterministic and reduce hallucinated vulnerabilities."
correct: A
explanation: |
    A: Correct. Replacing a vague instruction with explicit categorical criteria (e.g., checking for un-sanitized variables from external sources) ties the model's decisions to concrete, checkable conditions. This approach encodes domain knowledge and dataflow/taint rules directly into the prompt, which is significantly more effective than relying on ambiguous heuristics like 'being conservative'.
    B: Incorrect. While few-shot prompting with examples can improve performance, keeping the vague 'be conservative' instruction leaves the decision boundary underspecified. Without explicit, source-based criteria, examples alone are unlikely to provide a robust fix for systematic false positives in complex or unseen code.
    C: Incorrect. Asking the model to report only 'high-confidence' findings relies on the model's internal, non-calibrated uncertainty and is not a reliable architectural control. It fails to establish concrete, verifiable rules regarding the origin of data or sanitization processes.
    D: Incorrect. Lowering the temperature to 0.0 increases determinism (consistency) but does not improve the accuracy of the model's logic. Deterministic outputs can still be systematically incorrect; the solution requires explicit criteria rather than just ensuring the model provides the same wrong answer every time.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24122)
```

```question
id: certsafari-domain-3-prompt-engineering-059
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A marketing platform allows users to generate bulk email campaigns. A user uploads a CSV of 10,000 leads. The system uses the `Message Batches API` to generate personalized emails. The architect notices that users frequently complain about the tone of the emails after waiting up to 24 hours for the batch to complete, leading to high churn and wasted API costs. How should the architect redesign the workflow to address this problem most efficiently?
options:
  A: "Switch the entire workflow to the synchronous `Messages API` so users get immediate results for all 10,000 emails."
  B: "Generate a small sample of 5 emails using the synchronous `Messages API` for user approval before submitting the remaining 9,995 via the `Message Batches API`."
  C: "Add a multi-turn tool call to the `Message Batches API` request to ask the user for feedback mid-generation."
  D: "Submit the job in smaller batches of 1,000 and email the user after each chunk completes to gather incremental feedback."
correct: B
explanation: |
    A: Incorrect. While this provides immediate results, it is not an efficient solution. The research highlights that the `Message Batches API` is specifically designed for large volumes and offers a significant cost reduction, typically 50%, compared to synchronous calls. Processing 10,000 requests synchronously would be far more expensive and could encounter rate limits.
    B: Correct. This "dual-mode architecture" is a recommended best practice according to the research. Using the synchronous API for a small, interactive sample allows for immediate user feedback and quality assurance. Once the tone is approved, the cost-effective and high-throughput `Message Batches API` can be used for the remaining bulk generation, minimizing wasted costs and improving user satisfaction.
    C: Incorrect. The `Message Batches API` is designed for asynchronous, non-interactive processing of large volumes of requests. The research does not support the idea of interactive, mid-generation feedback loops within a batch job. Such interactive workflows are the domain of the synchronous `Messages API`.
    D: Incorrect. While this approach introduces feedback loops, it is less efficient than generating a small upfront sample. The user would still have to wait for the first batch of 1,000 to complete, and if the tone is wrong, the cost of that first batch is wasted. The recommended approach is to validate the output with a minimal sample *before* committing to any large-scale batch processing.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32839)
```

```question
id: certsafari-domain-3-prompt-engineering-060
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An architect has designed a system where Claude reviews marketing copy for compliance with financial regulations. The initial prompt is: 'Ensure the copy is compliant and be conservative about making claims.' This prompt causes Claude to flag almost every sentence, including standard greetings like 'Welcome to our platform.' How should the architect redesign the prompt to improve accuracy and reduce false positives?
options:
  A: "Change the prompt to: 'Only report high-confidence compliance violations.'"
  B: "Change the prompt to: 'Only flag statements that explicitly guarantee a specific return on investment or promise zero risk.'"
  C: "Instruct Claude to 'Ignore standard greetings and focus on the main financial content.'"
  D: "Lower the `temperature` to 0 to reduce the number of false positives and make the output deterministic."
correct: B
explanation: |
    A: Incorrect. While asking for high-confidence results can reduce the volume of output, it does not fix the root problem. The model's flawed interpretation of the vague 'be conservative' instruction is the issue. It might be highly confident in its incorrect flagging of benign text, so this change would not solve the underlying misinterpretation.
    B: Correct. This is the most effective solution because it replaces a vague, subjective instruction ('be conservative') with a specific, rule-based directive. Research confirms that financial regulators like the SEC and FINRA explicitly prohibit guaranteeing returns or promising zero risk. Providing this clear, actionable rule focuses the model on genuine, high-priority compliance violations and prevents it from over-flagging benign content like greetings.
    C: Incorrect. This approach only addresses a symptom (flagging greetings) rather than the root cause. The model would still be operating under the vague 'be conservative' instruction for the main financial content, likely leading to continued over-flagging and false positives in the most critical parts of the text.
    D: Incorrect. The `temperature` parameter controls the randomness or 'creativity' of the model's output, not its interpretation of instructions. Lowering the temperature to 0 would simply make the model's incorrect, over-flagging behavior more consistent and deterministic. It does not correct the model's fundamental misunderstanding of the compliance task.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28771)
```

```question
id: certsafari-domain-3-prompt-engineering-061
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Claude is tasked with analyzing branch-level test coverage reports to identify gaps. However, it struggles to differentiate between genuine coverage gaps that need new tests and branches that are technically uncovered but practically unreachable (e.g., defensive programming checks for impossible states). How should you improve the prompt to handle this ambiguous case?
options:
  A: "Instruct Claude to ignore all branches that have less than 5% overall coverage."
  B: "Ask Claude to generate unit tests for all uncovered branches regardless of their reachability."
  C: "Provide few-shot examples demonstrating how to handle unreachable branches versus genuine coverage gaps."
  D: "Use a separate static analysis tool to filter the reports before prompting Claude."
correct: C
explanation: |
    A: Incorrect. Instructing Claude to ignore branches based on an arbitrary numeric threshold is a heuristic that fails to address the underlying logic of code reachability. This approach could lead to overlooking critical but rarely executed genuine coverage gaps.
    B: Incorrect. Forcing the generation of tests for every uncovered branch results in low-quality tests for impossible states (defensive programming). This leads to bloated test suites and fails to solve the ambiguity problem of distinguishing reachable code from unreachable code.
    C: Correct. Few-shot prompting is highly effective for teaching Claude how to navigate ambiguity. By providing specific examples of both reachable gaps and unreachable defensive code—including the reasoning for each—Claude learns the patterns and domain-specific signals required to make accurate, consistent judgments in new scenarios.
    D: Incorrect. While external tools can complement an LLM workflow, the question specifically asks for an improvement to the prompt itself. Additionally, static analysis tools may suffer from the same 'false positive' reachability issues as the raw coverage report.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24090)
```

```question
id: certsafari-domain-3-prompt-engineering-062
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system generates Terraform configurations for AWS infrastructure, creating `vpc.tf`, `ec2.tf`, and `rds.tf`. A single-prompt review often fails to notice that the subnet IDs referenced in `rds.tf` do not match the outputs defined in `vpc.tf`. How should the review architecture be restructured?
options:
  A: "Combine all three files into a single `main.tf` file before sending it to Claude for review to ensure all context is in one place."
  B: "Implement a multi-pass architecture: run a local review pass on each file individually to validate syntax, then run an integration pass providing the extracted inputs/outputs of all files to verify cross-file data flow."
  C: "Use a separate Claude instance to review `vpc.tf`, and pass its conversation history into the review of `ec2.tf`, and then into `rds.tf`."
  D: "Instruct Claude in the system prompt to pay special attention to subnet IDs and cross-file references during its single-pass review."
correct: B
explanation: |
    A: Incorrect. Combining all files into a single file is brittle, does not scale for larger infrastructure projects, and risks losing the benefits of modularity. It also does not explicitly direct the model's attention to the specific interface logic between the components.
    B: Correct. A multi-pass architecture allows the model to first ensure individual file integrity (syntax and local logic) and then focus specifically on the data flow and integration between components. By providing extracted inputs and outputs in the second pass, the 'noise' of the configuration details is reduced, allowing the model to more accurately identify mismatches in cross-file references like subnet IDs.
    C: Incorrect. Chaining full conversation history is inefficient and introduces noise. It relies on the model navigating a growing context window to find specific reference values, which is less reliable than a deterministic integration step that uses structured artifacts or extracted metadata.
    D: Incorrect. While prompting for specific attention can help, it is often insufficient for complex cross-referencing tasks in a single pass. Architectural restructuring into multiple passes is a more robust way to ensure high-fidelity verification of data consistency.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24188)
```

```question
id: certsafari-domain-3-prompt-engineering-063
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An enterprise uses Anthropic's Batch API under its Commercial Terms of Service to process a high volume of customer support transcripts. Transcripts are generated continuously, and each one must be processed within a strict 48-hour Service Level Agreement (SLA). To maximize batch size for cost-efficiency while ensuring no transcript ever violates the SLA, what is the most appropriate batch submission frequency?
options:
  A: "Submit a new batch every 12 hours."
  B: "Submit a new batch every 24 hours."
  C: "Submit a new batch every 48 hours."
  D: "Submit a new batch every 6 hours."
correct: B
explanation: |
    A: Incorrect. While submitting a batch every 12 hours would meet the 48-hour SLA, it does not maximize the batch size. More frequent submissions result in smaller, less cost-efficient batches. The goal is to find the longest possible interval that still guarantees the SLA.
    B: Correct. This frequency balances maximizing batch size with meeting the SLA. A transcript generated just after one batch submission will be at most 24 hours old when the next batch is sent. This leaves another 24 hours for processing, which safely meets the 48-hour SLA. The research confirms Anthropic provides a `Batch Processing` API (`/v1/batches`) for efficiently handling multiple requests, making this a valid architectural pattern.
    C: Incorrect. Submitting a batch every 48 hours would violate the SLA. A transcript generated immediately after a batch submission would have to wait 48 hours for the next submission, at which point its SLA has already expired, even before processing begins.
    D: Incorrect. This frequency would safely meet the SLA but fails to maximize the batch size for cost-efficiency. Submitting batches this frequently would lead to smaller batch sizes and potentially higher operational overhead compared to a less frequent schedule that still meets the requirements.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28369)
```

```question
id: certsafari-domain-3-prompt-engineering-064
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An AI agent generates Python scripts for data analysis. To improve code quality, the developer added a <reflection> step where the model is asked to critique its own code before outputting the final version. However, the model often justifies its own logical flaws rather than correcting them. What is the primary architectural reason for this behavior?
options:
  A: "The model is experiencing attention dilution; the prompt should be split into smaller chunks to maintain focus."
  B: "The model retains its prior reasoning context from the generation phase, making it biased toward its initial decisions and less likely to question them."
  C: "The <reflection> tag is not a recognized XML tag by Claude; it should be changed to <review> to trigger the internal critique weights."
  D: "The temperature is set too low, preventing the model from exploring alternative logical paths during the reflection phase."
correct: B
explanation: |
    A: Incorrect. Attention dilution refers to a loss of focus due to excessively long or complex context windows, but it does not specifically explain why a model would actively defend or rationalize its own errors. Splitting the prompt may improve clarity but does not address self-correction bias.
    B: Correct. This is a common issue known as anchoring or confirmation bias within a single context window. Because the model's initial reasoning and code are part of the current conversation history, it is architecturally predisposed to remain consistent with its previous tokens. To solve this, a multi-pass architecture using a fresh model instance (without the initial reasoning context) is often required to provide an objective critique.
    C: Incorrect. Claude uses XML tags to structure data and improve parsing, but there are no reserved or hard-coded XML tags like <reflection> or <review> that specifically 'trigger' internal critique weights or change the model's fundamental reasoning capabilities.
    D: Incorrect. Temperature controls the randomness and diversity of token selection. While a very low temperature makes the model more deterministic, the core issue of rationalizing mistakes is driven by contextual bias and the sequence of previous outputs, not the stochasticity parameters.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24184)
```

```question
id: certsafari-domain-3-prompt-engineering-065
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A company uses Claude as a code analysis tool to detect potential bugs. The tool extracts findings into a structured format. Developers who review the findings can dismiss them as false positives. To improve the tool, the engineering team wants to identify which specific detection patterns are causing the most false positives. How should the extraction schema and feedback loop be designed to achieve this?
options:
  A: "When a finding is dismissed, require the developer to write a detailed paragraph explaining why it was a false positive."
  B: "For each finding, include a `detected_pattern` field (e.g., 'off_by_one_error_in_loop'). Log this field every time a developer dismisses a finding to allow for aggregation and analysis of dismissal rates per pattern."
  C: "Only log the general `finding_type` (e.g., 'Logic Error') when a finding is dismissed, as the specific patterns are too numerous to track."
  D: "Create a separate model to analyze all dismissed findings and cluster them by similarity after the fact."
correct: B
explanation: |
    A: Incorrect. Requiring developers to write a detailed paragraph creates high friction and produces unstructured free-text data that is difficult to aggregate and analyze at scale. Structured labels or fields are far more reliable for measuring dismissal rates and automating improvement workflows.
    B: Correct. Including a dedicated `detected_pattern` field for each finding and logging it upon dismissal allows for straightforward aggregation of dismissal counts and rates per specific pattern. This structured approach provides the necessary granularity to pinpoint which specific rules or prompts produce the most false positives, enabling targeted updates.
    C: Incorrect. Logging only a coarse `finding_type` loses the granularity needed to distinguish which specific detection patterns are problematic. While lower cardinality data is easier to manage, it prevents the specific per-pattern analysis required to resolve high false-positive rates.
    D: Incorrect. Post-hoc clustering of dismissed findings can provide insights but is more complex, less precise, and subject to noise compared with proactively capturing a structured `detected_pattern` field. It is more efficient to log specific identifiers at the time of dismissal for direct analysis.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24161)
```

```question
id: certsafari-domain-3-prompt-engineering-066
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A security scanning tool uses Claude to analyze pull requests. Recently, developers have complained that Claude is generating too many false positives by flagging acceptable legacy internal API patterns as 'unauthorized access' vulnerabilities. You want Claude to generalize its understanding so it stops flagging these acceptable patterns while still catching genuine security flaws. How should you modify the prompt?
options:
  A: "Write a detailed list of all acceptable legacy internal API endpoints and instruct Claude to ignore them."
  B: "Provide few-shot examples that distinguish acceptable legacy code patterns from genuine issues, demonstrating the reasoning behind the distinction."
  C: "Instruct Claude to only flag vulnerabilities that have a 'Critical' or 'High' severity rating."
  D: "Remove the context about internal APIs from the prompt so Claude only focuses on external-facing code."
correct: B
explanation: |
    A: Providing a static, exhaustive list is brittle, high-maintenance, and fails to teach the model the underlying reasoning required for generalization. This approach risks missing actual vulnerabilities that may exist on those endpoints or suppressing signals in evolving codebases.
    B: This is the most effective approach for generalization. Providing few-shot examples that contrast legacy patterns with genuine vulnerabilities helps Claude learn the contextual nuances. Including the reasoning behind the distinctions enables the model to apply that logic to new, unseen patterns, reducing false positives while maintaining high recall for security flaws.
    C: Severity filtering does not address the model's fundamental classification error regarding legacy patterns. Using severity as a coarse filter may hide the symptoms of false positives but also leads to missing legitimate lower-severity issues and fails to improve the model's understanding.
    D: Removing context about internal APIs deprives the model of the information necessary to make informed decisions. This lack of signal can lead to more inaccuracies and prevents Claude from distinguishing between acceptable internal usage and genuine security risks.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24081)
```

```question
id: certsafari-domain-3-prompt-engineering-067
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A multi-step agentic workflow processes long research articles. The first step must extract basic metadata (author, date, title) using an `extract_metadata` tool before passing the document to a secondary enrichment step. Occasionally, Claude skips the extraction tool entirely and attempts to summarize the article directly in text. How can you guarantee the metadata extraction occurs first?
options:
  A: "Set `tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"}` in the initial API request."
  B: "Set `tool_choice: {\"type\": \"any\"}` and include both the extraction and summarization tools in the request."
  C: "Set `tool_choice: {\"type\": \"auto\"}` and add a strong system prompt emphasizing the importance of the metadata."
  D: "Remove all tools from the request and ask Claude to output the metadata in XML tags."
correct: A
explanation: |
    A: Correct. Specifying a specific tool using the 'tool' choice type forces Claude to use that exact tool in its response. In a multi-step orchestrated workflow, forcing the model to use the 'extract_metadata' tool in the first API call ensures the required step is executed before the workflow proceeds to subsequent steps.
    B: Incorrect. While setting tool_choice to 'any' forces the model to use at least one tool, it does not guarantee which tool will be selected if multiple tools are provided. If both the extraction and enrichment tools are in the same request, Claude could still choose the wrong one first.
    C: Incorrect. The 'auto' setting (default) allows Claude to decide whether to use a tool or respond with a normal text message. A system prompt can influence behavior, but it does not provide the programmatic guarantee required to ensure the tool is never skipped.
    D: Incorrect. Relying on XML tags in a standard text response is a prompting technique rather than a programmatic enforcement. It is prone to hallucinations or formatting errors and does not utilize the structured tool-use API designed to guarantee structured output.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24329)
```

```question
id: certsafari-domain-3-prompt-engineering-068
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  An automated testing tool uses Claude to generate unit tests, categorizing them into 'Happy Path', 'Edge Case', and 'Error Handling'. The 'Edge Case' tests frequently fail because they test impossible state combinations, leading developers to discard all generated tests. What is the most effective way to manage developer trust in this scenario?
options:
  A: "Instruct Claude to 'Ensure Edge Case tests are realistic and executable.'"
  B: "Add a prompt instruction: 'Only generate high-confidence Edge Case tests.'"
  C: "Ask Claude to output a disclaimer that Edge Case tests may require manual adjustment before running."
  D: "Temporarily disable the generation of 'Edge Case' tests to restore trust in the 'Happy Path' and 'Error Handling' tests while refining the edge case prompt."
correct: D
explanation: |
    A: Incorrect. While this is a step towards prompt refinement, the instruction is too vague to be effective. Anthropic's documentation emphasizes more robust techniques, such as providing 3-5 diverse examples that cover edge cases and structuring prompts with XML tags, rather than relying on high-level, ambiguous commands.
    B: Incorrect. Research based on Anthropic's documentation confirms this is not a recommended prompt instruction. Test quality and confidence are the outcome of a well-designed prompt with clear instructions and diverse examples, not a direct command that the model can reliably follow.
    C: Incorrect. A disclaimer does not solve the root problem of generating faulty tests and is unlikely to restore trust. Developers would still receive unusable tests, which would continue to undermine the tool's perceived value and reliability.
    D: Correct. This is the most effective strategy for managing developer trust in a failing automated system. It immediately stops the flow of problematic outputs, allowing the valuable parts of the tool to function and rebuild confidence. This pragmatic approach provides the necessary time to iteratively refine the edge case prompt using best practices without further damaging the tool's reputation.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=28726)
```

```question
id: certsafari-domain-3-prompt-engineering-069
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A system for extracting information from insurance claims fails an initial extraction attempt. The validation layer reports two distinct errors: (1) The `policy_number` field, which should be 10 characters, was extracted as 'ABC-123'. (2) The `incident_date` was extracted as a date in the future. What is the most effective error feedback to include in the retry prompt?
options:
  A: "Error: The data is invalid. Please try again."
  B: "Error: The policy number has the wrong format. Please correct it."
  C: "The JSON output did not match the required schema. Please regenerate the entire output correctly."
  D: "Validation Errors: 1. 'policy_number' must be 10 alphanumeric characters without hyphens. 2. 'incident_date' must be a date in the past. Please correct these fields based on the document."
correct: D
explanation: |
    A: This option is too vague and lacks specificity. It does not identify which fields failed validation or provide guidance on how to fix them, making it difficult for the model to make targeted improvements in a retry.
    B: This feedback is incomplete because it only addresses the policy number and ignores the date error. Furthermore, it doesn't specify the exact format requirements (10 characters, no hyphens), providing insufficient guidance for correction.
    C: Asking to regenerate the entire output without detailing which fields are wrong is non-actionable and inefficient. Validation feedback should provide specific corrections so the model can repair only the problematic fields rather than performing a blind retry.
    D: This is the most effective feedback because it is precise, comprehensive, and actionable. It clearly identifies both errors and provides the specific rules (10 alphanumeric characters/no hyphens and requirement for a past date) needed to satisfy validation, facilitating a targeted and successful correction.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24167)
```

```question
id: certsafari-domain-3-prompt-engineering-070
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A news aggregator wants to use the Message Batches API to categorize incoming articles to achieve a 50% cost reduction. Their product requirements state that articles must be categorized and published to the live feed within 4 hours of receipt. What is the appropriate architectural decision?
options:
  A: "Submit batches every 1 hour to ensure the 4-hour SLA is met."
  B: "Use the Batch API but configure the `priority` flag to `high` to bypass the standard 24-hour window."
  C: "Do not use the Batch API; use the synchronous API because the Batch API has no guaranteed latency SLA under 24 hours."
  D: "Submit batches every 4 hours and cache the results for the next publishing cycle."
correct: C
explanation: |
    A: Increasing the frequency of batch submissions (e.g., every hour) does not change the Batch API's underlying processing guarantee. Since Anthropic only guarantees results within 24 hours, frequent submissions do not ensure a 4-hour turnaround for any specific request.
    B: This option is incorrect because the Anthropic Message Batches API does not currently offer a `priority` flag or any configuration to reduce the standard 24-hour processing window. This is a common hallucination as no such parameter exists in the API documentation.
    C: This is the correct architectural decision. Anthropic's Message Batches API provides a 50% cost discount but only guarantees completion within 24 hours. Because the business requirement specifies a strict 4-hour SLA for the live feed, the Batch API is unsuitable, and the synchronous API must be used to ensure timely processing.
    D: Submitting every 4 hours aligns with the publication window but does not address the latency of the API itself. Because a batch can take up to 24 hours to return results, this strategy would frequently violate the 4-hour publication requirement.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24223)
```

```question
id: certsafari-domain-3-prompt-engineering-071
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  A sentiment analysis application processes customer reviews. Users can flag incorrect sentiment classifications. The team notices that reviews containing the phrase 'wicked good' are often classified as 'Negative' by the model but are flagged as 'Positive' by users from New England. How should the feedback from these user corrections be used to improve the model's performance?
options:
  A: "Implement a hard-coded rule in the application to replace 'wicked good' with 'very good' before sending the text to the model."
  B: "Collect examples of user-corrected reviews containing 'wicked good' and incorporate them as few-shot examples in the prompt to provide the model with contextual understanding of this regional slang."
  C: "Fine-tune the base model on a large corpus of New England literature."
  D: "Add an instruction to the prompt: 'Pay attention to regional slang where negative-sounding words can be positive.'"
correct: B
explanation: |
    A: This is a brittle, hard-coded solution that fails to leverage the LLM's natural language capabilities. It does not generalize to variations, punctuation, or other regional phrases, and it effectively masks data rather than improving the model's contextual understanding.
    B: This is the most effective way to utilize direct user feedback. Incorporating corrected examples as few-shot prompts provides the model with concrete context and demonstrates the 'semantic flip' (where a typically negative word like 'wicked' acts as an intensifier for a positive one). This is a low-risk, iterative approach that scales better than hard-coding.
    C: Fine-tuning is resource-intensive, expensive, and often overkill for addressing specific idiomatic issues. Furthermore, a corpus of literature may not reflect the contemporary, colloquial usage found in modern customer reviews.
    D: While adding a general instruction might provide some guidance, abstract directives are significantly less effective than concrete few-shot examples for teaching subtle linguistic nuances and regional idioms.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=24173)
```

```question
id: certsafari-domain-3-prompt-engineering-072
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  You are using Claude's tool use capabilities to extract dates from international shipping contracts. Your tool has a `contract_date` string parameter. Claude successfully extracts the dates, but provides them in various formats as they appear in the source text (e.g., "12/05/2023", "May 12th, 2023"). Your downstream database requires the ISO 8601 format (`YYYY-MM-DD`).
  
  What is the officially recommended approach to enforce this specific output format?
options:
  A: "Update the tool's JSON schema to set the `format` of the `contract_date` field to `date`."
  B: "Include explicit format normalization rules and examples in the system prompt."
  C: "Set `tool_choice: {\"type\": \"any\"}` in the API call to force Claude to evaluate and standardize the date format before outputting."
  D: "Change the tool schema to have separate `year`, `month`, and `day` integer fields, and then concatenate them in a post-processing script."
correct: B
explanation: |
    A: Incorrect. While specifying `"format": "date"` in the JSON schema provides a hint to the model about the expected data, it does not guarantee that Claude will normalize various date formats into the required ISO 8601 standard. The most reliable method is to provide explicit instructions in the prompt.
    B: Correct. Anthropic's official documentation strongly recommends providing explicit instructions, rules, and 2-4 concrete examples (few-shot prompting) in the prompt. This is the most effective way to guide Claude to consistently normalize varied inputs into a specific, stable output format like ISO 8601.
    C: Incorrect. The `tool_choice` parameter is used to control *if* and *which* tool the model should use. It does not influence how the model formats the values for the tool's parameters.
    D: Incorrect. While this is a valid engineering workaround, it is not the recommended approach for getting Claude to perform the normalization. This method shifts the formatting logic to a separate post-processing step, whereas the best practice is to use prompt engineering to have the model produce the desired output directly.
source-note: raw/certsafari/cca-f-questions.json (certsafari_id=32812)
```
