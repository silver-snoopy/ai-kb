// scripts/build-questions.mjs
//
// Extracts all ```question blocks from vault notes into a single questions.json
// consumed by public/practice/ and public/review/ web apps.
//
// A ```question block is a fenced code block with language tag "question"
// containing YAML with keys: id, domain, difficulty, stem, options (A-D),
// correct, explanation, source-note.
//
// Output: public/questions.json at repo root.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const vault = resolve(scriptDir, '..');

// Domain metadata (slug -> display). Pulled from certs/cca-f/meta.yaml.
const DOMAIN_META = {
  'domain-1-agentic':           { num: 1, name: 'Agentic Architecture & Orchestration', weight: 0.27, color: '#f39c4a' }, // orange
  'domain-2-claude-code':       { num: 2, name: 'Claude Code Configuration & Workflows', weight: 0.20, color: '#a87cf0' }, // purple
  'domain-3-prompt-engineering':{ num: 3, name: 'Prompt Engineering & Structured Output', weight: 0.20, color: '#5db5f0' }, // blue
  'domain-4-mcp':               { num: 4, name: 'Tool Design & MCP Integration', weight: 0.18, color: '#5ad1a0' }, // green
  'domain-5-context':           { num: 5, name: 'Context Management & Reliability', weight: 0.15, color: '#e85d75' }, // pink
};

// Tolerates Windows CRLF line endings and trailing whitespace/info-string after
// the `question` fence tag. Without the `\r?` the regex silently drops every
// question in a CRLF-committed vault file on Windows.
const BLOCK_RE = /```question[^\r\n]*\r?\n([\s\S]*?)\r?\n```/g;

function extractQuestionsFromText(text, sourcePath) {
  const out = [];
  for (const m of text.matchAll(BLOCK_RE)) {
    try {
      const q = parseYaml(m[1]);
      if (!q || typeof q !== 'object') continue;
      if (!q.id || !q.stem || !q.options || !q.correct) continue;
      q.source_file = sourcePath;
      if (typeof q.options === 'object' && !Array.isArray(q.options)) {
        // normalize options dict {A,B,C,D} to array [A,B,C,D] for UI consumption
        q.options_array = ['A', 'B', 'C', 'D'].map(k => q.options[k]).filter(Boolean);
      } else if (Array.isArray(q.options)) {
        q.options_array = q.options;
      }
      out.push(q);
    } catch (e) {
      console.error(`  YAML parse fail in ${sourcePath}: ${e.message}`);
    }
  }
  return out;
}

async function main() {
  const files = await glob('certs/*/domain-*/**.md', { cwd: vault, posix: true, nodir: true });
  const all = [];
  for (const rel of files.sort()) {
    const text = await readFile(join(vault, rel), 'utf-8');
    const qs = extractQuestionsFromText(text, rel);
    all.push(...qs);
  }

  // Build per-domain counts
  const byDomain = {};
  for (const q of all) {
    const d = q.domain || 'unknown';
    byDomain[d] = (byDomain[d] || 0) + 1;
  }

  const output = {
    built_at: new Date().toISOString(),
    total: all.length,
    by_domain: byDomain,
    domains: DOMAIN_META,
    questions: all,
  };

  const outPath = join(vault, 'public', 'questions.json');
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(output, null, 2));

  console.log(`\u2713 ${outPath}`);
  console.log(`  total: ${all.length}`);
  for (const [d, c] of Object.entries(byDomain).sort()) {
    console.log(`  ${d}: ${c}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
