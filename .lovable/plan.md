
Goal: make Job Post data be ready before the user clicks “View”, and remove the need to press “Fetch Now” in normal flow.

What I found
- The current comparison hook (`useJobPostCache`) only reads the cache and polls it. It does not automatically start scraping when the cache is empty.
- Background prefetch exists, but it is not fully reliable for this use case:
  - it only runs from the proposals table flow,
  - it only checks proposal links passed into the hook at that moment,
  - it trims links there, while the comparison hook uses the raw stored link, so cache lookups can miss if formatting differs,
  - if the user opens a proposal before that prefetch finishes, the panel falls back to “Fetch Now”.
- The edge-function logs you shared show normal boot/shutdown events, so this now looks like a client-side fetch orchestration issue, not a backend boot failure.

Plan
1. Normalize job links everywhere
- Add one shared normalization helper for job links.
- Use it consistently in:
  - proposal create/update background scrape,
  - list prefetch,
  - cache reads in `useJobPostCache`,
  - function invocation body.
- This prevents “same URL, different formatting” cache misses.

2. Make prefetch more deterministic
- Refine `useProposalJobPostPrefetch` so it tracks links by normalized value and keeps a simple in-memory state: queued / in-flight / done / failed.
- Ensure it prioritizes visible proposals immediately and avoids duplicate invocations.
- Keep the sequential/throttled behavior to avoid cold-start storms, but make it more dependable.

3. Add automatic fallback fetch in the comparison hook
- Update `useJobPostCache` so if the cache is still empty after the initial lookup, it automatically invokes `scrape-job-post` once.
- Keep manual refresh as a fallback only.
- Replace the current “poll only” behavior with:
  - initial cache check,
  - auto-trigger scrape if missing,
  - optional short cache refresh after invoke,
  - clear ready/error states.

4. Fix the empty/loading UI
- Update `JobPostPanel` so users no longer see “Fetch Now” as the primary path when the app is already working in the background.
- Show clearer states like:
  - “Preparing job post…”
  - “Still fetching details…”
  - “Retry” only if the automatic attempt actually fails.

5. Verify end-to-end
- Confirm this flow:
  - proposals page loads,
  - visible proposal links are prefetched automatically,
  - opening “Proposal vs Job Post” usually shows cached data instantly,
  - if a specific link was not prefetched yet, it auto-fetches without user action,
  - repeated opens do not trigger duplicate scrapes.

Files likely involved
- `src/hooks/useJobPostCache.ts`
- `src/hooks/useProposalJobPostPrefetch.ts`
- `src/hooks/useProposals.ts`
- `src/components/proposals/JobPostPanel.tsx`
- possibly a small shared utility like `src/lib/normalizeJobLink.ts`

Technical details
- No database schema or RLS changes should be needed.
- I’ll keep the existing backend function and caching table, and fix the client orchestration around them.
- I’ll preserve throttling so we do not reintroduce 503 cold-start issues while still making the UX automatic.

Expected result
- Job Post content should usually already be cached before clicking “View”.
- If it is not cached yet, the comparison view should fetch it automatically instead of asking the user to click “Fetch Now”.
