import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScreenPlayer from "@/components/ScreenPlayer";
import type { MediaAsset } from "@/lib/types/mediaAsset";

const videoAd: MediaAsset = {
  id: 17,
  clientId: 3,
  name: "Screen video",
  description: "",
  type: "Video",
  url: "https://example.com/screen-video.mp4",
  durationSeconds: 12,
  fileSizeMb: 4,
  resolution: "1920x1080",
  isFallback: false,
  createdAtUtc: "2026-09-21T00:00:00Z",
};

describe("ScreenPlayer", () => {
  let playSpy: ReturnType<typeof vi.spyOn>;
  let loadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    loadSpy = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reloads a video when its playback time stops advancing", async () => {
    render(<ScreenPlayer advertisement={videoAd} screenId={1} />);

    const video = screen.getByLabelText("Screen video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", { configurable: true, value: 12 });
    video.currentTime = 1;
    fireEvent.timeUpdate(video);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });

    expect(playSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("restarts a looping video without ending the screen media", async () => {
    const onEnded = vi.fn();
    render(
      <ScreenPlayer
        advertisement={{ ...videoAd, isFallback: true }}
        screenId={1}
        shouldLoop
        onEnded={onEnded}
      />,
    );

    const video = screen.getByLabelText("Screen video") as HTMLVideoElement;
    video.currentTime = 11;
    fireEvent.ended(video);

    await act(async () => Promise.resolve());

    expect(video.currentTime).toBe(0);
    expect(onEnded).not.toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalled();
  });

  it("restarts playback when the same media is selected again", async () => {
    const { rerender } = render(<ScreenPlayer advertisement={videoAd} screenId={1} />);

    const video = screen.getByLabelText("Screen video") as HTMLVideoElement;
    video.currentTime = 12;
    const playCallsBeforeReplay = playSpy.mock.calls.length;

    rerender(<ScreenPlayer advertisement={{ ...videoAd }} screenId={1} />);
    await act(async () => Promise.resolve());

    expect(video.currentTime).toBe(0);
    expect(playSpy.mock.calls.length).toBeGreaterThan(playCallsBeforeReplay);
  });

  it("treats a stalled final frame as the end of a non-looping video", async () => {
    const onEnded = vi.fn();
    const onPlaybackError = vi.fn();
    render(
      <ScreenPlayer
        advertisement={videoAd}
        screenId={1}
        onEnded={onEnded}
        onPlaybackError={onPlaybackError}
      />,
    );

    const video = screen.getByLabelText("Screen video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", { configurable: true, value: 12 });
    video.currentTime = 11.75;
    fireEvent.timeUpdate(video);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onPlaybackError).not.toHaveBeenCalled();
    expect(loadSpy).not.toHaveBeenCalled();
  });
});
