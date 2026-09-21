import { describe, expect, it } from "vitest";
import { MotionStateTracker } from "@/lib/services/motionDetection";

describe("MotionStateTracker", () => {
  it("requires two moving frames before starting a motion event", () => {
    const tracker = new MotionStateTracker();

    expect(tracker.update(0.02)).toMatchObject({
      motionDetected: false,
      motionStarted: false,
    });
    expect(tracker.update(0.02)).toMatchObject({
      motionDetected: true,
      motionStarted: true,
    });
    expect(tracker.update(0.02)).toMatchObject({
      motionDetected: true,
      motionStarted: false,
    });
  });

  it("ignores isolated noise and waits for quiet frames before resetting", () => {
    const tracker = new MotionStateTracker();
    tracker.update(0.02);
    tracker.update(0.02);

    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: true });
    expect(tracker.update(0)).toMatchObject({ motionDetected: false });

    expect(tracker.update(0.02)).toMatchObject({ motionStarted: false });
    expect(tracker.update(0)).toMatchObject({ motionStarted: false });
  });
});
