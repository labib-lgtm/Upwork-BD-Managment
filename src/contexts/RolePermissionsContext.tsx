import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface RolePermissionsContextType {
  permissions: RolePermission[];
  loading: boolean;
  hasTabAccess: (role: 'admin' | 'manager' | 'bd_member' | null, tabId: NavigationTab) => boolean;
  updatePermission: (role: 'admin' | 'manager' | 'bd_member', tabId: NavigationTab, hasAccess: boolean) => Promise<boolean>;
  fetchPermissions: () => Promise<void>;
}

const RolePermissionsContext = createContext<RolePermissionsContextType | undefined>(undefined);

export const RolePermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPermissions = useCallback(async () => {
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
  }, [user]);

  const hasTabAccess = useCallback((role: 'admin' | 'manager' | 'bd_member' | null, tabId: NavigationTab): boolean => {
    if (!role) return false;
    // Admin always has access to everything
    if (role === 'admin') return true;
    
    const permission = permissions.find(p => p.role === role && p.tab_id === tabId);
    return permission?.has_access ?? false;
  }, [permissions]);

  const updatePermission = useCallback(async (role: 'admin' | 'manager' | 'bd_member', tabId: NavigationTab, hasAccess: boolean): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update - update local state immediately for instant UI feedback
    setPermissions(prev => 
      prev.map(p => 
        p.role === role && p.tab_id === tabId 
          ? { ...p, has_access: hasAccess, updated_at: new Date().toISOString(), updated_by: user.id }
          : p
      )
    );

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
      // Revert on error
      await fetchPermissions();
      return false;
    }

    toast.success('Permission updated');
    return true;
  }, [user, fetchPermissions]);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user, fetchPermissions]);

  return (
    <RolePermissionsContext.Provider value={{
      permissions,
      loading,
      hasTabAccess,
      updatePermission,
      fetchPermissions,
    }}>
      {children}
    </RolePermissionsContext.Provider>
  );
};

export const useRolePermissionsContext = () => {
  const context = useContext(RolePermissionsContext);
  if (context === undefined) {
    throw new Error('useRolePermissionsContext must be used within a RolePermissionsProvider');
  }
  return context;
};
