-- Create table to store role-based navigation permissions
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'bd_member')),
  tab_id TEXT NOT NULL CHECK (tab_id IN ('dashboard', 'proposals', 'inbound', 'catalogs', 'settings')),
  has_access BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(role, tab_id)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions (needed to filter navigation)
CREATE POLICY "Anyone authenticated can view permissions"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can modify permissions
CREATE POLICY "Admins can manage permissions"
ON public.role_permissions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Insert default permissions (admin has access to everything)
INSERT INTO public.role_permissions (role, tab_id, has_access) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'proposals', true),
  ('admin', 'inbound', true),
  ('admin', 'catalogs', true),
  ('admin', 'settings', true),
  ('manager', 'dashboard', true),
  ('manager', 'proposals', true),
  ('manager', 'inbound', false),
  ('manager', 'catalogs', false),
  ('manager', 'settings', false),
  ('bd_member', 'dashboard', true),
  ('bd_member', 'proposals', true),
  ('bd_member', 'inbound', false),
  ('bd_member', 'catalogs', false),
  ('bd_member', 'settings', false);