export interface LiveScreenMediaEntry {
  screenId: number;
  mediaAssetId: number | null;
  name?: string | null;
  url?: string | null;
  type?: "image" | "video" | null;
  updatedAt: string;
  state?: "DETECTING" | "PLAYING";
  cameraId?: number | null;
  ownerId: string;
  currentTime?: number; // Current playback time in seconds for video sync
}

export const LIVE_SCREEN_MEDIA_STORAGE_KEY = "liveScreenMediaCache";
export const LIVE_SCREEN_BROADCAST_CHANNEL = "live-screen-media-sync";

type LiveScreenMediaMap = Record<string, LiveScreenMediaEntry>;

// Create BroadcastChannel for instant cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(LIVE_SCREEN_BROADCAST_CHANNEL);
    } catch (e) {
      console.warn("BroadcastChannel not supported");
      return null;
    }
  }
  return broadcastChannel;
}

function safeParseCache(value: string | null): LiveScreenMediaMap {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as LiveScreenMediaMap;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function serializeCache(cache: LiveScreenMediaMap) {
  try {
    localStorage.setItem(LIVE_SCREEN_MEDIA_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
  }
}

export function readLiveScreenMediaCache(): LiveScreenMediaMap {
  if (typeof window === "undefined") return {};
  const existing = localStorage.getItem(LIVE_SCREEN_MEDIA_STORAGE_KEY);
  return safeParseCache(existing);
}

export function getLiveScreenMedia(screenId: number): LiveScreenMediaEntry | null {
  const cache = readLiveScreenMediaCache();
  return cache[String(screenId)] ?? null;
}

export function upsertLiveScreenMedia(entry: Omit<LiveScreenMediaEntry, "updatedAt"> & { updatedAt?: string }) {
  if (typeof window === "undefined") return;
  const cache = readLiveScreenMediaCache();
  const record: LiveScreenMediaEntry = {
    ...entry,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
  cache[String(entry.screenId)] = record;
  serializeCache(cache);
  
  // Broadcast instantly to all tabs for ZERO DELAY
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'media-update',
        screenId: entry.screenId,
        data: record
      });
    } catch (e) {
      // Fallback to storage event
    }
  }
}

export function removeLiveScreenMedia(screenId: number, ownerId?: string) {
  if (typeof window === "undefined") return;
  const cache = readLiveScreenMediaCache();
  const existing = cache[String(screenId)];
  if (!existing) return;
  if (ownerId && existing.ownerId && existing.ownerId !== ownerId) {
    return;
  }
  delete cache[String(screenId)];
  serializeCache(cache);
  
  // Broadcast removal instantly
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'media-remove',
        screenId: screenId
      });
    } catch (e) {
      // Fallback to storage event
    }
  }
}

// Subscribe to broadcast messages for instant updates
export function subscribeToBroadcast(callback: (data: any) => void): () => void {
  if (typeof window === "undefined") return () => {};
  
  const channel = getBroadcastChannel();
  if (!channel) return () => {};
  
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  
  channel.addEventListener('message', handler);
  
  return () => {
    channel.removeEventListener('message', handler);
  };
}
