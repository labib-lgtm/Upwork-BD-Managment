import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface FollowUp {
  id: string;
  proposal_id: string;
  user_id: string;
  follow_up_date: string;
  follow_up_type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export const useFollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFollowUps = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .order('follow_up_date', { ascending: true });

    if (error) {
      logger.error('Error fetching follow-ups:', error);
    } else {
      setFollowUps((data as FollowUp[]) || []);
    }
    setLoading(false);
  };

  const updateFollowUp = async (id: string, updates: { status?: string; notes?: string }) => {
    const { error } = await supabase
      .from('follow_ups')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update follow-up');
      logger.error('Error updating follow-up:', error);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (user) fetchFollowUps();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('follow-ups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
        fetchFollowUps();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayOrOverdue = followUps.filter(
    f => f.status === 'pending' && f.follow_up_date <= todayStr
  );

  return { followUps, loading, dueTodayOrOverdue, updateFollowUp, fetchFollowUps };
};
