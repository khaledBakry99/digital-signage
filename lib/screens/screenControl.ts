import { screenApi } from "@/lib/api/screen.api";

const SCREEN_CONTROL_CHANNEL = "screen-tabs";

export type ScreenControlCommand =
  | {
    type: "refresh-default-media";
    screenIds: number[];
    requestedAt: number;
  }
  | {
    type: "close-screen";
    screenId: number;
    requestedAt: number;
  };

function publishScreenCommand(command: ScreenControlCommand): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(SCREEN_CONTROL_CHANNEL);
  channel.postMessage(command);
  channel.close();
}

export async function refreshScreenDefaultMedia(screenId: number): Promise<void> {
  await screenApi.getCurrentMedia(screenId);
  publishScreenCommand({
    type: "refresh-default-media",
    screenIds: [screenId],
    requestedAt: Date.now(),
  });
}

export async function refreshAllScreensDefaultMedia(screenIds: number[]): Promise<void> {
  const uniqueScreenIds = [...new Set(screenIds)].filter((id) => Number.isFinite(id) && id > 0);
  await Promise.all(uniqueScreenIds.map((screenId) => screenApi.getCurrentMedia(screenId)));
  publishScreenCommand({
    type: "refresh-default-media",
    screenIds: uniqueScreenIds,
    requestedAt: Date.now(),
  });
}

export async function closeScreen(screenId: number): Promise<void> {
  await screenApi.deactivate(screenId);
  publishScreenCommand({
    type: "close-screen",
    screenId,
    requestedAt: Date.now(),
  });
}
