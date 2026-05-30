# Boss-Fight HUD Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gather the top of the boss fight into a themed HUD bar — back-to-menu door + "Floor N/M · <domain>" on the left, icon-only SFX/BGM on the right — and move the boss name just beneath it.

**Architecture:** A new `src/ui/bossHud.ts` exposes two pure, unit-tested helpers (`darken`, `formatRunLabel`) and a Phaser composer `mountBossHud(scene, opts)` that draws the bar and reuses the existing `mountMenuButton` (door) and `mountAudioToggles` (now with an `iconOnly` option). `BossFightScene.create()` swaps its separate door/audio mounts for one `mountBossHud(...)` call.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest, Biome. Paths/commands relative to `public/dungeon/` unless noted.

**Source spec:** `docs/superpowers/specs/2026-05-30-boss-fight-hud-design.md`.

---

## Working directory & conventions

- Run `npx vitest` / `npx tsc` / `npm run dev` from `public/dungeon/`.
- **Lint:** the Biome binary lives in the **repo-root** node_modules. Lint changed files with
  `/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write <files>` (NOT
  `npx @biomejs/biome`, which pulls an incompatible 2.x). The CI command is `npm run lint`
  from the repo root `/Users/Daniel_Sallai/dev/ai-kb`. A prior PR went red purely on Biome
  formatting — never skip the lint step.
- Canvas is 960×720 (center x=480). The boss has `environmentColor` (hex int) and — after
  Task 2 — `domainShort`.

## File Structure

- **Create** `src/ui/bossHud.ts` — `darken`, `formatRunLabel` (Task 1), `mountBossHud` (Task 5).
- **Create** `src/ui/bossHud.test.ts` — unit tests for the pure helpers + a `domainShort` guard.
- **Modify** `src/types.ts` — add `domainShort` to `BossDefinition` (Task 2).
- **Modify** `src/config.ts` — add `domainShort` to each boss (Task 2).
- **Modify** `src/ui/audioToggles.ts` — `iconOnly` + `y` options (Task 3).
- **Modify** `src/ui/inFightNav.ts` — `mountMenuButton` optional position (Task 4).
- **Modify** `src/scenes/BossFightScene.ts` — mount the HUD; move the boss name (Task 6).

---

## Task 1: Pure helpers — `darken` + `formatRunLabel`

**Files:**
- Create: `src/ui/bossHud.ts`
- Test: `src/ui/bossHud.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/ui/bossHud.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { darken, formatRunLabel } from './bossHud';

describe('darken', () => {
  it('multiplies each channel and rounds', () => {
    // 0x4e=78 → 39 (0x27); 0x1b=27 → 14 (0x0e)
    expect(darken(0x4e4e1b, 0.5)).toBe(0x27270e);
  });
  it('factor 0 yields black', () => {
    expect(darken(0x4e4e1b, 0)).toBe(0x000000);
  });
  it('clamps channels at 255', () => {
    expect(darken(0xffffff, 2)).toBe(0xffffff);
  });
});

describe('formatRunLabel', () => {
  it('shows floor (1-indexed) / total and domain when a campaign exists', () => {
    const campaign = { floorsCleared: 0, bossOrder: ['a', 'b', 'c', 'd', 'e'] };
    expect(formatRunLabel(campaign, 'MCP')).toBe('Floor 1/5 · MCP');
  });
  it('uses the later floor number as the run advances', () => {
    const campaign = { floorsCleared: 3, bossOrder: ['a', 'b', 'c', 'd', 'e'] };
    expect(formatRunLabel(campaign, 'Context')).toBe('Floor 4/5 · Context');
  });
  it('falls back to just the domain when there is no campaign (debug/isolated)', () => {
    expect(formatRunLabel(undefined, 'MCP')).toBe('MCP');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/bossHud.test.ts`
Expected: FAIL — module/exports missing.

- [ ] **Step 3: Implement the helpers**

Create `src/ui/bossHud.ts`:

```typescript
/**
 * Multiply each RGB channel of a hex color by `factor` (clamped to 0–255).
 * factor < 1 darkens; used to derive the HUD bar shade from a boss's
 * environmentColor.
 */
export function darken(color: number, factor: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((color >> 16) & 0xff) * factor);
  const g = clamp(((color >> 8) & 0xff) * factor);
  const b = clamp((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/**
 * Left-side HUD run label. With a campaign: "Floor <n>/<total> · <domain>"
 * (n is 1-indexed). Without one (isolated/debug fight): just the domain.
 */
export function formatRunLabel(
  campaign: { floorsCleared: number; bossOrder: string[] } | undefined,
  domainShort: string,
): string {
  if (!campaign) return domainShort;
  return `Floor ${campaign.floorsCleared + 1}/${campaign.bossOrder.length} · ${domainShort}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/bossHud.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Lint + commit**

```bash
/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write src/ui/bossHud.ts src/ui/bossHud.test.ts
git add src/ui/bossHud.ts src/ui/bossHud.test.ts
git commit -m "feat(dungeon): darken + formatRunLabel helpers for boss HUD"
```

---

## Task 2: `domainShort` on every boss

**Files:**
- Modify: `src/types.ts` (the `BossDefinition` interface)
- Modify: `src/config.ts` (each of the 5 `BOSSES`)
- Test: `src/ui/bossHud.test.ts` (append a guard)

- [ ] **Step 1: Write the failing guard test**

Append to `src/ui/bossHud.test.ts` (add `BOSSES` to a new import line at the top):

```typescript
import { BOSSES } from '../config';

describe('boss domainShort', () => {
  it('every boss declares a non-empty domainShort', () => {
    for (const b of BOSSES) {
      expect(b.domainShort.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it — expect a TYPE/compile failure**

Run: `npx tsc --noEmit`
Expected: FAIL — `Property 'domainShort' does not exist on type 'BossDefinition'`.

- [ ] **Step 3: Add the field to the type**

In `src/types.ts`, add `domainShort` to `BossDefinition` (right after `domain`):

```typescript
export interface BossDefinition {
  id: string;
  name: string;
  domain: string;
  domainShort: string;
  theme: string;
  taunts: { correct: string[]; wrong: string[] };
  environmentColor: number; // hex for Phaser fillRect, etc.
}
```

- [ ] **Step 4: Add the value to each boss**

In `src/config.ts`, add a `domainShort` line immediately after the `domain:` line of each boss:

- `the-orchestrator` (`domain-1-agentic`): `    domainShort: 'Agentic',`
- `the-compiler-king` (`domain-2-claude-code`): `    domainShort: 'Claude Code',`
- `the-grammarian` (`domain-3-prompt-engineering`): `    domainShort: 'Prompting',`
- `the-tool-smith` (`domain-4-mcp`): `    domainShort: 'MCP',`
- `the-memory-kraken` (`domain-5-context`): `    domainShort: 'Context',`

- [ ] **Step 5: Verify type + test pass**

Run: `npx tsc --noEmit && npx vitest run src/ui/bossHud.test.ts`
Expected: `tsc` clean; tests PASS (now 7).

- [ ] **Step 6: Lint + commit**

```bash
/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write src/types.ts src/config.ts src/ui/bossHud.test.ts
git add src/types.ts src/config.ts src/ui/bossHud.test.ts
git commit -m "feat(dungeon): add domainShort to every boss"
```

---

## Task 3: `iconOnly` option on the audio toggles

**Files:**
- Modify: `src/ui/audioToggles.ts`

No unit test: `audioToggles` is Phaser + localStorage + registry coupled and currently
untested by design; the change is a rendering option verified manually (Task 6) and exercised
through `mountBossHud`. Keep the change minimal.

- [ ] **Step 1: Extend `MountOptions`**

In `src/ui/audioToggles.ts`, change the `MountOptions` interface to:

```typescript
interface MountOptions {
  onBgmToggle?: (muted: boolean) => void;
  /** Render glyph-only buttons (no "BGM"/"SFX" text), vertically centered. */
  iconOnly?: boolean;
  /** Vertical anchor for the buttons. Defaults to 18 (top-right corner). */
  y?: number;
}
```

- [ ] **Step 2: Honor the options in the mount body**

Inside `mountAudioToggles`, replace the `makeButton` definition, the two `*Label` functions,
and the two `makeButton(...)` calls (the block from `const makeButton = (x: number, ...` down
to `const sfx = makeButton(855, sfxLabel);`) with:

```typescript
  const iconOnly = opts.iconOnly === true;
  const y = opts.y ?? 18;

  const makeButton = (x: number, label: () => string): Phaser.GameObjects.Text => {
    const t = scene.add.text(x, y, label(), {
      fontSize: '14px',
      color: '#c0c0d0',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2a',
      padding: { x: iconOnly ? 5 : 8, y: 4 },
    });
    t.setOrigin(1, iconOnly ? 0.5 : 0);
    t.setInteractive({ useHandCursor: true });
    t.setScrollFactor(0);
    t.setDepth(1000);
    return t;
  };

  // '🔇' = 🔇 (muted), '🎵' = 🎵 (BGM), '🔊' = 🔊 (SFX).
  const label = (icon: string, name: string, muted: boolean): string => {
    const glyph = muted ? '🔇' : icon;
    return iconOnly ? glyph : `${glyph} ${name}`;
  };
  const bgmLabel = (): string => label('🎵', 'BGM', bgmMuted());
  const sfxLabel = (): string => label('🔊', 'SFX', sfxMuted());

  const bgm = makeButton(iconOnly ? 938 : 935, bgmLabel);
  const sfx = makeButton(iconOnly ? 904 : 855, sfxLabel);
```

(The rest of the function — the `bgm.on(...)`/`sfx.on(...)` handlers and the `return { bgm, sfx }` — is unchanged. The handlers already call `setText(bgmLabel())` / `setText(sfxLabel())`, so they pick up the icon-only labels automatically.)

- [ ] **Step 3: Verify nothing broke**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green (Hub still mounts the labeled version since it passes no `iconOnly`).

- [ ] **Step 4: Lint + commit**

```bash
/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write src/ui/audioToggles.ts
git add src/ui/audioToggles.ts
git commit -m "feat(dungeon): icon-only option for audio toggles"
```

---

## Task 4: Optional position for `mountMenuButton`

**Files:**
- Modify: `src/ui/inFightNav.ts`

- [ ] **Step 1: Add the optional position parameter**

In `src/ui/inFightNav.ts`, change the `mountMenuButton` signature and the `scene.add.image`
call so the door position is configurable (defaulting to today's `28,28`):

```typescript
export function mountMenuButton(
  scene: Phaser.Scene,
  onExit: () => void,
  position: { x: number; y: number } = { x: 28, y: 28 },
): void {
  const door = scene.add
    .image(position.x, position.y, 'td-tiles', DOOR_FRAME)
    .setScale(2)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  door.on('pointerover', () => door.setTint(0xffe070));
  door.on('pointerout', () => door.clearTint());
  door.on('pointerdown', onExit);
}
```

- [ ] **Step 2: Verify the existing test still passes**

Run: `npx vitest run src/ui/inFightNav.test.ts`
Expected: PASS — the existing test calls `mountMenuButton(scene, onExit)` (no position), so the default is used; the scene fake ignores coordinates.

- [ ] **Step 3: Lint + commit**

```bash
/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write src/ui/inFightNav.ts
git add src/ui/inFightNav.ts
git commit -m "feat(dungeon): mountMenuButton accepts an optional position"
```

---

## Task 5: `mountBossHud` composer

**Files:**
- Modify: `src/ui/bossHud.ts` (append the composer + its imports)

No new unit test: this is Phaser scene wiring (draws rects, delegates to `mountMenuButton` /
`mountAudioToggles`). Its pure inputs (`darken`, `formatRunLabel`) are covered in Task 1; the
composed result is verified manually in Task 6.

- [ ] **Step 1: Add imports at the top of `src/ui/bossHud.ts`**

Add above the existing `darken` export:

```typescript
import type Phaser from 'phaser';
import type { BossDefinition } from '../types';
import { mountAudioToggles } from './audioToggles';
import { mountMenuButton } from './inFightNav';

const BAR_HEIGHT = 44;
const BAR_DARKEN = 0.5; // bar fill = boss color × this; bottom border is lighter
```

- [ ] **Step 2: Append the composer at the end of `src/ui/bossHud.ts`**

```typescript
export interface BossHudOptions {
  boss: BossDefinition;
  campaign: { floorsCleared: number; bossOrder: string[] } | undefined;
  onExit: () => void;
  onBgmToggle: (muted: boolean) => void;
}

/**
 * Mount the boss-fight HUD: a themed top bar (darkened boss color) holding the
 * back-to-menu door + "Floor N/M · <domain>" on the left and icon-only
 * SFX/BGM on the right. Reuses mountMenuButton + mountAudioToggles so their
 * behavior/persistence is unchanged.
 */
export function mountBossHud(scene: Phaser.Scene, opts: BossHudOptions): void {
  const { boss, campaign, onExit, onBgmToggle } = opts;
  const midY = BAR_HEIGHT / 2;

  // Themed bar fill + a slightly lighter bottom border so it frames cleanly.
  scene.add
    .rectangle(480, midY, 960, BAR_HEIGHT, darken(boss.environmentColor, BAR_DARKEN))
    .setDepth(900);
  scene.add
    .rectangle(480, BAR_HEIGHT - 1, 960, 2, darken(boss.environmentColor, 0.9))
    .setDepth(901);

  // Left: door + run label.
  mountMenuButton(scene, onExit, { x: 28, y: midY });
  scene.add
    .text(64, midY, formatRunLabel(campaign, boss.domainShort), {
      fontSize: '14px',
      color: '#f5e4b3',
      fontFamily: 'monospace',
    })
    .setOrigin(0, 0.5)
    .setDepth(1000);

  // Right: icon-only SFX/BGM, vertically centered in the bar.
  mountAudioToggles(scene, { iconOnly: true, y: midY, onBgmToggle });
}
```

- [ ] **Step 3: Verify build + types + tests**

Run: `npx vitest run && npx tsc --noEmit && npm run build 2>&1 | grep -E "built in|error"`
Expected: all tests pass, `tsc` clean, build succeeds.

- [ ] **Step 4: Lint + commit**

```bash
/Users/Daniel_Sallai/dev/ai-kb/node_modules/.bin/biome check --write src/ui/bossHud.ts
git add src/ui/bossHud.ts
git commit -m "feat(dungeon): mountBossHud composer (bar + door + run label + audio)"
```

---

## Task 6: Wire the HUD into the boss fight + verify

**Files:**
- Modify: `src/scenes/BossFightScene.ts`

- [ ] **Step 1: Fix the imports**

In `src/scenes/BossFightScene.ts`:
- Change line 28 from `import { REGISTRY_BGM_MUTED, mountAudioToggles } from '../ui/audioToggles';` to `import { REGISTRY_BGM_MUTED } from '../ui/audioToggles';` (keep `REGISTRY_BGM_MUTED` — it's still used at the BGM-start guard ~line 398; drop `mountAudioToggles`).
- Delete the line `import { mountMenuButton } from '../ui/inFightNav';`.
- Add `import { mountBossHud } from '../ui/bossHud';` among the `../ui/*` imports.

- [ ] **Step 2: Move the boss name below the bar**

Find the "Boss name at top center" block and change the y from `30` to `66`:

```typescript
    // Boss name — sits just below the HUD bar (bar occupies y 0–44).
    this.add
      .text(480, 66, this.boss.name, {
        fontSize: '24px',
        color: '#f5e4b3',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
```

- [ ] **Step 3: Replace the two mounts with `mountBossHud`**

Replace the whole block from the `// Mute toggles (top-right).` comment through the
`mountMenuButton(this, () => this.exitToHub());` line (the `mountAudioToggles(this, {...});`
call and the `// Back-to-menu control …` comment + `mountMenuButton(...)` call) with:

```typescript
    // Top HUD bar: themed strip with the back-to-menu door + "Floor N/M ·
    // <domain>" on the left and icon-only SFX/BGM on the right. onBgmToggle
    // starts/stops our procedural BGM; SFX mute flows through Phaser's sound
    // manager automatically.
    mountBossHud(this, {
      boss: this.boss,
      campaign: this.registry.get('campaign') as Campaign | undefined,
      onExit: () => this.exitToHub(),
      onBgmToggle: (muted) => {
        if (muted) this.bgm.stop();
        else this.bgm.start(this.boss.id, this.sound as unknown as { context?: AudioContext });
      },
    });
```

(`Campaign` is already imported in this file: `import type { Campaign } from '../game/dungeon';`.)

- [ ] **Step 4: Verify build + types + full suite**

Run: `npx vitest run && npx tsc --noEmit && npm run build 2>&1 | grep -E "built in|error"`
Expected: all green. `tsc` must show no unused-import error for `mountAudioToggles`/`mountMenuButton` (both removed from this file).

- [ ] **Step 5: CI-parity lint (repo root)**

Run (from `/Users/Daniel_Sallai/dev/ai-kb`): `npm run lint`
Expected: `Checked N files … No fixes applied.`, exit 0. If anything flags, run `npm run lint:fix`, re-verify, and amend.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/BossFightScene.ts
git commit -m "feat(dungeon): mount boss HUD bar; move boss name below it"
```

- [ ] **Step 7: Manual verification in the browser**

Run `npm run dev`, open the URL, start a real run, enter a boss fight, and confirm:
- A bar spans the top in a darker, boss-themed tone with a subtle bottom border.
- Left: the door, then `Floor 1/5 · <domain>` (correct floor number and domain short).
- Right: SFX + BGM as **icons only**; clicking each still mutes and the state persists across a reload.
- The boss name sits just below the bar, not overlapping it or the question bubble.
- Advance a floor (beat a boss) → the floor number increments on the next fight.
- A `?demo` run shows the bar/label correctly; a debug-isolated boss preview shows just the domain (no "Floor") and doesn't crash.
- Check ≥2 different bosses for color cohesion (e.g. Tool-Smith vs Memory-Kraken). If the bar reads too dark/muddy, bump `BAR_DARKEN` in `bossHud.ts` (one number) and re-check.

- [ ] **Step 8: No commit** (verification only). Record the manual result in the PR description.

---

## Self-review notes (for the implementer)

- Tasks 1–4 are prerequisites for Task 5 (`mountBossHud` uses `darken`, `formatRunLabel`,
  `boss.domainShort`, the audio `iconOnly` option, and the door position arg). Do them in order.
- Depths: bar `900`, border `901`, all interactive contents `1000` — keep the door/label/audio
  above the bar.
- Don't reintroduce a `mountAudioToggles` or `mountMenuButton` call directly in
  `BossFightScene` — they're composed inside `mountBossHud` now. But keep the
  `REGISTRY_BGM_MUTED` import (BGM-start guard still uses it).
- Pixel positions (x=64 label, x=904/938 audio, y=66 boss name) are starting values; nudge
  them during Step 7 if spacing looks off — they don't affect tests.
