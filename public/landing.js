// public/landing.js — populates question-bank stats on the landing page.
// Reads from the unified bank at exams/cca-f/bank.json (the same source the
// Practice and Dungeon surfaces use). Fails silently if the bank is missing.

async function populate() {
  try {
    const res = await fetch('exams/cca-f/bank.json');
    if (!res.ok) return;
    const bank = await res.json();
    const totalEl = document.getElementById('stat-total');
    const domainEl = document.getElementById('stat-domains');
    if (totalEl) totalEl.textContent = String(bank.total);
    if (domainEl) domainEl.textContent = String(Object.keys(bank.domains || {}).length);
  } catch { /* ignore — leave placeholders */ }
}

populate();
