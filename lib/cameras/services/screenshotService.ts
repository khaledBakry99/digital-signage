/**
 * Screenshot Service
 * Captures screenshots from camera streams at regular intervals
 */
import { genderAiApi } from "@/lib/api/genderAi.api";
import { mediapipeService } from "@/lib/services/mediapipeService";

// Convert Base64-encoded dataURL to File object for sending via API
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
  private animationFrames: Map<string, number> = new Map();
  private lastStablePersonCounts: Map<string, number> = new Map();
  private candidatePersonCounts: Map<string, number> = new Map();
  private candidateStableFrames: Map<string, number> = new Map();
  private analyzingCameras: Set<string> = new Set();
  private screenshots: Map<string, CameraScreenshot[]> = new Map();
  private lastCaptureAt: Map<string, number> = new Map();
  private cooldownUntil: Map<string, number> = new Map();
  private readonly MAX_SCREENSHOTS_PER_CAMERA = 100;
  private readonly REQUIRED_STABLE_FRAMES = 1;
  private readonly ZERO_REQUIRED_STABLE_FRAMES = 2;
  private readonly MIN_CAPTURE_INTERVAL_MS = 4000;
  private readonly PLAYING_CAPTURE_INTERVAL_MS = 8000;
  private readonly ERROR_COOLDOWN_MS = 15000;

  /**
   * Start capturing screenshots for a camera
   */
  startCapture(
    cameraId: string,
    cameraName: string,
    videoElement: HTMLVideoElement | HTMLImageElement,
    intervalMs?: number,
  ): void {
    this.stopCapture(cameraId);
    this.lastStablePersonCounts.set(cameraId, 0);
    this.candidatePersonCounts.set(cameraId, 0);
    this.candidateStableFrames.set(cameraId, 0);
    this.lastCaptureAt.set(cameraId, 0);
    this.cooldownUntil.set(cameraId, 0);

    const detect = async () => {
      if (!this.animationFrames.has(cameraId)) return;

      await this.detectPersonCountChange(cameraId, cameraName, videoElement);

      if (this.animationFrames.has(cameraId)) {
        const frame = window.requestAnimationFrame(detect);
        this.animationFrames.set(cameraId, frame);
      }
    };

    const frame = window.requestAnimationFrame(detect);
    this.animationFrames.set(cameraId, frame);
  }

  /**
   * Stop capturing screenshots for a camera
   */
  stopCapture(cameraId: string): void {
    const frame = this.animationFrames.get(cameraId);
    if (frame) {
      window.cancelAnimationFrame(frame);
      this.animationFrames.delete(cameraId);
    }
    this.lastStablePersonCounts.delete(cameraId);
    this.candidatePersonCounts.delete(cameraId);
    this.candidateStableFrames.delete(cameraId);
    this.analyzingCameras.delete(cameraId);
    this.lastCaptureAt.delete(cameraId);
    this.cooldownUntil.delete(cameraId);
  }

  private async detectPersonCountChange(
    cameraId: string,
    cameraName: string,
    element: HTMLVideoElement | HTMLImageElement,
  ): Promise<void> {
    if (this.analyzingCameras.has(cameraId)) return;
    if (!(element instanceof HTMLVideoElement)) return;

    this.analyzingCameras.add(cameraId);

    try {
      const result = await mediapipeService.detectFromVideo(element);
      const currentCount = result.personsDetected;
      const candidateCount = this.candidatePersonCounts.get(cameraId) ?? 0;
      const stableFrames = this.candidateStableFrames.get(cameraId) ?? 0;
      const lastStableCount = this.lastStablePersonCounts.get(cameraId) ?? 0;

      if (currentCount === candidateCount) {
        this.candidateStableFrames.set(cameraId, stableFrames + 1);
      } else {
        this.candidatePersonCounts.set(cameraId, currentCount);
        this.candidateStableFrames.set(cameraId, 1);
      }

      const nextStableFrames = this.candidateStableFrames.get(cameraId) ?? 0;
      const requiredFrames = currentCount === 0 ? this.ZERO_REQUIRED_STABLE_FRAMES : this.REQUIRED_STABLE_FRAMES;
      if (nextStableFrames < requiredFrames || currentCount === lastStableCount) return;

      this.lastStablePersonCounts.set(cameraId, currentCount);

      const event = new CustomEvent("person-count-changed", {
        detail: {
          cameraId: Number(cameraId),
          previousCount: lastStableCount,
          currentCount,
          timestamp: new Date(),
        },
      });
      window.dispatchEvent(event);

      if (currentCount === 0) {
        return;
      }

      const now = Date.now();
      const cooldownUntil = this.cooldownUntil.get(cameraId) ?? 0;
      if (cooldownUntil > now) {
        const remaining = Math.max(0, cooldownUntil - now);
        return;
      }

      const lastCapture = this.lastCaptureAt.get(cameraId) ?? 0;
      const screenState = this.getScreenState(cameraId);
      const dynamicInterval = screenState === "PLAYING"
        ? this.PLAYING_CAPTURE_INTERVAL_MS
        : this.MIN_CAPTURE_INTERVAL_MS;

      if (now - lastCapture < dynamicInterval) {
        return;
      }

      this.lastCaptureAt.set(cameraId, now);
      this.captureScreenshot(cameraId, cameraName, element);
    } catch (error) {
    } finally {
      this.analyzingCameras.delete(cameraId);
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
          return;
        }

        const fileName = `camera-${cameraId}-${Date.now()}.jpg`;


        const file = dataURLtoFile(dataUrl, fileName);
        genderAiApi
          .analyze({ cameraId: numericId, image: file })
          .then((response) => {

            // ============================================
            // 🎯 DISPATCH AI DETECTION EVENT
            // ============================================
            if (response?.audience) {
              const event = new CustomEvent('ai-detection', {
                detail: {
                  audience: response.audience,
                  selectedSlot: response.selectedSlot,
                  cameraId: numericId,
                  gender: response.gender,
                  ageGroup: response.ageGroup,
                  timestamp: new Date()
                }
              });
              window.dispatchEvent(event);
            }

          })
          .catch((err) => {
            const msg = (err && (err.message || err.detail)) ? `${err.message}${err.detail ? ' - ' + err.detail : ''}` : JSON.stringify(err || {});


            if (this.shouldThrottleAfterError(err)) {
              const resumeAt = Date.now() + this.ERROR_COOLDOWN_MS;
              this.cooldownUntil.set(cameraId, resumeAt);
            }
          });
      } catch (fileErr) {
      }
    } catch (error) {
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
    this.animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    this.animationFrames.clear();
    this.lastStablePersonCounts.clear();
    this.candidatePersonCounts.clear();
    this.candidateStableFrames.clear();
    this.analyzingCameras.clear();
  }

  /**
   * Get all active captures
   */
  getActiveCaptures(): string[] {
    return Array.from(this.animationFrames.keys());
  }

  private getScreenState(cameraId: string): "DETECTING" | "PLAYING" {
    if (typeof window === "undefined") return "DETECTING";
    const key = `screen_state_${cameraId}`;
    const value = window.sessionStorage.getItem(key);
    return value === "PLAYING" ? "PLAYING" : "DETECTING";
  }

  private shouldThrottleAfterError(error: unknown): boolean {
    if (!error) return false;
    const status = (error as any)?.status ?? (error as any)?.response?.status;
    if (status === 429) return true;
    const message = String((error as any)?.message ?? error ?? "").toLowerCase();
    return message.includes("429") || message.includes("too many requests") || message.includes("failed to fetch");
  }
}

// Export singleton instance
export const screenshotService = new ScreenshotService();
