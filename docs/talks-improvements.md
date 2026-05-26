# Slay the Cert — Projector Polish (Deferred Work)

**Date:** 2026-05-26
**Status:** Handoff — global projector breakpoint shipped, per-slide layout polish deferred for the next machine session.
**Talk date:** 2026-06-03 (about a week out from this doc).
**Related:** [Talk implementation plan](./superpowers/plans/2026-05-25-slay-the-cert-talk-implementation.md), [Slop ecosystem reference](./superpowers/research/2026-05-26-cca-f-slop-ecosystem.md).

---

## Context

The deck at [public/talks/2026-06-03-slay-the-cert/index.html](../public/talks/2026-06-03-slay-the-cert/index.html) was designed against 16:9 laptop viewports (~1366-1920px wide). It will be projected at the meetup on a 2K-class screen (≈2560×1440 native) with the audience seated 15-25 ft away.

On 2026-05-26 we shipped:

1. A `@media (min-width: 1600px)` block at [index.html:64-119](../public/talks/2026-06-03-slay-the-cert/index.html#L64) that lifts every `:root` size cap and overrides per-slide outliers (slide-3 title, slide-4 brand/deeplink, stack-container, marginalia, slide-1 title/sub/tagline, slide-7 cells, slide-13 poem).
2. A `slide-4-col img` rule using `aspect-ratio: 16 / 9` so the website-screenshot columns no longer get side-cropped at wide viewports.
3. Verification scripts: [scripts/snap-slides.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/snap-slides.mjs) (renders any subset of slides at laptop/desktop/wallscreen) and [scripts/measure-fonts.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/measure-fonts.mjs) (prints computed font-sizes at each viewport).

Result at 2560×1440: every text element is now projector-grade (body ~32px, titles 70-224px, smalls ~20-25px). 1366 (laptop) is unchanged.

---

## What's deferred — Slides 5, 9, 11 visual balance

Each of these still feels visually unbalanced at 2K because the content is left-anchored against intentional right-side breathing room. On a 16:9 laptop the negative space reads as deliberate; on a 2K projector it reads as "empty."

### Slide 5 — "So I built a different one. / Slay the Cert."

- **What's there:** chapter pretitle ("VOLUME II / Enter the warlock"), two-line announcement, decorative sprite + tower-floors info-box at the bottom-center.
- **Problem at 2K:** title hangs in the upper-left third; the right half of the canvas is dead. The sprite + tower-floors panel is small and feels disconnected from the title.
- **Options (pick one when continuing):**
  1. Center the whole `.slide-content` horizontally on `≥1600px` — mirrors what we did for slide 13. Loses the left-anchored "chapter opening" composition; gains balance.
  2. Pull the sprite + tower-floors panel up to the right of the title (two-column at 2K, stacked at laptop). Most narrative-rich option.
  3. Bump the tower-floors panel size significantly (sprite ~3x, tower font ~2x) so the bottom row carries equal weight.

### Slide 9 — Live demo card

- **What's there:** "step out of the tome" pretitle, warlock HP bar, "← LIVE DEMO" framed card containing the dungeon canvas placeholder + caption.
- **Problem at 2K:** the LIVE DEMO card and inner canvas are tiny relative to canvas. Most of the slide is black background. The card was sized for laptop.
- **Options:**
  1. Bump the demo-card max-width to ~1600px on `≥1600px` and grow the inner canvas placeholder height proportionally. **Recommended** — most direct fix.
  2. Add side-panels with "controls" or "what to watch for" annotations. Risks distracting from the live demo itself.
  3. Leave it — during the actual demo the live game will replace the placeholder anyway.

### Slide 11 — "How did one engineer ship this in weekends?"

- **What's there:** "VOLUME III" chapter mark, title, ASCII folder-tree code block, pull-quote *"The answer isn't 10x productivity. It's a workflow."*
- **Problem at 2K:** title and code block stay in the upper-left third; the pull-quote sits in the middle but doesn't anchor enough; right and bottom edges are empty.
- **Options:**
  1. Center the slide content horizontally (matches slide 13). Code block sits in the middle.
  2. Widen the code block significantly + bump its font so it's the dominant visual element (it's the punchline — "this folder structure IS the answer").
  3. Add a right-column showing a screenshot of an actual Claude Code session or the docs/superpowers folder.

---

## To pick up where I left off

1. **Pull the branch** and `npm install` (or `npm install playwright --no-save` if you don't want it in package.json — the deck doesn't otherwise depend on Playwright runtime).
2. **Install Chromium for Playwright** (one-time on the new machine):
   ```bash
   npx playwright install chromium
   ```
3. **Serve the deck:**
   ```bash
   cd /path/to/ai-kb
   python3 -m http.server 8765 --bind 127.0.0.1 --directory public/talks/2026-06-03-slay-the-cert
   open "http://127.0.0.1:8765/#slide-5"
   ```
4. **Capture before/after at 2K** for whichever slides you change:
   ```bash
   cd public/talks/2026-06-03-slay-the-cert
   node scripts/snap-slides.mjs slide-5 slide-9 slide-11 --sizes=wallscreen
   ```
   Output lands in `assets/_review/slide-N-wallscreen.png`.
5. **Verify computed font sizes** (sanity check before/after):
   ```bash
   node scripts/measure-fonts.mjs
   ```
6. **All overrides go in one place** — the `@media (min-width: 1600px)` block at [index.html:64-119](../public/talks/2026-06-03-slay-the-cert/index.html#L64). Add `#slide-5 .slide-content { ... }` style rules there to keep them grouped with the other projector tweaks.

## Don't-touch list (already verified good at 2K)

- Slide 1 — title is now 224px, sprite proportionate, subline readable.
- Slide 3 — stack widened to 78vw / 1700px max; title at 45px; punchline 72px.
- Slide 4 — 4-column comparison, aspect-ratio fixed, brand-tag 24px, deeplink 20px monospace.
- Slide 7 — 2×2 cells now vertically center their content; title 42px, body 30px.
- Slide 13 — three-truths poem centered horizontally; big-lines 112px; impact line in gold.

## Optional follow-ups (low priority)

- The `slide-1-sprite img` idle-bob animation runs continuously; consider pausing it after ~10s if it gets distracting during a live talk.
- Marginalia text uses `text-muted` (`#9d8f74`) on `#0e0c0a` — 5.2:1 contrast, WCAG-AA-ish but subdued. On a poorly-calibrated projector it may disappear. If that happens, bump opacity or use `text-primary` for marginalia at `≥1600px`.
- The `_review/` directory is currently un-gitignored; it accumulates verification PNGs. Add `public/talks/**/assets/_review/` to `.gitignore` if it gets noisy.

## Files touched on 2026-05-26 (for context when reading the diff)

- [index.html](../public/talks/2026-06-03-slay-the-cert/index.html) — projector media query added (lines ~64-119), slide-4 image rule fixed (line ~1414), slide-3 ambient sprite removed (line ~1703), slide-3 title `<em>` removed (line ~1708), slide-3 subtitle re-text, slide-3 stack widened (line ~454), slide-3 marginalia tightened (line ~1722), slide-1 title/tagline rewritten + `.slide-1-opener` class removed.
- [assets/slop-montage/](../public/talks/2026-06-03-slay-the-cert/assets/slop-montage/) — old `01-…10-` images deleted, 8 fresh `guide-*.png` + `mock-*.png` captures added.
- [scripts/capture-slop.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/capture-slop.mjs) — new, captures competitor sites.
- [scripts/snap-slides.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/snap-slides.mjs) — new, slide verification.
- [scripts/measure-fonts.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/measure-fonts.mjs) — new, computed-style audit.
- [docs/superpowers/research/2026-05-26-cca-f-slop-ecosystem.md](../research/2026-05-26-cca-f-slop-ecosystem.md) — new, copycat-site reference roster.
