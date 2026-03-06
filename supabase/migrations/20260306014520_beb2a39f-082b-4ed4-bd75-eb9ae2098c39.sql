
-- Drop the policies just created (they conflict)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Single policy: users can only view their own profile, admins can view all
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin(auth.uid()));
