// public/review/app.js
// Dark-theme SRS flashcard app (SM-2-lite).
// State lives in localStorage under key 'srs-state'.
// Modes: 'landing' | 'reviewing' | 'done' | 'empty'.

const app = document.getElementById('app');
const STORAGE_KEY = 'srs-state';

let data = null;
let session = null;      // { cards: [...], current: 0, revealed: false, ratings: [] }
let keyHandler = null;   // global keydown binding; cleared on re-render

// ---------- bootstrap ----------

async function load() {
  try {
    const res = await fetch('../questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    renderLanding();
  } catch (e) {
    app.innerHTML = `<div class="empty-state">
      <div class="empty-icon">&#x26A0;</div>
      <h2>Could not load question bank</h2>
      <p>Expected <code>../questions.json</code> to exist.</p>
      <p class="error-detail">${escapeHtml(e.message)}</p>
    </div>`;
  }
}

// ---------- SRS state helpers ----------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, cards: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.cards) {
      return { version: 1, cards: {} };
    }
    return parsed;
  } catch {
    return { version: 1, cards: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayUtcIso() {
  // 'YYYY-MM-DD' in UTC
  return new Date().toISOString().slice(0, 10);
}

function addDaysUtcIso(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isDue(card) {
  if (!card) return true; // new cards are always due
  return card.due <= todayUtcIso();
}

function isMastered(card) {
  if (!card) return false;
  return card.reps >= 3 && (card.last_rating === 'good' || card.last_rating === 'easy');
}

// ---------- stats ----------

function computeStats(state) {
  const today = todayUtcIso();
  let total = data.questions.length;
  let dueToday = 0;
  let newCount = 0;
  let reviewedToday = 0;
  let mastered = 0;

  for (const q of data.questions) {
    const card = state.cards[q.id];
    if (!card) {
      newCount++;
      dueToday++;
      continue;
    }
    if (card.due <= today) dueToday++;
    if (card.last_reviewed_at && card.last_reviewed_at.slice(0, 10) === today) reviewedToday++;
    if (isMastered(card)) mastered++;
  }
  return { total, dueToday, newCount, reviewedToday, mastered };
}

// ---------- build session queue ----------

function buildQueue(state) {
  const today = todayUtcIso();
  const due = [];
  for (const q of data.questions) {
    const card = state.cards[q.id];
    if (!card || card.due <= today) {
      due.push(q);
    }
  }
  return shuffle(due);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- SM-2-lite rating ----------

function applyRating(state, questionId, rating) {
  const existing = state.cards[questionId];
  const prev = existing || {
    ease: 2.5,
    interval: 0,
    reps: 0,
    due: todayUtcIso(),
    last_rating: null,
    last_reviewed_at: null,
  };
  const nowIso = new Date().toISOString();
  const today = todayUtcIso();

  let ease = prev.ease;
  let interval = prev.interval;
  let reps = prev.reps;
  let dueIn; // days from today

  switch (rating) {
    case 'again':
      // Reset: card is "not yet successfully reviewed." Next Good/Easy reseeds
      // interval from 4d. Session handler re-queues it immediately for re-drill.
      ease = Math.max(1.3, ease - 0.2);
      reps = 0;
      interval = 0;
      dueIn = 0; // due today
      break;
    case 'hard':
      // interval * 1.2, min 1d; ease unchanged; reps++
      interval = Math.max(1, Math.round((interval || 1) * 1.2));
      reps = reps + 1;
      dueIn = interval;
      break;
    case 'good': {
      // first time: seed 4d; otherwise interval * ease
      const nextInterval = (interval === 0) ? 4 : Math.round(interval * ease);
      interval = Math.max(1, nextInterval);
      reps = reps + 1;
      dueIn = interval;
      break;
    }
    case 'easy': {
      const base = (interval === 0) ? 4 : interval;
      const nextInterval = Math.round(base * ease * 1.3);
      interval = Math.max(1, nextInterval);
      ease = Math.min(3.0, ease + 0.15);
      reps = reps + 1;
      dueIn = interval;
      break;
    }
    default:
      throw new Error('Unknown rating: ' + rating);
  }

  ease = Math.max(1.3, Math.min(3.0, ease));

  const due = rating === 'again' ? today : addDaysUtcIso(today, dueIn);

  state.cards[questionId] = {
    ease,
    interval,
    reps,
    due,
    last_rating: rating,
    last_reviewed_at: nowIso,
  };
  return state.cards[questionId];
}

// Preview the real interval this rating would produce for this specific card,
// without mutating state. Mirrors the math in applyRating so the button label
// matches what actually gets scheduled.
function previewIntervalLabel(rating, cardState) {
  const prev = cardState || { ease: 2.5, interval: 0, reps: 0 };
  let ease = prev.ease;
  let interval = prev.interval;
  let days;
  switch (rating) {
    case 'again':
      return '<1d';
    case 'hard':
      days = Math.max(1, Math.round((interval || 1) * 1.2));
      break;
    case 'good':
      days = (interval === 0) ? 4 : Math.max(1, Math.round(interval * ease));
      break;
    case 'easy': {
      const base = (interval === 0) ? 4 : interval;
      const nextEase = Math.min(3.0, ease + 0.15);
      days = Math.max(1, Math.round(base * nextEase * 1.3));
      break;
    }
    default:
      return '';
  }
  return fmtDays(days);
}

function fmtDays(d) {
  if (d < 7) return d + 'd';
  if (d < 30) return Math.max(1, Math.round(d / 7)) + 'w';
  if (d < 365) return Math.max(1, Math.round(d / 30)) + 'mo';
  return Math.max(1, Math.round(d / 365)) + 'y';
}

// ---------- rendering: landing ----------

function renderLanding() {
  clearKeyHandler();
  const state = loadState();
  const stats = computeStats(state);
  const hasDue = stats.dueToday > 0;

  const statCard = (label, value, cls = '') => `
    <div class="stat-card ${cls}">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;

  app.innerHTML = `
    <section class="stat-grid">
      ${statCard('Total', stats.total)}
      ${statCard('Due Today', stats.dueToday, hasDue ? 'highlight' : '')}
      ${statCard('New', stats.newCount)}
      ${statCard('Reviewed', stats.reviewedToday)}
      ${statCard('Mastered', stats.mastered, stats.mastered > 0 ? 'mastered' : '')}
    </section>

    <section class="landing-card">
      ${hasDue
        ? `<h2>${stats.dueToday} card${stats.dueToday === 1 ? '' : 's'} ready for review</h2>
           <p>${stats.newCount > 0 ? `${stats.newCount} new &middot; ` : ''}${stats.dueToday - stats.newCount} returning</p>
           <button class="btn-primary" id="start-btn">Start Review &rarr;</button>
           <div class="landing-meta">Use <span class="kbd-inline">Space</span> to reveal, <span class="kbd-inline">1&ndash;4</span> to rate.</div>`
        : `<h2>All caught up</h2>
           <p>Nothing due today. Come back tomorrow &mdash; or practice some questions in the meantime.</p>
           <button class="btn-primary" id="start-btn" disabled>Start Review &rarr;</button>
           <div class="nav-bar" style="margin-top: 24px;">
             <a href="../practice/" class="btn-secondary" style="text-decoration: none; display: inline-block;">Go to Practice &rarr;</a>
           </div>`
      }
    </section>
  `;

  const btn = app.querySelector('#start-btn');
  if (btn && hasDue) {
    btn.addEventListener('click', startSession);
  }
}

// ---------- rendering: session ----------

function startSession() {
  const state = loadState();
  const queue = buildQueue(state);
  if (queue.length === 0) {
    renderLanding();
    return;
  }
  session = {
    cards: queue,
    current: 0,
    revealed: false,
    initialLength: queue.length,
    ratingsCount: 0,
  };
  renderCard();
}

function renderCard() {
  if (!session || session.current >= session.cards.length) {
    renderDone();
    return;
  }
  const q = session.cards[session.current];
  const domain = data.domains[q.domain] || { num: '?', name: q.domain, color: '#999' };
  const total = session.initialLength;
  const shown = session.current + 1;
  const progress = Math.min(100, (session.current / total) * 100);

  const cardState = loadState().cards[q.id] || null;
  const revealedBlock = session.revealed ? renderRevealed(q, cardState) : renderHint();

  app.innerHTML = `
    <div class="review-progress">
      <div class="progress-header">
        <span>Card ${Math.min(shown, total)} of ${total}</span>
        <button class="btn-link" id="abandon-btn">End session</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>

    <section class="flashcard">
      <div class="card-meta">
        <span class="domain-badge" style="--chip-accent: ${domain.color}">
          <span class="chip-dot"></span> Domain ${domain.num} &middot; ${escapeHtml(domain.name)}
        </span>
      </div>
      <div class="card-stem">${formatStem(q.stem)}</div>
      ${revealedBlock}
    </section>
  `;

  if (session.revealed) {
    wireRatingButtons();
  } else {
    const hint = app.querySelector('#reveal-hint');
    if (hint) hint.addEventListener('click', reveal);
  }

  app.querySelector('#abandon-btn')?.addEventListener('click', () => {
    if (confirm('End this review session? Progress so far will be saved.')) {
      session = null;
      renderLanding();
    }
  });

  bindKeys();
}

function renderHint() {
  return `
    <div class="reveal-hint" id="reveal-hint">
      Click or press <span class="kbd">Space</span> to reveal answer
    </div>
  `;
}

function renderRevealed(q, cardState) {
  const correctLetter = q.correct;
  const idx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
  const correctText = q.options_array?.[idx] ?? q.options?.[correctLetter] ?? '';
  const sourceNote = q['source-note'];

  const ratingBtn = (rating, label, kbd) => `
    <button class="rating-btn ${rating}" data-rating="${rating}">
      <span class="rating-name">${label}</span>
      <span class="rating-interval">${previewIntervalLabel(rating, cardState)}</span>
      <span class="rating-kbd">${kbd}</span>
    </button>
  `;

  return `
    <div class="answer-block">
      <div class="correct-answer">
        <span class="correct-letter">${correctLetter}</span>
        <span class="correct-text">${escapeHtml(correctText)}</span>
      </div>

      ${q.explanation ? `
        <div class="explanation">
          <div class="explanation-label">Why</div>
          <div class="explanation-body">${formatExplanation(q.explanation)}</div>
        </div>
      ` : ''}

      ${sourceNote ? `
        <div class="source-cite">Source: <code>${escapeHtml(sourceNote)}</code></div>
      ` : ''}

      <div class="rating-label">How well did you know this?</div>
      <div class="rating-row">
        ${ratingBtn('again', 'Again', '1')}
        ${ratingBtn('hard', 'Hard', '2')}
        ${ratingBtn('good', 'Good', '3')}
        ${ratingBtn('easy', 'Easy', '4')}
      </div>
    </div>
  `;
}

function wireRatingButtons() {
  app.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => rateCurrent(btn.dataset.rating));
  });
}

function reveal() {
  if (!session || session.revealed) return;
  session.revealed = true;
  renderCard();
}

function rateCurrent(rating) {
  if (!session || !session.revealed) return;
  if (!['again', 'hard', 'good', 'easy'].includes(rating)) return;

  const q = session.cards[session.current];
  const state = loadState();
  applyRating(state, q.id, rating);
  saveState(state);
  session.ratingsCount++;

  // If user rated 'again', re-queue the card at the end of this session for instant re-drill.
  if (rating === 'again') {
    session.cards.push(q);
  }

  session.current++;
  session.revealed = false;

  if (session.current >= session.cards.length) {
    renderDone();
  } else {
    renderCard();
  }
}

// ---------- rendering: done ----------

function renderDone() {
  clearKeyHandler();
  const state = loadState();
  const stats = computeStats(state);
  const reviewed = session ? session.ratingsCount : 0;
  session = null;

  app.innerHTML = `
    <section class="done-hero">
      <div class="empty-icon" style="font-size: 48px; margin-bottom: 12px;">&#x2728;</div>
      <h2>Session complete</h2>
      <p>You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. Your SRS state has been saved locally.</p>
      <div class="done-stats">
        <div class="done-stat">
          <div class="done-stat-value">${stats.dueToday}</div>
          <div class="done-stat-label">Still Due</div>
        </div>
        <div class="done-stat">
          <div class="done-stat-value">${stats.reviewedToday}</div>
          <div class="done-stat-label">Reviewed Today</div>
        </div>
        <div class="done-stat">
          <div class="done-stat-value">${stats.mastered}</div>
          <div class="done-stat-label">Mastered</div>
        </div>
      </div>
      <div class="nav-bar">
        ${stats.dueToday > 0
          ? `<button class="btn-primary" id="continue-btn">Continue &rarr;</button>`
          : ''}
        <a href="../practice/" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center;">Go to Practice</a>
        <button class="btn-secondary" id="back-btn">Back to Dashboard</button>
      </div>
    </section>
  `;

  app.querySelector('#continue-btn')?.addEventListener('click', startSession);
  app.querySelector('#back-btn')?.addEventListener('click', renderLanding);
}

// ---------- keyboard ----------

function clearKeyHandler() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function bindKeys() {
  clearKeyHandler();
  keyHandler = (e) => {
    if (!session) return;
    // ignore if user is typing in an input/textarea
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

    if (!session.revealed) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        reveal();
      }
      return;
    }
    // revealed: 1/2/3/4
    const map = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
    if (map[e.key]) {
      e.preventDefault();
      rateCurrent(map[e.key]);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

// ---------- util ----------

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
