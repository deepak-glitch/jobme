#!/usr/bin/env node
// Quick Ashby GraphQL fetcher: node scripts/ashby-fetch.mjs <org> <jobId>
const [org, jobId] = process.argv.slice(2);
if (!org || !jobId) { console.error('usage: node scripts/ashby-fetch.mjs <org> <jobId>'); process.exit(2); }
const body = {
  operationName: 'ApiJobPosting',
  variables: { organizationHostedJobsPageName: org, jobPostingId: jobId },
  query: `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) {
    jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) {
      id title locationName employmentType descriptionHtml departmentName teamNames secondaryLocationNames compensationTierSummary
    }
  }`
};
const r = await fetch('https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
const j = await r.json();
if (j.errors || !j.data || !j.data.jobPosting) {
  console.error('ERROR:', JSON.stringify(j, null, 2));
  process.exit(1);
}
const p = j.data.jobPosting;
// Strip HTML tags for plain text
const text = (p.descriptionHtml || '').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
console.log('TITLE:', p.title);
console.log('LOC:', p.locationName);
console.log('SEC:', (p.secondaryLocationNames || []).join(' | '));
console.log('EMP:', p.employmentType);
console.log('COMP:', p.compensationTierSummary || '');
console.log('DEP:', p.departmentName || '');
console.log('TEAMS:', (p.teamNames || []).join(' | '));
console.log('---DESC---');
console.log(text);
