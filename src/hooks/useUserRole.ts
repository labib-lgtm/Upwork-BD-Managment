import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(UserRole.BD_MEMBER);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(UserRole.BD_MEMBER);
      } else if (data) {
        // Map database role to UserRole enum
        switch (data.role) {
          case 'admin':
            setRole(UserRole.ADMIN);
            break;
          case 'manager':
            setRole(UserRole.MANAGER);
            break;
          case 'bd_member':
          default:
            setRole(UserRole.BD_MEMBER);
            break;
        }
      } else {
        // No role assigned, default to BD_MEMBER
        setRole(UserRole.BD_MEMBER);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, loading };
};
