# In-Fight Navigation (Menu + Codex) — design

**Date:** 2026-05-30
**Status:** draft — awaiting user review
**Context:** Slay the Cert dungeon game (`public/dungeon/`).

## Problem

During an active boss fight there is currently **no way to leave to the Hub or open
the Codex** — `BossFightScene` only transitions to the Hub when a fight *ends*
([BossFightScene.ts:797,807,853](../../../public/dungeon/src/scenes/BossFightScene.ts#L797)),
and the Codex (`TomeScene`) is reachable **only** from the Hub, always returning to the
Hub ([TomeScene.ts:60-61](../../../public/dungeon/src/scenes/TomeScene.ts#L60-L61)). A
player mid-fight is trapped until they win or die. This feature adds two in-fight controls,
built in two phases.

The game already auto-saves mid-fight (`writeSave` on every answer), so leaving a fight is
a **resumable pause**, not a forfeit — the Hub already offers "Continue (… mid-fight)".

## Phase 1 — Back-to-Menu button (build first)

### Behavior
A small icon button in the boss fight returns the player to the Hub. Because progress is
already persisted, this is a non-destructive pause: the Hub shows "Continue (Floor N ·
Boss, mid-fight)" and `resumeActiveRun` restores the exact fight state. **No confirm modal**
— nothing is lost. (Isolated debug fights and demo runs don't persist a save; for those,
returning to the Hub simply abandons the throwaway fight, which is the desired behavior —
a demo started via `?demo` self-restarts from Tool-Smith.)

### Icon (sprite from the existing sheet)
Use a **door/exit tile** from the `td-tiles` spritesheet (`assets/tilemap_packed.png`, 16×16
frames; row 3, frames 36–47, contains "doors + stairs" per
[backdrops.ts:10](../../../public/dungeon/src/scenes/backdrops.ts#L10)). The exact frame is
selected during implementation by rendering the row-3 candidates and picking the clearest
door read (same preview discipline used for `DEMO_SEED`). Rendered at `setScale(2)` (32px,
consistent with backdrop props) in the **top-left** corner (top-right is taken by the audio
toggles, [BossFightScene.ts:28](../../../public/dungeon/src/scenes/BossFightScene.ts#L28)).
A small "Menu" text label sits beside it for clarity. Hover brightens it, matching the
existing button-hover idiom (`attachRectHover` / `attachTextHover`).

### Mechanism
A new private `BossFightScene.exitToHub()`:
1. `this.writeSave()` — flush current mid-fight state (no-op for isolated/demo, by the
   existing gate).
2. `fadeToScene(this, 'HubScene')`.

Mounted in `create()` behind a small helper (e.g. `mountMenuButton(this)` co-located in a
new `src/ui/inFightNav.ts`, or inline if it stays tiny). It must sit above the backdrop
(high depth) and not overlap the HP readouts or spell row — placement verified manually.

## Phase 2 — In-fight Codex (tome) round-trip (build second)

### Behavior
A Codex button in the fight opens the spell reference and returns the player **straight back
into the fight** (not the Hub), with combat state perfectly intact.

### Icon
Reuse the Hub's Codex glyph 📖 (`HubScene` already labels the Codex with 📖) for visual
consistency, as a text button. (If a clean book/tome tile is found in `td-tiles` during the
Phase-1 preview, it may be used instead — decided then.)

### Mechanism — overlay, not scene-swap
Opening the Codex from a fight must not destroy combat state, so use Phaser scene layering
rather than a full transition:
- In `BossFightScene`: `this.scene.launch('TomeScene', { returnTo: 'BossFightScene' })` then
  `this.scene.pause()`. The fight scene freezes underneath, holding all state.
- `TomeScene` gains an optional `init(data: { returnTo?: string })`. Its back button and ESC
  handler branch:
  - `returnTo` set → `this.scene.stop()` then `this.scene.resume(returnTo)` (un-pauses and
    re-displays the live fight; no save/restore needed).
  - `returnTo` absent (the Hub entry path) → current behavior: `fadeToScene(this,
    'HubScene', {})`.
- The Hub's Codex launch (`fadeToScene(this, 'TomeScene', {})`,
  [HubScene.ts:206](../../../public/dungeon/src/scenes/HubScene.ts#L206)) stays unchanged
  (no `returnTo` → defaults to Hub).

Caveat to verify: `TomeScene` rendered over a paused `BossFightScene` must fully occlude it
(it already paints a full-screen background) so the frozen fight doesn't bleed through; if
not, add an opaque backing rect in `TomeScene` when `returnTo` is set.

## Scope / non-goals

- **In:** a menu/exit icon button (Phase 1) and an in-fight Codex overlay (Phase 2); a
  `returnTo` param on `TomeScene`; one new sprite-icon usage from `td-tiles`.
- **Out:** a forfeit/abandon-with-discard action (the existing "New Game" on the Hub already
  covers discarding); a pause menu with settings; any change to the auto-save cadence; any
  new art assets (icons come from the existing sheet / existing glyphs).

## Files touched

- `src/scenes/BossFightScene.ts` — mount menu + Codex buttons; `exitToHub()`; Codex
  launch-with-pause.
- `src/scenes/TomeScene.ts` — `init({ returnTo })`; branch back/ESC on `returnTo`.
- `src/ui/inFightNav.ts` (new, optional) — the two button-mounting helpers, kept out of the
  already-large `BossFightScene`.
- Possibly `src/scenes/backdrops.ts` doc reference only (frame map) — no code change.

## Testing

- **Unit:** `TomeScene` return-target logic is the testable seam — extract a pure
  `tomeReturnTarget(data)` (returns `{ kind: 'resume', scene }` vs `{ kind: 'hub' }`) and
  unit-test both branches, so the Hub-vs-fight routing can't silently regress.
- **Manual (Phase 1):** start a fight → click Menu → land on Hub → "Continue (mid-fight)" →
  resume restores HP/question/pool. Confirm the icon doesn't overlap HP/spells. Confirm a
  `?demo` fight's Menu returns cleanly (and re-triggers the demo).
- **Manual (Phase 2):** in a fight → open Codex → spell pages render over the frozen fight →
  back/ESC returns to the *same* fight with identical state (HP, current question, spell
  charges). Confirm opening the Codex from the Hub still returns to the Hub.

## Branch / merge plan

This is a **general game feature, separate from the scripted-demo PR (#30)**. Per the user:
the branch for this flow will **also bring in the two currently-untracked talk docs** —
`public/dungeon/README.md` and `public/talks/2026-06-03-slay-the-cert/prep/HANDOUT.md` — as
part of the same PR. Because it edits `BossFightScene.ts` / `HubScene.ts` / `TomeScene.ts`
that PR #30 also touches, the branch stacks on the current `feat/scripted-demo-flow` HEAD
(or is rebased onto `main` after #30 merges) to avoid conflicts. Exact base decided at
branch-creation time.
