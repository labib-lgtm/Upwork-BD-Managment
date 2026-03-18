

# Dashboard Updates: New KPIs, Formula Fixes, Recent Activity Cards with Drill-Down

## 1. Formula Fixes in `Dashboard.tsx`

**Spend calculation** (line 58): Currently `connects * connect_cost`, ignoring returned connects.
Fix to: `(connects - returnedConnects) * connect_cost`

## 2. New KPI Fields

Add to `KPIMetrics` in `src/types/index.ts`:
- `boostedConnects: number`
- `returnedConnects: number`  
- `newClientRate: number` (percentage)

Update `calculateMetricsFromProposals` and `calculateTotals` in `Dashboard.tsx` to aggregate these from proposal data.

## 3. New KPI Table Rows

- **Investment**: Add "Boosted Connects" and "Returned Connects" rows after "Connects"
- **Activity**: Add "New Client %" row after "Closes (Won)"

## 4. Recent Activity Cards with Drill-Down

Add a row of 3 clickable cards above the summary cards showing proposals from Last 24h, Last 7 Days, Last 14 Days. Each card displays: proposal count, connects spent, wins.

**Clicking a card** switches to the Proposals tab with a date filter pre-applied.

### Implementation:

- **`DashboardProps`**: Add `onViewProposals?: (range: '1d' | '7d' | '14d') => void` callback
- **`src/pages/Index.tsx`**: Add `proposalDateFilter` state. When callback fires, set `activeTab = 'proposals'` and `proposalDateFilter = range`. Pass filter to `Proposals` component. Clear filter when user manually changes tabs.
- **`src/components/Proposals.tsx`**: Accept optional `dateFilter` prop. On mount/change, compute start date from range and pre-filter the table. Show a dismissible banner indicating the active filter.

## Files to Change

1. `src/types/index.ts` — add 3 fields to `KPIMetrics`
2. `src/components/Dashboard.tsx` — fix spend formula, add new KPI calculations, add recent activity cards section with click handler
3. `src/pages/Index.tsx` — add `proposalDateFilter` state, wire callback between Dashboard and Proposals
4. `src/components/Proposals.tsx` — accept `dateFilter` prop, apply date filtering, show filter indicator

