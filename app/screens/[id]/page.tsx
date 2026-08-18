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
};

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
  const latestDetectionRef = useRef<PendingMediaUpdate | null>(null);

  useEffect(() => {
    screenStateRef.current = screenState;
  }, [screenState]);



  // Load initial fallback ad using new API
  const loadFallbackAd = useCallback(async () => {
    console.log('📡 loadFallbackAd CALLED:', {
      screenState: screenStateRef.current,
      isPlayingTargetedAd,
      stackTrace: new Error().stack?.split('\n')[1]?.trim()
    });

    try {
      console.log('📡 LOADING FALLBACK AD FROM NEW API...');
      const currentMedia = await screenApi.getCurrentMedia(screenId);

      console.log('📊 NEW API RESPONSE:', {
        screenId: currentMedia.screenId,
        currentCampaignId: currentMedia.currentCampaignId,
        currentDefaultMediaAssetId: currentMedia.currentDefaultMediaAssetId,
        currentDefaultMediaUrl: currentMedia.currentDefaultMediaUrl,
        currentDefaultMediaDuration: currentMedia.currentDefaultMediaDuration,
        currentMenMediaAssetId: currentMedia.currentMenMediaAssetId,
        currentMenMediaDuration: currentMedia.currentMenMediaDuration,
        currentWomenMediaAssetId: currentMedia.currentWomenMediaAssetId,
        currentWomenMediaDuration: currentMedia.currentWomenMediaDuration,
        currentBoysKidsMediaAssetId: currentMedia.currentBoysKidsMediaAssetId,
        currentBoysKidsMediaDuration: currentMedia.currentBoysKidsMediaDuration,
        currentGirlsKidsMediaAssetId: currentMedia.currentGirlsKidsMediaAssetId,
        currentGirlsKidsMediaDuration: currentMedia.currentGirlsKidsMediaDuration,
      });

      // The new API already determines the correct fallback ad
      let fallbackAd: MediaAsset | null = null;

      if (currentMedia.currentDefaultMediaAssetId && currentMedia.currentDefaultMediaUrl) {
        fallbackAd = createMediaAssetFromSlot(
          currentMedia.currentDefaultMediaAssetId,
          currentMedia.currentDefaultMediaUrl,
          currentMedia.currentDefaultMediaDuration ?? null,
          currentMedia.currentDefaultMediaAssetName,
          currentMedia.currentDefaultMediaAssetType,
          true // isFallback: true for default media
        );

        console.log('✅ CREATED FALLBACK AD:', {
          id: fallbackAd.id,
          name: fallbackAd.name,
          type: fallbackAd.type,
          url: fallbackAd.url,
          durationSeconds: fallbackAd.durationSeconds,
        });
      } else {
        console.warn('⚠️ NO FALLBACK AD AVAILABLE - currentDefaultMediaAssetId or currentDefaultMediaUrl is missing');
      }

      if (fallbackAd) {
        setFallbackAd(fallbackAd);
        setAdvertisement(fallbackAd);
      } else {
        setFallbackAd(null);
        setAdvertisement(null);
      }
    } catch (err) {
      console.error('❌ ERROR LOADING FALLBACK AD:', err);
      setFallbackAd(null);
      setAdvertisement(null);
    } finally {
      setLoading(false);
    }
  }, [screenId]);



  const updateScreenState = useCallback((state: ScreenState) => {
    screenStateRef.current = state;
    setScreenState(state);
  }, []);

  const playMediaAsset = useCallback(async (mediaAssetId: number, source: PendingMediaUpdate["source"], selectedSlot?: string) => {
    let targetAd: MediaAsset | null = null;

    console.log('🎬 PLAY MEDIA ASSET CALLED:', {
      mediaAssetId,
      source,
      selectedSlot,
    });

    if (source === "signalr") {
      // For AI detections, use the new API to get the correct media with correct duration
      console.log('📡 FETCHING CURRENT MEDIA FROM NEW API FOR DETECTION...');
      const currentMedia = await screenApi.getCurrentMedia(screenId);

      console.log('📊 NEW API RESPONSE FOR DETECTION:', {
        currentMediaAssetId: currentMedia.currentMediaAssetId,
        currentMediaUrl: currentMedia.url,
        currentMediaDuration: currentMedia.currentMediaAssetDuration,
        selectedSlot,
      });

      // Get the correct media based on selectedSlot
      let url: string | undefined;
      let duration: number | null | undefined;
      let assetId: number | undefined;
      let name: string | undefined;
      let type: string | undefined;

      switch (selectedSlot) {
        case 'Men':
          url = currentMedia.currentMenMediaUrl;
          duration = currentMedia.currentMenMediaDuration;
          assetId = currentMedia.currentMenMediaAssetId;
          name = currentMedia.currentMenMediaAssetName;
          type = currentMedia.currentMenMediaAssetType;
          break;
        case 'Women':
          url = currentMedia.currentWomenMediaUrl;
          duration = currentMedia.currentWomenMediaDuration;
          assetId = currentMedia.currentWomenMediaAssetId;
          name = currentMedia.currentWomenMediaAssetName;
          type = currentMedia.currentWomenMediaAssetType;
          break;
        case 'BoysKids':
          url = currentMedia.currentBoysKidsMediaUrl;
          duration = currentMedia.currentBoysKidsMediaDuration;
          assetId = currentMedia.currentBoysKidsMediaAssetId;
          name = currentMedia.currentBoysKidsMediaAssetName;
          type = currentMedia.currentBoysKidsMediaAssetType;
          break;
        case 'GirlsKids':
          url = currentMedia.currentGirlsKidsMediaUrl;
          duration = currentMedia.currentGirlsKidsMediaDuration;
          assetId = currentMedia.currentGirlsKidsMediaAssetId;
          name = currentMedia.currentGirlsKidsMediaAssetName;
          type = currentMedia.currentGirlsKidsMediaAssetType;
          break;
        default:
          url = currentMedia.currentDefaultMediaUrl;
          duration = currentMedia.currentDefaultMediaDuration;
          assetId = currentMedia.currentDefaultMediaAssetId;
          name = currentMedia.currentDefaultMediaAssetName;
          type = currentMedia.currentDefaultMediaAssetType;
      }

      if (url && assetId) {
        targetAd = createMediaAssetFromSlot(assetId, url, duration ?? null, name, type, false); // isFallback: false for targeted ads
        console.log('✅ CREATED TARGET AD FROM NEW API:', {
          id: targetAd.id,
          name: targetAd.name,
          type: targetAd.type,
          url: targetAd.url,
          durationSeconds: targetAd.durationSeconds,
          selectedSlot,
        });
      } else {
        console.error('❌ NO MEDIA FOUND FOR SLOT:', selectedSlot);
        return;
      }
    } else {
      // For fallback ads, this shouldn't be called with the new API approach
      console.error('playMediaAsset called with non-signalr source, which is unexpected');
      return;
    }

    if (!targetAd) {
      console.error('Failed to load media asset:', mediaAssetId);
      return;
    }

    console.log('🎬 PLAYING AD:', {
      mediaAssetId,
      mediaName: targetAd?.name,
      mediaType: targetAd?.type,
      source: source,
      selectedSlot: selectedSlot,
      duration: targetAd?.type?.toLowerCase() === 'image' ? `${targetAd?.durationSeconds}s` : 'video (no duration limit)',
      isTargeted: source === "signalr"
    });

    setAdvertisement(targetAd);
    updateScreenState("PLAYING");
    setIsPlayingTargetedAd(source === "signalr");

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, [updateScreenState, screenId]);

  const playLatestDetectionIfPossible = useCallback(async () => {
    const detection = latestDetectionRef.current;
    if (!detection) return false;

    latestDetectionRef.current = null;
    await playMediaAsset(detection.mediaAssetId, detection.source, detection.selectedSlot);
    return true;
  }, [playMediaAsset]);

  const scheduleMediaUpdate = useCallback(async (
    mediaAssetId: number,
    source: PendingMediaUpdate["source"],
    selectedSlot?: string,
  ) => {
    latestDetectionRef.current = {
      mediaAssetId,
      source,
      selectedSlot,
    };

    console.log('📅 DETECTION REPLACED:', {
      mediaAssetId,
      source,
      selectedSlot,
      screenState: screenStateRef.current
    });

    if (screenStateRef.current === "DETECTING") {
      await playLatestDetectionIfPossible();
    } else {
      console.log('⏳ STORED: Latest detection stored for next ad end');
    }
  }, [playLatestDetectionIfPossible]);

  // Initial load - run only once on mount
  useEffect(() => {
    loadFallbackAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignalRMediaUpdated = useCallback(async (event: { currentMediaAssetId: number; selectedSlot: string; usedFallback?: boolean }) => {
    const gender = event.selectedSlot;
    console.log('🤖 AI DETECTION RECEIVED:', {
      currentMediaAssetId: event.currentMediaAssetId,
      selectedSlot: event.selectedSlot,
      usedFallback: event.usedFallback,
      screenState: screenStateRef.current,
      isPlayingTargetedAd: isPlayingTargetedAd
    });

    // Print gender 6 times for visibility
    for (let i = 0; i < 6; i++) {
      console.log(`👤 GENDER DETECTED: ${gender}`);
    }

    // If no media asset, clear detection
    if (!event.currentMediaAssetId) {
      console.log('⏳ CLEARED: No media asset, clearing detection');
      latestDetectionRef.current = null;
      return;
    }

    // Check if current ad is fallback (default)
    const isPlayingFallback = advertisement?.isFallback === true;

    if (isPlayingFallback) {
      console.log('⚡ IMMEDIATE SWITCH: Detection received while playing fallback ad - switching immediately');
      // Switch immediately to targeted ad
      await playMediaAsset(event.currentMediaAssetId, "signalr", event.selectedSlot);
      setIsPlayingTargetedAd(true);
      return;
    }

    // For targeted ads, store detection for next ad end
    console.log('⏳ STORED: Detection stored for next ad end (targeted ad is playing)');
    latestDetectionRef.current = {
      mediaAssetId: event.currentMediaAssetId,
      source: "signalr",
      selectedSlot: event.selectedSlot,
    };
  }, [advertisement, playMediaAsset]);

  const handleSignalRRefreshRequested = useCallback((event: any) => {
    console.log('🔄 REFRESH REQUESTED:', {
      screenId: event?.screenId,
      reason: event?.reason,
      screenState: screenStateRef.current,
      isPlayingTargetedAd
    });

    // Don't reload fallback ad while playing a targeted ad
    if (screenStateRef.current === "PLAYING" || isPlayingTargetedAd) {
      console.log('⏭️ REFRESH IGNORED: Screen is PLAYING, ignoring refresh request');
      return;
    }
    loadFallbackAd();
  }, [loadFallbackAd, isPlayingTargetedAd]);

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
    console.log('🏁 AD ENDED:', {
      currentAdId: advertisement?.id,
      currentAdName: advertisement?.name,
      currentAdType: advertisement?.type,
      hasPendingDetection: latestDetectionRef.current !== null,
      pendingDetection: latestDetectionRef.current
    });

    // Priority 1: Apply pending detection immediately
    const applied = await playLatestDetectionIfPossible();
    if (applied) {
      console.log('✅ PENDING DETECTION APPLIED: Switching to targeted ad');
      setIsPlayingTargetedAd(true);
      return;
    }

    console.log('🔄 NO PENDING DETECTIONS: Returning to fallback ad');

    // Return to fallback ad (new API handles campaign changes automatically)
    setIsPlayingTargetedAd(false);

    // Reload fallback ad to get latest state
    await loadFallbackAd();

    updateScreenState("DETECTING");
  }, [advertisement, fallbackAd, playLatestDetectionIfPossible, updateScreenState, loadFallbackAd]);

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
    const now = Date.now();
    if (now - lastPlaybackErrorAtRef.current < 2000) {
      return;
    }
    lastPlaybackErrorAtRef.current = now;

    if (!fallbackAd) {
      return;
    }

    if (advertisement?.id && advertisement.id === fallbackAd.id) {
      setPlayerNonce((prev) => prev + 1);
      return;
    }

    setAdvertisement(fallbackAd);
    setPlayerNonce((prev) => prev + 1);
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

      {/* Diagnostic overlay */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Screen {screenId} Active</span>
          {signalRConnected && (
            <>
              <span className="mx-1">•</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300">SignalR</span>
            </>
          )}
        </div>
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex flex-col gap-1 items-end text-right">
          <span className="text-indigo-400 font-bold">State: {screenState}</span>
        </div>
      </div>
    </div>
  );
}