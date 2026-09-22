import { afterEach, describe, expect, it } from "vitest";
import { getScreenshotRegion } from "./screenshotRegion";
import type { NormalizedDetectionRegion } from "./personDetection";

const region: NormalizedDetectionRegion = {
  points: [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.8, y: 0.8 },
    { x: 0.2, y: 0.8 },
  ],
  originX: 0.2,
  originY: 0.2,
  width: 0.6,
  height: 0.6,
};

afterEach(() => window.localStorage.clear());

describe("getScreenshotRegion", () => {
  it("uses the selected box by default and for old settings", () => {
    expect(getScreenshotRegion(region)).toBe(region);
    window.localStorage.setItem("camera_settings", JSON.stringify({ motionDetection: {} }));
    expect(getScreenshotRegion(region)).toBe(region);
  });

  it("uses the entire frame when full-view capture is enabled", () => {
    window.localStorage.setItem("camera_settings", JSON.stringify({ captureFullFrame: true }));
    expect(getScreenshotRegion(region)).toBeNull();
  });

  it("keeps the box for disabled or invalid settings", () => {
    window.localStorage.setItem("camera_settings", JSON.stringify({ captureFullFrame: false }));
    expect(getScreenshotRegion(region)).toBe(region);
    window.localStorage.setItem("camera_settings", "invalid JSON");
    expect(getScreenshotRegion(region)).toBe(region);
  });

  it("uses the whole view when no box has been selected", () => {
    expect(getScreenshotRegion(null)).toBeNull();
  });
});
