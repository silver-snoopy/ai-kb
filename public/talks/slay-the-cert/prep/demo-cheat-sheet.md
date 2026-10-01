# Slay the Cert — demo answer key

Launch the demo at `…/dungeon/?demo` (locked seed `1`, **real** question bank). The
run is fully deterministic and looks identical to a normal playthrough — full
spellbook, no demo badge. These are the correct answers in **pick order**, per boss.
It's a *representative* run: you can deliberately miss one for the teaching beat.

The boss order is fixed, Tool-Smith first.

| Floor | Boss | Answer key (pick order) |
|---|---|---|
| 1 | The Tool-Smith | `B → C → A → C → C → B → A` |
| 2 | The Orchestrator | `A → B → B → B → A → C → D` |
| 3 | The Compiler-King | `C → B → B → B → B → B → B` |
| 4 | The Grammarian | `A → B → D → B → C → C → B` |
| 5 | The Memory-Kraken | `C → C → C → B → C → B → D` |

You only need the first **5** correct per boss to win (5 boss HP, 1 damage per correct);
the remaining two cover any misses. The browser console also prints each fight's key as
it loads, e.g. `[demo] the-tool-smith: B → C → A → C → C → B → A`.

## Regenerating after a bank change

The key is derived from the live bank, so editing `public/exams/cca-f/bank.json` (which
feeds `public/dungeon/public/data/bank.json`) can change it. To regenerate, recreate the
throwaway preview spec at `public/dungeon/src/scenes/demoKey.preview.test.ts` (it reads
the bank and replays `demoRngForFloor(seed, floor)` over `DEMO_BOSS_ORDER`), run
`npx vitest run src/scenes/demoKey.preview.test.ts` from `public/dungeon/`, copy the
`SEED 1` block into the table above, then delete the spec again. Or simply open `?demo`
and read the `[demo]` lines from the console.
