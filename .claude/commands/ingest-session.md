---
description: Ingest a Slay the Cert session log back into the vault (raw archive + weakness queue + game log append).
---

Ingest a **Slay the Cert** game-session JSON back into the vault, turning the in-game session into lasting study artifacts.

## Expected input

The user has just downloaded a file named `slay-the-cert_<cert-id>_<mode>_<timestamp>.json` from the game's Campaign Complete or Death screen. They will paste its absolute path (or drop it into the Claude Code session as an attachment).

The file's shape is `SessionLog` (see `public/dungeon/src/types.ts`):
```
{
  schema_version: 1,
  cert_id, mode,
  started_at, ended_at, result,
  bosses_defeated: [...],
  spells_cast: [...],
  questions: [{ question_id, domain, was_correct, time_elapsed_ms, flagged_for_review }],
  total_correct, total_wrong,
  final_hero_hp
}
```

## Steps

1. **Read the JSON.** Validate `schema_version === 1` and that `cert_id` matches a folder under `certs/`. If not → tell the user and stop.

2. **Preview.** Summarise what you're about to write:
   - How many questions will be queued for review (count of `was_correct=false` PLUS `flagged_for_review=true`, deduped by question_id)
   - Which bosses_defeated will be appended to game-log
   - The target raw archive path

3. **Approve gate.** Show the user the three proposed writes. Wait for `y/n/skip` per file (per CLAUDE.md: Claude never silently modifies the vault).

4. **On approve, write:**
   a) `raw/game-sessions/<YYYY-MM-DD-HHMMSS>.json` — immutable copy of the input (where the timestamp comes from `started_at`, sanitized same as the filename).
   b) Append to `certs/<cert_id>/game-log.md`:
      ```
      ## <YYYY-MM-DD HH:MM> - <mode> - <result>
      - Bosses defeated: <count>/5 (<csv of ids>)
      - Correct: <total_correct> / <total_correct + total_wrong> (<percent>%)
      - Final HP: <final_hero_hp>/3
      - Spells cast: <csv>
      - Source: raw/game-sessions/<file>
      ```
      Create the file with a YAML-exempt header comment if missing (the CLAUDE.md schema marks this file as "System-generated; exempt from frontmatter lint").
   c) For each question_id in the "to queue" set, append to `certs/<cert_id>/weakness-queue.md`:
      ```
      - [ ] <question_id> (<domain>, <wrong|flagged>) - <source_note from questions.json>
      ```
      Look up the `source_note` by loading `public/questions.json` and finding the matching id. Skip cleanly if not found.
      Deduplicate: if the question_id already appears in weakness-queue.md (checked or not), skip; don't create duplicate entries.

5. **Update `index.md`** (per CLAUDE.md: Claude updates index on captures/lints): add a line under the cert's section noting the new raw archive entry. Approve-gated.

6. **Report.** Tell the user:
   - Questions added to weakness queue: N
   - Game log updated: yes/no
   - Raw archive: path

## Safety

- **Immutability:** once written, `raw/game-sessions/*.json` is read-only. Do not modify existing session files.
- **No silent overwrites:** if a session file with the same timestamp already exists, warn and use `-<n>` suffix.
- **Frontmatter lint exemption:** `game-log.md` is exempt per CLAUDE.md's schema table.

## Why this exists

The compound-knowledge loop: the game surfaces which questions the player struggled with. /ingest-session turns that into a persistent weakness queue that `/quiz --review-weak` can re-drill against, and a raw archive of the full session for future `/tutor` context. No game data is lost to localStorage decay.
