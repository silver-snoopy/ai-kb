import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  discoverCerts,
  countNotesInDomain,
  daysUntil,
  parseMockExam,
  sparkline,
} from './dashboard.mjs';

async function makeTempVault() {
  return mkdtemp(join(tmpdir(), 'ai-kb-test-'));
}

describe('dashboard', () => {
  it('discovers certs from meta.yaml files', async () => {
    const vault = await makeTempVault();
    const cert = join(vault, 'certs', 'cca-f');
    await mkdir(cert, { recursive: true });
    await writeFile(join(cert, 'meta.yaml'), `id: cca-f
name: Test Cert
provider: Anthropic
target_date: '2026-05-31'
exam:
  question_count: 60
  time_limit_minutes: 120
  passing_score: 720
  scale_max: 1000
  format: mcq
  cost_usd: 99
domains:
  - { id: domain-1, name: D1, weight: 1.0 }
resources: []
`);
    const certs = await discoverCerts(vault);
    expect(certs).toHaveLength(1);
    expect(certs[0].id).toBe('cca-f');
  });

  it('counts notes per domain by frontmatter match', async () => {
    const vault = await makeTempVault();
    const d = join(vault, 'certs', 'cca-f', 'domain-1');
    await mkdir(d, { recursive: true });
    await writeFile(join(d, 'note1.md'), `---
cert: cca-f
domain: domain-1
status: done
---

Body`);
    await writeFile(join(d, 'note2.md'), `---
cert: cca-f
domain: domain-1
status: in-progress
---

Body`);
    // file without frontmatter should NOT be counted
    await writeFile(join(d, 'README.md'), '# README\nno frontmatter here');

    const count = await countNotesInDomain(vault, 'cca-f', 'domain-1');
    expect(count).toBe(2);
  });

  it('computes days until target', () => {
    // 2026-04-18 -> 2026-05-31 = 43 days
    const days = daysUntil('2026-05-31', new Date(Date.UTC(2026, 3, 18)));
    expect(days).toBe(43);
  });

  it('parses mock exam frontmatter', async () => {
    const vault = await makeTempVault();
    const r = join(vault, 'report.md');
    await writeFile(r, `---
cert: cca-f
mode: study
date: 2026-04-18T10:00:00Z
score: 42
total: 60
pass: false
---

Body`);
    const info = await parseMockExam(r);
    expect(info.score).toBe(42);
    expect(info.total).toBe(60);
    expect(info.pass).toBe(false);
    expect(info.mode).toBe('study');
  });

  it('renders sparkline of correct visible length', () => {
    const s = sparkline([30, 50, 70]);
    // The spark chars are in the BMP; counting code points is safe via spread
    expect([...s]).toHaveLength(3);
  });
});
