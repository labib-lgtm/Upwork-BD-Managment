import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ABTest {
  id: string;
  user_id: string;
  bd_profile_id: string;
  variation_name: string;
  test_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ABTestInsert = Omit<ABTest, 'id' | 'created_at' | 'updated_at'>;

export function useInboundABTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('inbound_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTests((data as unknown as ABTest[]) || []);
    } catch {
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const addTest = async (test: ABTestInsert) => {
    const { error } = await supabase.from('inbound_ab_tests').insert(test as any);
    if (error) { toast.error('Failed to add test'); return false; }
    await fetchTests();
    toast.success('A/B test added');
    return true;
  };

  const updateTest = async (id: string, updates: Partial<ABTestInsert>) => {
    const { error } = await supabase.from('inbound_ab_tests').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update test'); return false; }
    await fetchTests();
    toast.success('A/B test updated');
    return true;
  };

  const deleteTest = async (id: string) => {
    const { error } = await supabase.from('inbound_ab_tests').delete().eq('id', id);
    if (error) { toast.error('Failed to delete test'); return false; }
    await fetchTests();
    toast.success('A/B test deleted');
    return true;
  };

  return { tests, loading, addTest, updateTest, deleteTest, refetch: fetchTests };
}
