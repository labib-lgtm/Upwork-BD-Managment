import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface BDProfile {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BDProfileFormData {
  name: string;
  description: string | null;
  is_active: boolean;
}

export const useBDProfiles = () => {
  const [profiles, setProfiles] = useState<BDProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('bd_profiles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to fetch profiles');
      logger.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const addProfile = async (formData: BDProfileFormData): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase.from('bd_profiles').insert(formData);

    if (error) {
      toast.error('Failed to add profile');
      logger.error('Error adding profile:', error);
      return false;
    }

    toast.success('Profile added successfully');
    return true;
  };

  const updateProfile = async (id: string, formData: Partial<BDProfileFormData>): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('bd_profiles')
      .update(formData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update profile');
      logger.error('Error updating profile:', error);
      return false;
    }

    toast.success('Profile updated successfully');
    return true;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bd_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete profile');
      logger.error('Error deleting profile:', error);
      return false;
    }

    toast.success('Profile deleted');
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    logger.log('Setting up real-time subscription for bd_profiles');
    
    const channel = supabase
      .channel('bd-profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bd_profiles'
        },
        (payload) => {
          logger.log('BD Profiles realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProfiles(prev => [...prev, payload.new as BDProfile].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setProfiles(prev => 
              prev.map(p => p.id === (payload.new as BDProfile).id ? payload.new as BDProfile : p)
                .sort((a, b) => a.name.localeCompare(b.name))
            );
          } else if (payload.eventType === 'DELETE') {
            setProfiles(prev => 
              prev.filter(p => p.id !== (payload.old as BDProfile).id)
            );
          }
        }
      )
      .subscribe((status) => {
        logger.log('BD Profiles subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up bd_profiles realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profiles,
    loading,
    fetchProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
  };
};
