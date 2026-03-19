ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS loss_reason text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS win_factor text;