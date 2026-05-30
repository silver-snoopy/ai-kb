# Slay the Cert — Speaker Notes

**Talk:** Slay the Cert — a game, a workflow, a force multiplier
**Date:** 2026-06-03 · **Deck:** [`index.html`](../index.html) · **Length:** ~10–15 min · **14 slides, ~45–60s each**

How to use this: each slide has **bullet talking-points** (what to say) and an *explanation* block underneath (the why, plus facts for Q&A). Learn the bullets; the explanations are there so you can answer follow-ups.

A note on tone: the *slides* are stylized (the "grimoire / warlock" theme). You don't have to perform it. Talk like yourself — explain what you built and why, plainly. The visuals carry the theme; you carry the substance.

---

## The one line to repeat

> "I'm not a game dev. I'd never used Phaser. I built this anyway — because the hard part of building shifted from writing code to deciding what's worth building."

Say a version of this near the start, in the middle, and at the end. Everything else supports it.

## Where to spend time

- The three beats that matter most: the **slop montage (slide 3)**, the **gamification good-vs-bad design argument (slides 5–7)**, and the **live demo (slide 8)**.
- The design decisions are on **slides 5–7** (what mechanics I used vs. avoided, and why) and **slides 10–12** (how it got built). Slow down there.
- Everything else: keep moving.

## Demo pre-flight (before you start)

- Dev server running, dungeon open in the tab you'll switch to (`public/dungeon/`, `npm run dev` → localhost:5173).
- Floor picked — use **The Tool-Smith** (matches the screenshot on slide 8).
- Numbers ready: **start 3 HP · wrong answer −1 HP · correct answer = 1 damage · first boss has 5 HP.**
- Plan to answer one wrong on purpose, so the HP drop is visible. Show the sprite changing at 1 HP.
- Check the slide 9 testimonials and the recorded demo image load — that's your fallback if live breaks.
- Notifications off; zoom the browser so the question text is readable from the back.

---

# Part 1 — The problem

## Slide 1 — Title

- State the title and subtitle: "a game, a workflow, a force multiplier."
- Read the dedication — it's the point of the talk: "for the engineers who think they can't ship anymore."
- One sentence on what's coming: "a real game I built to study for the Claude Architect exam, and an honest account of how."

*Explanation:* Set an easy, direct tone. The dedication tells the room this is about them being able to build things again, not about you. No need to oversell.

## Slide 2 — The hook

- "Ten weeks ago, Anthropic launched the CCA-F exam."
- Show of hands: "Who's studied for an AI cert recently?" Wait for it.
- Admit the personal bit: "I spent three weekends on Anthropic Academy before deciding I needed something different."

*Explanation:* This is a connection beat. The show of hands makes it interactive and earns attention for the next slide. The confession makes you relatable and explains why you went looking for prep material.

## Slide 3 — The slop montage

- Walk through four cert-prep sites: claudecertification.com, claudecert.com, claudecertprep.com, claudecertifications.com.
- Point out the repetition: "Same layout. Same five-bullet domain pages. Same three features — study guide, mock exam, domain practice."
- Include yourself: "I started here too. My notes looked like this. Maybe yours do."
- Land it: "It's Anthropic's exam guide, repackaged four ways. It works — but it's all the same thing."

*Explanation:* This is the problem statement, and your strongest visual. A new exam produced a wave of near-identical AI-generated prep sites. Naming your own generic notes keeps it as fair observation, not a cheap shot. It sets up the question: what would a genuinely different approach look like? Keep it matter-of-fact, not sarcastic.

---

# Part 2 — The game and its design

## Slide 4 — The game

- The turn: "So I built something different and called it Slay the Cert."
- The structure: "Five floors, one per exam domain, each with a themed boss."
- Name the floors: The Agentic Loop, The Tool's Hand, The Prompt's Edge, The Context Window, The Evaluation Court.

*Explanation:* The concept in one line: a Slay-the-Spire-style game where each exam domain is a boss fight. The in-game bosses are The Orchestrator (Agentic), The Compiler-King (Claude Code), The Grammarian (Prompt Engineering), The Tool-Smith (MCP/tools), and The Memory-Kraken (Context). Mechanics: start with 3 HP, wrong answer costs 1 HP, correct answer deals 1 damage, beat all five bosses to win. It's a real browser game built in Phaser 3 + TypeScript — not a mockup.

## Slide 5 — Gamification works (the evidence)

- The numbers: "d = 0.52 effect size, across 87 studies over two decades, 71% report positive results." (Gyedu et al. 2026)
- Frame it honestly: "That's a moderate effect — real, but not huge. The question isn't whether gamification works, it's how to do it without breaking it."

*Explanation:* This establishes that gamifying study was a deliberate, evidence-based choice, not a gimmick. The "without breaking it" line sets up the next slide, because done badly, gamification actively hurts learning. Memorize the three numbers — they're your credibility.

## Slide 6 — Gamification fails (the four traps)

- Four failure modes, with sources:
  - **Streak anxiety** — loss-aversion turns into a habit trap (Duolingo's own A/B data).
  - **Punishment outside play** — Habitica penalizing you during real life hurts engagement (Toda et al. 2018).
  - **Novelty decay** — most gamification effects fade in 4–8 weeks (Hamari et al. 2014).
  - **Optimizing the wrong thing** — chasing engagement metrics over learning; the numbers go up, the knowledge doesn't (Deci & Ryan 2000).
- Be honest about the gap: "There's no recent controlled study on cert-prep specifically — I'm leaning on corporate-training research as a proxy."

*Explanation:* This is the "what not to do" list. Stating it (and admitting the evidence gap) builds trust and sets up slide 7, where you show you avoided every one of these. Each failure here maps to a refusal there.

## Slide 7 — What I used and what I refused (the key design slide)

- Frame it: "Here's what I put in the game, and what I deliberately left out."
- **What I used:**
  - **Spell drops** — variable rewards, kept fresh by attaching new lore to each one.
  - **A collectible codex** — gives completionists something to chase without making the questions easier.
  - **Limited lifelines** (reveal one wrong answer, one skip per run) — help that never removes the actual thinking.
  - **Story as the reward** — you unlock lore by progressing, so learning and reward are the same action.
  - **Recall between floors** — an optional quick review; spaced repetition built into the flow.
  - **An end goal plus a replay mode**, with no permanent power carried between runs.
- **What I refused:** daily streaks · damage outside voluntary play · permanent upgrades between runs · paid currency or paywalls.
- The honest line: "Every one of those refused mechanics was in an early draft. The good version came from removing them."

*Explanation:* This is the core of the design story — spend the most time here. Every feature I kept maps to a learning principle; everything I cut maps directly to a failure from slide 6 (no streaks → no Duolingo anxiety; no out-of-game damage → no Habitica trap; no permanent upgrades → questions never get trivially easy; free → no incentive to optimize for engagement over learning). The rule underneath all of it: **a wrong answer always costs exactly 1 HP — no spell or upgrade ever softens that.** That's why none of the spells reveal answers or heal you; those would remove the learning, so they were cut. The takeaway worth saying out loud: the good design was mostly about restraint, not features.

## Slide 8 — Live demo

- "Let me show you the actual game." Switch to it.
- Narrate a boss fight (The Tool-Smith): read the question, answer one wrong on purpose so the HP drops, point out the sprite changing at low HP.
- Then answer correctly, land a hit, and say: "Every floor is a real exam domain."

*Explanation:* The demo is where people believe you. Keep it to 60–90 seconds and don't debug live. The deliberate wrong answer makes the stakes visible — that's the whole idea: a wrong answer costs you, so you actually engage. The sprite change at 1 HP is a small touch worth showing; it signals real polish. If live breaks, fall back to the recorded image/GIF on the next slides without missing a beat.

## Slide 9 — What people said

- Read two of the three real candidate quotes (e.g. "made prepping much more enjoyable" and "it helped me a lot, and I passed").
- The point: "None of this was study advice. They just played the game and learned."

*Explanation:* Outside proof that it works in practice, not just in theory. These are real CCA-F candidates from May 2026 (see `assets/testimonials.md`). It closes out the game section.

---

# Part 3 — How it got built

## Slide 10 — How I shipped this on weekends

- Show the folder: `docs/superpowers/` with `research/` (what's known), `specs/` (what we're building), `plans/` (how we'll build it).
- The thesis: "It wasn't 10x productivity. It was a workflow."
- Stay honest: "The specs folder has 19 files. Most were written before the code. Some after. I'm still figuring it out."

*Explanation:* The pivot from what to how. The claim is deliberately modest — not "AI made me superhuman," but "a repeatable workflow let a non-game-dev finish a real game in spare time." The research/specs/plans split is spec-driven development in practice: write down what's known, what you're building, and how, then build. The "some after" admission is honest and usually gets a laugh from anyone who's worked this way.

## Slide 11 — The loop: Brainstorm → Spec → Plan → Execute

- Walk the four steps: Brainstorm, Spec, Plan, Execute — each backed by a reusable Claude Code skill.
- Note the feedback loop back to the start — it's a cycle, not a straight line.
- Mention: "This deck was built the same way — and it took four passes to get right."
- Hand off: "My colleagues' talk goes deeper on the workflow; I'm just showing the shape."

*Explanation:* This is the engine behind slide 10. The point isn't the specific tool names — it's that each step is captured and reused, so the work compounds instead of starting from scratch each time. The "four passes" line is worth keeping: it wasn't one-shot, it took iteration. Keep this slide brief; you're deferring the deep workflow content to the other talk.

## Slide 12 — Three things I didn't expect to say

- Deliver the three lines with a pause between each: "I'm not a game dev." … "I'd never used Phaser." … "I built this anyway."
- Then: "I shouldn't have had time for this. The workflow is the reason I did."

*Explanation:* This is the payoff of the main message. Slow down and let each line land. The honesty — no game-dev background, no Phaser experience — is what makes it land for people who assume building a game is out of reach. The reframe: the value wasn't speed, it was being able to attempt something you'd otherwise skip.

---

# Part 4 — Close

## Slide 13 — What's your version of this?

- "Before you build yours, try mine." (Point to the QR / link.)
- The turn: "The hard part used to be writing the code. Now it's knowing what's worth building."
- End on the question and stop: "What would you build, if code was no longer the bottleneck?"

*Explanation:* The call to action: scan, play, then go build your own. Don't trail off — end on the question and let it sit. The "what's worth building" line is the closing point and ties back to the slop montage: there's plenty of generated sameness now; the scarce thing is judgment about what's worth making. Leave the QR up during Q&A.

## Slide 14 — References and thanks

- One line: "Sources and credits are here — the research is real, and the deck itself was built with the frontend-slides skill."
- Thank the room; take questions with the QR still up.

*Explanation:* The credibility close. Main sources: Gyedu et al. 2026 (gamification effect), StriveCloud 2024 (Duolingo streak data), Toda et al. 2018 (Habitica), Slay the Spire / MegaCrit and FromSoftware (design inspiration), and the frontend-slides skill (built the deck). No need to read them — just signal the work is grounded.

---

# Design decisions — what worked, what didn't, lessons

Your reservoir for the design questions and Q&A.

**The rule everything hangs on:** a wrong answer always costs exactly 1 HP — never reduced by any spell, upgrade, or mode. Every other decision follows from protecting the actual learning.

**What worked (and why):**
- **Spaced recall as a game beat** — turns one of the most effective study techniques into between-floor play.
- **Collecting without cheapening** — the codex and unlockable lore give you something to chase without making questions easier.
- **Help that keeps the thinking** — lifelines (reveal one wrong option, one skip per run) get you unstuck without skipping the learning.
- **One verified question bank behind everything** — 554 questions (bank v9), the same bank the practice and review tools use; every question tagged by domain, scenario, and source.

**What I refused (and the failure each would cause):**
- **Daily streaks** → Duolingo-style anxiety. Cut.
- **Damage outside voluntary play** → Habitica's "the game punishes your real life" trap. Play is opt-in.
- **Permanent upgrades between runs** → questions get trivially easy over time. Every run starts fresh.
- **Paid currency / paywall** → incentive to optimize for engagement over learning. Free, open assets only.
- The honest part: every one of these was in an early draft. The good design came from deleting them.

**Lessons worth stating:**
1. **Decide the non-negotiable rule first.** "Wrong always costs 1 HP" made every later feature decision easy: does it remove the learning? then cut it.
2. **Good gamification is mostly restraint.** The research is a list of traps; the design is the discipline to avoid them.
3. **A workflow beats raw speed.** Research → spec → plan → execute, captured and reused, is what let a non-specialist finish.
4. **It wasn't one-shot.** The deck took four passes; some specs were written after the code. Iteration is the method, not a failure of it.
5. **The real unlock was permission, not productivity.** AI made it worth attempting something I'd otherwise have skipped.
6. **The scarce skill moved** — from writing code to deciding what's worth building.

---

# Q&A — facts and likely questions

**Facts to have ready:**
- **Stack:** Phaser 3 (v3.90.0) + TypeScript + Vite; runs entirely in the browser, no server (state in localStorage).
- **Combat:** hero 3 HP · wrong −1 HP · correct = 1 damage · 3 spell slots per run · boss HP scales 5 (first run) → 7 (NG+) → 10 (NG++).
- **Five bosses:** The Orchestrator (Agentic), The Compiler-King (Claude Code), The Grammarian (Prompt Engineering), The Tool-Smith (MCP/tools), The Memory-Kraken (Context). Order shuffles each run.
- **Spells:** Echo (retake a prior question), Study the Tome (3-sentence primer, no answer), Memorize (flag for later review); NG+ adds Amplify (2× damage), NG++ adds Doubleshot (3× damage). None reveal answers or heal — on purpose.
- **Question bank:** `public/exams/cca-f/bank.json`, version 9, 554 questions, built 2026-04-22. Sources: 357 CertSafari import, 165 externally-authored, 20 model-generated, 12 official Anthropic samples.
- **Demo** was recorded with Playwright; testimonials are three real May-2026 candidates.

**Likely questions:**
- *"How long did it take?"* → Spare weekends, using a repeatable research → spec → plan → execute loop — not one big sprint. The deck alone took four passes.
- *"You're not a game dev — how?"* → That's the point. A clear spec plus the workflow did the heavy lifting; I made the design calls and reviewed the output.
- *"How do you trust the questions?"* → One verified bank, every question tagged by source, run through a verification pass before merging.
- *"Isn't gamifying study a gimmick?"* → The evidence says d=0.52 across 87 studies — real but easy to break. The work was avoiding the traps that break it.
- *"Why Phaser?"* → It gives you scenes, sprites, and a game loop out of the box with good docs — the right level for a turn-based game built by a non-specialist.
- *"Can I use it?"* → Yes, it's open — scan the QR, play it, and the approach works for any exam or body of knowledge.

---

## Accuracy note

Facts here come from the live deck text and the game source (`public/dungeon/src/config.ts`, `public/exams/cca-f/bank.json`). The poetic floor names on slide 4 don't map exactly one-to-one to the five bank domains, so if someone asks for a precise floor → boss → domain table, point them at the game rather than reciting one. Confirm the live HP/damage numbers once at rehearsal so you can narrate the demo with certainty.
