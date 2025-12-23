-- Create team invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  role public.app_role NOT NULL DEFAULT 'bd_member',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.team_invitations
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Anyone can view valid invitations by token (for signup flow)
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations
FOR SELECT
TO anon, authenticated
USING (
  used_at IS NULL 
  AND expires_at > now()
);