// public/theme-toggle.js
// Shared across practice/, review/, and the landing page.
//
// Loads the user's chosen theme before paint to avoid flash. Persists choice
// in localStorage. Respects prefers-color-scheme as the initial default.
//
// Contract: pages must include an element with id="theme-toggle" (a button).
// This script wires its click handler and updates its aria-pressed attribute.

(function () {
  const STORAGE_KEY = 'ai-kb-theme';
  const root = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
  }

  function effectiveTheme() {
    const stored = getStored();
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark' || theme === 'light') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // Apply stored theme ASAP (script is loaded in <head> with no defer/async
  // attribute so it runs before body paint — avoids FOUC on refresh).
  const initial = getStored();
  if (initial === 'dark' || initial === 'light') apply(initial);

  function wireUp() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', effectiveTheme() === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      apply(next);
      setStored(next);
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUp);
  } else {
    wireUp();
  }
})();
