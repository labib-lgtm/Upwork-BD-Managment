

# Activity Feed — Dynamic, Query-Driven Timeline

## Concept Change

Instead of hardcoded 3-day/7-day views, the Activity Feed will have a **date range picker** and **quick filter buttons** so users can select any custom timeframe. The page adapts to whatever period is selected.

## What You Get

**Top Bar Controls:**
- Quick filter chips: "Today", "Yesterday", "Last 3 Days", "Last 7 Days", "Last 30 Days"
- Custom date range picker (from/to) for any arbitrary window
- Profile filter dropdown (filter by BD profile)

**Activity Timeline Section:**
- Chronological feed of all proposal events within the selected range
- Event types: new submissions, status changes, wins, losses, follow-up completions
- Color-coded badges per event type
- Relative timestamps ("2 hours ago") for recent, absolute dates for older

**Summary Stats Bar:**
- Dynamic stats for the selected period: total proposals, connects spent, wins, losses, revenue, pending follow-ups

**Data Table Section:**
- All proposals created or updated within the selected range
- Sortable columns: Date, Profile, Job Title, Status, Connects, Budget, Client Country
- Export-friendly layout

## Files to Create/Change

1. **`src/types/index.ts`** — Add `'activity'` to `NavigationTab`
2. **`src/components/ActivityFeed.tsx`** — New component with date range state, quick filters, timeline, and data table
3. **`src/components/Sidebar.tsx`** — Add Activity nav item (Clock icon)
4. **`src/pages/Index.tsx`** — Add `activity` case to `renderContent()`

## Technical Details

- Uses existing `useProposals` and `useFollowUps` hooks — filters client-side by `created_at`, `updated_at`, and `date_submitted` based on the selected range
- No database changes needed
- Date range state managed with `useState<{ from: Date; to: Date }>`
- Quick filter buttons simply set the date range (e.g., "Last 7 Days" sets `from` to 7 days ago, `to` to now)
- Uses shadcn Calendar/Popover for custom date picking

