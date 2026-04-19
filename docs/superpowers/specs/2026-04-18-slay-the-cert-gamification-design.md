# Slay the Cert — Gamification Layer Design

**Date:** 2026-04-18
**Author:** User + Claude (brainstorming session)
**Status:** Draft pending user approval
**Working title:** Slay the Cert
**Timing:** Design locked now. **Build deferred to post-CCA-F** (after 2026-05-31). The KB architecture is updated now so the game can slot in without rework when built.

**Related documents:**
- Research: [`docs/superpowers/research/2026-04-18-gamification-research.md`](../research/2026-04-18-gamification-research.md)
- Parent KB spec: [`docs/superpowers/specs/2026-04-18-ai-cert-kb-design.md`](./2026-04-18-ai-cert-kb-design.md)

---

## 1. Overview

### 1.1 Goal

A 16-bit browser-based turn-based dungeon-crawler RPG with Souls-like elements that wraps the KB's question bank into a warlock's descent through the **Tower of Trials**. Each cert is a campaign; each exam domain is a floor; each floor's boss asks the cert's questions from that domain. Correct answers wound the boss; wrong answers wound the hero. Defeating every boss earns a Golden Parchment of Quest Completion (symbolic cert pass) plus cosmetic rewards and unlocks an Eternal Dungeon mode.

### 1.2 Non-goals

- Not multiplayer.
- Not a replacement for `/quiz` / `/mock-exam` — the game is an alternate interface for retention sessions, not the primary study tool.
- Not authoring-focused — the user authors questions as structured blocks in Obsidian notes; the game consumes a pre-built `questions.json`.
- No authentication or server-side state. Pure client-side browser game.
- No real-money monetization.
- No content moderation — public guests play published questions as-is.
- Not a community/social platform.

### 1.3 Success criteria

1. First-run playthrough (5 bosses, progressive mode) completed end-to-end in under 60 minutes with Golden Parchment earned.
2. Deploys as a subfolder of the existing Quartz site; URL `<user>.github.io/ai-kb/dungeon/` works on desktop + mobile + the locked-down work-laptop browser.
3. Vault round-trip works: play a session, download JSON, run `/ingest-session`, observe new entries in `weakness-queue.md` and `raw/game-sessions/`.
4. Guest-plays-it: an unauthenticated visitor can complete a full run, download their session JSON, see their progress persist in localStorage across visits.
5. Zero game-side writes to the user's vault without explicit user action (download + slash command).
6. `questions.json` is gated by the Quartz build — malformed question blocks fail the build, not the runtime.
7. Replayability is real: NG+ and NG++/NG+++ are genuinely distinct (different spells, harder bosses, shuffled boss order in Eternal Dungeon).

---

## 2. Requirements (confirmed with user)

| # | Requirement | Source |
|---|---|---|
| R1 | 16-bit dungeon-crawler aesthetic with Souls-like difficulty feel and turn-based combat | User original brief |
| R2 | Warlock protagonist, 3 HP, quest for a relic that reveals the Golden Parchment | User original brief |
| R3 | Each cert domain = one boss = one floor. 5 floors for CCA-F. | User original brief |
| R4 | Correct answer = boss takes damage; wrong answer = hero takes damage. HP 0 = run restart. | User original brief |
| R5 | Spellbook-style upgrade system; spells drop from bosses; one-time use per run | User choice (Q3 = A) |
| R6 | Learning-first principle: no spell or passive may reduce the knowledge work of the question | User explicit direction |
| R7 | Meta-progression hybrid: progressive campaign default + Eternal Dungeon after first clear | User choice (Q4 = D) |
| R8 | Random boss order per campaign (per run in Eternal Dungeon) | User direction |
| R9 | Prize bundle: Golden Parchment + Archmage Title + Eternal Dungeon unlock. **No permanent passives.** | User direction |
| R10 | Interstitials between floors: Narrative → Recall → Primer (3 beats, all always present) | User direction |
| R11 | Public-by-default: guests can play fully; vault-owner has a separate `/ingest-session` command to apply results | User direction |
| R12 | Write-back via JSON download at session end; no File System Access API dependency | User direction |
| R13 | Question data comes from structured `` ```question `` blocks in vault notes (authored during CCA-F study) | KB spec Option A decision |
| R14 | Full browser-side game with real 16-bit visuals, chiptune audio — "Slay the Spire" quality | User scope D |
| R15 | Timing: design now, build post-exam | User E |

### 2.1 Budget

- **Asset budget:** $0. All visual and audio assets must be CC0 (public domain / equivalent) — no CC-BY-SA (viral share-alike license).
- **Deployment:** free (GitHub Pages, shared with Quartz site).
- **Build time:** 10–15 days estimated (research + spec §3.4). Entirely post-exam.

---

## 3. Architecture

### 3.1 Tech stack

| Component | Choice | Why |
|---|---|---|
| Game engine | **Phaser 3** (pinned to v3.90.0 "Tsugumi", MIT licensed) | Mature, widely-used browser 2D framework; TypeScript support first-class; abundant tutorials; Phaser 4 still RC — avoid |
| Language | **TypeScript** | Type-safety for the question schema; same language family as Quartz (toolchain consistency) |
| Build tool | **Vite** | Fast dev loop; official Phaser 3 + TS + Vite templates exist |
| Rendering | WebGL via Phaser with canvas fallback | Phaser handles automatically |
| Audio | **Howler.js** (optional) or Phaser built-in sound | Cross-browser audio with good looping + cross-fade |
| State persistence | `localStorage`, keyed by cert ID | No server; survives page reloads; per-browser per-device |
| Question data | `public/dungeon/data/questions.json` | Built from vault via `scripts/build-questions.mjs` during Quartz CI |
| Deployment | Quartz site subfolder at `public/dungeon/` | Same GitHub Pages deploy; accessible at `<user>.github.io/ai-kb/dungeon/` |
| Write-back | JSON download → user runs `/ingest-session <path>` in Claude Code | Pure browser + user-invoked command; works for guests and vault-owner |

### 3.2 Deployment topology

```
 GitHub repo: ai-kb/
 │
 ├── quartz/                       # existing Quartz site
 ├── public/
 │   └── dungeon/                  # NEW — Phaser game output
 │       ├── index.html
 │       ├── assets/
 │       │   ├── sprites/          # CC0 Kenney + OpenGameArt
 │       │   ├── audio/            # CC0 chiptunes + SFX
 │       │   └── tiles/
 │       ├── data/
 │       │   └── questions.json    # generated by build-questions.mjs
 │       └── dist/                 # Vite build output
 │
 └── .github/workflows/quartz-deploy.yml   # MODIFIED — builds game before Quartz
```

GitHub Pages serves:
- `/` — Quartz site
- `/dungeon/` — game (clean URL from any browser)
- `/raw/`, `/.claude/`, `/docs/` — still ignored per Quartz ignorePatterns
- `/dashboard.md` — rendered by Quartz as a page

### 3.3 Why not alternatives

- **RPG.js** — higher-level RPG engine, less community adoption, unnecessary for our scope. Phaser 3 is the right level of abstraction.
- **Pixi.js alone** — lower-level than Phaser, would require hand-rolling scene management and input. Unnecessary effort.
- **PICO-8** — fantasy console with unique charm but requires its own runtime on the player side. Breaks the "runs in any browser" requirement.
- **Native app (Electron/Tauri)** — overkill; breaks the work-laptop browser-only constraint.
- **Bitsy** — too limited for turn-based combat mechanics.

---

## 4. Dungeon structure — the Tower of Trials

### 4.1 Layout

**5 floors, randomized order, one boss per cert domain.** At campaign start (progressive mode) or per-run (Eternal Dungeon), the 5 bosses are shuffled into floor positions. The Warlock *descends* — classical dungeon-crawler trope.

```
                    ┌───────────────────────────────┐
                    │  🏰 Gates of the Archive      │  Hub
                    │     Spellbook, loadout,       │
                    │     campaign progress, exit   │
                    └───────────────┬───────────────┘
                                    ▼
Floor 1 (random boss) ─── Boss defeat → Spell charge or drop
                                    ▼
                              Interstitial
                                    ▼
Floor 2 (random boss) ─── Boss defeat → Spell charge or drop
                                    ▼
                              Interstitial
                                    ▼
                       ... (Floors 3, 4, 5) ...
                                    ▼
                    ┌───────────────────────────────┐
                    │  📜 Golden Parchment          │
                    │  🎖️ Archmage Title             │
                    │  🗝️ Eternal Dungeon unlocked   │
                    └───────────────────────────────┘
```

### 4.2 Bosses (one per CCA-F domain)

| Boss | Domain | Weight | Theme |
|---|---|---:|---|
| **The Orchestrator** | Agentic Architecture & Orchestration | 27% | "I dispatch legions. Prove you can read the patterns." Throne hall with moving chess-piece attendants. |
| **The Compiler-King** | Claude Code Configuration & Workflows | 20% | "Your configs will fail." Iron-bound workshop; sigils of command syntax. |
| **The Grammarian** | Prompt Engineering & Structured Output | 20% | "Precision is my domain." Library of carved stone scrolls; every word weighed. |
| **The Tool-Smith** | Tool Design & MCP Integration | 18% | "Schemas are sacred." Forge surrounded by schemas-as-runes. |
| **The Memory-Kraken** | Context Management & Reliability | 15% | "Everything drowns eventually." Flooded archive — context windows visualized as sinking shelves. |

**Floor themes** (visual + audio atmosphere) match the boss. **Question difficulty** tilts **within a boss encounter** (not by floor position, which is randomized): easier questions from that domain come first, harder as the boss's HP approaches 0.

### 4.3 Boss HP table

| Run mode | Boss HP | Hero HP | Max questions per fight |
|---|---|---|---|
| First run (progressive) | 5 | 3 | 7 |
| NG+ (after first clear, progressive continues) | 7 | 3 | 9 |
| NG++ (Eternal Dungeon unlocked) | 10 | 3 | 12 |
| NG+++ (Eternal + boss quirks) | 10 | 3 | 12, with per-boss rule variations |

### 4.4 Random boss order mechanics

- **Progressive mode:** order shuffled once at campaign start, fixed for the duration of that cert's campaign. If you die at floor 3, you return to floor 3 on the same boss.
- **Eternal Dungeon (NG++/NG+++):** order reshuffled on every run. Death = restart from floor 1 with a new shuffle.
- **Seed:** use a pseudo-random seed stored in the save so reloading preserves the shuffle.

---

## 5. Combat mechanics

### 5.1 Turn structure

```
BOSS FIGHT — <Boss name> (Floor <n>)
──────────────────────────────────────────────────────────
Boss HP:   ❤️❤️❤️❤️❤️ (5)         Your HP: ❤️❤️❤️ (3)
Spellbook: [Echo] [Study the Tome] [Memorize]
──────────────────────────────────────────────────────────
Q<i>: <question stem from the vault>

  A) <option>
  B) <option>
  C) <option>
  D) <option>

  [Cast spell] [Submit answer]
──────────────────────────────────────────────────────────
```

**Turn flow per question:**

1. Game pulls a random question from the boss's domain pool (`questions.json`), difficulty-weighted by floor progression.
2. Player may optionally cast one spell from their loadout **before** submitting.
3. Player selects A/B/C/D.
4. **Resolution:**
   - **Correct:** deal 1 damage to boss (+1 with Amplify = 2, +2 with Doubleshot = 3). Hit SFX + boss sprite flinch animation. Damage number floats up.
   - **Incorrect:** lose 1 HP. No modifiers — this cost is fixed by design invariant R6. Miss SFX + hero flinch + screen shake. Explanation text shown (from question block's `explanation` field). Prompt: "Add to weakness queue? [Yes / No]".
5. If boss HP > 0 and hero HP > 0: next question.
6. If boss HP = 0: victory (spell charge/drop + interstitial).
7. If hero HP = 0: death (return to checkpoint in progressive mode; restart from floor 1 in Eternal Dungeon).

### 5.2 Damage + HP invariants

- **Base damage per correct answer:** 1.
- **Damage modifiers (Amplify, Doubleshot):** apply to next correct answer, consumed on use.
- **HP loss per wrong answer:** 1. **No spell, item, or mode ever changes this cost.** This is the load-bearing learning invariant.

### 5.3 Maximum encounter length

- Default: 5 + 3 − 1 = 7 questions (either boss dies at 5 correct, or hero at 3 wrong).
- NG+: 7 + 3 − 1 = 9.
- NG++/NG+++: 10 + 3 − 1 = 12.

---

## 6. Spellbook

### 6.1 Design filter (invariant R6)

Every spell must satisfy at least one of:
- (a) Change pacing/strategy **without reducing knowledge work** (e.g., accelerate damage on correct answers)
- (b) Add a study mechanic (reinforce retention, surface context, connect to real-world review queue)
- (c) Create a generative-retrieval moment (recall prior questions)

**Forbidden categories:**
- Distractor dimming / answer reveals
- HP regeneration or damage mitigation
- Skip-with-no-consequence
- Free retries on the knowledge check

### 6.2 First-run spells (learning-only)

| Spell | Effect | Starting charges |
|---|---|---|
| **Echo** | Next question is a retake of a previously-asked question in this fight (random selection from this fight's history) | 1 |
| **Study the Tome** | Before next question, show a 3-sentence primer from the source note — context only, no answer | 1 |
| **Memorize** | No combat effect. Adds current question to `weakness-queue.md` (via session log → `/ingest-session`). | 1 |

**Boss defeat reward (first run):** +1 charge to a spell of the player's choice. Over 5 bosses: ~7 total spell uses available per campaign.

**Loadout:** all 3 spells always equipped. No strategic loadout choice in first run.

### 6.3 NG+ unlock — **Amplify**

- Effect: next correct answer deals **2 damage** instead of 1.
- Loadout: **3 slots** from 4 available (strategic choice emerges here).
- Boss HP: 7.
- NG+ clear → unlock Doubleshot.

### 6.4 NG++ unlock (Eternal Dungeon) — **Doubleshot**

- Effect: next correct answer deals **3 damage**.
- Loadout: 3 slots from 5 available.
- Boss HP: 10.
- Death = restart from floor 1 (roguelite; random boss reshuffle per run).
- Clear → unlock Focus.

### 6.5 NG+++ unlock — **Focus**

- Effect: next question gets a 15-second contemplation phase (shown without answer options for 15s, then options appear).
- Loadout: 3 slots from 6 available.
- Per-boss rule variations (e.g., Memory-Kraken hides option letters; Compiler-King questions use code-snippet format).

### 6.6 Dropped spell categories (for reference)

**Rejected during design per invariant R6:** Ethereal Sight (distractor dim), Scholar's Insight (source reveal), Time Fracture/Banish (consequence-free skip), Rune of Memory (+HP), Resolve (free retry).

---

## 7. Meta-progression

### 7.1 Progressive campaign (default)

- First death on floor N: return to floor N with full HP but with spells consumed this run. Boss HP same as when you started the floor.
- Spells collected persist across deaths.
- Each boss defeated remains defeated for the campaign.
- Campaign ends on Parchment OR on giving up (user can explicitly reset campaign from the Archive hub).

### 7.2 Rewards (on first clear)

1. **📜 Golden Parchment of Quest Completion** — permanent display in the Archive hub. Shows final stats: correct/total, total time, spells cast, deaths, date.
2. **🎖️ Archmage Title** — cosmetic: warlock sprite gets a robe color variant + a title banner.
3. **🗝️ Eternal Dungeon unlocked** — new game mode available from the Archive hub.

**No permanent passive effects.** The Relic concept was considered and rejected per invariant R6.

### 7.3 Eternal Dungeon (post-first-clear replay mode)

- Random boss reshuffle per run.
- Death = full reset (return to floor 1 with fresh hero HP, spellbook intact).
- Boss HP scales per NG tier (10 in NG++, 10 + quirks in NG+++).
- Each clear unlocks one additional spell (Doubleshot → Focus).
- Leaderboard: per-cert high scores stored in localStorage (personal best tracking, no server).

---

## 8. Interstitials — "The Descent"

Between every pair of floors, a 60–90 second sequence with **3 beats in fixed order**:

### 8.1 Beat 1 — Narrative (10–15s)

16-bit walking animation: warlock sprite walks down a stone corridor toward next floor. 1–2 sentences of atmospheric text. Environmental lore hinting at the next boss's theme.

**Example** (after The Orchestrator, walking toward The Grammarian):
> "The stone shifts. Walls covered in annotated sigils — each one tagged, typed, strictly delimited. You feel a cold grammatical presence ahead."

### 8.2 Beat 2 — Recall (20–40s)

One question pulled at random from a **previously-defeated** floor's question pool. Non-damaging.

- **Correct:** "Your memory holds." → +1 charge of a random spell OR (if all at max) +10 "arcane residue" score points.
- **Incorrect:** "The memory fades." → no HP penalty. Optional flag: append this question to the session's weakness queue (written to vault via `/ingest-session`).

**Cognitive-science rationale:** spaced retrieval of prior material is one of the highest-impact retention techniques. The interstitial makes this mechanical.

### 8.3 Beat 3 — Primer (20–30s)

A short lore-flavored explanation of one concept from the **upcoming** boss's domain. Read-only — no question, just exposure. Pulled from a vault concept note (e.g., `concepts/prompt-engineering/xml-structure.md`), dressed in lore voice.

**Example** heading into The Grammarian:
> "Ancient scholars etched their prompts into stone. Structure mattered: tags were sacred, instructions preceded example blocks, XML wrapped uncertainty. The Grammarian remembers every error."

**Bidirectional benefit:** your real notes become the game's lore. Authoring concept notes in Obsidian means authoring the Tower's atmospheric text.

### 8.4 Interstitial implementation notes

- All 3 beats always present — no skipping in MVP.
- Primer content: first 3–5 sentences of the concept note, reformatted with lore substitutions (e.g., "Claude" → "the Sage").
- Recall question pool: aggregate all questions from previously-defeated floors in this campaign.
- **Edge case — first interstitial:** interstitials run **between** floors (never before floor 1), so the Recall pool always has at least one boss's worth of questions by the time a Recall beat fires. No special handling needed.

### 8.5 Deferred to post-launch (noted, not in MVP)

- Slay-the-Spire-style choice events (touch-the-sigil? yes/no dilemmas). Max a "Day N" feature per user direction.

---

## 9. Content pipeline

### 9.1 `scripts/build-questions.mjs`

New Node script (built post-exam), same toolchain as `dashboard.mjs`. ~100 lines.

**Input:** vault markdown files under `certs/*/domain-*/` with fenced `` ```question `` blocks.

**Output:** `public/dungeon/data/questions.json`.

**Pipeline hook:** runs as a pre-build step in `.github/workflows/quartz-deploy.yml`. A new job step before Quartz build.

**Validation:** fails the build (non-zero exit) if any question block has missing required fields (`id`, `stem`, `options.A-D`, `correct`, `explanation`). This keeps the game's question data always valid — bad authoring surfaces as a deploy failure, not a runtime crash.

### 9.2 Question block schema (canonical)

Embedded in vault notes under `certs/<cert-id>/<domain-id>/*.md`:

````markdown
```question
id: <cert-id>-<domain-id>-<topic-slug>-<nn>
domain: <domain-id>
difficulty: easy | medium | hard
stem: |
  <scenario text, 2-6 sentences>
options:
  A: <option text>
  B: <option text>
  C: <option text>
  D: <option text>
correct: <letter>
explanation: |
  <2-4 sentences of why correct is correct + why distractors fail>
source-note: <path to the note this question lives in>
```
````

### 9.3 Output JSON schema (abbreviated)

```json
{
  "generated_at": "2026-05-20T08:00:00Z",
  "cert_id": "cca-f",
  "cert_name": "Claude Certified Architect — Foundations",
  "total_questions": 147,
  "domains": [
    {
      "id": "domain-1-agentic",
      "name": "Agentic Architecture & Orchestration",
      "weight": 0.27,
      "questions": [
        {
          "id": "...",
          "difficulty": "medium",
          "stem": "...",
          "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
          "correct": "B",
          "explanation": "...",
          "source_note": "certs/cca-f/domain-1-agentic/orchestration-patterns.md"
        }
      ]
    }
  ]
}
```

---

## 10. Write-back flow

### 10.1 Client-side (game)

- All run state in browser `localStorage` keyed by cert ID.
- At session end (victory, death, or explicit quit): "📜 Download session log" button.
- Downloaded JSON is named `<cert>-<YYYY-MM-DD-HHMM>-<result>.json`.
- Contains: questions asked + answers + correct answers, spells cast, HP timeline, time-per-question, missed questions user flagged for review, final status.

### 10.2 Vault-side (`/ingest-session` command)

New slash command `.claude/commands/ingest-session.md` — authored when game ships. Stub reserved in the current KB spec.

**Args:** `<path-to-session-json>`

**Flow:**
1. Validate JSON schema.
2. For each question flagged "add to weakness queue" during the session: append to `certs/<cert-id>/weakness-queue.md` in Yanki format.
3. Save raw JSON to `raw/game-sessions/<date>-<slug>.json`.
4. Append summary row to `certs/<cert-id>/game-log.md`.
5. Report counts.

### 10.3 Guest experience

- Guests play the full game in their own browser.
- Same download button at session end.
- Guests do NOT have `/ingest-session`. They keep the JSON locally or discard.
- Progress persists in their localStorage across visits (per browser, single save slot).
- All mechanics (NG+/NG++/NG+++, Eternal Dungeon) work identically for guests.
- **Shared-browser caveat:** multiple guests sharing a browser share a single localStorage save slot; no per-user isolation in MVP. An explicit "Reset progress" button in the Archive hub lets a new guest start clean. Low-severity limitation for casual public play.

---

## 11. Visual and audio assets

### 11.1 Aesthetic reference

SNES/GBA-era dungeon-crawler style. Influences: Secret of Mana, Castlevania: Symphony of the Night (palette), Dark Souls (atmospheric writing, "YOU DIED" beat). Color-rich 16-bit sprites, dark palettes for dungeon floors with per-boss color themes, chunky UI with scroll-style banners.

### 11.2 Verified asset sources (all CC0)

**Visual — Kenney.nl (verified April 2026):**
- [1-Bit Pack](https://kenney.nl/assets/1-bit-pack) — 1,078 assets; tiles, characters, objects, UI
- [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) — 130 assets; dungeon tileset
- [UI Pack (RPG Expansion)](https://kenney.nl/assets/ui-pack-rpg-expansion) — 85 assets; banners, scrolls, HP hearts
- [Digital Audio](https://kenney.nl/assets/digital-audio) — 60 SFX

**Visual — OpenGameArt:**
- Hero sprite: recolor a character from Kenney 1-Bit Pack for the Warlock aesthetic, OR browse OpenGameArt for a CC0 wizard/warlock sprite at asset-selection time in Phase G7. (Specific warlock asset URL not pinned — selection happens at build time.)
- Boss sprites: curate 5 distinct CC0 boss sprites from OpenGameArt matching our 5 boss themes. Selection during Phase G7.

**Audio — OpenGameArt (verified CC0 chiptune packs):**
- [Audio CC0 8-bit / Chiptune collection](https://opengameart.org/content/audio-cc0-8bit-chiptune)
- [15 Melodic RPG Chiptunes](https://opengameart.org/content/15-melodic-rpg-chiptunes)
- [Fakebit / Chiptune Music Pack](https://opengameart.org/content/fakebit-chiptune-music-pack)

**License discipline:** **CC0 only.** Avoid CC-BY-SA (viral share-alike forces derivatives to share-alike). CC-BY acceptable for single assets if attribution is added to a `CREDITS.md`; avoid if possible.

### 11.3 Audio budget

- 5 per-floor chiptune loops (one per boss theme).
- 1 combat overlay track (optional tension layer).
- 1 victory fanfare.
- 1 death sting.
- 8 SFX: correct-hit, incorrect-miss, spell-cast (3 distinct per spell family), boss-defeat, hero-death, interstitial-walk.

---

## 12. Build sequence (post-exam, ~10–15 days)

Starts after cert is passed, distributed across 2–3 weeks of evenings.

| Phase | Scope | Days |
|---|---|---|
| **G0** — Bootstrap | `npm init` in `public/dungeon/`; Phaser 3 + TypeScript + Vite scaffold; "Hello World" scene; CI deploy integration | 1 |
| **G1** — Question pipeline | Write `scripts/build-questions.mjs`; integrate into Quartz workflow; validate against real vault | 1 |
| **G2** — Core combat | Hero + 1 boss on screen; HP bars; single question cycle; damage resolution; colored rectangles (no art yet) | 2 |
| **G3** — 5 bosses + shuffle | Boss data; shuffle; 5 distinct fights end-to-end with placeholder sprites; floor themes | 1–2 |
| **G4** — Spellbook | 3 first-run spells + boss-defeat charge allocation; spell cast UI | 1–2 |
| **G5** — Interstitials | 3-beat descent (narrative + recall + primer); pulls recall questions from prior floors; primer pulls concept notes | 2 |
| **G6** — Meta-progression | localStorage save state; Parchment; Title; NG+/NG++/NG+++ unlocks; Eternal Dungeon mode | 1–2 |
| **G7** — Polish + audio | Real pixel art swap-in; chiptune integration; SFX; "YOU DIED" screen; polish passes | 2–3 |
| **G8** — Session export | JSON download UI; `/ingest-session` command authored; vault round-trip verified | 0.5 |
| **Total** | | **11.5–15.5 days** |

---

## 13. KB architectural hooks (applied now)

These small additions to the parent KB spec + plan ensure the game can slot in post-exam without rework.

### 13.1 Folder additions

- `raw/game-sessions/` — written only by `/ingest-session`, immutable per spec §3.1

### 13.2 Command additions

- `/ingest-session <path>` — reserved command; stub referenced in KB spec §6; actual content authored post-exam (Phase G8)

### 13.3 Schema additions

- Structured `` ```question `` block format (§9.2) — formalized as a KB convention so notes authored during cert prep are game-ready
- `certs/<cert-id>/game-log.md` — system-generated by `/ingest-session`, exempt from frontmatter discipline

### 13.4 Quartz config hooks

- `public/dungeon/` — reserved path; Quartz ignores for content indexing but serves as static asset under GitHub Pages

---

## 14. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Abandonment (research-cited 67% for gamified learning apps) | High | Core mechanics designed to be learning-reinforcing, not distracting. First-run spells are all study-aids. Replays are optional flex. Game is not required to use the KB. |
| Scope creep from "Slay the Spire polish expectations" | Medium | Build sequence is phased; each phase is independently valuable. Can stop at Phase G6 (no audio polish) and still have a playable game. |
| Phaser 3 → Phaser 4 breaking changes mid-build | Low | Pinned to Phaser 3 v3.90.0. Phaser 4 is RC at time of writing. |
| OpenGameArt asset quality variance | Medium | Curate assets during Phase G7; have a 1-day buffer for asset selection. Worst case: all Kenney.nl (high quality, consistent style). |
| Question bank too small at game-build time | Medium | Structured question blocks authored during 6-week study (Option A decision). Expected ~100–150 questions by end of cert prep, plenty for the game. |
| Guest abuse (spam plays from bots) | Low | No server, no state beyond localStorage. Bots can't hurt anyone. Game remains fully usable for real players. |
| File System Access API dependency (earlier design) | Resolved | Removed in favor of JSON download + `/ingest-session` command. |
| CC0 license drift in sources | Low | Pin specific asset pack versions at time of download; keep local copies in repo |

---

## 15. Open decisions (deferred to implementation plan)

When the implementation plan is written post-exam, these resolve:

- Exact Phaser scene structure (single scene vs scene-per-phase)
- Save file schema evolution plan (versioning for localStorage format changes)
- Session JSON schema (field names; aim for forward-compatibility)
- Interstitial Recall question selection algorithm (uniform random vs weighted by difficulty vs weighted by user's historical miss rate)
- Audio polish budget (how many unique tracks is "enough"?)
- Question difficulty scaling: how exactly does difficulty tilt toward `hard` as boss HP drops?
- Accessibility (keyboard-only navigation, screen reader support) — must be considered

---

## 16. References

### 16.1 Research

- Internal research document: [`docs/superpowers/research/2026-04-18-gamification-research.md`](../research/2026-04-18-gamification-research.md)

### 16.2 External

- [Karpathy LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — parent KB pattern
- [Quiz Crawler](https://www.quizcrawler.com/) — prior art in quiz-dungeon-crawler space
- [Phaser 3 documentation](https://phaser.io/) and [license](https://phaser.io/download/license) (MIT)
- [GitHub Pages subfolder deployment guides](https://docs.github.com/en/pages)
- [Kenney.nl asset packs](https://kenney.nl/assets) (all CC0)
- [OpenGameArt CC0 chiptunes](https://opengameart.org/content/audio-cc0-8bit-chiptune)

---

## 17. COVE verification log

Verified on 2026-04-18 before spec commit.

**External claims — VERIFIED:**
- Kenney 1-Bit Pack, Tiny Dungeon, UI Pack RPG Expansion, Digital Audio: all exist at claimed URLs, all CC0
- Phaser 3 is MIT licensed (v3.90.0 "Tsugumi" stable as of May 2025)
- GitHub Pages supports subfolder deployment alongside a main site
- Quiz Crawler exists at quizcrawler.com — prior art confirmed
- OpenGameArt has multiple CC0 chiptune packs

**External claims — CORRECTED during COVE:**
- Removed invented `opengameart.org/content/warlock-character` URL; hero sprite selection deferred to Phase G7 with Kenney 1-Bit Pack recolor as default
- Replaced invented `opengameart.org/content/chiptune-pack` URL with three verified packs
- Pinned Phaser 3 v3.90.0 explicitly (avoids Phaser 4 RC drift)

**Internal mechanical claims — VERIFIED for consistency:**
- Max questions per fight math: first run = 5 + 3 − 1 = 7 ✓; NG+ = 9 ✓; NG++ = 12 ✓
- Spell progression: 3 → 4 → 5 → 6 across NG tiers ✓
- Weight-ordered bosses sum to 1.0 (27 + 20 + 20 + 18 + 15 = 100) ✓
- No spell, reward, or mode alters the 1-HP-per-wrong-answer invariant ✓ (learning-first principle R6 upheld)

---

**End of Slay the Cert design.**
