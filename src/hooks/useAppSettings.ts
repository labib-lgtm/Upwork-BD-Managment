import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSettingsData {
  fiscal_year_start: number;
  connect_cost: number;
  target_roas: number;
  currency: string;
}

const DEFAULT_SETTINGS: AppSettingsData = {
  fiscal_year_start: 1,
  connect_cost: 0.15,
  target_roas: 5,
  currency: 'USD',
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      if (data && data.length > 0) {
        const newSettings = { ...DEFAULT_SETTINGS };
        data.forEach((row) => {
          const key = row.key as keyof AppSettingsData;
          if (key in newSettings) {
            (newSettings as Record<string, unknown>)[key] = row.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: keyof AppSettingsData, value: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { 
            key, 
            value, 
            updated_by: user?.user?.id 
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error(error.message || 'Failed to update setting');
    }
  }, []);

  const updateMultipleSettings = useCallback(async (updates: Partial<AppSettingsData>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const upserts = Object.entries(updates).map(([key, value]) => ({
        key,
        value,
        updated_by: user?.user?.id,
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upserts, { onConflict: 'key' });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { key, value } = payload.new as { key: string; value: any };
            setSettings(prev => ({ ...prev, [key]: value }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings,
  };
};
