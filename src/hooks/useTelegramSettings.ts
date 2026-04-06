import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TelegramSettings {
  id: string;
  user_id: string;
  chat_id: string | null;
  daily_digest_enabled: boolean;
  alerts_enabled: boolean;
  alert_types: string[];
  created_at: string;
  updated_at: string;
}

export const useTelegramSettings = () => {
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('telegram_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching telegram settings:', error);
    } else {
      setSettings(data as TelegramSettings | null);
    }
    setLoading(false);
  };

  const saveSettings = async (updates: Partial<Omit<TelegramSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return false;

    if (settings) {
      const { error } = await supabase
        .from('telegram_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      if (error) {
        toast.error('Failed to save Telegram settings');
        logger.error('Error updating telegram settings:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('telegram_settings')
        .insert({ user_id: user.id, ...updates });

      if (error) {
        toast.error('Failed to create Telegram settings');
        logger.error('Error creating telegram settings:', error);
        return false;
      }
    }

    toast.success('Telegram settings saved');
    await fetchSettings();
    return true;
  };

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  return { settings, loading, saveSettings };
};
