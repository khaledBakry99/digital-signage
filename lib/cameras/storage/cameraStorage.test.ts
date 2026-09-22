import { afterEach, describe, expect, it } from "vitest";
import { cameraStorage } from "./cameraStorage";
import { DEFAULT_MOTION_DETECTION_SETTINGS } from "@/lib/services/motionDetection";

afterEach(() => {
  window.localStorage.clear();
});

describe("cameraStorage motion calibration", () => {
  it("adds default calibration to older saved camera settings", async () => {
    window.localStorage.setItem("camera_settings", JSON.stringify({
      autoReconnect: false,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      streamQuality: "high",
      lastUpdate: "2026-01-01T00:00:00.000Z",
    }));

    const settings = await cameraStorage.getSettings();

    expect(settings.motionDetection).toEqual(DEFAULT_MOTION_DETECTION_SETTINGS);
    expect(settings.autoReconnect).toBe(false);
    expect(settings.captureFullFrame).toBe(false);
  });

  it("saves motion calibration in browser storage", async () => {
    await cameraStorage.saveSettings({
      autoReconnect: true,
      reconnectAttempts: 3,
      reconnectDelay: 5000,
      streamQuality: "medium",
      motionDetection: {
        motionRatioThreshold: 0.05,
        pixelDifferenceThreshold: 40,
        minimumBlockChangedRatio: 0.35,
      },
      captureFullFrame: true,
      lastUpdate: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stored = JSON.parse(
      window.localStorage.getItem("camera_settings") ?? "{}",
    );
    expect(stored.motionDetection).toEqual({
      motionRatioThreshold: 0.05,
      pixelDifferenceThreshold: 40,
      minimumBlockChangedRatio: 0.35,
    });
    expect(stored.captureFullFrame).toBe(true);
  });
});
