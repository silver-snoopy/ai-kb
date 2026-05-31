# Post-Credit Stinger ("The Vanishing") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden, demo-only post-credit cinematic to the dungeon game, launched in one click via a permanent-decorative-but-demo-armed rune sigil, as the closing flourish for the 2026-06-03 talk.

**Architecture:** Three new units — a sticky `demoMode` flag (`src/game/demoMode.ts`), a camouflaged trigger (`src/ui/decorativeSigil.ts`), and the cinematic (`src/scenes/PostCreditScene.ts`) — plus thin wiring into `main.ts`, `HubScene`, and `BossFightScene`. The sigil is inert chrome for all players and only becomes interactive in demo mode. The cinematic is pure tween/flash/text choreography reusing existing helpers (`renderBackdrop`, `installAmbientDust`, `fadeToScene`); the "teleport" of the static `hero` image is sold by a white flash masking an `alpha/scale → 0` set at the flash peak.

**Tech Stack:** TypeScript, Phaser 3.90, Vite, Vitest (jsdom). All commands run from `public/dungeon/`.

**Spec:** `docs/superpowers/specs/2026-05-31-post-credit-stinger-design.md`

**Branch:** `feat/post-credit-stinger` (already created; the spec commit `018f74a` is its first commit).

---

## File structure

| File | New? | Responsibility |
|---|---|---|
| `public/dungeon/src/game/demoMode.ts` | new | Sticky demo-mode flag: registry + `?demo` URL param + localStorage. Pure, testable. |
| `public/dungeon/src/game/demoMode.test.ts` | new | Unit tests for the flag logic. |
| `public/dungeon/src/scenes/PostCreditScene.ts` | new | The "Vanishing" cinematic scene. |
| `public/dungeon/src/ui/decorativeSigil.ts` | new | Mount the permanent rune; arm click→stinger only in demo mode. |
| `public/dungeon/src/ui/decorativeSigil.test.ts` | new | Mock-scene tests for inert-vs-armed behavior. |
| `public/dungeon/src/main.ts` | modify | Register `PostCreditScene`. |
| `public/dungeon/src/scenes/HubScene.ts` | modify | Mount sigil beside title; `enableDemoMode` in `beginDemoCampaign`. |
| `public/dungeon/src/scenes/BossFightScene.ts` | modify | Mount sigil beside boss banner. |

> **All paths below are relative to `public/dungeon/`.** All `npm` commands run from `public/dungeon/` (the nested project — the repo-root `npm test` just `cd`s here).

---

## Task 1: `demoMode` sticky flag

**Files:**
- Create: `src/game/demoMode.ts`
- Test: `src/game/demoMode.test.ts`

Mirrors the existing `src/ui/debugToggle.ts` pattern (`isDebugEnabled(search)` + localStorage try/catch). The flag is **independent of** the per-run `demoRun` flag (which `HubScene` clears on Hub return).

- [ ] **Step 1: Write the failing test**

Create `src/game/demoMode.test.ts`:

```ts
import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoParamPresent, enableDemoMode, isDemoMode } from './demoMode';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* jsdom always has localStorage; guard mirrors prod code */
  }
});

describe('demoParamPresent', () => {
  it('true for ?demo=1', () => expect(demoParamPresent('?demo=1')).toBe(true));
  it('true for bare ?demo', () => expect(demoParamPresent('?demo')).toBe(true));
  it('false for empty query', () => expect(demoParamPresent('')).toBe(false));
  it('false for unrelated params', () => expect(demoParamPresent('?debug=1')).toBe(false));
  it('true when mixed with other params', () => expect(demoParamPresent('?src=x&demo=1')).toBe(true));
});

function fakeScene(registryVal: unknown): Phaser.Scene {
  const store: Record<string, unknown> = { demoMode: registryVal };
  return {
    registry: {
      get: vi.fn((k: string) => store[k]),
      set: vi.fn((k: string, v: unknown) => {
        store[k] = v;
      }),
    },
  } as unknown as Phaser.Scene;
}

describe('isDemoMode', () => {
  it('false by default (no flag, no param, no storage)', () => {
    expect(isDemoMode(fakeScene(undefined), '')).toBe(false);
  });
  it('true when registry flag set', () => {
    expect(isDemoMode(fakeScene(true), '')).toBe(true);
  });
  it('true when ?demo param present', () => {
    expect(isDemoMode(fakeScene(undefined), '?demo=1')).toBe(true);
  });
  it('true when localStorage opt-in present', () => {
    localStorage.setItem('stc:demoMode', 'true');
    expect(isDemoMode(fakeScene(undefined), '')).toBe(true);
  });
});

describe('enableDemoMode', () => {
  it('sets the registry flag and persists to localStorage', () => {
    const scene = fakeScene(undefined);
    enableDemoMode(scene);
    expect(scene.registry.set).toHaveBeenCalledWith('demoMode', true);
    expect(localStorage.getItem('stc:demoMode')).toBe('true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- demoMode`
Expected: FAIL — `Failed to resolve import "./demoMode"` (module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/game/demoMode.ts`:

```ts
import type Phaser from 'phaser';

const LS_KEY = 'stc:demoMode';
const REGISTRY_KEY = 'demoMode';

/** True when the URL query string opts into demo mode (presence of `?demo`). */
export function demoParamPresent(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has('demo');
}

function localStorageDemo(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * True if demo mode is active by any path:
 *   1. the sticky registry flag (set when a demo campaign launches),
 *   2. the `?demo` URL param (the talk pre-arm path), or
 *   3. a persisted localStorage opt-in.
 *
 * Distinct from the per-run `demoRun` flag, which `HubScene` clears on return
 * to the Hub — `demoMode` must survive that so the sigil stays armed.
 */
export function isDemoMode(scene: Phaser.Scene, search: string = window.location.search): boolean {
  if (scene.registry.get(REGISTRY_KEY) === true) return true;
  if (demoParamPresent(search)) return true;
  return localStorageDemo();
}

/** Turn demo mode on for the rest of the session (registry + persisted). */
export function enableDemoMode(scene: Phaser.Scene): void {
  scene.registry.set(REGISTRY_KEY, true);
  try {
    localStorage.setItem(LS_KEY, 'true');
  } catch {
    // localStorage unavailable — the registry flag still carries the session
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- demoMode`
Expected: PASS (14 assertions across 3 describes).

- [ ] **Step 5: Commit**

```bash
git add src/game/demoMode.ts src/game/demoMode.test.ts
git commit -m "feat(dungeon): sticky demoMode flag (registry + ?demo + localStorage)"
```

---

## Task 2: `PostCreditScene` cinematic + registration

**Files:**
- Create: `src/scenes/PostCreditScene.ts`
- Modify: `src/main.ts` (add import + scene-list entry)

No unit test — choreography is verified manually (Task 5), consistent with how the repo treats scene `create()` (logic lives in pure modules; scenes are hand-checked). The scene must be a valid Phaser scene reachable by key `PostCreditScene` and must always return to the Hub.

- [ ] **Step 1: Create the scene**

Create `src/scenes/PostCreditScene.ts`:

```ts
import Phaser from 'phaser';
import { installAmbientDust } from '../feel/ambientDust';
import { fadeToScene } from '../ui/transitions';
import { SIGIL_GLYPH } from '../ui/decorativeSigil';
import { renderBackdrop } from './backdrops';

const AUTO_RETURN_MS = 20000;
const GROUND_Y = 430;

/**
 * "The Vanishing" — a hidden post-credit stinger. The warlock walks in, reads
 * the golden parchment, and teleports out in a white flash; the screen falls to
 * black and "Our hero will return…" fades in beneath a single arcane rune (the
 * same glyph as the trigger sigil). Pure tween/flash/text choreography over the
 * existing static `hero` image — no new art.
 *
 * Reached only via the demo-armed decorative sigil (see decorativeSigil.ts).
 * Always exits to HubScene: on input once the text has appeared, or after a
 * ~20s failsafe so the presenter is never stranded on stage.
 */
export class PostCreditScene extends Phaser.Scene {
  private canDismiss = false;
  private leaving = false;

  constructor() {
    super({ key: 'PostCreditScene' });
  }

  create(): void {
    this.canDismiss = false;
    this.leaving = false;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Dim torch-lit floor: reuse a boss backdrop, then darken with an overlay.
    renderBackdrop(this, 'the-orchestrator');
    const dim = this.add.rectangle(480, 360, 960, 720, 0x000000, 0.62).setDepth(5);

    const stopDust = installAmbientDust(this);

    // The warlock walks in from the left (static image; motion = tween + bob).
    const hero = this.add.image(-60, GROUND_Y, 'hero').setScale(3).setDepth(10);
    this.tweens.add({
      targets: hero,
      x: 360,
      duration: 2200,
      delay: 1500,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: hero,
      y: GROUND_Y - 4,
      duration: 260,
      yoyo: true,
      repeat: 8,
      delay: 1500,
      ease: 'Sine.easeInOut',
    });

    // BEAT 2 — the golden parchment glows in; he reads it.
    const scroll = this.add
      .text(430, GROUND_Y + 36, '📜', { fontSize: '40px' })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0);
    this.time.delayedCall(3900, () => {
      this.tweens.add({ targets: scroll, alpha: 1, duration: 500 });
      this.tweens.add({
        targets: scroll,
        scale: 1.12,
        duration: 700,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    });

    // BEAT 3-5 — ignition → white flash → vanish (flash masks alpha/scale→0).
    const flash = this.add.rectangle(480, 360, 960, 720, 0xffffff, 1).setDepth(50).setAlpha(0);
    this.time.delayedCall(6500, () => {
      this.tweens.add({
        targets: hero,
        scaleX: 2.8,
        scaleY: 3.3,
        duration: 700,
        ease: 'Sine.easeIn',
      });
    });
    this.time.delayedCall(7300, () => {
      this.tweens.add({
        targets: flash,
        alpha: 1,
        duration: 130,
        ease: 'Quad.easeIn',
        onComplete: () => {
          hero.setAlpha(0).setScale(0);
          scroll.setAlpha(0);
          this.spawnCollapseRing(360, GROUND_Y);
          this.tweens.add({ targets: flash, alpha: 0, duration: 360, ease: 'Quad.easeOut' });
        },
      });
    });

    // BEAT 6 — fall to full black.
    this.time.delayedCall(8300, () => {
      this.tweens.add({ targets: dim, fillAlpha: 1, duration: 900 });
    });

    // BEAT 7 — the promise + the rune.
    const line = this.add
      .text(480, 330, 'Our hero will return…', {
        fontSize: '30px',
        color: '#f5e4b3',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    const rune = this.add
      .text(480, 400, SIGIL_GLYPH, { fontSize: '26px', color: '#9a7bd0', fontFamily: 'monospace' })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.time.delayedCall(9500, () => {
      this.tweens.add({ targets: line, alpha: 1, duration: 1200, ease: 'Sine.easeInOut' });
    });
    this.time.delayedCall(10800, () => {
      this.tweens.add({
        targets: rune,
        alpha: 0.85,
        duration: 600,
        yoyo: true,
        hold: 200,
        ease: 'Sine.easeInOut',
      });
    });

    // BEAT 8 — the tiny 4th-wall wink; arm dismissal.
    const wink = this.add
      .text(480, 690, '// to be continued — pending review', {
        fontSize: '13px',
        color: '#7a7a8a',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.time.delayedCall(12000, () => {
      this.tweens.add({ targets: wink, alpha: 1, duration: 800 });
      this.canDismiss = true;
      stopDust();
    });

    // Dismiss: any input once text is in, plus a failsafe auto-return.
    const goHome = (): void => {
      if (this.canDismiss) this.leave();
    };
    this.input.on('pointerdown', goHome);
    this.input.keyboard?.on('keydown', goHome);
    this.time.delayedCall(AUTO_RETURN_MS, () => this.leave());
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    fadeToScene(this, 'HubScene');
  }

  private spawnCollapseRing(x: number, y: number): void {
    const g = this.add.graphics().setDepth(45);
    const ring = { r: 90, a: 0.9 };
    this.tweens.add({
      targets: ring,
      r: 0,
      a: 0,
      duration: 600,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        g.clear();
        g.lineStyle(3, 0x9a7bd0, ring.a);
        g.strokeCircle(x, y, ring.r);
      },
      onComplete: () => g.destroy(),
    });
  }
}
```

> Note: this scene imports `SIGIL_GLYPH` from `decorativeSigil.ts`, created in Task 3. TypeScript/Vite will not resolve the import until Task 3 lands — that is expected. Do the registration step now (it only references `PostCreditScene`), and the first successful **build** happens after Task 3.

- [ ] **Step 2: Register the scene in `main.ts`**

In `src/main.ts`, add the import next to the other scene imports (after the `InterstitialScene` import, line 6):

```ts
import { InterstitialScene } from './scenes/InterstitialScene';
import { PostCreditScene } from './scenes/PostCreditScene';
```

And add it to the `scene` array (line 22) — append at the end:

```ts
  scene: [BootScene, HubScene, BossFightScene, InterstitialScene, CampaignCompleteScene, TomeScene, PostCreditScene],
```

- [ ] **Step 3: Commit** (build is deferred to Task 3 because of the `SIGIL_GLYPH` import)

```bash
git add src/scenes/PostCreditScene.ts src/main.ts
git commit -m "feat(dungeon): PostCreditScene 'The Vanishing' cinematic + register scene"
```

---

## Task 3: `decorativeSigil` — permanent chrome, demo-armed trigger

**Files:**
- Create: `src/ui/decorativeSigil.ts`
- Test: `src/ui/decorativeSigil.test.ts`

Mounts the rune for **all** players as inert chrome; only in demo mode does it gain a click handler that launches the stinger. Exports `SIGIL_GLYPH` (consumed by `PostCreditScene`, so this task completes the import cycle and the project builds again).

- [ ] **Step 1: Write the failing test**

Create `src/ui/decorativeSigil.test.ts`:

```ts
import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGIL_GLYPH, mountDecorativeSigil } from './decorativeSigil';

function makeFakeText() {
  const t: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['setScrollFactor', 'setDepth', 'setOrigin', 'setInteractive', 'on']) {
    t[m] = vi.fn(() => t);
  }
  return t;
}

function makeFakeScene(demo: boolean) {
  const text = makeFakeText();
  const scene = {
    add: { text: vi.fn(() => text) },
    registry: { get: vi.fn((k: string) => (k === 'demoMode' ? demo : undefined)) },
  } as unknown as Phaser.Scene;
  return { scene, text };
}

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* jsdom always has localStorage */
  }
});

describe('mountDecorativeSigil', () => {
  it('renders the sigil glyph at the given position for all players', () => {
    const { scene, text } = makeFakeScene(false);
    mountDecorativeSigil(scene, 720, 50);
    expect((scene as unknown as { add: { text: ReturnType<typeof vi.fn> } }).add.text).toHaveBeenCalledWith(
      720,
      50,
      SIGIL_GLYPH,
      expect.anything(),
    );
    expect(text.setDepth).toHaveBeenCalledWith(1000);
  });

  it('is INERT when not in demo mode (no interactivity, no handler)', () => {
    const { scene, text } = makeFakeScene(false);
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).not.toHaveBeenCalled();
    expect(text.on).not.toHaveBeenCalled();
  });

  it('is ARMED in demo mode (interactive + pointerdown handler)', () => {
    const { scene, text } = makeFakeScene(true);
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).toHaveBeenCalledWith({ useHandCursor: false });
    expect(text.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- decorativeSigil`
Expected: FAIL — `Failed to resolve import "./decorativeSigil"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/ui/decorativeSigil.ts`:

```ts
import type Phaser from 'phaser';
import { isDemoMode } from '../game/demoMode';
import { fadeToScene } from './transitions';

/**
 * The warded-diamond rune. Doubles as the camouflaged trigger glyph and the
 * symbol the stinger ends on — trigger and payload rhyme.
 */
export const SIGIL_GLYPH = '◈'; // ◈

/**
 * Mount the permanent decorative rune at (x, y). Visible for ALL players as
 * inert HUD chrome. Only in demo mode does it become interactive and, on click,
 * launch the post-credit stinger. No hand-cursor, so it never reads as a button
 * to a normal player.
 *
 * Returns the created text object (for repositioning / tests).
 */
export function mountDecorativeSigil(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Text {
  const sigil = scene.add
    .text(x, y, SIGIL_GLYPH, {
      fontSize: '16px',
      color: '#6a6a7a',
      fontFamily: 'monospace',
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  if (isDemoMode(scene)) {
    sigil.setInteractive({ useHandCursor: false });
    sigil.on(
      'pointerdown',
      (_p: unknown, _x: number, _y: number, event?: Phaser.Types.Input.EventData) => {
        event?.stopPropagation?.();
        fadeToScene(scene, 'PostCreditScene');
      },
    );
  }

  return sigil;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- decorativeSigil`
Expected: PASS (3 assertions).

- [ ] **Step 5: Verify the whole project builds and all tests pass**

Run: `npm test`
Expected: PASS — full suite green (the `PostCreditScene` ↔ `decorativeSigil` import cycle now resolves).

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/decorativeSigil.ts src/ui/decorativeSigil.test.ts
git commit -m "feat(dungeon): demo-armed decorative sigil trigger for the stinger"
```

---

## Task 4: Wire the mounts + enable demo mode

**Files:**
- Modify: `src/scenes/HubScene.ts` (import + sigil mount + `enableDemoMode` in `beginDemoCampaign`)
- Modify: `src/scenes/BossFightScene.ts` (import + sigil mount)

Build **both** mounts now; Task 5 A/B-tests them and prunes the loser.

- [ ] **Step 1: Mount the sigil in the Hub + enable demo mode on demo launch**

In `src/scenes/HubScene.ts`, add imports near the existing UI imports (the file already imports `mountAudioToggles` from `'../ui/audioToggles'` at line 10):

```ts
import { mountDecorativeSigil } from '../ui/decorativeSigil';
import { enableDemoMode } from '../game/demoMode';
```

Mount the sigil immediately after the existing `mountAudioToggles(this);` call (line 78), beside the title:

```ts
    mountAudioToggles(this);
    // Decorative rune beside the gate title. Inert chrome for normal players;
    // in demo mode it is the one-click launch for the post-credit stinger.
    mountDecorativeSigil(this, 720, 50);
```

In `beginDemoCampaign`, mark the session as demo mode right after the existing `this.registry.set('demoRun', true);` (line 477) so the sigil stays armed even after the run returns to the Hub:

```ts
    this.registry.set('demoRun', true);
    enableDemoMode(this);
```

- [ ] **Step 2: Mount the sigil in the Boss Fight HUD**

In `src/scenes/BossFightScene.ts`, add the import near the existing `mountAudioToggles` import (line 28):

```ts
import { mountDecorativeSigil } from '../ui/decorativeSigil';
```

Mount the sigil immediately after the existing `mountAudioToggles(this, { ... });` call (lines 387-392), beside the boss-name banner. The existing call is verbatim:

```ts
    mountAudioToggles(this, {
      onBgmToggle: (muted) => {
        if (muted) this.bgm.stop();
        else this.bgm.start(this.boss.id, this.sound as unknown as { context?: AudioContext });
      },
    });
```

Insert the mount on the line directly after its closing `});` (before the blank line and the `// Install Feel Pack` comment at line 394). Do **not** alter the audio-toggle body:

```ts
    });

    // Decorative rune beside the boss banner — second A/B mount of the stinger
    // trigger; inert unless in demo mode.
    mountDecorativeSigil(this, 700, 30);

    // Install Feel Pack — hit-stop, shake grading, squash-stretch, stagger-back, ambient dust.
    installFeelPack(this, { heroSprite: this.heroSprite, bossSprite: this.bossSprite });
```

- [ ] **Step 3: Verify build + tests still pass**

Run: `npm test`
Expected: PASS — full suite green (no test targets the modified scenes directly; this confirms nothing regressed).

Run: `npm run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/HubScene.ts src/scenes/BossFightScene.ts
git commit -m "feat(dungeon): mount stinger sigil in Hub + Boss HUD; arm demoMode on demo launch"
```

---

## Task 5: Manual verification, A/B, and prune

No automated browser harness exists in-repo, so this is a manual dev-server pass. The decision output (which mount survives) feeds a final cleanup commit.

- [ ] **Step 1: Run the dev server in demo mode**

Run: `npm run dev`
Then open: `http://localhost:5173/?demo=1`

- [ ] **Step 2: Verify the Hub mount**

On the Hub ("Gates of the Archive"), confirm the rune `◈` appears beside the title. Click it.
Expected: fade to black → the full "Vanishing" cinematic plays → "Our hero will return…" + rune + wink → click (or wait 20s) → returns to the Hub.

- [ ] **Step 3: Verify the Boss-HUD mount**

From the Hub, open the debug panel (`🐛`) and click "start demo campaign", landing in a boss fight. Confirm the rune `◈` appears beside the boss-name banner. Click it.
Expected: the same cinematic plays and returns to the Hub.

- [ ] **Step 4: Verify the camouflage (no-demo path)**

Open `http://localhost:5173/` (no `?demo=1`), and clear the demo opt-in first if it persisted:
Run in the browser devtools console: `localStorage.removeItem('stc:demoMode')` then reload `http://localhost:5173/`.
Expected: the rune is still visible on the Hub (and boss HUD) but clicking it does **nothing** — no scene change, no hand-cursor on hover.

- [ ] **Step 5: Projector-resolution check**

Resize the browser to ~1600×900 (the talk's established projector breakpoint). Confirm the rune reads as intentional chrome (not clutter) on each screen, and the cinematic text is legible.

- [ ] **Step 6: A/B decision + prune the loser**

Judge which mount reads better as camouflaged chrome (clutter, eye-draw, "secret door" feel). Per the spec's placement research, the **Hub** mount is the predicted keeper and the **Boss-HUD** mount the predicted removal.

Remove the losing mount (predicted: delete `mountDecorativeSigil(this, 700, 30);` and its comment + the now-unused import from `BossFightScene.ts`). Then:

Run: `npm test` → PASS
Run: `npm run build` → succeeds

```bash
git add src/scenes/BossFightScene.ts
git commit -m "chore(dungeon): keep Hub stinger mount, drop Boss-HUD mount after A/B"
```

> If the A/B instead favors the Boss-HUD mount, remove the Hub mount line from `HubScene.ts` (keep `enableDemoMode` in `beginDemoCampaign`) and adjust the commit message accordingly.

- [ ] **Step 7: Final talk dry-run**

Confirm the exact stage path end to end: `http://localhost:5173/?demo=1` → (the surviving mount's screen) → one click → cinematic → returns to Hub. This is the path to use live on 2026-06-03.

---

## Self-review notes (coverage check)

- **Spec §4 (demoMode):** Task 1. **Spec §4.1 (sigil, both mounts, camouflage):** Tasks 3 + 4. **Spec §4.3 + §5 (scene + storyboard):** Task 2. **Spec §6 (no auto-chain):** honored — no `CampaignCompleteScene` change anywhere. **Spec §7 (tests):** Tasks 1, 3 (unit/mock-scene) + Task 5 (manual A/B, since no committed Playwright harness). **Spec §8 risks:** white-flash mask (Task 2), `demoMode` survives Hub return (Task 1 + Task 4 wiring), failsafe auto-return + leaving-guard (Task 2). **Spec §9 build sequence:** Tasks 1→4 follow it; Task 5 is the A/B prune.
- **Type consistency:** `SIGIL_GLYPH`, `mountDecorativeSigil`, `isDemoMode`, `enableDemoMode`, `demoParamPresent`, scene key `'PostCreditScene'`, registry key `'demoMode'`, localStorage key `'stc:demoMode'` are spelled identically across all tasks.
- **Deferred-build note:** Task 2's scene imports `SIGIL_GLYPH` from Task 3; the first green `npm run build` is at Task 3 Step 5. This is called out in Task 2 Step 1's note so an out-of-order reader isn't surprised.
