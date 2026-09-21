/**
 * Mediapipe utility for capturing and analyzing camera frames.
 * Uses Mediapipe Object Detection to detect persons in front of the screen.
 */

import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import type { PersonBoundingBox } from "@/lib/services/personDetection";

export interface MediapipeDetectionResult {
  personsDetected: number;
  timestamp: number;
  confidence: number;
  personBoundingBoxes: PersonBoundingBox[];
}

class MediapipeService {
  private objectDetector: ObjectDetector | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly MIN_PERSON_CONFIDENCE = 0.5;
  private readonly MIN_BOX_AREA_RATIO = 0.002;
  private readonly MAX_BOX_AREA_RATIO = 0.95;

  /** Initialize the Mediapipe Object Detector. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const modelUrls = [
          "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite",
          "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite",
        ];
        let initializationError: unknown;

        for (const modelAssetPath of modelUrls) {
          try {
            this.objectDetector = await ObjectDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath,
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              maxResults: 20,
              scoreThreshold: this.MIN_PERSON_CONFIDENCE,
              categoryAllowlist: ["person"],
            });
            break;
          } catch (error) {
            initializationError = error;
          }
        }

        if (!this.objectDetector) {
          throw initializationError ?? new Error("Object detector initialization failed");
        }

        this.initialized = true;
      } catch (error) {
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /** Analyze a frame from a video element using Mediapipe. */
  async detectFromVideo(
    videoElement: HTMLVideoElement
  ): Promise<MediapipeDetectionResult> {
    if (!this.initialized || !this.objectDetector) {
      await this.initialize();
    }

    if (!this.objectDetector) {
      throw new Error("Object detector not initialized");
    }

    try {
      // Ensure the video is ready and playing
      if (!videoElement || videoElement.paused || videoElement.ended) {
        return { personsDetected: 0, timestamp: Date.now(), confidence: 0, personBoundingBoxes: [] };
      }

      if (videoElement.readyState < 2) {
        ;
        return { personsDetected: 0, timestamp: Date.now(), confidence: 0, personBoundingBoxes: [] };
      }

      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return { personsDetected: 0, timestamp: Date.now(), confidence: 0, personBoundingBoxes: [] };
      }

      // Analyze the current frame
      const timestamp = performance.now();
      const detections = this.objectDetector.detectForVideo(videoElement, timestamp);
      const videoArea = videoElement.videoWidth * videoElement.videoHeight;
      const personDetections = detections.detections.filter((d) => {
        const category = d.categories[0];
        const box = d.boundingBox;
        if (!category || !box) return false;
        const areaRatio = (box.width * box.height) / videoArea;
        return (
          category.categoryName === "person" &&
          (category.score || 0) >= this.MIN_PERSON_CONFIDENCE &&
          areaRatio >= this.MIN_BOX_AREA_RATIO &&
          areaRatio <= this.MAX_BOX_AREA_RATIO
        );
      });

      const personsDetected = personDetections.length;
      const confidence =
        personsDetected > 0
          ? personDetections.reduce(
            (sum, d) => sum + (d.categories[0]?.score || 0),
            0
          ) / personsDetected
          : 0;

      return {
        personsDetected,
        timestamp: Date.now(),
        confidence,
        personBoundingBoxes: personDetections.map((detection) => ({
          originX: detection.boundingBox!.originX,
          originY: detection.boundingBox!.originY,
          width: detection.boundingBox!.width,
          height: detection.boundingBox!.height,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  /** Analyze a frame from a canvas element. */
  async detectFromCanvas(
    canvas: HTMLCanvasElement
  ): Promise<MediapipeDetectionResult> {
    if (!this.initialized || !this.objectDetector) {
      await this.initialize();
    }

    if (!this.objectDetector) {
      throw new Error("Object detector not initialized");
    }

    try {
      const detections = this.objectDetector.detect(canvas);
      const canvasArea = canvas.width * canvas.height;
      const personDetections = detections.detections.filter((d) => {
        const category = d.categories[0];
        const box = d.boundingBox;
        if (!category || !box) return false;
        const areaRatio = (box.width * box.height) / canvasArea;
        return (
          category.categoryName === "person" &&
          (category.score || 0) >= this.MIN_PERSON_CONFIDENCE &&
          areaRatio >= this.MIN_BOX_AREA_RATIO &&
          areaRatio <= this.MAX_BOX_AREA_RATIO
        );
      });

      const personsDetected = personDetections.length;
      const confidence =
        personsDetected > 0
          ? personDetections.reduce(
            (sum, d) => sum + (d.categories[0]?.score || 0),
            0
          ) / personsDetected
          : 0;

      return {
        personsDetected,
        timestamp: Date.now(),
        confidence,
        personBoundingBoxes: personDetections.map((detection) => ({
          originX: detection.boundingBox!.originX,
          originY: detection.boundingBox!.originY,
          width: detection.boundingBox!.width,
          height: detection.boundingBox!.height,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  /** Capture from video, run Mediapipe, then send the frame to the API. */
  async captureAndAnalyze(
    videoElement: HTMLVideoElement,
    cameraId: number,
    sendToApi: (file: File) => Promise<unknown>
  ): Promise<{ mediapipe: MediapipeDetectionResult; apiResponse?: unknown }> {
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
    } catch {
    }

    return {
      mediapipe: mediapipeResult,
      apiResponse,
    };
  }

  /** Release Mediapipe resources. */
  dispose(): void {
    if (this.objectDetector) {
      this.objectDetector.close();
      this.objectDetector = null;
    }
    this.initialized = false;
    this.initializationPromise = null;
  }
}

export const mediapipeService = new MediapipeService();
