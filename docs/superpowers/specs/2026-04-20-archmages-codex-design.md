# The Archmage's Codex — Spellbook reference + in-combat tooltips

**Date:** 2026-04-20
**Scope:** Slay the Cert (`public/dungeon/`)
**Status:** approved (brainstorming 2026-04-20)

## Overview

The dungeon's 6 spells today render as bare `[Name] xCharges` buttons in combat and a comma-separated "Unlocked spells: …" line in the Hub. Descriptions exist in [config.ts:84-133](../../../public/dungeon/src/config.ts#L84-L133) but are never rendered. Players have no way to learn what spells do except by casting them — hostile to learning, and this is a cert-prep game.

This spec ships two surfaces, plus one pre-work cleanup:

- **Phase A — Combat hover tooltip.** Two-line floating tooltip on each spell button: spell name + short tagline. Non-modal, non-interruptive. Minimum viable fix for the bare-button problem.
- **Phase B — The Archmage's Codex.** New `TomeScene` accessible from Hub. Single-screen 2-column grid of spell cards with name + tier + unlock-tier + full description. Locked spells render as silhouettes. Zero page-flip, zero scrolling, zero animations. Pure reference.
- **Pre-work — Remove Focus spell.** The Focus spell is dead infrastructure: declared in types/config but with no runtime behavior (its `effect` is typed as `retake`, identical to Echo, behind a `/* handled separately via pendingFocus */` comment that points to a flag that doesn't exist). Casting Focus today triggers Echo's behavior under a wrong label. Cleanup folded into this PR so the Codex ships with an accurate 5-spell roster.

**What this is not:** no Hades-style page-flip, no handwritten font, no pixel sketches, no per-spell flavor-writing, no journey/run-log, no domain-mapping reveal, no cast-count stat. "Simple is the driving principle." These are listed under Deferred at the end.

---

## Pre-work — Remove Focus spell

### Evidence of deadness

- [config.ts:125-132](../../../public/dungeon/src/config.ts#L125-L132) — Focus defined with `effect: { type: 'retake' /* handled separately via pendingFocus flag */ }`.
- `pendingFocus` appears nowhere in the codebase (grep-verified).
- `CombatState` at [types.ts:70-80](../../../public/dungeon/src/types.ts#L70-L80) has `pendingDamageMultiplier`, `pendingPrimer`, `pendingRetake` — no focus/timer field.
- `castSpell` switch at [spellbook.ts:32-46](../../../public/dungeon/src/game/spellbook.ts#L32-L46) handles `damage-mult | retake | primer | weakness-queue`, no focus branch.
- Focus's nominal effect ("15-second contemplation phase") would require UI + timer infrastructure that doesn't exist.

**Conclusion:** Focus is shipped-but-broken. Casting it silently triggers Echo's retake. Removing it is cleanup, not a feature cut.

### Removal touches (8 sites)

| File | Change |
|---|---|
| [types.ts:50](../../../public/dungeon/src/types.ts#L50) | Drop `'focus'` from `SpellId` union |
| [config.ts:125-132](../../../public/dungeon/src/config.ts#L125-L132) | Delete the `focus:` entry in `SPELLS` |
| [spellbook.ts:13](../../../public/dungeon/src/game/spellbook.ts#L13) | Drop `focus: 0` from `createSpellbook` initializer |
| [BossFightScene.ts:236, 355](../../../public/dungeon/src/scenes/BossFightScene.ts#L236) | Drop `'focus'` from both `spellIds` arrays (6→5) |
| [HubScene.ts:28-33, 92, 144](../../../public/dungeon/src/scenes/HubScene.ts#L28) | Drop focus checks in `getNextUnplayedTier` + `isTerminal`; remove "Unlocked spells: …" line (superseded by Tome button) |
| [saveState.ts:45](../../../public/dungeon/src/game/saveState.ts#L45) | Change `'ng-plus-plus': 'focus'` → `'ng-plus-plus': null` |
| [saveState.test.ts:77-82](../../../public/dungeon/src/game/saveState.test.ts#L77-L82) | Rewrite "unlocks focus" test as "NG++ victory unlocks no new spell" |
| [runSave.test.ts:16](../../../public/dungeon/src/game/runSave.test.ts#L16) | Remove `focus: 0` from test fixture |

### Loader defensiveness

Existing saves may still contain `'focus'` inside `unlocked_spells: SpellId[]`. On load, filter out `'focus'` as part of the save-state reader so the narrowed `SpellId` union isn't violated at runtime:

```ts
// in loadSaveState, before returning
parsed.unlocked_spells = parsed.unlocked_spells.filter(
  (s: string): s is SpellId => ['echo', 'study-the-tome', 'memorize', 'amplify', 'doubleshot'].includes(s)
);
```

One extra line. Forgiving reader, strict writer. No version bump needed.

### Behavior changes from removal

- BossFightScene spell grid: 6 buttons → 5 buttons. Layout shifts from 3×2 to **3+2 centered** — first row `x ∈ {100, 380, 660}`, second row `x ∈ {240, 520}` (2 cells centered across the 3-col axis). Y values unchanged.
- `NEW_SPELLS_PER_MODE['ng-plus-plus']` becomes `null`: clearing NG++ no longer unlocks anything new. NG+++ tier still exists as replay-with-title.
- `isTerminal` check in HubScene no longer requires Focus in `unlocked_spells`; relies on `eternal_dungeon_unlocked` + current mode only.

### Tier pyramid after removal

- **first-run** — Echo, Study-the-Tome, Memorize (3 starters)
- **NG+** — + Amplify (4 total)
- **NG++** — + Doubleshot (5 total)
- **NG+++** — replay-only, earn title, no new spell

---

## Phase A — Combat hover tooltip

### Schema change

Add one required field to the `Spell` interface at [types.ts:57-64](../../../public/dungeon/src/types.ts#L57-L64):

```ts
tagline: string;  // ≤40 chars, combat-tooltip friendly
```

### Taglines (written into config.ts)

| Spell | Tagline |
|---|---|
| Echo | `Retake a past question.` |
| Study the Tome | `Read a primer first.` |
| Memorize | `Flag for weakness queue.` |
| Amplify | `Next correct deals 2.` |
| Doubleshot | `Next correct deals 3.` |

### Tooltip rendering

- Content: two lines — `{name}` on line 1, `{tagline}` on line 2. No tier, no charges (button already shows `xN`).
- Anchored **above** the spell button. Bottom edge of tooltip = top edge of button − 4px padding.
- Width: ~180px with `useAdvancedWrap` enabled.
- Style: background `#1a1a2a`, 1px amber border `#ffca28`, padding `{x:8, y:6}`, monospace font (matches existing game type).
- Behavior: visible on `pointerover`, hidden on `pointerout`. Single shared `Phaser.GameObjects.Container` per scene — one tooltip object total, repopulated per hover. Avoids six-tooltips-one-screen orphan bugs.
- Works regardless of charge count (a 0-charge spell still shows its tooltip so players learn what it does before earning it).
- Works regardless of `acceptingInput` gate (read-only surface, no interaction with combat phases).

### Edge cases

- Top-row spell buttons at `y=650` — tooltip rises upward into the area above them (options row ends at `y=575`). Margin is ~50px; tooltip at 2 lines × 14px ≈ 40px including padding fits cleanly. If the measured height exceeds the margin during implementation, shift the spellbook grid down by 4-6px or anchor tooltip to the right of the button instead.

### Files touched

- [config.ts:84-133](../../../public/dungeon/src/config.ts#L84-L133) — add `tagline` to each of the 5 spells; Focus entry deleted.
- [types.ts:57-64](../../../public/dungeon/src/types.ts#L57-L64) — add `tagline: string` to `Spell`.
- [BossFightScene.ts:231-258](../../../public/dungeon/src/scenes/BossFightScene.ts#L231-L258) — create shared tooltip container in `create()`, add `pointerover`/`pointerout` listeners to spell buttons.

---

## Phase B — The Archmage's Codex (TomeScene)

### Name

**"The Archmage's Codex"** — chosen because `title_earned: 'Archmage'` already exists in the save state at [saveState.ts:64](../../../public/dungeon/src/game/saveState.ts#L64). The player *becomes* the Archmage by clearing the first campaign, so the codex is their codex. Uses in-world vocabulary that already exists.

### Entry + exit

- **From Hub:** new `[ 📖 Codex ]` text button, placed where the "Unlocked spells: …" line lives today at [HubScene.ts:143-148](../../../public/dungeon/src/scenes/HubScene.ts#L143-L148). That summary line is **removed** — the Codex supersedes it.
- **Keyboard:** none. Click button only. (Dropped for simplicity.)
- **Back:** `[← Back]` button at bottom-center of the Codex returns to HubScene via `fadeToScene`. `Esc` also returns (cheap — one keyboard listener).

### Screen layout (960×720 canvas)

```
┌───────────────────────────────────────────────────────────────┐
│               The Archmage's Codex                             │ ← Title, y=60, 28px amber
├───────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────────────────────┐  ┌─────────────────────────┐    │ ← Row 1 (y=160)
│   │ Echo                    │  │ Study the Tome          │    │
│   │ uncommon · first-run    │  │ uncommon · first-run    │    │
│   │                         │  │                         │    │
│   │ Next question is a      │  │ Before next question,   │    │
│   │ retake of a previous    │  │ reveal a 3-sentence     │    │
│   │ question from this      │  │ primer from the source  │    │
│   │ fight.                  │  │ note. Context only, no  │    │
│   │                         │  │ answer.                 │    │
│   └─────────────────────────┘  └─────────────────────────┘    │
│                                                                │
│   ┌─────────────────────────┐  ┌─────────────────────────┐    │ ← Row 2 (y=340)
│   │ Memorize                │  │ Amplify                 │    │
│   │ rare · first-run        │  │ common · ng-plus        │    │
│   │ ...                     │  │ ...                     │    │
│   └─────────────────────────┘  └─────────────────────────┘    │
│                                                                │
│   ┌─────────────────────────┐                                  │ ← Row 3 (y=520)
│   │ Doubleshot              │  (empty — no 6th card)           │
│   │ rare · ng-plus-plus     │                                  │
│   │ ...                     │                                  │
│   └─────────────────────────┘                                  │
│                                                                │
│                           [← Back]                             │ ← y=680
└───────────────────────────────────────────────────────────────┘
```

### Card spec

- Size: 400px × 160px
- Column x-positions: `100` (left), `520` (right); gutter 20px
- Row y-positions: `160`, `340`, `520`
- Panel: fill `#1a1a2a`, 1px border `#ffca28`
- Padding: 16px
- Name: 20px bold, amber `#ffca28`, top-left
- Subtitle `{tier} · {unlockedIn}`: 11px, dim `#808090`, below name
- Description: 13px, `#d0d0da`, wrapped with `useAdvancedWrap`, below subtitle with 12px gap
- **No hover interaction** — everything visible is final. Cards are static.
- **No cast count** (cut during brainstorming; see Deferred).

### Tier-label display

Map raw `unlockedIn` values to human-readable labels for the subtitle:

| `unlockedIn` | Display label |
|---|---|
| `first-run` | `first-run` |
| `ng-plus` | `ng-plus` |
| `ng-plus-plus` | `ng-plus-plus` |
| `ng-plus-plus-plus` | `ng-plus-plus-plus` |

(Kept as-is — matches existing vocabulary in the codebase. No prettifying.)

### Locked state

A spell is "locked" when its `id` is **not** in `save.unlocked_spells`.

Locked card renders:
- Name: `???????` (7 question marks)
- Subtitle: `locked · {unlockedIn}`
- Body: `Clear {tier-name} to unveil this page.` where `{tier-name}` uses:
  - `first-run` → "the dungeon for the first time"
  - `ng-plus` → "NG+"
  - `ng-plus-plus` → "NG++"
  - `ng-plus-plus-plus` → "NG+++"  (unused post-Focus-removal but kept in the mapping for future-proofing — one line)
- Card alpha: 0.6
- Border: same amber, but visually subdued by the overall alpha

### Ordering

Cards render in **unlock tier order** (first-run cards first, then ng-plus, then ng-plus-plus):

1. Echo
2. Study the Tome
3. Memorize
4. Amplify
5. Doubleshot

Within same tier, order as listed in `SPELLS` record-definition order.

### Statelessness

`TomeScene.create()` reads `loadSaveState(CERT_ID)` once, grabs `unlocked_spells`, and renders. Zero in-scene state. Zero writes. Rebuild-on-reopen.

### Files touched

- [HubScene.ts:143-148](../../../public/dungeon/src/scenes/HubScene.ts#L143-L148) — remove old unlocked-spells summary line; add Codex button in its place.
- New file: `public/dungeon/src/scenes/TomeScene.ts` — the scene.
- [main.ts](../../../public/dungeon/src/main.ts) — register `TomeScene` in the Phaser scene list.

---

## Testing plan

### Unit tests

| File | Tests |
|---|---|
| [spellbook.test.ts](../../../public/dungeon/src/game/spellbook.test.ts) | Update fixtures: `createSpellbook` returns 5 keys. Drop Focus-specific assertions. |
| [saveState.test.ts](../../../public/dungeon/src/game/saveState.test.ts) | Rewrite "unlocks focus" test as "NG++ victory unlocks nothing new"; add a loader test for "existing save with `focus` in `unlocked_spells` is filtered on load". |
| [runSave.test.ts](../../../public/dungeon/src/game/runSave.test.ts) | Fixture update — drop `focus: 0`. |
| New: `TomeScene.test.ts` | (1) Renders 5 cards when all unlocked; (2) Renders locked silhouettes for non-unlocked spells; (3) Title reads "The Archmage's Codex"; (4) Card content matches `SPELLS[id].description` verbatim for unlocked spells; (5) Locked card shows the right unlock-tier copy; (6) Back button transitions to HubScene. |
| Extend existing BossFightScene tests | (1) Tooltip hidden at scene start; (2) `pointerover` on spell button → visible with correct name + tagline; (3) `pointerout` → hidden; (4) Works when charges = 0; (5) Hovering a second spell replaces shared tooltip's content, doesn't spawn a new object. |

### Manual verification checklist

1. Fresh campaign → boss fight. Hover each spell button. Confirm tooltip shows name + tagline above the button, disappears on mouseout.
2. Open Codex from Hub. Confirm 5 cards render in the described grid, locked cards show `???????` + unlock copy.
3. Complete first-run. Return to Hub. Open Codex. Confirm Amplify is now unlocked (full content visible).
4. DevTools: inject a save with `'focus'` in `unlocked_spells`. Reload. Confirm game loads cleanly and Focus is absent from any UI.
5. Click `[← Back]` in Codex. Confirm return to Hub without scene stacking / doubled audio.

### Build gates

- `cd public/dungeon && npm test` — full suite green.
- `cd public/dungeon && npm run build` — TypeScript compiles with narrowed `SpellId` union.
- `cd public/dungeon && npm run dev` — walk manual checklist in browser before declaring done.

---

## Deferred (explicitly out of scope)

Items considered during brainstorming and cut for simplicity — captured here so future iterations know what was weighed and why:

- **Cast count stat per spell.** Low value, costs a new `SaveStateV1` field + normalizer + cross-scene write. Cut by user.
- **CCA-F domain-mapping reveal on second page** (the research's keystone). Highest-value future iteration — each card gets a second paragraph unlocked after N casts revealing "Echo embodies the Agentic Loop pattern — see Domain 1." Deferred.
- **Hades page-flip SFX + handwritten font.** Flavor, not function.
- **Gungeon-style pixel sketches per spell.** Art scope.
- **Journey / run-log tab.** `SessionLog` already captures this; a UI surface for it is a different feature.
- **Keyboard shortcut to open Codex from Hub.** Cut for zero-ceremony.
- **Scrollable / paginated Codex.** Unnecessary at 5 entries.

---

## File-touch summary

| Path | Change type |
|---|---|
| [public/dungeon/src/types.ts](../../../public/dungeon/src/types.ts) | Modify — remove `'focus'` from union, add `tagline` to `Spell` |
| [public/dungeon/src/config.ts](../../../public/dungeon/src/config.ts) | Modify — delete Focus entry, add `tagline` field to 5 spells |
| [public/dungeon/src/game/spellbook.ts](../../../public/dungeon/src/game/spellbook.ts) | Modify — drop `focus: 0` |
| [public/dungeon/src/game/saveState.ts](../../../public/dungeon/src/game/saveState.ts) | Modify — unlock-map entry + loader filter |
| [public/dungeon/src/scenes/BossFightScene.ts](../../../public/dungeon/src/scenes/BossFightScene.ts) | Modify — drop `'focus'` from spellIds, add hover tooltip |
| [public/dungeon/src/scenes/HubScene.ts](../../../public/dungeon/src/scenes/HubScene.ts) | Modify — drop Focus references, swap summary line for Codex button |
| [public/dungeon/src/main.ts](../../../public/dungeon/src/main.ts) | Modify — register TomeScene |
| `public/dungeon/src/scenes/TomeScene.ts` | **New** |
| [public/dungeon/src/game/spellbook.test.ts](../../../public/dungeon/src/game/spellbook.test.ts) | Modify — fixture updates |
| [public/dungeon/src/game/saveState.test.ts](../../../public/dungeon/src/game/saveState.test.ts) | Modify — rewrite Focus test + add loader-filter test |
| [public/dungeon/src/game/runSave.test.ts](../../../public/dungeon/src/game/runSave.test.ts) | Modify — fixture update |
| `public/dungeon/src/scenes/TomeScene.test.ts` | **New** |
| BossFightScene tests | Extend with tooltip coverage |
