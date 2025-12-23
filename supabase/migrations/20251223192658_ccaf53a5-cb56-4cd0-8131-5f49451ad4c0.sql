-- Enable realtime for proposals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;

-- Enable realtime for bd_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bd_profiles;