# In-Fight Navigation — Phase 1 (Back-to-Menu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small "Menu" exit control (door icon + label) to the boss fight that saves mid-fight progress and returns to the Hub, where the existing "Continue (mid-fight)" resumes the fight.

**Architecture:** A tiny presentation helper `mountMenuButton(scene, onExit)` (unit-tested with minimal Phaser fakes, matching the existing `optionFeedback.test.ts` style) renders the control; `BossFightScene.exitToHub()` flushes the resumable save via the existing `writeSave()` and transitions to the Hub. No new save/resume machinery — Phase 1 leans entirely on the mid-fight save that already exists.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest, Biome (lint). All paths/commands are relative to `public/dungeon/` unless noted.

**Source spec:** `docs/superpowers/specs/2026-05-30-in-fight-navigation-design.md` (Phase 1 only; Phase 2 — the in-fight Codex overlay — is a separate later plan).

---

## Working directory & conventions

- Run `npx vitest`, `npx tsc`, `npm run dev` from `public/dungeon/`.
- **Lint runs in CI** (`npm run lint` = `biome check` from the **repo root** `/Users/Daniel_Sallai/dev/ai-kb`). Every task that changes `.ts` MUST end by running `npx @biomejs/biome check --write <files>` so formatting matches CI. (A prior PR went red purely on Biome formatting — do not skip this.)
- The `td-tiles` spritesheet (`assets/tilemap_packed.png`, 16×16 frames) is already loaded by `BootScene` and used by `backdrops.ts`. **Frame 45 is a single brown wooden door** — the menu/exit icon (verified by inspecting the sheet).
- Boss fights already auto-save on every answer; `writeSave()` (with default options) writes a full resumable `inBoss` snapshot, and is a no-op for isolated/demo runs ([BossFightScene.ts:441-468](../../../public/dungeon/src/scenes/BossFightScene.ts#L441-L468)).

## File Structure

- **Create** `src/ui/inFightNav.ts` — `mountMenuButton(scene, onExit)`; one clear responsibility (render the exit control + wire its click). Keeps the already-large `BossFightScene` from growing.
- **Create** `src/ui/inFightNav.test.ts` — unit test with minimal scene fake.
- **Modify** `src/scenes/BossFightScene.ts` — add `exitToHub()` private method; call `mountMenuButton` in `create()`.

---

## Task 1: `mountMenuButton` helper

**Files:**
- Create: `src/ui/inFightNav.ts`
- Test: `src/ui/inFightNav.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/ui/inFightNav.test.ts`:

```typescript
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { mountMenuButton } from './inFightNav';

// Minimal chainable fakes — mountMenuButton only calls a small surface on the
// scene's add factory and on the returned game objects. We capture the `on`
// handlers so the test can fire a pointerdown and assert onExit ran. Mirrors
// the fake style in optionFeedback.test.ts.
function makeGameObjectFake() {
  const handlers: Record<string, () => void> = {};
  const obj = {
    handlers,
    setScale: () => obj,
    setDepth: () => obj,
    setOrigin: () => obj,
    setInteractive: () => obj,
    setTint: () => obj,
    clearTint: () => obj,
    setBackgroundColor: () => obj,
    setColor: () => obj,
    on(event: string, fn: () => void) {
      handlers[event] = fn;
      return obj;
    },
  };
  return obj;
}

function makeSceneFake() {
  const image = makeGameObjectFake();
  const text = makeGameObjectFake();
  return {
    image,
    text,
    add: {
      image: () => image,
      text: () => text,
    },
  };
}

describe('mountMenuButton', () => {
  it('invokes onExit when the door icon is clicked', () => {
    const scene = makeSceneFake();
    const onExit = vi.fn();
    mountMenuButton(scene as unknown as Phaser.Scene, onExit);
    scene.image.handlers.pointerdown?.();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('invokes onExit when the Menu label is clicked', () => {
    const scene = makeSceneFake();
    const onExit = vi.fn();
    mountMenuButton(scene as unknown as Phaser.Scene, onExit);
    scene.text.handlers.pointerdown?.();
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/inFightNav.test.ts`
Expected: FAIL — `mountMenuButton` not exported / module not found.

- [ ] **Step 3: Implement the helper**

Create `src/ui/inFightNav.ts`:

```typescript
import type Phaser from 'phaser';
import { attachTextHover } from './buttonHover';

// Single wooden door in the td-tiles spritesheet — reads as "exit/leave".
const DOOR_FRAME = 45;

/**
 * Mount a small "Menu" exit control (door icon + label) in the top-left of a
 * boss fight. Clicking either the icon or the label invokes onExit. Visuals
 * only — the caller decides what leaving does (see BossFightScene.exitToHub).
 */
export function mountMenuButton(scene: Phaser.Scene, onExit: () => void): void {
  const door = scene.add
    .image(28, 28, 'td-tiles', DOOR_FRAME)
    .setScale(2)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(48, 28, 'Menu', {
      fontSize: '13px',
      color: '#c0c0d0',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2a',
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0, 0.5)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  attachTextHover(label, { bg: '#1a1a2a', color: '#c0c0d0' }, { bg: '#2a2a3a', color: '#ffffff' });
  door.on('pointerover', () => door.setTint(0xffe070));
  door.on('pointerout', () => door.clearTint());

  door.on('pointerdown', onExit);
  label.on('pointerdown', onExit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/inFightNav.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
npx @biomejs/biome check --write src/ui/inFightNav.ts src/ui/inFightNav.test.ts
git add src/ui/inFightNav.ts src/ui/inFightNav.test.ts
git commit -m "feat(dungeon): mountMenuButton exit control (door icon + label)"
```

---

## Task 2: Wire the exit control into the boss fight

**Files:**
- Modify: `src/scenes/BossFightScene.ts` (import; a `mountMenuButton` call in `create()`; new `exitToHub()` method)

No unit test: this is scene wiring (object creation + a scene transition), which the codebase verifies manually — the testable seam (`mountMenuButton`) is already covered in Task 1. The regression suite + manual check (Task 3) are the gate.

- [ ] **Step 1: Add the import**

In `src/scenes/BossFightScene.ts`, add alongside the other `../ui/*` imports (e.g. just after the `import { mountAudioToggles } from '../ui/audioToggles';`-area imports near the top):

```typescript
import { mountMenuButton } from '../ui/inFightNav';
```

- [ ] **Step 2: Mount the button in `create()`**

In `create()`, immediately AFTER the `mountAudioToggles(this, { ... });` call (around [BossFightScene.ts:406-411](../../../public/dungeon/src/scenes/BossFightScene.ts#L406-L411)), add:

```typescript
    // Back-to-menu control (top-left). Leaving flushes a resumable mid-fight
    // save, so the Hub offers "Continue (… mid-fight)". No-op save for
    // isolated/demo runs — those just abandon the throwaway fight.
    mountMenuButton(this, () => this.exitToHub());
```

- [ ] **Step 3: Add the `exitToHub()` method**

Add this private method to the `BossFightScene` class, immediately after the existing `writeSave(...)` method (after its closing brace, ~[BossFightScene.ts:469](../../../public/dungeon/src/scenes/BossFightScene.ts#L469)):

```typescript
  private exitToHub(): void {
    // Persist the current fight so the Hub can resume it (no-op for
    // isolated/demo). The scene's existing 'shutdown' handler stops the BGM
    // on transition, so we don't stop it here.
    this.writeSave();
    fadeToScene(this, 'HubScene');
  }
```

(`fadeToScene` is already imported in this file — see the existing `import { fadeIn, fadeToScene } from '../ui/transitions';`.)

- [ ] **Step 4: Verify build + types + full suite**

Run:
```bash
npx vitest run && npx tsc --noEmit && npm run build 2>&1 | grep -E "built in|error"
```
Expected: all tests pass, `tsc` clean, build succeeds.

- [ ] **Step 5: Lint + commit**

```bash
npx @biomejs/biome check --write src/scenes/BossFightScene.ts
git add src/scenes/BossFightScene.ts
git commit -m "feat(dungeon): in-fight Menu button returns to Hub (resumable)"
```

---

## Task 3: Final verification (CI parity + manual)

- [ ] **Step 1: Run the exact CI lint command from the repo root**

Run (from `/Users/Daniel_Sallai/dev/ai-kb`): `npm run lint`
Expected: `Checked N files … No fixes applied.` and exit 0. If Biome reports any file, run `npm run lint:fix`, re-verify, and amend the relevant commit.

- [ ] **Step 2: Full suite + typecheck once more**

Run (from `public/dungeon/`): `npx vitest run && npx tsc --noEmit`
Expected: all green.

- [ ] **Step 3: Manual verification in the browser**

Run `npm run dev`, open the printed URL, start a real (non-`?demo`) run, enter a boss fight, and verify ALL:
- A door icon + "Menu" chip appear top-left and don't overlap the boss name, HP readouts, or spell row.
- Hover brightens both the door (tint) and the label.
- Clicking Menu mid-fight (answer 0–1 questions first) returns to the Hub, which shows **"Continue (Floor N · Boss, mid-fight)"**; clicking Continue restores the same boss, question index, and HP.
- In a `?demo` run, the Menu button returns to the Hub cleanly (the demo re-launches from Tool-Smith; no stale "Continue" leaks — demo writes no save).

- [ ] **Step 4: No commit** (verification only). Record the manual result in the PR description.

---

## Self-review notes (for the implementer)

- Frame `45` is the door icon; if it doesn't read clearly in-game, the other door tiles are `46`/`47` (double-door halves) — but 45 (single door) was chosen deliberately. Don't change it without a visual check.
- `mountMenuButton` is visuals + click-wiring only; the leave behavior lives in `exitToHub` so the helper stays trivially testable and reusable (Phase 2 can mount a Codex button beside it the same way).
- Do not add a confirm modal — leaving is a resumable pause, not a forfeit (per spec). The Hub's "New Game" already covers discarding a run.
