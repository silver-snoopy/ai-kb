# Post-Credit Stinger — "The Vanishing" — Design Spec

**Date:** 2026-05-31
**Author:** Daniel Sallai (with Claude as senior game designer)
**Status:** Approved design, pending implementation plan
**Surface:** `public/dungeon/` (Slay the Cert browser game)
**Related:** talk 2026-06-03 (`docs/superpowers/specs/2026-05-25-slay-the-cert-talk-design.md`), demo mode, `CampaignCompleteScene`

---

## 1. Purpose

Add a Marvel-style **post-credit stinger** to the dungeon game that creates anticipation for a hypothetical "Episode 2," and that the presenter can fire **with a single click** as the closing flourish of the 2026-06-03 meetup talk (the "…and one more thing" beat).

The stinger is a **hidden, demo-only flourish** — not part of normal playthroughs. A normal player never sees it fire; they only see an inert decorative HUD element. There is **no auto-chain** after the victory screen.

### Success criteria
- **One click** on a HUD decoration plays the stinger, reachable from **both** the Hub (canonical home) and the Boss-Fight screen (fire in place) during the demo — so the trigger is one click away wherever the dungeon is sitting. (Final build keeps whichever mount wins the local A/B; Hub is the predicted winner.)
- The trigger is **invisible as a control** to normal players (reads as decorative chrome) and **does nothing** for them (armed only in demo mode).
- The stinger lands as a ~12–14s self-contained cinematic that ends on a mysterious promise + a small 4th-wall wink.
- **Zero new art assets.** No impact on real-game progression, NG+, saves, or the question bank.

---

## 2. Research basis (why the design is shaped this way)

Three convergent findings from film + game post-credit design (sources in the brainstorm transcript):

1. **The pause is the payload.** A stinger reads as "there's more" because of the dead air *before* it — the viewer has filed the experience as "over" and the silence violates that expectation. → **Open on held black + silence.**
2. **Cryptic beats explicit.** The most-discussed stingers plant *unresolved mystery*, not exposition (*Hollow Knight*'s "To Be Continued"; *Kingdom Hearts II*'s message-in-a-bottle). → **Promise, don't specify.**
3. **One clean beat, then stop.** The strongest game stingers are a single image + a single line of text. Length is the enemy. → **~12s: one vanish, one line, one glyph.**

A fourth, talk-specific principle: this stinger doubles as the **keynote close** for a room of engineers, so it carries a small late 4th-wall wink that doubles as a soft CTA — without deflating the epic line above it.

---

## 3. User-approved decisions

| Decision | Choice |
|---|---|
| Narrative payload | **Deliberately mysterious** — promise nothing specific; close on an arcane rune. Small playful wink allowed *inside* the frame. |
| Scene treatment | **Treatment A — "The Vanishing"** (walk-in → golden scroll → white-flash teleport → black → "Our hero will return…" + rune + tiny wink). |
| Trigger | A **permanent decorative HUD element**, visible to all players, **armed only in demo mode**. Element is the designer's choice (see §4.1) — a sword was only an analogy. |
| Auto-chain after victory | **No.** Sword/sigil trigger only. |
| Demo isolation | Trigger and scene must be gated to demo mode and must not touch real progression. |

---

## 4. Architecture

Four small, independently testable units. No changes to combat, bank, saves, or NG+ logic.

| Unit | File | Responsibility | Depends on |
|---|---|---|---|
| Demo-mode flag | `src/game/demoMode.ts` | Read/set a **sticky** demo-context flag (registry + localStorage + `?demo=1` URL param). | Phaser registry, `localStorage` |
| Decorative sigil | `src/ui/decorativeSigil.ts` | Mount the permanent rune in the HUD; wire click → stinger **only if** `demoMode` is active. | `demoMode`, `transitions` |
| The cinematic | `src/scenes/PostCreditScene.ts` | The stinger choreography: tweens, white flash, particle ring, text. Pure presentation. | `transitions`, `backdrops`, `ambientDust` |
| Registration | `src/main.ts` | Register `PostCreditScene` in the scene list. | — |

### 4.1 The decorative element (designer's choice)

**An arcane rune sigil** — the *same glyph* the stinger ends on. Rationale: the trigger and the payload rhyme (you click the rune; the prophecy you trigger ends on that rune pulsing). It is more on-theme for a *warlock/tome* game than a sword, and costs nothing extra because the stinger already renders the glyph.

- **Visual:** a small warded-diamond / eye rune, parchment-tinted (`#c0c0d0` / `#f5e4b3` family), matching the existing HUD chrome styling (same font/padding language as `audioToggles`).
- **Camouflage rules:**
  - Visible and rendered **for all players, always** (it is genuinely permanent decoration, not a debug artifact).
  - **No hand-cursor** on hover (`useHandCursor: false`) — a hand-cursor would betray it as a button.
  - **Inert** unless `demoMode` is active: when not in demo mode, the sigil has **no interactive handler at all** (clicking does nothing).

#### Placement — build BOTH, A/B locally, keep the winner

The mount helper is written once and called per-scene, so two mounts cost ~one extra line. We build both, A/B them in a local dev session, and **remove whichever reads worse**.

- **Mount 1 — Hub** (*research-predicted winner*): a ward beside the Hub title `🏰 Gates of the Archive` (title at `(480,50)` — `HubScene.ts:80`; sigil ≈ `x=720, y=50`, `setScrollFactor(0)`, `setDepth(1000)`). The Hub is the opening screen, the stable home base, and — per the placement research below — the canonical surface for hidden curios.
- **Mount 2 — Boss Fight HUD**: a ward beside the boss-name banner (`(480,30)` — `BossFightScene.ts:179`; sigil ≈ `x=700, y=30`). Lets the presenter fire it **in place** at the end of the slide-8 demo without leaving the fight.

**Placement research (predicts Hub):** A permanent decorative rune on the *combat* HUD is non-essential information on a high-intensity screen, and HUD best practice is to *minimize* extraneous elements during combat — clutter "demands visual search rather than pattern recognition" ([getambush](https://www.getambush.com/article/cognitive-load-optimization-in-combat-systems/), [wayline](https://www.wayline.io/blog/minimize-cognitive-load-game-ui), [datacalculus](https://datacalculus.com/en/blog/computer-games/uiux-designer/developing-user-friendly-huds-in-computer-games-a-guide-for-uiux-designers)). Meanwhile main menus are the *traditional* home for hidden Easter eggs and meta curios, which should reward curiosity "without affecting the main game flow" ([GamesRadar](https://www.gamesradar.com/the-hidden-value-of-video-game-main-menus-and-the-design-secrets-that-compel-you-to-hit-play/), [Game Developer](https://www.gamedeveloper.com/game-platforms/surprise-your-players-easter-eggs-design-in-games)). The boss-HUD mount's only edge — firing in place — is moot because exiting to the Hub after the demo is frictionless. **Expectation: the Boss-HUD mount is the likely removal candidate after the local A/B.**

### 4.2 Demo-mode flag (`demoMode.ts`)

A **sticky** flag distinct from the existing per-run `demoRun` flag.

- **Why separate:** on the primary (boss-fight) screen, `demoRun` is already active during a demo, so the gate would be satisfied there alone — but `demoMode` unifies the arming condition: it (a) enables the **`?demo=1` pre-arm** path so the presenter can drop straight into a demo fight reliably, and (b) covers the Hub **fallback** placement, where `demoRun` is cleared on return (`HubScene.ts:61-65` swaps the real bank back and `registry.remove('demoRun')`). One sticky flag, one concept, works everywhere the sigil might live.
- **Set true when any of:**
  1. A demo campaign is launched (`HubScene.beginDemoCampaign` sets it), OR
  2. The page URL contains `?demo=1` (or `#demo`) — checked on boot. **This is the talk path:** open `localhost:5173/?demo=1` and the sigil is live from the first screen, no campaign needed.
  3. (Read-through) `localStorage['stc:demoMode'] === 'true'`.
- **API (shape):**
  - `isDemoMode(scene): boolean` — true if registry flag set, or URL param present, or localStorage set.
  - `enableDemoMode(scene): void` — set registry + localStorage.
  - Reads must be resilient to `localStorage` being unavailable (mirror the `audioToggles` try/catch pattern).
- **Isolation guarantee:** `demoMode` only ever gates the sigil's interactivity and (optionally) cosmetic demo affordances. It must **never** influence bank selection, scoring, saves, or NG+ — those remain governed solely by `demoRun`.

### 4.3 The scene (`PostCreditScene.ts`)

A self-contained Phaser scene. On any input (pointer or key) **after the text has appeared**, or after a **~20s auto-timeout**, it `fadeToScene('HubScene')`. The auto-timeout guarantees the presenter is never stranded.

All motion is built from tweens + a full-screen white flash rectangle + one particle/graphics ring + text. The hero is the existing static `hero` image; the "teleport" is sold by the flash masking an `alpha→0 / scale→0` set at the white peak.

---

## 5. Storyboard — "The Vanishing"

Canvas is 960×720. Hero static image `hero` at ~3× scale. Timings are targets; final values tuned in implementation.

```
BEAT 0 — THE BREATH        0.0–1.5s   Hard cut to BLACK. BGM ducks to a low drone
                                       (respect bgmMuted). Silence holds.

BEAT 1 — ENTRANCE          1.5–4.0s   Dim torch-lit floor fades up (backdrops, low
                                       alpha). Warlock walks L→R: x tween -60→340,
                                       2px sine vertical bob = footsteps, faint dust
                                       kick (ambientDust). Stops left-of-centre, faces R.

BEAT 2 — THE SCROLL        4.0–6.5s   The GOLDEN PARCHMENT (callback to the victory
                                       item) glows in before him with an amber pulse.
                                       He reads it. [WINK lives here: the freeze-frame
                                       scroll text is a small in-joke, not dwelled on.]

BEAT 3 — IGNITION          6.5–7.3s   Scroll/staff flare; hero squash-stretch up; light
                                       floods the frame.

BEAT 4 — WHITE FLASH       7.3–7.5s   Full-screen WHITE (rect alpha 0→1, ~120ms). Under
                                       cover of white: hero set alpha 0 + scale 0. The
                                       vanish happens unseen.

BEAT 5 — EMPTY FLOOR       7.5–8.3s   White recedes (alpha→0, ~350ms) → he is GONE. A
                                       ring of arcane particles collapses inward where
                                       he stood. SFX: reverse-whoosh / chime (respect
                                       sfxMuted).

BEAT 6 — BLACK BREATH      8.3–9.5s   Fade to BLACK. Hold ~1s. Nothing on screen.

BEAT 7 — THE PROMISE       9.5–12s    Serif-italic, centred, fades in:
                                           "Our hero will return…"
                                       Then a single RUNE (the sigil glyph) pulses once,
                                       dim, beneath the line.

BEAT 8 — THE WINK          12–14s     Tiny monospace, bottom, fades in:
                                           // to be continued — pending review
                                       From here, any input / 20s timeout → fade to Hub.
```

### 5.1 Copy

- **Closing line (default):** `Our hero will return…`
  - **Alternative on file (designer's pick if a cert-flavored line is wanted):** `The scholar's work is never finished…`
- **Wink (bottom, tiny, late):** `// to be continued — pending review`
- **Scroll freeze-frame text (Beat 2, optional):** a single short line, e.g. `next: ???` — kept small, never the focus.

### 5.2 Typography note

Gameplay uses `monospace`. For the closing line, use a **serif italic** (`'Georgia', serif`) to read as *filmic* and distinct from gameplay UI. The wink stays `monospace` (it is the "engineer" register). This contrast is intentional: epic serif promise vs. wry monospace footnote.

---

## 6. Out of scope (YAGNI)

- Auto-chaining the stinger after `CampaignCompleteScene` (explicitly declined).
- Keeping *both* sigil mounts permanently — we build both only to A/B them, then prune to one (predicted: Hub).
- New art assets, new bosses, or any actual "Episode 2" content (the silhouette/new-villain treatment was rejected).
- Any change to scoring, the question bank, saves, or NG+ progression.
- Localization / accessibility audio description of the cinematic (not warranted for a hidden demo flourish).

---

## 7. Testing strategy

Follow the repo's existing Vitest + Playwright patterns.

**Unit (Vitest):**
- `demoMode`: returns false by default; true after `enableDemoMode`; true when URL has `?demo=1`; resilient when `localStorage` throws.
- `decorativeSigil`: mounts a visible object for all players; attaches an interactive handler **only** when `demoMode` is active; handler is absent otherwise.

**Scene smoke (Playwright, dev-exposed `__STC_GAME__`):**
- With `?demo=1`, clicking the sigil (Hub mount **and** Boss-HUD mount) transitions to `PostCreditScene`.
- Without demo mode, clicking either sigil does **not** change scene.
- `PostCreditScene` reaches its text beat and returns to `HubScene` on input (and via the auto-timeout, time-mocked).

**Manual / talk dry-run + A/B:**
- `localhost:5173/?demo=1` → confirm the Hub sigil and the Boss-HUD sigil each play the full stinger and return to Hub. Verify at projector resolution (1600×900) per the talk's established breakpoint.
- **A/B judgement:** with both mounts live, decide which reads better as camouflaged chrome (clutter, eye-draw, "secret door" feel). Keep the winner; delete the loser.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Sigil betrays itself as a button to normal players | No hand-cursor; no handler at all when not in demo mode; styled as existing chrome. |
| `demoRun` cleared on Hub return disarms the trigger mid-talk | Separate sticky `demoMode` flag + `?demo=1` pre-arm path. |
| Static hero can't "teleport" convincingly | White-flash masks the `alpha/scale→0` set at the white peak (classic 2D trick). |
| Presenter stranded on the stinger on stage | Any-input dismiss **and** ~20s auto-timeout back to Hub. |
| Wink deflates the epic line | Wink is small, monospace, and late (Beat 8), under the serif promise. |
| Stinger accidentally affects progression | `demoMode` only gates cosmetics/interactivity; progression stays on `demoRun`; stinger writes nothing to saves. |

---

## 9. Build sequence (for the implementation plan)

1. `demoMode.ts` + unit tests (pure logic, no Phaser scene needed beyond a registry stub).
2. `PostCreditScene.ts` + registration in `main.ts` + scene smoke test (reachable via direct `scene.start`).
3. `decorativeSigil.ts` + unit tests; mount in **both** `HubScene` (beside the title) and `BossFightScene` (beside the boss-name banner); wire `beginDemoCampaign` to `enableDemoMode`.
   - After the local A/B evaluation, **remove the losing mount** (predicted: drop the Boss-HUD mount). This is a one-line deletion, no other code changes.
4. Choreography polish pass on `PostCreditScene` (timings, flash, particle ring, copy, typography).
5. Playwright end-to-end (`?demo=1` → sigil → stinger → Hub) + projector-resolution dry-run.
