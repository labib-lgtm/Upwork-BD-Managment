
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create a restrictive policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins to also view all profiles (permissive, but restricted by the above)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
