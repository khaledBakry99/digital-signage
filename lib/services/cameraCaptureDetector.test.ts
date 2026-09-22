import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CameraCaptureDetector } from "./cameraCaptureDetector";

const mocks = vi.hoisted(() => ({ motion: vi.fn(), person: vi.fn() }));
vi.mock("./motionDetection", () => ({
  MotionDetector: class {
    detect = mocks.motion;
  },
}));
vi.mock("./mediapipeService", () => ({
  mediapipeService: { detectFromVideo: mocks.person },
}));

const region = { originX: 0.2, originY: 0.2, width: 0.5, height: 0.5 };
const video = { paused: false, ended: false, readyState: 4, videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
const setMode = (mode: string) => window.localStorage.setItem("camera_settings", JSON.stringify({ detectionMode: mode }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.motion.mockReturnValue({ motionDetected: true, motionStarted: true, motionRatio: 0.1 });
  mocks.person.mockResolvedValue({ personsDetected: 1 });
});
afterEach(() => window.localStorage.clear());

describe("CameraCaptureDetector", () => {
  it("defaults to motion and does not invoke person detection", async () => {
    const result = await new CameraCaptureDetector().detect(video, region);
    expect(result).toMatchObject({ mode: "motion", active: true, started: true });
    expect(mocks.motion).toHaveBeenCalledWith(video, region);
    expect(mocks.person).not.toHaveBeenCalled();
  });

  it("confirms people within the region without requiring movement", async () => {
    setMode("person");
    const detector = new CameraCaptureDetector();
    expect(await detector.detect(video, region)).toMatchObject({ active: false });
    expect(await detector.detect(video, region)).toMatchObject({ mode: "person", active: true, started: true });
    expect(await detector.detect(video, region)).toMatchObject({ active: true, started: false });
    expect(mocks.person).toHaveBeenCalledWith(video, region);
    expect(mocks.motion).not.toHaveBeenCalled();
    mocks.person.mockResolvedValue({ personsDetected: 0 });
    expect(await detector.detect(video, region)).toMatchObject({ active: false });
  });

  it("switches modes live and resets person confirmation", async () => {
    const detector = new CameraCaptureDetector();
    await detector.detect(video, region);
    setMode("person");
    expect(await detector.detect(video, region)).toMatchObject({ mode: "person", active: false });
    expect(await detector.detect(video, region)).toMatchObject({ active: true });
    expect(await detector.detect(video, { ...region, width: 0.3 })).toMatchObject({ active: false });
    setMode("motion");
    expect(await detector.detect(video, region)).toMatchObject({ mode: "motion", active: true });
  });

  it("ignores person results if the mode changed during model loading", async () => {
    setMode("person");
    mocks.person.mockImplementation(async () => {
      setMode("motion");
      return { personsDetected: 1 };
    });
    expect(await new CameraCaptureDetector().detect(video, region)).toMatchObject({ active: false });
  });
});
