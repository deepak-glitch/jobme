"""
Move pendientes entries to procesadas in both pipeline files.
- US: data/pipeline.md
- Intl: data/intl/pipeline.md
"""
import re

# Map: url -> (num, role-line for procesadas)
US_MOVES = {
    "https://job-boards.greenhouse.io/gleanwork/jobs/4694716005":
        "#728 | https://job-boards.greenhouse.io/gleanwork/jobs/4694716005 | Glean | Machine Learning Engineer, LLM Evals & Observability | Mountain View, CA — Hybrid 3-4d/wk | 4.0/5 | PDF ✅",
    "https://jobs.ashbyhq.com/deepgram/a58e4a11-7f98-4686-98e8-2612b52d7bbd":
        "#729 | https://jobs.ashbyhq.com/deepgram/a58e4a11-7f98-4686-98e8-2612b52d7bbd | Deepgram | Forward Deployed Engineer, Deepgram for Restaurants | New York City, NY — On-site | 3.6/5 | PDF ✅",
    "https://jobs.ashbyhq.com/deepgram/7c7064bb-2bf0-4f64-81cc-14afe79a15c1":
        "#730 | https://jobs.ashbyhq.com/deepgram/7c7064bb-2bf0-4f64-81cc-14afe79a15c1 | Deepgram | Backend Software Engineer, Engine Team (Voice Agent) | USA — Remote | 3.5/5 | PDF ✅",
    "https://jobs.ashbyhq.com/deepgram/4a873ede-8555-42ae-9ddc-ac89afdd7278":
        "#731 | https://jobs.ashbyhq.com/deepgram/4a873ede-8555-42ae-9ddc-ac89afdd7278 | Deepgram | Software Engineer, Voice Agents / AI - Deepgram for Restaurants | San Francisco, CA — On-site | 3.4/5 | PDF ✅",
    "https://jobs.ashbyhq.com/claylabs/9b008b26-189b-45cf-83d8-fee117d32874":
        "#732 | https://jobs.ashbyhq.com/claylabs/9b008b26-189b-45cf-83d8-fee117d32874 | Clay Labs | Software Engineer, Developer Experience (AI) | New York / San Francisco | 3.9/5 | PDF ✅",
    "https://jobs.ashbyhq.com/baseten/90e9ff4e-1225-4b1b-b0b4-2362e36d9cfa":
        "#733 | https://jobs.ashbyhq.com/baseten/90e9ff4e-1225-4b1b-b0b4-2362e36d9cfa | Baseten | Applied AI Inference Engineer | San Francisco + New York/Remote secondary | 4.1/5 | PDF ✅",
    "https://jobs.ashbyhq.com/baseten/b88a68b7-d2bc-4a30-a79a-3ef292ad7c26":
        "#734 | https://jobs.ashbyhq.com/baseten/b88a68b7-d2bc-4a30-a79a-3ef292ad7c26 | Baseten | Software Engineer - AI Enablement | San Francisco + Montreal/New York | 3.8/5 | PDF ✅",
    "https://jobs.ashbyhq.com/crosby/73c2e629-8b13-40a3-9c50-d8af4fcf5d10":
        "#735 | https://jobs.ashbyhq.com/crosby/73c2e629-8b13-40a3-9c50-d8af4fcf5d10 | Crosby | AI Developer Experience Engineer | New York City — On-site | 3.9/5 | PDF ✅",
    "https://jobs.ashbyhq.com/baseten/6e396eb7-acb3-436a-89ec-05e755c477f2":
        "#736 | https://jobs.ashbyhq.com/baseten/6e396eb7-acb3-436a-89ec-05e755c477f2 | Baseten | Software Engineer - Voice AI (Inference Runtime) | San Francisco + New York | 3.4/5 | PDF ✅",
    "https://jobs.ashbyhq.com/baseten/126d54b4-a7bc-4456-bf4d-5d224e4f5d63":
        "#737 | https://jobs.ashbyhq.com/baseten/126d54b4-a7bc-4456-bf4d-5d224e4f5d63 | Baseten | Software Engineer - Training Product | San Francisco + New York | 3.5/5 | PDF ✅",
}

INTL_MOVES = {
    "https://jobs.lever.co/mistral/c79ff8ed-6689-4dda-aec6-979a5dc767d0":
        "#738 | https://jobs.lever.co/mistral/c79ff8ed-6689-4dda-aec6-979a5dc767d0 | Mistral AI | AI Engineer, Product (Paris) | Paris HQ — Hybrid 3d/wk | 3.5/5 | PDF ✅",
    "https://super-ai.jobs.personio.com/job/1592103?language=en":
        "#739 | https://super-ai.jobs.personio.com/job/1592103?language=en | super.AI | Machine Learning Engineer | Berlin / Remote Europe | 3.2/5 | PDF ✅",
}

def process_pipeline(path, moves):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")
    out = []
    proc_to_add = []
    for line in lines:
        # Check if this Pendientes line matches a URL we processed
        stripped = line.strip()
        matched = False
        if stripped.startswith("- [ ]"):
            for url, proc_line in moves.items():
                if url in line:
                    # Skip from Pendientes
                    matched = True
                    proc_to_add.append(proc_line)
                    break
        if not matched:
            out.append(line)

    new_content = "\n".join(out)

    # Append proc_to_add to the today's Procesadas section
    # Find "### 2026-05-13" under "## Procesadas"
    # Last "### 2026-05-13" should be in Procesadas (US has it at line ~1662, intl line ~32)
    target = "### 2026-05-13"
    proc_marker = "## Procesadas"
    # Find Procesadas section start
    proc_idx = new_content.rfind(proc_marker)
    if proc_idx == -1:
        print(f"ERROR: no '## Procesadas' in {path}")
        return False
    # In the slice after proc_marker, find the most recent ### 2026-05-13 header
    proc_section = new_content[proc_idx:]
    # Find last "### 2026-05-13" or if missing, add it
    if target in proc_section:
        # Insert after that header (next "### " is the boundary; else end of file)
        # Find the header position in absolute terms
        target_idx_local = proc_section.rfind(target)
        target_idx = proc_idx + target_idx_local
        # Insertion point = end of that section. Find next "### " or "## " after target_idx + len(target)
        rest = new_content[target_idx + len(target):]
        m = re.search(r"\n##? ", rest)
        if m:
            insert_at = target_idx + len(target) + m.start()
        else:
            insert_at = len(new_content)
        # Need to insert at the END of the date section but before the next header
        # Build the new entries block (prefixed with "- [x] ")
        block = ""
        for pl in proc_to_add:
            block += f"\n- [x] {pl}"
        # Add trailing newline before next header
        block += "\n"
        new_content = new_content[:insert_at] + block + new_content[insert_at:]
    else:
        # Append new section at end
        block = f"\n\n{target}\n"
        for pl in proc_to_add:
            block += f"\n- [x] {pl}"
        block += "\n"
        new_content += block

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"OK: {path} — moved {len(proc_to_add)} entries")
    return True


# US
process_pipeline("data/pipeline.md", US_MOVES)
# Intl
process_pipeline("data/intl/pipeline.md", INTL_MOVES)
