#!/usr/bin/env node

/**
 * scan.mjs — Zero-token portal scanner
 *
 * Fetches Greenhouse, Ashby, and Lever APIs directly, applies title
 * filters from portals.yml, deduplicates against existing history,
 * and appends new offers to pipeline.md + scan-history.tsv.
 *
 * Zero Claude API tokens — pure HTTP + JSON.
 *
 * Usage:
 *   node scan.mjs                       # US track: scan with max_age_hours (default 48h)
 *   node scan.mjs --intl                # Intl track: writes to data/intl/, uses intl_location_filter
 *   node scan.mjs --dry-run             # preview without writing files
 *   node scan.mjs --company Cohere      # scan a single company
 *   node scan.mjs --max-age-hours 168   # override freshness cutoff (here: last 7 days)
 *   node scan.mjs --all                 # disable the freshness filter entirely
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';
const parseYaml = yaml.load;

// ── Config ──────────────────────────────────────────────────────────

const PORTALS_PATH = 'portals.yml';
const INTL_MODE = process.argv.includes('--intl');
const SCAN_HISTORY_PATH = INTL_MODE ? 'data/intl/scan-history.tsv' : 'data/scan-history.tsv';
const PIPELINE_PATH = INTL_MODE ? 'data/intl/pipeline.md' : 'data/pipeline.md';
const APPLICATIONS_PATH = 'data/applications.md'; // unified tracker across tracks
const LOCATION_FILTER_KEY = INTL_MODE ? 'intl_location_filter' : 'location_filter';
const TRACK_LABEL = INTL_MODE ? 'INTL' : 'US';

// Ensure required directories exist (fresh setup)
mkdirSync(INTL_MODE ? 'data/intl' : 'data', { recursive: true });

const CONCURRENCY = 3;
const FETCH_TIMEOUT_MS = 15_000;

// ── API detection ───────────────────────────────────────────────────

function detectApi(company) {
  // Greenhouse: explicit api field
  if (company.api && company.api.includes('greenhouse')) {
    return { type: 'greenhouse', url: company.api };
  }

  const url = company.careers_url || '';

  // Ashby
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  if (ashbyMatch) {
    return {
      type: 'ashby',
      url: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true`,
    };
  }

  // Lever
  const leverMatch = url.match(/jobs\.lever\.co\/([^/?#]+)/);
  if (leverMatch) {
    return {
      type: 'lever',
      url: `https://api.lever.co/v0/postings/${leverMatch[1]}`,
    };
  }

  // Greenhouse EU boards
  const ghEuMatch = url.match(/job-boards(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/);
  if (ghEuMatch && !company.api) {
    return {
      type: 'greenhouse',
      url: `https://boards-api.greenhouse.io/v1/boards/${ghEuMatch[1]}/jobs`,
    };
  }

  return null;
}

// ── API parsers ─────────────────────────────────────────────────────

function parseGreenhouse(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.absolute_url || '',
    company: companyName,
    location: j.location?.name || '',
    postedAt: j.updated_at || j.first_published || null,
  }));
}

function parseAshby(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.jobUrl || '',
    company: companyName,
    location: j.location || '',
    postedAt: j.publishedAt || null,
  }));
}

function parseLever(json, companyName) {
  if (!Array.isArray(json)) return [];
  return json.map(j => ({
    title: j.text || '',
    url: j.hostedUrl || '',
    company: companyName,
    location: j.categories?.location || '',
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
  }));
}

const PARSERS = { greenhouse: parseGreenhouse, ashby: parseAshby, lever: parseLever };

// ── Fetch with timeout ──────────────────────────────────────────────

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Title filter ────────────────────────────────────────────────────

function buildTitleFilter(titleFilter) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word-boundary match avoids substring false positives
  // (e.g. "AI" matching "maintenance", "Lead" matching "Leader").
  const toRegex = (kw) => new RegExp(`\\b${escape(kw.toLowerCase())}\\b`);
  const positive = (titleFilter?.positive || []).map(toRegex);
  const negative = (titleFilter?.negative || []).map(toRegex);

  return (title) => {
    const lower = title.toLowerCase();
    const hasPositive = positive.length === 0 || positive.some(rx => rx.test(lower));
    const hasNegative = negative.some(rx => rx.test(lower));
    return hasPositive && !hasNegative;
  };
}

// ── Location filter ─────────────────────────────────────────────────

function buildLocationFilter(locationFilter) {
  if (!locationFilter || (!locationFilter.allow?.length && !locationFilter.deny?.length)) {
    return () => true;
  }
  const allow = (locationFilter.allow || []).map(k => k.toLowerCase());
  const deny = (locationFilter.deny || []).map(k => k.toLowerCase());
  const allowUnknown = locationFilter.allow_unknown !== false;

  return (location) => {
    const raw = (location || '').toLowerCase().trim();
    if (!raw) return allowUnknown;
    // Bare "Remote" with no region hint
    if (/^remote$/.test(raw) || /^remote\s*[,-]?\s*$/.test(raw)) return allowUnknown;

    if (deny.some(k => raw.includes(k))) return false;
    if (allow.length === 0) return true;
    return allow.some(k => raw.includes(k));
  };
}

// ── Dedup ───────────────────────────────────────────────────────────

function loadSeenUrls() {
  const seen = new Set();

  // Always dedup against BOTH tracks' scan-history + pipeline so a URL
  // accepted by the US filter doesn't double-add to the intl queue (and vice versa).
  const tsvPaths = ['data/scan-history.tsv', 'data/intl/scan-history.tsv'];
  const pipelinePaths = ['data/pipeline.md', 'data/intl/pipeline.md'];

  for (const tsv of tsvPaths) {
    if (existsSync(tsv)) {
      const lines = readFileSync(tsv, 'utf-8').split('\n');
      for (const line of lines.slice(1)) { // skip header
        const url = line.split('\t')[0];
        if (url) seen.add(url);
      }
    }
  }

  for (const md of pipelinePaths) {
    if (existsSync(md)) {
      const text = readFileSync(md, 'utf-8');
      for (const match of text.matchAll(/- \[[ x!]\] (https?:\/\/\S+)/g)) {
        seen.add(match[1]);
      }
    }
  }

  // applications.md — unified across tracks
  if (existsSync(APPLICATIONS_PATH)) {
    const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
    for (const match of text.matchAll(/https?:\/\/[^\s|)]+/g)) {
      seen.add(match[0]);
    }
  }

  return seen;
}

function loadSeenCompanyRoles() {
  const seen = new Set();
  if (existsSync(APPLICATIONS_PATH)) {
    const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
    // Parse markdown table rows: | # | Date | Company | Role | ...
    for (const match of text.matchAll(/\|[^|]+\|[^|]+\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g)) {
      const company = match[1].trim().toLowerCase();
      const role = match[2].trim().toLowerCase();
      if (company && role && company !== 'company') {
        seen.add(`${company}::${role}`);
      }
    }
  }
  return seen;
}

// ── Pipeline writer ─────────────────────────────────────────────────

function appendToPipeline(offers) {
  if (offers.length === 0) return;

  let text = readFileSync(PIPELINE_PATH, 'utf-8');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dateHeader = `### ${today}`;
  const lines = offers.map(o => `- [ ] ${o.url} | ${o.company} | ${o.title} | ${o.location || 'N/A'}`).join('\n');

  // Locate Pendientes section bounds
  const pendMarker = '## Pendientes';
  const procMarker = '## Procesadas';
  const pendIdx = text.indexOf(pendMarker);
  const procIdx = text.indexOf(procMarker);

  if (pendIdx === -1) {
    // No Pendientes section — create one before Procesadas (or at end)
    const insertAt = procIdx === -1 ? text.length : procIdx;
    const block = `## Pendientes\n\n${dateHeader}\n\n${lines}\n\n`;
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  } else {
    // Pendientes exists — find today's date subsection or create it at end of Pendientes
    const pendEnd = procIdx === -1 ? text.length : procIdx;
    const pendSection = text.slice(pendIdx, pendEnd);
    const dateInPend = pendSection.indexOf(dateHeader);

    if (dateInPend !== -1) {
      // Today's section exists — append after the last entry of that subsection
      const headerAbsIdx = pendIdx + dateInPend;
      const afterHeader = headerAbsIdx + dateHeader.length;
      // Find next ### or ## marker, or end of Pendientes
      const restOfPend = text.slice(afterHeader, pendEnd);
      const nextSubIdx = restOfPend.search(/\n###\s|\n##\s/);
      const insertAt = nextSubIdx === -1 ? pendEnd : afterHeader + nextSubIdx;
      // Trim trailing whitespace before insert point
      let endOfBlock = insertAt;
      while (endOfBlock > 0 && /\s/.test(text[endOfBlock - 1])) endOfBlock--;
      const block = `\n${lines}\n`;
      text = text.slice(0, endOfBlock) + block + text.slice(endOfBlock);
    } else {
      // No today's section — create at end of Pendientes
      let insertAt = pendEnd;
      // Trim trailing whitespace before Procesadas (or EOF)
      while (insertAt > 0 && /\s/.test(text[insertAt - 1])) insertAt--;
      const block = `\n\n${dateHeader}\n\n${lines}\n`;
      text = text.slice(0, insertAt) + block + (procIdx === -1 ? '' : '\n' + text.slice(insertAt).replace(/^\s*/, ''));
    }
  }

  writeFileSync(PIPELINE_PATH, text, 'utf-8');
}

function appendToScanHistory(offers, date) {
  // Ensure file + header exist
  if (!existsSync(SCAN_HISTORY_PATH)) {
    writeFileSync(SCAN_HISTORY_PATH, 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n', 'utf-8');
  }

  const lines = offers.map(o =>
    `${o.url}\t${date}\t${o.source}\t${o.title}\t${o.company}\tadded`
  ).join('\n') + '\n';

  appendFileSync(SCAN_HISTORY_PATH, lines, 'utf-8');
}

// ── Parallel fetch with concurrency limit ───────────────────────────

async function parallelFetch(tasks, limit) {
  const results = [];
  let i = 0;

  async function next() {
    while (i < tasks.length) {
      const task = tasks[i++];
      results.push(await task());
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => next());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const companyFlag = args.indexOf('--company');
  const filterCompany = companyFlag !== -1 ? args[companyFlag + 1]?.toLowerCase() : null;
  const ageFlag = args.indexOf('--max-age-hours');
  const cliMaxAgeHours = ageFlag !== -1 ? Number(args[ageFlag + 1]) : null;
  const disableAgeFilter = args.includes('--all');

  // 1. Read portals.yml
  if (!existsSync(PORTALS_PATH)) {
    console.error('Error: portals.yml not found. Run onboarding first.');
    process.exit(1);
  }

  const config = parseYaml(readFileSync(PORTALS_PATH, 'utf-8'));
  const companies = config.tracked_companies || [];
  const titleFilter = buildTitleFilter(config.title_filter);
  const locationConfig = config[LOCATION_FILTER_KEY];
  if (!locationConfig) {
    console.error(`Error: ${LOCATION_FILTER_KEY} block missing from portals.yml. Add it or remove --intl.`);
    process.exit(1);
  }
  const locationFilter = buildLocationFilter(locationConfig);

  const maxAgeHours = disableAgeFilter
    ? null
    : (cliMaxAgeHours != null && !Number.isNaN(cliMaxAgeHours)
        ? cliMaxAgeHours
        : (typeof config.max_age_hours === 'number' ? config.max_age_hours : null));
  const ageCutoffMs = maxAgeHours != null ? Date.now() - maxAgeHours * 3_600_000 : null;

  // 2. Filter to enabled companies with detectable APIs
  const targets = companies
    .filter(c => c.enabled !== false)
    .filter(c => !filterCompany || c.name.toLowerCase().includes(filterCompany))
    .map(c => ({ ...c, _api: detectApi(c) }))
    .filter(c => c._api !== null);

  const skippedCount = companies.filter(c => c.enabled !== false).length - targets.length;

  console.log(`Scanning ${targets.length} companies via API (${skippedCount} skipped — no API detected)`);
  if (dryRun) console.log('(dry run — no files will be written)\n');

  // 3. Load dedup sets
  const seenUrls = loadSeenUrls();
  const seenCompanyRoles = loadSeenCompanyRoles();

  // 4. Fetch all APIs
  const date = new Date().toISOString().slice(0, 10);
  let totalFound = 0;
  let totalFiltered = 0;
  let totalDupes = 0;
  let totalStale = 0;
  let totalOutOfRegion = 0;
  const newOffers = [];
  const errors = [];

  const tasks = targets.map(company => async () => {
    const { type, url } = company._api;
    try {
      const json = await fetchJson(url);
      const jobs = PARSERS[type](json, company.name);
      totalFound += jobs.length;

      for (const job of jobs) {
        if (!titleFilter(job.title)) {
          totalFiltered++;
          continue;
        }
        if (!locationFilter(job.location)) {
          totalOutOfRegion++;
          continue;
        }
        if (ageCutoffMs != null && job.postedAt) {
          const postedMs = Date.parse(job.postedAt);
          if (!Number.isNaN(postedMs) && postedMs < ageCutoffMs) {
            totalStale++;
            continue;
          }
        }
        if (seenUrls.has(job.url)) {
          totalDupes++;
          continue;
        }
        const key = `${job.company.toLowerCase()}::${job.title.toLowerCase()}`;
        if (seenCompanyRoles.has(key)) {
          totalDupes++;
          continue;
        }
        // Mark as seen to avoid intra-scan dupes
        seenUrls.add(job.url);
        seenCompanyRoles.add(key);
        newOffers.push({ ...job, source: `${type}-api` });
      }
    } catch (err) {
      errors.push({ company: company.name, error: err.message });
    }
  });

  await parallelFetch(tasks, CONCURRENCY);

  // 5. Write results
  if (!dryRun && newOffers.length > 0) {
    appendToPipeline(newOffers);
    appendToScanHistory(newOffers, date);
  }

  // 6. Print summary
  console.log(`\n${'━'.repeat(45)}`);
  console.log(`Portal Scan [${TRACK_LABEL}] — ${date}`);
  console.log(`${'━'.repeat(45)}`);
  console.log(`Companies scanned:     ${targets.length}`);
  console.log(`Total jobs found:      ${totalFound}`);
  console.log(`Filtered by title:     ${totalFiltered} removed`);
  console.log(`Outside region:        ${totalOutOfRegion} removed`);
  if (ageCutoffMs != null) {
    console.log(`Older than ${maxAgeHours}h:     ${totalStale} skipped`);
  }
  console.log(`Duplicates:            ${totalDupes} skipped`);
  console.log(`New offers added:      ${newOffers.length}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) {
      console.log(`  ✗ ${e.company}: ${e.error}`);
    }
  }

  if (newOffers.length > 0) {
    console.log('\nNew offers:');
    for (const o of newOffers) {
      console.log(`  + ${o.company} | ${o.title} | ${o.location || 'N/A'}`);
    }
    if (dryRun) {
      console.log('\n(dry run — run without --dry-run to save results)');
    } else {
      console.log(`\nResults saved to ${PIPELINE_PATH} and ${SCAN_HISTORY_PATH}`);
    }
  }

  console.log(`\n→ Run /career-ops pipeline to evaluate new offers.`);
  console.log('→ Share results and get help: https://discord.gg/8pRpHETxa4');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
