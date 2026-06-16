import { genderAiApi } from "@/lib/api/genderAi.api";

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
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      // Ensure the video is ready and playing
      if (!videoElement || videoElement.paused || videoElement.ended) {
        console.warn(`⏸️ الكاميرا ${cameraId}: الفيديو متوقف، تخطي اللقطة`);
        return; // تخطي بدون رمي خطأ
      }

      // Ensure the video has buffered data
      if (videoElement.readyState < 2) {
        console.warn(`⏳ الكاميرا ${cameraId}: الفيديو غير جاهز بعد (readyState: ${videoElement.readyState})`);
        return; // تخطي بدون رمي خطأ
      }

      // Ensure the video has valid dimensions
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        console.warn(`📐 الكاميرا ${cameraId}: أبعاد الفيديو غير صالحة (${videoElement.videoWidth}x${videoElement.videoHeight})`);
        return; // تخطي بدون رمي خطأ
      }

      // Prepare an offscreen canvas sized to the video frame
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw the current frame onto the canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("فشل إنشاء Canvas context");
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a JPEG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error("فشل تحويل اللقطة إلى صورة"));
            }
          },
          "image/jpeg",
          0.85, // High quality for detection accuracy
        );
      });

      // Wrap the blob in a File for upload
      const file = new File([blob], `camera-${cameraId}-screenshot.jpg`, {
        type: "image/jpeg",
      });

      // Send the image to the AI service
      console.log(`جاري إرسال لقطة الكاميرا ${cameraId} للـ AI...`);
      const result = await genderAiApi.detectGender(cameraId, file);

      // Invoke success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      console.log(`تم إرسال لقطة الكاميرا ${cameraId} للـ AI بنجاح:`, result);
    } catch (error: any) {
      // Detect the specific 400 error when AI is disabled on the linked screen
      const errorMessage = error?.message || JSON.stringify(error);
      if (errorMessage.includes("AI enabled") || errorMessage.includes("aiEnabled")) {
        console.warn(`⚠️ الكاميرا ${cameraId}: الشاشة المربوطة لا تدعم AI، تخطي الإرسال`);
        return; // تخطي بدون رمي خطأ
      }

      // Log detailed diagnostics for other errors
      console.error(`فشل إرسال لقطة الكاميرا ${cameraId}:`, {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: JSON.stringify(error, null, 2),
      });

      const err = error instanceof Error ? error : new Error(String(error));

      // Invoke error callback if provided
      if (onError) {
        onError(err);
      }

      throw err;
    }
  }

  /**
   * Start periodic frame capture from the camera.
   * @param videoElement - source video element
   * @param cameraId - camera identifier
   * @param intervalSeconds - interval between captures in seconds
   * @returns cleanup function to stop captures
   */
  startPeriodicCapture(
    videoElement: HTMLVideoElement,
    cameraId: number,
    intervalSeconds: number = 30,
  ): () => void {
    // Kick off the first capture after a short delay
    const initialTimeout = setTimeout(() => {
      this.captureAndSendToAi(videoElement, cameraId).catch((error) => {
        console.error("خطأ في اللقطة الأولية:", error);
      });
    }, 3000);

    // Schedule recurring captures
    const interval = setInterval(() => {
      // Swallow periodic capture errors to keep the loop alive
      this.captureAndSendToAi(videoElement, cameraId).catch((error) => {
        console.error("خطأ في لقطة دورية:", error);
      });
    }, intervalSeconds * 1000);

    // Cleanup: stop timers
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      console.log(`تم إيقاف التقاط لقطات الكاميرا ${cameraId}`);
    };
  }
}

export const cameraScreenshotService = new CameraScreenshotService();
