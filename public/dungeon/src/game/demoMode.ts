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
    // localStorage blocked (file://, privacy mode) — fall back to "not persisted"
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
