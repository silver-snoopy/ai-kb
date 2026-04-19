// public/review/app.js
// SM-2-lite spaced-repetition flashcards. States: 'landing' | 'card' | 'done'
//
// Storage (localStorage key 'srs-state'):
//   { version: 1, cards: { [qid]: { ease, interval, reps, due, last_rating, last_reviewed_at } } }
//
// "Mastered" = reps >= 3 AND last_rating in ['good','easy'].

const app = document.getElementById('app');
const STORAGE_KEY = 'srs-state';

let data = null;
let session = null; // { cards, current, initialLength, revealed, reviewedIds, mastersDuringSession }

// ---------- data load ----------

async function load() {
  try {
    const res = await fetch('../questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    renderLanding();
  } catch (e) {
    app.innerHTML = `<section class="empty">
      <h2>Could not load question bank</h2>
      <p>Expected <code>../questions.json</code> to exist. Run <code>node scripts/build-questions.mjs</code> from the vault root to regenerate.</p>
      <p class="text-soft">${escapeHtml(e.message)}</p>
    </section>`;
  }
}

// ---------- SRS state ----------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, cards: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.cards && typeof parsed.cards === 'object') {
      return { version: parsed.version || 1, cards: parsed.cards };
    }
  } catch { /* corrupt — reset */ }
  return { version: 1, cards: {} };
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysUtcIso(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.round(days)));
  return d.toISOString().slice(0, 10);
}

function applyRating(questionId, rating) {
  const state = loadState();
  const today = todayUtcIso();
  const nowIso = new Date().toISOString();
  const prev = state.cards[questionId] || { ease: 2.5, interval: 0, reps: 0, due: today };
  let { ease, interval, reps } = prev;
  let dueIn;

  switch (rating) {
    case 'again':
      ease = Math.max(1.3, ease - 0.2);
      reps = 0;
      interval = 0;
      dueIn = 0;
      break;
    case 'hard':
      interval = Math.max(1, Math.round((interval || 1) * 1.2));
      reps = reps + 1;
      dueIn = interval;
      break;
    case 'good': {
      const next = (interval === 0) ? 4 : Math.max(1, Math.round(interval * ease));
      interval = next;
      reps = reps + 1;
      dueIn = interval;
      break;
    }
    case 'easy': {
      const base = (interval === 0) ? 4 : interval;
      ease = Math.min(3.0, ease + 0.15);
      interval = Math.max(1, Math.round(base * ease * 1.3));
      reps = reps + 1;
      dueIn = interval;
      break;
    }
    default:
      throw new Error('Unknown rating: ' + rating);
  }

  ease = Math.max(1.3, Math.min(3.0, ease));
  const due = rating === 'again' ? today : addDaysUtcIso(today, dueIn);

  state.cards[questionId] = { ease, interval, reps, due, last_rating: rating, last_reviewed_at: nowIso };
  saveState(state);
  return state.cards[questionId];
}

function previewIntervalLabel(rating, cardState) {
  const prev = cardState || { ease: 2.5, interval: 0, reps: 0 };
  let { ease, interval } = prev;
  let days;
  switch (rating) {
    case 'again': return '<1d';
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
    default: return '';
  }
  return fmtDays(days);
}

function fmtDays(d) {
  if (d < 7) return d + 'd';
  if (d < 30) return Math.max(1, Math.round(d / 7)) + 'w';
  if (d < 365) return Math.max(1, Math.round(d / 30)) + 'mo';
  return Math.max(1, Math.round(d / 365)) + 'y';
}

function isDueToday(card) {
  if (!card) return true;
  return card.due <= todayUtcIso();
}

function isMastered(card) {
  if (!card) return false;
  return card.reps >= 3 && (card.last_rating === 'good' || card.last_rating === 'easy');
}

function computeStats(state) {
  const today = todayUtcIso();
  let total = data.questions.length;
  let dueToday = 0, newCount = 0, reviewedToday = 0, mastered = 0;
  for (const q of data.questions) {
    const card = state.cards[q.id];
    if (!card) { newCount++; dueToday++; continue; }
    if (card.due <= today) dueToday++;
    if (card.last_reviewed_at && card.last_reviewed_at.slice(0, 10) === today) reviewedToday++;
    if (isMastered(card)) mastered++;
  }
  return { total, dueToday, newCount, reviewedToday, mastered };
}

// ---------- landing ----------

function renderLanding() {
  clearKeyHandler();
  const state = loadState();
  const stats = computeStats(state);

  const statCell = (value, label, mod = '') => `
    <div class="stat ${mod}">
      <p class="stat__value">${value}</p>
      <p class="stat__label">${label}</p>
    </div>
  `;

  const strip = `
    <div class="stat-strip" role="group" aria-label="Review statistics">
      ${statCell(stats.total, 'Total')}
      ${statCell(stats.dueToday, 'Due', stats.dueToday > 0 ? 'stat--accent' : '')}
      ${statCell(stats.newCount, 'New')}
      ${statCell(stats.reviewedToday, 'Today')}
      ${statCell(stats.mastered, 'Mastered', stats.mastered > 0 ? 'stat--success' : '')}
    </div>
  `;

  const body = stats.dueToday > 0
    ? `<div class="queue-cta">
         <div class="queue-cta__copy">
           <h2><span class="mono">${stats.dueToday}</span> card${stats.dueToday === 1 ? '' : 's'} in the queue</h2>
           <p><span class="mono">${stats.newCount}</span> new &middot; <span class="mono">${stats.dueToday - stats.newCount}</span> returning for another pass.</p>
         </div>
         <div class="queue-cta__action">
           <button class="btn btn--primary btn--lg" id="start-btn">Begin review</button>
           <span class="queue-cta__hint">Space reveals &middot; 1&ndash;4 rates</span>
         </div>
       </div>`
    : `<div class="all-caught-up">
         <h2>Nothing due today.</h2>
         <p>Come back tomorrow, or drill wrong answers in <a href="../practice/">Practice</a> to surface new cards.</p>
         <a href="../practice/" class="btn btn--secondary">Open practice</a>
       </div>`;

  app.innerHTML = `
    <section class="landing">
      <div>
        <h2 class="section-label">Today</h2>
        ${strip}
      </div>
      ${body}
    </section>
  `;

  const startBtn = app.querySelector('#start-btn');
  startBtn?.addEventListener('click', startSession);
  startBtn?.focus();

  setKeyHandler(e => {
    if (startBtn && !startBtn.disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      startSession();
    }
  });
}

// ---------- session ----------

function pickQueue() {
  const state = loadState();
  const due = data.questions.filter(q => isDueToday(state.cards[q.id]));
  // Shuffle
  const a = [...due];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startSession() {
  const queue = pickQueue();
  if (!queue.length) { renderLanding(); return; }
  session = {
    cards: queue,
    current: 0,
    initialLength: queue.length,
    revealed: false,
    reviewedIds: new Set(),
  };
  renderCard();
}

function renderCard() {
  if (!session || session.current >= session.cards.length) {
    renderSessionDone();
    return;
  }
  const q = session.cards[session.current];
  const meta = data.domains[q.domain] || { num: '?', name: q.domain };
  const total = session.initialLength;
  const shown = Math.min(session.current + 1, total);
  const progressPct = Math.min(100, (session.current / total) * 100);

  const cardState = loadState().cards[q.id] || null;
  const revealedBlock = session.revealed ? renderRevealed(q, cardState) : renderHint();

  app.innerHTML = `
    <div class="session-progress">
      <div class="session-head">
        <span class="tracker">Card <span class="mono">${shown}</span> / <span class="mono">${total}</span></span>
        <button class="btn btn--ghost" id="abandon-btn">End session</button>
      </div>
      <div class="progress"><div class="progress__fill" style="width: ${progressPct}%"></div></div>
    </div>

    <article class="flashcard">
      <header class="flashcard__meta">
        <span class="mono-badge" data-domain="${escapeAttr(q.domain)}">
          <span class="mono-badge__dot"></span>
          <span>D${meta.num} &middot; ${escapeHtml(meta.name)}</span>
        </span>
      </header>
      <p class="flashcard__stem">${formatStem(q.stem)}</p>
      ${revealedBlock}
    </article>
  `;

  app.querySelector('#abandon-btn')?.addEventListener('click', () => {
    if (confirm('End this session and return to the queue view?')) {
      session = null;
      renderLanding();
    }
  });

  if (session.revealed) {
    app.querySelectorAll('.rating-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRating(btn.dataset.rating));
    });
    // focus first rating button
    app.querySelector('.rating-btn')?.focus();
  } else {
    const prompt = app.querySelector('.reveal-prompt');
    prompt?.addEventListener('click', reveal);
    prompt?.focus();
  }

  setKeyHandler(e => {
    if (!session.revealed) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); }
      return;
    }
    const idx = ['1', '2', '3', '4'].indexOf(e.key);
    if (idx !== -1) {
      const ratings = ['again', 'hard', 'good', 'easy'];
      handleRating(ratings[idx]);
    }
  });
}

function renderHint() {
  return `
    <button type="button" class="reveal-prompt" aria-label="Reveal answer">
      Click or press <span class="kbd">Space</span> to reveal answer
    </button>
  `;
}

function renderRevealed(q, cardState) {
  const idx = ['A', 'B', 'C', 'D'].indexOf(q.correct);
  const correctText = q.options_array?.[idx] ?? q.options?.[q.correct] ?? '';
  const src = q['source-note'];

  const rating = (r, label, kbd) => `
    <button class="rating-btn" data-rating="${r}" type="button">
      <span class="rating-btn__name">${label}</span>
      <span class="rating-btn__interval">${previewIntervalLabel(r, cardState)}</span>
      <span class="rating-btn__kbd">${kbd}</span>
    </button>
  `;

  return `
    <section class="reveal" aria-live="polite">
      <div class="reveal__answer">
        <span class="reveal__letter">${q.correct}</span>
        <span class="reveal__text">${escapeHtml(correctText)}</span>
      </div>

      ${q.explanation ? `
        <div class="reveal__why">
          <p class="reveal__why-label">Why</p>
          <div class="reveal__body">${formatProse(q.explanation)}</div>
        </div>
      ` : ''}

      ${src ? `<p class="reveal__source">${escapeHtml(src)}</p>` : ''}

      <div class="rating-row" role="group" aria-label="Rate how well you knew this">
        ${rating('again', 'Again', '1')}
        ${rating('hard',  'Hard',  '2')}
        ${rating('good',  'Good',  '3')}
        ${rating('easy',  'Easy',  '4')}
      </div>
    </section>
  `;
}

function reveal() {
  if (!session || session.revealed) return;
  session.revealed = true;
  renderCard();
}

function handleRating(rating) {
  if (!session || !session.revealed) return;
  const q = session.cards[session.current];
  applyRating(q.id, rating);
  session.reviewedIds.add(q.id);
  if (rating === 'again') {
    // Re-queue at the end of the current session for immediate re-drill (Anki-style).
    session.cards.push(q);
  }
  session.current++;
  session.revealed = false;
  renderCard();
}

// ---------- session done ----------

function renderSessionDone() {
  clearKeyHandler();
  const state = loadState();
  const stats = computeStats(state);
  const reviewedCount = session?.reviewedIds.size || 0;
  session = null;

  app.innerHTML = `
    <section class="session-done">
      <h2>Session complete.</h2>
      <p><span class="mono">${reviewedCount}</span> card${reviewedCount === 1 ? '' : 's'} reviewed &middot;
         <span class="mono">${stats.dueToday}</span> still due &middot;
         <span class="mono">${stats.mastered}</span> mastered.</p>
      <div class="session-done__actions">
        ${stats.dueToday > 0
          ? `<button class="btn btn--primary" id="continue-btn">Continue</button>`
          : `<button class="btn btn--primary" id="home-btn">Back to overview</button>`}
        <a class="btn btn--secondary" href="../practice/">Switch to practice</a>
      </div>
    </section>
  `;

  app.querySelector('#continue-btn')?.addEventListener('click', startSession);
  app.querySelector('#home-btn')?.addEventListener('click', renderLanding);
  (app.querySelector('#continue-btn') || app.querySelector('#home-btn'))?.focus();
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
  return escapeHtml(stem).replace(/\n\n+/g, '</p><p class="flashcard__stem">').replace(/\n/g, '<br>');
}

function formatProse(text) {
  if (!text) return '';
  const safe = escapeHtml(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  return `<p>${safe}</p>`;
}

load();
