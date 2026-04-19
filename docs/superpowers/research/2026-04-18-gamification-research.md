# Gamification Research — AI Cert KB Game Layer

**Date:** 2026-04-18
**Purpose:** Inform the design of a 16-bit dungeon-crawler w/ Souls-like turn-based combat layered on the AI Cert KB (Claude Certified Architect — Foundations, deadline end of May 2026).

## 1. Similar games + lessons learned

- **Quiz RPG: Mystic Wiz** (Colopl 2013, intl. shut down 2017). 5-card party, trivia gates attacks, elemental advantage multiplies damage. **Lesson:** correctness-driven damage is "really quite addictive" per reviewers, but biased/US-slanted question pools break immersion. *Move:* pull questions from the KB so every hit is exam-relevant.
- **The Typing of the Dead** (Sega 1999). Keyboard replaces light-gun; type the word on the zombie. **Lesson:** 120k+ PC sales and a full edu spin-off line (English of the Dead) prove absurd theme + mechanical drill works. *Move:* lean into warlock/dungeon tone, don't apologize.
- **Habitica** (2013–). Missed todos damage your char. **Lesson:** gamified apps show 67% week-4 abandonment vs 38% non-gamified; Habitica specifically punishes users during productive-but-not-logged time. *Move:* never penalize for not playing; damage only inside a voluntary run.
- **Duolingo**. 5-heart lives, streaks, XP. Streak-users 3.5x more likely to continue; built on Kahneman/Tversky loss aversion. **Lesson:** scarcity > abundance, but streak anxiety is a real dark pattern. *Move:* 3 HP per run mirrors the scarcity; skip daily streak entirely.
- **Slay the Spire** (MegaCrit 2019). Turn-based deckbuilder, Souls-flavored bosses, telemetry-balanced. **Lesson:** skilled players hit 90%+ base-winrate — difficulty must feel fair, not random. *Move:* weight questions toward prior failures (SM-2-lite).
- **Quiz Crawler** (quizcrawler.com). Multiplayer card dungeon-crawler with trivia-gated combat. **Lesson:** closest living prior art; validates the combination as a *game*, not a worksheet.
- **Anki plugins** — *Ankimon*, *Anki-Dragons* (100+ levels, made by an MD for ADHD), *Fanfare*, *Anki Farm Tycoon*. **Lesson:** the Anki community has already proven "RPG skin over SRS" ships as solo-dev work and finds users.

## 2. "Souls-like" as learning metaphor

Beyond "hard," Souls-like means **deliberate pacing, learn-from-death, shortcut-unlock progression, and lore-through-item-description** (Miyazaki: "I like for people to discover the world themselves"). Bosses teach mechanics through the fight itself — each is a skill gate with a unique gimmick. No formal pedagogical literature maps Souls-like to education (search returned zero), but the structural fit is strong: boss = topic checkpoint, death = low-stakes retry, shortcuts = easier re-runs once earlier material is mastered. Translate "item descriptions" into lore-flavored exam facts on pickups — a Claude-API fact dressed as a scroll.

## 3. 16-bit visual conventions

SNES-era RPGs (Chrono Trigger, FF VI, Secret of Mana, A Link to the Past) share: 16x16 or 32x32 tile grids, 3/4 top-down perspective, menu-driven battle UI at screen bottom with HP bars top-left, party portraits, and limited (15–32 color) palettes. Turn-based combat typically uses side-on battle screens with actor sprites on the right, enemies on the left, a command menu docked bottom-left. Assets:

- [Kenney.nl](https://kenney.nl/) — thousands of CC0 packs incl. "1-Bit Pack," "Tiny Dungeon," "RPG Urban."
- [OpenGameArt CC0/OGA-BY pixel art](https://opengameart.org/content/cc0oga-by-pixel-art)
- [itch.io free game assets tag](https://itch.io/game-assets/free) — many CC0 SNES-style tilesets.
- [PixelRPG/excalibur-version](https://github.com/PixelRPG/excalibur-version) — SNES-style reference project.

## 4. Free chiptune music + SFX sources

- [OpenGameArt — CC0 Chiptunes](https://opengameart.org/content/cc0-chiptunes) — CC0, no attribution required.
- [OpenGameArt — CC0 8-bit Chiptune collection](https://opengameart.org/content/audio-cc0-8bit-chiptune) — CC0.
- [OpenGameArt — Audio, Commercial Use OK](https://opengameart.org/content/audio-commercial-use-ok) — mixed CC0/CC-BY/CC-BY-SA; **check each entry** — CC-BY-SA would viralize our repo license.
- [512 Sound Effects (8-bit style)](https://opengameart.org/content/512-sound-effects-8-bit-style) — CC0.
- [FREE Action Chiptune Music Pack "surpass your limits!"](https://opengameart.org/content/free-action-chiptune-music-pack) — 13 tracks, 20+ min, looping.
- [Kenney audio packs](https://kenney.nl/assets/category:Audio) — CC0.
- **Flag:** avoid any track under CC-BY-SA unless we're ready to share-alike the whole game; prefer CC0 or CC-BY with attribution in `CREDITS.md`.

## 5. Game engines — recommendation table

| Engine | License | Curve | Fit | Pick? |
|---|---|---|---|---|
| **Phaser 3** | MIT | Moderate | Mature, many RPG templates, ~500KB, well-documented Pages deploy | **Yes — primary** |
| RPG.js v5 beta | MIT | Low for RPGs; Tiled built-in | TS-first, but small community (~1.5k stars), v5 beta | Backup |
| Excalibur.js | BSD-2 | Moderate | TS-native, ECS, ~300KB — "not different enough from Phaser" | No |
| PixiJS | MIT | Higher | Renderer only; you build game logic | No |
| Kaplay/Kaboom | MIT | Very low | Weak for menu-heavy turn-based RPG | No |
| Bitsy | MIT | Trivial | No combat UI | No |
| PICO-8 | $15 | Low | Paid, hard to embed in Pages | No |

**Recommendation: Phaser 3 + TypeScript + Vite** in a subfolder of the Quartz site. Largest community (fastest LLM/SO help), proven Pages workflow (see [phaser3-parcel-typescript template](https://github.com/tweenn/phaser3-parcel-typescript)), TS matches existing stack. Budget ~3–4 days for combat-loop prototype, ~1 week for full MVP.

## 6. Feasibility on top of KB stack

**Hosting:** Quartz v4 emits to `public/`. Add a sibling Vite build outputting to `public/dungeon/` — GitHub Pages then serves the game at `/ai-kb/dungeon/`. Set Vite `base: '/ai-kb/dungeon/'`. One repo, one deploy.

**Question pipeline:** add `build-questions.mjs` next to `dashboard.mjs`; walk Obsidian notes, extract fenced ` ```question ` blocks with front-matter (`topic`, `difficulty`, `answer`, `distractors`, `lore`), emit `questions.json`. Anki `.apkg`/`.txt` exports ingest the same way. Obsidian-mcp authors interactively; Claude generates distractors from note bodies. Boss = topic cluster; each layer loads a filtered slice.

**State:** `localStorage` for run + unlocks (≤5MB is ample). Don't commit saves to git — merge hell. Offer a "Export run" button dumping JSON to a gist for cross-device. "Markdown → browser game" is not a mature community pattern; closest analog is Obsidian Spaced Repetition + Anki exports — keep the build simple.

## 7. Design pitfalls to avoid

- **Pointification / shallow gamification** — points/badges show novelty-effect decay. *Fix:* tie lore to real cert content, not just XP.
- **Punishment during productive time** (Habitica failure mode). *Fix:* no daily damage, no streak-break; damage only inside a voluntary run.
- **Distraction over substance** — 6-week deadline is tight. *Fix:* timebox MVP to "one dungeon, one boss, 30 questions."
- **Difficulty spikes kill motivation.** *Fix:* on game-over, surface missed facts as a mini-review — failing feels like a free flashcard session.
- **Streak anxiety** (Duolingo dark pattern). *Fix:* no global streak; cosmetic-only "consecutive clears."
- **Optimizing for score, not retention.** *Fix:* weight questions toward prior failures — the game must want you to face weak spots.
- **Upgrade power-creep** trivializing questions. *Fix:* boss drops grant *study aids* (reveal a distractor, one skip/run), never raw HP.

## Sources

- [Mystic Wiz](https://en.wikipedia.org/wiki/Quiz_RPG:_The_World_of_Mystic_Wiz) · [review](https://jayisgames.com/review/quiz-rpg-world-of-mystic-wiz.php)
- [Typing of the Dead](https://en.wikipedia.org/wiki/The_Typing_of_the_Dead)
- [Habitica case study](https://trophy.so/blog/habitica-gamification-case-study) · [counterproductive effects paper](https://www.researchgate.net/publication/327451529_Counterproductive_effects_of_gamification_An_analysis_on_the_example_of_the_gamified_task_manager_Habitica)
- [Duolingo streak research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) · [streak psychology](https://www.justanotherpm.com/blog/the-psychology-behind-duolingos-streak-feature)
- [Slay the Spire balance](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)
- [Quiz Crawler](https://www.quizcrawler.com/)
- [Anki gamification plugins](https://www.polyglossic.com/top-three-gamification-plugins-for-anki/) · [Anki-Dragons](https://anki-dragons.com/) · [Fanfare](https://github.com/abdnh/anki-fanfare)
- [Miyazaki on bosses](https://www.gamedeveloper.com/design/-i-dark-souls-i-director-miyazaki-offers-his-philosophy-on-boss-design) · [FromSoft environmental storytelling](https://lokeysouls.com/2020/11/16/environmental-storytelling/)
- [Gamification novelty-effect study](https://link.springer.com/article/10.1186/s41239-021-00314-6) · [pointification critique](https://www.xtremepush.com/blog/gamification-mistakes-point-systems-fail) · [meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC10591086/)
- [Phaser vs Kaplay vs Excalibur](https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework) · [3-frameworks review](https://jslegenddev.substack.com/p/i-tried-3-web-game-frameworks-so)
- [RPG-JS](https://github.com/RSamaium/RPG-JS) · [rpgjs.dev](https://rpgjs.dev/) · [PixelRPG SNES template](https://github.com/PixelRPG/excalibur-version) · [Phaser+Parcel+TS+Pages template](https://github.com/tweenn/phaser3-parcel-typescript)
- [Kenney.nl](https://kenney.nl/) · [OGA CC0 chiptunes](https://opengameart.org/content/cc0-chiptunes) · [OGA 512 8-bit SFX](https://opengameart.org/content/512-sound-effects-8-bit-style) · [OGA CC0 pixel art](https://opengameart.org/content/cc0oga-by-pixel-art)
