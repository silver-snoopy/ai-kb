# Spec — Merge Slides 3 & 4 into One ("A Dozen in a Dozen")

**Date:** 2026-05-26
**Owner:** Daniel Sallai (presenter)
**Talk:** Slay the Cert — meetup, 2026-06-03
**Branch (when implementing):** `feat/talk-merge-slide-3-4`
**Related:**
- [Talk design spec](./2026-05-25-slay-the-cert-talk-design.md) — overall deck
- [Implementation plan](../plans/2026-05-25-slay-the-cert-talk-implementation.md) — Phase 7 polish
- [Slop ecosystem reference](../research/2026-05-26-cca-f-slop-ecosystem.md) — canonical roster
- Research substrate for THIS spec: Motion.dev card-stack live demo, Fancy Components stacking-cards math, Refero step-by-step patterns, NYT Visual Investigations grid-of-artifacts rhetoric.

---

## 1. Context

After the 2026-05-26 projector polish pass (PR #24), the deck still has a pair of adjacent slides that overlap on what they say and how they say it:

- **Slide 3** ("Behold: the mock-exam ecosystem") — establishes **scale** via a fan-reveal stack of 4 mock-exam page screenshots.
- **Slide 4** ("Slop punchline / deep-link sameness") — establishes **sameness** via a 4-column comparison of the same "Agentic Architecture" guide page.

The presenter flagged two problems with the pair:

1. **Visual redundancy on slide 4** — each column has a brand-tag (e.g., `claudecertifications.com`), and a separate `slide-4-identical` row above the grid repeats all four brand names in a `↔` chain. The same names appear twice on the same slide.
2. **Rhetorical overlap** — both slides argue "look at the slop." Slide 3 with breadth, slide 4 with depth. The audience hears the same indictment twice in 60-90 seconds.

The presenter wants to **collapse both into one slide** that:

- Carries **both beats** (scale + sameness) — but staged temporally, not duplicated spatially.
- Uses the **deep-link `guide-*.png` images from slide 4** as the visual evidence (more damning than the homepage shots — they all literally show the same content).
- Animates as a **stack of cards where the bottom card cycles to the top**, click-driven so the speaker controls pacing.
- Reframes the critique away from snark and toward an analytical observation: this is what **mass-produced content** looks like. "Twelve is a dozen." The speaker acknowledges that they too began here — the slide implicates everyone, including the talk's author.

---

## 2. Goals

- One slide replaces two. Total deck count drops from 15 to 14.
- The redundant `slide-4-identical` chain row is gone.
- The "scale" beat is established by the existence of the stack itself (3 visible layered cards + 1 implied), not by a separate enumerating slide.
- The "sameness" beat is built **incrementally across four clicks**, each click cycling a new card to the top AND swapping the right-column caption to the next axis of sameness.
- The fourth and final beat is **self-implicating** — the speaker acknowledges the vault used to look like this too. This earns the audience's trust before Act II ("So I built a different one").
- Tone is Senior-Manager analytical. No snark. The slop ecosystem is observed, not mocked.
- Animation reads as "subtle but elegant" — spring-eased card transitions, no flash, no bounce.

---

## 3. Non-Goals

- **No auto-cycle.** Speaker controls every beat via click. Auto-cycle was considered and rejected — it creates two timelines (visual + verbal) for the audience to track.
- **No more than 4 beats.** Four sites, four axes of sameness, four clicks. Adding a fifth dilutes the rhythm and overruns the punchline.
- **No wrap-around after beat IV.** Beat IV is the closer. Subsequent clicks do nothing (or trigger a subtle punchline pulse). Speaker advances to next slide via nav-dot.
- **No preservation of slide-4 CSS or markup.** Clean delete; ~80 lines of CSS retired.
- **No new image assets.** Use the four existing `guide-*.png` files from `assets/slop-montage/`.
- **No marginalia voice shift.** Existing scholar-aside tone stays.

---

## 4. Visual Layout

100vh, 16:9, no scroll. Same global chrome as every other slide (parchment grain, vignette, corner ornaments, dust layer).

```
┌──────────────────────────────────────────────────────────────────┐
│ Volume I  ·  the slop ecosystem               (chapter-marker)   │
│ ──────────────── ✦ ────────────────           (ornament-divider) │
│                                                                  │
│ The same page,                                                   │
│ a dozen times.                                (.slide-3-title)   │
│                                                                  │
│ I went looking for CCA-F prep.                                   │
│ This is what came back.                       (.slide-3-subtitle)│
│                                                                  │
│ ────────── ❦ ──────────                       (ornament-divider) │
│                                                                  │
│  ┌─────────────────────┐                                         │
│  │                     │      BEAT N OF IV                       │
│  │  [top card —        │      ───                                │
│  │   one of the 4      │      Same design language.              │
│  │   guide-*.png       │      Same information architecture.     │
│  │   screenshots]      │                                         │
│  │                     │      claudecertifications.com           │
│  │ ┌brand-caption┐     │      /domains/agentic-architecture      │
│  └─────────────────────┘                                         │
│   ░ card layered 1 below                                         │
│    ░ card layered 2 below                                        │
│                                                                  │
│ ──────────                                                       │
│ It does the job. But twelve is a dozen.       (.slide-3-punchline)│
└──────────────────────────────────────────────────────────────────┘
        ←  55% width  →    ←   45% width   →
        card stack         synced caption column
```

### Column split

- Stack column: 55% of slide-content width, vertically centered. Top card dominates; two visible cards layered behind (3-card resting depth — Motion.dev pattern).
- Caption column: 45% width. Vertical stack: beat label ("Beat N of IV") → headline → sub-line → space → brand identifier → deeplink → space → click affordance ("➜ click to continue", hidden after beat IV).

### Projector overrides (≥1600px)

Continue the pattern from PR #23/#24:

- `#slide-3 .slide-content { flex-direction: row !important; align-items: center !important; gap: clamp(2rem, 4vw, 5rem); }`
- `.stack-container` width caps at `min(45vw, 1100px)`; top card image height caps at `min(58vh, 720px)`.
- Caption column body sizes follow the existing `--body-size` / `--h2-size` clamps for ≥1600px.

### Laptop layout (<1600px)

- Same row layout but with `gap: clamp(1rem, 2vw, 2rem)`.
- Card stack and caption column shrink proportionally; no layout shift between viewports.

---

## 5. Beat Content (the four captions)

Each beat = top card on the stack + headline + sub-line + brand identifier.

| Beat | Top card (which `guide-*.png`)                  | Headline                       | Sub-line                                                                          | Brand identifier         | Deeplink                                |
|------|--------------------------------------------------|---------------------------------|-----------------------------------------------------------------------------------|---------------------------|------------------------------------------|
| I    | `guide-claudecertifications.png`                | Same design language.           | Same information architecture. Same five-bullet domain page.                      | claudecertifications.com  | /domains/agentic-architecture            |
| II   | `guide-claudecertprep.png`                      | Same offered functionality.     | Study guide. Mock exam. Domain practice. The same three boxes.                    | claudecertprep.com        | /study-guide/intro                       |
| III  | `guide-claudecert.png`                          | Same problem to solve.          | Twenty pages of Anthropic's exam guide. Repeated, four ways.                      | claudecert.com            | /learn/1-agentic-architecture            |
| IV   | `guide-claudecertification.png`                 | And I started here, too.        | The vault used to look like this. That's not a flaw — it's where everyone begins. | claudecertification.com   | /study-guide/1                           |

**Beat IV is the talk's pivot.** The speaker switches from observer to participant — the critique implicates the talk's own author. The audience hears "this isn't punching down, this is shared starting point" and is ready for Act II.

The brand identifier in the caption column **always matches the top card's brand-caption**, but the right-column text only ever describes the dimension of sameness — never restates the brand. That's the redundancy fix.

---

## 6. Click Interaction State Machine

```
state: currentBeat ∈ {0, 1, 2, 3}
initial: currentBeat = 0  (set on first visibility, not on page load)

click anywhere inside the slide section (including ornaments and dust layer,
but NOT outside the <section class="slide" id="slide-3"> element):
  if currentBeat < 3:
    currentBeat += 1
    cycle()
  else:
    pulse punchline briefly (200ms scale 1.0 → 1.03 → 1.0)
    // no advance; speaker is meant to navigate to next slide

cycle():
  // visual: rotate every card's data-stack-pos by -1 (mod 4), wrapping
  // bottom (pos 3) to top (pos 0). CSS transitions on transform handle
  // the visual interpolation.
  //
  //   before:  card A=0  B=1  C=2  D=3
  //   after:   card A=1  B=2  C=3  D=0   (D was bottom-back, now top-front)
  //
  // textual:
  caption column swaps to currentBeat's content (cross-fade 300ms)
  hide click-affordance if currentBeat === 3
```

### Defensive wiring (reuse pattern from commit `520a348`)

- Slide-scoped handler uses `slide.contains(e.target)` so nav-dot clicks outside the slide are not swallowed.
- Own visibility flag via `IntersectionObserver` — do NOT trust `.visible` from `SlidePresentation`, which adds the class but never removes it.
- Handler attached once at deck-init; cleanup not needed (deck lifetime = page lifetime).

### Reduced-motion fallback

- `@media (prefers-reduced-motion: reduce)`:
  - Cards rendered as a static 2×2 grid (no stacking, no transforms).
  - All four beat captions rendered as a numbered list (I/II/III/IV).
  - Click handler disabled; everything visible at once.

---

## 7. Card Stack Mechanics

### Resting state (before any click)

- 4 cards in DOM, ordered by `data-stack-pos` 0..3 (0 = top, 3 = bottom).
- Card N transforms: `scale(1 - N*0.04) translateY(N*14px) translateX(N*4px)`.
- Card N z-index: `4 - N`.
- Top card (pos 0) has subtle gold border-rule + box-shadow halo (consistent with `.testimonial` and `.demo-frame` chrome). Behind-cards have reduced opacity (0.7, 0.55) to feel "behind."

### Cycle transition

On click, every card's `data-stack-pos` rotates by -1 modulo 4. The card formerly at pos 3 wraps to pos 0; the rest each advance one slot back.

- 500ms `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-expo`).
- CSS transition on `transform`, `opacity`, and `z-index` handles the interpolation between resting positions. No keyframes, no JS-driven tweens, no FLIP — just attribute change + transition.
- The wrap card (pos 3 → pos 0) reads visually as "lifting up and over" because the easing curve naturally overshoots slightly when the scale and translateY deltas resolve in the same eased timeline.

Implementation note: rotate `data-stack-pos` values, not DOM order. Four cards, four pos values, one attribute write per cycle.

### Card content

Each card contains:

- The `guide-*.png` image (the deep-link page that proves sameness).
- A `brand-caption` band at the bottom: site name only (no URL — that lives in the caption column).
- Subtle parchment-band frame matching the existing `.stack-card` chrome from slide 3.

---

## 8. Wiring & Risks

### Files touched

- `public/talks/2026-06-03-slay-the-cert/index.html`:
  - Slide 3 markup: replace `.stack-wrapper` contents and `.slide-content` structure with two-column layout.
  - Slide 4 markup: **delete entirely** (lines ~1820-1885 in current main).
  - CSS: delete `.slide-4-*` rules (lines ~1477-1556, ~636-660, ~85-90 in projector media query). Add `#slide-3 .slide-content` row layout + new `.beat-caption` rules + cycle transition rules.
  - JS hook: replace existing slide-3 click-to-fan-reveal handler with click-to-cycle handler.
- `docs/talks-improvements.md`: append a "shipped 2026-05-26 (PR TBD)" note when this lands.
- Slide numbering downstream — **manual audit required**: any `#slide-N` reference for N ≥ 5 needs decrementing by 1 (becomes new `#slide-{N-1}`) in CSS, JS hooks, marginalia copy that names a slide, and any internal nav. Known affected references at spec time: the projector overrides shipped in PR #24 for old slides 5/9/11/13, the slide-8 achievement-pop hook scoping from PR #17. Plan must include `git grep -nE "slide-([5-9]\|1[0-5])\b"` as an audit step and confirm every match is intentional after the shift.

### Risks

| Risk | Mitigation |
|------|-----------|
| Renumbering downstream breaks projector overrides shipped in PR #24. Pre-merge those overrides target `#slide-5`, `#slide-9`, `#slide-11`, `#slide-13`. Post-merge they need to retarget `#slide-4`, `#slide-8`, `#slide-10`, `#slide-12` (each shifts down by one because slide 4 disappears and everything after slide 3 advances). | Plan includes a renumbering audit step — run `git grep -nE "#slide-(5\|9\|11\|13)\b"` before merge and verify every match is updated. After merge, run `node scripts/snap-slides.mjs slide-4 slide-8 slide-10 slide-12 --sizes=wallscreen` and visually diff against pre-PR baselines for the same slides under their old numbers. |
| Click handler accidentally swallows other clicks (re-introduces the bug `520a348` fixed). | Reuse the exact `slide.contains(e.target)` + IntersectionObserver-driven visibility flag pattern. Add a smoke test: open slide 3, click outside on a nav dot, verify dot click registers. |
| Cycle transition feels janky at 2K projector (60Hz). | 500ms `--ease-out-expo` is the same easing already used for `candleFlicker` etc. — proven smooth on the deck. If jank shows up in dry-run, drop to 400ms or use `will-change: transform` on cards. |
| Tone of beat IV reads as performative humility. | Mitigate during Phase 6 dry-runs — if the line lands wrong, edit the sub-line. The headline ("And I started here, too.") stays minimal so the rewrite surface is small. |
| Deck is hand-served by `python -m http.server` during dev — Vite-style HMR not available. | Existing workflow: reload browser after each edit. Acceptable for a 15-slide deck. |

---

## 9. Verification

Once implemented:

1. **Visual smoke test** — open the deck at laptop and 2K viewports, click through beats I→IV, confirm:
   - Top card cycles correctly.
   - Caption swaps without flash.
   - Brand identifier in caption column matches top card's brand-caption.
   - Click-affordance hint disappears after beat IV.
   - Punchline pulses on click-after-IV.
2. **Renumbering audit** — `git grep -nE "slide-(4\|[5-9]\|1[0-5])\b"` returns only updated references; old `slide-4` references return zero hits (slide-4 is fully retired). For each surviving match for old N≥5, confirm it now reads as the new N-1.
3. **Snap-slide regression** — `node scripts/snap-slides.mjs slide-3 slide-4 slide-8 slide-10 slide-12 --sizes=laptop,wallscreen` produces non-empty `assets/_review/*.png`; manual visual diff against the pre-PR baselines for old slides 3/5/9/11/13 shows only intended changes.
4. **Reduced-motion** — DevTools → Emulate `prefers-reduced-motion: reduce`. Slide 3 renders as 2×2 grid with numbered list. No animation. Clicks have no effect on layout.
5. **Defensive-click smoke test** — open slide 3, click on the nav-dot for slide 7, verify navigation works (not swallowed by the cycle handler).

---

## 10. Future Iteration Hooks (Kaizen)

V1 ships the design above. Expected places we may iterate:

- **Beat copy** — likely after Phase 6 dry-runs. The headlines and sub-lines are short and easy to edit; the layout absorbs rewrites without code changes.
- **Stack visual depth** — if 3 cards visible feels too sparse, bump to 4 (showing the implied "more behind"). One-line CSS change.
- **Transition timing** — 500ms is a guess. Dry-runs will reveal if 400ms or 600ms feels better.
- **Punchline tone** — "It does the job. But twelve is a dozen." is the V1 line. May need a softer or stronger variant after the speaker hears it out loud.
- **Click-after-IV behavior** — currently "pulse punchline." May want a more affirmative cue ("➜ next") if speakers find themselves unsure whether the slide is complete.

These are not blockers — they're explicit Kaizen targets for the iteration loop.

---

## 11. Out of Scope (Explicitly Deferred)

- New slop screenshots — the four `guide-*.png` captures from PR #23 are sufficient.
- Touch-screen / mobile support — talk is projector-only.
- Per-card hover details (URL preview, etc.) — would add information density the speaker doesn't need.
- Audio cue on cycle — would distract from speaker.
- Speaker notes generation — handled separately by the gitignored `notes.md` workflow.
