import { apiClient } from './client';

export type CameraState = 'Active' | 'Inactive';
export type CameraSourceType = 'USB' | 'RTSP' | 'HLS' | 'HTTP';

export interface BackendCamera {
  id: number;
  clientId: number;
  name: string;
  location: string;
  cameraDeviceName: string;
  cameraDeviceRealName?: string;
  state: CameraState;
  timeToScreenshot: number;
  createdAtUtc: string;
  heartbeat: string;
  screenIds: number[];
  // New fields from Backend
  sourceType: CameraSourceType;
  playbackUrl?: string;
  cameraPathName?: string;
}

export interface HeartbeatResponse {
  id: number;
  clientId: number;
  name: string;
  location: string;
  cameraDeviceName: string;
  cameraDeviceRealName?: string;
  state: CameraState;
  timeToScreenshot: number;
  createdAtUtc: string;
  heartbeat: string;
  screenIds: number[];
  // New fields from Backend
  sourceType: CameraSourceType;
  playbackUrl?: string;
  cameraPathName?: string;
}

export interface OnlineCheckResponse {
  id: number;
  state: CameraState;
  createdAtUtc: string;
}

export interface CreateCameraInput {
  clientId: number;
  name: string;
  location: string;
  cameraDeviceName: string;
  cameraDeviceRealName?: string;
  timeToScreenshot: number;
  sourceType: CameraSourceType;
}

export interface UpdateCameraInput {
  name: string;
  location: string;
  cameraDeviceName: string;
  cameraDeviceRealName?: string;
  timeToScreenshot: number;
  sourceType: CameraSourceType;
}

class CameraApi {
  async getAll(params?: { clientId?: number; state?: CameraState; search?: string }): Promise<BackendCamera[]> {
    return apiClient.get<BackendCamera[]>('/api/Cameras', params);
  }

  async getById(id: number): Promise<BackendCamera> {
    return apiClient.get<BackendCamera>(`/api/Cameras/${id}`);
  }

  async create(data: CreateCameraInput): Promise<BackendCamera> {
    console.log('[CameraApi] ===== بدء طلب إنشاء كاميرا =====');
    console.log('[CameraApi] نوع المصدر:', data.sourceType);
    console.log('[CameraApi] نقطة النهاية (Endpoint): POST /api/Cameras');
    console.log('[CameraApi] البيانات المرسلة:', JSON.stringify(data, null, 2));

    // Use extended timeout for RTSP cameras (they need time to connect to MediaMTX)
    const isNetworkCamera = data.sourceType !== 'USB';
    if (isNetworkCamera) {
      console.log('[CameraApi] ⏱️ استخدام مهلة ممتدة (120 ثانية) لكاميرا شبكية');
    }

    try {
      const response = await apiClient.post<BackendCamera>('/api/Cameras', data, isNetworkCamera);
      console.log('[CameraApi] ✓ نجح الطلب - الاستجابة:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[CameraApi] ✗ فشل الطلب:', error);
      throw error;
    }
  }

  async update(id: number, data: UpdateCameraInput): Promise<BackendCamera> {
    return apiClient.put<BackendCamera>(`/api/Cameras/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/Cameras/${id}`);
  }

  async activate(id: number): Promise<BackendCamera> {
    return apiClient.post<BackendCamera>(`/api/Cameras/${id}/activate`);
  }

  async deactivate(id: number): Promise<BackendCamera> {
    return apiClient.post<BackendCamera>(`/api/Cameras/${id}/deactivate`);
  }

  async sendHeartbeat(id: number): Promise<HeartbeatResponse> {
    return apiClient.post<HeartbeatResponse>(`/api/Cameras/${id}/heartbeat`);
  }

  async checkOnlineStatus(id: number): Promise<OnlineCheckResponse> {
    return apiClient.post<OnlineCheckResponse>(`/api/Cameras/${id}/camera-online-check`);
  }

  async setCameraDeviceName(id: number, deviceName: string): Promise<void> {
    return apiClient.post<void>(`/api/Cameras/${id}/set-camera-device-name?devicename=${encodeURIComponent(deviceName)}`);
  }

  async getCameraDeviceName(id: number): Promise<{ cameraDeviceName: string }> {
    return apiClient.get<{ cameraDeviceName: string }>(`/api/Cameras/${id}/get-camera-device-name`);
  }
}

export const cameraApi = new CameraApi();
