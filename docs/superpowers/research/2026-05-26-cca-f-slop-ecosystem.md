# The CCA-F Copycat Ecosystem — Reference Sheet

**Date:** 2026-05-26
**Purpose:** Canonical roster of every Claude-cert-prep site I've found in the wild, organised so the Slay-the-Cert talk (and future updates of it) can pull from one source rather than re-discovering URLs every time. Companion to [the talk research](./2026-05-25-slay-the-cert-talk-research.md); supplements §1.
**Last verified:** 2026-05-26 (live captures via Playwright at 1366×768).

---

## TL;DR

Within ~10 weeks of CCA-F's launch (2026-03-12), a small constellation of nearly-identical study-guide + mock-exam sites appeared. They share the same heading structure ("Domain N — Topic"), the same exam-weight numbers (27% / 25% / etc.), the same explanation cadence, and roughly the same UX for practice questions. Three sit behind a paywall; one was DMCA'd before this doc was finalised. The "deep-link sameness" — i.e., the same *Agentic Architecture* page rendered four different ways — is the most damning frame for the talk.

---

## 1. Free sites (study guide + free mock available)

Each of these publishes a full domain guide and a public mock-exam page. All four were captured for [Slide 3 (mock ecosystem)](../../public/talks/2026-06-03-slay-the-cert/index.html) and [Slide 4 (deep-link sameness)](../../public/talks/2026-06-03-slay-the-cert/index.html).

| # | Site | Base | Domain-1 Guide | Mock / Practice | Captured |
|---|---|---|---|---|---|
| 1 | **claudecertifications.com** | [/](https://claudecertifications.com/claude-certified-architect) | [/domains/agentic-architecture](https://claudecertifications.com/claude-certified-architect/domains/agentic-architecture) | [/practice-questions](https://claudecertifications.com/claude-certified-architect/practice-questions) | guide ✅ · mock ✅ |
| 2 | **claudecertprep.com** | [/](https://claudecertprep.com) | [/study-guide/intro](https://claudecertprep.com/study-guide/intro) | [/mock](https://claudecertprep.com/mock) | guide ✅ · mock ✅ |
| 3 | **claudecert.com** | [/](https://claudecert.com/) | [/learn/1-agentic-architecture](https://claudecert.com/learn/1-agentic-architecture) | [/mock-exam](https://claudecert.com/mock-exam) | guide ✅ · mock ✅ |
| 4 | **claudecertification.com** | [/](https://claudecertification.com/) | [/study-guide/1](https://claudecertification.com/study-guide/1) | [/exams](https://claudecertification.com/exams) | guide ✅ · mock ✅ |

**Captures live in:** [public/talks/2026-06-03-slay-the-cert/assets/slop-montage/](../../public/talks/2026-06-03-slay-the-cert/assets/slop-montage/) — files `guide-<slug>.png` and `mock-<slug>.png` (1366×768).

## 2. Paywalled / gated

These exist in the ecosystem but lock the content behind purchase or signup. Worth a marginalia mention on Slide 3 ("three of the mock-exam sites sit behind a paywall") but not worth captures since the visible surface is just a checkout page.

| Site | URL | Note |
|---|---|---|
| Claude Exam Prep | [claudeexamprep.com](https://www.claudeexamprep.com/) | Gated; landing page only is public. |
| Claude Certified | [claudecertified.com/cca-practice-questions](https://claudecertified.com/cca-practice-questions) | Paywalled question pack. |
| Claude Certified Architects | [claudecertifiedarchitects.com](https://www.claudecertifiedarchitects.com/) | Same homepage template as #1, paywalled materials. |

## 3. Cross-provider rhyme (talk reserve, not currently in the deck)

Useful if a future iteration of the talk needs to point at "it's the same pattern on every AI vendor's cert". From the [original talk research](./2026-05-25-slay-the-cert-talk-research.md#1-ai-slop-cert-prep-candidates-act-i-montage).

- [skillcertpro.com — CCA-F](https://skillcertpro.com/product/claude-certified-architect-foundations-cca-f-exam-questions/) — "360 real questions, new drops weekly."
- [tutorialsdojo.com — CCA-F](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/) — same template the site already uses for AWS / Azure certs.
- [certificationpractice.com — CCA-F](https://certificationpractice.com/practice-exams/anthropic-claude-certified-architect-foundations) — identical "360 / 6 exams" numbers to skillcertpro.
- [flashgenius.net — OpenAI](https://flashgenius.net/blog-article/ultimate-guide-to-openai-certifications-2026) + [genaicerts.com — OpenAI](https://genaicerts.com/certs/openai) — bonus pair for an "and OpenAI too" beat.

## 4. Self-aware honourable mention

- [Medium "Gap Closer" article](https://pub.towardsai.net/claude-certified-architect-cca-f-exam-prep-the-gap-closer-everything-the-other-articles-missed-4ed0515f3ed5) — the title literally promises to fix what every other article missed. Lampshade for "the slop is so bad that the slop authors are writing meta-slop about the slop."

## 5. Withdrawn / taken down

- [claudecertifications.com (original homepage)](https://claudecertifications.com/) — was DMCA-takedown-noticed before 2026-05-25; archive copy still in `01-claudecertifications.png` history (deleted from disk on 2026-05-26 after Slide 3 was rebuilt).

---

## 6. What every site shares (the punchline-fuel)

Patterns I observed across all four free sites (and most of the paywalled / cross-provider ones):

1. **Identical exam-weight numbers** — every site renders "Agentic Architecture & Orchestration · 27%" exactly, copying the figure Anthropic published.
2. **The same five-domain list** — Agentic Architecture, Tool Design & MCP, Claude Code, Prompt Engineering, Context & Reliability — usually in the same order.
3. **Same "free study guide + practice questions" entry funnel** — none of them lead with a teacher's voice or an opinion; all of them lead with "Pass the CCA-F."
4. **Same mock-exam container** — *60 questions · 120 minutes · 720-to-pass on a 1000-pt scale* — copied verbatim from Anthropic's exam description, four times over.
5. **Same explanation cadence on practice questions** — terse "Correct because…" + 3 distractor explanations, no scenario framing.
6. **Same visual register** — beige / off-white background, slate-grey body, orange accent. Three of the four use the *exact same* tangerine `#e07a3a`-ish hex.

The Slide-4 deep-link comparison is the cleanest single visualisation of this.

---

## 7. How to refresh the captures

```bash
# from repo root
npm install playwright --no-save
npx playwright install chromium
cd public/talks/2026-06-03-slay-the-cert
node scripts/capture-slop.mjs         # writes guide-*.png and mock-*.png
node scripts/snap-slides.mjs slide-3 slide-4   # for visual verification
```

Both scripts are in [`public/talks/2026-06-03-slay-the-cert/scripts/`](../../public/talks/2026-06-03-slay-the-cert/scripts/). To add a new site: append a `[category, slug, url]` row to the `targets` array in `capture-slop.mjs` and re-run.

---

## 8. Update log

- **2026-05-26** — initial roster after Slides 3 + 4 were rebuilt against fresh 1366×768 captures of the four free sites' Guide and Mock pages. Old `01–10-*.png` montage assets retired.
- **2026-05-25** — original talk research §1 listed homepage-level + deep-link candidates; this doc supersedes that list as the canonical roster.
