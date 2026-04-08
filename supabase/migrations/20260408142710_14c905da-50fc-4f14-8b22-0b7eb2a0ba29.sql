
-- Enums
CREATE TYPE public.invite_source AS ENUM ('search', 'recommendation', 'boosted', 'direct', 'other');
CREATE TYPE public.ab_test_type AS ENUM ('headline', 'photo', 'description', 'portfolio');
CREATE TYPE public.catalog_status AS ENUM ('draft', 'published', 'optimizing', 'archived');
CREATE TYPE public.catalog_action_type AS ENUM ('optimize_title', 'update_thumbnail', 'revise_pricing', 'add_extras', 'update_description');
CREATE TYPE public.fulfillment_status AS ENUM ('pending', 'in_progress', 'delivered', 'cancelled');

-- 1. inbound_metrics
CREATE TABLE public.inbound_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bd_profile_id UUID NOT NULL REFERENCES public.bd_profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'WEEK',
  fiscal_year INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  week_label TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  boosted_clicks INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  invites INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  closes INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  manual_spend NUMERIC NOT NULL DEFAULT 0,
  connects_used_boost INTEGER NOT NULL DEFAULT 0,
  connects_available_now INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inbound_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbound metrics" ON public.inbound_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can insert own inbound metrics" ON public.inbound_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inbound metrics" ON public.inbound_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own inbound metrics" ON public.inbound_metrics FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 2. inbound_invite_sources
CREATE TABLE public.inbound_invite_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inbound_metric_id UUID NOT NULL REFERENCES public.inbound_metrics(id) ON DELETE CASCADE,
  source invite_source NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inbound_invite_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invite sources" ON public.inbound_invite_sources FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inbound_metrics im WHERE im.id = inbound_metric_id AND (im.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can insert invite sources" ON public.inbound_invite_sources FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.inbound_metrics im WHERE im.id = inbound_metric_id AND im.user_id = auth.uid()));
CREATE POLICY "Users can update invite sources" ON public.inbound_invite_sources FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inbound_metrics im WHERE im.id = inbound_metric_id AND (im.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can delete invite sources" ON public.inbound_invite_sources FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inbound_metrics im WHERE im.id = inbound_metric_id AND (im.user_id = auth.uid() OR is_admin(auth.uid()))));

-- 3. inbound_ab_tests
CREATE TABLE public.inbound_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bd_profile_id UUID NOT NULL REFERENCES public.bd_profiles(id) ON DELETE CASCADE,
  variation_name TEXT NOT NULL,
  test_type ab_test_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inbound_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ab tests" ON public.inbound_ab_tests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can insert own ab tests" ON public.inbound_ab_tests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ab tests" ON public.inbound_ab_tests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own ab tests" ON public.inbound_ab_tests FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 4. catalogs
CREATE TABLE public.catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bd_profile_id UUID NOT NULL REFERENCES public.bd_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status catalog_status NOT NULL DEFAULT 'draft',
  base_price NUMERIC NOT NULL DEFAULT 0,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  description TEXT,
  date_created DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalogs" ON public.catalogs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can insert own catalogs" ON public.catalogs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalogs" ON public.catalogs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own catalogs" ON public.catalogs FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 5. catalog_actions
CREATE TABLE public.catalog_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  action_type catalog_action_type NOT NULL,
  month_name TEXT NOT NULL,
  week_label TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view catalog actions" ON public.catalog_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND (c.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can insert catalog actions" ON public.catalog_actions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can update catalog actions" ON public.catalog_actions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND (c.user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can delete catalog actions" ON public.catalog_actions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND (c.user_id = auth.uid() OR is_admin(auth.uid()))));

-- 6. catalog_orders
CREATE TABLE public.catalog_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  fulfillment_status fulfillment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalog orders" ON public.catalog_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can insert own catalog orders" ON public.catalog_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalog orders" ON public.catalog_orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own catalog orders" ON public.catalog_orders FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 7. catalog_competitors
CREATE TABLE public.catalog_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  competitor_title TEXT NOT NULL,
  competitor_price NUMERIC NOT NULL DEFAULT 0,
  competitor_delivery_days INTEGER NOT NULL DEFAULT 7,
  competitor_rating NUMERIC,
  seller_name TEXT,
  date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalog competitors" ON public.catalog_competitors FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can insert own catalog competitors" ON public.catalog_competitors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalog competitors" ON public.catalog_competitors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own catalog competitors" ON public.catalog_competitors FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_inbound_metrics_updated_at BEFORE UPDATE ON public.inbound_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inbound_ab_tests_updated_at BEFORE UPDATE ON public.inbound_ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalogs_updated_at BEFORE UPDATE ON public.catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalog_actions_updated_at BEFORE UPDATE ON public.catalog_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalog_orders_updated_at BEFORE UPDATE ON public.catalog_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalog_competitors_updated_at BEFORE UPDATE ON public.catalog_competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
