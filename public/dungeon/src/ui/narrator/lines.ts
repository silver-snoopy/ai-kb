import type { NarratorLine } from './types';

export const NARRATOR_LINES: readonly NarratorLine[] = [
  // — Orchestrator (5 lines) —
  { trigger: 'battle-start', bossId: 'the-orchestrator',
    text: 'The orchestrator raises his baton. The hall falls silent, and so must you.' },
  { trigger: 'phase-66', bossId: 'the-orchestrator',
    text: 'A tremor runs through the symphony. One section has gone out of tune.' },
  { trigger: 'phase-33', bossId: 'the-orchestrator',
    text: 'The conductor loses the thread. His composition begins to fray.' },
  { trigger: 'phase-10', bossId: 'the-orchestrator',
    text: 'The baton trembles in a hand that once held every note.' },
  { trigger: 'boss-defeated', bossId: 'the-orchestrator',
    text: 'The final measure resolves in silence. The orchestrator bows, and is gone.' },

  // — Compiler-King (5 lines) —
  { trigger: 'battle-start', bossId: 'the-compiler-king',
    text: 'The forge-king hammers iron into argument. The heat rises.' },
  { trigger: 'phase-66', bossId: 'the-compiler-king',
    text: 'One rivet holds where two were needed. The structure whispers its weakness.' },
  { trigger: 'phase-33', bossId: 'the-compiler-king',
    text: 'A crack runs the length of his great anvil. He hears it, and does not look.' },
  { trigger: 'phase-10', bossId: 'the-compiler-king',
    text: 'The furnace cools. The king knows cold iron like he knows his own hands.' },
  { trigger: 'boss-defeated', bossId: 'the-compiler-king',
    text: 'The last spark leaves the forge. The iron remembers only the shape it held.' },

  // — Grammarian (5 lines) —
  { trigger: 'battle-start', bossId: 'the-grammarian',
    text: 'The grammarian opens the codex. Every word waits to be weighed.' },
  { trigger: 'phase-66', bossId: 'the-grammarian',
    text: 'A sentence goes unparsed. She reaches for it, and finds only silence.' },
  { trigger: 'phase-33', bossId: 'the-grammarian',
    text: 'The margins of her codex begin to burn. She does not put them out.' },
  { trigger: 'phase-10', bossId: 'the-grammarian',
    text: 'The grammarian speaks in half-lines now. The other halves are missing.' },
  { trigger: 'boss-defeated', bossId: 'the-grammarian',
    text: 'The codex closes. The last word in it is one she could not finish.' },

  // — Tool-Smith (5 lines) —
  { trigger: 'battle-start', bossId: 'the-tool-smith',
    text: 'The tool-smith lays out his instruments. Each has been used before.' },
  { trigger: 'phase-66', bossId: 'the-tool-smith',
    text: 'A file slips from his grasp. It is the one he trusted most.' },
  { trigger: 'phase-33', bossId: 'the-tool-smith',
    text: 'His bench is scattered. He cannot find the tool he needs, and blames no one.' },
  { trigger: 'phase-10', bossId: 'the-tool-smith',
    text: 'The tool-smith reaches for a hammer that is no longer there.' },
  { trigger: 'boss-defeated', bossId: 'the-tool-smith',
    text: 'The instruments rest where they fell. None will be used again.' },

  // — Memory-Kraken (5 lines) —
  { trigger: 'battle-start', bossId: 'the-memory-kraken',
    text: 'Something vast surfaces. It has been remembering, and resents the intrusion.' },
  { trigger: 'phase-66', bossId: 'the-memory-kraken',
    text: 'A tendril sinks. The chamber fills another inch with cold water.' },
  { trigger: 'phase-33', bossId: 'the-memory-kraken',
    text: 'The kraken forgets itself in pieces. Each piece is still dangerous.' },
  { trigger: 'phase-10', bossId: 'the-memory-kraken',
    text: 'Depth abandons it. What rises to the surface is already dissolving.' },
  { trigger: 'boss-defeated', bossId: 'the-memory-kraken',
    text: 'The waters still. What the kraken knew returns to whoever can hold it.' },

  // — Generic pool: spell-cast (4 lines) —
  { trigger: 'spell-cast',
    text: "The warlock's focus sharpens. Something old rises to her aid." },
  { trigger: 'spell-cast',
    text: 'An answer she did not know she knew arrives unbidden.' },
  { trigger: 'spell-cast',
    text: 'The spellbook remembers for her. She lets it.' },
  { trigger: 'spell-cast',
    text: 'A quiet word. A certainty that was not there before.' },

  // — Generic pool: hero-defeated (3 lines) —
  { trigger: 'hero-defeated',
    text: 'The candidate falters. The chamber claims another to its long silence.' },
  { trigger: 'hero-defeated',
    text: 'A final wrong note. The hall darkens, and the warlock is gone with it.' },
  { trigger: 'hero-defeated',
    text: 'She came to answer, and found a question she could not.' },

  // — Generic filler (8 lines — used for pool-exhaustion fallback) —
  { trigger: 'filler', text: 'The chamber holds its breath.' },
  { trigger: 'filler', text: 'Torches gutter. Nothing has changed, and everything has.' },
  { trigger: 'filler', text: 'A stone dislodges somewhere far above. It does not fall.' },
  { trigger: 'filler', text: 'The warlock steadies herself, and listens.' },
  { trigger: 'filler', text: 'The boss measures her, and is measured in turn.' },
  { trigger: 'filler', text: 'Silence presses against the walls like water.' },
  { trigger: 'filler', text: 'A lesson shifts its weight, waiting to be taken.' },
  { trigger: 'filler', text: 'The duel resumes, as all duels do.' },
] as const;
