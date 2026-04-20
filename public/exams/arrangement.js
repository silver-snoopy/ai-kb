// public/exams/arrangement.js
//
// Deterministic question-selection helpers for Practice + Dungeon. Shared
// across both surfaces — imported by public/practice/app.js (vanilla JS)
// and public/dungeon/src/scenes/* (via Vite ES module interop).
//
// Pure functions, no I/O, no dependencies. Given a bank + options, returns
// an array of question objects (not just ids — callers want full data).
//
// See: docs/superpowers/specs/2026-04-20-unified-question-bank-design.md §C.

// ---------- seeded PRNG ----------

/**
 * mulberry32: 32-bit seeded PRNG. Deterministic, ~2ns per call, no deps.
 * Source: https://stackoverflow.com/a/47593316 (public domain)
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Accept number or string seeds. String → 32-bit hash. */
export function normalizeSeed(seed) {
  if (typeof seed === 'number') return seed | 0;
  if (typeof seed === 'string') {
    // djb2 hash
    let h = 5381;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  // undefined → use a time-based seed so casual callers still get variety
  return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- filtering ----------

/**
 * Filter the bank by the INTERSECTION of provided domain and scenario sets.
 * Empty/undefined filter = no constraint on that axis.
 *
 * @param {object} bank - { questions: [...] }
 * @param {object} opts - { domains?: string[], scenarios?: string[] }
 * @returns {Array} filtered questions
 */
export function filterBank(bank, { domains, scenarios } = {}) {
  const domainSet = domains?.length ? new Set(domains) : null;
  const scenarioSet = scenarios?.length ? new Set(scenarios) : null;
  return bank.questions.filter(q => {
    if (domainSet && !domainSet.has(q.domain)) return false;
    if (scenarioSet && !scenarioSet.has(q.scenario)) return false;
    return true;
  });
}

/**
 * Given a bank and a filter, return the count per domain and per scenario
 * AFTER the cross-axis intersection. Used by Practice's live-filter UI to
 * show per-row counts and to disable checkboxes whose addition would yield
 * 0 questions.
 */
export function countByAxis(bank, { domains, scenarios } = {}) {
  const byDomain = {};
  const byScenario = {};
  // For each axis, counts are computed with the OTHER axis's filter applied.
  // So "Domain 1" count on the setup screen reflects: how many questions
  // are in domain 1 AFTER scenario selection is applied.
  const filterByScenarios = (q) => {
    if (!scenarios?.length) return true;
    return scenarios.includes(q.scenario);
  };
  const filterByDomains = (q) => {
    if (!domains?.length) return true;
    return domains.includes(q.domain);
  };
  for (const q of bank.questions) {
    if (filterByScenarios(q)) byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
    if (filterByDomains(q)) byScenario[q.scenario] = (byScenario[q.scenario] || 0) + 1;
  }
  return { byDomain, byScenario };
}

// ---------- session builders ----------

/**
 * Build a filtered drill session. Deterministic given a seed.
 *
 * @param {object} bank - { questions: [...] }
 * @param {object} filters - { domains?, scenarios?, size?, seed? }
 * @returns {Array} up to `size` question objects. If fewer match the filter,
 *   returns all matches (no padding — caller must handle short sessions).
 */
export function buildDrillSession(bank, { domains, scenarios, size = 20, seed } = {}) {
  const pool = filterBank(bank, { domains, scenarios });
  if (pool.length === 0) return [];
  const rng = mulberry32(normalizeSeed(seed));
  const shuffled = shuffle(pool, rng);
  return shuffled.slice(0, Math.min(size, shuffled.length));
}

/**
 * Build a mock-exam arrangement matching real CCA-F structure: 60 questions,
 * 4-of-6 scenarios, domain-weighted. Deterministic given (bank, seed).
 *
 * DRIFT: as the bank grows, the same seed produces a different arrangement,
 * because Fisher-Yates over a different-length pool differs. This is the
 * intended behavior — study value improves with more material.
 *
 * @param {object} bank
 * @param {object} opts - { seed?, size? = 60, scenarioCount? = 4, domainWeights? }
 *   domainWeights: 'exam' (default, use bank.domains[*].weight) | 'flat' | object map
 * @returns {Array} question objects
 */
export function buildMockExam(bank, opts = {}) {
  const { seed, size = 60, scenarioCount = 4, domainWeights = 'exam' } = opts;
  const rng = mulberry32(normalizeSeed(seed));

  // 1. Pick `scenarioCount` scenarios at random.
  const allScenarios = Object.keys(bank.scenarios || {});
  if (allScenarios.length === 0) return [];
  const pickedScenarios = shuffle(allScenarios, rng).slice(
    0,
    Math.min(scenarioCount, allScenarios.length),
  );

  // 2. Filter bank to picked scenarios.
  const pool = filterBank(bank, { scenarios: pickedScenarios });
  if (pool.length === 0) return [];

  // 3. Resolve domain weights.
  const weights = resolveWeights(bank, domainWeights);

  // 4. Distribute `size` across domains per weight (proportional; handles
  //    short pools by capping at available per-domain count).
  const domainQuotas = {};
  const domainIds = Object.keys(weights);
  let allocated = 0;
  const byDomain = {};
  for (const q of pool) {
    if (!byDomain[q.domain]) byDomain[q.domain] = [];
    byDomain[q.domain].push(q);
  }
  for (const d of domainIds) {
    const want = Math.round(size * (weights[d] || 0));
    const have = (byDomain[d] || []).length;
    const take = Math.min(want, have);
    domainQuotas[d] = take;
    allocated += take;
  }
  // Fill any remaining slots from the non-exhausted domains (round-robin).
  let remaining = size - allocated;
  const fillable = domainIds.filter(d => (byDomain[d]?.length || 0) > domainQuotas[d]);
  let i = 0;
  while (remaining > 0 && fillable.length > 0) {
    const d = fillable[i % fillable.length];
    if ((byDomain[d]?.length || 0) > domainQuotas[d]) {
      domainQuotas[d]++;
      remaining--;
      i++;
    } else {
      fillable.splice(fillable.indexOf(d), 1);
    }
  }

  // 5. Per domain, shuffle and take quota.
  const out = [];
  for (const d of domainIds) {
    const qs = shuffle(byDomain[d] || [], rng).slice(0, domainQuotas[d]);
    out.push(...qs);
  }

  // 6. Final shuffle so domains are interleaved (exam feel, not blocked).
  return shuffle(out, rng);
}

function resolveWeights(bank, domainWeights) {
  if (domainWeights === 'exam') {
    const out = {};
    for (const [id, meta] of Object.entries(bank.domains || {})) {
      out[id] = meta.weight ?? 0;
    }
    return out;
  }
  if (domainWeights === 'flat') {
    const ids = Object.keys(bank.domains || {});
    const w = ids.length > 0 ? 1 / ids.length : 0;
    return Object.fromEntries(ids.map(id => [id, w]));
  }
  if (typeof domainWeights === 'object' && domainWeights != null) return domainWeights;
  throw new Error(`Unknown domainWeights: ${domainWeights}`);
}
