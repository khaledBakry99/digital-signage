import { genderAiApi } from "@/lib/api/genderAi.api";
import { mediapipeService } from "@/lib/services/mediapipeService";
import type { GenderAiResponse } from "@/lib/types/genderAi";

/**
 * Capture camera frames and send them to the AI endpoint.
 * Used on camera pages only (not advertisement screens).
 */
export class CameraScreenshotService {
  private readonly REQUIRED_STABLE_FRAMES = 3;
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

      // Prepare an offscreen canvas sized to the video frame
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw the current frame onto the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create Canvas context");
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

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
  ): () => void {
    let stopped = false;
    let animationFrame: number | null = null;
    let lastStablePersonCount = 0;
    let candidatePersonCount = 0;
    let candidateStableFrames = 0;
    let analyzing = false;

    const detect = async () => {
      if (stopped || analyzing) return;

      analyzing = true;

      try {
        const result = await mediapipeService.detectFromVideo(videoElement);
        const currentPersonCount = result.personsDetected;

        if (currentPersonCount === candidatePersonCount) {
          candidateStableFrames += 1;
        } else {
          candidatePersonCount = currentPersonCount;
          candidateStableFrames = 1;
        }

        if (
          candidateStableFrames >= this.REQUIRED_STABLE_FRAMES &&
          currentPersonCount !== lastStablePersonCount
        ) {
          const previousCount = lastStablePersonCount;
          lastStablePersonCount = currentPersonCount;

          const changeTime = new Date();
          console.log('👥 [PERSON COUNT CHANGED]', {
            cameraId,
            previousCount,
            currentCount: currentPersonCount,
            stableFrames: candidateStableFrames,
            time: changeTime.toISOString(),
            timeLocal: changeTime.toLocaleTimeString('ar-SA')
          });

          const event = new CustomEvent("person-count-changed", {
            detail: {
              cameraId,
              previousCount,
              currentCount: currentPersonCount,
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
              currentCount: currentPersonCount,
              timestamp: new Date().toISOString(),
            });
            channel.close();
          }

          if (currentPersonCount > 0 && sendToAi) {
            const captureTime = new Date();
            console.log('📸 [SCREENSHOT CAPTURE START]', {
              cameraId,
              time: captureTime.toISOString(),
              timeLocal: captureTime.toLocaleTimeString('ar-SA')
            });
            await this.captureAndSendToAi(videoElement, cameraId);
          } else if (currentPersonCount > 0) {
          } else {
          }
        }
      } catch {
      } finally {
        analyzing = false;
        if (!stopped) {
          animationFrame = window.requestAnimationFrame(detect);
        }
      }
    };

    animationFrame = window.requestAnimationFrame(detect);

    return () => {
      stopped = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }
}

export const cameraScreenshotService = new CameraScreenshotService();
