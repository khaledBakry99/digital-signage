import { afterEach, describe, expect, it } from "vitest";
import { cameraStorage } from "./cameraStorage";
import { DEFAULT_MOTION_DETECTION_SETTINGS } from "@/lib/services/motionDetection";
import { DEFAULT_PERSON_DETECTION_SETTINGS } from "@/lib/services/personDetection";

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
    expect(settings.personDetection).toEqual(DEFAULT_PERSON_DETECTION_SETTINGS);
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
      detectionMode: "person",
      captureCooldownSeconds: 12,
      showPersonDetectionDebug: true,
      showMotionDetectionDebug: false,
      personDetection: {
        minimumConfidence: 0.7,
        minimumBoxAreaRatio: 0.01,
        maximumBoxAreaRatio: 0.9,
        positiveVotesRequired: 3,
        zeroVotesRequired: 6,
        detectionIntervalMs: 250,
      },
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
    expect(stored.detectionMode).toBe("person");
    expect(stored.captureCooldownSeconds).toBe(12);
    expect(stored.showPersonDetectionDebug).toBe(true);
    expect(stored.showMotionDetectionDebug).toBe(false);
    expect(stored.personDetection).toEqual({
      minimumConfidence: 0.7,
      minimumBoxAreaRatio: 0.01,
      maximumBoxAreaRatio: 0.9,
      positiveVotesRequired: 3,
      zeroVotesRequired: 6,
      detectionIntervalMs: 250,
    });
  });
});
