import { describe, expect, it } from "vitest";
import {
  getPaddedPersonRegion,
  getPixelDetectionRegion,
  isPointInsideDetectionRegion,
  PersonCountSmoother,
  sanitizeDetectionRegion,
} from "@/lib/services/personDetection";

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

  it("keeps screenshot padding inside the selected detection region", () => {
    expect(getPaddedPersonRegion(
      [{ originX: 300, originY: 150, width: 80, height: 160 }],
      640,
      480,
      0.2,
      { originX: 280, originY: 120, width: 180, height: 240 },
    )).toEqual({
      originX: 280,
      originY: 120,
      width: 124,
      height: 222,
    });
  });
});

describe("detection regions", () => {
  it("converts a normalized selection to exact frame coordinates", () => {
    expect(getPixelDetectionRegion({
      originX: 0.25,
      originY: 0.1,
      width: 0.5,
      height: 0.75,
    }, 1920, 1080)).toEqual({
      originX: 480,
      originY: 108,
      width: 960,
      height: 810,
    });
  });

  it("rejects tiny or malformed selections", () => {
    expect(sanitizeDetectionRegion({ originX: 0, originY: 0, width: 0.005, height: 1 })).toBeNull();
    expect(sanitizeDetectionRegion({ originX: "0", originY: 0, width: 1, height: 1 })).toBeNull();
  });

  it("orders four clicked corners and excludes points outside the polygon", () => {
    const region = sanitizeDetectionRegion({
      points: [
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.2 },
        { x: 0.7, y: 0.2 },
        { x: 0.3, y: 0.8 },
      ],
    });

    expect(region).not.toBeNull();
    expect(region?.originX).toBeCloseTo(0.2);
    expect(region?.originY).toBeCloseTo(0.2);
    expect(region?.width).toBeCloseTo(0.6);
    expect(region?.height).toBeCloseTo(0.6);
    expect(isPointInsideDetectionRegion(0.5, 0.5, region)).toBe(true);
    expect(isPointInsideDetectionRegion(0.21, 0.75, region)).toBe(false);
  });
});
