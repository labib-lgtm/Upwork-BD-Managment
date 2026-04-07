ALTER TABLE public.role_permissions DROP CONSTRAINT role_permissions_tab_id_check;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_tab_id_check CHECK (tab_id = ANY (ARRAY['dashboard','proposals','analytics','inbound','catalogs','settings','activity','overview']));
INSERT INTO public.role_permissions (role, tab_id, has_access) VALUES
  ('admin', 'activity', true),
  ('manager', 'activity', true),
  ('bd_member', 'activity', true)
ON CONFLICT DO NOTHING;