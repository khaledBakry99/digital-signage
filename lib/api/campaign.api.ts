// API client for Campaigns
import { apiClient } from './client';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../types/campaign';

class CampaignApi {
  private basePath = '/api/Campaigns';

  // Get all campaigns
  async getAll(params?: { clientId?: number }): Promise<Campaign[]> {
    return apiClient.get<Campaign[]>(this.basePath, params);
  }

  // Get campaign by ID
  async getById(id: number): Promise<Campaign> {
    return apiClient.get<Campaign>(`${this.basePath}/${id}`);
  }

  // Create campaign
  async create(input: CreateCampaignInput): Promise<Campaign> {
    return apiClient.post<Campaign>(this.basePath, input);
  }

  // Update campaign
  async update(id: number, input: UpdateCampaignInput): Promise<Campaign> {
    return apiClient.put<Campaign>(`${this.basePath}/${id}`, input);
  }

  // Delete campaign
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // Activate campaign
  async activate(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`${this.basePath}/${id}/activate`);
  }

  // Pause campaign
  async pause(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`${this.basePath}/${id}/pause`);
  }

  // Complete campaign
  async complete(id: number): Promise<Campaign> {
    return apiClient.post<Campaign>(`${this.basePath}/${id}/complete`);
  }
}

export const campaignApi = new CampaignApi();
