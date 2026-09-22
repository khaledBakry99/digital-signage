import type {
  Camera,
  CameraSettings,
  CamerasStore,
  CameraSettingsStore,
} from "@/lib/types/camera";
import {
  STORAGE_KEYS,
  RECONNECT_ATTEMPTS,
  RECONNECT_DELAY,
  DEFAULT_QUALITY,
} from "../constants";
import {
  DEFAULT_MOTION_DETECTION_SETTINGS,
  sanitizeMotionDetectionSettings,
} from "@/lib/services/motionDetection";
import { DEFAULT_CAPTURE_FULL_FRAME } from "@/lib/services/screenshotRegion";

const getDefaultSettings = (): CameraSettings => ({
  autoReconnect: true,
  reconnectAttempts: RECONNECT_ATTEMPTS,
  reconnectDelay: RECONNECT_DELAY,
  streamQuality: DEFAULT_QUALITY,
  motionDetection: { ...DEFAULT_MOTION_DETECTION_SETTINGS },
  captureFullFrame: DEFAULT_CAPTURE_FULL_FRAME,
  detectionMode: "motion",
  lastUpdate: new Date(),
});

/**
 * Camera Storage Service
 * Manages local storage operations for cameras and settings
 */
class CameraStorageService {
  /**
   * Save a camera to local storage
   */
  async saveCamera(camera: Camera): Promise<void> {
    try {
      const cameras = await this.getAllCameras();
      cameras[camera.id] = camera;

      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
    } catch (error) {
      throw new Error("فشل حفظ الكاميرا");
    }
  }

  /**
   * Get a camera by ID
   */
  async getCamera(id: string): Promise<Camera | null> {
    try {
      const cameras = await this.getAllCameras();
      const camera = cameras[id];

      if (!camera) {
        return null;
      }

      // Convert date strings back to Date objects
      return {
        ...camera,
        createdAt: new Date(camera.createdAt),
        updatedAt: new Date(camera.updatedAt),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all cameras
   */
  async getAllCameras(): Promise<CamerasStore> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMERAS);

      if (!data) {
        return {};
      }

      const cameras = JSON.parse(data) as CamerasStore;

      // Convert date strings back to Date objects
      Object.keys(cameras).forEach((id) => {
        cameras[id].createdAt = new Date(cameras[id].createdAt);
        cameras[id].updatedAt = new Date(cameras[id].updatedAt);
      });

      return cameras;
    } catch (error) {
      return {};
    }
  }

  /**
   * Update a camera
   */
  async updateCamera(
    id: string,
    data: Partial<Camera>,
  ): Promise<Camera | null> {
    try {
      const camera = await this.getCamera(id);

      if (!camera) {
        return null;
      }

      const updatedCamera: Camera = {
        ...camera,
        ...data,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      await this.saveCamera(updatedCamera);
      return updatedCamera;
    } catch (error) {
      throw new Error("فشل تحديث الكاميرا");
    }
  }

  /**
   * Delete a camera
   */
  async deleteCamera(id: string): Promise<void> {
    try {
      const cameras = await this.getAllCameras();
      delete cameras[id];

      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
    } catch (error) {
      throw new Error("فشل حذف الكاميرا");
    }
  }

  /**
   * Save camera settings
   */
  async saveSettings(settings: CameraSettings): Promise<void> {
    try {
      const settingsData: CameraSettingsStore = {
        autoReconnect: settings.autoReconnect,
        reconnectAttempts: settings.reconnectAttempts,
        reconnectDelay: settings.reconnectDelay,
        streamQuality: settings.streamQuality,
        motionDetection: sanitizeMotionDetectionSettings(settings.motionDetection),
        captureFullFrame: settings.captureFullFrame === true,
        detectionMode: settings.detectionMode === "person" ? "person" : "motion",
        lastUpdate: settings.lastUpdate,
      };

      localStorage.setItem(
        STORAGE_KEYS.CAMERA_SETTINGS,
        JSON.stringify(settingsData),
      );
    } catch (error) {
      throw new Error("فشل حفظ الإعدادات");
    }
  }

  /**
   * Get camera settings
   */
  async getSettings(): Promise<CameraSettings> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS);

      if (!data) {
        return getDefaultSettings();
      }

      const settings = JSON.parse(data) as CameraSettingsStore;

      return {
        ...getDefaultSettings(),
        ...settings,
        motionDetection: sanitizeMotionDetectionSettings(settings.motionDetection),
        captureFullFrame: settings.captureFullFrame === true,
        detectionMode: settings.detectionMode === "person" ? "person" : "motion",
        lastUpdate: new Date(settings.lastUpdate),
      };
    } catch (error) {
      return getDefaultSettings();
    }
  }

  /**
   * Clear all camera data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.CAMERAS);
      localStorage.removeItem(STORAGE_KEYS.CAMERA_SETTINGS);
    } catch (error) {
      throw new Error("فشل مسح البيانات");
    }
  }
}

// Export singleton instance
export const cameraStorage = new CameraStorageService();
