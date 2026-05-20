"""
One-time script: update pipeline.md and intl/pipeline.md for 2026-05-15 overnight run.
Marks processed Pendientes as [!] and adds Procesadas entries.
"""
import os

BASE = '/home/runner/work/career-ops/career-ops/data'

# ── US pipeline ─────────────────────────────────────────────────────────────
us_path = os.path.join(BASE, 'pipeline.md')
with open(us_path) as f:
    content = f.read()

# Pendientes replacements: (exact old line, new line with note)
us_replacements = [
    ('- [ ] https://job-boards.greenhouse.io/arizeai/jobs/5704417004 | Arize AI | Developer Relations Engineer | Remote - New York',
     '- [!] https://job-boards.greenhouse.io/arizeai/jobs/5704417004 | Arize AI | Developer Relations Engineer | Remote - New York -- moved to Procesadas (#789) 2026-05-15 (3.3/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/fiddler-ai/640c12b9-6a07-4be1-a542-d76e4240e2ff | Fiddler AI | Solutions Architect, Customer Success - US | Remote - US',
     '- [!] https://jobs.ashbyhq.com/fiddler-ai/640c12b9-6a07-4be1-a542-d76e4240e2ff | Fiddler AI | Solutions Architect, Customer Success - US | Remote - US -- moved to Procesadas (#793) 2026-05-15 (0/5 CLOSED)'),

    ('- [ ] https://job-boards.greenhouse.io/celonis/jobs/7669112003?gh_jid=7669112003 | Celonis | Associate Applied AI Engineer (Madrid/Spain) - Orbit Program | Madrid, Spain',
     '- [!] https://job-boards.greenhouse.io/celonis/jobs/7669112003?gh_jid=7669112003 | Celonis | Associate Applied AI Engineer (Madrid/Spain) - Orbit Program | Madrid, Spain -- routed to Intl track (#803) 2026-05-15 (2.5/5 SKIP)'),

    ('- [ ] https://job-boards.greenhouse.io/intercom/jobs/7824142 | Intercom | AI Infrastructure Engineer | Berlin, Germany',
     '- [!] https://job-boards.greenhouse.io/intercom/jobs/7824142 | Intercom | AI Infrastructure Engineer | Berlin, Germany -- routed to Intl track (#802) 2026-05-15 (2.8/5 SKIP)'),

    ('- [ ] https://jobs.ashbyhq.com/elevenlabs/ce00fe7b-a93a-436b-bd5e-2eff87c48f23 | ElevenLabs | Enterprise Solutions Engineer - France | France',
     '- [!] https://jobs.ashbyhq.com/elevenlabs/ce00fe7b-a93a-436b-bd5e-2eff87c48f23 | ElevenLabs | Enterprise Solutions Engineer - France | France -- routed to Intl track (#805) 2026-05-15 (2.5/5 SKIP)'),

    ('- [ ] https://jobs.ashbyhq.com/lovable/9f4963e7-be14-4dd9-99ce-05df2f06e22d | Lovable | Engineer - Agents & Evals | Stockholm',
     '- [!] https://jobs.ashbyhq.com/lovable/9f4963e7-be14-4dd9-99ce-05df2f06e22d | Lovable | Engineer - Agents & Evals | Stockholm -- routed to Intl track (#801) 2026-05-15 (3.5/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/deepgram/7ac1a5bc-f305-4f2a-a547-394566a549b2 | Deepgram | Pre-Sales Solutions Engineer - Europe | EU | Remote',
     '- [!] https://jobs.ashbyhq.com/deepgram/7ac1a5bc-f305-4f2a-a547-394566a549b2 | Deepgram | Pre-Sales Solutions Engineer - Europe | EU | Remote -- routed to Intl track (#804) 2026-05-15 (2.5/5 SKIP)'),

    ('- [ ] https://jobs.ashbyhq.com/deepgram/f904ff60-f5d1-45c7-8fa2-8456c47b4204 | Deepgram | Pre-Sales Solutions Engineer (San Francisco, CA) | San Francisco, CA',
     '- [!] https://jobs.ashbyhq.com/deepgram/f904ff60-f5d1-45c7-8fa2-8456c47b4204 | Deepgram | Pre-Sales Solutions Engineer (San Francisco, CA) | San Francisco, CA -- moved to Procesadas (#792) 2026-05-15 (3.0/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/8b533cc4-6654-44b4-b3fc-004def2a9927 | LangChain | Deployed Engineer (Dallas) | Dallas, TX',
     '- [!] https://jobs.ashbyhq.com/langchain/8b533cc4-6654-44b4-b3fc-004def2a9927 | LangChain | Deployed Engineer (Dallas) | Dallas, TX -- moved to Procesadas (#786) 2026-05-15 (4.1/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/31ff2b5b-d5c5-443e-bf11-ef02481df579 | LangChain | Deployed Engineer (Germany) | Germany',
     '- [!] https://jobs.ashbyhq.com/langchain/31ff2b5b-d5c5-443e-bf11-ef02481df579 | LangChain | Deployed Engineer (Germany) | Germany -- routed to Intl track (#799) 2026-05-15 (3.6/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/2d920c9c-abf2-4c46-a01b-03e61a03c8e6 | LangChain | Deployed Engineer (Los Angeles) | Los Angeles, CA',
     '- [!] https://jobs.ashbyhq.com/langchain/2d920c9c-abf2-4c46-a01b-03e61a03c8e6 | LangChain | Deployed Engineer (Los Angeles) | Los Angeles, CA -- moved to Procesadas (#787) 2026-05-15 (4.0/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/86d0df4d-e000-403d-aca8-ee6896aa5420 | LangChain | Deployed Engineer (San Diego) | San Diego, CA',
     '- [!] https://jobs.ashbyhq.com/langchain/86d0df4d-e000-403d-aca8-ee6896aa5420 | LangChain | Deployed Engineer (San Diego) | San Diego, CA -- moved to Procesadas (#788) 2026-05-15 (3.9/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/31483b31-68c5-4603-8a84-0051634100c0 | LangChain | Deployed Engineer (Stockholm) | Sweden',
     '- [!] https://jobs.ashbyhq.com/langchain/31483b31-68c5-4603-8a84-0051634100c0 | LangChain | Deployed Engineer (Stockholm) | Sweden -- routed to Intl track (#800) 2026-05-15 (3.5/5 PDF OK)'),

    ('- [ ] https://jobs.lever.co/palantir/289ad049-7b4e-41e3-8a39-146fbeb6fb64 | Palantir | Forward Deployed Software Engineer - US Government | Washington, D.C.',
     '- [!] https://jobs.lever.co/palantir/289ad049-7b4e-41e3-8a39-146fbeb6fb64 | Palantir | Forward Deployed Software Engineer - US Government | Washington, D.C. -- moved to Procesadas (#795) 2026-05-15 (1.0/5 US citizenship req; SKIP)'),

    ('- [ ] https://jobs.lever.co/palantir/13f99633-43b5-4459-8e84-25073f257c18 | Palantir | Forward Deployed Software Engineer - Warp Speed | New York, NY',
     '- [!] https://jobs.lever.co/palantir/13f99633-43b5-4459-8e84-25073f257c18 | Palantir | Forward Deployed Software Engineer - Warp Speed | New York, NY -- moved to Procesadas (#794) 2026-05-15 (1.5/5 US Person req; SKIP)'),

    ('- [ ] https://jobs.lever.co/mistral/ac195fdb-1731-4ce2-b47e-c1bb8c72c59d | Mistral AI | Applied AI Engineer, Prototyping | Paris',
     '- [!] https://jobs.lever.co/mistral/ac195fdb-1731-4ce2-b47e-c1bb8c72c59d | Mistral AI | Applied AI Engineer, Prototyping | Paris -- routed to Intl track (#796) 2026-05-15 (3.9/5 PDF OK)'),

    ('- [ ] https://jobs.lever.co/mistral/e0db3860-0a80-47a8-958a-f8e62f3bb59c | Mistral AI | Applied AI, Evaluation Engineer | Paris',
     '- [!] https://jobs.lever.co/mistral/e0db3860-0a80-47a8-958a-f8e62f3bb59c | Mistral AI | Applied AI, Evaluation Engineer | Paris -- routed to Intl track (#797) 2026-05-15 (4.1/5 PDF OK)'),

    ('- [ ] https://jobs.lever.co/mistral/3eef7a1f-cd9d-430e-ac67-9d52534c346a | Mistral AI | Software Engineer, Enterprise Agents | Paris',
     '- [!] https://jobs.lever.co/mistral/3eef7a1f-cd9d-430e-ac67-9d52534c346a | Mistral AI | Software Engineer, Enterprise Agents | Paris -- routed to Intl track (#798) 2026-05-15 (3.3/5 PDF OK)'),

    ('- [ ] https://coreweave.com/careers/job?4609928006&board=coreweave&gh_jid=4609928006 | Weights & Biases (via CoreWeave) | Software Engineer, Inference AI/ML |  Sunnyvale, CA / Bellevue, WA',
     '- [!] https://coreweave.com/careers/job?4609928006&board=coreweave&gh_jid=4609928006 | Weights & Biases (via CoreWeave) | Software Engineer, Inference AI/ML | Sunnyvale, CA / Bellevue, WA -- moved to Procesadas (#790) 2026-05-15 (3.0/5 PDF OK)'),

    ('- [ ] https://jobs.ashbyhq.com/langchain/d3f8de08-2e2b-4c3f-be1f-e63ca51f1d93 | LangChain | Principle Software Engineer, AI Observability & Evals Platform | Boston, MA',
     '- [!] https://jobs.ashbyhq.com/langchain/d3f8de08-2e2b-4c3f-be1f-e63ca51f1d93 | LangChain | Principle Software Engineer, AI Observability & Evals Platform | Boston, MA -- moved to Procesadas (#791) 2026-05-15 (2.5/5 no PDF)'),
]

changed = 0
for old, new in us_replacements:
    if old in content:
        content = content.replace(old, new, 1)
        changed += 1
    else:
        print('NOT FOUND:', old[:80])

print(f'US Pendientes: replaced {changed}/{len(us_replacements)}')

# Add Procesadas entries under the last ### 2026-05-15 marker
procesadas_entries = [
    '- [x] #786 | https://jobs.ashbyhq.com/langchain/8b533cc4-6654-44b4-b3fc-004def2a9927 | LangChain | Deployed Engineer (Dallas) | Dallas, TX | 4.1/5 | PDF OK',
    '- [x] #787 | https://jobs.ashbyhq.com/langchain/2d920c9c-abf2-4c46-a01b-03e61a03c8e6 | LangChain | Deployed Engineer (Los Angeles) | Los Angeles, CA | 4.0/5 | PDF OK',
    '- [x] #788 | https://jobs.ashbyhq.com/langchain/86d0df4d-e000-403d-aca8-ee6896aa5420 | LangChain | Deployed Engineer (San Diego) | San Diego, CA | 3.9/5 | PDF OK',
    '- [x] #789 | https://job-boards.greenhouse.io/arizeai/jobs/5704417004 | Arize AI | Developer Relations Engineer (New York) | Remote - New York metro | 3.3/5 | PDF OK',
    '- [x] #790 | https://coreweave.com/careers/job?4609928006&board=coreweave&gh_jid=4609928006 | Weights & Biases (CoreWeave) | Software Engineer, Inference AI/ML | Bellevue, WA / Sunnyvale, CA | 3.0/5 | PDF OK',
    '- [x] #791 | https://jobs.ashbyhq.com/langchain/d3f8de08-2e2b-4c3f-be1f-e63ca51f1d93 | LangChain | Principal Software Engineer, AI Observability & Evals | Boston, MA | 2.5/5 | PDF N/A',
    '- [x] #792 | https://jobs.ashbyhq.com/deepgram/f904ff60-f5d1-45c7-8fa2-8456c47b4204 | Deepgram | Pre-Sales Solutions Engineer (SF) | San Francisco, CA | 3.0/5 | PDF OK',
    '- [x] #793 | https://jobs.ashbyhq.com/fiddler-ai/640c12b9-6a07-4be1-a542-d76e4240e2ff | Fiddler AI | Solutions Architect, Customer Success | US Remote - CLOSED | 0/5 | PDF N/A',
    '- [x] #794 | https://jobs.lever.co/palantir/13f99633-43b5-4459-8e84-25073f257c18 | Palantir | Forward Deployed Software Engineer - Warp Speed | New York, NY | 1.5/5 | PDF N/A',
    '- [x] #795 | https://jobs.lever.co/palantir/289ad049-7b4e-41e3-8a39-146fbeb6fb64 | Palantir | Forward Deployed Software Engineer - US Government | Washington, D.C. | 1.0/5 | PDF N/A',
]

marker = '### 2026-05-15\n'
last_idx = content.rfind(marker)
if last_idx >= 0:
    insert_pos = last_idx + len(marker)
    content = content[:insert_pos] + '\n'.join(procesadas_entries) + '\n' + content[insert_pos:]
    print('US Procesadas block inserted')
else:
    print('ERROR: ### 2026-05-15 in Procesadas section not found')

with open(us_path, 'w') as f:
    f.write(content)
print('US pipeline.md written')

# ── Intl pipeline ────────────────────────────────────────────────────────────
intl_path = os.path.join(BASE, 'intl/pipeline.md')
with open(intl_path) as f:
    intl = f.read()

intl_entries = [
    '- [x] #796 | https://jobs.lever.co/mistral/ac195fdb-1731-4ce2-b47e-c1bb8c72c59d | Mistral AI | Applied AI Engineer, Prototyping | Paris, France - On-site | 3.9/5 | PDF OK',
    '- [x] #797 | https://jobs.lever.co/mistral/e0db3860-0a80-47a8-958a-f8e62f3bb59c | Mistral AI | Applied AI, Evaluation Engineer | Paris, France - On-site (CDI) | 4.1/5 | PDF OK',
    '- [x] #798 | https://jobs.lever.co/mistral/3eef7a1f-cd9d-430e-ac67-9d52534c346a | Mistral AI | Software Engineer, Enterprise Agents | Paris, France - Hybrid | 3.3/5 | PDF OK',
    '- [x] #799 | https://jobs.ashbyhq.com/langchain/31ff2b5b-d5c5-443e-bf11-ef02481df579 | LangChain | Deployed Engineer (Germany) | Germany - Hybrid | 3.6/5 | PDF OK',
    '- [x] #800 | https://jobs.ashbyhq.com/langchain/31483b31-68c5-4603-8a84-0051634100c0 | LangChain | Deployed Engineer (Stockholm) | Stockholm, Sweden - Hybrid | 3.5/5 | PDF OK',
    '- [x] #801 | https://jobs.ashbyhq.com/lovable/9f4963e7-be14-4dd9-99ce-05df2f06e22d | Lovable | Engineer - Agents & Evals | Stockholm, Sweden - On-Site | 3.5/5 | PDF OK',
    '- [x] #802 | https://job-boards.greenhouse.io/intercom/jobs/7824142 | Intercom (Fin) | AI Infrastructure Engineer | Berlin, Germany - Hybrid | 2.8/5 | PDF N/A',
    '- [x] #803 | https://job-boards.greenhouse.io/celonis/jobs/7669112003?gh_jid=7669112003 | Celonis | Associate Applied AI Engineer (Orbit) | Madrid, Spain | 2.5/5 | PDF N/A',
    '- [x] #804 | https://jobs.ashbyhq.com/deepgram/7ac1a5bc-f305-4f2a-a547-394566a549b2 | Deepgram | Pre-Sales Solutions Engineer (Europe) | EU Remote | 2.5/5 | PDF N/A',
    '- [x] #805 | https://jobs.ashbyhq.com/elevenlabs/ce00fe7b-a93a-436b-bd5e-2eff87c48f23 | ElevenLabs | Enterprise Solutions Engineer (France) | France | 2.5/5 | PDF N/A',
]

last_idx = intl.rfind(marker)
if last_idx >= 0:
    insert_pos = last_idx + len(marker)
    intl = intl[:insert_pos] + '\n'.join(intl_entries) + '\n' + intl[insert_pos:]
    print('Intl Procesadas block inserted')
else:
    print('ERROR: ### 2026-05-15 in Intl Procesadas not found')

with open(intl_path, 'w') as f:
    f.write(intl)
print('Intl pipeline.md written')
