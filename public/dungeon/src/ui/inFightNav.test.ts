import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { mountMenuButton } from './inFightNav';

// Minimal chainable fake — mountMenuButton only calls a small surface on the
// scene's add factory and on the returned image. We capture the `on` handlers
// so the test can fire a pointerdown and assert onExit ran. Mirrors the fake
// style in optionFeedback.test.ts.
function makeImageFake() {
  const handlers: Record<string, () => void> = {};
  const obj = {
    handlers,
    setScale: () => obj,
    setDepth: () => obj,
    setInteractive: () => obj,
    setTint: () => obj,
    clearTint: () => obj,
    on(event: string, fn: () => void) {
      handlers[event] = fn;
      return obj;
    },
  };
  return obj;
}

function makeSceneFake() {
  const image = makeImageFake();
  return {
    image,
    add: {
      image: () => image,
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
});
