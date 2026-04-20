// public/practice/picker.js
// Renders a grid of verified-exam cards. Click launches practice with ?src=.

/** @param {string} repoPath e.g. 'public/exams/cca-f/verified/foo.json'
 *  @returns {string} practice-dir-relative src e.g. '../exams/cca-f/verified/foo.json' */
export function toPracticeSrc(repoPath) {
  if (typeof repoPath !== 'string' || repoPath.length === 0) {
    throw new Error(`toPracticeSrc: invalid path: ${String(repoPath)}`);
  }
  if (repoPath.startsWith('public/')) return '../' + repoPath.slice('public/'.length);
  return repoPath;
}

/** Build card descriptors by merging registry entries with per-exam metadata.
 *  @param {{exams: Array}} registry — parsed verified/index.json
 *  @param {Record<string, any>} examFiles — map of practice-relative src → parsed exam JSON
 *  @returns {Array<{src, seed, source, total, composition?, difficulty?, scenarioSummary?, warnings, builtAt?}>} */
export function buildCardData(registry, examFiles) {
  const out = [];
  for (const entry of registry.exams || []) {
    const src = toPracticeSrc(entry.path);
    const exam = examFiles[src];
    const meta = exam?.exam_metadata || {};
    const card = {
      src,
      seed: meta.seed ?? entry.seed,
      source: meta.source ?? entry.source ?? 'unknown',
      total: exam?.total ?? entry.total ?? null,
      composition: meta.composition,
      builtAt: exam?.built_at,
      warnings: Array.isArray(meta.coverage_warnings) ? meta.coverage_warnings : [],
    };
    if (meta.difficulty_actual) {
      const d = meta.difficulty_actual;
      card.difficulty = `E${d.easy}/M${d.medium}/H${d.hard}`;
    }
    if (Array.isArray(meta.scenarios_kept) && Array.isArray(meta.scenarios_dropped)) {
      card.scenarioSummary = `${meta.scenarios_kept.length} of ${meta.scenarios_kept.length + meta.scenarios_dropped.length} scenarios`;
    }
    out.push(card);
  }
  return out;
}

// ---------- runtime (skipped when imported by tests) ----------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatCard(card) {
  const badge = `<span class="exam-card__badge">${escapeHtml(card.source)}</span>`;
  const meta = [
    `seed <strong>${escapeHtml(String(card.seed))}</strong>`,
    card.total ? `${card.total} Qs` : null,
    card.difficulty ?? null,
    card.scenarioSummary ?? null,
    card.composition ? escapeHtml(card.composition) : null,
  ].filter(Boolean).join(' · ');
  const warnings = card.warnings.length
    ? `<div class="exam-card__warn">&#9888;&#65039; ${card.warnings.map(escapeHtml).join('; ')}</div>`
    : '';
  return `
    <button class="exam-card" data-src="${escapeHtml(card.src)}" type="button">
      <span class="exam-card__title">Exam · seed ${escapeHtml(String(card.seed))}</span>
      ${badge}
      <span class="exam-card__meta">${meta}</span>
      ${warnings}
      <span class="exam-card__launch">Click to start →</span>
    </button>
  `;
}

async function loadExamFile(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  const grid = document.getElementById('exam-grid');
  if (!grid) return;
  let registry;
  try {
    const res = await fetch('../exams/cca-f/verified/index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    registry = await res.json();
  } catch (e) {
    grid.innerHTML = `<p class="text-soft">Couldn't load verified-exam registry: ${escapeHtml(e.message)}</p>`;
    return;
  }
  if (!registry?.exams?.length) {
    grid.innerHTML = `<p class="text-soft">No verified exams yet. Run <code>node scripts/build-certsafari-exams.mjs --seed &lt;N&gt;</code> to seed some.</p>`;
    return;
  }
  const srcs = registry.exams.map(e => toPracticeSrc(e.path));
  const files = await Promise.all(srcs.map(loadExamFile));
  const examFiles = Object.fromEntries(srcs.map((s, i) => [s, files[i]]).filter(([, v]) => v));
  const cards = buildCardData(registry, examFiles);
  grid.innerHTML = cards.map(formatCard).join('');
  grid.querySelectorAll('.exam-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      if (src) window.location.href = `./index.html?src=${encodeURIComponent(src)}`;
    });
  });
}

if (typeof document !== 'undefined') {
  main();
}
