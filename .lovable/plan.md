

# Proposal vs Job Post Comparison View

## Problem
The current edit modal shows proposal fields in a form, but there's no way to compare what the proposal says against what the job actually asked for. You want to see them side-by-side so you can evaluate if BD members are targeting the right jobs with the right proposals.

## Solution: Comparison-Focused Two-Panel Layout

Instead of a generic "details left, job right" layout, the view is organized around **comparison points** — matching fields are placed at the same visual level so discrepancies jump out immediately.

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Proposal vs Job Post Comparison                                 [X] │
├─────────────────────────────┬────────────────────────────────────────┤
│  📄 JOB POST (scraped)     │  📝 OUR PROPOSAL                      │
│                             │                                        │
│  Title:                     │  Job Title (what BD entered):          │
│  Amazon PPC & Catalog Mgmt  │  Amazon PPC & Catalog Mgmt             │
│                             │                                        │
│  ── Budget & Pricing ──     │  ── Our Bid ──                         │
│  Budget: $500 – $1,000      │  Proposed: $10  ⚠️ (mismatch?)        │
│  Type: Fixed-price          │  Type: Fixed                           │
│                             │  Deal Value: $0                        │
│                             │                                        │
│  ── Requirements ──         │  ── What We Offered ──                 │
│  Skills: Amazon PPC,        │  Profile: Labib Profile                │
│    Product Listing, SEO     │  Connects: 27 (boosted: 0)            │
│  Experience: Expert         │  Video Sent: No                        │
│  Description:               │                                        │
│  "Looking for experienced   │  ── Cover Letter / Notes ──           │
│   PPC specialist to..."     │  "Perfect, I can fully manage          │
│  [full description below]   │   your Amazon catalog and PPC..."      │
│                             │                                        │
│  ── Client Info (from post)─│  ── Client Info (our records) ──      │
│  Location: United States    │  Country: US  ✓                        │
│  Total Spent: $18,000       │  Total Spent: $18,000  ✓               │
│  Hire Rate: 84 hires        │  Hire Count: 84  ✓                     │
│  Rating: 5.0 (7 reviews)   │  Rating: 5.0 (7 reviews)  ✓            │
│  Payment: Verified          │  Payment: Verified  ✓                  │
│                             │                                        │
│  ── Full Job Description ── │  ── Status & Outcome ──               │
│  [scrollable markdown]      │  Status: pending                       │
│                             │  Competition: 10-15                    │
│                             │  Interviewing: 0                       │
│                             │                                        │
│  [Refresh] [Open on Upwork↗]│  [Edit Proposal]                      │
├─────────────────────────────┴────────────────────────────────────────┤
│                                                   [Close] [Update]   │
└──────────────────────────────────────────────────────────────────────┘
```

Key design decisions:
- **Job post on the LEFT** (the reference/source of truth) and **proposal on the RIGHT** (what we submitted) — natural reading order for evaluation
- **Matching sections aligned horizontally** — Budget vs Bid, Job Requirements vs What We Offered, Client Info comparison with match/mismatch indicators (checkmarks and warnings)
- **Mismatch highlighting** — when our proposed amount is far from the job budget, or when client data doesn't match, show visual warnings
- **Edit mode toggle** — proposal side switches from read-only summary to inline editable fields

## Implementation

### 1. Database: `job_post_cache` table
Store scraped job data so we don't re-fetch every time.
- Columns: `id`, `job_link` (unique), `title`, `description`, `budget_text`, `job_type`, `skills` (text[]), `experience_level`, `client_location`, `client_total_spent`, `client_hire_count`, `client_rating`, `client_reviews`, `client_payment_verified`, `posted_date`, `scraped_at`, `raw_data` (jsonb)
- RLS: authenticated users can read/insert

### 2. Edge Function: `scrape-job-post`
- Takes an Upwork job URL
- Uses Firecrawl to scrape the page content
- Extracts structured fields from the markdown using AI (Lovable AI gateway with gemini-2.5-flash)
- Returns structured job data and caches it
- Requires Firecrawl connector

### 3. New Components
| File | Purpose |
|------|---------|
| `src/components/proposals/ProposalComparisonView.tsx` | Full-width Sheet with two-panel comparison layout |
| `src/components/proposals/JobPostPanel.tsx` | Left panel: scraped job post data with refresh button |
| `src/components/proposals/ProposalPanel.tsx` | Right panel: proposal details with edit toggle |
| `src/components/proposals/ComparisonIndicator.tsx` | Small component for match/mismatch badges |
| `src/hooks/useJobPostCache.ts` | Hook to fetch from cache or trigger scrape |

### 4. Modify `Proposals.tsx`
- Row click or edit button opens the comparison Sheet instead of the current edit modal
- Keep the Add Proposal modal as-is (no comparison needed for new proposals)

### Prerequisites
- Firecrawl connector must be connected for job scraping
- If not connected, the left panel shows a "Connect Firecrawl to auto-fetch job posts" message with a fallback "Open on Upwork" link

