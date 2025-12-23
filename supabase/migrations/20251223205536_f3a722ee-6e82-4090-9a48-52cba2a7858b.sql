-- Create table to manage user access to BD profiles
CREATE TABLE public.user_profile_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bd_profile_id UUID NOT NULL REFERENCES public.bd_profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bd_profile_id)
);

-- Enable RLS
ALTER TABLE public.user_profile_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access
CREATE POLICY "Admins can manage profile access"
ON public.user_profile_access
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view their own access
CREATE POLICY "Users can view their own access"
ON public.user_profile_access
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check if user has access to a BD profile
CREATE OR REPLACE FUNCTION public.has_profile_access(_user_id uuid, _bd_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_admin(_user_id) 
    OR EXISTS (
      SELECT 1
      FROM public.user_profile_access
      WHERE user_id = _user_id
        AND bd_profile_id = _bd_profile_id
    )
$$;

-- Create function to get accessible profile names for a user
CREATE OR REPLACE FUNCTION public.get_accessible_profile_names(_user_id uuid)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN is_admin(_user_id) THEN 
        (SELECT ARRAY_AGG(name) FROM public.bd_profiles WHERE is_active = true)
      ELSE 
        (SELECT ARRAY_AGG(bp.name) 
         FROM public.user_profile_access upa
         JOIN public.bd_profiles bp ON upa.bd_profile_id = bp.id
         WHERE upa.user_id = _user_id AND bp.is_active = true)
    END
$$;