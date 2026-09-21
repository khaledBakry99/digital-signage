import { genderAiApi } from "@/lib/api/genderAi.api";
import { mediapipeService } from "@/lib/services/mediapipeService";
import {
  getPaddedPersonRegion,
  PersonCountSmoother,
  type PersonBoundingBox,
} from "@/lib/services/personDetection";
import type { GenderAiResponse } from "@/lib/types/genderAi";

/**
 * Capture camera frames and send them to the AI endpoint.
 * Used on camera pages only (not advertisement screens).
 */
export class CameraScreenshotService {
  private readonly DETECTION_INTERVAL_MS = 150;
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
    personBoundingBoxes: PersonBoundingBox[] = [],
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

      const personRegion = getPaddedPersonRegion(
        personBoundingBoxes,
        videoElement.videoWidth,
        videoElement.videoHeight,
      );
      const frameArea = videoElement.videoWidth * videoElement.videoHeight;
      const shouldCrop = Boolean(
        personRegion && personRegion.width * personRegion.height < frameArea * 0.85,
      );
      const source = shouldCrop && personRegion
        ? personRegion
        : {
          originX: 0,
          originY: 0,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        };
      const upscale = shouldCrop
        ? Math.min(3, Math.max(1, 960 / Math.max(source.width, source.height)))
        : 1;

      // Crop and enlarge distant people before sending the frame to the server AI.
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(source.width * upscale);
      canvas.height = Math.round(source.height * upscale);

      // Draw the current frame onto the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create Canvas context");
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

  startObjectDetectionCapture(
    videoElement: HTMLVideoElement,
    cameraId: number,
    sendToAi: boolean = true,
    onScreenshotSent?: () => void,
  ): () => void {
    let stopped = false;
    let animationFrame: number | null = null;
    let detectionTimer: ReturnType<typeof setTimeout> | null = null;
    let analyzing = false;
    const personCountSmoother = new PersonCountSmoother();

    const detect = async () => {
      if (stopped || analyzing) return;

      analyzing = true;

      try {
        const result = await mediapipeService.detectFromVideo(videoElement);
        const currentPersonCount = result.personsDetected;
        const countChange = personCountSmoother.update(currentPersonCount);

        if (countChange) {
          const { previousCount, currentCount } = countChange;

          const changeTime = new Date();
          console.log('👥 [PERSON COUNT CHANGED]', {
            cameraId,
            previousCount,
            currentCount,
            time: changeTime.toISOString(),
            timeLocal: changeTime.toLocaleTimeString('ar-SA')
          });

          const event = new CustomEvent("person-count-changed", {
            detail: {
              cameraId,
              previousCount,
              currentCount,
              timestamp: new Date(),
            },
          });
          window.dispatchEvent(event);

          if (typeof BroadcastChannel !== "undefined") {
            const channel = new BroadcastChannel(`person-count-changed-camera-${cameraId}`);
            channel.postMessage({
              type: "person-count-changed",
              cameraId,
              previousCount,
              currentCount,
              timestamp: new Date().toISOString(),
            });
            channel.close();
          }

          if (currentCount > 0 && sendToAi) {
            const captureTime = new Date();
            console.log('📸 [SCREENSHOT CAPTURE START]', {
              cameraId,
              time: captureTime.toISOString(),
              timeLocal: captureTime.toLocaleTimeString('ar-SA')
            });
            await this.captureAndSendToAi(
              videoElement,
              cameraId,
              undefined,
              undefined,
              onScreenshotSent,
              result.personBoundingBoxes,
            );
          } else if (currentCount > 0) {
          } else {
          }
        }
      } catch {
      } finally {
        analyzing = false;
        if (!stopped) {
          detectionTimer = setTimeout(() => {
            animationFrame = window.requestAnimationFrame(detect);
          }, this.DETECTION_INTERVAL_MS);
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
