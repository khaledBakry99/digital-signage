"use client";

import { cameraApi } from "@/lib/api";
import { extractApiError } from "@/lib/api/client";
import { apiClient } from "@/lib/api/client";
import { mapBackendToFrontendCamera } from "@/lib/cameras/hooks/useCameras";
import { localCameraHandler } from "../streaming/localCamera";
import { networkCameraHandler } from "../streaming/networkCamera";
import { screenshotService } from "./screenshotService";
import type { Camera } from "@/lib/types/camera";

/**
 * Background Camera Service
 * Manages cameras running in the background for continuous screenshot capture
 */


class BackgroundCameraService {
  private activeElements: Map<string, HTMLVideoElement | HTMLImageElement> =
    new Map();
  private container: HTMLDivElement | null = null;

  /**
   * Initialize the background service
   */
  initialize(): void {
    if (typeof window === "undefined") return;


    // Create hidden container for video elements
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.style.position = "fixed";
      this.container.style.top = "-9999px";
      this.container.style.left = "-9999px";
      this.container.style.width = "1px";
      this.container.style.height = "1px";
      this.container.style.overflow = "hidden";
      this.container.style.pointerEvents = "none";
      document.body.appendChild(this.container);

    }

    // Listen for camera open/close events from tabs
    this.setupEventListeners();

    // Start all cameras
    this.startAllCameras();
  }

  /**
   * Setup event listeners for camera coordination
   */
  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("storage", (event) => {
      if (event.key === "camera-tab-open") {
        const cameraId = event.newValue;
        if (cameraId) {
          this.pauseCamera(cameraId);
        }
      } else if (event.key === "camera-tab-close") {
        const cameraId = event.newValue;
        if (cameraId) {
          this.resumeCamera(cameraId);
        }
      }
    });
  }

  /**
   * Start all cameras in background
   */
  async startAllCameras(): Promise<void> {
    try {
      // Check if user is authenticated (has token in localStorage)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          return;
        }
      }

      const backendCameras = await cameraApi.getAll();
      const cameras: Camera[] = backendCameras
        .filter((bc) => bc.state === "Active")
        .map(mapBackendToFrontendCamera);


      // Start cameras one by one with delay to avoid overwhelming the network
      for (let i = 0; i < cameras.length; i++) {
        const camera = cameras[i];

        // Add delay between starting cameras (except for the first one)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }

        await this.startCamera(camera);
      }

    } catch (error) {
      const errorMessage = extractApiError(error, "Failed to start cameras");
    }
  }

  /**
   * Start a single camera in background
   */
  async startCamera(camera: Camera): Promise<void> {
    try {
      if (!this.container) {
        return;
      }

      // Check if already running
      if (this.activeElements.has(camera.id)) {
        return;
      }

      // Set dynamic timeout based on camera's screenshot interval
      const screenshotInterval = (camera.timeToScreenshot && camera.timeToScreenshot > 0)
        ? camera.timeToScreenshot
        : 30; // Default 30 seconds
      apiClient.setDynamicTimeout(screenshotInterval);

      // Create element based on camera type
      let element: HTMLVideoElement | HTMLImageElement;

      if (camera.type === "http") {
        element = document.createElement("img");
        element.style.width = "640px";
        element.style.height = "480px";
      } else {
        element = document.createElement("video");
        element.autoplay = true;
        element.muted = true;
        element.playsInline = true;
        element.style.width = "640px";
        element.style.height = "480px";
      }

      // Add to container
      this.container.appendChild(element);

      // Start stream
      if (camera.type === "local") {
        if (element instanceof HTMLVideoElement) {
          await localCameraHandler.startStream(camera.source, element);
        }
      } else {
        await networkCameraHandler.startNetworkStream(
          camera.source,
          camera.type,
          element,
        );
      }

      // Store element
      this.activeElements.set(camera.id, element);

      // Start screenshot capture
      const intervalMs = screenshotInterval * 1000;

      screenshotService.startCapture(camera.id, camera.name, element, intervalMs);

    } catch (error) {
    }
  }

  /**
   * Stop a camera
   */
  stopCamera(cameraId: string): void {
    const element = this.activeElements.get(cameraId);

    if (element) {
      // Stop screenshot capture
      screenshotService.stopCapture(cameraId);

      // Stop stream
      if (element instanceof HTMLVideoElement) {
        if (element.srcObject) {
          const stream = element.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          element.srcObject = null;
        }
        // Also clear src if it was set
        element.src = "";
      }

      // Remove element
      if (this.container && element.parentNode === this.container) {
        this.container.removeChild(element);
      }

      this.activeElements.delete(cameraId);

    }
  }

  /**
   * Stop all cameras
   */
  stopAllCameras(): void {
    this.activeElements.forEach((_, cameraId) => {
      this.stopCamera(cameraId);
    });
  }

  /**
   * Restart a camera
   */
  async restartCamera(camera: Camera): Promise<void> {
    this.stopCamera(camera.id);
    await this.startCamera(camera);
  }

  /**
   * Get active camera IDs
   */
  getActiveCameras(): string[] {
    return Array.from(this.activeElements.keys());
  }

  /**
   * Check if camera is active
   */
  isCameraActive(cameraId: string): boolean {
    return this.activeElements.has(cameraId);
  }

  /**
   * Pause a camera (when opened in a tab)
   */
  pauseCamera(cameraId: string): void {
  }

  /**
   * Resume a camera (when tab is closed)
   */
  async resumeCamera(cameraId: string): Promise<void> {

    // Check if container is initialized
    if (!this.container) {
      return;
    }

    // Get camera and restart it
    try {
      const backendCameras = await cameraApi.getAll();
      const cameras: Camera[] = backendCameras
        .filter((bc) => bc.state === "Active")
        .map(mapBackendToFrontendCamera);
      const camera = cameras.find((c) => c.id === cameraId);

      if (camera) {
        await this.startCamera(camera);
      }
    } catch (error) {
      const errorMessage = extractApiError(error, "Failed to resume camera");
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopAllCameras();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}

// Export singleton instance
export const backgroundCameraService = new BackgroundCameraService();
