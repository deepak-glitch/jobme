#!/usr/bin/env node
// cleanup-low-scores.mjs — DELETE all artifacts for evaluations with score < 3.0.
//
// USER RULE (binding): Jobs scoring < 3.0 must not be persisted anywhere.
// - Reports are DELETED (not archived) from reports/
// - Tracker rows are DELETED from data/applications.md
// - Pipeline `- [x]` rows are DELETED from data/pipeline.md AND data/intl/pipeline.md
// - Tracker-addition TSVs are DELETED from batch/tracker-additions/ (incl. merged/)
// - Any stray PDFs in output/{date}/ and output-intl/{date}/ are DELETED
//
// `data/discarded.tsv` remains as a thin audit log (one row per deleted item,
// metadata only — no JD content, no scores beyond the threshold trigger).
//
// Safe to run multiple times — idempotent.
// Run:  node cleanup-low-scores.mjs
//       node cleanup-low-scores.mjs --dry-run   (preview without changes)

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, appendFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DRY = process.argv.includes('--dry-run');
const APPLICATIONS = 'data/applications.md';
const PIPELINES = ['data/pipeline.md', 'data/intl/pipeline.md'];
const DISCARDED_LOG = 'data/discarded.tsv';
const REPORTS_DIR = 'reports';
const TRACKER_ADDITIONS_DIR = 'batch/tracker-additions';
const OUTPUT_DIRS = ['output', 'output-intl'];
const THRESHOLD = 3.0;
const today = new Date().toISOString().slice(0, 10);

if (!existsSync(APPLICATIONS)) {
  console.error(`Not found: ${APPLICATIONS}`);
  process.exit(1);
}

// Ensure discarded log has a header
if (!DRY && !existsSync(DISCARDED_LOG)) {
  writeFileSync(DISCARDED_LOG, 'discarded_date\tnum\tdate_evaluated\tcompany\trole\tscore\tstatus\treport_path\tnote\n');
}

const tryUnlink = (p) => {
  try {
    if (existsSync(p)) {
      if (!DRY) unlinkSync(p);
      return true;
    }
  } catch (e) { console.error(`  ⚠️  couldn't delete ${p}: ${e.message}`); }
  return false;
};

// ── 1. Scan applications.md for low-score rows ──────────────────────
const lines = readFileSync(APPLICATIONS, 'utf-8').split('\n');
const kept = [];
const discarded = [];

for (const line of lines) {
  const m = line.match(/^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)\/5\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|\s*(.+?)\s*\|\s*$/);
  if (!m) {
    kept.push(line);
    continue;
  }
  const [, num, evalDate, company, role, score, status, pdf, reportPath, note] = m;
  const s = parseFloat(score);
  if (s >= THRESHOLD) {
    kept.push(line);
    continue;
  }
  discarded.push({ num, evalDate, company: company.trim(), role: role.trim(), score: s, status: status.trim(), pdf: pdf.trim(), reportPath: reportPath.trim(), note: note.trim() });
}

if (discarded.length > 0) {
  console.log(`Found ${discarded.length} applications.md row(s) below ${THRESHOLD}/5:`);
  for (const d of discarded) {
    console.log(`  #${d.num}  ${d.company.padEnd(28)}  ${d.role.slice(0, 40).padEnd(40)}  ${d.score}/5`);
  }
}

// ── 2. Find any leaked low-score reports in reports/ NOT yet in applications.md ──
const orphanReports = [];
if (existsSync(REPORTS_DIR)) {
  for (const f of readdirSync(REPORTS_DIR)) {
    if (!f.endsWith('.md')) continue;
    const p = join(REPORTS_DIR, f);
    if (statSync(p).isDirectory()) continue;
    try {
      const text = readFileSync(p, 'utf-8');
      const scoreM = text.match(/^\*\*Score:\*\*\s*([\d.]+)\/5/m);
      if (scoreM && parseFloat(scoreM[1]) < THRESHOLD) {
        // not yet in `discarded` list?
        const numM = f.match(/^(\d{3})/);
        if (numM && !discarded.find(d => d.num === numM[1])) {
          orphanReports.push({ path: p, file: f, num: numM[1] });
        }
      }
    } catch {}
  }
}
if (orphanReports.length > 0) {
  console.log(`Found ${orphanReports.length} orphan low-score report(s) in reports/ (not tracked in applications.md):`);
  for (const o of orphanReports) console.log(`  ${o.path}`);
}

// ── 3. Below-threshold archive cleanup (legacy directory should not exist anymore) ──
const LEGACY_ARCHIVE = 'reports/below-threshold';
let legacyCount = 0;
if (existsSync(LEGACY_ARCHIVE)) {
  for (const f of readdirSync(LEGACY_ARCHIVE)) {
    if (f.endsWith('.md')) {
      tryUnlink(join(LEGACY_ARCHIVE, f));
      legacyCount++;
    }
  }
  if (legacyCount > 0) console.log(`Deleted ${legacyCount} legacy archived report(s) from ${LEGACY_ARCHIVE}/`);
}

if (DRY) {
  let pBelow = 0;
  for (const path of PIPELINES) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf-8').split('\n')) {
      const m = line.match(/^-\s*\[x\].*\|\s*([\d.]+)\/5\s*\|/);
      if (m && parseFloat(m[1]) < THRESHOLD) pBelow++;
    }
  }
  console.log(`\nPipelines (US+Intl) would have ${pBelow} row(s) removed.`);
  console.log('(dry run — re-run without --dry-run to apply)');
  process.exit(0);
}

// ── 4. Rewrite applications.md without low-score rows ─────────────
if (discarded.length > 0) writeFileSync(APPLICATIONS, kept.join('\n'), 'utf-8');

// ── 5. Delete reports + TSVs + PDFs for each low-score evaluation ──
const allTargets = [...discarded, ...orphanReports.map(o => ({ num: o.num, reportPath: o.path, evalDate: null, company: 'orphan', role: 'orphan', score: 0, status: '', note: '' }))];

for (const d of allTargets) {
  // Delete the report file
  tryUnlink(d.reportPath);

  // Delete tracker-addition TSV(s) matching this number
  for (const tsvDir of [TRACKER_ADDITIONS_DIR, join(TRACKER_ADDITIONS_DIR, 'merged')]) {
    if (!existsSync(tsvDir)) continue;
    for (const f of readdirSync(tsvDir)) {
      if (f.startsWith(`${d.num}-`) && f.endsWith('.tsv')) {
        tryUnlink(join(tsvDir, f));
      }
    }
  }

  // Delete any stray PDF in output/{date}/ and output-intl/{date}/
  const slugMatch = (d.reportPath || '').match(/reports\/\d+-(.+?)-\d{4}-\d{2}-\d{2}\.md/);
  if (slugMatch && d.evalDate) {
    for (const outRoot of OUTPUT_DIRS) {
      const pdfPath = `${outRoot}/${d.evalDate}/cv-your-name-${slugMatch[1]}-${d.evalDate}.pdf`;
      tryUnlink(pdfPath);
    }
  }

  // Log to discarded.tsv (audit only — no JD content)
  const row = [today, d.num, d.evalDate || '', d.company, d.role, `${d.score}/5`, d.status, d.reportPath, d.note].join('\t');
  appendFileSync(DISCARDED_LOG, row + '\n');
}

// ── 6. Strip low-score `- [x]` rows from BOTH pipelines ──
let totalPipelineRemoved = 0;
for (const path of PIPELINES) {
  if (!existsSync(path)) continue;
  const pLines = readFileSync(path, 'utf-8').split('\n');
  const pKept = [];
  let pRemoved = 0;
  for (const line of pLines) {
    const m = line.match(/^-\s*\[x\].*\|\s*([\d.]+)\/5\s*\|/);
    if (m && parseFloat(m[1]) < THRESHOLD) {
      pRemoved++;
      continue;
    }
    pKept.push(line);
  }
  if (pRemoved > 0) {
    const out = pKept.join('\n').replace(/\n{3,}/g, '\n\n');
    writeFileSync(path, out, 'utf-8');
    console.log(`Removed ${pRemoved} below-threshold row(s) from ${path}`);
  }
  totalPipelineRemoved += pRemoved;
}

// ── Summary ──
console.log('');
console.log(`✅ Deleted ${allTargets.length} report file(s)`);
console.log(`✅ Removed ${discarded.length} row(s) from ${APPLICATIONS}`);
console.log(`✅ Removed ${totalPipelineRemoved} row(s) from US+Intl pipelines`);
console.log(`✅ Deleted matching TSVs from ${TRACKER_ADDITIONS_DIR}/{,merged/}`);
console.log(`✅ Logged ${allTargets.length} discard(s) to ${DISCARDED_LOG}`);
console.log(`\nRun 'node verify-pipeline.mjs' to confirm clean state.`);
