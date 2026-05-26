# Slay the Cert — Projector Polish (Deferred Work)

**Date:** 2026-05-26
**Status:** Slides 5, 9, 11 polish + dust visibility shipped on branch `fix/talk-slide-polish-and-dust-2026-05-26` later the same day. Optional follow-ups below remain open.
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

## What was deferred — Slides 5, 9, 11 visual balance (now shipped)

Each of these felt visually unbalanced at 2K because the content was left-anchored against intentional right-side breathing room. On a 16:9 laptop the negative space read as deliberate; on a 2K projector it read as "empty."

Chosen approach for each (all option 1 — consistent with slide 13's centred-poem pattern):

### Slide 5 — "So I built a different one. / Slay the Cert."

Centred `.slide-content` horizontally + bumped pivot-headline / subline / tagline / boss-roster sizes. Sprite + tower-floors panel now sits centred under the announcement. Left-anchored composition swapped for projector-balanced one at `≥1600px` only; laptop unchanged.

### Slide 9 — Live demo card

Demo-frame card given `max-width: min(78vw, 1700px)` and `width: min(78vw, 1700px)` at projector, with inner GIF `max-width: clamp(800px, 64vw, 1400px)`. Demo arrow / game-UI bar / preamble / fallback-caption all sized up so the card carries the slide instead of swimming in it.

### Slide 11 — "How did one engineer ship this in weekends?"

Centred `.slide-content` horizontally + bumped dir-tree font to `clamp(1.6rem, 2.5vw, 3.2rem)` with extra padding so the folder structure is the slide's punchline.

## Dust visibility (also shipped in the same pass)

User flagged "dust is not really working or I have not noticed it" — original handoff. Fix was a global CSS change in two places (not per-slide):
- `.dust-mote` background swapped to `--accent-gold-bright` + `box-shadow` glow halo (5px gold + 1px bright-gold).
- `@keyframes drift` opacity now `calc(var(--mote-opacity, 0.25) * 2.4)` — preserves per-mote variation but lifts ceiling from 0.30 to ~0.72.
- At `≥1600px` only, the box-shadow grows to 8px gold + 2px bright-gold so motes still read from 15-25 ft.

No need to touch the 300+ inline `--mote-opacity` values across slides; multiplier handles them all.

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
- ~~The `_review/` directory is currently un-gitignored~~ — fixed in PR #23 (added `public/talks/**/assets/_review/` to `.gitignore`).

## Files touched on 2026-05-26 (for context when reading the diff)

- [index.html](../public/talks/2026-06-03-slay-the-cert/index.html) — projector media query added (lines ~64-119), slide-4 image rule fixed (line ~1414), slide-3 ambient sprite removed (line ~1703), slide-3 title `<em>` removed (line ~1708), slide-3 subtitle re-text, slide-3 stack widened (line ~454), slide-3 marginalia tightened (line ~1722), slide-1 title/tagline rewritten + `.slide-1-opener` class removed.
- [assets/slop-montage/](../public/talks/2026-06-03-slay-the-cert/assets/slop-montage/) — old `01-…10-` images deleted, 8 fresh `guide-*.png` + `mock-*.png` captures added.
- [scripts/capture-slop.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/capture-slop.mjs) — new, captures competitor sites.
- [scripts/snap-slides.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/snap-slides.mjs) — new, slide verification.
- [scripts/measure-fonts.mjs](../public/talks/2026-06-03-slay-the-cert/scripts/measure-fonts.mjs) — new, computed-style audit.
- [docs/superpowers/research/2026-05-26-cca-f-slop-ecosystem.md](../research/2026-05-26-cca-f-slop-ecosystem.md) — new, copycat-site reference roster.
