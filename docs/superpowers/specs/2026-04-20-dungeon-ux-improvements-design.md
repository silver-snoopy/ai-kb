# Dungeon UX improvements — Debug gate, Continue run, Wrong-answer visibility

**Date:** 2026-04-20
**Scope:** Slay the Cert (`public/dungeon/`)
**Status:** approved (brainstorming 2026-04-20)

## Overview

Three UX improvements on top of the shipped Slay the Cert build, plus two bug fixes landed in the same session. The bugs are already fixed; this spec covers the three features.

**Bugs fixed in-session (pre-spec):**
1. InterstitialScene: class-field arrays `optionPanels` + `optionTexts` accumulated stale GameObject refs across scene re-entry. On boss 2→3+ the `forEach(setText/…)` in `renderRecall` threw on a destroyed Text's null canvas, halting before `setVisible(true)` — visual signature: recall screen with no option panels and stale narrative hint. Fix: reset the two arrays at the top of `create()`, mirroring the existing BossFightScene pattern.
2. BossFightScene: after boss defeat, the option-row Rectangle objects stayed visible as empty boxes because only the text was cleared. Added `optionButtons: Phaser.GameObjects.Rectangle[]` field, push on creation, hide on defeat/hero-death/wrong-answer overlay, self-heal visibility in `showCurrentQuestion`.

Both fixes ship with the feature implementation in the same PR.

## Feature 1 — Debug URL gate

### Intent
Hide the Hub's debug surfaces from normal players. Keep an easy path in for development.

### Design
- **Gate:** `?debug=1` (or plain `?debug`) on the URL. No chord, no Konami. URL param is the sole entry.
- **Surface when gate on:**
  - Bug-sprite icon (Kenney Tiny Dungeon spider tile, or fallback emoji `🐛`) mounted top-left of Hub, symmetric to BGM/SFX toggles top-right.
  - Click toggles visibility of the existing 5-boss debug row + "(debug) preview interstitial" button.
  - Toggle state persists in `localStorage['stc:debug-visible']` so within a `?debug=1` session the preference survives scene transitions.
  - Sprite brightens when debug is on, dims when off.
- **Surface when gate off:** debug row + interstitial-preview button not mounted. Bug sprite not mounted. No discovery path from the Hub UI.
- **Future cheat vocabulary (reserved, not in scope):** `?iddqd` (god mode), `?idkfa` (unlock all spells), `?noclip` (skip questions).

### Files touched
- New: `public/dungeon/src/ui/debugToggle.ts` — `mountDebugToggle(scene, onToggle)` mirroring `mountAudioToggles`. ~40 LOC.
- Modified: `public/dungeon/src/scenes/HubScene.ts` — read `window.location.search`, mount bug icon conditionally, rebuild debug row visibility from toggle state.

### Tests
- Parse-URL helper pure-tested: `isDebugEnabled('?debug=1')`, `isDebugEnabled('?debug')`, `isDebugEnabled('')`, `isDebugEnabled('?iddqd')` (false since F1 only recognizes `debug`).

## Feature 2 — Continue run on interruption

### Intent
Let a player close the tab mid-fight and resume where they left off. Optimize for the "I stepped away for a meeting" case.

### Save model
localStorage key `stc:active-run`, separate from the existing `stc:save-state` (which stores NG+ progression and cosmetic unlocks).

```ts
type RunSave = {
  version: 1;
  savedAt: string;           // ISO — stale after 48h → treated as no-save
  campaign: { bossOrder: string[]; floorsCleared: number; mode: RunMode };
  spellbook: Spellbook;
  heroHpCarryover: number;   // HP carried between bosses
  inBoss: {
    bossId: string;
    questionIds: string[];        // frozen N Qs picked at boss entry
    currentQuestionIdx: number;   // next Q to show, 0-indexed
    heroHp: number;
    bossHp: number;
    bossMaxHp: number;
    questionHistoryIds: string[]; // for Echo spell retake pool
  } | null;                       // null = between bosses (interstitial / pre-floor)
};
```

### Write points (Pattern B — on-advance)
1. `BossFightScene.init()` after `pickQuestionsForFight` → write `inBoss` with `currentQuestionIdx: 0`, fresh HP from carryover.
2. `BossFightScene.advanceOrEnd()` after the boss-alive/hero-alive branch passes → bump `currentQuestionIdx`, update HP, spellbook, `questionHistoryIds`.
3. `BossFightScene.onFightEnd('victory')` → `inBoss = null`, `heroHpCarryover = current`, `campaign.floorsCleared++`.
4. `BossFightScene.onHeroDead()` and `CampaignCompleteScene.create()` → `clearActiveRun()`.
5. Hub "New Game" with a save present → confirm modal, then `clearActiveRun()`.

InterstitialScene does not write — save #3 already captured between-boss state. The recall question re-rolls on resume into interstitial; acceptable since recall is no-stake practice.

### Restore flow (Hub entry)
1. Read `stc:active-run`. If stale (>48h), unparseable, version-mismatch, references an unknown boss, or contains question IDs missing from the current pool → silently clear, log once to console, show single `New Game` button.
2. Valid + fresh → show `Continue (Floor X · Boss Name)` as the primary button and `New Game` as secondary. `New Game` with a save present opens a confirm modal ("Abandon current run?").
3. `Continue` click:
   - Restore `campaign`, `spellbook`, `heroHp` into `this.registry`.
   - If `inBoss !== null` → `fadeToScene(BossFightScene, { bossId, mode, isolated: false })`. BossFightScene's `init` detects a matching save (by `bossId`), skips `pickQuestionsForFight`, rebuilds `this.questions` from `questionIds`, sets `currentQuestionIdx` + HP from save.
   - If `inBoss === null`:
     - First floor (`floorsCleared === 0`) → `fadeToScene(BossFightScene, { bossId: campaign.bossOrder[0], mode, isolated: false })`.
     - Later floor → `fadeToScene(InterstitialScene, { previousBossId: campaign.bossOrder[floorsCleared-1], nextBossId: campaign.bossOrder[floorsCleared], mode })`.

### Save-scum stance
Explicitly allowed. Study tool, not competitive. The weakness queue captures wrong answers anyway, so cheating is self-defeating. No question-view-lock, no anti-scum friction.

### Files touched
- New: `public/dungeon/src/game/runSave.ts` — pure helpers (`readActiveRun`, `writeActiveRun`, `clearActiveRun`, `isStale`, `restoreQuestionPool`). ~120 LOC. 6-8 vitest tests.
- Modified: `BossFightScene.ts` — restore path in `init`, writes at 3 points. ~40 LOC delta.
- Modified: `HubScene.ts` — dual-button rendering, confirm-new-game modal. ~30 LOC delta.
- Modified: `CampaignCompleteScene.ts` — `clearActiveRun()` on entry. ~2 LOC delta.

### Tests
- Round-trip serialize/deserialize.
- Stale rule (>48h) returns null.
- Version mismatch returns null.
- Restore preserves question pool order + index + HP.
- Clear on hero death and campaign complete.
- Unknown-boss reference → clear + log.
- Missing-question-ID → clear + log.

### Out of scope
- Multiple save slots.
- Cross-device sync.
- Mid-interstitial-recall resume fidelity (recall re-rolls).

## Feature 3 — Wrong-answer visibility

### Intent
Make it obvious which option was right when the hero loses HP — both in the moment (inline) and in review (post-boss).

### Sub-feature 3a — In-combat option recoloring

Replaces the current "hide options + rewrite bubble with `Incorrect. Correct: X`" pattern.

When `resolveAnswer` returns `wasCorrect: false`:
- **Chosen wrong option** — panel fill `0x4a1a1a`, stroke `0xe57373`, text prefix `✗ `.
- **Correct option** — panel fill `0x1a4a1a`, stroke `0x8bc34a`, text prefix `✓ `.
- **Other two options** — unchanged (navy).
- **Question stem** — stays in bubble (no longer overwritten).
- **Explanation** — renders below the options (same position as today).
- **Spellbook** — stays visible (current code hides it; remove that).

On "click to continue" → next question's `showCurrentQuestion` resets all 4 option panels to navy + clears the `✓/✗` prefixes (adds color-reset to the existing self-heal pattern).

### Sub-feature 3b — Post-boss interstitial mistakes review

Extends the interstitial beat sequence:

| Order | Beat | Condition |
|---|---|---|
| 1 | `narrative` | always |
| 2 | `mistakes-review` | **NEW** — only if `missedQuestions.length > 0`; paginated, one mistake per page |
| 3 | `recall` | always (unchanged: random domain Q for practice) |
| 4 | `primer` | always |

**Data flow:** `BossFightScene.onFightEnd('victory')` filters `sessionLog.questions` by `boss_id === this.boss.id && !was_correct`, resolves each against the current question pool, and passes the result as a new optional `missedQuestions` field on `InterstitialData`.

**InterstitialData extension:**
```ts
interface InterstitialData {
  previousBossId: string;
  nextBossId: string;
  mode: RunMode;
  nextBossIsolated?: boolean;
  missedQuestions?: Array<{
    questionId: string;
    stem: string;
    options: Record<'A'|'B'|'C'|'D', string>;
    correct: 'A'|'B'|'C'|'D';
    chosen: 'A'|'B'|'C'|'D';
    explanation: string;
  }>;
}
```

**`renderMistakesReview(idx)` layout:**
- Title: `📜 Mistake ${idx+1} of ${total}`.
- Stem text (wrapped, bodyText).
- 4 panels recolored via `paintOptionFeedback` helper: chosen=red+✗, correct=green+✓, others=dim.
- Explanation text below panels.
- Hint: `(press Space / Enter / click for next mistake)` on pages 0..N-2, `(press Space / Enter / click to continue)` on the last page.

Next-page advance wired into existing `onPointer()` switch: new branch for `mistakes-review` that increments `currentMistakeIdx` or transitions to `recall` when done.

### Shared helper

```ts
// public/dungeon/src/ui/optionFeedback.ts
export function paintOptionFeedback(
  panels: Phaser.GameObjects.Rectangle[],
  texts: Phaser.GameObjects.Text[],
  correct: 'A'|'B'|'C'|'D',
  chosen: 'A'|'B'|'C'|'D',
): void;

export function resetOptionFeedback(
  panels: Phaser.GameObjects.Rectangle[],
  texts: Phaser.GameObjects.Text[],
  stripPrefixes?: boolean,
): void;
```

Shared between BossFightScene (in-combat recolor) and InterstitialScene (mistakes-review recolor).

### Files touched
- New: `public/dungeon/src/ui/optionFeedback.ts` — ~40 LOC + 3 tests.
- New: `public/dungeon/src/data/interstitialHelpers.ts` — `buildMistakesFromSessionLog` + ~4-6 tests (no misses, one miss, multiple misses, unknown question ID defensive skip, boss-id filter).
- Modified: `BossFightScene.ts` — replace wrong-answer branch with `paintOptionFeedback`, add reset on next question, build + pass `missedQuestions` on fight-end. ~30 LOC delta.
- Modified: `InterstitialScene.ts` — new `mistakes-review` beat, `currentMistakeIdx` field, `renderMistakesReview`, onPointer dispatch extension, data plumbing. ~60 LOC delta.
- Modified: `types.ts` — extend `Beat` union with `'mistakes-review'`, extend `InterstitialData`.

### Out of scope
- Mid-combat 2-second flash of correct option (option B from research).
- Cross-boss cumulative mistake review on CampaignCompleteScene.
- Persistent weakness-queue write (already covered by existing `sessionLog` export).

## Build order

F1 → F3 → F2 (cheapest to costliest). Each lands as its own commit. Full test suite must pass after each. Browser smoke test (dev server + manual play-through 2+ bosses) after F3 and after F2.

## Invariants preserved

- **R6** ("no spell or passive reduces the knowledge work") — unchanged. F2 resume restores HP but does not add any path that avoids HP loss on wrong answers.
- **Save-scum allowed** — explicitly documented; the weakness queue is the countermeasure (cheat yourself → study the wrong things later).
- **Phaser scene re-entry safety** — F2's restore path in BossFightScene `init` must NOT move before the existing `optionTexts = []` / `spellButtons = []` / `optionButtons = []` resets in `create()`; those stay at the top of `create()` to preserve the stale-refs guard pattern.
