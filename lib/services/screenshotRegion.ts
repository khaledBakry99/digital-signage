import { STORAGE_KEYS } from "@/lib/cameras/constants";
import type { NormalizedDetectionRegion } from "@/lib/services/personDetection";

export const DEFAULT_CAPTURE_FULL_FRAME = false;

export function getScreenshotRegion(
  detectionRegion: NormalizedDetectionRegion | null | undefined,
): NormalizedDetectionRegion | null {
  if (typeof window === "undefined") return detectionRegion ?? null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS);
    if (stored && JSON.parse(stored)?.captureFullFrame === true) return null;
  } catch {
    // Keep the selected region when browser storage is unavailable.
  }

  return detectionRegion ?? null;
}
