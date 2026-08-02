"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ScreenPlayer from "@/components/ScreenPlayer";
import { screenApi } from "@/lib/api/screen.api";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import { cameraApi } from "@/lib/api/camera.api";
import { campaignApi } from "@/lib/api/campaign.api";
import { useScreenSignalR } from "@/lib/hooks/useScreenSignalR";
import { screenSyncService } from "@/lib/services/screenSyncService";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import type { Campaign } from "@/lib/types/campaign";

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

export default function ScreenPage() {
  const params = useParams();
  const screenId = Number(params.id);

  // State management
  const [advertisement, setAdvertisement] = useState<MediaAsset | null>(null);
  const [fallbackAd, setFallbackAd] = useState<MediaAsset | null>(null);
  const [screenDefaultMediaId, setScreenDefaultMediaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [cameraWarning, setCameraWarning] = useState<boolean>(false);
  const [linkedCameraId, setLinkedCameraId] = useState<number | null>(null);
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // State machine
  const [screenState, setScreenState] = useState<ScreenState>("DETECTING");
  const [playerNonce, setPlayerNonce] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screenStateRef = useRef<ScreenState>("DETECTING");
  const linkedCameraIdRef = useRef<number | null>(null);
  const tabInstanceIdRef = useRef<string>("");

  if (!tabInstanceIdRef.current) {
    const unique = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `screen-tab-${screenId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    tabInstanceIdRef.current = unique;
  }
  const campaignRef = useRef<Campaign | null>(null);
  const latestDetectionRef = useRef<PendingMediaUpdate | null>(null);

  useEffect(() => {
    screenStateRef.current = screenState;
  }, [screenState]);

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    linkedCameraIdRef.current = linkedCameraId;
  }, [linkedCameraId]);

  // Resolve fallback asset
  const resolveFallbackAsset = useCallback(async (preferredIds: number[] = []): Promise<MediaAsset | null> => {
    for (const id of preferredIds) {
      try {
        if (!id) continue;
        const asset = await mediaAssetApi.getById(id);
        return asset;
      } catch {
        // Ignore and move to the next option
      }
    }

    try {
      const all = await mediaAssetApi.getAll();
      const candidate = all.find((m) => m.isFallback);
      if (candidate) return candidate;
    } catch {
      // Ignore silently
    }

    return null;
  }, []);

  // Load initial fallback ad from campaign
  const loadFallbackAd = useCallback(async () => {
    try {
      const screenData = await screenApi.getById(screenId);


      setLinkedCameraId(screenData?.cameraId ?? null);
      setScreenDefaultMediaId(screenData?.defaultMediaAssetId ?? null);

      // Load camera settings
      if (screenData?.cameraId) {
        setCameraWarning(false);
        try {
          const camera = await cameraApi.getById(screenData.cameraId);
        } catch (err) {
        }
      } else {
        setCameraWarning(true);
      }

      // Load campaign media assets
      let fallbackIds: number[] = [];

      if (screenData?.currentCampaignId) {
        try {
          const campaign = await campaignApi.getById(screenData.currentCampaignId);
          setCurrentCampaignId(campaign.id);
          const endsAtMs = new Date(campaign.endsAtUtc).getTime();
          const isCampaignExpired = Number.isFinite(endsAtMs) && endsAtMs <= Date.now();
          if (isCampaignExpired) {
            setCampaign(null);
            campaignRef.current = null;
            setCurrentCampaignId(null);
            fallbackIds = [screenData?.defaultMediaAssetId].filter(Boolean) as number[];
          } else {
            setCampaign(campaign);
            campaignRef.current = campaign;
            // Use campaign's default media asset as fallback
            fallbackIds = [campaign.defaultMediaAssetId].filter(Boolean) as number[];
          }
        } catch (err) {
          // Fallback to screen's default if campaign fails
          fallbackIds = [screenData?.defaultMediaAssetId].filter(Boolean) as number[];
          setCampaign(null);
          campaignRef.current = null;
        }
      } else {
        // Use screen's default media asset
        fallbackIds = [screenData?.defaultMediaAssetId].filter(Boolean) as number[];
        setCampaign(null);
        campaignRef.current = null;
      }

      const resolvedFallback = await resolveFallbackAsset(fallbackIds);

      if (resolvedFallback) {
        setFallbackAd(resolvedFallback);
        setAdvertisement(resolvedFallback);
      } else {
        setFallbackAd(null);
        setAdvertisement(null);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [screenId, resolveFallbackAsset]);

  const switchToScreenFallback = useCallback(async () => {
    const fallbackIds = [screenDefaultMediaId].filter(Boolean) as number[];
    const replacement = await resolveFallbackAsset(fallbackIds);
    setCampaign(null);
    campaignRef.current = null;
    setCurrentCampaignId(null);
    if (replacement) {
      setFallbackAd(replacement);
      setAdvertisement((current) => {
        if (!current || (fallbackAd && current.id === fallbackAd.id)) {
          return replacement;
        }
        return current;
      });
    } else {
      setFallbackAd(null);
      setAdvertisement((current) => (fallbackAd && current?.id === fallbackAd.id ? null : current));
    }
  }, [fallbackAd, resolveFallbackAsset, screenDefaultMediaId]);

  useEffect(() => {
    if (!campaign) return;
    const endsAtMs = new Date(campaign.endsAtUtc).getTime();
    if (!Number.isFinite(endsAtMs)) return;
    const delay = endsAtMs - Date.now();
    if (delay <= 0) {
      switchToScreenFallback();
      return;
    }
    const timer = setTimeout(() => {
      switchToScreenFallback();
    }, delay);
    return () => clearTimeout(timer);
  }, [campaign, switchToScreenFallback]);

  const updateScreenState = useCallback((state: ScreenState) => {
    screenStateRef.current = state;
    setScreenState(state);
  }, []);

  const playMediaAsset = useCallback(async (mediaAssetId: number, source: PendingMediaUpdate["source"], selectedSlot?: string) => {
    const targetAd = await mediaAssetApi.getById(mediaAssetId);
    setAdvertisement(targetAd);
    updateScreenState("PLAYING");

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, [updateScreenState]);

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

    if (screenStateRef.current === "DETECTING") {
      await playLatestDetectionIfPossible();
    } else {
    }
  }, [playLatestDetectionIfPossible]);

  // Initial load
  useEffect(() => {
    loadFallbackAd();
  }, [loadFallbackAd]);

  const handleSignalRMediaUpdated = useCallback(async (event: { currentMediaAssetId: number; selectedSlot: string }) => {

    // Load the specific media asset from the event
    if (event.currentMediaAssetId) {
      try {
        await scheduleMediaUpdate(event.currentMediaAssetId, "signalr", event.selectedSlot);
      } catch (err) {
        loadFallbackAd();
      }
    } else {
      loadFallbackAd();
    }
  }, [loadFallbackAd, scheduleMediaUpdate]);

  const handleSignalRRefreshRequested = useCallback(() => {
    loadFallbackAd();
  }, [loadFallbackAd]);

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

  // Handle ad ended
  const handleAdEnded = useCallback(() => {

    playLatestDetectionIfPossible()
      .then((applied) => {
        if (applied) return;
        if (fallbackAd) {
          if (advertisement?.id && advertisement.id === fallbackAd.id) {
            setPlayerNonce((prev) => prev + 1);
          }
          setAdvertisement(fallbackAd);
        }
        updateScreenState("DETECTING");
      })
      .catch((err) => {
        if (fallbackAd) {
          if (advertisement?.id && advertisement.id === fallbackAd.id) {
            setPlayerNonce((prev) => prev + 1);
          }
          setAdvertisement(fallbackAd);
        }
        updateScreenState("DETECTING");
      });
  }, [advertisement, fallbackAd, playLatestDetectionIfPossible, updateScreenState]);

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
  }, [advertisement?.id, advertisement?.url, fallbackAd, screenId, updateScreenState]);

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
        <div className="text-indigo-200 text-xl font-medium">Loading screen...</div>
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
          <span className="text-slate-300 text-[10px]">Camera: {linkedCameraId ?? "none"}</span>
          {cameraWarning && (
            <span className="text-amber-300 text-[10px] font-bold">
              ⚠️ No camera linked
            </span>
          )}
          {!currentCampaignId && (
            <span className="text-orange-300 text-[10px] font-bold">
              ⚠️ No campaign linked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}