import { STORAGE_KEYS } from "@/lib/cameras/constants";
import { MotionDetector } from "./motionDetection";
import { PersonCountSmoother, type NormalizedDetectionRegion } from "./personDetection";

export type CaptureDetectionMode = "motion" | "person";

export function getStoredDetectionMode(): CaptureDetectionMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS);
    return stored && JSON.parse(stored)?.detectionMode === "person" ? "person" : "motion";
  } catch {
    return "motion";
  }
}

export class CameraCaptureDetector {
  private motion: MotionDetector | null = null;
  private people = new PersonCountSmoother();
  private personCount = 0;
  private contextKey = "";
  private reportedError = false;

  async detect(video: HTMLVideoElement, region: NormalizedDetectionRegion | null) {
    const mode = getStoredDetectionMode();
    const key = JSON.stringify([mode, region]);
    if (key !== this.contextKey || video.paused || video.ended || video.readyState < 2) {
      this.motion = null;
      this.people = new PersonCountSmoother();
      this.personCount = 0;
      this.contextKey = key;
    }
    const quiet = { mode, active: false, started: false, motionRatio: 0 };
    if (video.paused || video.ended || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return quiet;
    }

    if (mode === "motion") {
      this.motion ??= new MotionDetector();
      const result = this.motion.detect(video, region);
      return { mode, active: result.motionDetected, started: result.motionStarted, motionRatio: result.motionRatio };
    }

    try {
      const { mediapipeService } = await import("./mediapipeService");
      const result = await mediapipeService.detectFromVideo(video, region);
      // Ignore a result if the mode changed while the person model was loading.
      if (getStoredDetectionMode() !== mode) return quiet;
      const change = this.people.update(result.personsDetected);
      if (change) this.personCount = change.currentCount;
      this.reportedError = false;
      return {
        mode,
        active: this.personCount > 0 && result.personsDetected > 0,
        started: !!change && change.currentCount > 0,
        motionRatio: 0,
      };
    } catch (error) {
      if (!this.reportedError) console.error("Person detection unavailable", error);
      this.reportedError = true;
      return quiet;
    }
  }
}
