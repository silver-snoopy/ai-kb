# Slay the Cert

A study game for the **Claude Certified Architect — Foundations (CCA-F)** exam, built in **Phaser 3 + TypeScript**. It lives at `public/dungeon/` and is one of the three CCA-F study surfaces in this vault, alongside `public/practice/` and `public/review/`.

## Summary

**Genre:** a quiz-driven **roguelike** — explicitly modeled on the deckbuilder *Slay the Spire* (hence the name), with FromSoftware boss-rush flavor. Instead of playing cards, you answer exam questions; each of the five CCA-F exam domains is a **boss fight**.

The CCA-F twist on the formula: the question bank *is* the combat system. You start with 3 HP, a wrong answer costs 1 HP, a correct answer deals 1 damage, and you win a run by beating all five domain bosses. It turns spaced exam review into a roguelike campaign — complete with New Game+ tiers, unlockable spells, and a weakness-queue loop that feeds missed questions back into your study.

The five bosses, each guarding one domain (`src/config.ts`):

| Boss | Domain |
|---|---|
| The Orchestrator | Domain 1 — Agentic |
| The Compiler-King | Domain 2 — Claude Code |
| The Grammarian | Domain 3 — Prompt Engineering |
| The Tool-Smith | Domain 4 — MCP / tools |
| The Memory-Kraken | Domain 5 — Context |

Boss order is shuffled per run via a seeded RNG (`src/game/dungeon.ts`).

## Combat system (game rules)

A run is a campaign across five floors — one boss per floor. Each boss fight is a sequence of multiple-choice questions (four options, A–D) drawn from that boss's domain.

**Core loop** (`src/game/combat.ts`):

- **Hero HP** starts at **3** (`HERO_MAX_HP`) and persists across the whole run — damage carries from floor to floor.
- **Correct answer** → you deal damage to the boss equal to your current damage multiplier (normally **1**).
- **Wrong answer** → you lose exactly **1 HP**. This is a hard invariant (`HP_COST_PER_WRONG`, "INVARIANT R6") — no spell or modifier ever changes it.
- **Boss defeated** when its HP reaches 0 → advance to the next floor.
- **Hero dies** when HP reaches 0 → run over.
- **Victory** when all five bosses are defeated (`isCampaignComplete`).

**Boss HP scales with the run mode** (`BOSS_HP` in `src/config.ts`):

| Mode | Boss HP |
|---|---|
| First run | 5 |
| NG+ | 7 |
| NG++ | 10 |
| NG+++ | 10 |

**Spellbook.** You carry a loadout of up to **3** spell slots (`SPELLBOOK_SIZE`). Spells are one-shot, consumed on use, and unlock as you progress through New Game+ tiers (`src/game/spellbook.ts`, `src/config.ts`):

| Spell | Tier | Effect | Unlocked in |
|---|---|---|---|
| **Echo** | uncommon | Next question is a retake of an earlier question from this fight | First run |
| **Study the Tome** | uncommon | Reveal a 3-sentence primer from the source note before the next question (context only — no answer) | First run |
| **Memorize** | rare | No combat effect; flags the current question for the weakness queue | First run |
| **Amplify** | common | Next correct answer deals 2 damage | NG+ |
| **Doubleshot** | rare | Next correct answer deals 3 damage | NG++ |

A damage multiplier (from Amplify / Doubleshot) is consumed on the *next* submission whether you get it right or wrong, so timing matters.

**Progression.** Run modes form a New Game+ ladder — `first-run` → `ng-plus` → `ng-plus-plus` → `ng-plus-plus-plus` — raising boss HP and widening the spell pool. Campaign progress, hero HP, spellbook charges, unlocked spells, and bosses-ever-defeated persist in `localStorage` (`SaveStateV1` in `src/types.ts`).

**Study loop.** Wrong answers are surfaced in a post-fight mistakes review, and the full session can be exported as a JSON log (`src/game/sessionExport.ts`) that `/ingest-session` folds back into the vault's weakness queue — closing the study loop.

## Running locally

```bash
cd public/dungeon
npm install
npm run dev    # Vite dev server
npm test       # vitest
npm run build  # production bundle
```

Question content comes from the unified bank at `public/exams/cca-f/bank.json`. The game fetches it at `./data/bank.json` (`src/data/questionLoader.ts`, `src/scenes/BootScene.ts`): a committed copy lives at `public/data/bank.json` for local dev, and CI overlays the production bank over that path. A trimmed `public/data/demo-questions.json` backs the in-game demo mode.
