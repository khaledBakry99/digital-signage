import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MOTION_DETECTION_SETTINGS,
  getCoherentMotionRatio,
  getStoredMotionDetectionSettings,
  MotionStateTracker,
  sanitizeMotionDetectionSettings,
} from "@/lib/services/motionDetection";

afterEach(() => {
  window.localStorage.clear();
});

describe("motion detection settings", () => {
  it("uses defaults when browser storage is empty", () => {
    expect(getStoredMotionDetectionSettings()).toEqual(
      DEFAULT_MOTION_DETECTION_SETTINGS,
    );
  });

  it("loads saved calibration from browser storage", () => {
    window.localStorage.setItem("camera_settings", JSON.stringify({
      motionDetection: {
        motionRatioThreshold: 0.06,
        pixelDifferenceThreshold: 45,
        minimumBlockChangedRatio: 0.4,
      },
    }));

    expect(getStoredMotionDetectionSettings()).toEqual({
      motionRatioThreshold: 0.06,
      pixelDifferenceThreshold: 45,
      minimumBlockChangedRatio: 0.4,
    });
  });

  it("replaces missing or unsafe values with calibrated limits", () => {
    expect(sanitizeMotionDetectionSettings({
      motionRatioThreshold: 1,
      pixelDifferenceThreshold: 2,
    })).toEqual({
      motionRatioThreshold: 0.2,
      pixelDifferenceThreshold: 10,
      minimumBlockChangedRatio: 0.25,
    });
  });
});

describe("MotionStateTracker", () => {
  it("starts a motion event on the first moving frame", () => {
    const tracker = new MotionStateTracker();

    expect(tracker.update(0.03)).toMatchObject({
      motionDetected: true,
      motionStarted: true,
    });
    expect(tracker.update(0.03)).toMatchObject({
      motionDetected: true,
      motionStarted: false,
    });
  });

  it("ignores small motion and waits for quiet frames before resetting", () => {
    const tracker = new MotionStateTracker();

    expect(tracker.update(0.02)).toMatchObject({
      motionDetected: false,
      motionStarted: false,
    });

    tracker.update(0.03);
    tracker.update(0.03);

    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: false });

    expect(tracker.update(0.03)).toMatchObject({ motionStarted: true });
    expect(tracker.update(0)).toMatchObject({ motionStarted: false });
  });
});

describe("getCoherentMotionRatio", () => {
  const includedPixels = new Uint8Array(64).fill(1);

  it("ignores changed pixels scattered across the frame", () => {
    const changedPixels = new Uint8Array(64);
    changedPixels[0] = 1;
    changedPixels[4] = 1;
    changedPixels[32] = 1;
    changedPixels[36] = 1;

    expect(getCoherentMotionRatio(
      changedPixels,
      includedPixels,
      8,
      8,
    )).toBe(0);
  });

  it("keeps locally grouped movement", () => {
    const changedPixels = new Uint8Array(64);
    changedPixels[0] = 1;
    changedPixels[1] = 1;
    changedPixels[8] = 1;
    changedPixels[9] = 1;

    expect(getCoherentMotionRatio(
      changedPixels,
      includedPixels,
      8,
      8,
    )).toBe(4 / 64);
  });
});
