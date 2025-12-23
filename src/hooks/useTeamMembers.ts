import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TeamMember {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'manager' | 'bd_member' | null;
}

export const useTeamMembers = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMembers = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to fetch team members');
      logger.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      logger.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with roles
    const membersWithRoles: TeamMember[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: userRole?.role as TeamMember['role'] || null,
      };
    });

    setMembers(membersWithRoles);
    setLoading(false);
  };

  const updateMemberRole = async (userId: string, role: 'admin' | 'manager' | 'bd_member' | null): Promise<boolean> => {
    if (!user) return false;

    try {
      if (role === null) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Check if role exists
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          // Update existing role
          const { error } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', userId);

          if (error) throw error;
        } else {
          // Insert new role
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role });

          if (error) throw error;
        }
      }

      toast.success('Role updated successfully');
      await fetchMembers();
      return true;
    } catch (error) {
      toast.error('Failed to update role');
      logger.error('Error updating role:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  return {
    members,
    loading,
    fetchMembers,
    updateMemberRole,
  };
};
