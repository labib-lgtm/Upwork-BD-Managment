-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;

-- Create a secure policy that requires token match in the query
-- This prevents table scanning - users must know the exact token
CREATE POLICY "View invitation by exact token only"
ON public.team_invitations
FOR SELECT
TO anon, authenticated
USING (
  used_at IS NULL 
  AND expires_at > now()
  AND token = current_setting('request.headers', true)::json->>'x-invitation-token'
);