"use client";

import { cameraApi } from "@/lib/api";
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
  private pausedCameras: Set<string> = new Set();

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
      console.error("Failed to start all cameras:", error);
    }
  }

  /**
   * Start a single camera in background
   */
  async startCamera(camera: Camera): Promise<void> {
    try {
      if (!this.container) {
        console.error("Container not initialized");
        return;
      }

      // Check if already running
      if (this.activeElements.has(camera.id)) {
        return;
      }

      // Check if camera is paused (opened in a tab)
      if (this.pausedCameras.has(camera.id)) {
        console.log(`Camera ${camera.name} is paused (opened in tab)`);
        return;
      }

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
      const intervalMs = (camera.timeToScreenshot && camera.timeToScreenshot > 0)
        ? camera.timeToScreenshot * 1000
        : 30000; // Fallback to 30 seconds

      screenshotService.startCapture(camera.id, camera.name, element, intervalMs);

      console.log(`Started background camera: ${camera.name}`);
    } catch (error) {
      console.error(`Failed to start camera ${camera.name}:`, error);
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

      console.log(`Stopped background camera: ${cameraId}`);
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
    console.log(`Pausing background camera: ${cameraId}`);
    this.pausedCameras.add(cameraId);
    this.stopCamera(cameraId);
  }

  /**
   * Resume a camera (when tab is closed)
   */
  async resumeCamera(cameraId: string): Promise<void> {
    console.log(`Resuming background camera: ${cameraId}`);
    this.pausedCameras.delete(cameraId);

    // Check if container is initialized
    if (!this.container) {
      console.log("Container not initialized yet, skipping resume");
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
      console.error(`Failed to resume camera ${cameraId}:`, error);
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
