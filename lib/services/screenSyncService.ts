

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

class ScreenSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<number, Set<(state: ScreenPlaybackState) => void>> = new Map();
  private lastBroadcastState: Map<number, ScreenPlaybackState> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.setupListener();
      } catch (e) {
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

      // Debounce: allow broadcast every 2 seconds minimum even if mediaAssetId unchanged
      if (lastState && lastState.mediaAssetId === state.mediaAssetId) {
        const timeSinceLastBroadcast = Date.now() - (lastState.timestamp || 0);
        if (timeSinceLastBroadcast < 2000) {
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
