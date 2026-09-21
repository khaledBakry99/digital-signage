import { beforeEach, describe, expect, it, vi } from "vitest";
import { screenApi } from "@/lib/api/screen.api";
import {
  closeScreen,
  refreshAllScreensDefaultMedia,
  refreshScreenDefaultMedia,
} from "@/lib/screens/screenControl";

vi.mock("@/lib/api/screen.api", () => ({
  screenApi: {
    getCurrentMedia: vi.fn(),
    deactivate: vi.fn(),
  },
}));

const postMessage = vi.fn();
const close = vi.fn();

class BroadcastChannelMock {
  postMessage = postMessage;
  close = close;
}

describe("screen controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);
    vi.mocked(screenApi.getCurrentMedia).mockResolvedValue({ screenId: 1 });
    vi.mocked(screenApi.deactivate).mockResolvedValue({ id: 1 } as never);
  });

  it("refreshes one screen on the backend before notifying its window", async () => {
    await refreshScreenDefaultMedia(7);

    expect(screenApi.getCurrentMedia).toHaveBeenCalledWith(7);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "refresh-default-media",
      screenIds: [7],
    }));
  });

  it("refreshes all unique screens before publishing one synchronized command", async () => {
    await refreshAllScreensDefaultMedia([2, 1, 2]);

    expect(screenApi.getCurrentMedia).toHaveBeenCalledTimes(2);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "refresh-default-media",
      screenIds: [2, 1],
    }));
  });

  it("deactivates a screen before sending its close command", async () => {
    await closeScreen(9);

    expect(screenApi.deactivate).toHaveBeenCalledWith(9);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "close-screen",
      screenId: 9,
    }));
  });
});
