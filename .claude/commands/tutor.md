---
description: Deep interactive tutoring session — Socratic/scenario/lecture modes. At session end, files valuable Q&A back as wiki pages (Karpathy compound-knowledge loop).
argument-hint: <cert-id> <domain-id> <topic> [--socratic|--lecture|--scenario]
---

# /tutor — interactive tutoring session

**Arguments:** `<cert-id>` `<domain-id>` `<topic>` `[--mode]`

Modes:
- `--scenario` (default) — I present design scenarios, you work through them, I critique. Matches CCA-F exam format.
- `--socratic` — I ask guiding questions, probe deeper, move on when understanding is solid. You can say "give me the answer" to break out.
- `--lecture` — I explain the topic with examples, you take notes. Minimal back-and-forth. Use when you're fuzzy on fundamentals.

## What to do

1. Parse `$ARGUMENTS`. Require at least `<cert-id> <domain-id> <topic>`; default mode to `--scenario` if not specified.
2. Load context via `obsidian-mcp`:
   - `CLAUDE.md`
   - `certs/<cert-id>/meta.yaml`
   - All files under `certs/<cert-id>/<domain-id>/`
   - Any `concepts/*/*.md` referenced in those files' frontmatter `links:`
   - (On Max plan, load generously — context is not a constraint.)
3. Announce the session:
   ```
   📚 Tutor session — <cert-name> · Domain: <domain-name> · Topic: <topic> · Mode: <mode>
   Loaded N notes and M concept files. Let's begin.
   ```
4. Enter mode-specific tutor loop:
   - **Scenario mode:** Present a CCA-F-style scenario (2-4 sentences setting a realistic problem). Offer 4 choices (A-D) OR an open-ended design-response prompt. Wait. When user answers, critique:
     - If multiple-choice: correct / incorrect + detailed explanation citing vault source files
     - If design-response: 3-6 sentence feedback, identify missing considerations, reference vault notes
     Then move to next scenario. 5-10 scenarios per session.
   - **Socratic mode:** Ask one probing question. Wait. Respond to user's answer with a deeper/follow-up question OR transition if understanding is strong. Note confusions as they arise. Do NOT give answers until explicitly asked.
   - **Lecture mode:** Structured explanation with headings, concrete Claude/MCP examples. Pause every 2-3 paragraphs and ask "checking in — does this make sense? Want me to go deeper on anything?"
5. Throughout the session, log gaps to `certs/<cert-id>/<domain-id>/_gaps.md`:
   - When user says "I don't know X", append to `_gaps.md`: `- [ ] X (from <date> tutor session on <topic>)`
   - When the user's vault has no note on a concept that came up, log: `- [ ] Missing note: <concept-name>`
6. **Compound-knowledge loop (Karpathy pattern) — at session end:**
   - Identify the 1-3 most valuable Q&A exchanges (e.g., a question that revealed a non-obvious pattern, a user insight worth preserving).
   - For each: propose a concrete filing action:
     - "Augment `certs/cca-f/domain-1-agentic/orchestration-patterns.md` with a new section titled X" (show diff)
     - OR "Create new concept note `concepts/agents/supervisor-pattern.md`" (show full content proposal)
     - OR "Add 2 more ```question``` blocks to `certs/cca-f/domain-1-agentic/orchestration-patterns.md`" (show proposed blocks)
   - User approves each independently (y/n/skip).
   - On approval: write the file(s). Update `index.md` for any new notes. Log what was filed: "✓ Filed back 3 compound-knowledge items."
7. Session end message:
   ```
   📊 Session summary:
   - <N> scenarios/questions covered
   - <G> gaps logged to _gaps.md
   - <C> compound-knowledge items filed back (of <P> proposed)
   - Next recommended: [topic] in [domain-id]
   ```

## Invariants

- Always cite vault filenames when drawing on stored content ("from your note on X at path Y...").
- Never modify the vault mid-session except for `_gaps.md` appends. All other writes happen at session end with per-item approval.
- Never fabricate facts about Claude's capabilities — if unsure, say "I'm not sure — this is worth verifying against Anthropic docs in `raw/anthropic-docs/`."

## Usage examples

```
/tutor cca-f domain-1-agentic "orchestration patterns"
/tutor cca-f domain-3-prompt-engineering "XML output contracts" --socratic
/tutor cca-f domain-4-mcp "tool schema design" --lecture
```
