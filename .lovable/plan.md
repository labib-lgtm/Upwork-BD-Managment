

# Scrape Job Post at Proposal Creation Time (Not on View)

## Problem
Currently, job post scraping triggers when you **open** the comparison view. This causes:
1. Delay every time you view a proposal
2. If Firecrawl is down at viewing time, you get no data
3. Data should already be there when you need it

## Solution
Move the scrape trigger to **proposal creation/update time** — when a job link is provided, fire-and-forget the scrape in the background. When you open the comparison view, the cached data is already there instantly.

## Changes

### 1. `src/hooks/useProposals.ts` — Trigger scrape after add/update
After a successful `addProposal` or `updateProposal` that includes a `job_link`, call the `scrape-job-post` edge function in the background (fire-and-forget, no await blocking the user). This means:
- User adds proposal with a job link → proposal saves → scrape kicks off silently
- User updates proposal with a new job link → same behavior

### 2. `src/components/proposals/ProposalComparisonView.tsx` — Remove auto-fetch on open
Remove the `useEffect` that triggers `scrapeJobPost()` when the sheet opens. The data will already be cached from creation time. Keep the manual "Refresh" button on the JobPostPanel so users can re-scrape if needed.

### 3. `src/components/proposals/JobPostPanel.tsx` — Update empty state
Change the "not yet fetched" empty state message to say "Job post data not available" with a "Fetch Now" button as fallback (for older proposals that were created before this change).

No database or edge function changes needed — the existing `scrape-job-post` function and `job_post_cache` table work as-is.

