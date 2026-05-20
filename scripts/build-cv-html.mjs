#!/usr/bin/env node
// Build a tailored CV HTML for a given role from cv.md + a per-role config.
// Usage:
//   node scripts/build-cv-html.mjs <slug> <archetype-tag> <summary-text> <output-html>
// Reuses the regen-all.mjs body content so styling is identical across PDFs.

import { readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';

const TEMPLATE = readFileSync('templates/cv-template.html', 'utf-8');
const profile = yaml.load(readFileSync('config/profile.yml', 'utf-8')).candidate;

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
        <li>Optimized <strong>T-SQL stored procedures</strong> on a compliance-sensitive ERP; query time <strong>-20%</strong>, retrieval latency <strong>-25%</strong>.</li>
        <li>Built <strong>Jenkins CI/CD pipelines</strong> for schema updates and stored-procedure deployments; deploy errors <strong>-30%</strong>, release cycle <strong>-35 to -40%</strong>.</li>
        <li>Designed performance dashboards with <strong>SQL Server DMVs + Grafana</strong>; incident recurrence <strong>-25%</strong>, root-cause resolution <strong>-30%</strong>.</li>
        <li>Tuned index maintenance and partition-aware queries; reconciliation runtime <strong>-15%</strong>, deadlocks <strong>-15%</strong>.</li>
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
      <div class="project-desc">Real-time manga translation extension shipped to the Chrome Web Store. Multi-provider abstraction (4 AI vision providers) with per-provider payload handling for worst-case failure isolation. 29 sites supported across Manifest V3 service workers.</div>
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

function buildHtml(summaryText) {
  const placeholders = {
    '{{LANG}}': 'en',
    '{{PAGE_WIDTH}}': '780px',
    '{{NAME}}': profile.full_name || 'Your Name',
    '{{PHONE}}': profile.phone || '',
    '{{EMAIL}}': profile.email || '',
    '{{LINKEDIN_URL}}': profile.linkedin?.startsWith('http') ? profile.linkedin : `https://${profile.linkedin || ''}`,
    '{{LINKEDIN_DISPLAY}}': (profile.linkedin || '').replace(/^https?:\/\//, ''),
    '{{PORTFOLIO_URL}}': profile.portfolio_url || profile.github || 'https://github.com/yourusername',
    '{{PORTFOLIO_DISPLAY}}': (profile.portfolio_url || profile.github || 'github.com/yourusername').replace(/^https?:\/\//, ''),
    '{{LOCATION}}': profile.location || 'Your City, State',
    '{{SECTION_SUMMARY}}': 'PROFESSIONAL SUMMARY',
    '{{SECTION_COMPETENCIES}}': 'CORE COMPETENCIES',
    '{{SECTION_EXPERIENCE}}': 'PROFESSIONAL EXPERIENCE',
    '{{SECTION_PROJECTS}}': 'PROJECTS',
    '{{SECTION_EDUCATION}}': 'EDUCATION',
    '{{SECTION_CERTIFICATIONS}}': 'CERTIFICATIONS',
    '{{SECTION_SKILLS}}': 'SKILLS',
    '{{SUMMARY_TEXT}}': summaryText,
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

const [, , slug, summary, outPath] = process.argv;
if (!slug || !summary || !outPath) {
  console.error('Usage: node scripts/build-cv-html.mjs <slug> <summary-text> <output-html>');
  process.exit(1);
}

writeFileSync(outPath, buildHtml(summary), 'utf-8');
console.log(`HTML written: ${outPath}`);
