import type { Camera, ReconnectConfig } from "@/lib/types/camera";
import {
  RECONNECT_ATTEMPTS,
  RECONNECT_DELAY,
  RECONNECT_BACKOFF_MULTIPLIER,
} from "../constants";
import { networkCameraHandler } from "../streaming/networkCamera";

/**
 * Reconnect Service
 * Manages automatic reconnection for cameras
 */
class ReconnectService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  private defaultConfig: ReconnectConfig = {
    maxAttempts: RECONNECT_ATTEMPTS,
    delayMs: RECONNECT_DELAY,
    backoffMultiplier: RECONNECT_BACKOFF_MULTIPLIER,
  };

  /**
   * Start monitoring a camera for disconnections
   */
  startMonitoring(
    camera: Camera,
    onReconnect: () => void,
    config?: Partial<ReconnectConfig>,
  ): void {
    // Stop existing monitoring if any
    this.stopMonitoring(camera.id);

    const finalConfig = { ...this.defaultConfig, ...config };

    // Check connection periodically
    const interval = setInterval(async () => {
      try {
        const isConnected = await this.checkConnection(camera);

        if (!isConnected) {
          const reconnected = await this.attemptReconnect(camera, finalConfig);

          if (reconnected) {
            onReconnect();
            this.reconnectAttempts.delete(camera.id);
          }
        }
      } catch (error) {
      }
    }, finalConfig.delayMs);

    this.monitoringIntervals.set(camera.id, interval);
  }

  /**
   * Stop monitoring a camera
   */
  stopMonitoring(cameraId: string): void {
    const interval = this.monitoringIntervals.get(cameraId);

    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(cameraId);
    }

    this.reconnectAttempts.delete(cameraId);
  }

  /**
   * Attempt to reconnect to a camera
   */
  async attemptReconnect(
    camera: Camera,
    config?: Partial<ReconnectConfig>,
  ): Promise<boolean> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let attempt = this.reconnectAttempts.get(camera.id) || 0;
    let delay = finalConfig.delayMs;

    while (attempt < finalConfig.maxAttempts) {
      attempt++;
      this.reconnectAttempts.set(camera.id, attempt);


      try {
        // Wait before attempting
        await this.sleep(delay);

        // Check connection
        const connected = await this.checkConnection(camera);

        if (connected) {
          this.reconnectAttempts.delete(camera.id);
          return true;
        }
      } catch (error) {
      }

      // Increase delay with backoff
      delay *= finalConfig.backoffMultiplier;
    }

    this.reconnectAttempts.delete(camera.id);
    return false;
  }

  /**
   * Check if camera is connected
   */
  private async checkConnection(camera: Camera): Promise<boolean> {
    try {
      if (camera.type === "local") {
        // For local cameras, check if MediaDevices API is available
        return !!(
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );
      } else {
        // For network cameras, check URL
        return await networkCameraHandler.checkConnection(camera.source);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current reconnect attempt count for a camera
   */
  getReconnectAttempt(cameraId: string): number {
    return this.reconnectAttempts.get(cameraId) || 0;
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const reconnectService = new ReconnectService();
