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

The demo must be **full-fidelity**: it looks and behaves exactly like a normal run —
lifelines (spells) work, every scene is identical, **no on-screen demo marker**. The only
difference is determinism and the no-persist guard, both invisible to an audience.

This feature **graduates and replaces** the previous fake-bank demo (the debug-mode
"start demo campaign (fake questions)" button). On landing, that old path and its fake
bank are deleted.

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
  skips `recordCampaignVictory` ([CampaignCompleteScene.ts:23-25](../../../public/dungeon/src/scenes/CampaignCompleteScene.ts#L23-L25)).
  Do **not** set `realBank` (no bank swap).
- **Full spellbook (lifelines).** `createSpellbook('first-run')`, then grant **all five**
  `SpellId`s at count ≥1 (mirrors the old demo's grant loop, but over the full spell list
  instead of `saveState.unlocked_spells`) so every lifeline — Echo, Study the Tome, Memorize,
  Amplify, Doubleshot — is castable live regardless of real progression.
- Standard campaign/heroHp/sessionLog registry setup, then start `BossFightScene`.

**No demo badge.** The run is visually identical to normal play. The old `(DEMO)` badge is
deleted (see §6); demo mode is confirmed only via the `[demo]` console log.

**Lifeline ↔ answer-key caveat:** spells that alter question flow (e.g. Echo = retake the
previous question) reorder what's presented relative to the linear console key. Acceptable
for a representative run; the presenter just reads the key in pick-order.

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

### 6. Retire the old fake-bank demo

Graduating the new demo makes the old one dead. Remove:

- `public/data/demo-questions.json` — the fake bank (only ref is the line being deleted).
- The debug-layer demo button + label ([HubScene.ts:292-310](../../../public/dungeon/src/scenes/HubScene.ts#L292-L310))
  and the `beginDemoCampaign()` method.
- The `realBank` stash/swap and the Hub-return swap-back cleanup
  ([HubScene.ts:59-68](../../../public/dungeon/src/scenes/HubScene.ts#L59-L68)). The return
  cleanup simplifies to: if `demoRun`, remove the flag and `clearActiveRun()` — no bank swap.
- `src/ui/demoBadge.ts` and its three call sites (BossFightScene, InterstitialScene,
  CampaignCompleteScene) plus the now-unused imports (and `demoBadge.test.ts` if present).

**Keep:** `isDebugEnabled` / `mountDebugToggle` and the rest of the debug layer (the demo
button was only one element); the `demoRun` registry flag; the CampaignComplete no-persist
check (now driven by the new demo).

## Scope / non-goals

- **In:** `?demo` trigger, `beginScriptedDemo()` (full spellbook), seeded demo question
  pick, console answer dump, one cheat-sheet markdown, a locked `DEMO_SEED`; **retiring the
  old fake-bank demo** (delete fake bank, debug button, `beginDemoCampaign`, bank-swap,
  `demoBadge`).
- **Out:** auto-pilot / auto-answering, on-screen answer overlay or demo badge, curated
  question-ID lists, changing normal-play randomness, any new question data.

## Files touched (estimate, ~30 LOC of logic + deletions)

**Add/modify:**

- `src/ui/debugToggle.ts` (or a new sibling) — add `isScriptedDemo(search)`.
- `src/scenes/HubScene.ts` — `beginScriptedDemo()` (full spellbook grant); auto-trigger in
  `create()`; simplify the demo-return cleanup (no bank swap).
- `src/game/dungeon.ts` — export `makeSeededRng` / add `demoRngForFloor`.
- `src/scenes/BossFightScene.ts` — seeded pick + console dump under `demoRun`; drop
  `demoBadge` import/call.
- `src/config.ts` (or HubScene) — `DEMO_SEED` + `DEMO_BOSS_ORDER` constants.
- `public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md` — generated once.

**Delete (old fake demo):**

- `public/data/demo-questions.json`
- `src/ui/demoBadge.ts` (+ `demoBadge.test.ts` if present)
- `beginDemoCampaign()` + debug demo button/label + `realBank` swap in `HubScene.ts`
- `mountDemoBadgeIfActive` call sites in `InterstitialScene.ts` + `CampaignCompleteScene.ts`
  (and `BossFightScene.ts`, covered above)

## Testing

- Unit: `pickQuestionsForFight` with a fixed seeded rng returns a stable sequence (extends
  existing `questionLoader.test.ts` determinism coverage).
- Unit: `isScriptedDemo` parses `?demo`, `?demo=123`, and absence correctly.
- Manual: load `?demo`, confirm Tool-Smith starts; confirm the console key matches the
  options shown; confirm a second load reproduces identical questions; **confirm every
  lifeline/spell is present and castable**; **confirm no demo badge is visible**; confirm a
  normal (no-`?demo`) run is still randomized, shows no badge, and does not persist demo state.
- Regression: full `npm test` + `tsc` pass after deleting the old demo (no dangling
  `demoBadge` / `demo-questions.json` references).
