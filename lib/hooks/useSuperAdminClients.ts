import { useCallback, useEffect, useState } from 'react';
import { superAdminClientsApi } from '@/lib/api/superAdminClients.api';
import type {
  ManagedClient,
  CreateClientInput,
  UpdateClientInput,
  DeactivateClientInput,
} from '@/lib/types/superAdmin';

export interface SuperAdminClientFilters {
  search?: string;
}

export function useSuperAdminClients(initialFilters?: SuperAdminClientFilters) {
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SuperAdminClientFilters>(initialFilters || {});

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminClientsApi.getAll(filters);
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل العملاء');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const createClient = useCallback(async (payload: CreateClientInput) => {
    try {
      await superAdminClientsApi.create(payload);
      await loadClients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء العميل');
      return false;
    }
  }, [loadClients]);

  const updateClient = useCallback(async (id: number, payload: UpdateClientInput) => {
    try {
      await superAdminClientsApi.update(id, payload);
      await loadClients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث العميل');
      return false;
    }
  }, [loadClients]);

  const activateClient = useCallback(async (id: number) => {
    try {
      await superAdminClientsApi.activate(id);
      await loadClients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تفعيل العميل');
      return false;
    }
  }, [loadClients]);

  const deactivateClient = useCallback(async (id: number, payload: DeactivateClientInput) => {
    try {
      await superAdminClientsApi.deactivate(id, payload);
      await loadClients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إيقاف العميل');
      return false;
    }
  }, [loadClients]);

  return {
    clients,
    loading,
    error,
    filters,
    setFilters,
    refresh: loadClients,
    createClient,
    updateClient,
    activateClient,
    deactivateClient,
  };
}
