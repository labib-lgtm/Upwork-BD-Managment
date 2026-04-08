import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CatalogOrder {
  id: string;
  catalog_id: string;
  user_id: string;
  order_date: string;
  buyer_name: string | null;
  amount: number;
  fulfillment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CatalogOrderInsert = Omit<CatalogOrder, 'id' | 'created_at' | 'updated_at'>;

export function useCatalogOrders(catalogId?: string) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('catalog_orders').select('*');
      if (catalogId) query = query.eq('catalog_id', catalogId);
      const { data, error } = await query.order('order_date', { ascending: false });
      if (error) throw error;
      setOrders((data as unknown as CatalogOrder[]) || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user, catalogId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const addOrder = async (order: CatalogOrderInsert) => {
    const { error } = await supabase.from('catalog_orders').insert(order as any);
    if (error) { toast.error('Failed to add order'); return false; }
    await fetchOrders();
    toast.success('Order added');
    return true;
  };

  const updateOrder = async (id: string, updates: Partial<CatalogOrderInsert>) => {
    const { error } = await supabase.from('catalog_orders').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update order'); return false; }
    await fetchOrders();
    toast.success('Order updated');
    return true;
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('catalog_orders').delete().eq('id', id);
    if (error) { toast.error('Failed to delete order'); return false; }
    await fetchOrders();
    toast.success('Order deleted');
    return true;
  };

  return { orders, loading, addOrder, updateOrder, deleteOrder, refetch: fetchOrders };
}
