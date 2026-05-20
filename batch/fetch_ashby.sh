#!/usr/bin/env bash
# Helper to bulk-fetch Ashby job postings via GraphQL
set -u

QUERY='query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) { jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) { id title descriptionHtml employmentType locationName teamNames secondaryLocationNames compensationTierSummary } }'

while IFS='|' read -r org jid; do
  [ -z "${org:-}" ] && continue
  echo "=== $org / $jid ==="
  payload=$(jq -nc --arg q "$QUERY" --arg org "$org" --arg jid "$jid" '{operationName:"ApiJobPosting", variables:{organizationHostedJobsPageName:$org, jobPostingId:$jid}, query:$q}')
  curl -s -X POST "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting" \
    -H "Content-Type: application/json" \
    -d "$payload"
  echo ""
done
