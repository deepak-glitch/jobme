# Mode: overnight — Full Automation Routine

Runs the complete overnight routine end-to-end across **both tracks** (US + Intl):
scan portals, evaluate the top 10 pending URLs per track, merge tracker, verify pipeline integrity, archive low-score reports, and commit + push to `main`.

This is the same prompt used in production by `scripts/overnight-run.sh` and the `.github/workflows/overnight-routine.yml` GitHub Action, just invoked manually instead of by cron.

## Two-track layout

| Track | Pipeline | Scan history | PDFs | Filter |
|-------|----------|--------------|------|--------|
| **US** | `data/pipeline.md` | `data/scan-history.tsv` | `output/{date}/` | `location_filter` in portals.yml |
| **Intl** | `data/intl/pipeline.md` | `data/intl/scan-history.tsv` | `output-intl/{date}/` | `intl_location_filter` in portals.yml |

**Shared across both tracks** (single source of truth):
- `data/applications.md` — unified application tracker (add a Region column when writing entries)
- `reports/` — unified reports folder (each report's header must include `**Region:** US` or `**Region:** Intl`)
- `batch/tracker-additions/` — unified TSV staging area (`merge-tracker.mjs` handles both)
- All `modes/` rules, `cv.md`, `_profile.md`, scoring logic — identical for both tracks

## Execution

**ALWAYS run as a background subagent** — this routine takes 30–90 minutes and would lock up the main conversation context. The router in `SKILL.md` should launch it like:

```
Agent(
  subagent_type="general-purpose",
  prompt="[content of modes/_shared.md]\n\n[content of modes/overnight.md]\n\n[today's date + any session-specific notes]",
  description="career-ops overnight routine",
  run_in_background=True
)
```

After spawning, tell the user the agent is running in the background and you'll report back when it completes.

## Preconditions (verify before launching agent)

1. **Working tree should be reasonably clean** — uncommitted changes will be swept up by `git add -A` at step 5. If there are unrelated WIP changes, ask the user first.
2. **Currently on `main` branch** — per `CLAUDE.md` branching policy. If not, run `git checkout main` first.
3. **WebSearch permission is enabled** in `.claude/settings.json` (needed for Step 1 Level 3 queries).
4. **Auth for `git push origin main` is configured** — agent will retry up to 4× with exponential backoff but cannot fix bad credentials.

## The overnight prompt

The subagent prompt is exactly this (matches `scripts/overnight-run.sh` verbatim — keep them in sync):

---

You are running the career-ops overnight automation for the user's job search. Execute in this exact order across **both US and Intl tracks**, committing and pushing after each major step.

Context:
- Repo: {your-github-username}/career-ops (main branch)
- Read CLAUDE.md, modes/_profile.md, modes/_shared.md, modes/scan.md, modes/pipeline.md, modes/overnight.md before acting
- Every rule in modes/_profile.md is binding (location in reports, PDF >= 3.0, Times New Roman plain black, output folders, cleanup-low-scores after every batch, auto-push to main)
- **Two tracks run side-by-side:**
  - US: pipeline `data/pipeline.md`, history `data/scan-history.tsv`, PDFs `output/{today}/`
  - Intl: pipeline `data/intl/pipeline.md`, history `data/intl/scan-history.tsv`, PDFs `output-intl/{today}/`
- Shared across tracks: `data/applications.md` (with Region column), `reports/` (with `**Region:**` header), `batch/tracker-additions/`

Steps:

1. **SCAN — both tracks.**
   a. US: `node scan.mjs`
   b. Intl: `node scan.mjs --intl`
   c. Then run the broader Level 3 WebSearch queries from `portals.yml` (small-ATS + non-standard titles + aggregators). For each new URL, route by location: US-tagged → `data/pipeline.md` + `data/scan-history.tsv`; non-US → `data/intl/pipeline.md` + `data/intl/scan-history.tsv`. Both under today's `### YYYY-MM-DD` subsection.

2. **PIPELINE — both tracks.** Take up to **10 URLs from the US Pendientes** AND up to **10 URLs from the Intl Pendientes** (20 total max). Prioritize within each track: newest dated section, archetype fit per `modes/_profile.md`, explicit new-grad / engineer titles. For each:
   - Extract JD (Ashby = GraphQL POST to `/api/non-user-graphql`; Greenhouse/Lever/BreezyHR/TeamTailor = WebFetch; YC workatastartup = WebFetch + aggregator corroboration)
   - Write report to `reports/{NNN}-{slug}-{today}.md` with mandatory header in this order: **Fecha, Arquetipo, Score, URL, Legitimacy, Location, Region** (`US` or `Intl`)**, PDF** — plus full A-H blocks per `modes/oferta.md`
   - Write TSV to `batch/tracker-additions/{NNN}-{slug}.tsv` (9 tab columns, with Region in the notes column or as a 10th column if `merge-tracker.mjs` supports it; if not, put `[Intl]` or `[US]` prefix in notes)
   - If score >= 3.0: tailor `templates/cv-template.html` and run:
     - US: `node generate-pdf.mjs {tmp.html} output/{today}/cv-{candidate-slug}-{slug}-{today}.pdf`
     - Intl: `node generate-pdf.mjs {tmp.html} output-intl/{today}/cv-{candidate-slug}-{slug}-{today}.pdf`
     (`mkdir -p` the target dir first.) If < 3.0: set PDF line to "Not generated (score < 3.0)".
   - Move entry from Pendientes to Procesadas in its track's pipeline file, under `### {today}`, with Location column

3. **MERGE + VERIFY.** `node merge-tracker.mjs`, `node verify-pipeline.mjs`. The verifier should check BOTH pipelines (US + Intl); if it only checks one, run it twice with the path overridden, or check manually that both Pendientes/Procesadas sections are consistent. Must end with 0 errors / 0 warnings overall.

4. **CLEANUP — HARD RULE: DELETE scores < 3.0.** Run `node cleanup-low-scores.mjs`. This **DELETES** (does NOT archive) every artifact for evaluations with score < 3.0: report file, applications.md row, pipeline.md/intl-pipeline.md `- [x]` row, tracker-addition TSV, any stray PDF. The legacy `reports/below-threshold/` directory must remain empty. Only `data/discarded.tsv` retains a thin audit row.

5. **(always to main) COMMIT + PUSH.** `git add -A`, commit with message `overnight: {ISO-timestamp} scan+pipeline+cleanup (+N reports, +M PDFs, US:{n_us} Intl:{n_intl})`, `git push origin main`. Retry push up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

Hard rules:
- NEVER invent metrics or credentials
- NEVER edit `cv.md` or `config/profile.yml`
- Always push to `main`, never sub-branches
- If a URL fails to extract, mark it `- [!] {url} | error: ...` in its track's Pendientes and continue
- On any unrecoverable error: commit whatever succeeded, push, append the error + stack trace to `data/overnight-errors.log`, exit cleanly

End with a one-line summary: `Processed N URLs (US:{n_us} + Intl:{n_intl}), generated M PDFs, archived K low-score, pushed {commit-sha}`.

---

## After the agent completes

When the agent reports back (you'll get a `<task-notification>` with status `completed`):

1. Verify state with a quick check:
   ```bash
   git log --oneline -2                # confirm new "overnight:" commit
   git status --short                   # should be clean
   ls reports/ | grep {today}           # count new reports (both tracks)
   ls output/{today}/                   # US PDFs
   ls output-intl/{today}/              # Intl PDFs
   ```
2. Surface the agent's one-line summary plus a per-track score table for the user.
3. If the agent's summary says it appended to `data/overnight-errors.log`, read that file and flag the errors.

## When NOT to use this mode

- **Single-URL evaluations** — use `/career-ops {URL}` (auto-pipeline) instead.
- **Just a scan, no pipeline** — use `/career-ops scan` instead.
- **Working tree has unrelated WIP** — the `git add -A` in Step 5 will commit everything. Ask the user before launching, or have them stash first.
- **Not on `main`** — switch first, or the routine will fail at push time.

## Related files

- `scripts/overnight-run.sh` — the production shell wrapper (uses `claude -p` with this same prompt)
- `.github/workflows/overnight-routine.yml` — the cron schedule that calls `overnight-run.sh`
- `modes/scan.md` — Step 1 details
- `modes/pipeline.md` — Step 2 details
- `modes/oferta.md` — the A-H block format for reports
