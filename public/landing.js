// public/landing.js — populates question-bank stats on the landing page.
// Falls back gracefully if questions.json is missing or localStorage lacks srs state.

async function populate() {
  try {
    const res = await fetch('questions.json');
    if (!res.ok) return;
    const data = await res.json();
    const totalEl = document.getElementById('stat-total');
    const domainEl = document.getElementById('stat-domains');
    if (totalEl) totalEl.textContent = String(data.total);
    if (domainEl) domainEl.textContent = String(Object.keys(data.by_domain || {}).length);

    // SRS stats
    const dueEl = document.getElementById('stat-due');
    const masteredEl = document.getElementById('stat-mastered');
    let state = null;
    try { state = JSON.parse(localStorage.getItem('srs-state') || 'null'); } catch { /* ignore */ }
    const cards = (state && state.cards) || {};
    const ids = new Set(data.questions.map(q => q.id));
    const today = new Date().toISOString().slice(0, 10);
    let due = 0, mastered = 0;
    for (const q of data.questions) {
      const c = cards[q.id];
      if (!c) { due++; continue; }
      if (c.due && c.due <= today) due++;
      if (c.reps >= 3 && (c.last_rating === 'good' || c.last_rating === 'easy')) mastered++;
    }
    if (dueEl) dueEl.textContent = String(due);
    if (masteredEl) masteredEl.textContent = String(mastered);
  } catch { /* ignore — leave placeholders */ }
}

populate();
