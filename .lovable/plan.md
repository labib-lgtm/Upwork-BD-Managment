

# Add Client History & Connects Tracking Fields to Proposals

## New Fields (Database Migration)

Add 4 new columns to the `proposals` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `is_new_client` | boolean | false | Whether client is new to Upwork (no hire history) |
| `client_hire_count` | integer | null | Number of previous hires the client has made |
| `boosted_connects` | integer | 0 | Extra connects spent on boosting |
| `returned_connects` | integer | 0 | Connects refunded (job cancelled, proposal withdrawn) |

## UI Changes in `src/components/Proposals.tsx`

### Form (Quick + Full Mode)
- **Quick form**: Add "New Client" checkbox alongside existing "Boosted" and "Video Sent" toggles
- **Quick form**: Add "Boosted Connects" and "Returned Connects" number inputs near the existing "Connects Used" field
- **Full form**: Add "Client Hire Count" number input in the client details section

### Table
- Add "Boosted" and "Returned" sub-columns under the existing Connects column area, or as separate narrow columns
- The "New Client" flag can display as a small badge/icon in the payment status or client info area

### Stats Bar
- Update total connects calculation to account for returned connects: `net connects = connects_used - returned_connects`

## Hook Changes in `src/hooks/useProposals.ts`

- Add the 4 new fields to the `Proposal` interface and `ProposalFormData` interface
- Include them in insert/update operations

## CSV Export
- Add new columns to exported data

## Summary of Files to Change

1. **Database migration** — add 4 columns to `proposals`
2. **`src/hooks/useProposals.ts`** — update interfaces
3. **`src/components/Proposals.tsx`** — form fields, table columns, stats, CSV export

