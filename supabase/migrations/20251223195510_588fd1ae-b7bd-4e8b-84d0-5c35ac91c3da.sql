-- Fix BD Profiles: Restrict DELETE to admins only
DROP POLICY IF EXISTS "Authenticated users can delete bd_profiles" ON public.bd_profiles;

CREATE POLICY "Admins can delete bd_profiles"
ON public.bd_profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add full_name length constraint to profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT full_name_length_check 
CHECK (length(full_name) <= 100);