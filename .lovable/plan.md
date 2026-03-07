

# Add Auto-Captured "Time" Column to Proposals

## Summary

Add a read-only "Time" column next to the "Date" column in the Proposals table. This column will display the time the proposal was created (from `created_at`), automatically captured in the user's local timezone. It is not editable — it simply records when the entry was made.

## Why This Works Without Database Changes

The `created_at` column already stores a full timestamp with timezone (`timestamptz`). We just need to display the time portion in the UI. The browser automatically converts UTC timestamps to the user's local timezone when using `new Date()`, so no timezone conversion code is needed.

## Changes

### 1. `src/components/Proposals.tsx`

- **Table header**: Add a "Time" column immediately after the "Date" column header
- **Table body**: After the date cell, add a new non-editable cell showing the time from `created_at` formatted as `hh:mm a` (e.g., "02:35 PM") using `date-fns` `format()`
- **CSV export**: Add "Time" to the export headers and include formatted time in each row
- No form field for time — it is automatically derived from the record's `created_at` timestamp

### 2. No database migration needed

`created_at` already has full timestamp data. The time is inherently stored in UTC and will render in the user's local timezone via the browser's `Date` object.

## Technical Detail

```typescript
// After the date cell in the table row:
<td className="text-muted-foreground tabular-nums text-center">
  {format(new Date(proposal.created_at), 'hh:mm a')}
</td>
```

`new Date(proposal.created_at)` converts the UTC timestamp to the user's local timezone automatically.

