import { genderAiApi } from "@/lib/api/genderAi.api";
import { CameraCaptureDetector } from "@/lib/services/cameraCaptureDetector";
import { getStoredPersonDetectionIntervalMs } from "@/lib/services/personDetection";
import {
  getScreenshotRegion,
  getStoredCaptureCooldownMs,
} from "@/lib/services/screenshotRegion";
import {
  getPixelDetectionRegion,
  type NormalizedDetectionRegion,
} from "@/lib/services/personDetection";
import type { GenderAiResponse } from "@/lib/types/genderAi";

/**
 * Capture camera frames and send them to the AI endpoint.
 * Used on camera pages only (not advertisement screens).
 */
export class CameraScreenshotService {
  /**
   * Capture a frame from the video element and send it to AI.
   * @param videoElement - target video element
   * @param cameraId - camera identifier
   * @param onSuccess - optional success callback
   * @param onError - optional error callback
   */
  async captureAndSendToAi(
    videoElement: HTMLVideoElement,
    cameraId: number,
    onSuccess?: (result: GenderAiResponse) => void,
    onError?: (error: Error) => void,
    onScreenshotSent?: () => void,
    detectionRegion?: NormalizedDetectionRegion | null,
  ): Promise<void> {
    const startTime = new Date();
    console.log('🎬 [SCREENSHOT TAKEN]', {
      cameraId,
      time: startTime.toISOString(),
      timeLocal: startTime.toLocaleTimeString('ar-SA')
    });

    try {
      // Ensure the video is ready and playing
      if (!videoElement || videoElement.paused || videoElement.ended) {
        return; // Skip without throwing error
      }

      // Ensure the video has buffered data
      if (videoElement.readyState < 2) {
        return; // Skip without throwing error
      }

      // Ensure the video has valid dimensions
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return; // Skip without throwing error
      }

      const screenshotRegion = getScreenshotRegion(detectionRegion);
      const detectionBounds = getPixelDetectionRegion(
        screenshotRegion,
        videoElement.videoWidth,
        videoElement.videoHeight,
      );
      const source = detectionBounds ?? {
          originX: 0,
          originY: 0,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        };
      const upscale = detectionBounds
        ? Math.min(3, Math.max(1, 960 / Math.max(source.width, source.height)))
        : 1;

      // Compose the image sent to AI independently of the motion detection region.
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(source.width * upscale);
      canvas.height = Math.round(source.height * upscale);

      // Draw the current frame onto the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create Canvas context");
      }

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (screenshotRegion?.points?.length === 4) {
        const scaleX = canvas.width / source.width;
        const scaleY = canvas.height / source.height;
        ctx.beginPath();
        screenshotRegion.points.forEach((point, index) => {
          const x = (point.x * videoElement.videoWidth - source.originX) * scaleX;
          const y = (point.y * videoElement.videoHeight - source.originY) * scaleY;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(
        videoElement,
        source.originX,
        source.originY,
        source.width,
        source.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      ctx.restore();

      // Convert the canvas to a JPEG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error("Failed to convert screenshot to image"));
            }
          },
          "image/jpeg",
          0.85, // High quality for detection accuracy
        );
      });

      console.log('💾 [SCREENSHOT SAVED]', {
        cameraId,
        dataSize: Math.round(blob.size / 1024) + ' KB',
        time: new Date().toISOString(),
        timeLocal: new Date().toLocaleTimeString('ar-SA')
      });

      // Wrap the blob in a File for upload
      const file = new File([blob], `camera-${cameraId}-screenshot.jpg`, {
        type: "image/jpeg",
      });

      console.log('🚀 [SENDING TO AI]', {
        cameraId,
        fileSize: Math.round(file.size / 1024) + ' KB',
        time: new Date().toISOString(),
        timeLocal: new Date().toLocaleTimeString('ar-SA')
      });

      onScreenshotSent?.();

      // Send the image to the AI service
      const result = await genderAiApi.detectGender(cameraId, file);
      this.publishAiPersonCount(cameraId, result.peopleCount);

      console.log('✅ [AI RESPONSE RECEIVED]', {
        cameraId,
        time: new Date().toISOString(),
        timeLocal: new Date().toLocaleTimeString('ar-SA')
      });

      // Invoke success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error: unknown) {
      // Detect the specific 400 error when AI is disabled on the linked screen
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      if (errorMessage.includes("AI enabled") || errorMessage.includes("aiEnabled")) {
        return; // Skip without throwing error
      }

      // Log detailed diagnostics for other errors

      const err = error instanceof Error ? error : new Error(String(error));

      // Invoke error callback if provided
      if (onError) {
        onError(err);
      }

      throw err;
    }
  }

  private publishAiPersonCount(cameraId: number, currentCount: number): void {
    window.dispatchEvent(new CustomEvent("person-count-changed", {
      detail: { cameraId, currentCount, timestamp: new Date() },
    }));

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`person-count-changed-camera-${cameraId}`);
      channel.postMessage({
        type: "person-count-changed",
        cameraId,
        currentCount,
        timestamp: new Date().toISOString(),
      });
      channel.close();
    }
  }

  startDetectionCapture(
    videoElement: HTMLVideoElement,
    cameraId: number,
    sendToAi: boolean = true,
    onScreenshotSent?: () => void,
    getDetectionRegion?: () => NormalizedDetectionRegion | null,
  ): () => void {
    let stopped = false;
    let animationFrame: number | null = null;
    let detectionTimer: ReturnType<typeof setTimeout> | null = null;
    let analyzing = false;
    let lastCaptureAt = 0;
    const detector = new CameraCaptureDetector();

    const detect = async () => {
      if (stopped || analyzing) return;

      analyzing = true;

      try {
        // Capture cooldown once to avoid race conditions if settings change during execution
        const captureCooldownMs = getStoredCaptureCooldownMs();
        const cooldownCheckTime = Date.now();
        if (lastCaptureAt > 0 && cooldownCheckTime - lastCaptureAt < captureCooldownMs) {
          window.dispatchEvent(new CustomEvent("person-detected", {
            detail: { cameraId, boxes: [], timestamp: new Date() },
          }));
          window.dispatchEvent(new CustomEvent("motion-debug", {
            detail: { cameraId, motionRatio: 0, active: false, started: false, paused: true },
          }));
          return;
        }

        const detectionRegion = getDetectionRegion?.() ?? null;
        const result = await detector.detect(videoElement, detectionRegion);
        if (stopped) return;

        window.dispatchEvent(new CustomEvent("person-detected", {
          detail: {
            cameraId,
            boxes: result.personBoundingBoxes,
            timestamp: new Date(),
          },
        }));

        if (result.mode === "motion") {
          window.dispatchEvent(new CustomEvent("motion-debug", {
            detail: {
              cameraId,
              motionRatio: result.motionRatio,
              active: result.active,
              started: result.started,
              paused: false,
            },
          }));
        }

        if (result.mode === "motion" && result.started) {
          const event = new CustomEvent("motion-detected", {
            detail: {
              cameraId,
              motionRatio: result.motionRatio,
              timestamp: new Date(),
            },
          });
          window.dispatchEvent(event);
        }

        const now = Date.now();
        const shouldCapture = result.active &&
          now - lastCaptureAt >= captureCooldownMs;
        if (shouldCapture && sendToAi) {
          lastCaptureAt = now;
          if (result.mode === "motion") detector.resetMotion();
          await this.captureAndSendToAi(
            videoElement,
            cameraId,
            undefined,
            undefined,
            onScreenshotSent,
            detectionRegion,
          );
        }
      } catch {
      } finally {
        analyzing = false;
        if (!stopped) {
          detectionTimer = setTimeout(() => {
            animationFrame = window.requestAnimationFrame(detect);
          }, getStoredPersonDetectionIntervalMs());
        }
      }
    };

    animationFrame = window.requestAnimationFrame(detect);

    return () => {
      stopped = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (detectionTimer) {
        clearTimeout(detectionTimer);
      }
    };
  }
}

export const cameraScreenshotService = new CameraScreenshotService();
