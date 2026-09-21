import { describe, expect, it } from "vitest";
import { getPaddedPersonRegion, PersonCountSmoother } from "@/lib/services/personDetection";

describe("PersonCountSmoother", () => {
  it("accepts intermittent distant-person detections without flickering", () => {
    const smoother = new PersonCountSmoother();
    const changes = [1, 0, 1, 0, 1, 1]
      .map((count) => smoother.update(count))
      .filter(Boolean);

    expect(changes).toEqual([{ previousCount: 0, currentCount: 1 }]);
  });

  it("requires stronger evidence before declaring the scene empty", () => {
    const smoother = new PersonCountSmoother();
    [1, 1, 1, 1].forEach((count) => smoother.update(count));

    expect([0, 1, 0, 0].map((count) => smoother.update(count)).filter(Boolean)).toEqual([]);
    expect(smoother.update(0)).toBeNull();
    expect(smoother.update(0)).toEqual({ previousCount: 1, currentCount: 0 });
  });
});

describe("getPaddedPersonRegion", () => {
  it("combines and pads person boxes while staying inside the frame", () => {
    expect(getPaddedPersonRegion([
      { originX: 100, originY: 50, width: 80, height: 200 },
      { originX: 240, originY: 80, width: 70, height: 180 },
    ], 640, 480)).toEqual({
      originX: 58,
      originY: 8,
      width: 294,
      height: 294,
    });
  });
});
