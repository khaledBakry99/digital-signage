import { useCallback, useEffect, useState } from 'react';
import { superAdminUsersApi } from '@/lib/api/superAdminUsers.api';
import type {
  ManagedUser,
  CreateManagedUserInput,
  UpdateManagedUserInput,
} from '@/lib/types/superAdmin';

export interface SuperAdminUserFilters {
  clientId?: number;
}

export function useSuperAdminUsers(initialFilters?: SuperAdminUserFilters) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SuperAdminUserFilters>(initialFilters || {});

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminUsersApi.getAll(filters);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async (payload: CreateManagedUserInput): Promise<{ success: boolean; error?: string }> => {
    try {
      await superAdminUsersApi.create(payload);
      await loadUsers();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.detail || err.message || 'فشل إنشاء المستخدم';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (id: number, payload: UpdateManagedUserInput) => {
    try {
      await superAdminUsersApi.update(id, payload);
      await loadUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث المستخدم');
      return false;
    }
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    filters,
    setFilters,
    refresh: loadUsers,
    createUser,
    updateUser,
  };
}
