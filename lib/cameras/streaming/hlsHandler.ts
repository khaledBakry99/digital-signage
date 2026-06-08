import Hls from "hls.js";
import { ERROR_MESSAGES } from "../constants";

/**
 * HLS Stream Handler
 * Manages HLS streaming for network cameras
 */
class HLSHandler {
  private hlsInstances: Map<string, Hls> = new Map();

  /**
   * Start HLS stream
   */
  async startHLSStream(
    url: string,
    videoElement: HTMLVideoElement,
  ): Promise<void> {
    try {
      // Check if already have an instance for this URL
      const existingHls = this.hlsInstances.get(url);
      if (existingHls) {
        existingHls.destroy();
        this.hlsInstances.delete(url);
      }

      // Check if HLS.js is supported
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxLoadingDelay: 4,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
        });

        hls.loadSource(url);
        hls.attachMedia(videoElement);

        // Wait for manifest to be parsed
        await new Promise<void>((resolve, reject) => {
          let resolved = false;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!resolved) {
              resolved = true;
              videoElement.play().then(resolve).catch(reject);
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error("HLS Error:", data);
              if (!resolved) {
                resolved = true;
                reject(new Error(`HLS Error: ${data.type}`));
              }
            }
          });

          // Timeout after 15 seconds (increased from 10)
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              reject(new Error("HLS stream timeout"));
            }
          }, 15000);
        });

        // Store HLS instance
        this.hlsInstances.set(url, hls);
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        videoElement.src = url;
        await videoElement.play();
      } else {
        throw new Error("HLS غير مدعوم في هذا المتصفح");
      }
    } catch (error) {
      console.error("Failed to start HLS stream:", error);
      throw new Error(ERROR_MESSAGES.CONNECTION_FAILED);
    }
  }

  /**
   * Stop HLS stream
   */
  stopHLSStream(url: string): void {
    try {
      const hls = this.hlsInstances.get(url);

      if (hls) {
        hls.destroy();
        this.hlsInstances.delete(url);
      }
    } catch (error) {
      console.error("Failed to stop HLS stream:", error);
    }
  }

  /**
   * Stop all HLS streams
   */
  stopAllStreams(): void {
    this.hlsInstances.forEach((hls) => {
      hls.destroy();
    });
    this.hlsInstances.clear();
  }

  /**
   * Check if HLS is supported
   */
  isSupported(): boolean {
    return Hls.isSupported();
  }
}

// Export singleton instance
export const hlsHandler = new HLSHandler();
