

# All P0 Features Implementation Plan

Based on the roadmap, here are the P0 features that are **not yet built**, grouped by category:

## P0 Features to Build

### 1. Telegram Daily Digest & Real-Time Alerts
**What**: A Telegram bot that sends the founder a daily performance summary and real-time alerts for critical events (proposal won, big deal lost, target milestones hit).

**How**:
- Connect Telegram via the connector system
- Create an edge function `telegram-daily-digest` that queries proposals data, computes daily/weekly KPIs, and sends a formatted summary message
- Create an edge function `telegram-alerts` that checks for critical events (new wins, losses > threshold, target milestones)
- Schedule the digest via `pg_cron` (e.g. daily at 9 AM)
- Schedule alert checks every 5 minutes via `pg_cron`
- Add a `telegram_settings` table to store the chat_id and alert preferences
- Add a Settings UI section for configuring Telegram (entering chat ID, toggling alert types)

**Database changes**:
- New table: `telegram_settings` (id, user_id, chat_id, daily_digest_enabled, alerts_enabled, alert_types jsonb, created_at, updated_at)
- New table: `telegram_alert_log` (id, alert_type, message, sent_at) — prevents duplicate alerts

### 2. One-Tap Status Updates
**What**: Quick status change buttons directly on the Dashboard and Proposals table — no need to open the full edit form just to change a status.

**How**:
- Add inline status dropdown/buttons on proposal table rows (click status badge to cycle or pick from dropdown)
- When status changes to "won" or "lost", show a minimal popup for deal_value/loss_reason/win_factor only
- Add a "Recent Proposals" quick-action section on Dashboard showing last 5-10 proposals with one-tap status buttons

**Files**: `src/components/Proposals.tsx`, `src/components/Dashboard.tsx`

### 3. Smart Defaults & Auto-Fill
**What**: Pre-fill proposal form fields based on the user's history to speed up data entry.

**How**:
- Remember last-used values per profile (budget range, job_type, payment_status, connects_used) in localStorage
- Auto-suggest connects_used based on boosted toggle (already partially done: 6 vs 8)
- Pre-fill `date_submitted` with today (already done)
- Pre-fill profile_name with last-used profile (already done)
- Add "duplicate proposal" button on existing rows to clone as a new entry

**Files**: `src/components/Proposals.tsx`

### 4. Follow-Up Cadence Engine
**What**: Automated follow-up reminders so no proposal goes unfollowed-up after submission.

**How**:
- New database table: `follow_ups` (id, proposal_id, follow_up_date, follow_up_type, status, notes, created_at)
- Default cadence: Day 3 (check if viewed), Day 7 (follow up if no interview), Day 14 (final follow-up)
- Auto-generate follow-up records when a proposal is created
- Dashboard widget showing "Follow-Ups Due Today" with count badge
- Follow-up list view with mark-as-done functionality
- Telegram alert for overdue follow-ups (ties into alert system)

**Database changes**:
- New table: `follow_ups` with RLS policies
- Trigger: auto-create follow-up records on proposal insert

### 5. Extended Pipeline Stages
**What**: Add granular stages beyond the current status options to track "in conversation," "meeting booked," "negotiating."

**How**:
- Extend the proposal `status` options to include: `pending → viewed → in_conversation → meeting_booked → negotiating → won/lost/archived`
- Update all status references in Dashboard, Proposals, and Analytics components
- Update the Pipeline Funnel analytics to show the new stages
- Backward compatible — existing proposals keep their current statuses

**Files**: `src/components/Proposals.tsx`, `src/components/Dashboard.tsx`, `src/components/analytics/PipelineFunnel.tsx`, `src/hooks/useProposals.ts`

## Implementation Order

```text
Phase 1 (Sprint A): Workflow improvements
  ├── One-Tap Status Updates (Proposals table inline editing)
  ├── Smart Defaults (localStorage memory + duplicate button)
  └── Extended Pipeline Stages (add new statuses)

Phase 2 (Sprint B): Sales Development
  ├── follow_ups table + auto-generation trigger
  ├── Follow-Up Dashboard widget
  └── Follow-up list/management UI

Phase 3 (Sprint C): Telegram Notifications
  ├── Connect Telegram connector
  ├── telegram_settings table + Settings UI
  ├── Daily Digest edge function + cron
  └── Real-Time Alerts edge function + cron
```

## Technical Details

**Database migrations needed**:
1. `follow_ups` table with columns: id, proposal_id (FK), user_id, follow_up_date, follow_up_type (text), status (pending/done/skipped), notes, created_at
2. `telegram_settings` table for bot config per user
3. `telegram_alert_log` table for deduplication
4. Database trigger on proposals INSERT to auto-create follow-up records
5. RLS policies on all new tables

**Edge functions needed**:
1. `telegram-daily-digest` — queries KPIs, formats message, sends via gateway
2. `telegram-alerts` — checks for critical events, sends alerts, logs to prevent duplicates

**No changes to existing database schema** — the current `status` field is a text column, so adding new status values requires only code changes.

**Estimated scope**: ~15 files modified/created, 3 database migrations, 2 edge functions, 2 cron jobs.

