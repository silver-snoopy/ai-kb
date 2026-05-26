# Slide 3 + 4 Merge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge slides 3 + 4 into one click-driven card-cycle slide, rename downstream slide IDs to absorb the deletion, and ship the work as a single PR.

**Architecture:** Single-file edit to `public/talks/2026-06-03-slay-the-cert/index.html`. Three phases: (1) delete the old slide-4 markup + CSS; (2) rename `#slide-N` IDs for N≥5 down by one; (3) rebuild slide-3 with the new two-column layout, click-cycle mechanic, ghost-card depth, and synced caption swap. No new files. No new dependencies.

**Tech Stack:** Vanilla HTML/CSS/JS inside `index.html`. Existing IntersectionObserver + capture-phase click pattern from PR #17 commit `520a348` reused for the new mechanic.

**Substrate:**
- Spec: [docs/superpowers/specs/2026-05-26-slide-3-4-merge-design.md](../specs/2026-05-26-slide-3-4-merge-design.md)
- Existing slide-3 click hook: `index.html` lines 2670-2736 (replaced wholesale by Task 11)
- Existing slide-4 markup: `index.html` lines 1788-1853 (deleted by Task 1)
- Existing slide-4 CSS: `index.html` lines 601-625 (first block) + 1430-1556 (second block); regex/scan in Task 2 confirms exact spans

**Verification approach:** This is HTML/CSS/JS in a presentation deck. No unit tests apply. Verification is manual through the local server (`python -m http.server 8765 --bind 127.0.0.1 --directory public/talks/2026-06-03-slay-the-cert`) and the existing `scripts/snap-slides.mjs` + `scripts/measure-fonts.mjs` Playwright tools. Each task lists explicit click-paths and expected outcomes.

**Branch:** `feat/talk-merge-slide-3-4` (already exists; spec + voice-pass already committed at `f42c903`)

---

## Task 1: Delete slide-4 HTML section markup

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

- [ ] **Step 1: Locate slide-4 section boundaries**

Run:
```bash
grep -n "<section class=\"slide\" id=\"slide-[4-5]\"" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output (line numbers must match current main):
```
1788:<section class="slide" id="slide-4">
1855:<section class="slide" id="slide-5">
```

Slide-4 markup spans lines 1788 to the closing `</section>` immediately before line 1855. The comment header `<!-- SLIDE 4 — SLOP PUNCHLINE -->` lives at lines 1785-1787 and must also be removed.

- [ ] **Step 2: Delete slide-4 section + its comment header**

Using the Edit tool, remove the entire block. The block starts with the comment header before line 1788 and ends with `</section>` before the slide-5 comment header.

Search for the exact opening string (must be unique in file):
```
<!-- ============================================================
     SLIDE 4 — SLOP PUNCHLINE (DEEP-LINK SAMENESS)
     ============================================================ -->
<section class="slide" id="slide-4">
```

Replace with empty string. Continue scanning for the closing `</section>` immediately before the slide-5 comment header. If the Edit tool's old_string spans more than ~80 lines, split into two Edits: one for the comment header through `<div class="slide-content">`, and one for the slide-content through `</section>`.

- [ ] **Step 3: Verify slide-4 markup is gone**

Run:
```bash
grep -n "id=\"slide-4\"\|slide-4-comparison\|slide-4-identical\|slide-4-punchline" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: lines that match are CSS rule selectors only (e.g., `#slide-4 { background-color: ... }`, `.slide-4-grid { ... }`). NO `<section class="slide" id="slide-4">` or `<div class="slide-4-comparison">` HTML matches. CSS will be cleaned up in Task 2.

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "refactor(talk): delete slide-4 section markup (merge prep, step 1/9)"
```

---

## Task 2: Delete slide-4 CSS rules + projector overrides

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

- [ ] **Step 1: Locate slide-4 CSS rule blocks**

Run:
```bash
grep -nE "^#slide-4 |^\.slide-4-|\.slide-4-" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output covers two regions:
- **Projector overrides** (lines ~85-90 inside the `@media (min-width: 1600px)` block):
  - `.slide-4-brand-tag { font-size: ... }`
  - `.slide-4-deeplink { font-size: ... }`
  - `.slide-4-identical .ident-badge { font-size: ... }`
  - `.slide-4-identical .ident-eq { font-size: ... }`
- **Main CSS rules** (lines ~601-625):
  - `#slide-4 { background-color: ... }`
  - `.slide-4-grid figure { ... }`
  - `.slide-4-grid figure img { ... }`
  - `.slide-4-grid figcaption { ... }`
  - `.slide-4-punchline { ... }`
- **Second main CSS region** (lines ~1430-1556):
  - `#slide-4 { background-color: ... }` (duplicate of line 601 — both delete)
  - `.slide-4-comparison { ... }`
  - `.slide-4-comparison { grid-template-columns: ... }` inside `@media`
  - `.slide-4-col { ... }`
  - `.slide-4-brand-tag { ... }`
  - `.slide-4-deeplink { ... }`
  - `.slide-4-col img { ... }`
  - `.slide-4-annotation { ... }`
  - `.slide-4-identical { ... }`
  - `.slide-4-identical .ident-badge { ... }`
  - `.slide-4-identical .ident-eq { ... }`

- [ ] **Step 2: Delete projector-override block**

Using the Edit tool, remove these 4 lines from inside the `@media (min-width: 1600px) { ... }` block. The exact strings to match (each unique once):
```
    .slide-4-brand-tag { font-size: clamp(1rem, 1.2vw, 1.5rem) !important; }
    .slide-4-deeplink { font-size: clamp(0.9rem, 1.0vw, 1.25rem) !important; }
    .slide-4-identical .ident-badge { font-size: clamp(1rem, 1.3vw, 1.55rem) !important; }
    .slide-4-identical .ident-eq { font-size: clamp(1.4rem, 2vw, 2.6rem) !important; }
```

Replace with empty string for each.

- [ ] **Step 3: Delete the first main-CSS block (lines ~601-625)**

Find the slide-4 CSS comment block header (typically `/* SLIDE 4 — ... */`) preceding `#slide-4 { background-color: var(--bg-base); }` near line 601. Use a single Edit that covers from the comment header through `.slide-4-punchline { ... }`'s closing brace.

If you can't find a clean comment-header boundary, do separate Edits for each rule. Each rule is unique once it includes its closing `}`.

- [ ] **Step 4: Delete the second main-CSS block (lines ~1430-1556)**

Same pattern — find the slide-4 comment header preceding the second `#slide-4 { ... }` and delete through the end of the slide-4 rule cluster (`.slide-4-identical .ident-eq { ... }`'s closing brace).

Also delete the `@media (max-width: 600px) { .slide-4-comparison { grid-template-columns: repeat(4, 1fr); } }` near line 1440 — its sole purpose was slide-4.

- [ ] **Step 5: Verify slide-4 CSS is gone**

Run:
```bash
grep -cnE "slide-4-|#slide-4\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: `0`

- [ ] **Step 6: Smoke-test that the deck still renders**

If the local server isn't running, start it:
```bash
python -m http.server 8765 --bind 127.0.0.1 --directory public/talks/2026-06-03-slay-the-cert
```

Open `http://127.0.0.1:8765/` and arrow-navigate: slide 1 → 2 → 3 (old, will be rebuilt) → 5 (which is what we expect to land on now that slide-4 is gone). Confirm no JavaScript console errors and that the old slide-3 still renders.

Note: the nav-dot count should now be **14**, not 15, because the SlidePresentation auto-counts `<section class="slide">` elements.

- [ ] **Step 7: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "refactor(talk): delete slide-4 CSS rules (merge prep, step 2/9)"
```

---

## Task 3: Renumber section IDs in HTML for slides 5-15 → 4-14

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** Old slide-5 through slide-15 become new slide-4 through slide-14 in HTML. This is the structural part of the renumbering audit.

**What is NOT renamed:** CSS class names like `.slide-8-hint`, `.slide-13-meta-pretitle`, `.slide-13-preamble`, `.slide-6-body`, `.slide-7-title-fails`, `.slide-8-section-title` — these keep their pre-merge numbers per the spec (§8). The smell is accepted; cosmetic rename is a follow-up Kaizen PR.

- [ ] **Step 1: List all section IDs that need renaming**

Run:
```bash
grep -nE "<section class=\"slide\" id=\"slide-(5|6|7|8|9|1[0-5])\"" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output (11 lines, one per surviving slide):
```
1855:<section class="slide" id="slide-5">
1914:<section class="slide" id="slide-6">
1966:<section class="slide" id="slide-7">
2036:<section class="slide" id="slide-8">
2160:<section class="slide" id="slide-9">
2222:<section class="slide" id="slide-10">
2276:<section class="slide" id="slide-11">
2317:<section class="slide" id="slide-12">
2380:<section class="slide" id="slide-13">
2427:<section class="slide" id="slide-14">
2476:<section class="slide" id="slide-15">
```

(Line numbers may have shifted due to Task 1's deletion; use the order, not the literal line numbers.)

- [ ] **Step 2: Rename section IDs in descending order**

Use the Edit tool's `replace_all` flag set to `false` (default) on a unique-enough substring per rename. CRITICAL: rename in DESCENDING order (15 → 14 first, then 14 → 13, etc.) to avoid collisions.

Apply these 11 edits in order, one Edit call per rename:

1. `id="slide-15"` → `id="slide-14"`
2. `id="slide-14"` → `id="slide-13"`
3. `id="slide-13"` → `id="slide-12"`
4. `id="slide-12"` → `id="slide-11"`
5. `id="slide-11"` → `id="slide-10"`
6. `id="slide-10"` → `id="slide-9"`
7. `id="slide-9"` → `id="slide-8"`
8. `id="slide-8"` → `id="slide-7"`
9. `id="slide-7"` → `id="slide-6"`
10. `id="slide-6"` → `id="slide-5"`
11. `id="slide-5"` → `id="slide-4"`

Each substring is unique in the file because section IDs are unique (HTML spec). The Edit tool will only match the section element's `id=` attribute.

- [ ] **Step 3: Verify renames**

Run:
```bash
grep -cE "<section class=\"slide\" id=\"slide-(4|5|6|7|8|9|1[0-4])\"" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: `12` (slides 1, 2, 3 unchanged + new slides 4-14 = 14 total. But slide 3 still uses old markup so its line will not match this pattern; recalibrate to expect new-slide-4 through new-slide-14, count = 11.) Adjust expectation to:

```bash
grep -nE "<section class=\"slide\" id=\"slide-([4-9]|1[0-4])\"" public/talks/2026-06-03-slay-the-cert/index.html
```

Should list 11 sections in ascending order from slide-4 through slide-14.

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "refactor(talk): rename section IDs slide-5..15 -> slide-4..14 (merge prep, step 3/9)"
```

---

## Task 4: Renumber CSS selectors `#slide-N` for N≥5 → N-1

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** Every CSS rule that targets `#slide-5` through `#slide-15` must shift down by one to match the new section IDs from Task 3. This covers both `background-color` selectors and projector-media-query overrides.

- [ ] **Step 1: List all `#slide-N` CSS selectors for N≥5**

Run:
```bash
grep -nE "#slide-(5|6|7|8|9|1[0-5])\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output covers ~20-25 lines including:
- `#slide-5 { background-color: ... }` near line 636 (renamed from old slide-5)
- `#slide-6 { background-color: ... }` near line 666
- `#slide-7 { ... }` near line 716 (the one with the wallpaper)
- `#slide-8 { background-color: ... }` near line 839
- `#slide-8 .carrots li,` and `#slide-8 .refused li {` near lines 959-960
- `#slide-8 .carrots li.popped` and `.refused li.popped` near 966-967
- `#slide-9 { background-color: ... }` near line 976
- `#slide-10 { background-color: ... }` near line 1029
- `#slide-11 { background-color: ... }` near line 1075
- `#slide-12 { background-color: ... }` near line 1103
- `#slide-13 { background-color: ... }` near line 1180
- `#slide-14 { ... }` near line 1215
- `#slide-15 { background-color: ... }` near line 1259
- **Projector overrides** inside `@media (min-width: 1600px)`:
  - `#slide-13 .slide-content { ... }` (line ~111)
  - `#slide-13 .big-lines { ... }` (line ~112)
  - `#slide-13 .big-line { ... }` (line ~113)
  - `#slide-13 .big-line-ornament { ... }` (line ~114)
  - `#slide-5 .slide-content { ... }` (line ~118)
  - `#slide-5 .pivot-headline { ... }` (line ~119)
  - `#slide-5 .pivot-subline { ... }` (line ~120)
  - `#slide-5 .pivot-tagline { ... }` (line ~121)
  - `#slide-5 .boss-roster-title { ... }` (line ~122)
  - `#slide-5 .boss-roster ol li { ... }` (line ~123)
  - `#slide-9 .demo-frame { ... }` (line ~125)
  - `#slide-9 .demo-fallback img { ... }` (line ~130)
  - `#slide-9 .demo-arrow { ... }` (line ~134)
  - `#slide-9 .game-ui-bar { ... }` (line ~135)
  - `#slide-9 .demo-preamble { ... }` (line ~136)
  - `#slide-9 .demo-fallback-caption { ... }` (line ~137)
  - `#slide-11 .slide-content { ... }` (line ~139)
  - `#slide-11 .dir-tree { ... }` (line ~140)
  - `#slide-11 .act3-caption { ... }` (line ~144)

- [ ] **Step 2: Rename CSS selectors in descending order**

Apply 12 selector renames in descending order to avoid collisions. Use the Edit tool with `replace_all: true` since each selector substring may appear multiple times (background-color rule + projector overrides + JS hook).

Edit calls (one per number, descending):

1. Old `#slide-15` → `#slide-14`. `replace_all: true`.
2. Old `#slide-14` → `#slide-13`. `replace_all: true`.
3. Old `#slide-13` → `#slide-12`. `replace_all: true`.
4. Old `#slide-12` → `#slide-11`. `replace_all: true`.
5. Old `#slide-11` → `#slide-10`. `replace_all: true`.
6. Old `#slide-10` → `#slide-9`. `replace_all: true`.
7. Old `#slide-9` → `#slide-8`. `replace_all: true`.
8. Old `#slide-8` → `#slide-7`. `replace_all: true`.
9. Old `#slide-7` → `#slide-6`. `replace_all: true`.
10. Old `#slide-6` → `#slide-5`. `replace_all: true`.
11. Old `#slide-5` → `#slide-4`. `replace_all: true`.

**WARNING:** `#slide-3` and `#slide-4` references must NOT be touched. The grep in Step 1 already filtered to N≥5, so following only that list keeps `#slide-3` (current pre-rebuild slide) and any leftover `#slide-4` traces out of scope. If Step 1's grep returned anything matching `#slide-4` after Task 2, stop and investigate — Task 2 left an orphan.

- [ ] **Step 3: Verify renames complete**

Run:
```bash
grep -cnE "#slide-(5|6|7|8|9|1[0-5])\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: `0`

Then:
```bash
grep -cnE "#slide-(4|[5-9]|1[0-4])\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: a positive number (the 11 renamed rules plus their projector-override counterparts).

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "refactor(talk): rename CSS selectors #slide-5..15 -> #slide-4..14 (merge prep, step 4/9)"
```

---

## Task 5: Update JS hook for achievement-pop (`#slide-8` → `#slide-7`)

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** The achievement-pop hook IIFE (PR #17, Phase 4.2) references `document.getElementById('slide-8')`. After Tasks 3+4 the slide is now `#slide-7`. Without this fix, the hook silently fails (`getElementById` returns null, the IIFE returns early) and slide 7's click-to-pop interaction breaks.

- [ ] **Step 1: Find the hook**

Run:
```bash
grep -nE "getElementById\('slide-8'\)|setupAchievementPop" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output (around lines 2744-2746):
```
2744:(function setupAchievementPop() {
2745:  const slide = document.getElementById('slide-8');
```

- [ ] **Step 2: Update the ID literal**

Edit `index.html`:

old_string:
```javascript
(function setupAchievementPop() {
  const slide = document.getElementById('slide-8');
```

new_string:
```javascript
(function setupAchievementPop() {
  // Hook attached to what used to be slide-8 (now slide-7 after the
  // slide-3+4 merge renumbered downstream slides). The achievement-pop
  // CSS classes (.slide-8-hint etc.) keep their pre-merge numbers per
  // the merge spec — cosmetic rename is a separate Kaizen PR.
  const slide = document.getElementById('slide-7');
```

- [ ] **Step 3: Update the IIFE comment block above the hook**

The comment block immediately preceding the IIFE (lines ~2738-2743) reads:

```
/* ===========================================
   PHASE 4.2 — Slide 8 achievement-pop hook
   Click or Space/ArrowRight while slide 8 is active:
   pop next list item in DOM order (data-pop-index 0..9).
   When all 10 are revealed, further input advances to slide 9.
   =========================================== */
```

Update both `Slide 8` → `Slide 7` and `slide 9` → `slide 8` in the prose:

old_string:
```
/* ===========================================
   PHASE 4.2 — Slide 8 achievement-pop hook
   Click or Space/ArrowRight while slide 8 is active:
   pop next list item in DOM order (data-pop-index 0..9).
   When all 10 are revealed, further input advances to slide 9.
   =========================================== */
```

new_string:
```
/* ===========================================
   PHASE 4.2 — Slide 7 achievement-pop hook (was slide 8 pre-merge)
   Click or Space/ArrowRight while slide 7 is active:
   pop next list item in DOM order (data-pop-index 0..9).
   When all 10 are revealed, further input advances to slide 8.
   =========================================== */
```

- [ ] **Step 4: Verify the hook now targets `#slide-7`**

Run:
```bash
grep -nE "getElementById\('slide-[0-9]+'\)" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: two matches, one for `'slide-3'` (the current pre-rebuild slide; still uses old ID, will be replaced in Task 6) and one for `'slide-7'`.

- [ ] **Step 5: Smoke-test the achievement-pop interaction**

In the running browser, navigate to the slide formerly known as slide 8 (now slide 7). Click on it; verify the carrot/snare list items pop in sequence as before. If they don't, the hook didn't bind — check console for "Uncaught" or IIFE-return-early symptoms.

- [ ] **Step 6: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "fix(talk): update achievement-pop hook for renumbered slide-7 (was slide-8)"
```

---

## Task 6: Delete old slide-3 inner content + JS hook + CSS

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** The old slide-3 fan-reveal mechanic is being replaced. Clear the old machinery before building the new.

- [ ] **Step 1: Delete the old slide-3 click hook IIFE**

The slide-3 hook is at lines 2670-2736 (the IIFE `setupCardStackReveal` plus its comment header and opening `<script>` tag if it has one; check carefully).

Find the start of the slide-3 script block:
```bash
grep -nE "PHASE 4\.1.*Slide 3|setupCardStackReveal" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output:
```
2671:   PHASE 4.1 — Slide 3 card-stack reveal hook
2677:(function setupCardStackReveal() {
```

The block to delete starts at the `<script>` tag preceding the comment (line ~2670) and ends at the closing `})();` of the IIFE plus `</script>` if present (line ~2736).

Inspect lines 2668-2738 to confirm boundaries. Then Edit:

old_string: (the entire block from `<script>` opening through the closing `})();` and `</script>` for THIS IIFE only — do NOT include the slide-8 hook IIFE which follows).

new_string: (empty string)

If the slide-3 hook and slide-8 hook share a single `<script>` tag (rather than each having their own), only delete the slide-3 IIFE body — DO NOT close out the `<script>` tag.

- [ ] **Step 2: Delete old slide-3 inner markup**

Old slide-3 markup is the contents of `<section class="slide" id="slide-3">` (still at the old ID; will be the merged target in Task 7).

Find the section:
```bash
grep -nE "<section class=\"slide\" id=\"slide-3\">" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected near line 1766.

Inspect lines 1789-1817 (the slide-content + marginalia portion AFTER the dust-mote layer). Delete everything inside `<section class="slide" id="slide-3">` EXCEPT:
- the dust-mote `<div class="dust-layer">` block and all its motes
- the two `<div class="corner-ornament">` divs

Specifically, delete from the start of `<div class="slide-content" style="align-items: flex-start;">` through the closing `</aside>` of the marginalia — replacing with placeholder `<!-- new slide-3 content inserted in Task 7 -->`.

old_string: (start of `<div class="slide-content" style="align-items: flex-start;">` through `</aside>` of marginalia).

new_string: `  <!-- new slide-3 content inserted in Task 7 -->`

- [ ] **Step 3: Delete old slide-3 CSS rules**

Run:
```bash
grep -nE "^\.slide-3-|^#slide-3 |\.stack-(container|card)\b|\.brand-caption|\.punchline\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output covers:
- `#slide-3 { background-color: ... }` line ~477
- `.slide-3-title { ... }` lines ~512-521
- `.slide-3-subtitle { ... }` lines ~522-538
- `.slide-3-hint { ... }` lines ~556-564
- `.stack-container { ... }` lines ~540-545
- `.stack-card { ... }` lines ~546-555
- `.stack-card img { ... }` lines ~556-575
- `.stack-card[data-stack-index="0".."4"] { z-index: ... }` lines ~576-580
- `.brand-caption { ... }` (associated)
- `#slide-3 .stack-card { ... }` line 568+
- `#slide-3 .stack-card.revealed { ... }` lines 574-583
- `#slide-3 .punchline { ... }` lines 586+
- `.punchline { ... }` (associated)
- Projector overrides inside `@media (min-width: 1600px)`:
  - `.slide-3-title { font-size: ... }` line ~85
  - `.punchline { font-size: ... }` line ~86
  - `.stack-container { width: ... }` line ~91
  - `.stack-card img { height: ... }` line ~92
  - `.brand-caption { font-size: ... }` line ~93

- [ ] **Step 4: Delete each rule (one Edit call per rule)**

Delete in any order — each rule is uniquely identifiable by its selector + opening brace. Match the exact rule block (selector + body through closing `}`) and replace with empty string.

The `.slide-3-hint` rule will be REKEPT in the new slide-3 — but its CSS is part of the existing slide-3 + slide-8 hint pattern, so leaving it is fine. **Do not delete `.slide-3-hint`**. Delete everything else listed.

Edit `.slide-3-hint`'s text content though — the text `[click to reveal]` will be changed by Task 7 to `[click to reveal the next]`.

- [ ] **Step 5: Verify all old slide-3 markup, CSS, and JS are gone**

Run:
```bash
grep -nE "\.slide-3-(title|subtitle)|\.stack-(container|card)|setupCardStackReveal" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: `0` matches. (`.slide-3-hint` remains — that's intentional.)

- [ ] **Step 6: Smoke-test deck still loads without console errors**

Reload `http://127.0.0.1:8765/` in the browser. Slide 3 will be empty (just dust + ornaments) — that's expected at this point. Verify no JavaScript errors in console. Other slides should still work normally.

- [ ] **Step 7: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "refactor(talk): strip old slide-3 fan-reveal markup, CSS, and JS (merge prep, step 5/9)"
```

---

## Task 7: Insert new slide-3 markup (layout + content)

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

- [ ] **Step 1: Locate the placeholder inserted in Task 6**

Run:
```bash
grep -nE "new slide-3 content inserted in Task 7" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected: one match in `<section class="slide" id="slide-3">` body.

- [ ] **Step 2: Insert the new slide-3 markup**

Edit `index.html`:

old_string:
```html
  <!-- new slide-3 content inserted in Task 7 -->
```

new_string:
```html
  <div class="slide-content slide-3-layout">
    <header class="slide-3-header">
      <p class="chapter-marker reveal">Volume I</p>
      <div class="ornament-divider reveal"><span class="rule"></span><span class="ornament">✦</span><span class="rule"></span></div>
      <h2 class="slide-3-title reveal">I went looking<br>for CCA-F prep.</h2>
      <p class="slide-3-subtitle reveal"><em>This is what came back.</em></p>
      <div class="ornament-divider reveal"><span class="rule"></span><span class="ornament">❦</span><span class="rule"></span></div>
    </header>

    <div class="slide-3-body reveal">
      <div class="stack-container" data-current-beat="0">
        <!-- ghost cards (decorative depth — never cycle) -->
        <div class="stack-card ghost-card" data-stack-pos="6" aria-hidden="true"></div>
        <div class="stack-card ghost-card" data-stack-pos="5" aria-hidden="true"></div>
        <div class="stack-card ghost-card" data-stack-pos="4" aria-hidden="true"></div>
        <!-- content cards (cycle bottom-to-top on click) -->
        <div class="stack-card content-card" data-stack-pos="3" data-beat="3">
          <img src="assets/slop-montage/guide-claudecertification.png" alt="claudecertification.com — study guide">
          <span class="brand-caption">claudecertification.com</span>
        </div>
        <div class="stack-card content-card" data-stack-pos="2" data-beat="2">
          <img src="assets/slop-montage/guide-claudecert.png" alt="claudecert.com — Agentic Architecture">
          <span class="brand-caption">claudecert.com</span>
        </div>
        <div class="stack-card content-card" data-stack-pos="1" data-beat="1">
          <img src="assets/slop-montage/guide-claudecertprep.png" alt="claudecertprep.com — study guide">
          <span class="brand-caption">claudecertprep.com</span>
        </div>
        <div class="stack-card content-card" data-stack-pos="0" data-beat="0">
          <img src="assets/slop-montage/guide-claudecertifications.png" alt="claudecertifications.com — Agentic Architecture domain">
          <span class="brand-caption">claudecertifications.com</span>
        </div>
      </div>

      <div class="beat-column">
        <div class="beat-caption reveal-blur is-active" data-beat="0">
          <p class="beat-headline">Same design language.</p>
          <p class="beat-subline"><em>Same information architecture. Same five-bullet domain page.</em></p>
          <p class="beat-deeplink">claudecertifications.com<br><span class="beat-path">/domains/agentic-architecture</span></p>
        </div>
        <div class="beat-caption reveal-blur" data-beat="1" hidden>
          <p class="beat-headline">Same offered functionality.</p>
          <p class="beat-subline"><em>Study guide. Mock exam. Domain practice. The same three boxes.</em></p>
          <p class="beat-deeplink">claudecertprep.com<br><span class="beat-path">/study-guide/intro</span></p>
        </div>
        <div class="beat-caption reveal-blur" data-beat="2" hidden>
          <p class="beat-headline">Same problem to solve.</p>
          <p class="beat-subline"><em>Anthropic's exam guide. Repeated, four ways.</em></p>
          <p class="beat-deeplink">claudecert.com<br><span class="beat-path">/learn/1-agentic-architecture</span></p>
        </div>
        <div class="beat-caption reveal-blur" data-beat="3" hidden>
          <p class="beat-headline">And I started here, too.</p>
          <p class="beat-subline"><em>My notes used to look like this. Maybe yours do.</em></p>
          <p class="beat-deeplink">claudecertification.com<br><span class="beat-path">/study-guide/1</span></p>
        </div>
      </div>
    </div>

    <footer class="slide-3-footer">
      <p class="slide-3-hint reveal"><em>[click to reveal the next]</em></p>
      <p class="slide-3-punchline reveal"><em>It does the job. But twelve is a dozen.</em></p>
    </footer>
  </div>
  <aside class="marginalia" aria-hidden="true"><em>marginalia: I am one of these too — the vault used to read the same. The reframe came later.</em></aside>
```

Note the Beat III sub-line drops "Twenty pages of" — replaced with neutral "Anthropic's exam guide" per the spec's soft-point flag (the speaker hadn't verified the page count).

- [ ] **Step 3: Smoke-test the markup renders**

Reload `http://127.0.0.1:8765/#slide-3`. Expect:
- Title "I went looking for CCA-F prep." visible
- Subtitle "This is what came back." visible
- Stack of 4 card images visible (no transforms yet — they'll stack on top of each other without the CSS from Task 8)
- First beat caption "Same design language..." visible
- Other 3 beat captions hidden via `hidden` attribute
- Hint and punchline at bottom

Cards will look messy (no CSS yet) — that's fine, Task 8 fixes it.

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "feat(talk): insert new slide-3 markup (two-column layout + beats) (step 6/9)"
```

---

## Task 8: Insert new slide-3 CSS (layout, transforms, transitions)

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

- [ ] **Step 1: Find an anchor for inserting the CSS**

The new slide-3 CSS should live in roughly the same region as the OLD slide-3 CSS used to (around line 477 area, after the global resets and before slide-5+ CSS). Find a clean anchor:

```bash
grep -nE "^#slide-(3|5) {" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected:
- One match for `#slide-4 { background-color: var(--bg-base); }` near where slide-3's rules will live (slide-5 in old numbering, now slide-4 after Task 4)
- Possibly other matches; pick the one that's adjacent to the deleted slide-3 region

Insert the new slide-3 CSS BEFORE the first remaining `#slide-4 {` rule (or wherever feels logical for the file's existing organization).

- [ ] **Step 2: Insert the new slide-3 CSS block**

Edit `index.html`. Use a unique-enough anchor — find the comment block or CSS rule immediately preceding where slide-3 CSS used to be (probably the global resets section or the dust-mote section).

Insert this block somewhere clean (recommend immediately after `.slide-3-hint { ... }` rule which was preserved):

```css
/* ===========================================
   SLIDE 3 — MERGED LAYOUT (replaces old fan-reveal)
   See spec at docs/superpowers/specs/2026-05-26-slide-3-4-merge-design.md
   =========================================== */
#slide-3 { background-color: var(--bg-base); }

.slide-3-layout {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: clamp(0.6rem, 1.5vh, 1.2rem);
    height: 100%;
}
.slide-3-header { text-align: center; }
.slide-3-title {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: clamp(2rem, 5vw, 4.5rem);
    line-height: 1.05;
    color: var(--text-primary);
    letter-spacing: 0.04em;
}
.slide-3-subtitle {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: clamp(0.95rem, 1.8vw, 1.4rem);
    color: var(--text-muted);
    margin-top: clamp(0.3rem, 0.8vh, 0.6rem);
}

.slide-3-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 55% 45%;
    gap: clamp(1rem, 3vw, 3rem);
    align-items: center;
}

.stack-container {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 100%;
}

.stack-card {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 88%;
    aspect-ratio: 16 / 10;
    background: var(--bg-card);
    border: 1px solid var(--border-rule);
    box-shadow: 0 8px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3);
    transition:
        transform 500ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 500ms cubic-bezier(0.16, 1, 0.3, 1),
        z-index 0ms 250ms;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.stack-card.content-card img {
    width: 100%;
    flex: 1;
    object-fit: cover;
    object-position: top center;
}
.stack-card .brand-caption {
    font-family: 'Cinzel', serif;
    font-size: clamp(0.7rem, 0.95vw, 1rem);
    color: var(--text-primary);
    background: rgba(14, 12, 10, 0.85);
    border-top: 1px solid var(--border-rule);
    padding: clamp(0.3rem, 0.8vh, 0.5rem) clamp(0.6rem, 1.2vw, 1rem);
    letter-spacing: 0.1em;
    text-align: center;
    flex-shrink: 0;
}
.stack-card.ghost-card {
    background: var(--bg-card);
    border: 1px solid rgba(201, 169, 97, 0.18);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Resting-state transforms by data-stack-pos. Content cards 0..3
   are the cycle; ghost cards 4..6 are decorative depth. */
.stack-card[data-stack-pos="0"] { transform: scale(1.0) translateY(0)   translateX(0);   z-index: 7; }
.stack-card[data-stack-pos="1"] { transform: scale(0.96) translateY(14px) translateX(4px);  z-index: 6; opacity: 0.85; }
.stack-card[data-stack-pos="2"] { transform: scale(0.92) translateY(28px) translateX(8px);  z-index: 5; opacity: 0.65; }
.stack-card[data-stack-pos="3"] { transform: scale(0.88) translateY(42px) translateX(12px); z-index: 4; opacity: 0.50; }
.stack-card[data-stack-pos="4"] { transform: scale(0.84) translateY(56px) translateX(16px); z-index: 3; opacity: 0.18; }
.stack-card[data-stack-pos="5"] { transform: scale(0.80) translateY(70px) translateX(20px); z-index: 2; opacity: 0.10; }
.stack-card[data-stack-pos="6"] { transform: scale(0.76) translateY(84px) translateX(24px); z-index: 1; opacity: 0.05; }

/* Caption column */
.beat-column {
    position: relative;
    min-height: 1px;
}
.beat-caption {
    display: flex;
    flex-direction: column;
    gap: clamp(0.4rem, 1vh, 0.8rem);
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.beat-caption.is-active { pointer-events: auto; }
.beat-caption[hidden] { display: none; }

.beat-headline {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: clamp(1.4rem, 2.5vw, 2.4rem);
    line-height: 1.15;
    color: var(--accent-gold-bright);
    letter-spacing: 0.03em;
}
.beat-subline {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: clamp(0.95rem, 1.4vw, 1.3rem);
    color: var(--text-primary);
    line-height: 1.5;
}
.beat-deeplink {
    font-family: 'Cinzel', serif;
    font-size: clamp(0.8rem, 1.1vw, 1.1rem);
    color: var(--text-muted);
    letter-spacing: 0.08em;
    margin-top: clamp(0.4rem, 1.2vh, 0.9rem);
}
.beat-deeplink .beat-path {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: 0.85em;
    color: var(--text-muted);
    letter-spacing: 0;
}

.slide-3-footer {
    text-align: center;
    flex-shrink: 0;
}
.slide-3-punchline {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: clamp(1rem, 1.8vw, 1.5rem);
    color: var(--accent-gold);
    margin-top: clamp(0.3rem, 1vh, 0.7rem);
}
```

- [ ] **Step 3: Smoke-test the rendered layout**

Reload `http://127.0.0.1:8765/#slide-3`. Expect:
- Title + subtitle centered at top
- Left column: 4 stacked cards (top one fully visible, 3 behind it at scale 0.96, 0.92, 0.88), plus 3 ghost-card frames trailing further down-right at low opacity
- Right column: "Same design language..." caption visible, deeplink underneath
- Hint and punchline at bottom

The cards should look like a real stack now. The cycle won't work yet — Task 9 wires up the JS. But click events shouldn't error.

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "feat(talk): insert new slide-3 CSS (layout + stack transforms + captions) (step 7/9)"
```

---

## Task 9: Add new slide-3 projector overrides

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** At 2K (`min-width: 1600px`), the row layout still works but title/caption sizes need to lift to projector-grade, matching PR #24's pattern for other slides.

- [ ] **Step 1: Find the existing projector media-query block**

```bash
grep -nE "@media \(min-width: 1600px\)" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected match around line 72 — the start of the projector overrides block ending around line 145.

- [ ] **Step 2: Insert new slide-3 overrides inside the @media block**

Find the existing `#slide-13 .slide-content { ... }` rule (now renumbered to `#slide-12 .slide-content` after Task 4) inside the projector block; insert new slide-3 overrides immediately before that rule, after the existing slide-4 (was slide-5) overrides.

Use the Edit tool. Find a clean anchor:

old_string (must be unique, taken from the projector block immediately before the slide-3 inserts go):
```css
    /* Slide 13 — center the three truths poem horizontally for projector impact. */
    #slide-12 .slide-content { align-items: center !important; text-align: center !important; }
```

new_string:
```css
    /* Slide 3 — merged dozen-in-a-dozen layout at projector scale. */
    #slide-3 .slide-3-title { font-size: clamp(3.5rem, 6vw, 7.5rem) !important; }
    #slide-3 .slide-3-subtitle { font-size: clamp(1.4rem, 1.8vw, 2.2rem) !important; }
    #slide-3 .slide-3-body { grid-template-columns: 56% 44% !important; gap: clamp(2rem, 4vw, 5rem) !important; }
    #slide-3 .beat-headline { font-size: clamp(2rem, 3vw, 3.4rem) !important; }
    #slide-3 .beat-subline { font-size: clamp(1.2rem, 1.6vw, 1.85rem) !important; }
    #slide-3 .beat-deeplink { font-size: clamp(1rem, 1.3vw, 1.5rem) !important; }
    #slide-3 .stack-card .brand-caption { font-size: clamp(0.95rem, 1.1vw, 1.3rem) !important; }
    #slide-3 .slide-3-punchline { font-size: clamp(1.4rem, 2vw, 2.4rem) !important; }
    #slide-3 .slide-3-hint { font-size: clamp(1rem, 1.1vw, 1.4rem) !important; }
    /* Slide 13 — center the three truths poem horizontally for projector impact. */
    #slide-12 .slide-content { align-items: center !important; text-align: center !important; }
```

- [ ] **Step 3: Verify the projector overrides render at 2K**

Use Chrome DevTools → Device Mode → Responsive → set viewport to `2560 x 1440`. Reload `http://127.0.0.1:8765/#slide-3`. Expect text sizes to scale up — title around 96px+, beat headlines around 50px+, etc.

If a font-size doesn't change between 1366 and 2560 viewport, the `!important` override may not be hitting. Inspect the element in DevTools and check the computed style.

- [ ] **Step 4: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "feat(talk): add slide-3 projector overrides for 2K wallscreen (step 8/9)"
```

---

## Task 10: Wire up the click-cycle JS hook

**Files:**
- Modify: `public/talks/2026-06-03-slay-the-cert/index.html`

**Why:** The slide-3 hook IIFE was deleted in Task 6. This task installs the new one — handles click cycle, data-stack-pos rotation, caption swap with fade-out → blur-reveal-in, persistent hint, click-after-beat-IV no-op (with optional punchline pulse).

- [ ] **Step 1: Find the insertion point**

The slide-3 hook should live where the old one did — immediately before the slide-8 hook (now slide-7 per Task 5). Find the slide-7 hook's opening comment:

```bash
grep -nE "PHASE 4\.2 — Slide 7 achievement-pop" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected: one match. The new slide-3 hook goes IMMEDIATELY BEFORE this comment.

- [ ] **Step 2: Insert the new IIFE**

Edit `index.html`:

old_string:
```javascript
/* ===========================================
   PHASE 4.2 — Slide 7 achievement-pop hook (was slide 8 pre-merge)
```

new_string:
```javascript
/* ===========================================
   SLIDE 3 — Card-cycle hook (merged dozen-in-a-dozen layout)
   Click anywhere inside slide 3 to advance the beat:
   - rotates data-stack-pos values (bottom content card wraps to top)
   - swaps active beat caption with fade-out -> blur-reveal-in
   - clamps at beat 3 (last); further clicks pulse the punchline
   - persistent click hint matches existing slide-3 + slide-7 convention
   See spec at docs/superpowers/specs/2026-05-26-slide-3-4-merge-design.md
   =========================================== */
(function setupSlide3CardCycle() {
  const slide = document.getElementById('slide-3');
  if (!slide) return;

  const stack = slide.querySelector('.stack-container');
  const contentCards = Array.from(slide.querySelectorAll('.stack-card.content-card'));
  const captions = Array.from(slide.querySelectorAll('.beat-caption'));
  const punchline = slide.querySelector('.slide-3-punchline');
  const TOTAL_BEATS = 4;

  let currentBeat = 0;
  let slideIsVisible = false;

  // Maintain own visibility flag (SlidePresentation's .visible class is set-once).
  const resetObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      slideIsVisible = entry.isIntersecting;
      if (!entry.isIntersecting) {
        // Reset for next entry so the argument replays cleanly
        currentBeat = 0;
        setActiveCaption(0);
        // Reset data-stack-pos values to initial DOM order
        contentCards.forEach((card, idx) => {
          card.dataset.stackPos = String(idx);
        });
      }
    });
  }, { threshold: 0.5 });
  resetObserver.observe(slide);

  function setActiveCaption(beatIndex) {
    captions.forEach(cap => {
      const isTarget = Number(cap.dataset.beat) === beatIndex;
      if (isTarget) {
        cap.hidden = false;
        cap.classList.add('is-active');
        // Force reflow then trigger blur-reveal-in
        cap.classList.remove('reveal-blur');
        void cap.offsetWidth; // reflow trick
        cap.classList.add('reveal-blur');
      } else {
        cap.hidden = true;
        cap.classList.remove('is-active');
      }
    });
    if (stack) stack.dataset.currentBeat = String(beatIndex);
  }

  function cycleStack() {
    // Rotate data-stack-pos values by -1 modulo TOTAL_BEATS for content cards only.
    // Card at pos (TOTAL_BEATS - 1) wraps to pos 0; others advance one slot back.
    contentCards.forEach(card => {
      const oldPos = Number(card.dataset.stackPos);
      const newPos = (oldPos + 1) % TOTAL_BEATS;
      card.dataset.stackPos = String(newPos);
    });
  }

  function advanceBeat() {
    if (currentBeat >= TOTAL_BEATS - 1) {
      // Already at last beat — pulse the punchline as a "you're done" cue.
      if (punchline) {
        punchline.classList.remove('pulse');
        void punchline.offsetWidth; // reflow
        punchline.classList.add('pulse');
        setTimeout(() => punchline.classList.remove('pulse'), 240);
      }
      return false;
    }
    currentBeat += 1;
    cycleStack();
    setActiveCaption(currentBeat);
    return true;
  }

  // Capture-phase click handler — only intercept while slide 3 active and clicks
  // originate inside the slide section. Mirrors the defensive pattern from
  // commit 520a348 (slide-3 fan-reveal hook) and PR #17 slide-8 hook.
  document.addEventListener('click', (e) => {
    if (!slideIsVisible) return;
    if (!slide.contains(e.target)) return;
    e.stopPropagation();
    advanceBeat();
  }, true);

  // Keyboard handler — Space / ArrowRight advance one beat while beats remain.
  // PageDown also works for clicker remotes.
  document.addEventListener('keydown', (e) => {
    if (!slideIsVisible) return;
    if (currentBeat >= TOTAL_BEATS - 1) return; // let SlidePresentation handle advance to slide 4
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.stopPropagation();
      e.preventDefault();
      advanceBeat();
    }
  }, true);
})();

/* ===========================================
   PHASE 4.2 — Slide 7 achievement-pop hook (was slide 8 pre-merge)
```

- [ ] **Step 3: Add the `.pulse` CSS rule (for click-after-IV punchline cue)**

Find the existing `.slide-3-punchline` rule in the CSS section (inserted in Task 8).

Add immediately after:

old_string:
```css
.slide-3-punchline {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: clamp(1rem, 1.8vw, 1.5rem);
    color: var(--accent-gold);
    margin-top: clamp(0.3rem, 1vh, 0.7rem);
}
```

new_string:
```css
.slide-3-punchline {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: clamp(1rem, 1.8vw, 1.5rem);
    color: var(--accent-gold);
    margin-top: clamp(0.3rem, 1vh, 0.7rem);
    transition: transform 200ms ease-out;
}
.slide-3-punchline.pulse { transform: scale(1.03); }
```

- [ ] **Step 4: Click-through verification**

Reload `http://127.0.0.1:8765/#slide-3`. Click once. Expect:
- Bottom content card (claudecertification.com) animates up to top position
- Other 3 content cards each shift one slot back
- Caption swaps from beat 0 to beat 1: headline "Same offered functionality."
- Hint at bottom still says "[click to reveal the next]"

Click two more times. Expect cycle to advance through beats 2 and 3. At beat 3, headline is "And I started here, too."

Click a fourth time. Expect:
- No further card cycle
- No caption swap
- Punchline at bottom briefly scales to 1.03 then back

- [ ] **Step 5: Defensive-click verification**

Click on a nav-dot to navigate to a different slide. Expect navigation to work — the slide-3 hook should NOT swallow the nav-dot click.

- [ ] **Step 6: Re-entry verification**

Navigate away to slide 4, then back to slide 3. Expect:
- Cycle resets to beat 0
- Top card is claudecertifications.com again
- All cards back to initial positions
- Caption 0 visible

- [ ] **Step 7: Reduced-motion verification**

Open DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → Reduce. Reload slide 3. Click through beats. Expect:
- Card transitions still happen (CSS interpolation), but in 200ms snap instead of 500ms ease
- Captions still swap
- No flowing/drifting motion (dust motes hidden)

- [ ] **Step 8: Commit**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "feat(talk): wire up slide-3 card-cycle JS hook with defensive guards (step 9/9)"
```

---

## Task 11: Final renumbering audit + verification snapshots

**Files:**
- (read-only verification)

- [ ] **Step 1: Renumbering audit grep**

```bash
git grep -nE "slide-([5-9]|1[0-5])\b" public/talks/2026-06-03-slay-the-cert/index.html
```

Expected output: ONLY matches for class names like `.slide-6-body`, `.slide-7-title-fails`, `.slide-8-section-title`, `.slide-8-hint`, `.slide-13-meta-pretitle`, `.slide-13-preamble` — these are intentionally kept at old numbers per the spec.

NO matches for `#slide-5`..`#slide-15` (IDs are all renamed). NO matches for `slide-4-*` (slide-4 fully deleted).

If you see a `#slide-N` for N≥5, stop and fix.

- [ ] **Step 2: Snap-slide regression at laptop + wallscreen**

```bash
cd public/talks/2026-06-03-slay-the-cert
node scripts/snap-slides.mjs slide-3 slide-4 slide-7 slide-8 slide-10 slide-12 --sizes=laptop,wallscreen
cd ../../../
```

Expected: PNGs written to `public/talks/2026-06-03-slay-the-cert/assets/_review/slide-N-{laptop,wallscreen}.png`. Open them in an image viewer; visually verify:
- slide-3: new merged layout, two columns, stack on left, caption on right
- slide-4 (was old slide-5): the "So I built a different one" pivot slide, centered composition at wallscreen (PR #24's polish)
- slide-7 (was old slide-8): carrots & snares list, achievement-pop still works
- slide-8 (was old slide-9): demo card with GIF
- slide-10 (was old slide-11): workflow folder tree, centered at wallscreen (PR #24's polish)
- slide-12 (was old slide-13): three truths poem, centered + monumental sizes at wallscreen

If any slide LOOKS BROKEN at wallscreen but FINE at laptop, the projector overrides didn't follow the renumbering. Check the @media block.

- [ ] **Step 3: Computed-font audit**

```bash
cd public/talks/2026-06-03-slay-the-cert
node scripts/measure-fonts.mjs
cd ../../../
```

Expected: at `2560x1440`, slide-3 `.slide-3-title` ≥ 90px, `.beat-headline` ≥ 48px, `.beat-deeplink` ≥ 22px. If any of these are smaller, the projector overrides didn't apply — check selector specificity.

- [ ] **Step 4: End-to-end click-through the full deck**

Open `http://127.0.0.1:8765/` and arrow-key through all 14 slides. Verify:
- Total slide count is 14 (nav dots)
- Slide 3 cycles correctly (4 beats, 4 clicks max)
- Slide 7 (was old 8) achievement-pops correctly (10 items pop on clicks)
- Slide 12 (was old 13) — three truths big-line at projector
- Slide 14 (was old 15) — references + thanks

- [ ] **Step 5: Commit (only if Task 11 fixed anything; otherwise skip)**

```bash
git add public/talks/2026-06-03-slay-the-cert/index.html
git commit -m "fix(talk): renumbering audit fixes uncovered during regression check"
```

(If the audit was clean, no commit — Task 11 was just verification.)

---

## Self-Review

### Spec coverage

- §1 Context: Tasks 1+2 delete slide-4 (the redundant slide); Tasks 6+7+8 rebuild slide-3 with the new layout. ✓
- §2 Goals: Single-slide replacement (Tasks 1-10), redundant chain row removed (Task 1 deletes it), 4-beat staging (Task 7's markup), Beat IV self-implication (Task 7's beat-3 caption), tone humble (all copy in Task 7 matches spec §5). ✓
- §3 Non-goals: No auto-cycle (Task 10's JS is click-only), 4 beats only (Task 7 markup), no wrap (Task 10's `if (currentBeat >= TOTAL_BEATS - 1) return false`), classes not renamed (Task 4 only renames `#slide-N` IDs, not `.slide-N-foo` classes). ✓
- §4 Visual layout: 55/45 row split (Task 8 CSS), projector overrides (Task 9). ✓
- §5 Beat content table: all 4 beats with exact headline + sub-line + brand + deeplink (Task 7 markup). Note Beat III's sub-line is "Anthropic's exam guide. Repeated, four ways." — the spec's "twenty pages" was flagged for fact-check; this plan uses the neutral version. ✓
- §6 Click interaction state machine: currentBeat 0..3, increment + clamp + punchline pulse (Task 10). ✓
- §7 Card stack mechanics: data-stack-pos resting transforms (Task 8), ghost-card depth at positions 4/5/6 (Task 8), data-stack-pos rotation by +1 mod 4 (Task 10 — note the spec said "-1 mod 4" but our markup numbers go bottom=3 to top=0, so incrementing pos moves "up" the stack correctly. Sanity-check during Task 10 Step 4.) ✓
- §8 Wiring & risks: renumbering audit covered by Task 11 Step 1; class-rename smell explicitly accepted (Task 5's comment annotates the slide-8→slide-7 case). ✓
- §9 Verification: snap-slides + measure-fonts + click-through (Task 11). ✓
- §10 Future iteration hooks: beat copy, animation timing, punchline tone — all easy to revisit post-Phase-6 dry-runs. ✓
- §11 Out of scope: no new assets, no mobile, no audio. ✓

### Placeholder scan

- No "TBD" / "TODO" / "fill in details" / "implement later".
- Every step has the exact command and expected output (or exact code block when code is changing).
- No "similar to Task N" backrefs — code is repeated where needed.

### Type / name consistency

- `currentBeat` used consistently in Task 10.
- `TOTAL_BEATS = 4` defined once and referenced.
- `data-stack-pos` attribute name consistent between markup (Task 7) and JS (Task 10).
- `.is-active` CSS class added in Task 8 referenced in Task 10's `setActiveCaption`.
- `.pulse` CSS class added in Task 10 Step 3 referenced in Task 10 Step 2's `advanceBeat`.
- `.content-card` class used in Task 7 markup and Task 10's `querySelectorAll('.stack-card.content-card')`.
- `.ghost-card` class used in Task 7 markup and Task 8 CSS.
- Beat captions identified by `data-beat="N"` in Task 7 and read in Task 10's `setActiveCaption`.

### Sanity check on Task 10's rotation direction

Spec §6 says "data-stack-pos rotates by -1 modulo 4." Markup in Task 7 sets initial positions 0..3 for content cards (top to bottom). The rotation goal is "bottom card moves to top, others fall back one slot."

If `pos 3` (bottom) → `pos 0` (top), and `pos 0..2` each move down one slot to `pos 1..3`:
- `pos 0 → pos 1` (i.e. `pos += 1`)
- `pos 1 → pos 2`
- `pos 2 → pos 3`
- `pos 3 → pos 0` (wrap)

This is `(pos + 1) % 4`, i.e. **+1 mod 4**, not `-1 mod 4`. Task 10's code is correct (`(oldPos + 1) % TOTAL_BEATS`). The spec's `-1 mod 4` was a directional confusion in the spec text; the plan executes the right direction. **Task 10 Step 4's smoke test will catch any direction bug.** If observed cycle direction is wrong, swap `+1` to `-1` (with care for JS's modulo behavior on negatives: `((oldPos - 1) + TOTAL_BEATS) % TOTAL_BEATS`).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-slide-3-4-merge-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
