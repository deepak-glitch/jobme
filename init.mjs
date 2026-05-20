#!/usr/bin/env node

// init.mjs — Interactive first-run setup for career-ops.
// Copies *.example / *.template files into their live paths, asks for the
// 5 essentials (name, email, location, target role, salary target), and
// writes a working starter profile.yml + cv.md.
//
// Idempotent: existing user files are never overwritten. Re-running only
// fills in what's missing.

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const isTTY = stdout.isTTY;
const green = (s) => isTTY ? `\x1b[32m${s}\x1b[0m` : s;
const yellow = (s) => isTTY ? `\x1b[33m${s}\x1b[0m` : s;
const dim = (s) => isTTY ? `\x1b[2m${s}\x1b[0m` : s;
const bold = (s) => isTTY ? `\x1b[1m${s}\x1b[0m` : s;

const nonInteractive = !stdin.isTTY || process.argv.includes('--yes') || process.argv.includes('-y');
const rl = nonInteractive ? null : createInterface({ input: stdin, output: stdout });
const ask = async (prompt, fallback = '') => {
  if (nonInteractive) {
    stdout.write(`${prompt}: ${dim(`${fallback} (default)`)}\n`);
    return fallback;
  }
  const answer = (await rl.question(`${prompt}${fallback ? dim(` [${fallback}]`) : ''}: `)).trim();
  return answer || fallback;
};

const created = [];
const skipped = [];

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyIfMissing(src, dst, label) {
  const srcAbs = join(root, src);
  const dstAbs = join(root, dst);
  if (existsSync(dstAbs)) {
    skipped.push(`${dst} ${dim('(already exists)')}`);
    return false;
  }
  if (!existsSync(srcAbs)) {
    skipped.push(`${dst} ${yellow(`(no template at ${src})`)}`);
    return false;
  }
  ensureDir(dirname(dstAbs));
  copyFileSync(srcAbs, dstAbs);
  created.push(`${dst} ${dim(`← ${src}`)}`);
  return true;
}

function writeIfMissing(dst, content, label) {
  const dstAbs = join(root, dst);
  if (existsSync(dstAbs)) {
    skipped.push(`${dst} ${dim('(already exists)')}`);
    return false;
  }
  ensureDir(dirname(dstAbs));
  writeFileSync(dstAbs, content);
  created.push(`${dst} ${dim('(generated)')}`);
  return true;
}

function patchProfileYaml(answers) {
  const yamlPath = join(root, 'config', 'profile.yml');
  if (!existsSync(yamlPath)) return;
  let yaml = readFileSync(yamlPath, 'utf8');

  const replacements = [
    [/full_name:\s*"[^"]*"/, `full_name: "${answers.fullName}"`],
    [/email:\s*"[^"]*"/, `email: "${answers.email}"`],
    [/location:\s*"[^"]*"/m, `location: "${answers.location}"`],
  ];
  for (const [pattern, replacement] of replacements) {
    yaml = yaml.replace(pattern, replacement);
  }

  // Replace the first two entries under target_roles.primary (handle CRLF and LF)
  yaml = yaml.replace(
    /(target_roles:[\s\S]*?primary:\s*\r?\n)(\s*-\s*"[^"]*"\s*\r?\n\s*-\s*"[^"]*"\s*\r?\n)/,
    `$1    - "${answers.targetRole}"\n`
  );

  yaml = yaml.replace(
    /target_range:\s*"[^"]*"/,
    `target_range: "${answers.compTarget}"`
  );

  writeFileSync(yamlPath, yaml);
}

function patchCvStub(answers) {
  const cvPath = join(root, 'cv.md');
  if (!existsSync(cvPath)) return;
  let cv = readFileSync(cvPath, 'utf8');
  cv = cv.replace(/^# Your Name/m, `# ${answers.fullName}`);
  cv = cv.replace(/your\.email@example\.com/g, answers.email);
  cv = cv.replace(/Your City, State/g, answers.location);
  writeFileSync(cvPath, cv);
}

function ensureApplicationsMd() {
  const p = 'data/applications.md';
  const header = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`;
  writeIfMissing(p, header);
}

function ensurePipelineMd() {
  const p = 'data/pipeline.md';
  const header = `# Pipeline Inbox

Paste job URLs or local JD paths here, one per line. Career-ops will pick
them up on the next \`/career-ops pipeline\` run.

Format:
  - https://example.com/jobs/123
  - local:jds/some-jd.md
`;
  writeIfMissing(p, header);
}

async function main() {
  console.log(bold('\ncareer-ops — first-run setup\n'));
  console.log(dim('Press Enter to accept defaults. Re-running this script is safe — existing files are never overwritten.\n'));

  const fullName = await ask('Your full name', 'Jane Smith');
  const email = await ask('Email', 'jane@example.com');
  const location = await ask('Location (City, Country)', 'Remote');
  const targetRole = await ask('Primary target role', 'Senior AI Engineer');
  const compTarget = await ask('Target total comp (range)', '$150K-200K');
  if (rl) rl.close();

  const answers = { fullName, email, location, targetRole, compTarget };

  // Copy templates into live paths (idempotent)
  copyIfMissing('cv.example.md', 'cv.md');
  copyIfMissing('config/profile.example.yml', 'config/profile.yml');
  copyIfMissing('templates/portals.example.yml', 'portals.yml');
  copyIfMissing('modes/_profile.template.md', 'modes/_profile.md');
  copyIfMissing('article-digest.example.md', 'article-digest.md');

  // Bootstrap tracker + inbox if missing
  ensureApplicationsMd();
  ensurePipelineMd();

  // Patch the just-created files with the user's answers (only if we just made them)
  if (created.some(c => c.startsWith('config/profile.yml'))) patchProfileYaml(answers);
  if (created.some(c => c.startsWith('cv.md'))) patchCvStub(answers);

  console.log(`\n${bold('Created:')}`);
  if (created.length === 0) console.log(dim('  (nothing — your files are already in place)'));
  for (const c of created) console.log(`  ${green('+')} ${c}`);

  if (skipped.length > 0) {
    console.log(`\n${bold('Skipped:')}`);
    for (const s of skipped) console.log(`  ${dim('·')} ${s}`);
  }

  console.log(`\n${bold('Next steps:')}`);
  console.log('  1. Edit cv.md with your real experience');
  console.log('  2. Review config/profile.yml (archetypes, narrative, proof points)');
  console.log('  3. Customize portals.yml with your target companies / role keywords');
  console.log('  4. Run: npm run doctor   (verifies prerequisites)');
  console.log('  5. Open Claude Code (or your AI CLI) in this folder and try: /career-ops\n');
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message);
  if (rl) rl.close();
  process.exit(1);
});
