

# Proposals Page Improvements Plan

## 1. Database Migration — Add Missing Columns

Add 6 new nullable/default columns to the `proposals` table so existing data is unaffected:

| Column | Type | Default |
|--------|------|---------|
| `job_link` | text | NULL |
| `date_submitted` | date | NULL (fallback to `created_at`) |
| `deal_value` | numeric | 0 |
| `refund_amount` | numeric | 0 |
| `competition_bucket` | text | NULL |
| `video_sent` | boolean | false |

## 2. Fix Status Dropdowns

Replace current options to align with Upwork lifecycle and dashboard metrics:

- **Status**: `pending` → `viewed` → `interviewed` → `won` → `lost` → `archived` (keep as-is, these are correct)
- **Payment Status**: Change from `not_started / in_progress / completed / refunded` to `Verified / Unverified / Unknown` — matching the Upwork client payment verification model used in the `Job` type

## 3. Update Hook & Types

Update `useProposals.ts`:
- Add new fields to `Proposal` interface and `ProposalFormData`
- Include new fields in `addProposal` and `updateProposal` functions

## 4. Update Proposal Form

Add new fields to the form in `Proposals.tsx`:

- **Quick Entry section**: Add `Job Link` (URL input), `Date Submitted` (date picker), `Competition Bucket` (select: `<5`, `5-10`, `10-15`, `20-50`, `50+`), `Video Sent` (checkbox alongside Boosted)
- **Full Edit section**: Add `Deal Value` and `Refund Amount` number inputs (outcome fields, shown when expanding)

## 5. Add Search Bar

Add a text search input in the header/filter area that filters proposals by `job_title`, `profile_name`, or `notes` (client-side filtering on loaded data).

## 6. Add Column Sorting

Make table headers clickable to sort by that column (date, budget, proposed amount, connects, status). Track `sortField` and `sortDirection` in state. Toggle ascending/descending on click with a visual arrow indicator.

## 7. Add Pagination

Add pagination below the table:
- 25 rows per page default
- Use the existing `Pagination` UI component from `src/components/ui/pagination.tsx`
- Slice `filteredProposals` by current page

## 8. Add Summary Stats Bar

Add a stats row between filters and the table showing key metrics calculated from `filteredProposals`:
- **Total Proposals** (count)
- **Total Connects Spent** (sum of `connects_used`)
- **Win Rate** (won / total %)
- **View Rate** (viewed / total %)
- **Total Deal Value** (sum of `deal_value` for won)
- **Avg Budget** (average of `budget`)

## 9. Add CSV Export

Add a "Export CSV" button in the header next to "Add Proposal":
- Generate CSV from current `filteredProposals` with all columns
- Trigger browser download as `proposals-YYYY-MM-DD.csv`
- No external library needed — use `Blob` + `URL.createObjectURL`

## 10. Update Table Columns

Update the table to show new columns:
- Add `Job Link` as a clickable external link icon
- Show `date_submitted` (or `created_at` fallback) in the Date column
- Add `Competition` column
- Add `Video` column (checkmark icon)
- Keep Deal Value and Refund in the expandable edit form only (not in table, to avoid clutter)

## Implementation Order

1. Database migration (new columns)
2. Update `useProposals.ts` hook and types
3. Update form with new fields and fixed dropdowns
4. Add search, sort, pagination, stats, CSV export to `Proposals.tsx`
5. Update table columns display

