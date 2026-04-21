---
source_type: docling-projection
source_pdf: The Architect's Playbook.pdf
extracted_by: docling 2.90.0 via docling-mcp 1.3.4
extracted_at: 2026-04-21
pages: 27
sections: 39
pictures: 39
tables: 2
notes: |
  Machine-generated text projection of the PDF for indexing / search / /lint coverage.
  Treat as raw-adjacent (still immutable). Figures embedded in the PDF are marked
  as `<!-- image -->` placeholders — they contain pedagogically load-bearing content
  (architecture diagrams, four-domain wheels, hierarchy pyramid) that Docling's
  layout model identifies but does not interpret. Compiled-wiki notes must use
  vision-read on specific figure pages to capture that content.
---

## ENTERPRISELLM ARCHITECTURE

Design Patterns, Anti-Patterns, and System Workflows for Production Deployments

The Architect's Playbook

<!-- image -->

## Four Domains of Al Architecture

<!-- image -->

<!-- image -->

<!-- image -->

<!-- image -->

## The Architect's Hierarchy of Constraints

<!-- image -->

## Routing for Cost and SLA

Rule: Never default to real-time for asynchronous needs.

<!-- image -->

<!-- image -->

| Urgent Exceptions            | Real-timeMessagesAPI (High Cost, Instant Latency)              |
|------------------------------|----------------------------------------------------------------|
| Standard Workflows           | Message Batches API (50% Cost Savings)                         |
| Continuous Arrival (30h SLA) | Submitbatchesevery6hours containing documentsfrom that window. |

## Data Evolution Rule

multiplevalues,eachwithasourcelocationandeffectivedate,ratherthan overwriting original terms.Validatethis approachagainsttheproblem of extracting both original and amended contract clauses.

## Designing Resilient Schemas

## Anti-Pattern:FragileExpansion

Continuouslyexpanding enums asedgecases arise.

```
//Fragile Schema with Restricted Enum "type":"object", "properties":{ "property_type":{ "type":"string", "enum":["house"，"apartment"， "condo"，"townhouse"] 'required":["property_type"] //Fails validation: // "property_type":"studio" //"property_type":"converted warehouse" VALIDATION ERROR
```

Unexpected Types

<!-- image -->

## Architectural Pattern:Resilient Catch-Alls

Add anothervalue to the enum,pairedwithadetail string field.

<!-- image -->

```
//Resilient Schema with Catch-All "type":"object", "properties":{ "property_type":{ "type":"string", "enum":["house"，"apartment"，"condo"，"townhouse"，"other"] "property_type_detail":{ "type":""string", 'required":["property_type"] // Successfully processes: VALIDATION //"property_type":"other", SUCCESS //"property_type_detail":"studio" Data Captured
```

```
//Exavple Structore for Amended Fields "paywent_terns":[ {"value":"30 days"，"source":"0riginal Contract， Clause 4.1","effective_date":"2023-01-01"}， "value":"45 days"，"source":"Awendwent 1, Clause 2"，"effective_date":"2823-86-15"}
```

## Enforcing Mathematical Consistency

TheProblem:18%ofinvoiceextractionsshowlineitems thatdon'tmatchthegrand totalduetoOcRorextractionerrors.

<!-- image -->

## Schema Solution:Redundancy

```
"invoice_id":"12345", "line_items":[ {"description": "Item 1", "amount": 120.50 }, {"description":"Item2","amount":85.00}, {"description":"Item 3","amount":4.525} Derivedbymodel "calculated_total":210.025, summing items "stated_total":260.00, Extracteddirectly "currency": "UsD" frompage
```

```
The Solution:Schema Redundancy RoutingAction:Flag therecordforhumanreviewONLY when calculated_total!= stated_total
```

## Normalization and Null Handling

## BasePrompt

<!-- image -->

<!-- image -->

## Null Handling Instruction

## Problem:Plausible Hallucinations

Whenfieldsarenullable,modelsmayinvent plausible data (e.g.,attendee count:500) if not explicitly instructed.

Pattern:Add explicit prompt instructions to return null if not directly stated.

## Updated Prompt:

Extractattendeecountand materials.Ifattendee count or materials are not mentioned in the text, return "null".

## Corrected Output:

```
"attendee_count":null, // Correctly Handled "materials":"cotton blend"
```

<!-- image -->

<!-- image -->

## Format Normalization

## Problem:Inconsistent Formats

For materials("cottonblend"vs"Cotton/Polyester mix"),providefew-shotexamples showing2-3 complete input-output pairswith standardlzed formats.Do not rely on temperature O alone.

## Solution:Few-Shot Standardization

## FinalPromptwithExamples:

Extract attendee count and materials.lIf not mentioned,return"null'.Materials must be standardized. Examples: Input:Made of cotton blend."-&gt; Output: \"materials\":\"CottonBlend"} Input:"Cotton/Polyester mix"-&gt; Output: \"materials\":\"Cotton/Polyester Mix"} Final Output:

```
"attendee_count":null, "materials":"Cotton Blend"// Standardized
```

## The Limits of Automated Retry

The Pattern: Appending specific validation errors to the prompt and retrying resolves most failures in 2-3 attempts.

<!-- image -->

<!-- image -->

## Calibrating Human-in-the-Loop

## Requirement:

Automateextractionswithmodel confidence&gt;9o%.

## Implementation:

Have themodeloutputfield-levelconfidencescores.Ground this implementationdetail in thesolutionforreducingsemanticerrors.

<!-- image -->

<!-- image -->

Critical ValidationStep:Analyze accuracyby document typeandfield toverifyhigh-confidence extractions perform consistently across all segments, not just in aggregate, before deploying.

## Zero-Tolerance Compliance

The Trap: Relying on emphatic system prompts ("CRITICAL POLICY: NEVER process &gt;$500") still yields a 3% failure rate.

<!-- image -->

The Architectural Standard:

Implement an application-layer hook to intercept tool calls.

When the process amount exceedsthethreshold,block itserver-sideandinvoke escalation.

Model discretion isremoved.

## Resuming Asynchronous Sessions

resolution:24h"fromaprevioustoolcall).

<!-- image -->

TheSolution:Resumewithfull conversationhistory,butprogrammaticallyfilteroutprevioustool\_result messages.Keeponlyhuman/assistantturnssotheagentisforcedtore-fetchneededdatauponresumption.This ensuresreturningcustomersalwaysreceivefresh,currentinformation,preventingtheuseofstaledata.

## Tool Context Pruning

The Bloat: Repeatedly calling Lookup\_order fills the context window with verbose shipping and payment data when only the return status is needed.

<!-- image -->

<!-- image -->

## Graceful Tool Failure

<!-- image -->

## The Escalation Handoff

<!-- image -->

## ThePayload:Structured Summary

Do not dump raw transcripts.Pass a structured summary:Customer ID,Root Cause,Amount,Recommended Action.

```
"customer_id":"CUST-847392", "root_cause":"Duplicate charges due to gateway timeout.", "amount": "847.80 UsD", "recommended_action":"Approve refund for 847.00 usD and notify customer."
```

## CompressingLongSessions

updateacross48turns.Contextlimitsapproach.

<!-- image -->

NarrativeSummaryofResolvedIssues

FullVerbatimMessageHistory

- The Strategy:Summarize earlier, resolved turns into a narrative description, preserving the full messagehistoryverbatim onlyfor the active,unresolved issue.

CorrectPattern:Return the error message in the tool resultcontentwith theisError`flag settotrue.

ActiveIssue

## MCP Tool Specificity

The Trap:Providing a broad custom tool (analyze\_dependencies) alongside built-in tools like Grep. The agent defaults to Grep.

<!-- image -->

TheFixes

Split broad tools into highly granular, single-purpose tools.Enhance MCP tool descriptions to explicitly detail capabilities, expected outputs, and when to prefer them over text manipulation. This applies similarlyto adoptingcustomrefactoring toolsover standardBash/sed.

## Directed Codebase Exploration

Anti-Pattern:Using theRead tool tosequentiallyload thousandsof linesofcode.

<!-- image -->

## The Strategy: Start broad, then pinpoint.

## ForArchitecture(New Engineer,800+Files):

<!-- image -->

- ·Read CLAUDE.md/README first,thenaskthehuman engineerforpriorityfiles.

## For Intermittent Bugs (Tracing Errors):

<!-- image -->

- ·Have the agent dynamically generate investigation subtasksbasedonwhatit discovers ateach step, adapting theplanas new errors emerge.

## Branching Reality

The Problem: Exploring two distinct refactoring approaches or testing strategies in asinglethreadconfuses theagent and mixescontext.

BranchA:MicroserviceExtraction

<!-- image -->

## The Command:

Use fork\_session to create two separate branches from a foundational analysis.This allows independent，deep exploration of A/B scenarios without context contamination.

## TheScratchpadPattern

The Decay: In extended exploration sessions (30+ mins), accumulated token bloat causes the agent to give

<!-- image -->

decisions.Itreferences thisdense,structured fileforsubsequentquestions.

## Resumption in Dynamic Environments

The Scenario: An engineer resumes an exploration session, but 3 of the 12 files the agent read yesterday have been altered by a teammate's PR.

<!-- image -->

## The Action

Resumethesessionfromitsprevioustranscript,butexplicitlyinformtheagentwhichspecificfilesorfunctionschangedfortargetedre- resume\_session --update\_context={files:['File C','File D'，'File E'],changes:'renamed utility functions'}

## Shared Memory Architecture

Anti-Pattern: Daisy-chaining full conversation logs between subagents. This scales token costs exponentially.

<!-- image -->

## Forcing Execution Order

## The Problem:

An agentneedstoextractmetadatabeforecalling enrichmenttools,butoccasionallycallsenrichment tools first,leading to failures.

```
工 2 "model":"claude-3-opus-20240229" 3 "max_tokens": 1024, 4 "messages":[ 5 {"role":"user","content":"Extract metadata from this paper and then look up its DoI."} 6 L. 7 "tools":[ 8 {"name": "extract_metadata", "description": ".. 6 {"name": "lookup_citations", "description": "... 10 11 "tool_choice":{"type":"tool" "name":"extract_metadata"} 12
```

## The Enforcement:

Do not rely on prompt begging. Use the APl's constraints. Set tool\_choice for the first APl call happensbeforeanyDol lookuporenrichment.

## Structured Intermediate Representations

The Loss: Passing raw text from financial and news agents to a synthesis agent results in tables losing clarity and news losing narrative flow.

<!-- image -->

mappings that the synthesis agent is instructed topreserve.

## Parallelization & Caching

<!-- image -->

## Goal-Oriented Delegation

The Trap: Giving a web search subagent detailed step-by-step procedural instructions causes it to fail rigidly on emerging topics or miss tangential sources.

<!-- image -->

## The Architect's Approach:

Specifyresearchgoalsandqualitycriteriaratherthanproceduralsteps Letthespecializedsubagentdetermineitsownsearchstrategy.Keep tool interfaces generic but add enum parameters (e.g., analysis\_type:extraction|summarization)toguidebehavior.

```
tool:'analyze_document', params:{ analysis_type:'extraction'|'summarization'
```

## The Architect's Reference Matrix

<!-- image -->

|                    | Data Extraction   | Customer Support     | Developer Productivity   | Multi-Agent               |
|--------------------|-------------------|----------------------|--------------------------|---------------------------|
| Token Bloat        |                   | Filter Stale Results | Scratchpad File          | Shared Vector Store       |
| Latency            | Batch Routing     |                      |                          | Parallelization & Caching |
| Compliance/Control |                   | App-Layer Intercepts |                          | tool_choice Enforcement   |
| Accuracy           | Schema Redundancy |                      | Granular MCP Tools       | Structured Intermediates  |

## The Production Architecture Blueprint

<!-- image -->
