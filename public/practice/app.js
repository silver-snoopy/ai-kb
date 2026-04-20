// public/practice/app.js
// MCQ practice quiz over the unified CCA-F bank. States: 'setup' | 'quiz' | 'results'
//
// Data source: ../exams/cca-f/bank.json (flat array with per-question
// domain + scenario tags). Filter UI lets the user intersect domain and
// scenario selections; disabled chips prevent empty-pool sessions.

import {
  filterBank,
  countByAxis,
  buildDrillSession,
  buildMockExam,
} from '../exams/arrangement.js';

const app = document.getElementById('app');

let bank = null;
let selectedDomains = new Set();    // empty = all
let selectedScenarios = new Set();  // empty = all
let quiz = null; // { questions, current, answers, startedAt }

// ---------- data load ----------

async function load() {
  const src = new URLSearchParams(location.search).get('src') || '../exams/cca-f/bank.json';
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    bank = await res.json();
    renderSetup();
  } catch (e) {
    app.innerHTML = `<section class="empty">
      <h2>Could not load question bank</h2>
      <p>Expected <code>${escapeHtml(src)}</code> to exist. Run <code>node scripts/build-bank.mjs</code> then <code>node scripts/classify-scenarios.mjs</code> from the vault root to regenerate.</p>
      <p class="text-soft">${escapeHtml(e.message)}</p>
    </section>`;
  }
}

// ---------- setup screen ----------

function activeFilters() {
  return {
    domains: selectedDomains.size ? [...selectedDomains] : undefined,
    scenarios: selectedScenarios.size ? [...selectedScenarios] : undefined,
  };
}

function filteredPool() {
  return filterBank(bank, activeFilters());
}

function domainNumber(slug) {
  const m = bank.domains?.[slug];
  return m ? `D${m.num}` : '?';
}

function renderSetup() {
  clearKeyHandler();
  document.body.classList.remove('is-session-active');

  const counts = countByAxis(bank, activeFilters());
  const pool = filteredPool();
  const count = pool.length;
  const sessionLen = Math.min(count, 25);

  // Domain chips with live counts (reflecting current scenario selection).
  const allDomainsActive = selectedDomains.size === 0 ? 'is-active' : '';
  const totalUnderScenario = Object.values(counts.byDomain).reduce((a, b) => a + b, 0);
  const domainChips = [
    `<button class="filter-chip ${allDomainsActive}" data-axis="domain" data-value="">
      <span>All domains</span>
      <span class="filter-chip__count">${totalUnderScenario}</span>
    </button>`,
    ...Object.entries(bank.domains)
      .sort(([, a], [, b]) => a.num - b.num)
      .map(([slug, meta]) => {
        const n = counts.byDomain[slug] || 0;
        const active = selectedDomains.has(slug) ? 'is-active' : '';
        const disabled = n === 0 && !selectedDomains.has(slug) ? 'disabled' : '';
        return `<button class="filter-chip ${active}" data-axis="domain" data-value="${slug}" ${disabled}>
          <span class="filter-chip__dot"></span>
          <span>D${meta.num} · ${escapeHtml(meta.name)}</span>
          <span class="filter-chip__count">${n}</span>
        </button>`;
      }),
  ].join('');

  // Scenario chips with live counts (reflecting current domain selection).
  const allScenariosActive = selectedScenarios.size === 0 ? 'is-active' : '';
  const totalUnderDomain = Object.values(counts.byScenario).reduce((a, b) => a + b, 0);
  const scenarioChips = [
    `<button class="filter-chip ${allScenariosActive}" data-axis="scenario" data-value="">
      <span>All scenarios</span>
      <span class="filter-chip__count">${totalUnderDomain}</span>
    </button>`,
    ...Object.entries(bank.scenarios || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, meta]) => {
        const n = counts.byScenario[id] || 0;
        const active = selectedScenarios.has(id) ? 'is-active' : '';
        const disabled = n === 0 && !selectedScenarios.has(id) ? 'disabled' : '';
        return `<button class="filter-chip ${active}" data-axis="scenario" data-value="${id}" ${disabled}>
          <span class="filter-chip__dot"></span>
          <span>S${id} · ${escapeHtml(meta.name)}</span>
          <span class="filter-chip__count">${n}</span>
        </button>`;
      }),
  ].join('');

  app.innerHTML = `
    <section class="setup">
      <div>
        <h2 class="section-label">Domain</h2>
        <div class="filter-chips" role="group" aria-label="Domain filter">
          ${domainChips}
        </div>
      </div>

      <div>
        <h2 class="section-label">Scenario</h2>
        <div class="filter-chips" role="group" aria-label="Scenario filter">
          ${scenarioChips}
        </div>
      </div>

      <div class="session-setup">
        <p class="session-summary">
          <span class="mono">${count}</span> question${count === 1 ? '' : 's'} in filtered pool &middot;
          session of <span class="mono">${sessionLen}</span>
        </p>
        <div class="session-actions">
          <button class="btn btn--primary btn--lg" id="start-btn" ${count ? '' : 'disabled'}>
            Begin session
          </button>
          <button class="btn btn--secondary" id="mock-btn" title="60 questions, 4 of 6 scenarios, domain-weighted like the real exam">
            Mock exam (60 Qs)
          </button>
        </div>
      </div>
    </section>
  `;

  app.querySelectorAll('.filter-chip').forEach(chip => {
    if (chip.hasAttribute('disabled')) return;
    chip.addEventListener('click', () => {
      const axis = chip.dataset.axis;
      const v = chip.dataset.value;
      const set = axis === 'domain' ? selectedDomains : selectedScenarios;
      if (v === '') set.clear();
      else set.has(v) ? set.delete(v) : set.add(v);
      renderSetup();
    });
  });

  app.querySelector('#start-btn')?.addEventListener('click', startQuiz);
  app.querySelector('#mock-btn')?.addEventListener('click', startMockExam);
  app.querySelector('#start-btn')?.focus();

  setKeyHandler(e => {
    if (e.key === 'Enter' && count > 0) startQuiz();
  });
}

// ---------- quiz engine ----------

function startQuiz() {
  const picked = buildDrillSession(bank, {
    ...activeFilters(),
    size: 25,
    seed: Date.now(),
  });
  if (!picked.length) return;
  quiz = {
    questions: picked,
    current: 0,
    answers: new Array(picked.length).fill(null),
    startedAt: Date.now(),
  };
  renderQuestion();
}

function startMockExam() {
  const picked = buildMockExam(bank, { size: 60, scenarioCount: 4, seed: Date.now() });
  if (!picked.length) return;
  quiz = {
    questions: picked,
    current: 0,
    answers: new Array(picked.length).fill(null),
    startedAt: Date.now(),
  };
  renderQuestion();
}

function renderQuestion() {
  document.body.classList.add('is-session-active');
  const q = quiz.questions[quiz.current];
  const total = quiz.questions.length;
  const meta = bank.domains[q.domain] || { num: '?', name: q.domain };
  const progressPct = (quiz.current / total) * 100;
  const given = quiz.answers[quiz.current];
  const correct = q.correct;
  const revealed = given !== null;

  const options = ['A', 'B', 'C', 'D'].map(letter => {
    const text = q.options?.[letter];
    if (text == null || text === '') return '';
    let cls = 'option';
    if (revealed) {
      if (letter === correct) cls += ' is-correct';
      else if (letter === given) cls += ' is-wrong';
      else cls += ' is-muted';
    }
    return `<li>
      <button class="${cls}" data-letter="${letter}" ${revealed ? 'disabled' : ''}>
        <span class="option__letter">${letter}</span>
        <span class="option__text">${escapeHtml(text)}</span>
      </button>
    </li>`;
  }).join('');

  const verdict = revealed ? `
    <div class="verdict ${given === correct ? 'verdict--correct' : 'verdict--wrong'}">
      <p class="verdict__label">
        ${given === correct
          ? 'Correct'
          : `Incorrect &middot; answer is ${correct}`}
      </p>
      ${q.explanation ? `<div class="verdict__body">${formatProse(q.explanation)}</div>` : ''}
      ${q.source_note ? `<p class="verdict__source">${escapeHtml(q.source_note)}</p>` : ''}
    </div>
  ` : '';

  const footer = revealed ? `
    <div class="quiz-foot">
      <button class="btn btn--primary" id="next-btn">
        ${quiz.current + 1 < total ? 'Next question' : 'See results'}
      </button>
    </div>
  ` : '';

  const scenarioName = bank.scenarios?.[q.scenario]?.name ?? `Scenario ${q.scenario}`;

  app.innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-head">
        <span class="tracker">Q <span class="mono">${quiz.current + 1}</span> / <span class="mono">${total}</span></span>
        <button class="btn btn--ghost" id="abandon-btn">End session</button>
      </div>
      <div class="progress"><div class="progress__fill" style="width: ${progressPct}%"></div></div>
    </div>

    <article class="question">
      <header class="question__meta">
        <span class="mono-badge" data-domain="${escapeAttr(q.domain)}">
          <span class="mono-badge__dot"></span>
          <span>${escapeHtml(domainNumber(q.domain))} &middot; ${escapeHtml(meta.name)}</span>
        </span>
        <span class="mono-badge" data-scenario="${escapeAttr(q.scenario)}">
          <span>S${escapeHtml(q.scenario)} &middot; ${escapeHtml(scenarioName)}</span>
        </span>
      </header>
      <p class="question__stem">${formatStem(q.stem)}</p>
      <ol class="options" role="radiogroup" aria-label="Options">${options}</ol>
      ${verdict}
    </article>

    ${footer}
  `;

  app.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (quiz.answers[quiz.current] !== null) return;
      quiz.answers[quiz.current] = btn.dataset.letter;
      renderQuestion();
    });
  });
  app.querySelector('#abandon-btn')?.addEventListener('click', () => {
    if (confirm('End the session now and see results?')) renderResults();
  });
  const nextBtn = app.querySelector('#next-btn');
  nextBtn?.addEventListener('click', advance);
  (revealed ? nextBtn : app.querySelector('.option'))?.focus();

  setKeyHandler(e => {
    if (!revealed) {
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1) {
        const letter = ['A', 'B', 'C', 'D'][idx];
        const btn = app.querySelector(`.option[data-letter="${letter}"]`);
        btn && btn.click();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advance();
    }
  });
}

function advance() {
  const total = quiz.questions.length;
  if (quiz.current + 1 < total) { quiz.current++; renderQuestion(); }
  else { renderResults(); }
}

// ---------- results ----------

function renderMissedQuestions(wrong) {
  if (wrong.length === 0) return '<p class="text-soft">No missed questions — all answered items were correct.</p>';
  const items = wrong.map(({ q, given }) => {
    const correctText = q.options[q.correct] ?? '';
    const givenText = given != null ? (q.options[given] ?? '') : '(unanswered)';
    const stem = q.stem.length > 300 ? q.stem.slice(0, 300) + '…' : q.stem;
    return `
      <li class="missed-item">
        <p class="missed-item__stem">${escapeHtml(stem)}</p>
        <dl class="missed-item__ans">
          <dt>Your answer</dt><dd><span class="mono">${escapeHtml(given ?? '—')}</span> ${escapeHtml(givenText)}</dd>
          <dt>Correct</dt><dd><span class="mono">${escapeHtml(q.correct)}</span> ${escapeHtml(correctText)}</dd>
        </dl>
        <details class="missed-item__explain">
          <summary>Why</summary>
          <p>${escapeHtml(q.explanation)}</p>
        </details>
      </li>
    `;
  }).join('');
  return `
    <details class="missed-section">
      <summary><strong>${wrong.length}</strong> missed question${wrong.length === 1 ? '' : 's'}</summary>
      <ol class="missed-list">${items}</ol>
    </details>
  `;
}

function renderResults() {
  clearKeyHandler();
  document.body.classList.add('is-session-active');
  const answered = quiz.answers.map((a, i) => ({ q: quiz.questions[i], given: a }));
  const correctCount = answered.filter(x => x.given === x.q.correct).length;
  const total = answered.length;
  const pct = Math.round((correctCount / total) * 100);
  const pass = pct >= 72;

  const perDomain = {};
  for (const { q, given } of answered) {
    const slug = q.domain;
    if (!perDomain[slug]) perDomain[slug] = { correct: 0, total: 0 };
    perDomain[slug].total++;
    if (given === q.correct) perDomain[slug].correct++;
  }

  const wrong = answered.filter(x => x.given !== null && x.given !== x.q.correct);
  let existing = [];
  try {
    const raw = localStorage.getItem('weakness-queue');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existing = parsed;
    }
  } catch (e) {
    console.warn('weakness-queue was corrupt; starting fresh.', e);
  }
  const merged = [...existing];
  for (const { q, given } of wrong) {
    if (!merged.find(e => e.id === q.id)) {
      merged.push({
        id: q.id,
        domain: q.domain,
        scenario: q.scenario,
        stem: q.stem.slice(0, 200),
        correct: q.correct,
        given,
        saved_at: new Date().toISOString(),
      });
    }
  }
  try { localStorage.setItem('weakness-queue', JSON.stringify(merged)); } catch { /* ignore */ }

  const rows = Object.entries(perDomain)
    .sort(([a], [b]) => (bank.domains[a]?.num ?? 99) - (bank.domains[b]?.num ?? 99))
    .map(([slug, { correct, total: t }]) => {
      const meta = bank.domains[slug] || { name: slug, num: '?' };
      const p = Math.round((correct / t) * 100);
      return `<div class="domain-row">
        <dt class="mono-badge" data-domain="${escapeAttr(slug)}">
          <span class="mono-badge__dot"></span>
          <span>${escapeHtml(domainNumber(slug))}</span>
        </dt>
        <dd class="domain-row__name">${escapeHtml(meta.name)}</dd>
        <dd class="domain-row__score">${correct} / ${t}</dd>
        <dd class="domain-row__pct">${p}%</dd>
      </div>`;
    }).join('');

  app.innerHTML = `
    <section class="results">
      <div class="score">
        <p class="score__eyebrow">Session complete</p>
        <h2 class="score__main">
          <span class="score__pct">${pct}<span class="text-soft">%</span></span>
          <span class="score__verdict ${pass ? 'score__verdict--pass' : 'score__verdict--fail'}">${pass ? 'Pass' : 'Below threshold'}</span>
        </h2>
        <p class="score__sub"><span class="mono">${correctCount}</span> of <span class="mono">${total}</span> correct &middot; passing threshold <span class="mono">72%</span></p>
      </div>

      <h3 class="section-label">Per-domain</h3>
      <dl class="domain-table">${rows}</dl>

      ${renderMissedQuestions(wrong)}

      ${wrong.length ? `
        <p class="weakness">
          Saved <span class="mono">${wrong.length}</span> wrong answer${wrong.length === 1 ? '' : 's'} to the local weakness queue
          &middot; <span class="mono">${merged.length}</span> total.
        </p>
      ` : ''}

      <div class="results-actions">
        <button class="btn btn--primary" id="retry-btn">Another session</button>
        <button class="btn btn--secondary" id="review-wrong-btn" ${wrong.length ? '' : 'disabled'}>
          Drill wrong answers
        </button>
      </div>
    </section>
  `;

  app.querySelector('#retry-btn')?.addEventListener('click', renderSetup);
  app.querySelector('#review-wrong-btn')?.addEventListener('click', () => {
    if (!wrong.length) return;
    quiz = {
      questions: wrong.map(w => w.q),
      current: 0,
      answers: new Array(wrong.length).fill(null),
      startedAt: Date.now(),
    };
    renderQuestion();
  });
  app.querySelector('#retry-btn')?.focus();
}

// ---------- keyboard handler lifecycle ----------

let _keyHandler = null;

function setKeyHandler(fn) {
  clearKeyHandler();
  _keyHandler = (e) => {
    if (e.target?.matches('input, textarea, [contenteditable]')) return;
    fn(e);
  };
  document.addEventListener('keydown', _keyHandler);
}

function clearKeyHandler() {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = null;
}

// ---------- text formatting ----------

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) { return escapeHtml(s); }

function formatStem(stem) {
  return escapeHtml(stem).replace(/\n\n+/g, '</p><p class="question__stem">').replace(/\n/g, '<br>');
}

function formatProse(text) {
  if (!text) return '';
  const safe = escapeHtml(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  return `<p>${safe}</p>`;
}

load();
