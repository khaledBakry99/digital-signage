// API client for Screens
import { apiClient } from './client';
import type {
  Screen,
  CreateScreenInput,
  UpdateScreenInput,
  ScreenCurrentMedia,
  ScreenActiveCampaign,
  MediaSlot,
  ScreenMediaSlots,
  MediaAssignments,
} from '../types/screen';
import type { Campaign } from '../types/campaign';

class ScreenApi {
  private basePath = '/api/Screens';
  private aiControlPath = '/api/screen';

  // Fetch all screens
  async getAll(params?: { clientId?: number }): Promise<Screen[]> {
    return apiClient.get<Screen[]>(this.basePath, params);
  }

  // Create new screen
  async create(input: CreateScreenInput): Promise<Screen> {
    return apiClient.post<Screen>(this.basePath, input);
  }

  // Fetch screen by ID
  async getById(id: number): Promise<Screen> {
    return apiClient.get<Screen>(`${this.basePath}/${id}`);
  }

  // Update screen
  async update(id: number, input: UpdateScreenInput): Promise<Screen> {
    return apiClient.put<Screen>(`${this.basePath}/${id}`, input);
  }

  // Delete screen
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // Fetch current media for screen
  async getCurrentMedia(id: number): Promise<ScreenCurrentMedia> {
    return apiClient.get<ScreenCurrentMedia>(`${this.basePath}/${id}/GetScreenCurrentMedia`);
  }

  // Fetch active campaign for screen
  async getActiveCampaign(id: number): Promise<ScreenActiveCampaign> {
    return apiClient.get<ScreenActiveCampaign>(`${this.basePath}/${id}/GetActiveCampaign`);
  }

  // Assign campaign to screen
  async assignCampaign(id: number, campaignId: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-campaign`, { campaignId });
  }

  // Remove campaign from screen (New API)
  async removeCampaign(id: number, campaignId?: number): Promise<Screen> {
    const url = campaignId 
      ? `/removecampaign?id=${id}&campaignId=${campaignId}`
      : `/removecampaign?id=${id}`;
    return apiClient.delete<Screen>(url);
  }

  // Fetch all campaigns associated with screen
  async getAllCampaigns(id: number): Promise<Campaign[]> {
    return apiClient.get<Campaign[]>(`${this.basePath}/${id}/GetAllCampaigns`);
  }

  // Assign camera to screen
  async assignCamera(id: number, cameraId: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-camera`, { cameraId });
  }

  // Remove camera from screen
  async removeCamera(id: number): Promise<Screen> {
    return apiClient.delete<Screen>(`${this.basePath}/${id}/camera`);
  }

  // Enable AI via dedicated endpoint
  async enableScreenAI(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.aiControlPath}/enablescreenai/${id}`, {});
  }

  // Disable AI via dedicated endpoint
  async disableScreenAI(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.aiControlPath}/disablescreenai/${id}`, {});
  }

  // Compatible interface with current calls
  async toggleAI(id: number, aiEnabled: boolean, extraFields?: UpdateScreenInput): Promise<Screen> {
    if (aiEnabled) {
      return this.enableScreenAI(id);
    }
    return this.disableScreenAI(id);
  }

  // Assign media to specific slot
  async assignMediaSlot(id: number, slot: MediaSlot, mediaAssetId: number): Promise<ScreenMediaSlots> {
    return apiClient.post<ScreenMediaSlots>(
      `${this.basePath}/${id}/assign-media/slots/${slot}`,
      { mediaAssetId }
    );
  }

  // Remove media from specific slot
  async removeMediaSlot(id: number, slot: MediaSlot): Promise<ScreenMediaSlots> {
    return apiClient.delete<ScreenMediaSlots>(`${this.basePath}/${id}/assign-media/slots/${slot}`);
  }

  // Fetch all media for screen
  async getMedia(id: number): Promise<ScreenMediaSlots> {
    return apiClient.get<ScreenMediaSlots>(`${this.basePath}/${id}/media`);
  }

  // Assign all media at once
  async assignAllMedia(id: number, assignments: MediaAssignments): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-media`, assignments);
  }

  // Delete all media
  async clearAllMedia(id: number): Promise<ScreenMediaSlots> {
    return apiClient.delete<ScreenMediaSlots>(`${this.basePath}/${id}/assign-media`);
  }

  // Activate screen (when opened)
  async activate(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/activate`, {});
  }

  // Deactivate screen (when closed)
  async deactivate(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/deactivate`, {});
  }

  // New: Send heartbeat to screen (every 40 seconds)
  async sendHeartbeat(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/heartbeat`, {});
  }

  // New: Check screen status (whether connected or not)
  async checkOnlineStatus(id: number): Promise<{ id: number; connectionStatus: string; lastHeartbeatAtUtc: string }> {
    return apiClient.post<{ id: number; connectionStatus: string; lastHeartbeatAtUtc: string }>(`${this.basePath}/${id}/screen-online-check`, {});
  }
}

export const screenApi = new ScreenApi();
