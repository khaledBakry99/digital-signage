import { apiClient } from './client';
import type { MediaAsset, CreateMediaAssetInput, UpdateMediaAssetInput } from '@/lib/types/mediaAsset';

export const mediaAssetApi = {
  // Get all media assets
  getAll: async (params?: { clientId?: number; uploadedFromUtc?: string; uploadedToUtc?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());
    if (params?.uploadedFromUtc) queryParams.append('uploadedFromUtc', params.uploadedFromUtc);
    if (params?.uploadedToUtc) queryParams.append('uploadedToUtc', params.uploadedToUtc);
    
    const queryString = queryParams.toString();
    const url = `/api/MediaAssets${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<MediaAsset[]>(url);
  },

  // Search media assets
  search: async (params: { clientId?: number; name?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.clientId) queryParams.append('clientId', params.clientId.toString());
    if (params.name) queryParams.append('name', params.name);
    
    const queryString = queryParams.toString();
    const url = `/api/MediaAssets/search${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<MediaAsset[]>(url);
  },

  // Get media assets by page (pagination)
  getByPage: async (page: number, params?: { clientId?: number; itemsPerPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());
    if (params?.itemsPerPage) queryParams.append('itemsPerPage', params.itemsPerPage.toString());
    
    const queryString = queryParams.toString();
    const url = `/api/MediaAssets/${page}/getbypage${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{
      page: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
      items: MediaAsset[];
    }>(url);
  },

  // Get media asset by ID
  getById: async (id: number) => {
    return apiClient.get<MediaAsset>(`/api/MediaAssets/${id}`);
  },

  // Create media asset
  create: async (data: CreateMediaAssetInput) => {
    const formData = new FormData();
    formData.append('ClientId', data.clientId.toString());
    formData.append('Name', data.name);
    if (data.description) formData.append('Description', data.description);
    if (data.type) formData.append('Type', data.type);
    if (data.isFallback !== undefined) formData.append('IsFallback', data.isFallback.toString());
    if (data.durationSeconds !== undefined) formData.append('DurationSeconds', data.durationSeconds.toString());
    formData.append('File', data.file);

    return apiClient.postFormData<MediaAsset>('/api/MediaAssets', formData);
  },

  // Update media asset
  update: async (id: number, data: UpdateMediaAssetInput) => {
    return apiClient.put<MediaAsset>(`/api/MediaAssets/${id}`, data);
  },

  // Update media asset with file
  updateWithFile: async (id: number, data: { name: string; description?: string; file: File; type?: 'Image' | 'Video'; durationSeconds?: number }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('Name', data.name);
    if (data.description) queryParams.append('Description', data.description);
    if (data.durationSeconds !== undefined) queryParams.append('DurationInSeconds', data.durationSeconds.toString());
    if (data.type) queryParams.append('Type', data.type);
    
    const formData = new FormData();
    formData.append('File', data.file);

    return apiClient.putFormData<MediaAsset>(`/api/MediaAssets/${id}?${queryParams.toString()}`, formData);
  },

  // Delete media asset
  delete: async (id: number, force: boolean = false) => {
    const url = force ? `/api/MediaAssets/${id}?force=true` : `/api/MediaAssets/${id}`;
    return apiClient.delete(url);
  },

  // Upload local
  uploadLocal: async (data: CreateMediaAssetInput) => {
    const formData = new FormData();
    formData.append('ClientId', data.clientId.toString());
    formData.append('Name', data.name);
    if (data.description) formData.append('Description', data.description);
    if (data.type) formData.append('Type', data.type);
    if (data.isFallback !== undefined) formData.append('IsFallback', data.isFallback.toString());
    if (data.durationSeconds !== undefined) formData.append('DurationSeconds', data.durationSeconds.toString());
    formData.append('File', data.file);

    return apiClient.postFormData<MediaAsset>('/api/MediaAssets/upload/local', formData);
  },

  // Upload gcloud
  uploadGcloud: async (data: CreateMediaAssetInput) => {
    const formData = new FormData();
    formData.append('ClientId', data.clientId.toString());
    formData.append('Name', data.name);
    if (data.description) formData.append('Description', data.description);
    if (data.type) formData.append('Type', data.type);
    if (data.isFallback !== undefined) formData.append('IsFallback', data.isFallback.toString());
    if (data.durationSeconds !== undefined) formData.append('DurationSeconds', data.durationSeconds.toString());
    formData.append('File', data.file);

    return apiClient.postFormData<MediaAsset>('/api/MediaAssets/upload/gcloud', formData);
  },
};
