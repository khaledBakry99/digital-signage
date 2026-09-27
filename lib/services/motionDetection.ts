import {
  getPixelDetectionRegion,
  isPointInsideDetectionRegion,
  type NormalizedDetectionRegion,
} from "@/lib/services/personDetection";
import { STORAGE_KEYS } from "@/lib/cameras/constants";
import type { MotionDetectionSettings } from "@/lib/types/camera";

export interface MotionDetectionResult {
  motionDetected: boolean;
  motionStarted: boolean;
  motionRatio: number;
}

export const DEFAULT_MOTION_DETECTION_SETTINGS: MotionDetectionSettings = {
  motionRatioThreshold: 0.025,
  pixelDifferenceThreshold: 32,
  minimumBlockChangedRatio: 0.25,
};

const clampNumber = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

export function sanitizeMotionDetectionSettings(
  settings: Partial<MotionDetectionSettings> | null | undefined,
): MotionDetectionSettings {
  return {
    motionRatioThreshold: clampNumber(
      settings?.motionRatioThreshold,
      DEFAULT_MOTION_DETECTION_SETTINGS.motionRatioThreshold,
      0.005,
      0.2,
    ),
    pixelDifferenceThreshold: Math.round(clampNumber(
      settings?.pixelDifferenceThreshold,
      DEFAULT_MOTION_DETECTION_SETTINGS.pixelDifferenceThreshold,
      10,
      100,
    )),
    minimumBlockChangedRatio: clampNumber(
      settings?.minimumBlockChangedRatio,
      DEFAULT_MOTION_DETECTION_SETTINGS.minimumBlockChangedRatio,
      0.1,
      0.8,
    ),
  };
}

export function getStoredMotionDetectionSettings(): MotionDetectionSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_MOTION_DETECTION_SETTINGS };
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS);
    if (!value) return { ...DEFAULT_MOTION_DETECTION_SETTINGS };
    const stored = JSON.parse(value) as {
      motionDetection?: Partial<MotionDetectionSettings>;
    };
    return sanitizeMotionDetectionSettings(stored.motionDetection);
  } catch {
    return { ...DEFAULT_MOTION_DETECTION_SETTINGS };
  }
}

export function getCoherentMotionRatio(
  changedPixels: Uint8Array,
  includedPixels: Uint8Array,
  width: number,
  height: number,
  blockSize = 4,
  minimumChangedRatio = 0.25,
): number {
  let includedTotal = 0;
  let coherentChangedTotal = 0;

  for (let blockY = 0; blockY < height; blockY += blockSize) {
    for (let blockX = 0; blockX < width; blockX += blockSize) {
      let includedInBlock = 0;
      let changedInBlock = 0;

      for (let y = blockY; y < Math.min(blockY + blockSize, height); y += 1) {
        for (let x = blockX; x < Math.min(blockX + blockSize, width); x += 1) {
          const index = y * width + x;
          if (!includedPixels[index]) continue;
          includedInBlock += 1;
          if (changedPixels[index]) changedInBlock += 1;
        }
      }

      includedTotal += includedInBlock;
      const minimumChangedPixels = Math.max(
        3,
        Math.ceil(includedInBlock * minimumChangedRatio),
      );
      if (changedInBlock >= minimumChangedPixels) {
        coherentChangedTotal += changedInBlock;
      }
    }
  }

  return includedTotal === 0 ? 0 : coherentChangedTotal / includedTotal;
}

export class MotionStateTracker {
  private consecutiveMotionFrames = 0;
  private consecutiveQuietFrames = 0;
  private active = false;

  constructor(
    private readonly motionRatioThreshold = DEFAULT_MOTION_DETECTION_SETTINGS.motionRatioThreshold,
    private readonly motionFramesRequired = 1,
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
      motionDetected: this.active && hasMotion,
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
  private readonly pixelDifferenceThreshold: number;
  private readonly minimumBlockChangedRatio: number;

  constructor(
    tracker?: MotionStateTracker,
    settings = getStoredMotionDetectionSettings(),
  ) {
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Failed to create motion detection context");
    this.context = context;
    this.tracker = tracker ?? new MotionStateTracker(settings.motionRatioThreshold);
    this.pixelDifferenceThreshold = settings.pixelDifferenceThreshold;
    this.minimumBlockChangedRatio = settings.minimumBlockChangedRatio;
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
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const luminance = ((r * 77 + g * 150 + b * 29) >> 8);
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
    const changedPixels = new Uint8Array(currentFrame.length);
    for (let index = 0; index < currentFrame.length; index += 1) {
      if (!includedPixels[index]) continue;
      const difference = Math.abs(
        currentFrame[index] - this.previousFrame[index] - averageBrightnessShift,
      );
      if (difference >= this.pixelDifferenceThreshold) changedPixels[index] = 1;
    }

    this.previousFrame = currentFrame;
    return this.tracker.update(getCoherentMotionRatio(
      changedPixels,
      includedPixels,
      sampleWidth,
      sampleHeight,
      4,
      this.minimumBlockChangedRatio,
    ));
  }

  reset(): void {
    this.previousFrame = null;
    this.tracker.reset();
  }
}
