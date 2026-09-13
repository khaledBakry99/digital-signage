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
          // RTSP should use WebRTC via useCameraStream hook
          // This handler should NOT be called for RTSP directly
          throw new Error("RTSP cameras must use WebRTC handler. Call useCameraStream hook instead.");

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
      return false;
    }
  }
}

// Export singleton instance
export const networkCameraHandler = new NetworkCameraHandler();
