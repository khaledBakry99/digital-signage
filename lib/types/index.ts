// Core data models for the system

export interface Advertisement {
  id: string; // UUID
  name: string; // Ad name
  type: "image" | "video"; // Ad type
  fileUrl: string; // Local file URL
  fileName: string; // Original file name
  fileSize: number; // File size in bytes
  screenId: number; // Screen number (1-5)
  duration?: number; // Display duration for images (seconds)
  createdAt: Date; // Creation date
  updatedAt: Date; // Last update date
}

export interface Screen {
  id: number; // 1-5
  name: string; // "Screen 1", "Screen 2", ...
  currentAdId: string | null; // Current ad ID
  cameraId: string | null; // Linked camera ID
  status: "active" | "idle"; // Screen status
  lastUpdate: Date; // Last update
}

export interface Screenshot {
  id: string; // UUID
  screenId: number; // Screen number (1-5)
  imageUrl: string; // Local image URL
  imageSize: number; // Image size in bytes
  timestamp: Date; // Capture time
}

export interface AppConfig {
  screenshotInterval: number; // 5000ms
  screenshotQuality: number; // 0.8
  autoRefresh: boolean; // true
  lastUpdate: Date;
}

export interface Change {
  type: "ad_created" | "ad_updated" | "ad_deleted" | "screen_updated";
  screenId?: number;
  advertisementId?: string;
  timestamp: Date;
}

// Storage types
export interface AdvertisementsStore {
  [id: string]: Advertisement;
}

export interface ScreensStore {
  [id: number]: Screen;
}

// Supported file formats
export const SUPPORTED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const SUPPORTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
