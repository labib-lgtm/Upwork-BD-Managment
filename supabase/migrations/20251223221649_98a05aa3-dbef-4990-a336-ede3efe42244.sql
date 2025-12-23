-- Migration: Fix security issues
-- 1. Fix bd_profiles RLS policies to enforce proper access control
-- 2. Add CHECK constraints for proposal numeric validation

-- =====================================================
-- FIX 1: bd_profiles RLS policies (access control bypass)
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view bd_profiles" ON public.bd_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert bd_profiles" ON public.bd_profiles;
DROP POLICY IF EXISTS "Authenticated users can update bd_profiles" ON public.bd_profiles;

-- Create proper access-controlled policies
CREATE POLICY "Users can view accessible bd_profiles"
ON public.bd_profiles
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) 
  OR has_profile_access(auth.uid(), id)
);

CREATE POLICY "Admins can insert bd_profiles"
ON public.bd_profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can update accessible bd_profiles"
ON public.bd_profiles
FOR UPDATE
TO authenticated
USING (
  is_admin(auth.uid()) 
  OR has_profile_access(auth.uid(), id)
);

-- =====================================================
-- FIX 2: Add CHECK constraints for proposal data validation
-- =====================================================

-- Add constraints to proposals table for data integrity
ALTER TABLE public.proposals
ADD CONSTRAINT budget_non_negative 
  CHECK (budget IS NULL OR budget >= 0),
ADD CONSTRAINT proposed_amount_non_negative 
  CHECK (proposed_amount IS NULL OR proposed_amount >= 0),
ADD CONSTRAINT client_rating_valid 
  CHECK (client_rating IS NULL OR (client_rating >= 0 AND client_rating <= 5)),
ADD CONSTRAINT client_total_spent_non_negative 
  CHECK (client_total_spent IS NULL OR client_total_spent >= 0),
ADD CONSTRAINT connects_used_valid 
  CHECK (connects_used IS NULL OR (connects_used >= 0 AND connects_used <= 100));

-- Add constraints to goals table for data integrity
ALTER TABLE public.goals
ADD CONSTRAINT revenue_target_non_negative 
  CHECK (revenue_target IS NULL OR revenue_target >= 0),
ADD CONSTRAINT proposal_target_non_negative 
  CHECK (proposal_target IS NULL OR proposal_target >= 0),
ADD CONSTRAINT closes_target_non_negative 
  CHECK (closes_target IS NULL OR closes_target >= 0);