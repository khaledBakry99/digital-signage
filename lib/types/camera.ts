// Camera Types and Interfaces

export type CameraType = "local" | "rtsp" | "http" | "hls";
export type CameraStatus = "connected" | "disconnected" | "connecting";
export type StreamQuality = "low" | "medium" | "high";
export type Resolution = "720p" | "1080p" | "4k";

export interface Camera {
  id: string; // UUID
  name: string; // Camera name
  location: string; // Camera location
  type: CameraType; // Source type
  source: string; // deviceId for local or URL for network
  cameraDeviceName?: string; // Device name from API
  status: CameraStatus; // Connection status
  thumbnail?: string; // Thumbnail preview
  timeToScreenshot?: number; // Screenshot interval in seconds
  settings: CameraStreamSettings;
  createdAtUtc?: string; // Creation date from API
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
