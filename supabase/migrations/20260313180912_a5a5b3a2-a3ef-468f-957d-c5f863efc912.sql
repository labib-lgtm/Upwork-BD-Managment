ALTER TABLE public.proposals 
  ADD COLUMN is_new_client boolean NOT NULL DEFAULT false,
  ADD COLUMN client_hire_count integer DEFAULT NULL,
  ADD COLUMN boosted_connects integer NOT NULL DEFAULT 0,
  ADD COLUMN returned_connects integer NOT NULL DEFAULT 0;