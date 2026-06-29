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
}

export const LIVE_SCREEN_MEDIA_STORAGE_KEY = "liveScreenMediaCache";

type LiveScreenMediaMap = Record<string, LiveScreenMediaEntry>;

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
    console.error("Failed to persist live screen media cache", error);
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
}
