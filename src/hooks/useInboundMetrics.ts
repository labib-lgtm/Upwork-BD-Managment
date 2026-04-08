import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InboundMetric {
  id: string;
  user_id: string;
  bd_profile_id: string;
  period_type: string;
  fiscal_year: number;
  month_name: string;
  week_label: string | null;
  impressions: number;
  boosted_clicks: number;
  profile_views: number;
  invites: number;
  conversations: number;
  closes: number;
  total_sales: number;
  manual_spend: number;
  connects_used_boost: number;
  connects_available_now: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InboundMetricInsert = Omit<InboundMetric, 'id' | 'created_at' | 'updated_at'>;

export function useInboundMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<InboundMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('inbound_metrics')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('month_name', { ascending: false });
      if (error) throw error;
      setMetrics((data as unknown as InboundMetric[]) || []);
    } catch (err: any) {
      toast.error('Failed to load inbound metrics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const addMetric = async (metric: InboundMetricInsert) => {
    const { data, error } = await supabase
      .from('inbound_metrics')
      .insert(metric as any)
      .select()
      .single();
    if (error) { toast.error('Failed to add metric'); return null; }
    await fetchMetrics();
    toast.success('Metric added');
    return data as unknown as InboundMetric;
  };

  const updateMetric = async (id: string, updates: Partial<InboundMetricInsert>) => {
    const { error } = await supabase
      .from('inbound_metrics')
      .update(updates as any)
      .eq('id', id);
    if (error) { toast.error('Failed to update metric'); return false; }
    await fetchMetrics();
    toast.success('Metric updated');
    return true;
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase.from('inbound_metrics').delete().eq('id', id);
    if (error) { toast.error('Failed to delete metric'); return false; }
    await fetchMetrics();
    toast.success('Metric deleted');
    return true;
  };

  return { metrics, loading, addMetric, updateMetric, deleteMetric, refetch: fetchMetrics };
}
