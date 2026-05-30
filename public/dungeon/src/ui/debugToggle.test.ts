import { describe, expect, it } from 'vitest';
import { isDebugEnabled, isScriptedDemo, scriptedDemoSeedOverride } from './debugToggle';

describe('isDebugEnabled', () => {
  it('returns true for ?debug=1', () => {
    expect(isDebugEnabled('?debug=1')).toBe(true);
  });

  it('returns true for ?debug without value', () => {
    expect(isDebugEnabled('?debug')).toBe(true);
  });

  it('returns true for ?debug=0 (presence gates, not value)', () => {
    // URLSearchParams.has is presence-based; any value including "0" enables debug.
    // Future cheat codes use distinct param names (?iddqd, ?idkfa) rather than values.
    expect(isDebugEnabled('?debug=0')).toBe(true);
  });

  it('returns false for empty query', () => {
    expect(isDebugEnabled('')).toBe(false);
  });

  it('returns false for unrelated params', () => {
    expect(isDebugEnabled('?iddqd')).toBe(false);
    expect(isDebugEnabled('?src=foo.json')).toBe(false);
  });

  it('returns true when debug is mixed with other params', () => {
    expect(isDebugEnabled('?src=foo.json&debug=1')).toBe(true);
  });
});

describe('isScriptedDemo', () => {
  it('is true for ?demo and ?demo=123', () => {
    expect(isScriptedDemo('?demo')).toBe(true);
    expect(isScriptedDemo('?demo=123')).toBe(true);
  });
  it('is false for no param or unrelated params', () => {
    expect(isScriptedDemo('')).toBe(false);
    expect(isScriptedDemo('?debug')).toBe(false);
  });
});

describe('scriptedDemoSeedOverride', () => {
  it('returns the numeric seed when ?demo=<n>', () => {
    expect(scriptedDemoSeedOverride('?demo=123')).toBe(123);
  });
  it('returns null for bare ?demo or non-numeric', () => {
    expect(scriptedDemoSeedOverride('?demo')).toBeNull();
    expect(scriptedDemoSeedOverride('?demo=abc')).toBeNull();
    expect(scriptedDemoSeedOverride('')).toBeNull();
  });
});
