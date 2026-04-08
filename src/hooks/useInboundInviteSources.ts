import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InviteSource {
  id: string;
  inbound_metric_id: string;
  source: string;
  count: number;
  created_at: string;
}

export function useInboundInviteSources(metricIds?: string[]) {
  const { user } = useAuth();
  const [sources, setSources] = useState<InviteSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('inbound_invite_sources').select('*');
      if (metricIds && metricIds.length > 0) {
        query = query.in('inbound_metric_id', metricIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSources((data as unknown as InviteSource[]) || []);
    } catch {
      toast.error('Failed to load invite sources');
    } finally {
      setLoading(false);
    }
  }, [user, metricIds?.join(',')]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const addSource = async (source: Omit<InviteSource, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('inbound_invite_sources').insert(source as any);
    if (error) { toast.error('Failed to add source'); return false; }
    await fetchSources();
    return true;
  };

  const updateSource = async (id: string, updates: Partial<Omit<InviteSource, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('inbound_invite_sources').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update source'); return false; }
    await fetchSources();
    return true;
  };

  const deleteSource = async (id: string) => {
    const { error } = await supabase.from('inbound_invite_sources').delete().eq('id', id);
    if (error) { toast.error('Failed to delete source'); return false; }
    await fetchSources();
    return true;
  };

  return { sources, loading, addSource, updateSource, deleteSource, refetch: fetchSources };
}
