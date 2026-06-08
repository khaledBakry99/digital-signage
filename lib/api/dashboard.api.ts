import { apiClient } from './client';

export interface ClientDashboardStats {
  clientId: number;
  totalScreens: number;
  connectedScreens: number;
  disconnectedScreens: number;
  activeCampaigns: number;
}

class DashboardApi {
  async getClientStats(clientId: number): Promise<ClientDashboardStats> {
    return apiClient.get<ClientDashboardStats>(`/api/dashboard/clients/${clientId}`);
  }
}

export const dashboardApi = new DashboardApi();
