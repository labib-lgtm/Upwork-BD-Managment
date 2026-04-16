
CREATE TABLE public.job_post_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_link text NOT NULL UNIQUE,
  title text,
  description text,
  budget_text text,
  job_type text,
  skills text[],
  experience_level text,
  client_location text,
  client_total_spent text,
  client_hire_count text,
  client_rating text,
  client_reviews text,
  client_payment_verified boolean,
  posted_date text,
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  raw_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_post_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view job post cache"
ON public.job_post_cache FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert job post cache"
ON public.job_post_cache FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update job post cache"
ON public.job_post_cache FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete job post cache"
ON public.job_post_cache FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

CREATE TRIGGER update_job_post_cache_updated_at
BEFORE UPDATE ON public.job_post_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
