"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ScreenPlayer from "@/components/ScreenPlayer";
import { screenApi } from "@/lib/api/screen.api";
import { useScreenSignalR } from "@/lib/hooks/useScreenSignalR";
import { screenSyncService } from "@/lib/services/screenSyncService";
import type { MediaAsset, MediaType } from "@/lib/types/mediaAsset";

type ScreenState = "DETECTING" | "PLAYING";

type PendingMediaUpdate = {
  mediaAssetId: number;
  source: "signalr";
  selectedSlot?: string;
  peopleCount?: number;
};

const TARGETED_SLOTS = new Set(["Men", "Women", "BoysKids", "GirlsKids"]);

const isTargetedSlot = (slot?: string | null) => Boolean(slot && TARGETED_SLOTS.has(slot));

const isVideoMediaAsset = (asset?: MediaAsset | null) => {
  if (!asset) return false;
  if (asset.type) {
    return asset.type.toLowerCase().includes("video");
  }
  if (asset.url) {
    return /\.(mp4|webm|ogg)$/i.test(asset.url);
  }
  return false;
};

// Helper to infer media type from URL
const inferMediaTypeFromUrl = (url: string): 'Image' | 'Video' => {
  if (!url) return 'Video';
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)$/i.test(lower)) return 'Video';
  return 'Image';
};

// Helper to create MediaAsset from screen current media data
const createMediaAssetFromSlot = (
  mediaAssetId: number,
  url: string,
  duration: number | null | undefined,
  name?: string,
  type?: string,
  isFallback?: boolean
): MediaAsset => {
  const mediaType: MediaType = (type === 'Image' || type === 'Video') ? type as MediaType : inferMediaTypeFromUrl(url);
  return {
    id: mediaAssetId,
    url: url,
    name: name ?? `Media ${mediaAssetId}`,
    type: mediaType,
    durationSeconds: duration ?? (mediaType === 'Image' ? 10 : 0),
    clientId: 0,
    createdAtUtc: new Date().toISOString(),
    isFallback: isFallback ?? false,
    fileSizeMb: 0,
    resolution: '1920x1080',
    description: '',
  };
};

export default function ScreenPage() {
  const params = useParams();
  const screenId = Number(params.id);

  // State management
  const [advertisement, setAdvertisement] = useState<MediaAsset | null>(null);
  const [fallbackAd, setFallbackAd] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [isPlayingTargetedAd, setIsPlayingTargetedAd] = useState(false);
  const [initialAdLoaded, setInitialAdLoaded] = useState(false);

  // State machine
  const [screenState, setScreenState] = useState<ScreenState>("DETECTING");
  const [playerNonce, setPlayerNonce] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screenStateRef = useRef<ScreenState>("DETECTING");
  const tabInstanceIdRef = useRef<string>("");

  if (!tabInstanceIdRef.current) {
    const unique = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `screen-tab-${screenId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    tabInstanceIdRef.current = unique;
  }
  const advertisementRef = useRef<MediaAsset | null>(null);
  advertisementRef.current = advertisement;
  const latestDetectionRef = useRef<PendingMediaUpdate | null>(null);
  const currentPersonCountRef = useRef(0);
  const presenceKnownRef = useRef(false);
  const cameraIdRef = useRef<number | null>(null);
  const playbackGenerationRef = useRef(0);
  const playMediaAssetRef = useRef<(
    mediaAssetId: number,
    source: PendingMediaUpdate["source"],
    selectedSlot?: string,
  ) => Promise<void>>(async () => { });
  const loadFallbackAdRef = useRef<() => Promise<void>>(async () => { });

  const activeTargetedAdRef = useRef<{
    mediaAssetId: number;
    startedAt: number;
  } | null>(null);

  const fallbackRequestIdRef = useRef(0);

  const isTargetedPlaybackLocked = () => activeTargetedAdRef.current !== null;

  const isSceneEmpty = () =>
    presenceKnownRef.current && currentPersonCountRef.current <= 0;

  const clearPendingDetection = (reason: string) => {
    if (latestDetectionRef.current) {
      console.log("🧹 CLEARED PENDING DETECTION:", reason);
    }
    latestDetectionRef.current = null;
  };

  const persistPlaybackMode = (state: ScreenState) => {
    const cameraId = cameraIdRef.current;
    if (!cameraId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`screen_state_${cameraId}`, state);
    } catch {
      // ignore quota / private mode
    }
  };

  const applyLivePersonCount = (count: number, source: "camera" | "signalr") => {
    if (source === "signalr" && presenceKnownRef.current) {
      return;
    }

    presenceKnownRef.current = true;
    currentPersonCountRef.current = count;

    if (count === 0) {
      clearPendingDetection(`count=0 (${source})`);
    }
  };

  useEffect(() => {
    screenStateRef.current = screenState;
    persistPlaybackMode(screenState);
  }, [screenState]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setupCameraChannel = async () => {
      try {
        const screenData = await screenApi.getById(screenId);
        if (screenData?.cameraId) {
          cameraIdRef.current = screenData.cameraId;
          persistPlaybackMode(screenStateRef.current);

          const channel = new BroadcastChannel(`person-count-changed-camera-${screenData.cameraId}`);

          const handleMessage = (event: MessageEvent) => {
            if (event.data?.type !== "person-count-changed") {
              return;
            }

            const count = Number(event.data.currentCount);
            if (!Number.isFinite(count)) {
              return;
            }

            console.log("📥 LIVE PERSON COUNT (camera):", count);
            applyLivePersonCount(count, "camera");
          };

          channel.addEventListener("message", handleMessage);

          cleanup = () => {
            channel.removeEventListener("message", handleMessage);
            channel.close();
          };
        } else {
          console.warn(`Screen ${screenId} has no cameraId assigned. Person count tracking disabled.`);
        }
      } catch (error) {
        console.error("Failed to fetch screen data for camera channel:", error);
      }
    };

    setupCameraChannel();

    return () => {
      cleanup?.();
    };
  }, [screenId]);

  const updateScreenState = useCallback((state: ScreenState) => {
    screenStateRef.current = state;
    setScreenState(state);
    persistPlaybackMode(state);
  }, []);

  const loadFallbackAd = useCallback(async () => {
    if (isTargetedPlaybackLocked()) {
      console.log("⛔ FALLBACK BLOCKED → TARGETED AD LOCKED");
      return;
    }

    const requestId = ++fallbackRequestIdRef.current;

    console.log("📡 loadFallbackAd CALLED:", {
      screenState: screenStateRef.current,
      locked: isTargetedPlaybackLocked(),
    });

    try {
      const currentMedia = await screenApi.getCurrentMedia(screenId);

      if (requestId !== fallbackRequestIdRef.current) {
        console.log("⛔ STALE FALLBACK REQUEST IGNORED");
        return;
      }

      if (isTargetedPlaybackLocked()) {
        console.log("⛔ FALLBACK IGNORED → TARGETED AD LOCKED AFTER FETCH");
        return;
      }

      let nextFallback: MediaAsset | null = null;

      if (currentMedia.currentDefaultMediaAssetId && currentMedia.currentDefaultMediaUrl) {
        nextFallback = createMediaAssetFromSlot(
          currentMedia.currentDefaultMediaAssetId,
          currentMedia.currentDefaultMediaUrl,
          currentMedia.currentDefaultMediaDuration ?? null,
          currentMedia.currentDefaultMediaAssetName,
          currentMedia.currentDefaultMediaAssetType,
          true
        );
      }

      if (isTargetedPlaybackLocked()) {
        return;
      }

      if (nextFallback) {
        setFallbackAd(nextFallback);
        setAdvertisement(nextFallback);
        setIsPlayingTargetedAd(false);
        updateScreenState("DETECTING");
        setInitialAdLoaded(true);
        setLoading(false);
      } else {
        setFallbackAd(null);
        setAdvertisement(null);
      }
    } catch (err) {
      console.error("❌ ERROR LOADING FALLBACK AD:", err);
      if (!isTargetedPlaybackLocked()) {
        setFallbackAd(null);
        setAdvertisement(null);
      }
    }
  }, [screenId, updateScreenState]);

  const playMediaAsset = useCallback(async (mediaAssetId: number, source: PendingMediaUpdate["source"], selectedSlot?: string) => {
    if (source !== "signalr" || !isTargetedSlot(selectedSlot)) {
      console.log("⛔ SKIP PLAY: not a targeted slot", { source, selectedSlot });
      return;
    }

    const generation = ++playbackGenerationRef.current;
    activeTargetedAdRef.current = {
      mediaAssetId,
      startedAt: Date.now(),
    };
    setIsPlayingTargetedAd(true);

    console.log("🎬 PLAY MEDIA ASSET CALLED:", {
      mediaAssetId,
      source,
      selectedSlot,
      generation,
    });

    const releaseLockIfCurrent = () => {
      if (generation !== playbackGenerationRef.current) return;
      activeTargetedAdRef.current = null;
      setIsPlayingTargetedAd(false);
    };

    try {
      const currentMedia = await screenApi.getCurrentMedia(screenId);

      if (generation !== playbackGenerationRef.current) {
        console.log("⛔ STALE TARGETED PLAY IGNORED");
        return;
      }

      let url: string | undefined;
      let duration: number | null | undefined;
      let assetId: number | undefined;
      let name: string | undefined;
      let type: string | undefined;

      switch (selectedSlot) {
        case "Men":
          url = currentMedia.currentMenMediaUrl;
          duration = currentMedia.currentMenMediaDuration;
          assetId = currentMedia.currentMenMediaAssetId;
          name = currentMedia.currentMenMediaAssetName;
          type = currentMedia.currentMenMediaAssetType;
          break;
        case "Women":
          url = currentMedia.currentWomenMediaUrl;
          duration = currentMedia.currentWomenMediaDuration;
          assetId = currentMedia.currentWomenMediaAssetId;
          name = currentMedia.currentWomenMediaAssetName;
          type = currentMedia.currentWomenMediaAssetType;
          break;
        case "BoysKids":
          url = currentMedia.currentBoysKidsMediaUrl;
          duration = currentMedia.currentBoysKidsMediaDuration;
          assetId = currentMedia.currentBoysKidsMediaAssetId;
          name = currentMedia.currentBoysKidsMediaAssetName;
          type = currentMedia.currentBoysKidsMediaAssetType;
          break;
        case "GirlsKids":
          url = currentMedia.currentGirlsKidsMediaUrl;
          duration = currentMedia.currentGirlsKidsMediaDuration;
          assetId = currentMedia.currentGirlsKidsMediaAssetId;
          name = currentMedia.currentGirlsKidsMediaAssetName;
          type = currentMedia.currentGirlsKidsMediaAssetType;
          break;
        default:
          releaseLockIfCurrent();
          return;
      }

      if (!url || !assetId) {
        console.error("❌ NO MEDIA FOUND FOR SLOT:", selectedSlot);
        releaseLockIfCurrent();
        return;
      }

      const targetAd = createMediaAssetFromSlot(assetId, url, duration ?? null, name, type, false);

      if (generation !== playbackGenerationRef.current) {
        return;
      }

      activeTargetedAdRef.current = {
        mediaAssetId: targetAd.id,
        startedAt: Date.now(),
      };

      setAdvertisement(targetAd);
      updateScreenState("PLAYING");
      setInitialAdLoaded(true);
      setLoading(false);

      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("❌ FAILED TO PLAY TARGETED AD:", error);
      releaseLockIfCurrent();
    }
  }, [updateScreenState, screenId]);

  playMediaAssetRef.current = playMediaAsset;
  loadFallbackAdRef.current = loadFallbackAd;

  const playLatestDetectionIfPossible = useCallback(async () => {
    if (isSceneEmpty()) {
      clearPendingDetection("scene empty before next targeted play");
      return false;
    }

    const detection = latestDetectionRef.current;
    if (!detection || !isTargetedSlot(detection.selectedSlot)) {
      clearPendingDetection("no usable pending detection");
      return false;
    }

    latestDetectionRef.current = null;
    await playMediaAsset(detection.mediaAssetId, detection.source, detection.selectedSlot);
    return true;
  }, [playMediaAsset]);

  useEffect(() => {
    void loadFallbackAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignalRMediaUpdated = useCallback(async (event: {
    currentMediaAssetId: number;
    selectedSlot: string;
    usedFallback?: boolean;
    personCount?: number;
    message?: string;
    updatedAtUtc?: string;
  }) => {
    console.log("🤖 AI DETECTION RECEIVED:", {
      currentMediaAssetId: event.currentMediaAssetId,
      selectedSlot: event.selectedSlot,
      usedFallback: event.usedFallback,
      personCount: event.personCount,
      screenState: screenStateRef.current,
      locked: isTargetedPlaybackLocked(),
    });

    if (event.personCount !== undefined && Number.isFinite(Number(event.personCount))) {
      applyLivePersonCount(Number(event.personCount), "signalr");
    }

    const usableTarget =
      Boolean(event.currentMediaAssetId) &&
      isTargetedSlot(event.selectedSlot) &&
      event.usedFallback !== true;

    if (isSceneEmpty() || !usableTarget) {
      clearPendingDetection(
        isSceneEmpty()
          ? "AI event while scene empty"
          : "AI fallback / missing targeted slot"
      );
      return;
    }

    if (isTargetedPlaybackLocked()) {
      latestDetectionRef.current = {
        mediaAssetId: event.currentMediaAssetId,
        source: "signalr",
        selectedSlot: event.selectedSlot,
        peopleCount: event.personCount,
      };
      console.log("⏳ STORED LATEST DETECTION FOR AD END:", event.selectedSlot);
      return;
    }

    console.log("⚡ IMMEDIATE SWITCH FROM FALLBACK →", event.selectedSlot);
    await playMediaAssetRef.current(event.currentMediaAssetId, "signalr", event.selectedSlot);
  }, []);

  const handleSignalRRefreshRequested = useCallback((event: { screenId?: number; reason?: string }) => {
    console.log("🔄 REFRESH REQUESTED:", {
      screenId: event?.screenId,
      reason: event?.reason,
      screenState: screenStateRef.current,
      locked: isTargetedPlaybackLocked(),
    });

    if (isTargetedPlaybackLocked() || screenStateRef.current === "PLAYING") {
      console.log("⛔ REFRESH IGNORED → TARGETED PLAYBACK LOCK");
      return;
    }

    void loadFallbackAdRef.current();
  }, []);

  // SignalR: listen for real-time updates
  const { connected } = useScreenSignalR(
    screenId,
    handleSignalRMediaUpdated,
    handleSignalRRefreshRequested
  );

  useEffect(() => {
    setSignalRConnected(connected);
  }, [connected]);

  // Activate/deactivate screen
  useEffect(() => {
    screenApi.activate(screenId)
      .then(() => {
        // Register open screen tab
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("openScreenTabs");
          let ids: number[] = [];
          if (stored) {
            try {
              ids = JSON.parse(stored);
            } catch {
              ids = [];
            }
          }
          if (!ids.includes(screenId)) {
            ids.push(screenId);
          }
          localStorage.setItem("openScreenTabs", JSON.stringify(ids));
        }
      })
      .catch((err) => { });

    // Unregister screen tab helper function
    const unregisterScreenTab = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("openScreenTabs");
        let ids: number[] = [];
        if (stored) {
          try {
            ids = JSON.parse(stored);
          } catch {
            ids = [];
          }
        }
        ids = ids.filter(id => id !== screenId);
        localStorage.setItem("openScreenTabs", JSON.stringify(ids));
      }
    };

    // Handle tab/window close via beforeunload
    const handleBeforeUnload = () => {
      unregisterScreenTab();
      // Note: We also attempt deactivate, but it may not complete before tab closes
      screenApi.deactivate(screenId).catch(() => { });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unregisterScreenTab();
      screenApi.deactivate(screenId).catch(() => { });
    };
  }, [screenId]);

  /**
   * HEARTBEAT controls screen status
   * + Updates localStorage for other pages (same device)
   * + Updates server directly (different devices)
   */
  useEffect(() => {
    if (!screenId || !Number.isFinite(screenId) || screenId <= 0) return;


    // Send heartbeat immediately when tab opens
    const sendHeartbeat = async () => {
      try {
        await screenApi.sendHeartbeat(screenId);

        // Update localStorage for other pages (same device)
        if (typeof window !== "undefined") {
          const timestamp = Date.now().toString();
          localStorage.setItem(`screen-heartbeat-${screenId}`, timestamp);
        }
      } catch (err) {
      }
    };

    sendHeartbeat();

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 40000); // 40 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [screenId]);

  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  const handleAdEnded = useCallback(async () => {
    const stillShowingFallback = advertisementRef.current?.isFallback === true;

    if (isTargetedPlaybackLocked() && stillShowingFallback) {
      console.log("⏳ FALLBACK ENDED DURING TARGETED LOAD → KEEP LOCK");
      return;
    }

    playbackGenerationRef.current += 1;
    activeTargetedAdRef.current = null;
    setIsPlayingTargetedAd(false);

    if (isSceneEmpty()) {
      clearPendingDetection("natural ad end with empty scene");
      await loadFallbackAd();
      return;
    }

    // Check if latest detection has peopleCount > 0 before playing
    const detection = latestDetectionRef.current;
    if (detection && detection.peopleCount !== undefined && detection.peopleCount <= 0) {
      console.log("🧹 CLEARED DETECTION: peopleCount is 0");
      latestDetectionRef.current = null;
      await loadFallbackAd();
      return;
    }

    const applied = await playLatestDetectionIfPossible();
    if (applied) {
      return;
    }

    await loadFallbackAd();
  }, [playLatestDetectionIfPossible, loadFallbackAd]);

  // **DISPLAY ENGINE**: Broadcast playback state to Mirror Players
  // This is the MASTER - it broadcasts what's playing
  useEffect(() => {
    if (!advertisement) return;

    const resolvedType = isVideoMediaAsset(advertisement) ? "video" : "image";

    // Broadcast state every 300ms for real-time sync
    const broadcastInterval = setInterval(() => {
      // Get real-time video position for perfect sync
      const videoEl = document.querySelector('video') as HTMLVideoElement | null;
      const currentTime = videoEl?.currentTime ?? 0;

      screenSyncService.broadcastState({
        screenId,
        mediaAssetId: advertisement.id ?? null,
        mediaUrl: advertisement.url ?? null,
        mediaName: advertisement.name ?? null,
        mediaType: resolvedType,
        currentTime: currentTime,
        duration: advertisement.durationSeconds ?? null,
        isPlaying: true,
        timestamp: Date.now()
      });
    }, 300);

    return () => {
      clearInterval(broadcastInterval);
    };
  }, [advertisement, screenId]);

  // Cleanup handled by beforeunload event and deactivate call

  // Listen for close-all-tabs message via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel('screen-tabs');

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close-all-tabs') {
        window.close();
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const handleClick = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore
    }
  };

  const lastPlaybackErrorAtRef = useRef(0);
  const handlePlaybackError = useCallback((err: unknown) => {
    if (activeTargetedAdRef.current) {
      console.error(
        "❌ TARGETED AD PLAYBACK ERROR → RETRY"
      );

      setPlayerNonce((prev: number) => prev + 1);

      return;
    }

    const now = Date.now();
    if (now - lastPlaybackErrorAtRef.current < 2000) {
      return;
    }
    lastPlaybackErrorAtRef.current = now;

    if (!fallbackAd) {
      return;
    }

    if (advertisement?.id && advertisement.id === fallbackAd.id) {
      setPlayerNonce((prev: number) => prev + 1);
      return;
    }

    setAdvertisement(fallbackAd);
    setPlayerNonce((prev: number) => prev + 1);
    updateScreenState("DETECTING");
  }, [advertisement?.id, advertisement?.url, fallbackAd, updateScreenState]);

  const shouldLoopFallbackAd = Boolean(
    screenState === "DETECTING" &&
    fallbackAd &&
    advertisement &&
    advertisement.id === fallbackAd.id &&
    isVideoMediaAsset(advertisement)
  );

  if (loading) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <div className="text-indigo-200 text-xl font-medium">جاري تحميل الشاشة </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onClick={handleClick} className="w-full h-screen relative overflow-hidden select-none">
      <ScreenPlayer
        key={`${advertisement?.id ?? "none"}-${playerNonce}`}
        advertisement={advertisement}
        screenId={screenId}
        onEnded={handleAdEnded}
        shouldLoop={shouldLoopFallbackAd}
        onPlaybackError={handlePlaybackError}
      />
    </div>
  );
}