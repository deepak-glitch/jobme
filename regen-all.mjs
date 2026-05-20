#!/usr/bin/env node
// regen-all.mjs — Regenerate all existing ATS PDFs with the new plain-black
// Times New Roman template. No subagent. Uses cv.md content as a baseline
// for every PDF (role-specific tailoring is preserved only in archetype label
// injected into the summary). Run `/career-ops pipeline` later on individual
// URLs to restore deep per-role tailoring.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const TEMPLATE = readFileSync('templates/cv-template.html', 'utf-8');
const profile = yaml.load(readFileSync('config/profile.yml', 'utf-8')).candidate;

const REGEN = [
  ['anthropic-2026-04-20',                     'reports/001-anthropic-2026-04-20.md'],
  ['cohere-2026-04-20',                        'reports/003-cohere-2026-04-20.md'],
  ['ramp-2026-04-20',                          'reports/004-ramp-2026-04-20.md'],
  ['distyl-2026-04-20',                        'reports/005-distyl-2026-04-20.md'],
  ['magical-2026-04-20',                       'reports/006-magical-2026-04-20.md'],
  ['quora-2026-04-20',                         'reports/007-quora-2026-04-20.md'],
  ['eigen-labs-2026-04-20',                    'reports/009-eigen-labs-2026-04-20.md'],
  ['hippocratic-ai-2026-04-20',                'reports/010-hippocratic-ai-2026-04-20.md'],
  ['openai-2026-04-21',                        'reports/011-openai-2026-04-21.md'],
  ['quora-ads-2026-04-21',                     'reports/012-quora-2026-04-21.md'],
  ['superplane-2026-04-21',                    'reports/014-superplane-2026-04-21.md'],
  ['spaak-2026-04-21',                         'reports/015-spaak-2026-04-21.md'],
  ['cordial-2026-04-21',                       'reports/016-cordial-2026-04-21.md'],
  ['percepta-2026-04-21',                      'reports/017-percepta-2026-04-21.md'],
  ['vyn-2026-04-21',                           'reports/018-vyn-2026-04-21.md'],
  ['auctor-2026-04-21',                        'reports/019-auctor-2026-04-21.md'],
  ['vapi-2026-04-21',                          'reports/020-vapi-2026-04-21.md'],
  ['netic-2026-04-22',                         'reports/021-netic-2026-04-21.md'],
  ['verkada-2026-04-22',                       'reports/022-verkada-2026-04-21.md'],
  ['northslope-2026-04-22',                    'reports/023-northslope-2026-04-21.md'],
  ['healthleap-2026-04-22',                    'reports/024-healthleap-2026-04-21.md'],
  ['zello-2026-04-22',                         'reports/027-zello-2026-04-21.md'],
  ['permitflow-2026-04-22',                    'reports/028-permitflow-2026-04-21.md'],
  ['edison-scientific-2026-04-22',             'reports/029-edison-scientific-2026-04-21.md'],
  ['mightybot-2026-04-22',                     'reports/030-mightybot-2026-04-21.md'],
  ['together-ai-ml-2026-04-22',                'reports/031-togetherai-ml-2026-04-22.md'],
  ['together-ai-swe-2026-04-22',               'reports/032-togetherai-swe-2026-04-22.md'],
  ['assemblyai-2026-04-22',                    'reports/033-assemblyai-2026-04-22.md'],
  ['xai-fde-2026-04-22',                       'reports/034-xai-fde-2026-04-22.md'],
  ['xai-voice-2026-04-22',                     'reports/035-xai-voice-2026-04-22.md'],
  ['v7-2026-04-22',                            'reports/036-v7-2026-04-22.md'],
  ['fireworks-ai-2026-04-22',                  'reports/037-fireworks-2026-04-22.md'],
  ['deepgram-2026-04-22',                      'reports/039-deepgram-2026-04-22.md'],
  ['reflection-2026-04-22',                    'reports/041-reflection-2026-04-22.md'],
  ['hightouch-2026-04-22',                     'reports/042-hightouch-2026-04-22.md'],
  ['loop-2026-04-22',                          'reports/043-loop-2026-04-22.md'],
  ['sierra-2026-04-22',                        'reports/044-sierra-2026-04-22.md'],
  ['mai-2026-04-22',                           'reports/045-mai-2026-04-22.md'],
  ['scale-ai-2026-04-22',                      'reports/046-scaleai-2026-04-22.md'],
  ['furtherai-2026-04-22',                     'reports/047-furtherai-2026-04-22.md'],
  ['medplum-2026-04-22',                       'reports/048-medplum-2026-04-22.md'],
  ['sezzle-2026-04-22',                        'reports/050-sezzle-2026-04-22.md'],
  ['quora-2026-04-22',                         'reports/051-quora-2026-04-22.md'],
  ['replit-2026-04-22',                        'reports/052-replit-2026-04-22.md'],
  ['perfectserve-2026-04-22',                  'reports/053-perfectserve-2026-04-22.md'],
  ['glean-2026-04-22',                         'reports/055-glean-2026-04-22.md'],
  ['salient-2026-04-22',                       'reports/056-salient-2026-04-22.md'],
  ['fastino-2026-04-22',                       'reports/058-fastino-2026-04-22.md'],
  ['general-intelligence-company-2026-04-22',  'reports/059-general-intelligence-company-2026-04-22.md'],
  ['monaco-2026-04-22',                        'reports/060-monaco-2026-04-22.md'],
  ['continued-2026-04-22',                     'reports/061-continued-2026-04-22.md'],
  ['palantir-2026-04-22',                      'reports/062-palantir-2026-04-22.md'],
  ['mistral-2026-04-22',                       'reports/063-mistral-2026-04-22.md'],
  ['vercel-ai-gateway-2026-04-22',             'reports/065-vercel-ai-gateway-2026-04-22.md'],
  ['auctor-fde-2026-04-22',                    'reports/067-auctor-fde-2026-04-22.md'],
  ['naptha-2026-04-22',                        'reports/068-naptha-2026-04-22.md'],
  ['chestnut-2026-04-22',                      'reports/069-chestnut-2026-04-22.md'],
];

function extractArchetype(reportPath) {
  if (!existsSync(reportPath)) return null;
  const text = readFileSync(reportPath, 'utf-8');
  const m = text.match(/^\*\*Arquetipo:\*\*\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractCompany(reportPath) {
  if (!existsSync(reportPath)) return null;
  const text = readFileSync(reportPath, 'utf-8');
  const m = text.match(/^#\s*Evaluación:\s*(.+?)\s*—/m);
  return m ? m[1].trim() : null;
}

const BASE_SUMMARY = `Applied AI engineer shipping production LLM systems end to end: healthcare RAG (~35% retrieval precision, >90% grounded alignment), agentic workflows (>30% hallucination reduction), and FastAPI + Docker packaging (~30% post-deploy defect reduction). Shipped Manga Lens solo on the Chrome Web Store with four AI vision providers under per-provider failure isolation. Master's in Computer Science, Kent State. Ready to ship production AI systems from day one.`;

const COMPETENCIES = [
  'Applied AI / LLMs',
  'RAG + Grounding',
  'Agentic Workflows',
  'Schema Contracts',
  'Eval Harnesses',
  'Python / FastAPI',
  'TypeScript / React',
  'Docker / CI-CD',
  'Multimodal Vision',
  'Predictive ML',
];

const EXPERIENCE = `
    <div class="job">
      <div class="job-header">
        <span class="job-company">Progress Solutions Inc.</span>
        <span class="job-period">Jul 2025 - Present</span>
      </div>
      <div class="job-role">Jr. AI/ML Engineer Trainee - Agent Engineering, Production LLM</div>
      <div class="job-location">USA - Healthcare Technology, AI Consulting</div>
      <ul>
        <li>Built <strong>Retrieval-Augmented Generation (RAG)</strong> for clinical knowledge retrieval; recursive semantic chunking and transformer embeddings improved retrieval precision <strong>~35%</strong>, reduced irrelevant retrieval <strong>&gt;30%</strong>, response alignment <strong>&gt;90%</strong>.</li>
        <li>Developed <strong>agentic LLM workflows</strong> for multi-step healthcare queries with tool discipline, structured reasoning, and grounding rules; response stability <strong>~25%</strong>, hallucinations cut <strong>&gt;30%</strong>.</li>
        <li>Shipped <strong>predictive ML pipelines</strong> (scikit-learn, XGBoost) for patient no-show and care engagement scoring; recall <strong>+15-20%</strong> on high-risk categories, precision held <strong>&gt;90%</strong> via class weighting, stratified sampling, threshold calibration.</li>
        <li>Packaged ML/LLM inference as <strong>FastAPI / Flask</strong> services on <strong>Docker</strong> with structured logging and load simulation; post-deploy defects <strong>~30%</strong>.</li>
        <li>EHR preprocessing (Pandas, NumPy); dataset reliability <strong>&gt;98%</strong>, downstream instability <strong>-40%</strong>.</li>
        <li>HIPAA-conscious governance: de-identification, data lineage, evaluation audit trails, stakeholder-facing system-limitation docs.</li>
      </ul>
    </div>
    <div class="job">
      <div class="job-header">
        <span class="job-company">Energy Solutions International (Emerson)</span>
        <span class="job-period">Jun 2022 - Apr 2023</span>
      </div>
      <div class="job-role">Database &amp; DevOps Performance Engineer (Intern)</div>
      <div class="job-location">Hyderabad, India - Oil &amp; Gas ERP</div>
      <ul>
        <li>Optimized <strong>T-SQL stored procedures</strong> on a compliance-sensitive ERP (contracts, nominations, allocations, invoicing); query time <strong>-20%</strong>, retrieval latency <strong>-25%</strong>.</li>
        <li>Built <strong>Jenkins CI/CD pipelines</strong> for schema updates and stored-procedure deployments; deploy errors <strong>-30%</strong>, release cycle <strong>-35 to -40%</strong>.</li>
        <li>Designed performance dashboards with <strong>SQL Server DMVs + Grafana</strong>; incident recurrence <strong>-25%</strong>, root-cause resolution <strong>-30%</strong>.</li>
        <li>Tuned index maintenance and partition-aware queries; reconciliation runtime <strong>-15%</strong>, deadlocks <strong>-15%</strong>.</li>
        <li>Supported RBAC and audit logging for financial modules in a regulated environment.</li>
      </ul>
    </div>
    <div class="job">
      <div class="job-header">
        <span class="job-company">Suvidha Foundation</span>
        <span class="job-period">Jan 2022 - Mar 2022</span>
      </div>
      <div class="job-role">Machine Learning Engineer</div>
      <div class="job-location">Hyderabad, India - Nonprofit, Video Analytics, Applied NLP</div>
      <ul>
        <li>Built <strong>transformer-based video summarization</strong> over 5,000+ recorded sessions; hierarchical summarization and timestamp-aligned clip extraction cut manual review <strong>60-70%</strong>.</li>
        <li>AI-selected highlights aligned with human-curated moments <strong>~85%</strong>.</li>
        <li>Implemented <strong>document Q&amp;A with RAG</strong>; hallucinations <strong>~30%</strong>, contextual accuracy <strong>&gt;85%</strong>.</li>
        <li>Deployed as <strong>Flask</strong> API with a lightweight web interface for non-technical staff.</li>
      </ul>
    </div>`;

const PROJECTS = `
    <div class="project">
      <span class="project-title">Agentic Healthcare Claims Processing &amp; Fraud Risk Intelligence System</span>
      <div class="project-desc">5-stage multi-agent pipeline (Intake, Validation, Consistency, Duplicate, Risk Scoring) with schema-validated JSON contracts between agents to prevent cascading hallucinations. RAG-grounded CPT/ICD validation against vector-indexed policies. Audit-ready explainable risk scoring.</div>
      <div class="project-tech">Python, LangChain, FastAPI, pgvector, GPT-4, schema contracts</div>
    </div>
    <div class="project">
      <span class="project-title">Manga Lens - Multi-Provider AI Vision Chrome Extension</span>
      <div class="project-desc">Real-time manga translation extension shipped to the Chrome Web Store. Multi-provider abstraction (4 AI vision providers) with per-provider payload handling for worst-case failure isolation. 29 sites supported across manifest V3 service workers.</div>
      <div class="project-tech">TypeScript, Manifest V3, Service Workers, OpenAI / Anthropic / Google / OpenRouter</div>
    </div>
    <div class="project">
      <span class="project-title">Dream Decoder - Multimodal Creative Platform</span>
      <div class="project-desc">End-to-end multimodal pipeline: text description, intermediate prompt transformation, grounded image generation. ~30% contextual alignment gain, ~25-30% first-pass image success.</div>
      <div class="project-tech">FastAPI, React + Vite, Tailwind, Perplexity Sonar, Replicate</div>
    </div>
    <div class="project">
      <span class="project-title">YOLOv8 Driver Drowsiness Detection</span>
      <div class="project-desc">Real-time computer vision for driver drowsiness; sub-50ms inference on edge hardware. Walk-forward validation and class-weighted training for imbalanced safety data.</div>
      <div class="project-tech">PyTorch, YOLOv8, OpenCV, ONNX</div>
    </div>`;

const EDUCATION = `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-title">Master of Science, Computer Science - <span class="edu-org">Kent State University</span></span>
        <span class="edu-year">Aug 2023 - May 2025</span>
      </div>
      <div class="edu-desc">Focus: Applied Machine Learning, NLP, Database Systems.</div>
    </div>
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-title">Bachelor of Technology, Computer Science - <span class="edu-org">KL University</span></span>
        <span class="edu-year">Jun 2019 - May 2023</span>
      </div>
      <div class="edu-desc">Founder / Lead of E-Farming platform (university project, pilot with 3 cooperatives).</div>
    </div>`;

const CERTIFICATIONS = `
    <div class="cert-item">
      <span class="cert-title">Deep Learning Specialization - <span class="cert-org">DeepLearning.AI (Coursera)</span></span>
      <span class="cert-year">2024</span>
    </div>`;

const SKILLS = `
    <span class="skill-item"><span class="skill-category">Languages:</span> Python, TypeScript, JavaScript, SQL (T-SQL, PostgreSQL, SQLite), Java, C++</span>
    <span class="skill-item"><span class="skill-category">AI / ML:</span> PyTorch, scikit-learn, XGBoost, LangChain, LlamaIndex, OpenAI, Anthropic, Hugging Face Transformers, Diffusers, YOLOv8</span>
    <span class="skill-item"><span class="skill-category">LLM / GenAI:</span> RAG, agentic workflows, structured outputs, prompt engineering, evaluation pipelines, guardrails, grounding, embeddings, vector search</span>
    <span class="skill-item"><span class="skill-category">Backend:</span> FastAPI, Flask, REST, WebSockets, Docker, Celery, Playwright</span>
    <span class="skill-item"><span class="skill-category">Frontend:</span> React, Next.js, Vite, Tailwind, Chrome Extensions (Manifest V3)</span>
    <span class="skill-item"><span class="skill-category">Data:</span> PostgreSQL + pgvector, MongoDB, Redis, Pandas, NumPy, Snowflake</span>
    <span class="skill-item"><span class="skill-category">DevOps:</span> Docker, Jenkins, GitHub Actions, Grafana, Prometheus, AWS (EC2, S3, Lambda)</span>
    <span class="skill-item"><span class="skill-category">Domains:</span> Healthcare AI (HIPAA-conscious), Applied AI, Enterprise AI, Workflow Automation, Computer Vision, Multimodal</span>`;

function buildHtml(slug, reportPath) {
  const archetype = extractArchetype(reportPath) || 'Applied AI Engineer';
  const company = extractCompany(reportPath) || '';
  const taggedSummary = `${BASE_SUMMARY} Targeting ${archetype} roles${company ? ' (' + company + ' and similar)' : ''}.`;

  const placeholders = {
    '{{LANG}}': 'en',
    '{{PAGE_WIDTH}}': '780px',
    '{{NAME}}': profile.full_name || 'Your Name',
    '{{PHONE}}': profile.phone || '',
    '{{EMAIL}}': profile.email || '',
    '{{LINKEDIN_URL}}': profile.linkedin?.startsWith('http') ? profile.linkedin : `https://${profile.linkedin || ''}`,
    '{{LINKEDIN_DISPLAY}}': (profile.linkedin || '').replace(/^https?:\/\//, ''),
    '{{PORTFOLIO_URL}}': profile.portfolio_url || profile.github || '',
    '{{PORTFOLIO_DISPLAY}}': (profile.portfolio_url || profile.github || 'github.com/yourusername').replace(/^https?:\/\//, ''),
    '{{LOCATION}}': profile.location || 'Your City, State',
    '{{SECTION_SUMMARY}}': 'PROFESSIONAL SUMMARY',
    '{{SECTION_COMPETENCIES}}': 'CORE COMPETENCIES',
    '{{SECTION_EXPERIENCE}}': 'PROFESSIONAL EXPERIENCE',
    '{{SECTION_PROJECTS}}': 'PROJECTS',
    '{{SECTION_EDUCATION}}': 'EDUCATION',
    '{{SECTION_CERTIFICATIONS}}': 'CERTIFICATIONS',
    '{{SECTION_SKILLS}}': 'SKILLS',
    '{{SUMMARY_TEXT}}': taggedSummary,
    '{{COMPETENCIES}}': COMPETENCIES.map(k => `<span class="competency-tag">${k}</span>`).join('\n      '),
    '{{EXPERIENCE}}': EXPERIENCE,
    '{{PROJECTS}}': PROJECTS,
    '{{EDUCATION}}': EDUCATION,
    '{{CERTIFICATIONS}}': CERTIFICATIONS,
    '{{SKILLS}}': SKILLS,
  };

  let html = TEMPLATE;
  for (const [k, v] of Object.entries(placeholders)) {
    html = html.split(k).join(v);
  }
  return html;
}

console.log(`Regenerating ${REGEN.length} PDFs with new plain-black Times New Roman template...\n`);

let done = 0, failed = [];
for (const [slug, reportPath] of REGEN) {
  const html = buildHtml(slug, reportPath);
  const tmpPath = `/tmp/cv-${slug}-regen.html`;
  // Extract YYYY-MM-DD from slug tail (e.g., "distyl-2026-04-20" -> "2026-04-20")
  const dateMatch = slug.match(/(2026-\d{2}-\d{2})$/);
  const dateFolder = dateMatch ? dateMatch[1] : 'misc';
  const pdfDir = `output/${dateFolder}`;
  execSync(`mkdir -p "${pdfDir}"`);
  const pdfPath = `${pdfDir}/cv-your-name-${slug}.pdf`;
  writeFileSync(tmpPath, html, 'utf-8');
  try {
    execSync(`node generate-pdf.mjs "${tmpPath}" "${pdfPath}"`, { stdio: ['ignore', 'ignore', 'ignore'] });
    done++;
    process.stdout.write(`  [${done}/${REGEN.length}] ${slug}\n`);
  } catch (err) {
    failed.push({ slug, err: err.message?.slice(0, 80) });
    process.stdout.write(`  [FAIL] ${slug}: ${err.message?.slice(0, 80)}\n`);
  }
}

console.log(`\nDone. ${done}/${REGEN.length} regenerated, ${failed.length} failed.`);
if (failed.length) console.log('Failures:', JSON.stringify(failed, null, 2));
