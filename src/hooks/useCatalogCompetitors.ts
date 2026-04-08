import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CatalogCompetitor {
  id: string;
  catalog_id: string;
  user_id: string;
  competitor_title: string;
  competitor_price: number;
  competitor_delivery_days: number;
  competitor_rating: number | null;
  seller_name: string | null;
  date_logged: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CatalogCompetitorInsert = Omit<CatalogCompetitor, 'id' | 'created_at' | 'updated_at'>;

export function useCatalogCompetitors(catalogId?: string) {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<CatalogCompetitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitors = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('catalog_competitors').select('*');
      if (catalogId) query = query.eq('catalog_id', catalogId);
      const { data, error } = await query.order('date_logged', { ascending: false });
      if (error) throw error;
      setCompetitors((data as unknown as CatalogCompetitor[]) || []);
    } catch {
      toast.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }, [user, catalogId]);

  useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

  const addCompetitor = async (competitor: CatalogCompetitorInsert) => {
    const { error } = await supabase.from('catalog_competitors').insert(competitor as any);
    if (error) { toast.error('Failed to add competitor'); return false; }
    await fetchCompetitors();
    toast.success('Competitor added');
    return true;
  };

  const updateCompetitor = async (id: string, updates: Partial<CatalogCompetitorInsert>) => {
    const { error } = await supabase.from('catalog_competitors').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update competitor'); return false; }
    await fetchCompetitors();
    toast.success('Competitor updated');
    return true;
  };

  const deleteCompetitor = async (id: string) => {
    const { error } = await supabase.from('catalog_competitors').delete().eq('id', id);
    if (error) { toast.error('Failed to delete competitor'); return false; }
    await fetchCompetitors();
    toast.success('Competitor deleted');
    return true;
  };

  return { competitors, loading, addCompetitor, updateCompetitor, deleteCompetitor, refetch: fetchCompetitors };
}
