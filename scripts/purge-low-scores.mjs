#!/usr/bin/env node
// Purge ANY line in the pipeline files that mentions a score < 3.0,
// regardless of checkbox state ([x] processed, [!] filter-slip breadcrumb,
// or [ ] pending).
//
// Patterns matched and stripped:
//   - `- [x] ... | 2.4/5 | ...`        (Procesadas low-score row)
//   - `- [!] ... (2.4/5 ...; SKIP)`   (Pendientes filter-slip breadcrumb)
//   - `- [ ] ... | 2.4/5 | ...`        (unprocessed row with score, rare)
//
// Idempotent. Run on both pipelines.
// Usage: node scripts/purge-low-scores.mjs

import { readFileSync, writeFileSync, existsSync } from 'fs';

const FILES = ['data/pipeline.md', 'data/intl/pipeline.md'];
// Match any "X.X/5" token where X is 0, 1, or 2 (sub-3.0)
const LOW_SCORE_RE = /\b[012]\.\d\/5\b/;

for (const path of FILES) {
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, 'utf-8').split('\n');
  const kept = [];
  let removed = 0;
  for (const l of lines) {
    // Only strip checkbox lines (- [x], - [!], - [ ]) — never strip headers/comments
    if (/^-\s*\[[ x!]\]/.test(l) && LOW_SCORE_RE.test(l)) {
      removed++;
      continue;
    }
    kept.push(l);
  }
  // Collapse runs of blank lines
  const out = kept.join('\n').replace(/\n{3,}/g, '\n\n');
  writeFileSync(path, out, 'utf-8');
  console.log(`${path}: removed ${removed} line(s) mentioning score < 3.0`);
}
