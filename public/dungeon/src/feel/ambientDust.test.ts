import { describe, it, expect, vi } from 'vitest';
import Phaser from 'phaser';
import {
  DUST_BURST_COUNT, DUST_BURST_INTERVAL_MS,
  DUST_LIFETIME_MIN_MS, DUST_LIFETIME_MAX_MS,
  installAmbientDust,
} from './ambientDust';

describe('ambientDust', () => {
  it('exports expected particle tuning constants', () => {
    expect(DUST_BURST_COUNT).toBe(4);
    expect(DUST_BURST_INTERVAL_MS).toBe(2500);
    expect(DUST_LIFETIME_MIN_MS).toBeGreaterThanOrEqual(8000);
    expect(DUST_LIFETIME_MAX_MS).toBeLessThanOrEqual(12000);
  });

  it('registers particle emitter and returns disposer that destroys it', () => {
    const emitter = new Phaser.Events.EventEmitter();
    const destroySpy = vi.fn();
    const particleEmitter: any = { setDepth: vi.fn(() => particleEmitter), destroy: destroySpy };
    const graphicsStub: any = {
      fillStyle: vi.fn(() => graphicsStub),
      fillRect: vi.fn(() => graphicsStub),
      generateTexture: vi.fn(),
      destroy: vi.fn(),
    };
    const fakeScene = {
      events: emitter,
      textures: { exists: () => false },
      make: { graphics: () => graphicsStub },
      add: { particles: vi.fn(() => particleEmitter) },
    } as unknown as Phaser.Scene;

    const dispose = installAmbientDust(fakeScene);
    expect((fakeScene as any).add.particles).toHaveBeenCalledTimes(1);
    expect(particleEmitter.setDepth).toHaveBeenCalledWith(-5);

    dispose();
    expect(destroySpy).toHaveBeenCalled();
  });
});
