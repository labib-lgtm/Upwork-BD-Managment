-- Create bd_profiles table for managing work profiles
CREATE TABLE public.bd_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bd_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view profiles
CREATE POLICY "Authenticated users can view bd_profiles"
ON public.bd_profiles
FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can manage profiles (team collaboration)
CREATE POLICY "Authenticated users can insert bd_profiles"
ON public.bd_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update bd_profiles"
ON public.bd_profiles
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete bd_profiles"
ON public.bd_profiles
FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_bd_profiles_updated_at
BEFORE UPDATE ON public.bd_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default profiles
INSERT INTO public.bd_profiles (name, description) VALUES
  ('Profile A', 'Default business development profile'),
  ('Profile B', 'Secondary business development profile'),
  ('Profile C', 'Additional business development profile'),
  ('Profile D', 'Additional business development profile');