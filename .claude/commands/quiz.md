---
description: Short conversational quiz with immediate feedback and save-to-weakness-queue. 5-20 questions.
argument-hint: <cert-id> <domain-id> [<topic>] [--count N]
---

# /quiz — short quiz with immediate feedback

**Arguments:** `<cert-id>` `<domain-id>` `[<topic>]` `[--count N]`

Default count: 10. Topic is optional (if absent, quiz the whole domain).

## What to do

1. Parse `$ARGUMENTS`. Require `<cert-id>` and `<domain-id>`. Parse optional `<topic>` and `--count N` (default 10).
2. Load via `obsidian-mcp`: `CLAUDE.md`, `certs/<cert-id>/meta.yaml`, all files under `certs/<cert-id>/<domain-id>/`.
3. Generate N questions grounded in the loaded notes. Mix:
   - Multiple-choice (4 options)
   - "Which of these is WRONG?" negatives
   - Short-answer (user types a phrase or pattern name)
4. Present questions one at a time. Use this format for MCQs:
   ```
   Q<n>/<N>: <question text>

   A) <option>
   B) <option>
   C) <option>
   D) <option>
   ```
5. Wait for user answer.
6. Give immediate verdict in this format:
   ```
   ✓ Correct!  (or ✗ Incorrect — answer was <letter>)

   Explanation: <2-4 sentences referencing the vault note that grounds this>
   Source note: <path/to/file.md>
   ```
7. **On every incorrect answer, prompt:**
   ```
   Save to weakness queue? [y/n/skip]
   ```
   If `y`: append to `certs/<cert-id>/weakness-queue.md` as a checkbox list item:
   ```markdown
   - [ ] **[<domain-id>]** <question stem>
     - Your answer: <letter> (<option text>) — wrong
     - Correct: <letter> (<option text>)
     - Explanation: <2-3 sentences>
     - Saved: <YYYY-MM-DD>
     - Source: <path to note>
   ```
8. After all N questions, write a session summary:
   ```
   📊 Quiz summary — <cert>/<domain> · <topic if any>
   - <correct>/<N> correct (<pct>%)
   - <saved> questions saved to weakness queue
   - Weakest sub-topic: <if detectable>
   ```

## Invariants

- Every question grounded in a specific note (cite it in the explanation).
- Weakness-queue format is plain markdown checkboxes; `/quiz --review-weak` grep-parses unchecked items and re-drills them.
- Never modify notes themselves from `/quiz` (only the weakness queue).

## Usage examples

```
/quiz cca-f domain-1-agentic
/quiz cca-f domain-4-mcp "tool schema design"
/quiz cca-f domain-2-claude-code --count 5
```
