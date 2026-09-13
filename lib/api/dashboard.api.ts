import { apiClient } from './client';

export interface ClientDashboardStats {
  clientId: number;
  totalScreens: number;
  connectedScreens: number;
  disconnectedScreens: number;
  activeCampaigns: number;
}

export interface ScreensStats {
  clientId: number;
  totalScreens: number;
  connectedScreens: number;
  disconnectedScreens: number;
}

export interface MediaStats {
  clientId: number;
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
}

export interface CampaignStats {
  clientId: number;
  totalCampaigns: number;
  totalActiveCampaigns: number;
  totalinactiveCampaigns: number;
}

export interface CamerasStats {
  clientId: number;
  totalCameras: number;
  activeCameras: number;
  inactiveCameras: number;
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

  async getScreensStats(clientId: number): Promise<ScreensStats> {
    return apiClient.get<ScreensStats>(`/api/dashboard/Screens/${clientId}`);
  }

  async getMediaStats(clientId: number): Promise<MediaStats> {
    return apiClient.get<MediaStats>(`/api/dashboard/Media/${clientId}`);
  }

  async getCampaignStats(clientId: number): Promise<CampaignStats> {
    return apiClient.get<CampaignStats>(`/api/dashboard/Campaigns/${clientId}`);
  }

  async getCamerasStats(clientId: number): Promise<CamerasStats> {
    return apiClient.get<CamerasStats>(`/api/dashboard/Cameras/${clientId}`);
  }
}

export const dashboardApi = new DashboardApi();
