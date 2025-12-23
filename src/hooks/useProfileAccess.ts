import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ProfileAccess {
  id: string;
  user_id: string;
  bd_profile_id: string;
  granted_by: string | null;
  created_at: string;
}

export const useProfileAccess = () => {
  const [accessList, setAccessList] = useState<ProfileAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAccessList = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profile_access')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching profile access:', error);
    } else {
      setAccessList(data || []);
    }
    setLoading(false);
  };

  const getUserAccess = (userId: string): string[] => {
    return accessList
      .filter(a => a.user_id === userId)
      .map(a => a.bd_profile_id);
  };

  const grantAccess = async (userId: string, bdProfileId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_profile_access')
      .insert({
        user_id: userId,
        bd_profile_id: bdProfileId,
        granted_by: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        // Duplicate - already has access
        return true;
      }
      toast.error('Failed to grant access');
      logger.error('Error granting access:', error);
      return false;
    }

    await fetchAccessList();
    return true;
  };

  const revokeAccess = async (userId: string, bdProfileId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_profile_access')
      .delete()
      .eq('user_id', userId)
      .eq('bd_profile_id', bdProfileId);

    if (error) {
      toast.error('Failed to revoke access');
      logger.error('Error revoking access:', error);
      return false;
    }

    await fetchAccessList();
    return true;
  };

  const updateUserAccess = async (userId: string, bdProfileIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current access for user
      const currentAccess = getUserAccess(userId);
      
      // Profiles to add
      const toAdd = bdProfileIds.filter(id => !currentAccess.includes(id));
      // Profiles to remove
      const toRemove = currentAccess.filter(id => !bdProfileIds.includes(id));

      // Remove access
      for (const profileId of toRemove) {
        await supabase
          .from('user_profile_access')
          .delete()
          .eq('user_id', userId)
          .eq('bd_profile_id', profileId);
      }

      // Add access
      if (toAdd.length > 0) {
        const inserts = toAdd.map(profileId => ({
          user_id: userId,
          bd_profile_id: profileId,
          granted_by: user.id,
        }));
        
        await supabase
          .from('user_profile_access')
          .insert(inserts);
      }

      toast.success('Profile access updated');
      await fetchAccessList();
      return true;
    } catch (error) {
      toast.error('Failed to update access');
      logger.error('Error updating access:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccessList();
    }
  }, [user]);

  return {
    accessList,
    loading,
    getUserAccess,
    grantAccess,
    revokeAccess,
    updateUserAccess,
    fetchAccessList,
  };
};

// Hook to get current user's accessible profiles
export const useMyProfileAccess = () => {
  const [accessibleProfileIds, setAccessibleProfileIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMyAccess = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profile_access')
      .select('bd_profile_id')
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error fetching my profile access:', error);
    } else {
      setAccessibleProfileIds(data?.map(a => a.bd_profile_id) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchMyAccess();
    }
  }, [user]);

  return {
    accessibleProfileIds,
    loading,
    fetchMyAccess,
  };
};
