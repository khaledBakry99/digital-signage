import { v4 as uuidv4 } from "uuid";
import type { Camera, CameraType } from "@/lib/types/camera";
import { cameraStorage } from "../storage/cameraStorage";
import {
  MAX_CAMERAS,
  ERROR_MESSAGES,
  DEFAULT_FRAME_RATE,
  DEFAULT_RESOLUTION,
  DEFAULT_QUALITY,
} from "../constants";

/**
 * Camera Service
 * Manages camera CRUD operations with validation
 */
class CameraService {
  /**
   * Create a new camera
   */
  async createCamera(data: {
    name: string;
    location: string;
    type: CameraType;
    source: string;
  }): Promise<Camera> {
    const cameras = await cameraStorage.getAllCameras();
    const cameraCount = Object.keys(cameras).length;

    if (cameraCount >= MAX_CAMERAS) {
      throw new Error(ERROR_MESSAGES.MAX_CAMERAS_REACHED);
    }

    this.validateCameraData(data);

    const camera: Camera = {
      id: uuidv4(),
      name: data.name.trim(),
      location: data.location.trim(),
      type: data.type,
      source: data.source.trim(),
      status: "disconnected",
      settings: {
        resolution: DEFAULT_RESOLUTION,
        frameRate: DEFAULT_FRAME_RATE,
        quality: DEFAULT_QUALITY,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await cameraStorage.saveCamera(camera);
    return camera;
  }

  /**
   * Update an existing camera
   */
  async updateCamera(
    id: string,
    data: Partial<Omit<Camera, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Camera> {
    const camera = await cameraStorage.getCamera(id);

    if (!camera) {
      throw new Error("الكاميرا غير موجودة");
    }

    // Validate if type or source is being updated
    if (data.type || data.source) {
      this.validateCameraData({
        name: data.name || camera.name,
        type: data.type || camera.type,
        source: data.source || camera.source,
      });
    }

    const updatedCamera = await cameraStorage.updateCamera(id, data);

    if (!updatedCamera) {
      throw new Error("فشل تحديث الكاميرا");
    }

    return updatedCamera;
  }

  /**
   * Delete a camera
   */
  async deleteCamera(id: string): Promise<void> {
    const camera = await cameraStorage.getCamera(id);

    if (!camera) {
      throw new Error("الكاميرا غير موجودة");
    }

    await cameraStorage.deleteCamera(id);
  }

  /**
   * Get all cameras
   */
  async getAllCameras(): Promise<Camera[]> {
    const camerasStore = await cameraStorage.getAllCameras();
    return Object.values(camerasStore);
  }

  /**
   * Get camera by ID
   */
  async getCameraById(id: string): Promise<Camera | null> {
    return await cameraStorage.getCamera(id);
  }

  /**
   * Validate camera data
   */
  private validateCameraData(data: {
    name: string;
    location?: string;
    type: CameraType;
    source: string;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("اسم الكاميرا مطلوب");
    }
    if (data.name.trim().length > 50) {
      throw new Error("اسم الكاميرا طويل جداً (الحد الأقصى 50 حرف)");
    }

    const validTypes: CameraType[] = ["local", "rtsp", "http", "hls"];
    if (!validTypes.includes(data.type)) {
      throw new Error("نوع الكاميرا غير صالح");
    }

    if (!data.source || data.source.trim().length === 0) {
      throw new Error("مصدر الكاميرا مطلوب");
    }

    if (data.type !== "local") {
      if (!this.isValidUrl(data.source)) {
        throw new Error(ERROR_MESSAGES.INVALID_URL);
      }
      const url = new URL(data.source);
      const validProtocols = ["http:", "https:", "rtsp:"];
      if (!validProtocols.includes(url.protocol)) {
        throw new Error("البروتوكول غير مدعوم. استخدم HTTP, HTTPS, أو RTSP");
      }
    }
  }

  /**
   * Check if string is a valid URL
   */
  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const cameraService = new CameraService();
