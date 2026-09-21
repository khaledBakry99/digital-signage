import {
  getPixelDetectionRegion,
  isPointInsideDetectionRegion,
  type NormalizedDetectionRegion,
} from "@/lib/services/personDetection";

export interface MotionDetectionResult {
  motionDetected: boolean;
  motionStarted: boolean;
  motionRatio: number;
}

export class MotionStateTracker {
  private consecutiveMotionFrames = 0;
  private consecutiveQuietFrames = 0;
  private active = false;

  constructor(
    private readonly motionRatioThreshold = 0.008,
    private readonly motionFramesRequired = 2,
    private readonly quietFramesRequired = 4,
  ) {}

  update(motionRatio: number): MotionDetectionResult {
    const hasMotion = motionRatio >= this.motionRatioThreshold;
    let motionStarted = false;

    if (hasMotion) {
      this.consecutiveMotionFrames += 1;
      this.consecutiveQuietFrames = 0;
      if (!this.active && this.consecutiveMotionFrames >= this.motionFramesRequired) {
        this.active = true;
        motionStarted = true;
      }
    } else {
      this.consecutiveMotionFrames = 0;
      if (this.active) {
        this.consecutiveQuietFrames += 1;
        if (this.consecutiveQuietFrames >= this.quietFramesRequired) {
          this.active = false;
          this.consecutiveQuietFrames = 0;
        }
      }
    }

    return {
      motionDetected: this.active,
      motionStarted,
      motionRatio,
    };
  }

  reset(): void {
    this.consecutiveMotionFrames = 0;
    this.consecutiveQuietFrames = 0;
    this.active = false;
  }
}

export class MotionDetector {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly tracker: MotionStateTracker;
  private previousFrame: Uint8Array | null = null;
  private lastRegionKey = "";
  private readonly pixelDifferenceThreshold = 28;

  constructor(tracker = new MotionStateTracker()) {
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Failed to create motion detection context");
    this.context = context;
    this.tracker = tracker;
  }

  detect(
    videoElement: HTMLVideoElement,
    detectionRegion?: NormalizedDetectionRegion | null,
  ): MotionDetectionResult {
    if (
      videoElement.paused ||
      videoElement.ended ||
      videoElement.readyState < 2 ||
      videoElement.videoWidth <= 0 ||
      videoElement.videoHeight <= 0
    ) {
      this.reset();
      return { motionDetected: false, motionStarted: false, motionRatio: 0 };
    }

    const regionKey = detectionRegion ? JSON.stringify(detectionRegion) : "full-frame";
    if (regionKey !== this.lastRegionKey) {
      this.reset();
      this.lastRegionKey = regionKey;
    }

    const source = getPixelDetectionRegion(
      detectionRegion,
      videoElement.videoWidth,
      videoElement.videoHeight,
    ) ?? {
      originX: 0,
      originY: 0,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
    const scale = Math.min(160 / source.width, 120 / source.height, 1);
    const sampleWidth = Math.max(1, Math.round(source.width * scale));
    const sampleHeight = Math.max(1, Math.round(source.height * scale));

    if (this.canvas.width !== sampleWidth || this.canvas.height !== sampleHeight) {
      this.canvas.width = sampleWidth;
      this.canvas.height = sampleHeight;
      this.previousFrame = null;
    }

    this.context.drawImage(
      videoElement,
      source.originX,
      source.originY,
      source.width,
      source.height,
      0,
      0,
      sampleWidth,
      sampleHeight,
    );

    const pixels = this.context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const currentFrame = new Uint8Array(sampleWidth * sampleHeight);
    const includedPixels = new Uint8Array(sampleWidth * sampleHeight);
    let includedCount = 0;
    let brightnessShift = 0;

    for (let index = 0; index < currentFrame.length; index += 1) {
      const x = index % sampleWidth;
      const y = Math.floor(index / sampleWidth);
      const frameX = (
        source.originX + ((x + 0.5) / sampleWidth) * source.width
      ) / videoElement.videoWidth;
      const frameY = (
        source.originY + ((y + 0.5) / sampleHeight) * source.height
      ) / videoElement.videoHeight;
      if (!isPointInsideDetectionRegion(frameX, frameY, detectionRegion)) continue;

      const pixelIndex = index * 4;
      const luminance = Math.round(
        pixels[pixelIndex] * 0.299 +
        pixels[pixelIndex + 1] * 0.587 +
        pixels[pixelIndex + 2] * 0.114,
      );
      currentFrame[index] = luminance;
      includedPixels[index] = 1;
      includedCount += 1;
      if (this.previousFrame) {
        brightnessShift += luminance - this.previousFrame[index];
      }
    }

    if (!this.previousFrame || includedCount === 0) {
      this.previousFrame = currentFrame;
      return { motionDetected: false, motionStarted: false, motionRatio: 0 };
    }

    const averageBrightnessShift = brightnessShift / includedCount;
    let changedPixels = 0;
    for (let index = 0; index < currentFrame.length; index += 1) {
      if (!includedPixels[index]) continue;
      const difference = Math.abs(
        currentFrame[index] - this.previousFrame[index] - averageBrightnessShift,
      );
      if (difference >= this.pixelDifferenceThreshold) changedPixels += 1;
    }

    this.previousFrame = currentFrame;
    return this.tracker.update(changedPixels / includedCount);
  }

  reset(): void {
    this.previousFrame = null;
    this.tracker.reset();
  }
}
