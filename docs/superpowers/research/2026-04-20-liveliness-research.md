# Liveliness in Menu-Driven Combat — Patterns Report

**Date:** 2026-04-20
**Scope:** Research input for the Slay the Cert Liveliness Pass spec
**Method:** Deep-research subagent against Slay the Spire, Darkest Dungeon, Undertale, Hades, Paper Mario / Bug Fables, Pokemon, FF Tactics / Chrono Trigger, Hollow Knight, Inscryption

A structured research pass on how turn-based / menu-driven combat games inject presence, personality, and theatre into what is structurally "two sprites staring at each other while the player reads." Organised for direct adoption into Slay the Cert (Phaser 3 + TS, Kenney Tiny Dungeon art).

---

## 1. Bark / Dialogue Systems

**What a "bark" is:** a short, context-triggered line (1-2 sentences) spoken by a character or narrator. Distinct from scripted dialogue because it is *sampled* from a pool at runtime based on game state.

### Canonical patterns

**Slay the Spire — Intent-as-bark.** STS has almost no verbal barks; its equivalent is the *intent icon* above each enemy (sword+number = attacking for X; shield = blocking; hourglass = buffing). Compressed, language-free bark. Pool is small (~8 intent types), but each enemy's intent sequence is a scripted pattern per enemy AI. The liveliness comes from *predictability interrupted by surprise* — knowing what is coming creates anticipation even without text.

**Darkest Dungeon — The Ancestor (narrator) bark pool.** Datamined pool is roughly 400-600 lines total across all triggers. Triggers and approximate pool sizes:

- Critical hit dealt: ~25 lines
- Critical hit received: ~20 lines
- Death's Door check survived: ~15 lines
- Death's Door check failed: ~30 lines, weighted by cause
- Stress threshold crossed: ~20 lines
- Virtue roll (rare positive): ~15 lines
- Room entered / curio interacted: dozens, location-tagged
- Battle start / battle won: ~40 each

Repetition avoidance: last-N exclusion (typically N=3-5) per trigger pool, plus a global "recent lines" buffer.

**Darkest Dungeon — Hero afflicted barks.** On 100-stress Afflicted roll, heroes gain per-affliction bark pool (~10-15 lines each) that fires at turn start, on ally heal, on ally crit, on own miss. Per-class AND per-affliction. This is what makes DD feel like a theatre troupe.

**Undertale — Flavor text per enemy turn.** Each monster has a small bark pool (~4-8 lines) shown in the "* " flavor box at turn start. These rotate based on ACT commands used. Text itself *wobbles* on certain letters for certain characters. Font choice is a bark.

**Hades — The gold standard for bark scale.** Supergiant shipped ~20,000+ VO lines. Structural patterns:

- **Context tags** per line (e.g., `weapon=stygius AND boss=meg AND run>10 AND first_meeting_today=false`). Lines filtered to those whose tags all match, then weighted.
- **First-say flag**: one-shot per line; once played, removed until conditions reset.
- **Priority tiers**: story-critical lines displace ambient; ambient only plays when nothing prioritised qualifies.
- **Cooldowns per speaker**: per-NPC cooldown (~3-5 minutes real-time).

**Inscryption — Leshy's running commentary.** Reacts to *actions*, not state. Card drawn with rare sigil → comment. Sacrifice of own creature → comment. Stalling > 20s → impatient comment. Pool small (~200 lines) but triggers specific enough that repeats feel scripted.

### Timing rules across these games

- Bark text appears in speech bubble or subtitle for **1.5-3.5s** depending on length (~60 ms/char is the Undertale/Hades standard).
- Barks **never block input** in Hades or Darkest Dungeon — they fire, fade, combat continues. Inscryption is the exception.

---

## 2. On-Hit / On-Damage Reaction Patterns

Named techniques in order of impact-per-line-of-code:

**Hit-stop (aka hit-freeze, impact freeze).** On damaging hit, pause the game for 50-150ms. Sells weight more than any shake or flash. Canonical in Smash Bros., Hollow Knight, Hades, Slay the Spire's heavy-strike cards. Scale by damage.

**Shake grading.** Screen-shake amplitude proportional to damage dealt. Hades uses roughly `amplitude = sqrt(damage) * base`. Kills flat-shake-on-everything feel.

**Squash-and-stretch on impact.** On hit, target briefly scales X=1.2, Y=0.8 for 80ms then rubber-bands back. Paper Mario / Bug Fables lean hard on this.

**Stagger-back with recovery.** Target knocks back ~8-16px on X, tweens back over 200ms. Slay the Spire uses this on every hit.

**Flash layering.** Single white-flash reads "boring hit." Layered flashes read impact: normal hit = red tint 80ms; crit = white-flash 50ms → red tint 120ms → shake.

**HP-threshold pose swaps.** Darkest Dungeon, FF Tactics, Chrono Trigger, Paper Mario: characters change sprite at HP thresholds. Cheapest version with Kenney tiles: at <33% HP, swap to tinted-darker sprite and add subtle ±3° lean.

**Freeze-frame on crit.** Time-scale to 0.1 for 150ms, flash-white, release. Hades and Dead Cells both use this.

**Hit particles.** 4-6 white/red pixel particles spraying from impact point for 300ms reads as impact.

**Damage-number choreography.** Scale by damage. Crit = yellow + 1.5× size + wobble. Arc trajectory parabolically. Stack: offset horizontally if multiple numbers in <300ms.

**Damage-colour convention.** White = normal, yellow = crit, blue = magical, green = healing, grey = blocked, red = player-taken.

---

## 3. Idle / Ambient Liveliness

When nothing is happening, the screen needs to *breathe*.

**Breathing loop.** Every character sprite has 2-3s vertical bob (±1-2px) on sine curve. Refinements:

- Breathing *slows* when character is wounded (<33% HP): 3s period → 4.5s period
- Breathing *speeds* during "intent" tells

**Eye-blink timing.** Blink every 3-7s, randomised. Fake with 50ms Y-scale squish.

**Weight-shift / idle sway.** Darkest Dungeon heroes sway side to side. ±2° rotation on 5-6s period, offset per character so not synchronised.

**Ambient particles.** Single highest ROI ambient win:

- Dust motes drifting in torchlight (Darkest Dungeon, Hollow Knight): 3-5 slow pale particles, vertical sine drift, 8-12s lifetime
- Torch embers: occasional orange spark from torches
- Dripping water SFX + occasional "plink" particle
- Bat silhouette crossing background every 30-90s
- Mice scurrying across floor every 45-120s

**Parallax background drift.** Even without a second layer, very slow horizontal drift of existing background (0.3 px/s) reads as "the world is a place."

**Torch flicker.** Multiply brightness randomisation by Perlin noise rather than pure random — reads as organic flame.

**Ambient barks on idle timeout.** Player hasn't picked answer in ~15s → fire low-priority bark. Pool 4-6 per character. Resets on input.

---

## 4. Phase Transitions and Theatrics

Bosses with phase shifts at HP thresholds (66%, 33%, 10%) feel dramatically more alive than flat-HP bosses.

**Hollow Knight pattern.** At phase transition: screen-freeze, boss roars, white flash, camera pulls in, sprite swaps to enraged variant, BGM layer adds.

**Darkest Dungeon pattern.** Narrator fires phase-specific line; combat music shifts filter (low-pass opens).

**Slay the Spire pattern.** Elites and bosses have scripted dialogue at turn 1 and on defeat.

### Cheap phase-transition kit

**At boss 66% HP:** one-shot bark · camera zoom 1.05× 500ms · boss sprite tint red · BGM drone layer add · screen flash boss-theme colour 100ms.

**At boss 33% HP:** different bark · torches flicker harder · boss breathing amplitude doubles · damage numbers from boss larger.

**At boss 10% HP:** sprite slight rotation (canted) · one-shot "last stand" bark.

---

## 5. Narrator / Omniscient Voice Patterns

**The Ancestor (Darkest Dungeon).** Diegetic — he is the ancestor whose hubris caused the Estate's corruption. Comments on specific mechanical events with poetic, thematically-consistent language. Pool ~500 lines.

**Leshy (Inscryption).** Is the opponent. Commentary is also combat dialogue. 1v1 card-game only.

**Hades narrator.** Fires only at run-end screens and key moments. Frames runs narratively. Restrained.

**When narrator beats character barks:**

- Characters cannot reasonably know what the player knows (meta-commentary, historical flavor)
- One character is silent and needs a proxy
- Tone is explicitly fable/mythic
- Comic (Bastion)

**For Slay the Cert:** narrator fits because bosses are *conceptual* (Orchestrator, Compiler-King, Grammarian) — mythic framing earns mythic voice.

---

## 6. Cheap / High-ROI Liveliness Wins (Prioritised)

For Slay the Cert's constraints (tween-driven Phaser 2D, Kenney Tiny Dungeon, no new art budget, text-heavy gameplay):

| # | Pattern | Cost | Impact |
|---|---|---|---|
| 1 | Hit-stop on crit (80ms global freeze) | 10 LoC | Huge |
| 2 | Shake amplitude scaled to damage | 5 LoC | Huge |
| 3 | Squash-and-stretch on hit | 10 LoC | Huge |
| 4 | Stagger-back on hit | 15 LoC | Large |
| 5 | Ambient dust/ember particles | 30 LoC | Large |
| 6 | Bark system + 20 lines per boss | 150 LoC + content | Huge |
| 7 | Idle-timeout taunts (15s no-input) | 20 LoC | Medium |
| 8 | Phase-transition one-shot barks at 66/33/10% | 40 LoC | Large |
| 9 | HP-threshold sprite tint darken | 5 LoC | Medium |
| 10 | Damage-number arc + size-by-damage | 20 LoC | Medium |
| 11 | Eye-blink fake | 15 LoC | Small-Medium |
| 12 | Camera zoom on phase transition | 10 LoC | Medium |
| 13 | Parallax background drift | 5 LoC | Small-Medium |
| 14 | Colour-coded damage numbers | 5 LoC | Small |
| 15 | Boss breathing-rate responds to HP | 10 LoC | Small |

First five items alone transform felt-liveliness for <100 LoC total.

---

## 7. Reading-Heavy Combat: Should Things Move While Player Reads?

Critical UX question — 70%+ of screen-time is question-parsing.

**Accepted answer:** subtle ambient animation during reading is fine and desirable; punchy/attention-grabbing animation is not.

**Evidence:**

- **Slay the Spire** keeps enemies idle-bobbing while player reads hand. ±2px over 2-3s — sub-threshold distraction.
- **Darkest Dungeon** keeps heroes and monsters in idle loops during planning. Ancestor fires *between* turns.
- **Undertale** *pauses* all background animation during flavor text, resumes after. Deliberate stillness weaponised.
- **Inscryption** pauses nothing; Leshy overlaps turns because overlap is the point.

**Rules of thumb:**

1. Idle animations at low amplitude (<3px, slow periods) during reading: **good**.
2. Ambient particles and background drift during reading: **good**.
3. Bark bubbles during reading: **bad** unless short and non-overlapping with question text.
4. Sprite reactions (shake, flash, stagger) during reading: **bad** — player didn't cause them.
5. Sprite reactions *after* answer submission but *before* next question: **essential**. 600-900ms reaction window is the pacing sweet spot.

**For Slay the Cert specifically:**

- Breathing loops, torch flicker, ambient particles: run continuously
- Bark zone: reserved region, never overlaps question panel
- Idle-timeout barks: fine (only fire after 15s of stalling)
- After submission: freeze background drift during 600-900ms reaction window, resume after

---

## 8. Anti-Patterns

**Bark pools too small.** <10 lines per trigger = same line 3× in 15 min, character becomes a meme. Minimum: 8-10 per trigger, 15+ preferred.

**Barks that block input.** Any dialogue forcing dismissal before action = hated within 10 min. Let barks auto-fade. Never gate a turn on a bark.

**Shake on everything.** Reserve shake for hits, grade by damage, skip on misses.

**Idle animations too loud.** Full animation loops during turns steal focus. Keep idles <3px/±3° movement.

**Pop-up dialogue mid-input.** If bark appears over A/B/C/D answer buttons during hover, player mis-clicks. Bark zones outside input hitbox.

**Voice lines without mute.** Every Hades/DD player mutes VO eventually. Ship separate VO slider day one.

**"Epic" repeat lines.** Boss saying "PREPARE YOURSELF" every battle starts epic, ends joke by battle 4. Either 8+ opening lines per boss, or skip.

**Overusing narrator.** DD Ancestor fires on <20% of game events. Restraint.

**Animations chaining longer than interaction.** 4s attack animation for 0.5s decision = punishment. Cap reaction window 600-900ms, crit cap 1.5s.

**Particle soup.** >3 simultaneous particle systems = visual noise. Pick best 3.

**Low-HP red vignette that never fades.** Gets tuned out within a minute. Flash briefly on each hit while low-HP, then fade.

---

## Priority Adoption Path for Slay the Cert

1. **Pass 1 (code-only, no content):** hit-stop on crit, shake grading, squash-stretch, stagger-back, damage-number polish, ambient particles. ~100 LoC, no writing. Closes ~60% of "static" gap.
2. **Pass 2 (bark system + content):** Bark sampler with last-N exclusion and tag filtering. 20 lines per boss × 5 = 100. Hero barks ~15. ~150 LoC + ~500 lines text.
3. **Pass 3 (theatrics):** Phase transitions 66/33/10%, HP-threshold pose tints, idle-timeout taunts, Lorekeeper narrator ~40 lines. ~100 LoC + ~150 lines text.

Total: ~350 LoC + ~650 lines writing to move Slay the Cert from "works but feels static" to "theatrical and alive." No new art required.
