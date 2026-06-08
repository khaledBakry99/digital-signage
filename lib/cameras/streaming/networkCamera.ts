import type { CameraType } from "@/lib/types/camera";
import { hlsHandler } from "./hlsHandler";
import { mjpegHandler } from "./mjpegHandler";
import { ERROR_MESSAGES } from "../constants";

/**
 * Network Camera Handler
 * Unified handler for all network camera types (RTSP, HTTP, HLS)
 */
class NetworkCameraHandler {
  /**
   * Start network camera stream
   * Automatically selects the appropriate handler based on camera type
   */
  async startNetworkStream(
    url: string,
    type: CameraType,
    element: HTMLVideoElement | HTMLImageElement,
  ): Promise<void> {
    try {
      switch (type) {
        case "hls":
          if (element instanceof HTMLVideoElement) {
            await hlsHandler.startHLSStream(url, element);
          } else {
            throw new Error("HLS requires a video element");
          }
          break;

        case "rtsp":
          // RTSP typically needs to be converted to HLS on the server side
          // For now, we'll try to use it as HLS
          if (element instanceof HTMLVideoElement) {
            await hlsHandler.startHLSStream(url, element);
          } else {
            throw new Error("RTSP requires a video element");
          }
          break;

        case "http":
          // HTTP can be either MJPEG or HLS, try to detect
          if (url.includes(".m3u8") || url.includes("/hls/")) {
            // Likely HLS
            if (element instanceof HTMLVideoElement) {
              await hlsHandler.startHLSStream(url, element);
            } else {
              throw new Error("HLS requires a video element");
            }
          } else {
            // Likely MJPEG
            if (element instanceof HTMLImageElement) {
              mjpegHandler.startMJPEGStream(url, element);
            } else {
              throw new Error("MJPEG requires an image element");
            }
          }
          break;

        default:
          throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
      }
    } catch (error) {
      console.error("Failed to start network stream:", error);
      throw error;
    }
  }

  /**
   * Stop network camera stream
   */
  stopNetworkStream(url: string, type: CameraType): void {
    try {
      switch (type) {
        case "hls":
        case "rtsp":
          hlsHandler.stopHLSStream(url);
          break;

        case "http":
          // Try both handlers
          hlsHandler.stopHLSStream(url);
          mjpegHandler.stopMJPEGStream(url);
          break;
      }
    } catch (error) {
      console.error("Failed to stop network stream:", error);
    }
  }

  /**
   * Stop all network streams
   */
  stopAllStreams(): void {
    hlsHandler.stopAllStreams();
    mjpegHandler.stopAllStreams();
  }

  /**
   * Check connection to camera
   */
  async checkConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
      });

      return response.ok || response.type === "opaque";
    } catch (error) {
      console.error("Connection check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const networkCameraHandler = new NetworkCameraHandler();
