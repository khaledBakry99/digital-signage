

export interface ScreenPlaybackState {
  screenId: number;
  mediaAssetId: number | null;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaType: "image" | "video";
  currentTime: number;
  duration: number | null;
  isPlaying: boolean;
  timestamp: number;
}

const CHANNEL_NAME = "screen-sync-channel";
const SAME_MEDIA_DEBOUNCE_MS = 2000;
const RESTART_THRESHOLD_SECONDS = 0.5;

function isSameMediaDuplicate(lastState: ScreenPlaybackState, state: ScreenPlaybackState): boolean {
  if (lastState.mediaAssetId !== state.mediaAssetId) return false;
  if (lastState.mediaUrl !== state.mediaUrl) return false;
  if (lastState.mediaName !== state.mediaName) return false;
  if (lastState.mediaType !== state.mediaType) return false;
  if (lastState.isPlaying !== state.isPlaying) return false;
  if (lastState.duration !== state.duration) return false;

  const restarted = state.currentTime + RESTART_THRESHOLD_SECONDS < lastState.currentTime;
  return !restarted;
}

class ScreenSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<number, Set<(state: ScreenPlaybackState) => void>> = new Map();
  private lastBroadcastState: Map<number, ScreenPlaybackState> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.setupListener();
      } catch {
        console.warn("BroadcastChannel not supported");
      }
    }
  }

  private setupListener() {
    if (!this.channel) return;

    this.channel.onmessage = (event: MessageEvent<ScreenPlaybackState>) => {
      const state = event.data;
      const screenListeners = this.listeners.get(state.screenId);

      // Cache the last state for instant initial load
      this.lastBroadcastState.set(state.screenId, state);

      if (screenListeners) {
        screenListeners.forEach(callback => callback(state));
      }
    };
  }


  broadcastState(state: ScreenPlaybackState) {
    if (!this.channel) return;

    try {
      const lastState = this.lastBroadcastState.get(state.screenId);

      // Debounce only true duplicates. Restarts/loops of the same media id still need to sync.
      if (lastState && isSameMediaDuplicate(lastState, state)) {
        const timeSinceLastBroadcast = Date.now() - (lastState.timestamp || 0);
        if (timeSinceLastBroadcast < SAME_MEDIA_DEBOUNCE_MS) {
          console.log('⏭️ SKIPPED BROADCAST - Same mediaAssetId, too soon:', state.mediaAssetId);
          return;
        }
      }

      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now()
      };

      this.lastBroadcastState.set(state.screenId, stateWithTimestamp);
      this.channel.postMessage(stateWithTimestamp);
      console.log('📡 BROADCAST SENT:', state.mediaAssetId);
    } catch (e) {
      console.error("Failed to broadcast state:", e);
    }
  }


  subscribe(screenId: number, callback: (state: ScreenPlaybackState) => void): () => void {
    if (!this.listeners.has(screenId)) {
      this.listeners.set(screenId, new Set());
    }

    this.listeners.get(screenId)!.add(callback);

    // Send last known state immediately for instant load (no time restriction)
    const lastState = this.lastBroadcastState.get(screenId);
    if (lastState) {
      setTimeout(() => callback(lastState), 0);
    }

    // Return unsubscribe function
    return () => {
      const screenListeners = this.listeners.get(screenId);
      if (screenListeners) {
        screenListeners.delete(callback);
        if (screenListeners.size === 0) {
          this.listeners.delete(screenId);
        }
      }
    };
  }


  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.lastBroadcastState.clear();
  }
}

// Singleton instance
export const screenSyncService = new ScreenSyncService();
