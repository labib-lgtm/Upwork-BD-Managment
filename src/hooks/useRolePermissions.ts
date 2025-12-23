import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { NavigationTab } from '@/types';

export interface RolePermission {
  id: string;
  role: 'admin' | 'manager' | 'bd_member';
  tab_id: NavigationTab;
  has_access: boolean;
  updated_at: string;
  updated_by: string | null;
}

export const useRolePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPermissions = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      logger.error('Error fetching role permissions:', error);
    } else {
      setPermissions((data || []) as RolePermission[]);
    }
    setLoading(false);
  };

  const getRolePermissions = (role: 'admin' | 'manager' | 'bd_member'): NavigationTab[] => {
    return permissions
      .filter(p => p.role === role && p.has_access)
      .map(p => p.tab_id);
  };

  const hasTabAccess = (role: 'admin' | 'manager' | 'bd_member' | null, tabId: NavigationTab): boolean => {
    if (!role) return false;
    // Admin always has access to everything
    if (role === 'admin') return true;
    
    const permission = permissions.find(p => p.role === role && p.tab_id === tabId);
    return permission?.has_access ?? false;
  };

  const updatePermission = async (role: 'admin' | 'manager' | 'bd_member', tabId: NavigationTab, hasAccess: boolean): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('role_permissions')
      .update({ 
        has_access: hasAccess,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('role', role)
      .eq('tab_id', tabId);

    if (error) {
      toast.error('Failed to update permission');
      logger.error('Error updating permission:', error);
      return false;
    }

    toast.success('Permission updated');
    await fetchPermissions();
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  return {
    permissions,
    loading,
    getRolePermissions,
    hasTabAccess,
    updatePermission,
    fetchPermissions,
  };
};
