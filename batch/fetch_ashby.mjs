#!/usr/bin/env node
// Bulk-fetch Ashby job postings via GraphQL POST
const QUERY = `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) { jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) { id title descriptionHtml employmentType locationName teamNames secondaryLocationNames compensationTierSummary } }`;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node batch/fetch_ashby.mjs ORG/JID [ORG/JID ...]");
  process.exit(1);
}

for (const pair of args) {
  const [org, jid] = pair.split("/");
  if (!org || !jid) {
    console.error(`bad pair: ${pair}`);
    continue;
  }
  console.log(`=== ${org} / ${jid} ===`);
  try {
    const res = await fetch(
      "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: "ApiJobPosting",
          variables: { organizationHostedJobsPageName: org, jobPostingId: jid },
          query: QUERY,
        }),
      }
    );
    const json = await res.json();
    if (json.errors) {
      console.log(JSON.stringify(json.errors, null, 2));
      continue;
    }
    const j = json.data?.jobPosting;
    if (!j) {
      console.log("CLOSED/MISSING");
      continue;
    }
    console.log(`title: ${j.title}`);
    console.log(`employmentType: ${j.employmentType}`);
    console.log(`locationName: ${j.locationName}`);
    console.log(`secondaryLocationNames: ${(j.secondaryLocationNames || []).join(" | ")}`);
    console.log(`teamNames: ${(j.teamNames || []).join(" | ")}`);
    console.log(`compensationTierSummary: ${j.compensationTierSummary}`);
    // Strip HTML for brevity
    const desc = (j.descriptionHtml || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    console.log(`description: ${desc}`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
  console.log("");
}
