
-- Follow-ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  follow_up_date DATE NOT NULL,
  follow_up_type TEXT NOT NULL DEFAULT 'check_viewed',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_follow_ups_user_date ON public.follow_ups (user_id, follow_up_date);
CREATE INDEX idx_follow_ups_proposal ON public.follow_ups (proposal_id);
CREATE INDEX idx_follow_ups_status ON public.follow_ups (status);

-- RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follow-ups"
  ON public.follow_ups FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create their own follow-ups"
  ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can delete their own follow-ups"
  ON public.follow_ups FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Trigger: auto-create follow-ups on proposal insert
CREATE OR REPLACE FUNCTION public.auto_create_follow_ups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Day 3: check if viewed
  INSERT INTO public.follow_ups (proposal_id, user_id, follow_up_date, follow_up_type)
  VALUES (NEW.id, NEW.user_id, COALESCE(NEW.date_submitted::date, CURRENT_DATE) + INTERVAL '3 days', 'check_viewed');
  
  -- Day 7: follow up if no interview
  INSERT INTO public.follow_ups (proposal_id, user_id, follow_up_date, follow_up_type)
  VALUES (NEW.id, NEW.user_id, COALESCE(NEW.date_submitted::date, CURRENT_DATE) + INTERVAL '7 days', 'follow_up');
  
  -- Day 14: final follow-up
  INSERT INTO public.follow_ups (proposal_id, user_id, follow_up_date, follow_up_type)
  VALUES (NEW.id, NEW.user_id, COALESCE(NEW.date_submitted::date, CURRENT_DATE) + INTERVAL '14 days', 'final_follow_up');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_follow_ups
  AFTER INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_follow_ups();

-- Telegram settings table
CREATE TABLE public.telegram_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  chat_id TEXT,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  alert_types JSONB NOT NULL DEFAULT '["won", "lost_high_value"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own telegram settings"
  ON public.telegram_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Telegram alert log table
CREATE TABLE public.telegram_alert_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_alert_log_user ON public.telegram_alert_log (user_id, sent_at);

ALTER TABLE public.telegram_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert logs"
  ON public.telegram_alert_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Enable realtime for follow_ups
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
