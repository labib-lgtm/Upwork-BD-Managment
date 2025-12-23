-- Create app_settings table for shared settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

-- Insert default fiscal year setting
INSERT INTO public.app_settings (key, value) 
VALUES ('fiscal_year_start', '1'::jsonb);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;