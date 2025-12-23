import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Goal {
  id: string;
  user_id: string;
  bd_profile_id: string | null;
  fiscal_year: number;
  month: number;
  revenue_target: number;
  proposal_target: number;
  closes_target: number;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  bd_profile_id?: string | null;
  fiscal_year: number;
  month: number;
  revenue_target: number;
  proposal_target: number;
  closes_target: number;
}

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('month', { ascending: true });

      if (error) throw error;
      
      // Type assertion since goals table is new
      setGoals((data as unknown as Goal[]) || []);
    } catch (error) {
      logger.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const upsertGoal = async (formData: GoalFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const goalData = {
        user_id: user.id,
        bd_profile_id: formData.bd_profile_id || null,
        fiscal_year: formData.fiscal_year,
        month: formData.month,
        revenue_target: formData.revenue_target,
        proposal_target: formData.proposal_target,
        closes_target: formData.closes_target,
      };

      const { error } = await supabase
        .from('goals')
        .upsert(goalData, {
          onConflict: 'user_id,bd_profile_id,fiscal_year,month',
        });

      if (error) throw error;

      toast.success('Goal saved successfully!');
      await fetchGoals();
      return true;
    } catch (error) {
      logger.error('Error saving goal:', error);
      toast.error('Failed to save goal');
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Goal deleted');
      setGoals(prev => prev.filter(g => g.id !== id));
      return true;
    } catch (error) {
      logger.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
      return false;
    }
  };

  const getGoalForMonth = (fiscalYear: number, month: number, bdProfileId?: string | null): Goal | undefined => {
    return goals.find(g => 
      g.fiscal_year === fiscalYear && 
      g.month === month && 
      (bdProfileId ? g.bd_profile_id === bdProfileId : !g.bd_profile_id)
    );
  };

  const getGoalsForYear = (fiscalYear: number, bdProfileId?: string | null): Goal[] => {
    return goals.filter(g => 
      g.fiscal_year === fiscalYear && 
      (bdProfileId ? g.bd_profile_id === bdProfileId : true)
    );
  };

  useEffect(() => {
    if (user) {
      fetchGoals();

      // Real-time subscription
      const channel = supabase
        .channel('goals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goals'
          },
          (payload) => {
            logger.info('Goal change detected:', payload);
            if (payload.eventType === 'INSERT') {
              setGoals(prev => [...prev, payload.new as unknown as Goal]);
            } else if (payload.eventType === 'UPDATE') {
              setGoals(prev => 
                prev.map(g => g.id === (payload.new as any).id ? payload.new as unknown as Goal : g)
              );
            } else if (payload.eventType === 'DELETE') {
              setGoals(prev => prev.filter(g => g.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchGoals]);

  return {
    goals,
    loading,
    upsertGoal,
    deleteGoal,
    getGoalForMonth,
    getGoalsForYear,
    refetch: fetchGoals,
  };
};
