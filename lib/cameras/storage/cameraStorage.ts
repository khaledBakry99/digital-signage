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
      console.error("Failed to save camera:", error);
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
      console.error("Failed to get camera:", error);
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
      console.error("Failed to get all cameras:", error);
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
      console.error("Failed to update camera:", error);
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
      console.error("Failed to delete camera:", error);
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
        lastUpdate: settings.lastUpdate,
      };

      localStorage.setItem(
        STORAGE_KEYS.CAMERA_SETTINGS,
        JSON.stringify(settingsData),
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
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
        // Return default settings
        return {
          autoReconnect: true,
          reconnectAttempts: RECONNECT_ATTEMPTS,
          reconnectDelay: RECONNECT_DELAY,
          streamQuality: DEFAULT_QUALITY,
          lastUpdate: new Date(),
        };
      }

      const settings = JSON.parse(data) as CameraSettingsStore;

      return {
        ...settings,
        lastUpdate: new Date(settings.lastUpdate),
      };
    } catch (error) {
      console.error("Failed to get settings:", error);
      // Return default settings on error
      return {
        autoReconnect: true,
        reconnectAttempts: RECONNECT_ATTEMPTS,
        reconnectDelay: RECONNECT_DELAY,
        streamQuality: DEFAULT_QUALITY,
        lastUpdate: new Date(),
      };
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
      console.error("Failed to clear storage:", error);
      throw new Error("فشل مسح البيانات");
    }
  }
}

// Export singleton instance
export const cameraStorage = new CameraStorageService();
