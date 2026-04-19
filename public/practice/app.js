// public/practice/app.js
// MCQ practice quiz powered by vault question blocks.
// State: 'setup' | 'quiz' | 'results'

const app = document.getElementById('app');

let data = null;
let selectedDomains = new Set(); // empty = all
let quiz = null; // { questions: [], current: 0, answers: [], startedAt }

async function load() {
  try {
    const res = await fetch('../questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    renderSetup();
  } catch (e) {
    app.innerHTML = `<div class="empty-state">
      <h2>Could not load question bank</h2>
      <p>Expected <code>../questions.json</code> to exist. Run <code>node scripts/build-questions.mjs</code> from the vault root to regenerate.</p>
      <p class="error-detail">${e.message}</p>
    </div>`;
  }
}

// ---------- SETUP SCREEN ----------

function filteredQuestions() {
  if (!selectedDomains.size) return data.questions;
  return data.questions.filter(q => selectedDomains.has(q.domain));
}

function renderSetup() {
  const total = data.total;
  const byDomain = data.by_domain;
  const domains = data.domains;

  const count = filteredQuestions().length;

  const chipHtml = [
    `<button class="chip ${selectedDomains.size === 0 ? 'active' : ''}" data-domain="">All Domains (${total})</button>`,
    ...Object.entries(domains).map(([slug, meta]) => {
      const n = byDomain[slug] || 0;
      if (n === 0) return '';
      const active = selectedDomains.has(slug) ? 'active' : '';
      return `<button class="chip ${active}" data-domain="${slug}" style="--chip-accent: ${meta.color}">
        <span class="chip-dot"></span>
        ${escapeHtml(meta.name)} (${n})
      </button>`;
    }).join('')
  ].join('');

  app.innerHTML = `
    <section class="setup-card">
      <div class="filter-section">
        <label class="filter-label">Filter by Domain</label>
        <div class="chip-row" id="chip-row">${chipHtml}</div>
      </div>
      <div class="start-bar">
        <span class="selection-count"><strong>${count}</strong> questions selected</span>
        <button class="btn-primary" id="start-btn" ${count ? '' : 'disabled'}>Start Quiz \u2192</button>
      </div>
    </section>

    <section class="info-grid">
      <a href="../review/" class="info-card">
        <span class="info-icon">\ud83c\udf93</span>
        <div>
          <h3>Daily Review</h3>
          <p>Practise flashcards using spaced repetition. Cards you find harder appear more often.</p>
        </div>
      </a>
      <a href="../../certs/cca-f/README.html" class="info-card">
        <span class="info-icon">\ud83d\udcda</span>
        <div>
          <h3>Deep Dive Into Domains</h3>
          <p>Detailed breakdowns of all 5 exam domains with subdomain checklists and anti-patterns.</p>
        </div>
      </a>
      <a href="../../certs/cca-f/_scenarios.html" class="info-card">
        <span class="info-icon">\ud83c\udfaf</span>
        <div>
          <h3>Exam Scenarios</h3>
          <p>Deep-dive scenarios showing CORRECT vs. ANTI-PATTERN architectural decisions.</p>
        </div>
      </a>
      <a href="../../certs/cca-f/_quick-reference.html" class="info-card">
        <span class="info-icon">\u26a1</span>
        <div>
          <h3>Quick Reference</h3>
          <p>Consolidated cheat sheet of decision rules and exam traps by domain.</p>
        </div>
      </a>
    </section>
  `;

  // wire up chips
  app.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const d = chip.dataset.domain;
      if (d === '') {
        selectedDomains.clear();
      } else {
        if (selectedDomains.has(d)) selectedDomains.delete(d);
        else selectedDomains.add(d);
      }
      renderSetup();
    });
  });

  app.querySelector('#start-btn').addEventListener('click', startQuiz);
}

// ---------- QUIZ ENGINE ----------

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
  const domain = data.domains[q.domain] || { num: '?', name: q.domain, color: '#999' };
  const progress = ((quiz.current) / total) * 100;
  const given = quiz.answers[quiz.current]; // null | 'A'|'B'|'C'|'D'
  const correct = q.correct;
  const revealed = given !== null;

  const opts = ['A', 'B', 'C', 'D'].map((letter, i) => {
    const text = q.options_array?.[i] ?? q.options?.[letter] ?? '';
    if (!text) return '';
    let cls = 'option';
    if (revealed) {
      if (letter === correct) cls += ' correct';
      else if (letter === given) cls += ' wrong';
      else cls += ' muted';
    }
    return `<button class="${cls}" data-letter="${letter}" ${revealed ? 'disabled' : ''}>
      <span class="option-letter">${letter}</span>
      <span class="option-text">${escapeHtml(text)}</span>
    </button>`;
  }).join('');

  const explHtml = revealed ? `
    <div class="explanation ${given === correct ? 'correct' : 'wrong'}">
      <div class="explanation-header">
        ${given === correct ? '\u2713 Correct' : '\u2717 Incorrect \u2014 correct answer was ' + correct}
      </div>
      <div class="explanation-body">${formatExplanation(q.explanation)}</div>
      ${q['source-note'] ? `<div class="source-cite">Source: <code>${escapeHtml(q['source-note'])}</code></div>` : ''}
    </div>
  ` : '';

  const nextBtn = revealed ? `
    <div class="nav-bar">
      <button class="btn-primary" id="next-btn">
        ${quiz.current + 1 < total ? 'Next Question \u2192' : 'See Results \u2192'}
      </button>
    </div>
  ` : '';

  app.innerHTML = `
    <div class="quiz-progress">
      <div class="progress-header">
        <span>Question ${quiz.current + 1} of ${total}</span>
        <button class="btn-link" id="abandon-btn">End quiz</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>

    <section class="question-card">
      <div class="question-meta">
        <span class="domain-badge" style="--chip-accent: ${domain.color}">
          <span class="chip-dot"></span> Domain ${domain.num} \u00b7 ${escapeHtml(domain.name)}
        </span>
      </div>
      <div class="question-stem">${formatStem(q.stem)}</div>
      <div class="options">${opts}</div>
      ${explHtml}
    </section>

    ${nextBtn}
  `;

  app.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (quiz.answers[quiz.current] !== null) return;
      quiz.answers[quiz.current] = btn.dataset.letter;
      renderQuestion();
    });
  });
  app.querySelector('#abandon-btn')?.addEventListener('click', () => {
    if (confirm('End the quiz and see your current score?')) renderResults();
  });
  app.querySelector('#next-btn')?.addEventListener('click', () => {
    if (quiz.current + 1 < total) {
      quiz.current++;
      renderQuestion();
    } else {
      renderResults();
    }
  });
}

// ---------- RESULTS ----------

function renderResults() {
  const answered = quiz.answers.map((a, i) => ({ q: quiz.questions[i], given: a }));
  const correctCount = answered.filter(x => x.given === x.q.correct).length;
  const total = answered.length;
  const pct = Math.round((correctCount / total) * 100);

  // per-domain breakdown
  const perDomain = {};
  for (const { q, given } of answered) {
    const slug = q.domain;
    if (!perDomain[slug]) perDomain[slug] = { correct: 0, total: 0 };
    perDomain[slug].total++;
    if (given === q.correct) perDomain[slug].correct++;
  }

  // save wrong answers to localStorage weakness queue
  const wrong = answered.filter(x => x.given !== null && x.given !== x.q.correct);
  let existing = [];
  try {
    const raw = localStorage.getItem('weakness-queue');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existing = parsed;
    }
  } catch (e) {
    console.warn('weakness-queue in localStorage was corrupt; starting fresh.', e);
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
  localStorage.setItem('weakness-queue', JSON.stringify(merged));

  const domainRows = Object.entries(perDomain)
    .sort(([a], [b]) => (data.domains[a]?.num ?? 99) - (data.domains[b]?.num ?? 99))
    .map(([slug, { correct, total: t }]) => {
      const meta = data.domains[slug] || { name: slug, color: '#999' };
      const p = Math.round((correct / t) * 100);
      return `<div class="domain-row">
        <span class="domain-label">
          <span class="chip-dot" style="background: ${meta.color}"></span>
          ${escapeHtml(meta.name)}
        </span>
        <span class="domain-score">${correct}/${t} <span class="muted">(${p}%)</span></span>
      </div>`;
    }).join('');

  const pass = pct >= 72;

  app.innerHTML = `
    <section class="results-card">
      <div class="score-hero ${pass ? 'pass' : 'fail'}">
        <div class="score-big">${pct}<span>%</span></div>
        <div class="score-sub">
          <strong>${correctCount} of ${total}</strong> correct \u2014
          <span class="score-verdict">${pass ? 'PASS' : 'BELOW PASSING (72%)'}</span>
        </div>
      </div>

      <h3>Per-domain breakdown</h3>
      <div class="domain-list">${domainRows}</div>

      ${wrong.length ? `
        <div class="weakness-saved">
          \u2713 Saved ${wrong.length} wrong answer${wrong.length === 1 ? '' : 's'} to your weakness queue (stored locally; ${merged.length} total).
        </div>
      ` : ''}

      <div class="actions">
        <button class="btn-primary" id="retry-btn">Try another quiz \u2192</button>
        <button class="btn-secondary" id="review-wrong-btn" ${wrong.length ? '' : 'disabled'}>
          Review wrong answers
        </button>
      </div>
    </section>
  `;

  app.querySelector('#retry-btn').addEventListener('click', renderSetup);
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
}

// ---------- UTIL ----------

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStem(stem) {
  return escapeHtml(stem).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
}

function formatExplanation(expl) {
  if (!expl) return '';
  const safe = escapeHtml(expl).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  return `<p>${safe}</p>`;
}

load();
