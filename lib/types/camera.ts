// Camera Types and Interfaces

export type CameraType = "local" | "rtsp" | "http" | "hls";
export type CameraStatus = "connected" | "disconnected" | "connecting";
export type StreamQuality = "low" | "medium" | "high";
export type Resolution = "720p" | "1080p" | "4k";

/**
 * Camera Playback Information
 * Separates source (RTSP URL) from playback (WebRTC/HLS URL)
 * Browser only receives playback URLs, never raw RTSP credentials
 */
export interface CameraPlayback {
  webrtcUrl?: string; // WebRTC/WHEP endpoint for RTSP cameras (e.g., https://stream-server/.../whep)
  hlsUrl?: string; // HLS fallback URL (e.g., https://stream-server/.../playlist.m3u8)
  streamPath?: string; // MediaMTX stream identifier (e.g., "camera-15")
}

/**
 * RTSP Camera Configuration
 * Stores RTSP connection details separately from playback
 * Password is backend-only and never returned to frontend
 */
export interface RtspConfig {
  rtspUrl: string; // Full RTSP URL (e.g., rtsp://user:pass@192.168.1.10:554/stream)
  // Alternative: separate fields (if backend prefers)
  // host?: string;
  // port?: number;
  // path?: string;
  // username?: string;
  // password?: string; // Backend-only, never returned to frontend
}

export interface Camera {
  id: string; // UUID
  name: string; // Camera name
  location: string; // Camera location
  type: CameraType; // Source type
  source: string; // deviceId for local or URL for network (legacy, for compatibility)

  // NEW: Separate source and playback
  sourceType?: string; // Explicit source type from backend (can be 'USB', 'RTSP', 'HLS', 'HTTP', etc.)
  playback?: CameraPlayback; // Playback URLs (WebRTC/HLS)
  rtspConfig?: RtspConfig; // RTSP configuration (if type is RTSP)

  cameraDeviceName?: string; // Device name from API (legacy)
  cameraDeviceRealName?: string; // Real device name (e.g., "Logitech C920")
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
  motionDetection: MotionDetectionSettings;
  captureFullFrame: boolean;
  detectionMode: "motion" | "person";
  lastUpdate: Date;
}

export interface MotionDetectionSettings {
  motionRatioThreshold: number;
  pixelDifferenceThreshold: number;
  minimumBlockChangedRatio: number;
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
  motionDetection: MotionDetectionSettings;
  captureFullFrame: boolean;
  detectionMode: "motion" | "person";
  lastUpdate: Date;
}
