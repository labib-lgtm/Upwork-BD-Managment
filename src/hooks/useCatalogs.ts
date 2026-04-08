import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CatalogItem {
  id: string;
  user_id: string;
  bd_profile_id: string;
  title: string;
  status: string;
  base_price: number;
  delivery_days: number;
  description: string | null;
  date_created: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CatalogInsert = Omit<CatalogItem, 'id' | 'created_at' | 'updated_at'>;

export function useCatalogs() {
  const { user } = useAuth();
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCatalogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCatalogs((data as unknown as CatalogItem[]) || []);
    } catch {
      toast.error('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCatalogs(); }, [fetchCatalogs]);

  const addCatalog = async (catalog: CatalogInsert) => {
    const { data, error } = await supabase
      .from('catalogs')
      .insert(catalog as any)
      .select()
      .single();
    if (error) { toast.error('Failed to add catalog'); return null; }
    await fetchCatalogs();
    toast.success('Catalog added');
    return data as unknown as CatalogItem;
  };

  const updateCatalog = async (id: string, updates: Partial<CatalogInsert>) => {
    const { error } = await supabase.from('catalogs').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update catalog'); return false; }
    await fetchCatalogs();
    toast.success('Catalog updated');
    return true;
  };

  const deleteCatalog = async (id: string) => {
    const { error } = await supabase.from('catalogs').delete().eq('id', id);
    if (error) { toast.error('Failed to delete catalog'); return false; }
    await fetchCatalogs();
    toast.success('Catalog deleted');
    return true;
  };

  return { catalogs, loading, addCatalog, updateCatalog, deleteCatalog, refetch: fetchCatalogs };
}
