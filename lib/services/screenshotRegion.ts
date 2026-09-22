import { STORAGE_KEYS } from "@/lib/cameras/constants";
import type { NormalizedDetectionRegion } from "@/lib/services/personDetection";

export const DEFAULT_CAPTURE_FULL_FRAME = false;
export const DEFAULT_CAPTURE_COOLDOWN_SECONDS = 4;
export const DEFAULT_SHOW_PERSON_DETECTION_DEBUG = false;
export const DEFAULT_SHOW_MOTION_DETECTION_DEBUG = false;

function getStoredCameraSettings(): Record<string, unknown> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS);
    return stored ? JSON.parse(stored) as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function getScreenshotRegion(
  detectionRegion: NormalizedDetectionRegion | null | undefined,
): NormalizedDetectionRegion | null {
  if (typeof window === "undefined") return detectionRegion ?? null;

  if (getStoredCameraSettings().captureFullFrame === true) return null;

  return detectionRegion ?? null;
}

export function getStoredCaptureCooldownMs(): number {
  if (typeof window === "undefined") return DEFAULT_CAPTURE_COOLDOWN_SECONDS * 1000;
  const value = getStoredCameraSettings().captureCooldownSeconds;
  const seconds = typeof value === "number" && Number.isFinite(value)
    ? Math.min(60, Math.max(1, value))
    : DEFAULT_CAPTURE_COOLDOWN_SECONDS;
  return seconds * 1000;
}

export function getStoredPersonDetectionDebug(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_PERSON_DETECTION_DEBUG;
  return getStoredCameraSettings().showPersonDetectionDebug === true;
}

export function getStoredMotionDetectionDebug(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_MOTION_DETECTION_DEBUG;
  return getStoredCameraSettings().showMotionDetectionDebug === true;
}
