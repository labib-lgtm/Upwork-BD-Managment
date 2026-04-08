

# Inbound Tracking & Catalog Management — Full Build

## Overview

Build both modules from placeholder to fully functional, with all four enhancements included: A/B test tracking for Inbound, invite source breakdown, catalog order tracking, and competitor benchmarking.

---

## Module 1: Inbound Tracking

**Data tables needed:**
- `inbound_metrics` — weekly/monthly profile performance (impressions, boosted clicks, profile views, invites, conversations, closes, sales, boost spend)
- `inbound_invite_sources` — per-metric breakdown of invite origins (search, recommendations, boosted visibility, direct)
- `inbound_ab_tests` — track profile variations (headline, photo, description) with start/end dates, and link to metrics for comparison

**UI sections:**
1. **KPI Summary Cards** — Total impressions, profile views, invites, conversations, closes, conversion rate, boost ROI for selected period
2. **Metrics Data Table** — CRUD table for weekly/monthly inbound metrics with inline editing, date range filter, profile filter
3. **Invite Source Breakdown** — Stacked bar or pie chart showing where invites come from per period
4. **A/B Test Tracker** — Table of profile variations being tested, with side-by-side metric comparison (e.g., Headline A vs B: which drove more invites?)

---

## Module 2: Catalog Management

**Data tables needed:**
- `catalogs` — service listings (title, status, base price, delivery days, tier/extras, bd_profile_id)
- `catalog_actions` — optimization task checklist per catalog item (action type, week, done/not)
- `catalog_orders` — orders received per catalog (order date, buyer, amount, fulfillment status)
- `catalog_competitors` — competitor listings (title, price, delivery days, seller rating, date logged)

**UI sections:**
1. **Catalog List** — Card or table view of all catalog items with status badges, price, delivery time
2. **Optimization Actions** — Checklist panel per catalog item (optimize title, update thumbnail, etc.) with progress tracking
3. **Order Tracking** — Table of orders per catalog: date, buyer info, amount, fulfillment status (pending/in-progress/delivered/cancelled)
4. **Competitor Benchmarking** — Table to log and compare competitor catalog items: their price, delivery, rating vs yours

---

## Database Migrations

Eight new tables total, all with RLS policies scoped to authenticated users with profile access or admin:

1. `inbound_metrics` — period metrics per BD profile
2. `inbound_invite_sources` — FK to inbound_metrics, source enum (search/recommendation/boosted/direct), count
3. `inbound_ab_tests` — variation name, type (headline/photo/description), active flag, date range, bd_profile_id
4. `catalogs` — title, status enum, base_price, delivery_days, bd_profile_id, user_id
5. `catalog_actions` — FK to catalogs, action_type enum, week_label, is_done
6. `catalog_orders` — FK to catalogs, order_date, buyer_name, amount, fulfillment_status enum
7. `catalog_competitors` — FK to catalogs, competitor_title, competitor_price, competitor_delivery_days, competitor_rating, date_logged

Update `role_permissions` check constraint and seed permissions for `inbound` and `catalogs` tabs.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create 7 tables + RLS + permission seeds |
| `src/hooks/useInboundMetrics.ts` | CRUD hook for inbound_metrics |
| `src/hooks/useInboundInviteSources.ts` | Hook for invite source data |
| `src/hooks/useInboundABTests.ts` | Hook for A/B test entries |
| `src/hooks/useCatalogs.ts` | CRUD hook for catalogs |
| `src/hooks/useCatalogActions.ts` | Hook for optimization tasks |
| `src/hooks/useCatalogOrders.ts` | Hook for order tracking |
| `src/hooks/useCatalogCompetitors.ts` | Hook for competitor data |
| `src/components/InboundTracking.tsx` | Main inbound page component |
| `src/components/inbound/InboundMetricsTable.tsx` | Metrics data table |
| `src/components/inbound/InviteSourceChart.tsx` | Source breakdown chart |
| `src/components/inbound/ABTestTracker.tsx` | A/B test comparison UI |
| `src/components/CatalogManagement.tsx` | Main catalog page component |
| `src/components/catalog/CatalogList.tsx` | Catalog items table/cards |
| `src/components/catalog/CatalogActions.tsx` | Optimization checklist |
| `src/components/catalog/OrderTracking.tsx` | Orders table |
| `src/components/catalog/CompetitorBenchmark.tsx` | Competitor comparison table |
| `src/pages/Index.tsx` | Wire up both tabs in renderContent |
| `src/types/index.ts` | Add new interfaces/enums for orders, sources, AB tests, competitors |

---

## Technical Notes

- All tables use `user_id` referencing the logged-in user (no FK to auth.users)
- RLS: users see own data or data for profiles they have access to; admins see all
- Recharts for invite source charts
- Inline editing for metrics and catalog items using shadcn Dialog forms
- Date range filtering reuses the pattern from ActivityFeed

