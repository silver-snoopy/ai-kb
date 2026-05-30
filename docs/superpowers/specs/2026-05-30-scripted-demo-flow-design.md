# Scripted Demo Flow — design

**Date:** 2026-05-30
**Status:** approved-pending-review
**Context:** Slay the Cert dungeon game (`public/dungeon/`), in support of the 2026-06-03 talk.

## Problem

For the talk we want to drive the game live against **real** questions (not the existing
fake "Cat Dispatch" mockup bank) in a way that is **reproducible** — same bosses, same
questions, same correct answers every run — so the presenter knows exactly what is coming.
The **Tool-Smith** boss (domain-4-mcp) is the starter of the demo flow. The run is
*representative*, not a flawless-win script: the presenter may deliberately miss a question
for a teaching beat, so we need the full answer key available but do not need auto-pilot.

## Key insight

The game is **already almost fully deterministic** from a seed:

- Boss order is seeded — `createCampaign(mode, seed)` shuffles via a seeded RNG
  ([dungeon.ts:12-16](../../../public/dungeon/src/game/dungeon.ts#L12-L16)).
- Option order is **fixed** — options render in stored A/B/C/D order
  ([BossFightScene.ts:557](../../../public/dungeon/src/scenes/BossFightScene.ts#L557)), and
  each `Question.correct` letter is stored in `bank.json`
  ([types.ts:12](../../../public/dungeon/src/types.ts#L12)).
- The **only** source of non-determinism is question *selection*:
  [BossFightScene.ts:144](../../../public/dungeon/src/scenes/BossFightScene.ts#L144) calls
  `pickQuestionsForFight(domainPool, maxQuestions)` with no `rng` arg → defaults to
  `Math.random`.

So: make that one call seeded in demo mode, fix the boss order, and the entire run —
including the correct-answer key — becomes deterministic and falls out of the existing
real bank. No mockup data, no curated question-ID list to keep in sync.

## Approach (chosen)

Seed-deterministic over the real bank, triggered by a query param, with a one-time
console dump as the answer key. This collapses the user's "Option A (console list)" and
"Option B (fixed questions, generated once)" into a single mechanism.

## Design

### 1. Trigger — `?demo` query param

Parsed the same way `?debug` already is
([debugToggle.ts:5-6](../../../public/dungeon/src/ui/debugToggle.ts#L5-L6)):
`new URLSearchParams(window.location.search)`. Add an `isScriptedDemo(search)` helper
(co-located with or mirroring `isDebugEnabled`). Optional `?demo=<seed>` overrides the
default seed; bare `?demo` uses the hardcoded `DEMO_SEED`.

No new UI button. The talk URL simply carries `?demo`.

In `HubScene.create()`, after the existing demo-cleanup block, if `isScriptedDemo()` is
true, auto-invoke `beginScriptedDemo()`. (Note: on returning to the Hub after the campaign,
cleanup clears the flag and — because `?demo` is still in the URL — the demo restarts. This
self-restart is acceptable / desirable for a talk.)

### 2. `beginScriptedDemo()` on HubScene

A sibling of the existing `beginDemoCampaign()`, but using the **real** bank (no fake-bank
swap):

- Lock mode to `'first-run'` (5-HP bosses → `maxQuestions = 5 + 3 - 1 = 7` per fight),
  matching the existing demo's predictability choice.
- `createCampaign('first-run', DEMO_SEED)`, then overwrite `campaign.bossOrder` with the
  fixed demo order `['the-tool-smith', ...the other four boss ids]`. (createCampaign itself
  is left untouched; we just replace the field afterward.)
- Set `demoRun = true` to **reuse the existing no-persist plumbing** — CampaignComplete
  skips `recordCampaignVictory` ([CampaignCompleteScene.ts:23-25](../../../public/dungeon/src/scenes/CampaignCompleteScene.ts#L23-L25)),
  Hub clears the active run on return. Do **not** set `realBank` (no bank swap), and confirm
  the Hub return-cleanup tolerates `realBank` being absent (it already guards `if (real)`).
- Standard campaign/spellbook/heroHp/sessionLog registry setup as `beginDemoCampaign` does,
  then start `BossFightScene`.

The existing `(DEMO)` badge ([demoBadge.ts](../../../public/dungeon/src/ui/demoBadge.ts))
shows automatically since it keys off `demoRun`.

### 3. Deterministic question pick (the one real change to fight logic)

In `BossFightScene`, where questions are picked
([BossFightScene.ts:144](../../../public/dungeon/src/scenes/BossFightScene.ts#L144)):

- If `demoRun` is set, build a seeded rng from `campaign.seed + campaign.floorsCleared`
  (floor-offset so each boss gets a distinct-but-deterministic draw) and pass it as the
  third arg: `pickQuestionsForFight(domainPool, maxQuestions, demoRng)`.
- Otherwise unchanged (`Math.random`). **Normal play is not affected.**

Requires exposing the seeded-RNG constructor: `makeSeededRng` is currently a private
function in `dungeon.ts` — export it (or add a small `demoRngForFloor(seed, floor)` helper
there) so BossFightScene can use the identical algorithm.

### 4. Answer key — one-time console dump

In `BossFightScene`, after the demo question pick, if `demoRun` is set, `console.log` a
compact line per fight: boss id followed by the picked questions' `.correct` letters in
order, e.g.:

```
[demo] the-tool-smith: B → A → C → D → A → B → C
```

Playing the full 5-boss campaign once locally prints all five lines (7 letters each = 35
total; the presenter only needs the first ~5 per boss to win, the rest cover misses). The
presenter copies these into a cheat sheet at
`public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` for second-screen reference
during the talk. Because the run is deterministic, this is generated **once** and stays valid.

### 5. Seed selection

During implementation, try a handful of `DEMO_SEED` values, eyeball the 7 Tool-Smith
questions each surfaces, and lock the one that reads best for an audience (clear stems, good
spread). Hardcode that as `DEMO_SEED`. The other four bosses use the same seed; their
questions are not curated (fine for demo purposes).

## Scope / non-goals

- **In:** `?demo` trigger, `beginScriptedDemo()`, seeded demo question pick, console answer
  dump, one cheat-sheet markdown, a locked `DEMO_SEED`.
- **Out:** auto-pilot / auto-answering, on-screen answer overlay, curated question-ID lists,
  changing normal-play randomness, any new question data.

## Files touched (estimate, ~30 LOC of logic)

- `src/ui/debugToggle.ts` (or a new sibling) — add `isScriptedDemo(search)`.
- `src/scenes/HubScene.ts` — `beginScriptedDemo()`; auto-trigger in `create()`.
- `src/game/dungeon.ts` — export `makeSeededRng` / add `demoRngForFloor`.
- `src/scenes/BossFightScene.ts` — seeded pick + console dump under `demoRun`.
- `src/config.ts` (or HubScene) — `DEMO_SEED` + `DEMO_BOSS_ORDER` constants.
- `public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` — generated once.

## Testing

- Unit: `pickQuestionsForFight` with a fixed seeded rng returns a stable sequence (extends
  existing `questionLoader.test.ts` determinism coverage).
- Unit: `isScriptedDemo` parses `?demo`, `?demo=123`, and absence correctly.
- Manual: load `?demo`, confirm Tool-Smith starts, confirm console key matches the options
  shown, confirm a second load reproduces identical questions, confirm a normal (no-`?demo`)
  run is still randomized and does not persist demo state.
