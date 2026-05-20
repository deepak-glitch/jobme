# starter-state — what `npm run init` produces

This folder is a snapshot of every file `npm run init` creates in a fresh
clone, with all defaults accepted (the "Jane Smith" placeholder profile).

It's here so anyone browsing the repo on GitHub can see what a populated
project state actually looks like — without having to clone, install, and run.

| File here | Lands at (after `npm run init`) | Source template |
|-----------|----------------------------------|-----------------|
| `cv.md` | `cv.md` (gitignored) | `cv.example.md` |
| `profile.yml` | `config/profile.yml` (gitignored) | `config/profile.example.yml` |
| `portals.yml` | `portals.yml` (gitignored) | `templates/portals.example.yml` |
| `_profile.md` | `modes/_profile.md` (gitignored) | `modes/_profile.template.md` |
| `article-digest.md` | `article-digest.md` (gitignored) | `article-digest.example.md` |
| `applications.md` | `data/applications.md` (gitignored) | generated empty table |
| `pipeline.md` | `data/pipeline.md` (gitignored) | generated empty inbox |

## Why these are NOT in their real locations on the repo

Once you fill them in with your real CV, salary expectations, target
companies, and per-company evaluation reports, they hold private data
you almost certainly don't want public. The `.gitignore` keeps them
out of every commit so your job-search activity stays yours.

If you want to share a *populated example* of your own (e.g. for friends
to copy your archetypes), add a sibling folder like
`examples/your-name-state/` and put scrubbed copies there.

## Running this state locally

You don't need to copy from here manually — `npm run init` creates these
files for you from the canonical `.example.*` / `.template.*` sources.
This folder is documentation, not configuration.
