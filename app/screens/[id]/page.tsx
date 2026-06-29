"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ScreenPlayer from "@/components/ScreenPlayer";
import { screenApi } from "@/lib/api/screen.api";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import { cameraApi } from "@/lib/api/camera.api";
import { campaignApi } from "@/lib/api/campaign.api";
import { useScreenSignalR } from "@/lib/hooks/useScreenSignalR";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import type { Campaign } from "@/lib/types/campaign";
import { removeLiveScreenMedia, upsertLiveScreenMedia } from "@/lib/screens/utils/liveScreenMediaCache";

type ScreenState = "DETECTING" | "PLAYING";

type PendingMediaUpdate = {
  mediaAssetId: number;
  source: "ai-detection" | "signalr";
  selectedSlot?: string;
};

const ZERO_CLEAR_DELAY_MS = 10000;

export default function ScreenPage() {
  const params = useParams();
  const screenId = Number(params.id);
  
  // State management
  const [advertisement, setAdvertisement] = useState<MediaAsset | null>(null);
  const [fallbackAd, setFallbackAd] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [cameraWarning, setCameraWarning] = useState<boolean>(false);
  const [linkedCameraId, setLinkedCameraId] = useState<number | null>(null);
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
  // State machine
  const [screenState, setScreenState] = useState<ScreenState>("DETECTING");
  const [lastPersonCount, setLastPersonCount] = useState<number>(0);
  
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
  const lastPersonCountRef = useRef<number>(0);
  const zeroClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zeroGraceActiveRef = useRef(false);

  useEffect(() => {
    screenStateRef.current = screenState;
  }, [screenState]);

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    lastPersonCountRef.current = lastPersonCount;
  }, [lastPersonCount]);

  useEffect(() => {
    linkedCameraIdRef.current = linkedCameraId;
    if (typeof window !== "undefined" && linkedCameraId) {
      window.sessionStorage.setItem(`screen_state_${linkedCameraId}`, screenStateRef.current);
    }
  }, [linkedCameraId]);

  useEffect(() => {
    if (!linkedCameraId) return;

    cameraApi.activate(linkedCameraId)
      .then(() => console.log(`✅ Camera ${linkedCameraId} activated for screen view`))
      .catch((err) => console.error(`❌ Failed to activate camera ${linkedCameraId}:`, err));

    return () => {
      cameraApi.deactivate(linkedCameraId)
        .then(() => console.log(`🔴 Camera ${linkedCameraId} deactivated after screen view`))
        .catch((err) => console.error(`❌ Failed to deactivate camera ${linkedCameraId}:`, err));
    };
  }, [linkedCameraId]);

  useEffect(() => () => {
    if (zeroClearTimeoutRef.current) {
      clearTimeout(zeroClearTimeoutRef.current);
    }
  }, []);

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
      
      console.log("🔍 Screen Data:", screenData);
      console.log("📷 Camera ID:", screenData?.cameraId);
      console.log("📋 Campaign ID:", screenData?.currentCampaignId);
      
      setLinkedCameraId(screenData?.cameraId ?? null);

      // Load camera settings
      if (screenData?.cameraId) {
        setCameraWarning(false);
        try {
          const camera = await cameraApi.getById(screenData.cameraId);
          console.log("✅ Camera loaded:", camera);
        } catch (err) {
          console.error("❌ Failed to load camera:", err);
        }
      } else {
        console.warn("⚠️ No camera linked to this screen!");
        setCameraWarning(true);
      }

      // Load campaign media assets
      let fallbackIds: number[] = [];
      
      if (screenData?.currentCampaignId) {
        try {
          const campaign = await campaignApi.getById(screenData.currentCampaignId);
          console.log("✅ Campaign loaded:", campaign);
          setCurrentCampaignId(campaign.id);
          setCampaign(campaign);
          campaignRef.current = campaign;
          
          // Use campaign's default media asset as fallback
          fallbackIds = [campaign.defaultMediaAssetId].filter(Boolean) as number[];
        } catch (err) {
          console.error("❌ Failed to load campaign:", err);
          // Fallback to screen's default if campaign fails
          fallbackIds = [screenData?.defaultMediaAssetId].filter(Boolean) as number[];
          setCampaign(null);
          campaignRef.current = null;
        }
      } else {
        console.warn("⚠️ No campaign linked to this screen!");
        // Use screen's default media asset
        fallbackIds = [screenData?.defaultMediaAssetId].filter(Boolean) as number[];
        setCampaign(null);
        campaignRef.current = null;
      }
      
      const resolvedFallback = await resolveFallbackAsset(fallbackIds);
      
      if (resolvedFallback) {
        setFallbackAd(resolvedFallback);
        setAdvertisement(resolvedFallback);
        console.log("✅ Fallback ad loaded:", resolvedFallback.name);
      } else {
        console.warn("⚠️ No fallback ad available");
      }
    } catch (err) {
      console.error("❌ Failed to load fallback ad:", err);
    } finally {
      setLoading(false);
    }
  }, [screenId, resolveFallbackAsset]);

  const dispatchScreenStateChange = useCallback((state: ScreenState) => {
    if (typeof window === "undefined") return;
    const cameraId = linkedCameraIdRef.current;
    if (!cameraId) return;
    window.sessionStorage.setItem(`screen_state_${cameraId}`, state);
    window.dispatchEvent(
      new CustomEvent("screen-state-changed", {
        detail: { cameraId, state },
      }),
    );
  }, []);

  const updateScreenState = useCallback((state: ScreenState) => {
    screenStateRef.current = state;
    setScreenState(state);
    dispatchScreenStateChange(state);
  }, [dispatchScreenStateChange]);

  const clearLatestDetection = useCallback(() => {
    latestDetectionRef.current = null;
    zeroGraceActiveRef.current = false;
    if (screenStateRef.current !== "PLAYING") {
      if (fallbackAd) {
        setAdvertisement(fallbackAd);
      }
      updateScreenState("DETECTING");
    }
  }, [fallbackAd, updateScreenState]);

  const scheduleZeroClear = useCallback(() => {
    if (zeroClearTimeoutRef.current) {
      clearTimeout(zeroClearTimeoutRef.current);
    }
    zeroGraceActiveRef.current = true;
    zeroClearTimeoutRef.current = setTimeout(() => {
      zeroClearTimeoutRef.current = null;
      if (lastPersonCountRef.current <= 0) {
        zeroGraceActiveRef.current = false;
        console.log("🕒 Clearing latest detection after extended grace period");
        clearLatestDetection();
      }
    }, ZERO_CLEAR_DELAY_MS);
  }, [clearLatestDetection]);

  const playMediaAsset = useCallback(async (mediaAssetId: number, source: PendingMediaUpdate["source"], selectedSlot?: string) => {
    const targetAd = await mediaAssetApi.getById(mediaAssetId);
    console.log(`✅ Loading media from ${source}: ${targetAd.name}${selectedSlot ? ` (${selectedSlot})` : ""}`);
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

    if (lastPersonCountRef.current <= 0) {
      console.log("⚠️ Dropping detection because audience cleared", detection);
      latestDetectionRef.current = null;
      return false;
    }

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

    if (screenStateRef.current === "DETECTING" && lastPersonCountRef.current > 0) {
      await playLatestDetectionIfPossible();
    } else {
      console.log("⏳ Stored latest media update until ad ends", { mediaAssetId, source, selectedSlot });
    }
  }, [playLatestDetectionIfPossible]);

  const selectMediaAssetId = useCallback((campaignData: Campaign, slot?: string | null): number | null => {
    const normalized = String(slot || "").toLowerCase();
    switch (normalized) {
      case "boyskids":
      case "boys_kids":
      case "boys-kids":
      case "boys":
      case "boy":
        return campaignData.boysKidsMediaAssetId;
      case "girlskids":
      case "girls_kids":
      case "girls-kids":
      case "girls":
      case "girl":
        return campaignData.girlsKidsMediaAssetId;
      case "men":
      case "man":
      case "male":
        return campaignData.menMediaAssetId;
      case "women":
      case "woman":
      case "female":
        return campaignData.womenMediaAssetId;
      case "boyskidsfallback":
      default:
        return campaignData.defaultMediaAssetId;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFallbackAd();
  }, [loadFallbackAd]);

  // Listen to AI detection from Background Camera
  useEffect(() => {
    console.log("📡 Registering AI detection listener for screen", screenId);
    
    const handleAIDetection = async (event: CustomEvent) => {
      const { audience, selectedSlot, cameraId } = event.detail;
      const slot = selectedSlot || audience;
      console.log("🎯 AI Detection Event:", { audience, selectedSlot, cameraId, currentCampaignId, screenState: screenStateRef.current });

      // Only process if we have a campaign and we're in DETECTING state
      if (linkedCameraIdRef.current && Number(cameraId) !== linkedCameraIdRef.current) {
        console.log("⏭️ Ignoring AI detection from unrelated camera", { eventCameraId: cameraId, linkedCameraId: linkedCameraIdRef.current });
        return;
      }

      if (!currentCampaignId) {
        console.warn("⚠️ No campaign linked, ignoring AI detection");
        return;
      }

      try {
        const cachedCampaign = campaignRef.current;
        if (!cachedCampaign) {
          console.warn("⚠️ Campaign cache missing, cannot select media asset");
          return;
        }

        const targetMediaAssetId = selectMediaAssetId(cachedCampaign, slot);
        console.log("🎬 Selected Media Asset ID:", targetMediaAssetId, "for audience:", audience, "slot:", slot);

        if (targetMediaAssetId) {
          await scheduleMediaUpdate(targetMediaAssetId, "ai-detection", slot);
        } else {
          console.warn(`⚠️ No media asset for audience: ${audience}`);
        }
      } catch (err) {
        console.error("❌ Failed to load campaign for audience selection:", err);
      }
    };

    // Add event listener
    window.addEventListener('ai-detection' as any, handleAIDetection as any);

    return () => {
      window.removeEventListener('ai-detection' as any, handleAIDetection as any);
    };
  }, [currentCampaignId, scheduleMediaUpdate, screenId, selectMediaAssetId]);

  const handleSignalRMediaUpdated = useCallback(async (event: { currentMediaAssetId: number; selectedSlot: string }) => {
    console.log("🔔 Media updated via SignalR:", event);
    
    // Load the specific media asset from the event
    if (event.currentMediaAssetId) {
      try {
        await scheduleMediaUpdate(event.currentMediaAssetId, "signalr", event.selectedSlot);
      } catch (err) {
        console.error("❌ Failed to load media from SignalR:", err);
        loadFallbackAd();
      }
    } else {
      loadFallbackAd();
    }
  }, [loadFallbackAd, scheduleMediaUpdate]);

  const handleSignalRRefreshRequested = useCallback(() => {
    console.log("🔔 Refresh requested via SignalR");
    loadFallbackAd();
  }, [loadFallbackAd]);

  // SignalR: listen for real-time updates
  const { connected } = useScreenSignalR(
    screenId,
    handleSignalRMediaUpdated,
    handleSignalRRefreshRequested
  );

  useEffect(() => {
    const handlePersonCountChanged = (event: CustomEvent) => {
      const { currentCount, previousCount, cameraId } = event.detail;
      if (linkedCameraIdRef.current && Number(cameraId) !== linkedCameraIdRef.current) {
        console.log("⏭️ Ignoring person count from unrelated camera", { eventCameraId: cameraId, linkedCameraId: linkedCameraIdRef.current });
        return;
      }

      console.log("👥 Person count changed:", { cameraId, previousCount, currentCount, screenState: screenStateRef.current });
      setLastPersonCount(currentCount);
      lastPersonCountRef.current = currentCount;

      if (currentCount === 0) {
        scheduleZeroClear();
        return;
      }

      if (zeroClearTimeoutRef.current) {
        clearTimeout(zeroClearTimeoutRef.current);
        zeroClearTimeoutRef.current = null;
      }
      zeroGraceActiveRef.current = false;

      if (screenStateRef.current === "DETECTING") {
        void playLatestDetectionIfPossible();
      }
    };

    window.addEventListener("person-count-changed" as any, handlePersonCountChanged as any);

    return () => {
      window.removeEventListener("person-count-changed" as any, handlePersonCountChanged as any);
    };
  }, [fallbackAd, playLatestDetectionIfPossible, scheduleZeroClear]);

  useEffect(() => {
    setSignalRConnected(connected);
  }, [connected]);

  // Activate/deactivate screen
  useEffect(() => {
    screenApi.activate(screenId)
      .then(() => console.log(`✅ Screen ${screenId} activated`))
      .catch((err) => console.error(`❌ Failed to activate screen ${screenId}:`, err));

    return () => {
      screenApi.deactivate(screenId)
        .then(() => console.log(`� Screen ${screenId} deactivated`))
        .catch((err) => console.error(`❌ Failed to deactivate screen ${screenId}:`, err));
    };
  }, [screenId]);

  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (zeroClearTimeoutRef.current) {
        clearTimeout(zeroClearTimeoutRef.current);
        zeroClearTimeoutRef.current = null;
      }
      zeroGraceActiveRef.current = false;
    };
  }, []);

  // Start detection mode (DISABLED - using Background Camera Service instead)
  useEffect(() => {
    // Background Camera Service handles detection automatically
    // We only listen to 'ai-detection' events
    console.log("📡 Detection mode: Using Background Camera Service");
  }, [screenState]);

  // Handle ad ended
  const handleAdEnded = useCallback(() => {
    console.log("🎬 Ad ended, resuming detection");

    playLatestDetectionIfPossible()
      .then((applied) => {
        if (applied) return;
        if (fallbackAd && !zeroGraceActiveRef.current) {
          setAdvertisement(fallbackAd);
        } else if (zeroGraceActiveRef.current) {
          console.log("⏳ Holding last ad during no-audience grace window");
        }
        updateScreenState("DETECTING");
      })
      .catch((err) => {
        console.error("❌ Failed to apply pending media update:", err);
        if (fallbackAd && !zeroGraceActiveRef.current) {
          setAdvertisement(fallbackAd);
        }
        updateScreenState("DETECTING");
      });
  }, [fallbackAd, playLatestDetectionIfPossible, updateScreenState]);

  useEffect(() => {
    if (!advertisement) {
      removeLiveScreenMedia(screenId, tabInstanceIdRef.current);
      return;
    }

    const resolvedType = advertisement.type
      ? (advertisement.type.toLowerCase().includes("video") ? "video" : "image")
      : (advertisement.url && /\.(mp4|webm|ogg)$/i.test(advertisement.url) ? "video" : "image");

    upsertLiveScreenMedia({
      screenId,
      mediaAssetId: advertisement.id ?? null,
      name: advertisement.name ?? null,
      url: advertisement.url ?? null,
      type: resolvedType,
      state: screenState,
      cameraId: linkedCameraId ?? null,
      ownerId: tabInstanceIdRef.current,
    });

    return () => {
      removeLiveScreenMedia(screenId, tabInstanceIdRef.current);
    };
  }, [advertisement, screenId, screenState, linkedCameraId]);

  useEffect(() => {
    return () => {
      removeLiveScreenMedia(screenId, tabInstanceIdRef.current);
    };
  }, [screenId]);

  const handleClick = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore
    }
  };

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
        advertisement={advertisement} 
        screenId={screenId}
        onEnded={handleAdEnded}
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
          <span className="text-slate-300 text-[10px]">Persons: {lastPersonCount}</span>
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