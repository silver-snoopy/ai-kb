import type { SessionLog } from '../types';

export function downloadSessionLog(log: SessionLog): void {
  const filename = sessionFilename(log);
  const json = JSON.stringify(log, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sessionFilename(log: SessionLog): string {
  const startedIso = log.started_at ?? new Date().toISOString();
  // Sanitize ONLY the ISO timestamp for filesystem safety (replace : and .
  // which are illegal or problematic on Windows/macOS filenames). Then append
  // .json — we want the dot for the extension to survive.
  const safeTs = startedIso.replace(/[:.]/g, '-');
  return `slay-the-cert_${log.cert_id}_${log.mode}_${safeTs}.json`;
}
