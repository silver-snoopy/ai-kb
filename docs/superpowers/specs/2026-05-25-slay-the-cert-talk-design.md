# Slay the Cert — Talk Design

**Date:** 2026-05-25
**Author:** User + Claude (brainstorming session)
**Status:** Draft pending user approval
**Talk title:** Slay the Cert
**Sub-line:** *A warlock, a workflow, and a force multiplier.*
**Talk date:** Wednesday 2026-06-03 (8 days from spec date — date corrected 2026-05-26)
**Audience:** Fellow engineers at user's company, in English
**Format:** Meetup (warm + casual, not formal)
**Length:** 15 minutes target (can shorten to 10 if needed)
**Co-talks:** Friends will present on spec-driven development and the mindset shift required for agentic SDLC. This talk references the workflow loop as a handoff, not a deep-dive.

**Related documents:**
- Research: [2026-05-25 talk research](../research/2026-05-25-slay-the-cert-talk-research.md)
- Project ship spec: [2026-04-18 Slay the Cert gamification design](./2026-04-18-slay-the-cert-gamification-design.md)
- Evidence base: [2026-04-18 gamification research](../research/2026-04-18-gamification-research.md)

---

## 1. Overview

### 1.1 Goal

A 15-min meetup talk using the Slay the Cert dungeon as the concrete example of AI-as-engineering-force-multiplier. Three acts: (1) AI-slop critique of contemporary cert-prep content, (2) gamification as a deliberate design response (positive + protective choices), (3) the AI-enabled engineering workflow that lets one engineer ship a polished game in weekends.

### 1.2 Non-goals

- Not a deep-dive on spec-driven development — colleagues' follow-up talk covers that. Act III references the workflow loop as a handoff.
- Not an academic gamification review. One anchor stat per beat; research doc is the appendix.
- Not designed for general public consumption — the deck is a talk-day artifact + post-talk portfolio piece; no broad marketing target.
- Not a sales pitch for any tooling. Claude Code skills mentioned are illustrative.
- Not a Slay-the-Cert product launch. Game is shipped (since 2026-04-19) and serves as evidence, not announcement.

### 1.3 Success criteria

1. Talk runs within 15 min including 1-2 min demo.
2. Live alt-tab demo from `localhost:5173` lands cleanly — at least one boss-fight question, one boss-damage hit, one victory frame visible.
3. Audience leaves with one memorable image (slop montage), one memorable stat (gamification effect size or Duolingo retention number), one memorable framing ("the bottleneck moved from code-writing to having the idea").
4. Senior-Manager-appropriate tone: critique without snark, warmth without performance.
5. Co-talk handoff is respectful — tees up friends' talk without overshadowing.
6. Branded variant (with company chrome) + private speaker notes stay local. Public master deck is shareable as a repo artifact.

---

## 2. Requirements (confirmed with user)

| # | Requirement | Source |
|---|---|---|
| R1 | 15-min target, shortenable to 10 | Q1 |
| R2 | Three-act structure: AI slop → gamification → AI enablement | Q3 + Q4 |
| R3 | Drop the Mom-pedagogy anchor (kept thesis tight) | Q3 revision |
| R4 | Meetup tone: friendly + warm + Senior-Manager-appropriate | Q3 + Q5 |
| R5 | Alt-tab to LOCAL dungeon (npm run dev → :5173); 1-2 min demo | Q2 |
| R6 | Base64-inlined GIF fallback in the deck for demo-failure case | Insight, implicitly approved |
| R7 | Optional Phase 2: iframe embed in slide; deferred until Phase 1 works | Q2 |
| R8 | Single-file HTML deck via frontend-slides skill; no deployment | Q2 constraint |
| R9 | Title: "Slay the Cert" with sub-line "A warlock, a workflow, and a force multiplier." | Q5 |
| R10 | Visual preset: "Creative Voltage" across all slides | Q6 |
| R11 | Act III references spec-driven-dev workflow as handoff to colleagues' talk | Q4 |
| R12 | Talk date: Wednesday 2026-06-03 (corrected 2026-05-26) | User correction |
| R13 | Public master deck committed; company-branded variant gitignored under `public/talks/**/branded/` | User revision post-Chunk 2 |
| R14 | Real-user testimonials slide added (slide 10, post-demo) — strongest evidence the design works | User addition post-Chunk 3 |
| R15 | Deck deployable via GitHub Pages — relocated to `public/talks/2026-06-03-slay-the-cert/` (2026-05-26) | User request |

---

## 3. Architecture

### 3.1 Folder layout

```
c:\projects\ai-kb\
├── docs\superpowers\
│   ├── research\
│   │   └── 2026-05-25-slay-the-cert-talk-research.md   ← committed
│   └── specs\
│       └── 2026-05-25-slay-the-cert-talk-design.md     ← committed (this file)
│
└── public\talks\                                       ← public master committed; deploys via Pages
    └── 2026-06-03-slay-the-cert\
        ├── slides.html                                 ← public master (committed)
        ├── assets\                                     ← committed (public)
        │   ├── slop-montage\*.png                      ← competitor screenshots
        │   ├── dungeon-demo.gif                        ← 6-sec loop (base64 inlined)
        │   ├── testimonials.md                         ← curated quotes
        │   └── workflow-diagram.svg
        ├── notes.md                                    ← gitignored (speaker notes)
        └── branded\                                    ← gitignored (company-flavored)
            └── slides.html                             ← branded variant for the venue
```

### 3.2 Tech stack

| Component | Choice | Rationale |
|---|---|---|
| Slide framework | frontend-slides skill (zarazhangrui) | Single-file HTML output; no deps; satisfies no-deploy constraint; native stagger/reveal; per-slide JS hooks |
| Style preset | Creative Voltage | Retro-modern + halftone + neon; visual rhyme with dungeon pixel-art |
| Custom animations | ~20-line per-slide JS hooks | Card-stack reveal (Act I), achievement-pop (Act II) |
| Demo runtime | Local Vite dev server (`npm run dev`) on `:5173` | Same as dungeon dev; no network risk |
| Fallback | Base64-inlined GIF (6-sec boss-fight loop) | Survives dev-server or network failure |
| Slides hosting (Phase 2 only) | `npx serve public/talks/.../` on `:8080` | Enables iframe embed of `localhost:5173` |
| Version control | Spec + research + master deck committed under `public/talks/`; `public/talks/**/branded/` + `public/talks/**/notes.md` gitignored | Public master deployable via Pages as portfolio artifact; branded variant + private speaker notes stay local |

### 3.3 Three-act story arc (15 min)

| Act | Time | Slides | Beat |
|---|---|---|---|
| Hook | 0:00 – 1:00 | 1 | Cold open — relatable pain → tee up AI slop |
| **Act I — Problem: AI slop** | 1:00 – 4:00 | 2-3 | Card-stack reveal of 4-5 cert-prep sites; visual punchline |
| **Act II — Response: gamification** | 4:00 – 7:30 | 3-4 | Anchor stat, failure modes, design choices (carrots-used + dark-patterns-refused showdown) |
| **DEMO** | 7:30 – 9:00 | 1 | Alt-tab to localhost:5173; 90-sec scripted boss fight |
| **Testimonials bridge** | 9:00 – 9:30 | 1 | Real-user quotes — "the design works in the wild" |
| **Act III — Enabler: AI as force multiplier** | 9:30 – 13:00 | 3 | Workflow handoff, imagination unlock, "I'm not a game dev" anchor |
| Close | 13:00 – 14:30 | 1 | "What would YOU build?" + appendix |
| Buffer / Q&A | 14:30 – 15:00 | — | Slack if timing slipped |

**Total: ~13-15 slides + 1 demo break.**

### 3.4 Demo placement & failure-mode plan

**Placement rationale:** Demo at the seam between Act II (gamification design) and Act III (AI enablement). Audience has just heard "I designed this with care to avoid Habitica-style failures" → primed to evaluate the design when they see it. Demo answers "does the design hold up?" Sets up Act III: "now that you've seen what it is, here's how it got built."

**Failure-mode ladder** (each fallback transparent to the audience):
1. **Primary:** alt-tab to localhost:5173 (Vite dev server running pre-talk).
2. **Fallback 1:** alt-tab fails or server crashes → click through to the embedded GIF on the demo slide. Continue narrating over the loop.
3. **Fallback 2:** GIF doesn't load → describe the boss fight verbally, advance past the slide. Audience still has the slop-montage and reward-system slides as anchors; demo is reinforcement, not load-bearing.

---

## 4. Slide-by-slide inventory

Detailed enough to write each slide in Phase 3. Visual + animation notes inline.

| # | Title | Beat | Visual / animation |
|---|---|---|---|
| 1 | **Slay the Cert** | Title | Pixel-art warlock sprite (from repo asset) next to title; sub-line below in halftone-textured panel. Creative-Voltage neon accent. |
| 2 | "Prepped for an AI cert lately?" | Hook | Single line of large text; reveal-blur in on click; cues show-of-hands moment. |
| 3 | Slop montage (card stack) | Act I core | 4-5 competitor site screenshots; **card-stack-on-click reveal** animation (custom JS); brand caption at corner of each card; final click reveals caption "Spot the difference?" |
| 4 | "Same domain. Same content. Different logo." | Act I punchline | Side-by-side of 3 deep-link domain pages for Domain 1 (Agentic Architecture); shows it's not just same layout — it's same content. |
| 5 | "So I built a different one." | Pivot | Single-line transition; pixel-art portal effect (optional, native `.reveal-scale`). |
| 6 | Gamification works | Act II opener | Anchor stat: **d = 0.52, 87 studies, 71% positive** (Gyedu 2026); counter-animate the numbers. |
| 7 | Gamification also fails | Act II caveat | Habitica counterproductive-effects + Duolingo streak-anxiety; honest framing; reveal in 2 stages. |
| 8 | **Reward system: carrots + refused dark patterns** | Act II centerpiece | Two-column showdown layout; **achievement-pop** animation (custom JS): left column carrots flash gold on click; right column dark patterns get red-✗ stamp. |
| 9 | **DEMO** | Demo break | Alt-tab to localhost:5173. Slide content: small "← live demo" caption + base64-inlined GIF as fallback. |
| 10 | **"And here's what users said."** | Testimonials bridge | 2-3 real-user quotes (curated from received testimonials); name/role/study-context per quote. Reveal one at a time. Bridges demo (the thing exists) to Act III (how it was possible). |
| 11 | "How did one engineer ship this in weekends?" | Act III transition | Visualize `docs/superpowers/` tree expanding; caption: *"The answer isn't 10x productivity. It's a workflow."* |
| 12 | Brainstorm → Spec → Plan → Execute (the loop) | Act III workflow | 4-box loop diagram with Claude Code skill names labelled on each box; sub-caption: *"Yes — including these slides."* Explicit handoff line: *"My friends' talk goes deeper on this; I'll just point at the shape."* |
| 13 | "I'm not a game dev." | Act III anchor | Three lines, reveal one per click: "I'm not a game dev." / "I'd never touched Phaser." / "I shipped this anyway." |
| 14 | **What's YOUR dungeon?** | Close | Bold close-line; *"The hard part used to be writing the code. Now the hard part is knowing what's worth building."* |
| 15 | Appendix / thanks | Q&A buffer | One slide with references (gamification studies, Slay the Spire, FromSoft, frontend-slides skill credit) and a link/QR to the public deck repo (since master is now committed). |

---

## 5. Content sourcing

| Slide(s) | Source |
|---|---|
| 3-4 (slop montage) | Research doc §1 — 9 candidate URLs; pick 4-5 strongest |
| 6-7 (gamification stats + failure modes) | Research doc §2 (Gyedu 2026, Duolingo) + existing gamification research §1 + §7 |
| 8 (reward showdown) | Research doc §4 — pre-built carrots/refused breakdown grounded in ship spec |
| 10 (testimonials) | User-collected real-user testimonials; Phase 2 task — curate 2-3 strongest quotes into `talks/.../assets/testimonials.md`. Anonymize unless quotee explicitly opted-in to attribution. |
| 11-12 (workflow) | `docs/superpowers/` tree + brainstorming/writing-plans/executing-plans skill names |
| 13 (anchor) | User's own framing; needs to be delivered first-person |
| Title sprite | `public/dungeon/public/assets/sprites/warlock-desperate-stance.png` (currently uncommitted in working tree) |

---

## 6. Implementation phases

| Phase | Goal | Estimated time | Day |
|---|---|---|---|
| 1 | This spec + writing-plans output | done | 2026-05-25 (Day 0) |
| 2 | Fetch slop screenshots; curate testimonials; finalize research doc | done (testimonials still pending) | 2026-05-26 (Day 1) |
| 3 | Run `/frontend-slides`; first-pass + style iteration | in progress | 2026-05-26 → 27 (Days 1-2) |
| 4 | Custom animations: card-stack JS + achievement-pop JS | done | 2026-05-25 (Day 0) |
| 5 | Demo prep: record + base64-inline GIF | **NEEDS USER** | 2026-05-28 (Day 3) |
| 6 | 2-3 timed dry-runs; trim to fit 15 min | | 2026-05-29 to 30 (Days 4-5) |
| 7 | Visual + copy polish from dry-run feedback | | 2026-05-31 (Day 6) |
| 8 | Branded variant + final rehearsal | | 2026-06-01 to 02 (Days 7-8) |
| **Talk** | **Slay the Cert at meetup** | — | **2026-06-03 (Wed)** |

Buffer: ~1 day total. Tight schedule due to corrected date.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Live demo fails (no network / dev server crashes) | Base64 GIF fallback inline in slide 9; can advance past without breaking flow |
| Talk over-runs 15 min | Phase 6 dry-runs force trimming; thesis designed to shorten to 10 if needed (drop slides 4 + 7 first) |
| Audience doesn't recognize "Slay the Spire" reference | Title visual + warlock sprite + dungeon demo do enough work; reference is bonus, not load-bearing |
| Spec-driven-dev overlaps with friends' talk | Slide 11 is one slide + explicit verbal handoff |
| frontend-slides custom JS doesn't compose with style preset | Phase 4 has 1-day buffer; fallback to scroll-triggered stagger (built-in) if click-driven fails |
| Slop-site URLs go down or change before 2026-06-03 | Phase 2 screenshots freeze content as static images |
| Date compression to 8 days | Phase 5 GIF + Phase 2.3 testimonials are the load-bearing user-action items; both must land by Thu 2026-05-28. If either slips, Phase 6 dry-runs compress further. |
| Branded deck variant accidentally committed | `public/talks/**/branded/` + `public/talks/**/notes.md` in .gitignore from Phase 1; verify before each commit |
| Testimonial attribution leaks personal info | Default to anonymize ("CCA-F candidate, May 2026"); attribute only with explicit opt-in confirmation per quotee |
| Senior-Manager-appropriate tone slips into snark | Phase 7 copy polish reviews every slide for tone; tone-check is a phase deliverable |

---

## 8. Open questions (for writing-plans, not blockers)

- **Phase 2 iframe:** pursue, or stop at Phase 1 alt-tab? Recommend stopping at Phase 1 unless dry-runs reveal a need.
- **About-me slide:** include one between slides 1 and 2? Engineers like to know who's talking. Trade-off: extends count to 16 slides; consider during Phase 3 dry-runs.
- **Recording:** is the talk recorded? Doesn't change gitignore (already public master), but affects whether speaker-notes file should also be sharable as a transcript artifact post-talk.
- **Co-talk timing:** when do friends' talks happen relative to this one? Affects whether slide 12's handoff is forward ("they'll cover this next") or backward ("they already covered this").
- **Branded variant scope:** how heavy is the branding? Just a logo on slides 1 + 15, or every-slide footer? Affects Phase 3 effort.
