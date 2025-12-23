-- Enable realtime for role_permissions table
ALTER TABLE public.role_permissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_permissions;