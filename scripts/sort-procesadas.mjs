#!/usr/bin/env node
// Sort the date sections within both Pendientes and Procesadas of a pipeline file.
// Default order: newest → oldest (latest date on top).
// Pass `--asc` for oldest → newest.
// Usage: node scripts/sort-procesadas.mjs [path/to/pipeline.md] [--asc]

import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const ascending = args.includes('--asc');
const path = args.find(a => !a.startsWith('--')) || 'data/pipeline.md';

const text = readFileSync(path, 'utf-8');
const lines = text.split('\n');

// Locate ## Pendientes and ## Procesadas section bounds
const pendStart = lines.findIndex(l => /^## Pendientes\b/.test(l));
const procStart = lines.findIndex(l => /^## Procesadas\b/.test(l));

if (pendStart === -1 && procStart === -1) {
  console.error(`No "## Pendientes" or "## Procesadas" in ${path}`);
  process.exit(1);
}

function sortSection(start, end) {
  // start..end is [inclusive, exclusive); start points at "## Pendientes"/"## Procesadas" line
  // Find first ### YYYY-MM-DD line inside the section; everything before it is the section header.
  const sec = lines.slice(start, end);
  const firstDate = sec.findIndex(l => /^### \d{4}-\d{2}-\d{2}/.test(l));
  if (firstDate === -1) return sec; // no date sub-sections — return as-is

  const sectionHeader = sec.slice(0, firstDate); // includes the "## Foo" line + any preamble
  const body = sec.slice(firstDate);

  // Parse date blocks. If the same date appears multiple times, merge them.
  const blocks = new Map(); // date -> array of body lines (excluding the ### header)
  let currentDate = null;
  let currentLines = [];
  const flush = () => {
    if (currentDate) {
      const existing = blocks.get(currentDate) || [];
      blocks.set(currentDate, existing.concat(currentLines));
    }
  };
  for (const l of body) {
    const m = l.match(/^### (\d{4}-\d{2}-\d{2})/);
    if (m) {
      flush();
      currentDate = m[1];
      currentLines = [];
    } else {
      currentLines.push(l);
    }
  }
  flush();

  const sortedDates = [...blocks.keys()].sort();
  if (!ascending) sortedDates.reverse();

  const out = [...sectionHeader];
  for (const d of sortedDates) {
    out.push(`### ${d}`);
    let secLines = blocks.get(d);
    while (secLines.length && secLines[0].trim() === '') secLines.shift();
    while (secLines.length && secLines[secLines.length - 1].trim() === '') secLines.pop();
    out.push(...secLines);
    out.push(''); // blank line between sections
  }
  return out;
}

// Determine section bounds
const endOfFile = lines.length;
const pendEnd = procStart !== -1 ? procStart : endOfFile;
const procEnd = endOfFile;

const before = pendStart === -1
  ? lines.slice(0, procStart === -1 ? endOfFile : procStart)
  : lines.slice(0, pendStart);

const pendBlock = pendStart === -1 ? [] : sortSection(pendStart, pendEnd);
const procBlock = procStart === -1 ? [] : sortSection(procStart, procEnd);

const result = [...before, ...pendBlock, ...procBlock]
  .join('\n')
  .replace(/\n{3,}/g, '\n\n'); // collapse extra blank lines

writeFileSync(path, result, 'utf-8');

const order = ascending ? 'oldest → newest' : 'newest → oldest';
console.log(`Sorted ${path} (${order})`);
if (pendStart !== -1) {
  const pendDates = pendBlock.filter(l => /^### \d{4}-\d{2}-\d{2}/.test(l)).length;
  console.log(`  Pendientes: ${pendDates} date sections`);
}
if (procStart !== -1) {
  const procDates = procBlock.filter(l => /^### \d{4}-\d{2}-\d{2}/.test(l)).length;
  console.log(`  Procesadas: ${procDates} date sections`);
}
