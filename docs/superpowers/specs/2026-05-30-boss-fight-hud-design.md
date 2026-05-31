# Boss-Fight HUD Bar — design

**Date:** 2026-05-30
**Status:** draft — awaiting user review
**Context:** Slay the Cert dungeon game (`public/dungeon/`).

## Problem

The top of the boss fight is a loose scatter: the boss name floats at y=30, the
back-to-menu door sits free at (28,28), and the audio toggles float top-right as
text+emoji buttons. There's no run context (which floor, which domain). This feature
gathers the top into a single **HUD bar** — a themed strip holding the door, run progress,
and audio controls — and moves the boss name just beneath it.

Canvas is 960×720 (center x=480).

## Design

### The bar

A full-width strip across the top: a rectangle `(480, 22)` sized `960×44`, filled with a
**darkened shade of the active boss's `environmentColor`** (RGB × ~0.5), plus a subtle 2px
bottom border (a slightly lighter shade) at y≈43 so it frames rather than distracts. The
bar renders at depth 900; all its contents at depth 1000. Per-boss this reads as a cohesive
extension of the scene (Tool-Smith forge `0x4e4e1b`, Memory-Kraken depths `0x1b2d4e`, etc.).

### Left cluster

- **Door** — the existing `mountMenuButton`, unchanged in behavior, nudged to the bar's
  vertical center (~`(28, 22)`). `mountMenuButton` gains an optional `{ x, y }` position
  (defaulting to today's `28,28`) so the HUD can place it.
- **Run label** — `Floor 1/5 · MCP` at ~`(64, 22)`, origin `(0, 0.5)`, monospace, parchment
  tone (`#f5e4b3`). Floor = `floorsCleared + 1` / `bossOrder.length`. In isolated/debug
  fights there is no campaign, so the label gracefully drops the floor part and shows just
  the domain short (e.g. `MCP`).

### Right cluster

The **same** audio toggles, **icon-only**. `mountAudioToggles` gains an `iconOnly?: boolean`
(and a `y?` anchor) option: when set, the buttons render just the glyph (🎵/🔇 for BGM,
🔊/🔇 for SFX) with no "BGM"/"SFX" text, right-aligned inside the bar (~`bgm x=938`,
`sfx x=904`, vertically centered). All mute-state, registry, `sound.mute` sync, persistence,
and `onBgmToggle` logic is reused unchanged — the Hub keeps its labeled version (no
`iconOnly`).

### Boss name

Moves from `(480, 30)` to just below the bar at ~`(480, 66)`, same 24px parchment style,
still centered above the question bubble (bubble body starts ~y=130).

### Structure

A new `src/ui/bossHud.ts` exporting `mountBossHud(scene, opts)` composes the whole strip:
the bar rect + border, `mountMenuButton` (door), the run label, and `mountAudioToggles`
(icon-only). `BossFightScene.create()` replaces its separate `mountMenuButton` and
`mountAudioToggles` calls with a single `mountBossHud(...)`, and moves the boss-name text
down.

```
mountBossHud(scene, {
  boss,            // BossDefinition — for environmentColor + domainShort
  campaign,        // Campaign | undefined (from registry) — for the floor label
  onExit,          // () => void  → BossFightScene.exitToHub
  onBgmToggle,     // (muted: boolean) => void  → start/stop ProceduralBGM
}): void
```

### Pure seams (unit-tested)

Two pure helpers fall out and are unit-tested (no Phaser):

- `darken(color: number, factor: number): number` — channel-wise multiply with 0–255 clamp.
  Lives in `bossHud.ts`.
  ```ts
  export function darken(color: number, factor: number): number {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    const r = clamp(((color >> 16) & 0xff) * factor);
    const g = clamp(((color >> 8) & 0xff) * factor);
    const b = clamp((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }
  ```
- `formatRunLabel(campaign, domainShort): string` — the with/without-campaign branch.
  ```ts
  export function formatRunLabel(
    campaign: { floorsCleared: number; bossOrder: string[] } | undefined,
    domainShort: string,
  ): string {
    if (!campaign) return domainShort;
    return `Floor ${campaign.floorsCleared + 1}/${campaign.bossOrder.length} · ${domainShort}`;
  }
  ```

### Data: `domainShort`

Add `domainShort: string` to the `BossDefinition` interface (`src/types.ts`) and to each of
the five bosses in `src/config.ts`:

| boss | domain | domainShort |
|---|---|---|
| the-orchestrator | domain-1-agentic | `Agentic` |
| the-compiler-king | domain-2-claude-code | `Claude Code` |
| the-grammarian | domain-3-prompt-engineering | `Prompting` |
| the-tool-smith | domain-4-mcp | `MCP` |
| the-memory-kraken | domain-5-context | `Context` |

## Scope / non-goals

- **In:** the HUD bar (themed strip), run label (floor + domain short), icon-only audio
  reuse, boss-name reposition, `domainShort` data, the `bossHud.ts` composer, and the two
  pure helpers.
- **Out:** hero/boss HP readouts (they stay where they are, near the sprites); a settings
  menu; any change to audio behavior or persistence; animating the bar; touching the Hub's
  audio toggles.

## Files touched

- **Create** `src/ui/bossHud.ts` — `mountBossHud`, `darken`, `formatRunLabel`.
- **Create** `src/ui/bossHud.test.ts` — unit tests for `darken` + `formatRunLabel`.
- **Modify** `src/ui/audioToggles.ts` — add `iconOnly?: boolean` + `y?: number` options.
- **Modify** `src/ui/inFightNav.ts` — `mountMenuButton` accepts optional `{ x, y }`.
- **Modify** `src/types.ts` — `domainShort` on `BossDefinition`.
- **Modify** `src/config.ts` — `domainShort` on each boss.
- **Modify** `src/scenes/BossFightScene.ts` — call `mountBossHud(...)` (replacing the
  separate door + audio mounts); move the boss-name text below the bar.

## Testing

- **Unit:** `darken` (e.g. `darken(0x4e4e1b, 0.5) === 0x27270e`; clamps; `factor 0` → black)
  and `formatRunLabel` (with a 5-boss campaign at floor 0 → `"Floor 1/5 · MCP"`; `undefined`
  campaign → `"MCP"`).
- **Unit (light):** `mountMenuButton`'s existing click test still passes with the new
  optional position arg.
- **Manual:** in a real run, the bar spans the top in a darker boss-themed tone; door +
  `Floor N/5 · <domain>` on the left, icon-only SFX/BGM on the right (toggles still mute and
  persist); boss name sits just below the bar; no overlap with the question bubble. Check a
  couple of bosses for color cohesion, and a `?demo`/debug-isolated fight for the no-floor
  fallback. Tune final pixel positions against the running dev server.

## Branch / merge plan

Standalone feature on `feat/boss-hud` off `main`. Its own PR.
