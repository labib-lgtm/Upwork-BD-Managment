import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CatalogActionItem {
  id: string;
  catalog_id: string;
  action_type: string;
  month_name: string;
  week_label: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export function useCatalogActions(catalogId?: string) {
  const { user } = useAuth();
  const [actions, setActions] = useState<CatalogActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('catalog_actions').select('*');
      if (catalogId) query = query.eq('catalog_id', catalogId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      setActions((data as unknown as CatalogActionItem[]) || []);
    } catch {
      toast.error('Failed to load catalog actions');
    } finally {
      setLoading(false);
    }
  }, [user, catalogId]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  const addAction = async (action: Omit<CatalogActionItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('catalog_actions').insert(action as any);
    if (error) { toast.error('Failed to add action'); return false; }
    await fetchActions();
    toast.success('Action added');
    return true;
  };

  const toggleAction = async (id: string, isDone: boolean) => {
    const { error } = await supabase.from('catalog_actions').update({ is_done: isDone } as any).eq('id', id);
    if (error) { toast.error('Failed to update action'); return false; }
    await fetchActions();
    return true;
  };

  const deleteAction = async (id: string) => {
    const { error } = await supabase.from('catalog_actions').delete().eq('id', id);
    if (error) { toast.error('Failed to delete action'); return false; }
    await fetchActions();
    return true;
  };

  return { actions, loading, addAction, toggleAction, deleteAction, refetch: fetchActions };
}
