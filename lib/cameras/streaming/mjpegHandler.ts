import { ERROR_MESSAGES, RECONNECT_DELAY } from "../constants";

/**
 * MJPEG Stream Handler
 * Manages MJPEG streaming for simple IP cameras
 */
class MJPEGHandler {
  private activeStreams: Map<string, HTMLImageElement> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start MJPEG stream
   */
  startMJPEGStream(url: string, imgElement: HTMLImageElement): void {
    try {
      // Set image source
      imgElement.src = url;

      // Handle errors and auto-reconnect
      imgElement.onerror = () => {
        console.error("MJPEG stream error, attempting reconnect...");

        // Clear existing timer
        const existingTimer = this.reconnectTimers.get(url);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Attempt reconnect after delay
        const timer = setTimeout(() => {
          imgElement.src = url + "?t=" + Date.now();
        }, RECONNECT_DELAY);

        this.reconnectTimers.set(url, timer);
      };

      // Handle successful load
      imgElement.onload = () => {
        // Clear reconnect timer on successful load
        const timer = this.reconnectTimers.get(url);
        if (timer) {
          clearTimeout(timer);
          this.reconnectTimers.delete(url);
        }
      };

      // Store active stream
      this.activeStreams.set(url, imgElement);
    } catch (error) {
      console.error("Failed to start MJPEG stream:", error);
      throw new Error(ERROR_MESSAGES.CONNECTION_FAILED);
    }
  }

  /**
   * Stop MJPEG stream
   */
  stopMJPEGStream(url: string): void {
    try {
      const imgElement = this.activeStreams.get(url);

      if (imgElement) {
        // Clear image source
        imgElement.src = "";
        imgElement.onerror = null;
        imgElement.onload = null;

        // Clear reconnect timer
        const timer = this.reconnectTimers.get(url);
        if (timer) {
          clearTimeout(timer);
          this.reconnectTimers.delete(url);
        }

        // Remove from active streams
        this.activeStreams.delete(url);
      }
    } catch (error) {
      console.error("Failed to stop MJPEG stream:", error);
    }
  }

  /**
   * Stop all MJPEG streams
   */
  stopAllStreams(): void {
    this.activeStreams.forEach((_, url) => {
      this.stopMJPEGStream(url);
    });
    this.activeStreams.clear();
    this.reconnectTimers.clear();
  }

  /**
   * Refresh stream (force reload)
   */
  refreshStream(url: string): void {
    const imgElement = this.activeStreams.get(url);

    if (imgElement) {
      imgElement.src = url + "?t=" + Date.now();
    }
  }
}

// Export singleton instance
export const mjpegHandler = new MJPEGHandler();
