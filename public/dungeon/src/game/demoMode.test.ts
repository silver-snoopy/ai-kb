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

describe('isDemoMode resilience + cross-source composition', () => {
  it('stays false across repeated calls when no source is active (no leak)', () => {
    const scene = fakeScene(undefined);
    expect(isDemoMode(scene, '')).toBe(false);
    expect(isDemoMode(scene, '')).toBe(false);
  });

  it('registry flag wins even when the param is unrelated and storage is empty', () => {
    expect(isDemoMode(fakeScene(true), '?nope')).toBe(true);
  });

  it('falls back to registry/param when localStorage.getItem throws (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage blocked');
    });
    try {
      expect(isDemoMode(fakeScene(undefined), '?demo=1')).toBe(true); // param path, never reads storage
      expect(isDemoMode(fakeScene(undefined), '')).toBe(false); // storage dead → not persisted
    } finally {
      spy.mockRestore();
    }
  });

  it('enableDemoMode still sets the registry flag when localStorage.setItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage blocked');
    });
    try {
      const scene = fakeScene(undefined);
      expect(() => enableDemoMode(scene)).not.toThrow();
      expect(scene.registry.set).toHaveBeenCalledWith('demoMode', true);
    } finally {
      spy.mockRestore();
    }
  });
});
