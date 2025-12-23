-- Migration: Fix security issues
-- 1. Create RPC functions for invitation validation/redemption (fixes broken invitation flow)
-- 2. Add field-level access control to app_settings

-- =====================================================
-- FIX 1: Create RPC functions for invitation flow
-- =====================================================

-- Function to validate an invitation token
CREATE OR REPLACE FUNCTION public.validate_invitation(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  token text,
  role app_role,
  invited_by uuid,
  expires_at timestamptz,
  used_at timestamptz,
  used_by uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, email, token, role, invited_by, 
    expires_at, used_at, used_by, created_at
  FROM public.team_invitations
  WHERE team_invitations.token = _token
    AND used_at IS NULL
    AND expires_at > now();
$$;

-- Function to redeem an invitation (mark as used and assign role)
CREATE OR REPLACE FUNCTION public.redeem_invitation(_token text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation_id uuid;
  _role app_role;
BEGIN
  -- Get the invitation if valid
  SELECT id, role INTO _invitation_id, _role
  FROM public.team_invitations
  WHERE token = _token
    AND used_at IS NULL
    AND expires_at > now();
  
  -- If no valid invitation found, return false
  IF _invitation_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Assign the role to the user (insert or update)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Mark invitation as used
  UPDATE public.team_invitations
  SET used_at = now(),
      used_by = _user_id
  WHERE id = _invitation_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- FIX 2: Add field-level access control to app_settings
-- =====================================================

-- Add public column to app_settings (default true for existing settings)
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.app_settings;

-- Create new policy that checks is_public flag
CREATE POLICY "Authenticated users can view public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (is_public = true OR is_admin(auth.uid()));