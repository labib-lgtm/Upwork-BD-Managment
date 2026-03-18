

# Proposals Stats Timeline + Dashboard Data Fix

## Problems Identified

1. **Proposals page has no timeline-based stats filtering** — the summary stats bar shows overall totals but cannot be filtered by date range or month, making it hard to evaluate performance over time.

2. **Dashboard uses `created_at` instead of `date_submitted`** — line 42 of Dashboard.tsx filters proposals by `new Date(p.created_at)`, but proposals now have a `date_submitted` field. This means the dashboard bins proposals into months based on when the record was created, not when the proposal was actually submitted.

3. **Dashboard ignores `deal_value` and `refund_amount`** — revenue is calculated from `proposed_amount` (line 53-54) instead of `deal_value`, and refunds are hardcoded to 0 (line 55) despite `refund_amount` being available.

4. **Potential 1000-row limit** — `useProposals` fetches with `supabase.from('proposals').select('*')` which caps at 1000 rows. If the team has more, data will be silently truncated.

---

## Plan

### 1. Add Timeline Filter to Proposals Page

Add a date range filter (month/year picker or start/end date inputs) above the summary stats bar in `Proposals.tsx`:
- Two date inputs: "From" and "To" (default: current month)
- Filter `filteredAndSortedProposals` by `date_submitted` (fallback to `created_at`)
- Summary stats recalculate based on the filtered date range
- Add a quick-select for "This Month", "Last Month", "This Quarter", "This FY"

### 2. Fix Dashboard Date Logic

In `Dashboard.tsx` `calculateMetricsFromProposals`:
- Change line 42 from `new Date(p.created_at)` to `new Date(p.date_submitted || p.created_at)` so proposals are bucketed by submission date

### 3. Fix Dashboard Revenue Calculations

In `Dashboard.tsx` `calculateMetricsFromProposals`:
- Change revenue calculation (line 53-54) to use `deal_value` instead of `proposed_amount`
- Change refunds (line 55) to use `refund_amount` from proposals: `proposalsInMonth.filter(p => p.status === 'won').reduce((sum, p) => sum + (p.refund_amount || 0), 0)`

### 4. Handle 1000-Row Limit

In `useProposals.ts`:
- Add `.limit(5000)` or implement pagination in the fetch query to avoid silent truncation
- Alternatively, for the dashboard, create an RPC function for aggregated stats (future improvement)

### Files to Change

- `src/components/Proposals.tsx` — add timeline filter UI and date-based filtering
- `src/components/Dashboard.tsx` — fix date field, revenue, and refund calculations
- `src/hooks/useProposals.ts` — increase query limit

