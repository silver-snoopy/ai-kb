// public/practice/app.js
// MCQ practice quiz. States: 'setup' | 'quiz' | 'results'

const app = document.getElementById('app');

let data = null;
let selectedDomains = new Set(); // empty = all
let quiz = null; // { questions, current, answers, startedAt }

// ---------- data load ----------

async function load() {
  const src = new URLSearchParams(location.search).get('src') || '../questions.json';
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    renderSetup();
  } catch (e) {
    app.innerHTML = `<section class="empty">
      <h2>Could not load question bank</h2>
      <p>Expected <code>${escapeHtml(src)}</code> to exist. Run <code>node scripts/build-questions.mjs</code> from the vault root to regenerate, or generate an exam with <code>/generate-exam</code>.</p>
      <p class="text-soft">${escapeHtml(e.message)}</p>
    </section>`;
  }
}

// ---------- setup screen ----------

function filteredQuestions() {
  if (!selectedDomains.size) return data.questions;
  return data.questions.filter(q => selectedDomains.has(q.domain));
}

function domainNumber(slug) {
  const m = data.domains[slug];
  return m ? `D${m.num}` : '?';
}

function renderSetup() {
  clearKeyHandler();
  const count = filteredQuestions().length;
  const sessionLen = Math.min(count, 25);

  const meta = data.exam_metadata;
  const examBanner = meta ? `
      <div class="exam-banner" role="status" style="padding:0.75rem 1rem;margin-bottom:1rem;border:1px solid currentColor;border-radius:6px;font-size:0.9em;">
        <strong>Generated exam</strong> &middot; seed <span class="mono">${escapeHtml(String(meta.seed))}</span> &middot;
        ${Array.isArray(meta.scenarios_kept) && Array.isArray(meta.scenarios_dropped)
          ? `${meta.scenarios_kept.length} of ${meta.scenarios_kept.length + meta.scenarios_dropped.length} scenarios &middot;`
          : typeof meta.composition === 'string'
            ? `${escapeHtml(meta.composition)} &middot;`
            : ''}
        ${meta.difficulty_actual ? `E${meta.difficulty_actual.easy}/M${meta.difficulty_actual.medium}/H${meta.difficulty_actual.hard}` : ''}
        ${meta.coverage_warnings && meta.coverage_warnings.length ? `<div class="text-soft" style="margin-top:0.25rem;">&#9888;&#65039; ${meta.coverage_warnings.map(escapeHtml).join('; ')}</div>` : ''}
      </div>` : '';

  const allActive = selectedDomains.size === 0 ? 'is-active' : '';
  const allChip = `<button class="filter-chip ${allActive}" data-domain="">
    <span>All domains</span>
    <span class="filter-chip__count">${data.total}</span>
  </button>`;

  const domainChips = Object.entries(data.domains)
    .filter(([slug]) => (data.by_domain[slug] || 0) > 0)
    .map(([slug, meta]) => {
      const n = data.by_domain[slug];
      const active = selectedDomains.has(slug) ? 'is-active' : '';
      return `<button class="filter-chip ${active}" data-domain="${slug}">
        <span class="filter-chip__dot"></span>
        <span>${escapeHtml(meta.name)}</span>
        <span class="filter-chip__count">${n}</span>
      </button>`;
    }).join('');

  app.innerHTML = `
    <section class="setup">
      ${examBanner}
      <div>
        <h2 class="section-label">Filter</h2>
        <div class="filter-chips" role="group" aria-label="Domain filter">
          ${allChip}
          ${domainChips}
        </div>
      </div>

      <div class="session-setup">
        <p class="session-summary">
          <span class="mono">${count}</span> question${count === 1 ? '' : 's'} in pool &middot;
          session of <span class="mono">${sessionLen}</span>
        </p>
        <button class="btn btn--primary btn--lg" id="start-btn" ${count ? '' : 'disabled'}>
          Begin session
        </button>
      </div>
    </section>
  `;

  app.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const d = chip.dataset.domain;
      if (d === '') selectedDomains.clear();
      else selectedDomains.has(d) ? selectedDomains.delete(d) : selectedDomains.add(d);
      renderSetup();
    });
  });

  const startBtn = app.querySelector('#start-btn');
  startBtn?.addEventListener('click', startQuiz);
  startBtn?.focus();

  setKeyHandler(e => {
    if (e.key === 'Enter' && !startBtn?.disabled) { startQuiz(); }
  });
}

// ---------- quiz engine ----------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  const pool = filteredQuestions();
  if (!pool.length) return;
  const picked = shuffle(pool).slice(0, Math.min(pool.length, 25));
  quiz = {
    questions: picked,
    current: 0,
    answers: new Array(picked.length).fill(null),
    startedAt: Date.now(),
  };
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.questions[quiz.current];
  const total = quiz.questions.length;
  const meta = data.domains[q.domain] || { num: '?', name: q.domain };
  const progressPct = (quiz.current / total) * 100;
  const given = quiz.answers[quiz.current];
  const correct = q.correct;
  const revealed = given !== null;

  const options = ['A', 'B', 'C', 'D'].map((letter, i) => {
    const text = q.options_array?.[i] ?? q.options?.[letter];
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
      ${q['source-note'] ? `<p class="verdict__source">${escapeHtml(q['source-note'])}</p>` : ''}
    </div>
  ` : '';

  const footer = revealed ? `
    <div class="quiz-foot">
      <button class="btn btn--primary" id="next-btn">
        ${quiz.current + 1 < total ? 'Next question' : 'See results'}
      </button>
    </div>
  ` : '';

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

function renderResults() {
  clearKeyHandler();
  const answered = quiz.answers.map((a, i) => ({ q: quiz.questions[i], given: a }));
  const correctCount = answered.filter(x => x.given === x.q.correct).length;
  const total = answered.length;
  const pct = Math.round((correctCount / total) * 100);
  const pass = pct >= 72;

  // per-domain breakdown
  const perDomain = {};
  for (const { q, given } of answered) {
    const slug = q.domain;
    if (!perDomain[slug]) perDomain[slug] = { correct: 0, total: 0 };
    perDomain[slug].total++;
    if (given === q.correct) perDomain[slug].correct++;
  }

  // save wrongs to localStorage weakness queue (with try/catch)
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
        stem: q.stem.slice(0, 200),
        correct: q.correct,
        given,
        saved_at: new Date().toISOString(),
      });
    }
  }
  try { localStorage.setItem('weakness-queue', JSON.stringify(merged)); } catch { /* ignore */ }

  const rows = Object.entries(perDomain)
    .sort(([a], [b]) => (data.domains[a]?.num ?? 99) - (data.domains[b]?.num ?? 99))
    .map(([slug, { correct, total: t }]) => {
      const meta = data.domains[slug] || { name: slug, num: '?' };
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
