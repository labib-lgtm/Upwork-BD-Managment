import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TeamInvitation {
  id: string;
  email: string | null;
  token: string;
  role: 'admin' | 'manager' | 'bd_member';
  invited_by: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export const useTeamInvitations = () => {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching invitations:', error);
      setLoading(false);
      return;
    }

    setInvitations(data as TeamInvitation[]);
    setLoading(false);
  };

  const createInvitation = async (role: 'admin' | 'manager' | 'bd_member', email?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          role,
          email: email || null,
          invited_by: user.id,
        })
        .select('token')
        .single();

      if (error) throw error;

      toast.success('Invitation created successfully!');
      await fetchInvitations();
      
      return data.token;
    } catch (error) {
      toast.error('Failed to create invitation');
      logger.error('Error creating invitation:', error);
      return null;
    }
  };

  const deleteInvitation = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invitation deleted');
      await fetchInvitations();
      return true;
    } catch (error) {
      toast.error('Failed to delete invitation');
      logger.error('Error deleting invitation:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  return {
    invitations,
    loading,
    fetchInvitations,
    createInvitation,
    deleteInvitation,
  };
};

// Separate function to validate and use an invitation (can be called without auth)
export const validateInvitation = async (token: string): Promise<TeamInvitation | null> => {
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    logger.error('Error validating invitation:', error);
    return null;
  }

  return data as TeamInvitation | null;
};

export const redeemInvitation = async (token: string, userId: string): Promise<boolean> => {
  try {
    // Get the invitation first
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (fetchError || !invitation) {
      logger.error('Invalid or expired invitation');
      return false;
    }

    // Assign the role to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: invitation.role,
      });

    if (roleError) {
      logger.error('Error assigning role:', roleError);
      return false;
    }

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('id', invitation.id);

    if (updateError) {
      logger.error('Error marking invitation as used:', updateError);
    }

    return true;
  } catch (error) {
    logger.error('Error redeeming invitation:', error);
    return false;
  }
};
