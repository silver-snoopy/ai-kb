---
cert: cca-f
domain: domain-3-prompt-engineering
status: done
source: 2026-04-18-cca-f-exam-guide
tags: [seeded, official, sample-questions]
---

# Official Sample Questions — Domain 3 (vault) / Domain 4 (exam guide): Prompt Engineering & Structured Output

Verbatim from the official CCA-F exam guide (`raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md`). These are the sample questions whose primary tested domain (per the exam guide's numbering) is Prompt Engineering & Structured Output.

```question
id: official-domain-3-prompt-engineering-01
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Scenario: Claude Code for Continuous Integration.

  Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?
options:
  A: Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.
  B: Switch both workflows to batch processing with status polling to check for completion.
  C: Keep real-time calls for both workflows to avoid batch result ordering issues.
  D: Switch both to batch processing with a timeout fallback to real-time if batches take too long.
correct: A
explanation: |
  The Message Batches API offers 50% cost savings but has processing times up to 24 hours with no guaranteed latency SLA. This makes it unsuitable for blocking pre-merge checks where developers wait for results, but ideal for overnight batch jobs like technical debt reports. Option B is wrong because relying on "often faster" completion isn't acceptable for blocking workflows. Option C reflects a misconception—batch results can be correlated using custom_id fields. Option D adds unnecessary complexity when the simpler solution is matching each API to its appropriate use case.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```

```question
id: official-domain-3-prompt-engineering-02
domain: domain-3-prompt-engineering
difficulty: medium
stem: |
  Scenario: Claude Code for Continuous Integration.

  A pull request modifies 14 files across the stock tracking module. Your single-pass review analyzing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback—flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?
options:
  A: Split into focused passes, analyze each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.
  B: Require developers to split large PRs into smaller submissions of 3-4 files before the automated review runs.
  C: Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.
  D: Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs.
correct: A
explanation: |
  Splitting reviews into focused passes directly addresses the root cause: attention dilution when processing many files at once. File-by-file analysis ensures consistent depth, while a separate integration pass catches cross-file issues. Option B shifts burden to developers without improving the system. Option C misunderstands that larger context windows don't solve attention quality issues. Option D would actually suppress detection of real bugs by requiring consensus on issues that may only be caught intermittently.
source-note: raw/anthropic-docs/2026-04-18-cca-f-exam-guide.md
```
