import { apiClient } from './client';

export type CameraState = 'Active' | 'Inactive';

export interface BackendCamera {
  id: number;
  clientId: number;
  name: string;
  location: string;
  cameraDeviceName: string;
  state: CameraState;
  timeToScreenshot: number;
  createdAtUtc: string;
  heartbeat: string;
  screenIds: number[];
}

export interface HeartbeatResponse {
  id: number;
  clientId: number;
  name: string;
  location: string;
  cameraDeviceName: string;
  state: CameraState;
  timeToScreenshot: number;
  createdAtUtc: string;
  heartbeat: string;
  screenIds: number[];
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
  timeToScreenshot: number;
}

export interface UpdateCameraInput {
  name: string;
  location: string;
  cameraDeviceName: string;
  timeToScreenshot: number;
}

class CameraApi {
  async getAll(params?: { clientId?: number; state?: CameraState; search?: string }): Promise<BackendCamera[]> {
    return apiClient.get<BackendCamera[]>('/api/Cameras', params);
  }

  async getById(id: number): Promise<BackendCamera> {
    return apiClient.get<BackendCamera>(`/api/Cameras/${id}`);
  }

  async create(data: CreateCameraInput): Promise<BackendCamera> {
    return apiClient.post<BackendCamera>('/api/Cameras', data);
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

  // جديد: إرسال heartbeat للكاميرا (يتم كل 40 ثانية)
  async sendHeartbeat(id: number): Promise<HeartbeatResponse> {
    return apiClient.post<HeartbeatResponse>(`/api/Cameras/${id}/heartbeat`);
  }

  // جديد: التحقق من حالة الكاميرا (هل هي متصلة أم لا)
  async checkOnlineStatus(id: number): Promise<OnlineCheckResponse> {
    return apiClient.post<OnlineCheckResponse>(`/api/Cameras/${id}/camera-online-check`);
  }

  // حفظ اسم جهاز الكاميرا (للربط الدائم)
  async setCameraDeviceName(id: number, deviceName: string): Promise<void> {
    return apiClient.post<void>(`/api/Cameras/${id}/set-camera-device-name?devicename=${encodeURIComponent(deviceName)}`);
  }

  // جلب اسم جهاز الكاميرا المحفوظ
  async getCameraDeviceName(id: number): Promise<{ cameraDeviceName: string }> {
    return apiClient.get<{ cameraDeviceName: string }>(`/api/Cameras/${id}/get-camera-device-name`);
  }
}

export const cameraApi = new CameraApi();
