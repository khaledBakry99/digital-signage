// Camera Types and Interfaces

export type CameraType = "local" | "rtsp" | "http" | "hls";
export type CameraStatus = "connected" | "disconnected" | "connecting";
export type StreamQuality = "low" | "medium" | "high";
export type Resolution = "720p" | "1080p" | "4k";

export interface Camera {
  id: string; // UUID
  name: string; // اسم الكاميرا
  location: string; // موقع الكاميرا
  type: CameraType; // نوع المصدر
  source: string; // deviceId للمحلية أو URL للشبكية
  status: CameraStatus; // حالة الاتصال
  thumbnail?: string; // معاينة صغيرة
  timeToScreenshot?: number; // فاصل التقاط الصور بالثواني
  settings: CameraStreamSettings;
  createdAtUtc?: string; // تاريخ الإنشاء من الـ API
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraStreamSettings {
  resolution: Resolution;
  frameRate: number; // 30
  quality: StreamQuality;
}

export interface CameraSettings {
  autoReconnect: boolean; // true
  reconnectAttempts: number; // 3
  reconnectDelay: number; // 5000ms
  streamQuality: StreamQuality; // medium
  lastUpdate: Date;
}

export interface CameraHealth {
  isConnected: boolean;
  latency: number; // ms
  frameRate: number; // fps
  lastCheck: Date;
}

export interface ReconnectConfig {
  maxAttempts: number; // 3
  delayMs: number; // 5000
  backoffMultiplier: number; // 1.5
}

// Storage Schemas
export interface CamerasStore {
  [id: string]: Camera;
}

export interface CameraSettingsStore {
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  streamQuality: StreamQuality;
  lastUpdate: Date;
}
