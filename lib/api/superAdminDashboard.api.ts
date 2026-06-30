import { apiClient } from './client';
import type { SuperAdminDashboardStats } from '@/lib/types/superAdmin';

class SuperAdminDashboardApi {
  async getOverview(): Promise<SuperAdminDashboardStats> {
    return apiClient.get<SuperAdminDashboardStats>('/api/dashboard');
  }
}

export const superAdminDashboardApi = new SuperAdminDashboardApi();
