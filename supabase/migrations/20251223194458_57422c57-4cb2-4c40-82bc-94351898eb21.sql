-- First drop ALL existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can update all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can delete all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON public.proposals;

-- Create secure PERMISSIVE policies for profiles (SELECT only own)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create secure PERMISSIVE policies for proposals (user_id based)
CREATE POLICY "Users can view their own proposals" 
ON public.proposals 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proposals" 
ON public.proposals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals" 
ON public.proposals 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals" 
ON public.proposals 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);