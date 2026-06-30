import { useEffect, useState, useCallback } from 'react';
import { superAdminDashboardApi } from '@/lib/api/superAdminDashboard.api';
import type { SuperAdminDashboardStats } from '@/lib/types/superAdmin';

export function useSuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminDashboardApi.getOverview();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات النظام');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}
