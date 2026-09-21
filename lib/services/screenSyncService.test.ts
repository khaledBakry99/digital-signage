import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScreenPlaybackState } from "@/lib/services/screenSyncService";

const postedMessages: ScreenPlaybackState[] = [];

class BroadcastChannelMock {
  onmessage: ((event: MessageEvent<ScreenPlaybackState>) => void) | null = null;

  constructor(public name: string) {}

  postMessage(message: ScreenPlaybackState) {
    postedMessages.push(message);
  }

  close() {}
}

const createState = (overrides: Partial<ScreenPlaybackState> = {}): ScreenPlaybackState => ({
  screenId: 1,
  mediaAssetId: 10,
  mediaUrl: "/media/video.mp4",
  mediaName: "Video",
  mediaType: "video",
  currentTime: 0,
  duration: 12,
  isPlaying: true,
  timestamp: Date.now(),
  ...overrides,
});

describe("screenSyncService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T10:00:00Z"));
    postedMessages.length = 0;
    vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("debounces duplicate same-media broadcasts", async () => {
    const { screenSyncService } = await import("@/lib/services/screenSyncService");

    screenSyncService.broadcastState(createState({ currentTime: 3 }));
    vi.advanceTimersByTime(500);
    screenSyncService.broadcastState(createState({ currentTime: 3.2 }));

    expect(postedMessages).toHaveLength(1);
  });

  it("broadcasts same-media restarts immediately so ended videos can loop or reset", async () => {
    const { screenSyncService } = await import("@/lib/services/screenSyncService");

    screenSyncService.broadcastState(createState({ currentTime: 11.8 }));
    vi.advanceTimersByTime(500);
    screenSyncService.broadcastState(createState({ currentTime: 0 }));

    expect(postedMessages).toHaveLength(2);
    expect(postedMessages[1].currentTime).toBe(0);
  });
});
