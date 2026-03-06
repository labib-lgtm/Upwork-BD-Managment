
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS job_link text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_submitted date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deal_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competition_bucket text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_sent boolean DEFAULT false;
