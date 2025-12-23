import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      console.error('Error fetching profiles:', error);
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
      console.error('Error adding profile:', error);
      return false;
    }

    toast.success('Profile added successfully');
    await fetchProfiles();
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
      console.error('Error updating profile:', error);
      return false;
    }

    toast.success('Profile updated successfully');
    await fetchProfiles();
    return true;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bd_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete profile');
      console.error('Error deleting profile:', error);
      return false;
    }

    toast.success('Profile deleted');
    await fetchProfiles();
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
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
