/**
 * Screenshot Service
 * Captures screenshots from camera streams at regular intervals
 */
import { genderAiApi } from "@/lib/api/genderAi.api";

// تحويل رابط dataURL المرمز بـ Base64 إلى كائن File لإرساله عبر الـ API
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export interface CameraScreenshot {
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  dataUrl: string; // base64 image
}

class ScreenshotService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private screenshots: Map<string, CameraScreenshot[]> = new Map();
  private readonly MAX_SCREENSHOTS_PER_CAMERA = 100;
  private readonly SCREENSHOT_INTERVAL = 30000; // 30 seconds

  /**
   * Start capturing screenshots for a camera
   */
  startCapture(
    cameraId: string,
    cameraName: string,
    videoElement: HTMLVideoElement | HTMLImageElement,
    intervalMs: number = this.SCREENSHOT_INTERVAL,
  ): void {
    // Stop existing capture if any
    this.stopCapture(cameraId);

    // Create interval for capturing
    const interval = setInterval(() => {
      this.captureScreenshot(cameraId, cameraName, videoElement);
    }, intervalMs);

    this.intervals.set(cameraId, interval);

    // Capture first screenshot immediately
    this.captureScreenshot(cameraId, cameraName, videoElement);
  }

  /**
   * Stop capturing screenshots for a camera
   */
  stopCapture(cameraId: string): void {
    const interval = this.intervals.get(cameraId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(cameraId);
    }
  }

  /**
   * Capture a single screenshot
   */
  private captureScreenshot(
    cameraId: string,
    cameraName: string,
    element: HTMLVideoElement | HTMLImageElement,
  ): void {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      // Set canvas size
      if (element instanceof HTMLVideoElement) {
        canvas.width = element.videoWidth || 640;
        canvas.height = element.videoHeight || 480;
      } else {
        canvas.width = element.naturalWidth || 640;
        canvas.height = element.naturalHeight || 480;
      }

      // Draw current frame
      ctx.drawImage(element, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      // Create screenshot object
      const screenshot: CameraScreenshot = {
        cameraId,
        cameraName,
        timestamp: new Date(),
        dataUrl,
      };

      // Store screenshot in memory (for live viewing in dashboard if needed)
      this.addScreenshot(cameraId, screenshot);

      // Send directly to the AI backend API instead of saving locally!
      try {
        const numericId = Number(cameraId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
          console.warn(`[AI Event] Skipping AI analyze for non-backend camera id: ${cameraId}`);
          return;
        }

        const file = dataURLtoFile(dataUrl, `camera-${cameraId}-${Date.now()}.jpg`);
        genderAiApi
          .analyze({ cameraId: numericId, image: file })
          .then((response) => {
            console.log(`[AI Event] Screen and camera updated by AI:`, response);
          })
          .catch((err) => {
            const msg = (err && (err.message || err.detail)) ? `${err.message}${err.detail ? ' - ' + err.detail : ''}` : JSON.stringify(err || {});
            console.error(`[AI Event Error] Failed to process image with GenderAi API: ${msg}`);
          });
      } catch (fileErr) {
        console.error("Failed to convert canvas to file:", fileErr);
      }
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  }

  /**
   * Add screenshot to memory
   */
  private addScreenshot(cameraId: string, screenshot: CameraScreenshot): void {
    let screenshots = this.screenshots.get(cameraId) || [];

    // Add new screenshot
    screenshots.push(screenshot);

    // Keep only last N screenshots
    if (screenshots.length > this.MAX_SCREENSHOTS_PER_CAMERA) {
      screenshots = screenshots.slice(-this.MAX_SCREENSHOTS_PER_CAMERA);
    }

    this.screenshots.set(cameraId, screenshots);
  }

  /**
   * Save screenshots to localStorage
   */
  private saveToStorage(): void {
    // Disabled to prevent localStorage bloat. Screenshots are handled by the AI backend.
  }

  /**
   * Get screenshots for a camera
   */
  getScreenshots(cameraId: string): CameraScreenshot[] {
    return this.screenshots.get(cameraId) || [];
  }

  /**
   * Get latest screenshot for a camera
   */
  getLatestScreenshot(cameraId: string): CameraScreenshot | null {
    const screenshots = this.screenshots.get(cameraId) || [];
    return screenshots.length > 0 ? screenshots[screenshots.length - 1] : null;
  }

  /**
   * Load screenshots from localStorage
   */
  loadFromStorage(cameraId: string): void {
    try {
      const key = `camera_screenshots_${cameraId}`;
      const data = localStorage.getItem(key);

      if (data) {
        const screenshots = JSON.parse(data) as CameraScreenshot[];
        // Convert timestamp strings back to Date objects
        screenshots.forEach((s) => {
          s.timestamp = new Date(s.timestamp);
        });
        this.screenshots.set(cameraId, screenshots);
      }
    } catch (error) {
      console.error("Failed to load screenshots from storage:", error);
    }
  }

  /**
   * Clear screenshots for a camera
   */
  clearScreenshots(cameraId: string): void {
    this.screenshots.delete(cameraId);
    const key = `camera_screenshots_${cameraId}`;
    localStorage.removeItem(key);
  }

  /**
   * Clear all screenshots
   */
  clearAllScreenshots(): void {
    this.screenshots.clear();
    // Clear from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("camera_screenshots_")) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Stop all captures
   */
  stopAllCaptures(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Get all active captures
   */
  getActiveCaptures(): string[] {
    return Array.from(this.intervals.keys());
  }
}

// Export singleton instance
export const screenshotService = new ScreenshotService();
