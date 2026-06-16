/**
 * Mediapipe utility for capturing and analyzing camera frames.
 * Uses Mediapipe Face Detection to detect presence in front of the screen.
 */

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export interface MediapipeDetectionResult {
  facesDetected: number;
  timestamp: number;
  confidence: number;
}

class MediapipeService {
  private faceDetector: FaceDetector | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /** Initialize the Mediapipe Face Detector. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        this.faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });

        this.initialized = true;
        console.log("✅ Mediapipe Face Detector initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Mediapipe:", error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /** Analyze a frame from a video element using Mediapipe. */
  async detectFromVideo(
    videoElement: HTMLVideoElement
  ): Promise<MediapipeDetectionResult> {
    if (!this.initialized || !this.faceDetector) {
      await this.initialize();
    }

    if (!this.faceDetector) {
      throw new Error("Face detector not initialized");
    }

    try {
      // Ensure the video is ready and playing
      if (!videoElement || videoElement.paused || videoElement.ended) {
        console.warn("⏸️ Mediapipe: الفيديو متوقف، تخطي التحليل");
        return { facesDetected: 0, timestamp: Date.now(), confidence: 0 };
      }

      if (videoElement.readyState < 2) {
        console.warn(`⏳ Mediapipe: video not ready yet (readyState: ${videoElement.readyState})`);
        return { facesDetected: 0, timestamp: Date.now(), confidence: 0 };
      }

      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        console.warn(`📐 Mediapipe: invalid video dimensions (${videoElement.videoWidth}x${videoElement.videoHeight})`);
        return { facesDetected: 0, timestamp: Date.now(), confidence: 0 };
      }

      // Analyze the current frame
      const timestamp = performance.now();
      const detections = this.faceDetector.detectForVideo(videoElement, timestamp);

      const facesDetected = detections.detections.length;
      const confidence =
        facesDetected > 0
          ? detections.detections.reduce(
              (sum, d) => sum + (d.categories[0]?.score || 0),
              0
            ) / facesDetected
          : 0;

      return {
        facesDetected,
        timestamp: Date.now(),
        confidence,
      };
    } catch (error) {
      console.error("❌ Mediapipe detection error:", error);
      throw error;
    }
  }

  /** Analyze a frame from a canvas element. */
  async detectFromCanvas(
    canvas: HTMLCanvasElement
  ): Promise<MediapipeDetectionResult> {
    if (!this.initialized || !this.faceDetector) {
      await this.initialize();
    }

    if (!this.faceDetector) {
      throw new Error("Face detector not initialized");
    }

    try {
      const timestamp = performance.now();
      const detections = this.faceDetector.detect(canvas);

      const facesDetected = detections.detections.length;
      const confidence =
        facesDetected > 0
          ? detections.detections.reduce(
              (sum, d) => sum + (d.categories[0]?.score || 0),
              0
            ) / facesDetected
          : 0;

      return {
        facesDetected,
        timestamp: Date.now(),
        confidence,
      };
    } catch (error) {
      console.error("❌ Mediapipe detection error:", error);
      throw error;
    }
  }

  /** Capture from video, run Mediapipe, then send the frame to the API. */
  async captureAndAnalyze(
    videoElement: HTMLVideoElement,
    cameraId: number,
    sendToApi: (file: File) => Promise<any>
  ): Promise<{ mediapipe: MediapipeDetectionResult; apiResponse?: any }> {
    // 1) Local analysis via Mediapipe
    const mediapipeResult = await this.detectFromVideo(videoElement);

    // 2) Capture the frame and forward to the API
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to convert canvas to blob"));
        },
        "image/jpeg",
        0.85
      );
    });

    const file = new File([blob], `camera-${cameraId}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    let apiResponse;
    try {
      apiResponse = await sendToApi(file);
    } catch (error) {
      console.warn("⚠️ API call failed, using Mediapipe result only:", error);
    }

    return {
      mediapipe: mediapipeResult,
      apiResponse,
    };
  }

  /** Release Mediapipe resources. */
  dispose(): void {
    if (this.faceDetector) {
      this.faceDetector.close();
      this.faceDetector = null;
    }
    this.initialized = false;
    this.initializationPromise = null;
  }
}

export const mediapipeService = new MediapipeService();
