import { apiClient } from './client';

export interface ClientDashboardStats {
  clientId: number;
  totalScreens: number;
  connectedScreens: number;
  disconnectedScreens: number;
  activeCampaigns: number;
}

export interface Subscription {
  id: number;
  clientId: number;
  planName: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: string;
  maxScreens: number;
  maxCameras: number;
  autoRenew: boolean;
}

class DashboardApi {
  async getClientStats(clientId: number): Promise<ClientDashboardStats> {
    return apiClient.get<ClientDashboardStats>(`/api/dashboard/clients/${clientId}`);
  }

  async getSubscriptions(clientId: number): Promise<Subscription[]> {
    return apiClient.get<Subscription[]>(`/api/Subscriptions?clientId=${clientId}`);
  }
}

export const dashboardApi = new DashboardApi();
