# Slay the Cert — Liveliness Pass Design

**Date:** 2026-04-20
**Author:** User + Claude (brainstorming session)
**Status:** Draft pending user approval
**Working title:** Slay the Cert — Liveliness Pass

**Related documents:**
- Research: [`docs/superpowers/research/2026-04-20-liveliness-research.md`](../research/2026-04-20-liveliness-research.md)
- Parent game spec: [`docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md`](./2026-04-18-slay-the-cert-gamification-design.md)
- Shipped game state: `project_slay_the_cert_shipped.md` (user memory)

---

## 1. Overview

### 1.1 Goal

Move Slay the Cert from "works but feels static between interactions" to "theatrical and alive" by adding (a) a restrained Lorekeeper narrator in a Mythic Oracle voice and (b) a code-only "feel pack" of on-hit juice — all without new art assets, without breaking R6 (knowledge-work invariant), and without regressing the game's existing 39/39 test suite.

### 1.2 Non-goals

- Not changing combat math or damage formulas. R6 stays intact.
- Not introducing per-character bark pools (Hades-style). That is a future pass.
- Not introducing flavor-text rows (Undertale-style). That is a future pass.
- Not voice-acting the narrator. Text-only.
- Not commissioning new art. All sprites, tiles, SFX stay as shipped.
- Not changing the existing audio toggle UX.
- Not modifying Hub, Interstitial, CampaignComplete scenes in this pass (narrator fires during BossFight only).

### 1.3 Success criteria

1. Narrator overlay fires on battle-start, phase-66/33/10% HP crossings, boss-defeated, hero-defeated, and spell-cast — Sparse density (~5-7 lines per 20-question fight).
2. All narrator lines render in the Mythic Oracle tone (flowing, metaphor-carrying, third-person, ≤90 chars).
3. 40 total narrator lines shipped: 25 boss-specific (5 bosses × 5 triggers) + 15 generic.
4. Feel Pack adds hit-stop, damage-graded shake, squash-stretch, stagger-back, and ambient dust particles to BossFightScene.
5. All 39 existing tests still pass. New tests added for line-pool, dispatcher, and feel-pack invariants.
6. R6 regression test (`wrong answer reduces hero HP by 1 regardless of multiplier`) still passes.
7. Narrator and feel pack can each be toggled independently (feature flags in build for dev sanity, not exposed to user yet).
8. No regression in input latency — option-click to damage-resolution stays within the existing timing envelope.

---

## 2. Requirements (locked during brainstorming)

| # | Requirement | Source |
|---|---|---|
| L1 | Narrator is a disembodied Lorekeeper voice — no dedicated character, no portrait. | Brainstorm card 1 = A |
| L2 | Tone is Mythic Oracle: flowing prose, one metaphor max per line, third-person, present tense, active voice. | Brainstorm card 2 = B |
| L3 | Sparse density: narrator fires ~5-7× per 20-question fight; ~40-line total writing budget. | Brainstorm card 3 = A |
| L4 | Placement is mid-canvas transient overlay — appears only on fire, fades out, never during read-and-decide. | Brainstorm card 4 = B |
| L5 | Line construction is hybrid: 25 boss-specific (5 bosses × 5 triggers) + 15 generic. | Brainstorm §3 default accepted |
| L6 | Spec scope includes the cheap code-only feel pack (hit-stop, shake grading, squash-stretch, stagger-back, ambient dust). | Brainstorm orthogonal-pack = B |
| L7 | No new art assets. All existing sprites and tiles reused. | Inherited from parent spec §2.1 (Asset budget $0) |
| L8 | R6 preservation: feel pack modules are pure display; they do not compute or alter damage. | Parent spec R6 |
| L9 | Narrator and feel pack hook into BossFightScene via `scene.events` pub-sub — no monkey-patching of combat.ts or spellbook.ts. | Architectural discipline |
| L10 | Timing: narrator fires after answer submission + damage animation resolves (~700ms post-submit). Never during read/decide. | Research §7 applied |

---

## 3. Architecture

### 3.1 Integration model

Two orthogonal subsystems — **Narrator** and **Feel Pack** — hook into [public/dungeon/src/scenes/BossFightScene.ts](../../../public/dungeon/src/scenes/BossFightScene.ts) through a pub-sub event bus backed by Phaser's built-in `scene.events` emitter. Neither subsystem touches `combat.ts`, `spellbook.ts`, or `questionLoader.ts`.

### 3.2 Event contract

BossFightScene emits semantic events at existing action points:

| Event | Payload | Emitted from |
|---|---|---|
| `battle-start` | `{ bossId: BossId }` | `create()` after assets + layout ready |
| `answer-correct` | `{ damage: number, bossHpPct: number, bossMaxHp: number }` | option-pointerdown correct branch, after damage applied |
| `answer-wrong` | `{ heroHpRemaining: number }` | option-pointerdown wrong branch, after hero HP decremented |
| `boss-phase-crossed` | `{ threshold: 66 \| 33 \| 10, bossId: BossId }` | after `answer-correct` damage, if HP% crossed a threshold this hit |
| `boss-defeated` | `{ bossId: BossId }` | when boss HP reaches 0, before victory transition |
| `hero-defeated` | `{ bossId: BossId }` | when hero HP reaches 0, before defeat transition |
| `spell-cast` | `{ spellId: SpellId, bossId: BossId }` | spell-pointerdown, after spell effect applied |

Emit additions to BossFightScene: ~8 lines total.

### 3.3 Subscriber lifecycle

- Narrator and Feel Pack modules register listeners in `BossFightScene.create()` after events are wired.
- Listeners unregister in `scene.events.once('shutdown', ...)`.
- No listeners persist across scene transitions.

### 3.4 Directory layout

```
public/dungeon/src/
├── ui/
│   └── narrator/
│       ├── NarratorOverlay.ts        (~80 LoC)
│       ├── NarratorDispatcher.ts     (~60 LoC)
│       ├── linePool.ts               (~40 LoC)
│       ├── lines.ts                  (~60 LoC — content)
│       └── *.test.ts
└── feel/
    ├── hitStop.ts                    (~30 LoC)
    ├── shakeGrading.ts               (~20 LoC)
    ├── squashStretch.ts              (~25 LoC)
    ├── staggerBack.ts                (~25 LoC)
    ├── ambientDust.ts                (~40 LoC)
    ├── install.ts                    (~25 LoC — registers all feel listeners)
    └── *.test.ts
```

Total new code: **~405 LoC** excluding tests and content. Each module averages ≤50 LoC and does exactly one thing.

---

## 4. Components — Narrator subsystem

### 4.1 NarratorOverlay.ts

**Responsibility:** Render a single narrator line at a time as a transient mid-canvas overlay; manage fade lifecycle.

**Public API:**

```ts
class NarratorOverlay {
  constructor(scene: Phaser.Scene);
  show(line: string, priority: Priority): void;
  hide(abort?: boolean): void;   // abort=true uses 200ms fast-fade (for next-question preemption)
  isShowing(): boolean;
  currentPriority(): Priority | null;
  destroy(): void;
}
```

**Visual spec:**

- Phaser `Container` holding a `Rectangle` (rgba(15,10,26,0.96)), a `Graphics` left-accent bar (3px wide, purple `#8a6ac0`), a `Text` (Georgia italic 14px, color `#c8b8e0`), and a soft box-shadow via secondary Graphics for glow.
- Positioned at canvas-centre `(480, 220)`, width `~800px`, padding `8×14px`, `setOrigin(0.5)`.
- Z-order: above boss sprite, below HP hearts (so HP stays readable).
- Fade-in tween: 300ms, ease `Sine.easeOut`, alpha 0→1, y translate from +10 to 0.
- Hold: 2500ms.
- Fade-out tween: 400ms, ease `Sine.easeIn`, alpha 1→0, y translate 0 to -8.

**State machine:**

```
IDLE → showing(SHOWING) → HIDING → IDLE
```

`show()` while `SHOWING`: applies priority rule (§4.2). `hide(abort=true)` skips to fast-fade regardless of state.

### 4.2 NarratorDispatcher.ts

**Responsibility:** Subscribe to BossFight events; map to narrator `Trigger` keys; sample a line; render via overlay with priority.

**Priority order** (highest first): `boss-defeated` > `phase-10` > `phase-33` > `phase-66` > `hero-defeated` > `battle-start` > `spell-cast`.

**Queue-or-drop rules:**

1. If overlay is `IDLE`, render immediately.
2. If overlay is `SHOWING` and new-line priority > current priority: call `overlay.hide(abort=true)` then render new line after the 200ms fast-fade completes.
3. If overlay is `SHOWING` and new-line priority ≤ current priority: drop the new line (do not queue).

**Next-question preemption:** Dispatcher listens for BossFight's question-transition signal (existing code path). If narrator is showing when the next question is about to load, dispatcher calls `overlay.hide(abort=true)` and the question appears on schedule.

**Trigger mapping:**

| Event | Trigger |
|---|---|
| `battle-start` | `battle-start` |
| `boss-phase-crossed (66)` | `phase-66` |
| `boss-phase-crossed (33)` | `phase-33` |
| `boss-phase-crossed (10)` | `phase-10` |
| `boss-defeated` | `boss-defeated` |
| `hero-defeated` | `hero-defeated` |
| `spell-cast` | `spell-cast` |

`answer-correct` and `answer-wrong` by themselves do **not** fire narrator lines under Sparse density. Phase-crossing events (fired from the same handler on threshold crossings) are the only way per-hit narrator lines fire.

### 4.3 linePool.ts

**Responsibility:** Pick a line for `(trigger, bossId?)` with last-N exclusion.

**Public API:**

```ts
class LinePool {
  constructor(lines: NarratorLine[]);
  pick(trigger: Trigger, bossId?: BossId): string;
  reset(): void;  // exposed for tests
}
```

**Algorithm:**

1. Filter pool to lines matching `trigger` AND (`bossId === bossId` OR `bossId === undefined` when no boss-specific match exists).
2. Prefer boss-specific matches if any exist; fall through to generic only when boss-specific pool is empty for this trigger.
3. Exclude lines in the last-N buffer (N=3 per trigger).
4. If filter leaves zero eligible lines, reset the last-N buffer for this trigger and retry.
5. If still zero (pool truly empty for this trigger+boss): fall back to `filler` generic pool.
6. If even filler is empty: return a compile-time hardcoded emergency line (`"The chamber holds its breath."`).
7. Push chosen line into last-N buffer.

### 4.4 lines.ts

**Responsibility:** Const-typed pool of 40 narrator lines.

```ts
export interface NarratorLine {
  text: string;
  trigger: Trigger;
  bossId?: BossId;
}

export const NARRATOR_LINES: readonly NarratorLine[] = [
  // — Orchestrator (5 lines) —
  { trigger: 'battle-start', bossId: 'orchestrator',
    text: 'The orchestrator raises his baton. The hall falls silent, and so must you.' },
  { trigger: 'phase-66', bossId: 'orchestrator',
    text: 'A tremor runs through the symphony. One section has gone out of tune.' },
  { trigger: 'phase-33', bossId: 'orchestrator',
    text: 'The conductor loses the thread. His composition begins to fray.' },
  { trigger: 'phase-10', bossId: 'orchestrator',
    text: 'The baton trembles in a hand that once held every note.' },
  { trigger: 'boss-defeated', bossId: 'orchestrator',
    text: 'The final measure resolves in silence. The orchestrator bows, and is gone.' },

  // — Compiler-King (5 lines) — TBD during implementation, sketched here:
  { trigger: 'battle-start', bossId: 'compiler-king',
    text: 'The forge-king hammers iron into argument. The heat rises.' },
  { trigger: 'phase-66', bossId: 'compiler-king',
    text: 'One rivet holds where two were needed. The structure whispers its weakness.' },
  { trigger: 'phase-33', bossId: 'compiler-king',
    text: 'A crack runs the length of his great anvil. He hears it, and does not look.' },
  { trigger: 'phase-10', bossId: 'compiler-king',
    text: 'The furnace cools. The king knows cold iron like he knows his own hands.' },
  { trigger: 'boss-defeated', bossId: 'compiler-king',
    text: 'The last spark leaves the forge. The iron remembers only the shape it held.' },

  // — Grammarian (5 lines) —
  { trigger: 'battle-start', bossId: 'grammarian',
    text: 'The grammarian opens the codex. Every word waits to be weighed.' },
  { trigger: 'phase-66', bossId: 'grammarian',
    text: 'A sentence goes unparsed. She reaches for it, and finds only silence.' },
  { trigger: 'phase-33', bossId: 'grammarian',
    text: 'The margins of her codex begin to burn. She does not put them out.' },
  { trigger: 'phase-10', bossId: 'grammarian',
    text: 'The grammarian speaks in half-lines now. The other halves are missing.' },
  { trigger: 'boss-defeated', bossId: 'grammarian',
    text: 'The codex closes. The last word in it is one she could not finish.' },

  // — Tool-Smith (5 lines) —
  { trigger: 'battle-start', bossId: 'tool-smith',
    text: 'The tool-smith lays out his instruments. Each has been used before.' },
  { trigger: 'phase-66', bossId: 'tool-smith',
    text: 'A file slips from his grasp. It is the one he trusted most.' },
  { trigger: 'phase-33', bossId: 'tool-smith',
    text: 'His bench is scattered. He cannot find the tool he needs, and blames no one.' },
  { trigger: 'phase-10', bossId: 'tool-smith',
    text: 'The tool-smith reaches for a hammer that is no longer there.' },
  { trigger: 'boss-defeated', bossId: 'tool-smith',
    text: 'The instruments rest where they fell. None will be used again.' },

  // — Memory-Kraken (5 lines) —
  { trigger: 'battle-start', bossId: 'memory-kraken',
    text: 'Something vast surfaces. It has been remembering, and resents the intrusion.' },
  { trigger: 'phase-66', bossId: 'memory-kraken',
    text: 'A tendril sinks. The chamber fills another inch with cold water.' },
  { trigger: 'phase-33', bossId: 'memory-kraken',
    text: 'The kraken forgets itself in pieces. Each piece is still dangerous.' },
  { trigger: 'phase-10', bossId: 'memory-kraken',
    text: 'Depth abandons it. What rises to the surface is already dissolving.' },
  { trigger: 'boss-defeated', bossId: 'memory-kraken',
    text: 'The waters still. What the kraken knew returns to whoever can hold it.' },

  // — Generic pool: spell-cast (4 lines) —
  { trigger: 'spell-cast',
    text: "The warlock's focus sharpens. Something old rises to her aid." },
  { trigger: 'spell-cast',
    text: 'An answer she did not know she knew arrives unbidden.' },
  { trigger: 'spell-cast',
    text: 'The spellbook remembers for her. She lets it.' },
  { trigger: 'spell-cast',
    text: 'A quiet word. A certainty that was not there before.' },

  // — Generic pool: hero-defeated (3 lines) —
  { trigger: 'hero-defeated',
    text: 'The candidate falters. The chamber claims another to its long silence.' },
  { trigger: 'hero-defeated',
    text: 'A final wrong note. The hall darkens, and the warlock is gone with it.' },
  { trigger: 'hero-defeated',
    text: 'She came to answer, and found a question she could not.' },

  // — Generic filler (8 lines — used for pool-exhaustion fallback) —
  { trigger: 'filler', text: 'The chamber holds its breath.' },
  { trigger: 'filler', text: 'Torches gutter. Nothing has changed, and everything has.' },
  { trigger: 'filler', text: 'A stone dislodges somewhere far above. It does not fall.' },
  { trigger: 'filler', text: 'The warlock steadies herself, and listens.' },
  { trigger: 'filler', text: 'The boss measures her, and is measured in turn.' },
  { trigger: 'filler', text: 'Silence presses against the walls like water.' },
  { trigger: 'filler', text: 'A lesson shifts its weight, waiting to be taken.' },
  { trigger: 'filler', text: 'The duel resumes, as all duels do.' },
] as const;
```

**Writing style guide (enforced by lint + review):**

- Max 90 characters per line
- One metaphor max per line — no stacking
- Third person narration; narrator never addresses the player as "you"
- Present tense, active voice preferred
- Boss referenced by epithet or archetype, not by proper noun in every line
- No contractions for the narrator ("does not" over "doesn't") — adds formality; matches Mythic Oracle tone

---

## 5. Components — Feel Pack (~140 LoC)

All Feel Pack modules subscribe to `answer-correct` and `answer-wrong` events. They are pure display — no damage mutation.

### 5.1 hitStop.ts

**Responsibility:** Briefly pause tween timeline on hit; sells impact weight.

**Spec:**

- On `answer-correct`: pause `scene.tweens` + ambient particle emitters for `duration_ms`.
- `duration_ms = clamp(Math.sqrt(damage) * 25, 40, 150)`. Damage=1 → 40ms; damage=4 → 50ms; damage=25 → 125ms (caps at 150ms).
- Does NOT pause `scene.time` (so fade timers keep their schedule).
- Does NOT pause input processing.
- On `answer-wrong`: same, scaled to hero damage (always 1 per R6), so always 40ms.

### 5.2 shakeGrading.ts

**Responsibility:** Camera shake intensity scales with damage.

**Spec:**

- On `answer-correct`: `camera.shake(duration, intensity)`
  - `duration = clamp(damage * 30, 80, 240)` ms
  - `intensity = clamp(damage / bossMaxHp * 0.04, 0.004, 0.025)`
- On `answer-wrong`: `camera.shake(120, 0.008)` — fixed mild shake for hero damage.

### 5.3 squashStretch.ts

**Responsibility:** Yoyo scale tween on hit recipient.

**Spec:**

- On `answer-correct`: on boss sprite, tween `{ scaleX: origX * 1.15, scaleY: origY * 0.85 }` over 80ms, yoyo, ease `Back.easeOut`.
- On `answer-wrong`: same on hero sprite.
- If a squash-stretch tween is active on the target: cancel and restart. Do not stack.

### 5.4 staggerBack.ts

**Responsibility:** Knockback + recovery on hit recipient.

**Spec:**

- On `answer-correct`: boss sprite tweens `x → x - 12` over 120ms (boss knocked left, away from hero), then tweens back to origin over 200ms.
- On `answer-wrong`: hero sprite tweens `x → x + 12` over 120ms, then back.
- If a stagger-back tween is active on the target: cancel, snap to origin, restart.

### 5.5 ambientDust.ts

**Responsibility:** Persistent pale particle drift during BossFight — "the room breathes."

**Spec:**

- Phaser `ParticleEmitter` using a 2×2 white-square texture (generated at runtime via Graphics → generateTexture).
- 4 particles emitted per burst; burst interval 2.5s.
- Random x across canvas, y starts near floor band (y=580-700), drifts upward 12-20px over 8-12s, alpha 0.3 max.
- Tint slight blue-grey `#c0c8d8` (torchlight dust, not heavy mist).
- Does NOT render when `bossFightActive === false`.
- Paused by hitStop module (registered as a pausable target).

### 5.6 install.ts

**Responsibility:** One-liner install so `BossFightScene.create()` can `installFeelPack(this)` and get everything wired.

```ts
export function installFeelPack(scene: Phaser.Scene): () => void {
  const disposers = [
    installHitStop(scene),
    installShakeGrading(scene),
    installSquashStretch(scene),
    installStaggerBack(scene),
    installAmbientDust(scene),
  ];
  scene.events.once('shutdown', () => disposers.forEach(d => d()));
  return () => disposers.forEach(d => d());
}
```

---

## 6. Testing

### 6.1 New vitest specs

All added to `public/dungeon/src/**/*.test.ts` alongside the existing 39 passing tests.

**`ui/narrator/linePool.test.ts`** (~10 cases):

- Returns a line for every trigger defined in `lines.ts`
- Never returns the same line twice within last-3 window (loop-test)
- Boss-id filter returns boss-specific lines when present
- Falls back to generic when no boss-specific match
- Pool-exhaustion path resets and returns a line (does not throw)
- Emergency hardcoded fallback fires only if all pools are empty (mutation test)

**`ui/narrator/narratorDispatcher.test.ts`** (~8 cases):

- `battle-start` event → fires battle-start line
- `boss-phase-crossed (66)` event → fires phase-66 line
- Rapid duplicate `answer-correct` events do not re-fire the narrator (dispatcher is stateless w.r.t. answer-correct — it just doesn't handle it)
- Higher-priority event during `SHOWING` preempts via `hide(abort=true)` then shows new
- Lower-priority event during `SHOWING` is dropped
- Next-question preemption → `hide(abort=true)` is called
- Multiple phase thresholds crossed in one hit → highest priority fires, others skipped

**`feel/hitStop.test.ts`** (~4 cases):

- Duration scales with damage via sqrt formula, clamped to [40, 150]
- Does not pause `scene.time`
- `answer-wrong` fires 40ms hit-stop
- Does not mutate damage (R6 guard)

**`feel/shakeGrading.test.ts`** (~3 cases):

- Intensity clamped to [0.004, 0.025]
- Intensity increases with damage
- `answer-wrong` uses fixed mild shake

**`feel/squashStretch.test.ts`** (~3 cases):

- Applies tween to boss on correct, hero on wrong
- Active tween is cancelled+restarted on new trigger (no stacking)
- Returns sprite to origin scale after yoyo completes

**`feel/ambientDust.test.ts`** (~2 cases):

- Emitter registered during BossFight active
- Paused by hitStop (integration smoke)

**`feel/feelPackDoesNotMutateDamage.test.ts`** (1 case, R6 regression):

- Install feel pack, trigger 10× `answer-correct` and 10× `answer-wrong` with instrumented damage observer
- Assert: damage observed at feel-pack listeners === damage emitted === damage in combat state

### 6.2 Preserved tests

All 39 existing tests must still pass unchanged. CI assertion: `npm test` returns green with 39 + ~31 new = ~70 passing.

### 6.3 Manual verification (playwright smoke)

Existing smoke test is extended: after fight starts, assert narrator overlay container exists in Phaser scene registry. Actual render-correctness is visually verified in browser.

---

## 7. Edge cases

| Case | Behaviour |
|---|---|
| Boss defeated on same hit that crosses phase-10 | Fire `boss-defeated` line (higher priority), drop `phase-10` |
| Multiple phase thresholds crossed in one hit (e.g., 66% → 25% skipping 33%) | Fire highest priority only (10%), skip others |
| Narrator showing when question transitions in | `hide(abort=true)` — narrator fast-fades over 200ms, question appears on schedule |
| Narrator showing when boss dies | `boss-defeated` preempts any current line |
| Spell cast during narrator showing | Dropped (spell-cast is lowest priority); the mechanical effect still applies |
| Debug mode preview (Hub "fight Orchestrator only") | Narrator fires normally — same event bus |
| Boss-specific line pool exhausted mid-fight | Generic fallback (§4.3 step 2) |
| All boss-specific AND generic exhausted (shouldn't happen; 40 lines + 7 triggers) | Emergency hardcoded filler fires |
| Mute state (SFX or BGM toggled off) | Narrator unaffected — it is text-only |
| Feel pack running during a tween-heavy spell effect | Hit-stop still fires; spell tweens pause with everything else; smoke-tested |

---

## 8. Invariants (enforced by code + tests)

- **R6 (parent spec):** No display module computes or alters damage. Feel pack listeners observe only. `feelPackDoesNotMutateDamage.test.ts` locks this.
- **Single overlay:** Only one narrator line visible at a time; no stacking. State machine enforces this.
- **Bounded LoC:** Each module stays ≤80 LoC. Larger = split further.
- **No global mutable state:** All state (last-N buffer, overlay show/hide) scoped to scene lifetime. Scene shutdown fully disposes listeners.
- **No new assets:** Zero image, audio, or font downloads. Narrator text uses the CC0 Georgia font already available or falls back to system serif.
- **Test count:** 39 → ~70 (±5) passing, no existing test removed.

---

## 9. Build sequence

Intended for execution in `.worktrees/slay-the-cert` via `superpowers:subagent-driven-development`, but small enough for a single focused session.

1. **Scaffold directories + install.ts skeletons** (30 min)
2. **Feel Pack modules** (2-3 hours, tests-first per module)
3. **NarratorOverlay + state machine** (1 hour, tests for lifecycle)
4. **linePool + lines.ts content** (1.5 hours — content writing is the bulk)
5. **NarratorDispatcher + priority/queue rules** (1 hour, tests for preemption)
6. **BossFightScene event emissions + install calls** (30 min)
7. **R6 regression test** (15 min)
8. **Playwright smoke extension** (15 min)
9. **Local verification in browser** — play all 5 boss fights end-to-end, verify narrator fires at expected moments, feel pack lands appropriately
10. **Commit + PR + deploy** (via existing quartz-deploy.yml pipeline)

Estimated total: **6-8 hours** of focused work, ≤2 implementation sessions.

---

## 10. Out of scope (future passes)

- Per-character bark pools (Hades model) — separate spec
- Flavor-text rotation per question (Undertale model) — separate spec
- Narrator voice acting / VO — separate spec + cost
- Narrator mute toggle — add if users request; not needed for sparse text-only
- Phase-specific BGM layering — separate audio spec
- Boss sprite HP-threshold tint darken — flagged in deferred list, separate mini-spec
- Spellbook tier grouping visual — deferred list, separate
- Grammarian floor tile swap, anvil tile swap — deferred list, separate
- Idle-timeout bark (15s no-input) — deferred to future bark-pool pass
- Focus spell implementation — orthogonal, separate mini-spec

---

## 11. Open questions

None at spec time. If the Compiler-King / Grammarian / Tool-Smith / Memory-Kraken draft lines in §4.4 need revision during implementation, that is a content-review task not a design change.

---

## 12. References

- Research report: [`docs/superpowers/research/2026-04-20-liveliness-research.md`](../research/2026-04-20-liveliness-research.md)
- Parent spec: [`docs/superpowers/specs/2026-04-18-slay-the-cert-gamification-design.md`](./2026-04-18-slay-the-cert-gamification-design.md)
- Parent implementation plan: [`docs/superpowers/plans/2026-04-18-slay-the-cert-implementation.md`](../plans/2026-04-18-slay-the-cert-implementation.md)
- Live game: https://silver-snoopy.github.io/ai-kb/dungeon/
- Current bundle: `index-D5LgcCw4.js` on main `4a7570a`
