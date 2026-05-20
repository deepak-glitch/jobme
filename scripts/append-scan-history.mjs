#!/usr/bin/env node
import fs from 'node:fs';
const today = '2026-05-19';
const us_entries = [
  ['https://builtin.com/job/ai-engineer/8052132', today, 'WebSearch -- L3 BuiltIn AI Engineer', 'AI Engineer', 'daydream', 'added'],
  ['https://job-boards.greenhouse.io/alphafmcroles/jobs/8521640002', today, 'WebSearch -- L3 Greenhouse FDE', 'Forward Deployed Engineer (AI)', 'Alpha Financial Markets Consulting', 'filter-slip'],
  ['https://jobs.spacetalent.org/companies/defense-unicorns/jobs/78089309-forward-deployed-ai-engineer', today, 'WebSearch -- L3 Spacetalent', 'Forward Deployed AI Engineer', 'Defense Unicorns', 'filter-slip'],
];
const intl_entries = [
  ['https://job-boards.greenhouse.io/arizeai/jobs/5993317004', today, 'WebSearch -- L3 Greenhouse FDE', 'Forward Deployed Engineer, APJ', 'Arize AI', 'added'],
  ['https://jobs.ashbyhq.com/hipeople-official/6c330d7b-7c6d-4993-8893-b58b5289d442', today, 'WebSearch -- L3 Ashby Applied AI', 'Applied AI Engineer -- Systems & Reliability', 'HiPeople', 'added'],
  ['https://job-boards.greenhouse.io/opaquesystems/jobs/4235505009', today, 'WebSearch -- L3 Greenhouse FDE', 'Forward Deployed Engineer (AI)', 'Opaque Systems', 'filter-slip'],
];
for (const row of us_entries) fs.appendFileSync('data/scan-history.tsv', row.join('\t') + '\n');
for (const row of intl_entries) fs.appendFileSync('data/intl/scan-history.tsv', row.join('\t') + '\n');
console.log('appended', us_entries.length + intl_entries.length, 'rows');
