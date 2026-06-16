"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ScreenPlayer from "@/components/ScreenPlayer";
import { screenApi } from "@/lib/api/screen.api";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import { cameraApi } from "@/lib/api/camera.api";
import { genderAiApi } from "@/lib/api/genderAi.api";
import { useScreenSignalR } from "@/lib/hooks/useScreenSignalR";
import { mediapipeService } from "@/lib/services/mediapipeService";
import type { MediaAsset } from "@/lib/types/mediaAsset";

export default function ScreenPage() {
  const params = useParams();
  const screenId = Number(params.id);
  const [advertisement, setAdvertisement] = useState<MediaAsset | null>(null);
  const [fallbackAd, setFallbackAd] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<string>("جاري التحقق...");
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [fallbackTimeoutSec, setFallbackTimeoutSec] = useState<number>(10);
  const [lastChangeAt, setLastChangeAt] = useState<number | null>(null);
  const [cameraWarning, setCameraWarning] = useState<boolean>(false);
  const [lastDetectionAt, setLastDetectionAt] = useState<number | null>(null);
  const [mediapipeActive, setMediapipeActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediapipeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resolveFallbackAsset = useCallback(async (preferredIds: number[] = []): Promise<MediaAsset | null> => {
    // 1) Try preferred asset IDs first (currentDefault / default)
    for (const id of preferredIds) {
      try {
        if (!id) continue;
        const asset = await mediaAssetApi.getById(id);
        return asset;
      } catch {
        // Ignore and move to the next option
      }
    }

    // 2) Look for any asset marked as fallback
    try {
      const all = await mediaAssetApi.getAll();
      const candidate = all.find((m) => m.isFallback);
      if (candidate) return candidate;
    } catch {
      // Ignore silently
    }

    return null;
  }, []);

  // Load the advertisement and apply selection scenarios
  const loadAndAnalyze = useCallback(async () => {
    try {
      // 1. Fetch screen, camera, active campaign, and current media
      const [screenData, campaignData, currentMedia] = await Promise.all([
        screenApi.getById(screenId),
        screenApi.getActiveCampaign(screenId).catch(() => null),
        screenApi.getCurrentMedia(screenId).catch(() => null),
      ]);

      // Camera must be linked to this screen
      if (screenData?.cameraId) {
        setCameraWarning(false);
        try {
          const camera = await cameraApi.getById(screenData.cameraId);
          setFallbackTimeoutSec(camera.timeToScreenshot || 10);
        } catch {
          setFallbackTimeoutSec(10);
        }
      } else {
        setCameraWarning(true);
        setFallbackTimeoutSec(10);
      }

      let finalMediaAssetId: number | undefined = undefined;
      let finalMediaUrl: string | undefined = undefined;

      // Apply the required priority scenarios:
      // Scenario 2 (highest priority): if a scheduled campaign is active, play campaign media
      if (campaignData && campaignData.ruleApplied && campaignData.campaign) {
        setActiveScenario("السيناريو 2: تشغيل حملة إعلانية نشطة جدولة زمنية");
        setCampaignName(campaignData.campaign.name);
        
        // Use the media selected by the backend for the campaign
        finalMediaAssetId = currentMedia?.currentMediaAssetId;
        finalMediaUrl = currentMedia?.url;
      } 
      // Scenario 1: AI-based audience selection via camera
      else if (currentMedia && currentMedia.currentMediaAssetId) {
        setActiveScenario("السيناريو 1: تحليل ذكي عبر الكاميرا للجمهور المتواجد");
        setCampaignName(null);
        finalMediaAssetId = currentMedia.currentMediaAssetId;
        finalMediaUrl = currentMedia.url;
      } else {
        setActiveScenario("العرض الافتراضي: لا توجد حملات أو تحليل كاميرا نشط");
        setCampaignName(null);
      }

      if (finalMediaAssetId && finalMediaUrl) {
        // Fetch fresh media details (type, name, duration)
        try {
          const realAsset = await mediaAssetApi.getById(finalMediaAssetId);
          setAdvertisement(realAsset);
          setLastChangeAt(Date.now());
        } catch {
          // Fallback: build a minimal asset using the direct URL if fetch fails
          const isVideo = finalMediaUrl.toLowerCase().match(/\.(mp4|webm|mov|m4v)/);
          setAdvertisement({
            id: finalMediaAssetId,
            clientId: 0,
            name: campaignData?.campaign?.name || "إعلان ديناميكي",
            description: "تم إنشاؤه تلقائياً",
            type: isVideo ? "Video" : "Image",
            url: finalMediaUrl,
            durationSeconds: 15,
            fileSizeMb: 0,
            resolution: "1920x1080",
            isFallback: false,
            createdAtUtc: new Date().toISOString(),
          });
          setLastChangeAt(Date.now());
        }
      } else if (currentMedia?.url) {
        // If only a URL is available without an ID
        const isVideo = currentMedia.url.toLowerCase().match(/\.(mp4|webm|mov|m4v)/);
        setAdvertisement({
          id: currentMedia.currentMediaAssetId || 0,
          clientId: 0,
          name: "بث مباشر",
          description: "",
          type: isVideo ? "Video" : "Image",
          url: currentMedia.url,
          durationSeconds: 15,
          fileSizeMb: 0,
          resolution: "",
          isFallback: false,
          createdAtUtc: new Date().toISOString(),
        });
        setLastChangeAt(Date.now());
      } else {
        setAdvertisement(null);
        setLastChangeAt(Date.now());
      }

      // Prepare a fallback asset
      const fallbackIds = [currentMedia?.currentDefaultMediaAssetId, screenData?.defaultMediaAssetId].filter(
        Boolean,
      ) as number[];
      const resolvedFallback = await resolveFallbackAsset(fallbackIds);
      if (resolvedFallback) {
        setFallbackAd(resolvedFallback);
      }
    } catch (err) {
      console.error("فشل تطبيق سيناريوهات العرض من الـ API:", err);
    } finally {
      setLoading(false);
    }
  }, [screenId]);

  // Initial load + polling every 5s (backup for SignalR)
  useEffect(() => {
    loadAndAnalyze();
    const interval = setInterval(loadAndAnalyze, 5_000);
    return () => clearInterval(interval);
  }, [loadAndAnalyze]);

  // SignalR: listen for real-time updates
  const { connected } = useScreenSignalR(
    screenId,
    // On media update
    () => {
      console.log("🔔 Media updated, reloading...");
      loadAndAnalyze();
    },
    // On refresh request
    () => {
      console.log("🔔 Refresh requested, reloading...");
      loadAndAnalyze();
    }
  );

  useEffect(() => {
    setSignalRConnected(connected);
  }, [connected]);

  // Activate screen on mount, deactivate on unmount
  useEffect(() => {
    // Activate screen
    screenApi.activate(screenId)
      .then(() => console.log(`✅ تم تفعيل الشاشة ${screenId}`))
      .catch((err) => console.error(`❌ فشل تفعيل الشاشة ${screenId}:`, err));

    // Deactivate screen on cleanup
    return () => {
      screenApi.deactivate(screenId)
        .then(() => console.log(`🔴 تم تعطيل الشاشة ${screenId}`))
        .catch((err) => console.error(`❌ فشل تعطيل الشاشة ${screenId}:`, err));
    };
  }, [screenId]);

  // Initialize Mediapipe on load
  useEffect(() => {
    mediapipeService.initialize().catch((err) => {
      console.error("Failed to initialize Mediapipe:", err);
    });

    return () => {
      if (mediapipeIntervalRef.current) {
        clearInterval(mediapipeIntervalRef.current);
      }
    };
  }, []);

  // Start periodic Mediapipe capture from the local camera
  const startMediapipeCapture = useCallback(async () => {
    if (!videoRef.current || mediapipeActive) return;

    try {
      // Request access to the local camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMediapipeActive(true);

        // Schedule periodic captures every fallbackTimeoutSec
        mediapipeIntervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;

          try {
            const result = await mediapipeService.captureAndAnalyze(
              videoRef.current,
              screenId,
              (file) => genderAiApi.detectGender(screenId, file)
            );

            console.log("📸 Mediapipe Detection:", result);

            // If faces are detected, update last detection timestamp
            if (result.mediapipe.facesDetected > 0) {
              setLastDetectionAt(Date.now());
              console.log(
                `✅ Detected ${result.mediapipe.facesDetected} face(s) with confidence ${result.mediapipe.confidence.toFixed(2)}`
              );
            }
          } catch (error) {
            console.error("❌ Mediapipe capture error:", error);
          }
        }, fallbackTimeoutSec * 1000);
      }
    } catch (error) {
      console.error("❌ Failed to start camera for Mediapipe:", error);
      setCameraWarning(true);
    }
  }, [screenId, fallbackTimeoutSec, mediapipeActive]);

  // Stop Mediapipe capture
  const stopMediapipeCapture = useCallback(() => {
    if (mediapipeIntervalRef.current) {
      clearInterval(mediapipeIntervalRef.current);
      mediapipeIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setMediapipeActive(false);
  }, []);

  // Start/stop Mediapipe based on camera state
  useEffect(() => {
    if (!cameraWarning && fallbackTimeoutSec > 0) {
      startMediapipeCapture();
    } else {
      stopMediapipeCapture();
    }

    return () => {
      stopMediapipeCapture();
    };
  }, [cameraWarning, fallbackTimeoutSec, startMediapipeCapture, stopMediapipeCapture]);

  // Monitor timeout and switch to fallback media
  useEffect(() => {
    if (!fallbackTimeoutSec || !fallbackAd) return;

    const interval = setInterval(() => {
      // If no face is detected within the timeout, switch to fallback media
      if (lastDetectionAt) {
        const elapsed = (Date.now() - lastDetectionAt) / 1000;
        if (elapsed >= fallbackTimeoutSec && advertisement?.id !== fallbackAd.id) {
          console.log(
            `⏰ No detection for ${fallbackTimeoutSec}s, switching to fallback media`
          );
          setAdvertisement(fallbackAd);
          setLastChangeAt(Date.now());
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fallbackTimeoutSec, fallbackAd, advertisement, lastDetectionAt]);

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
        <div className="text-indigo-200 text-xl font-medium">جاري تشغيل الشاشة والتحقق من الخادم...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onClick={handleClick} className="w-full h-screen relative overflow-hidden select-none">
      <ScreenPlayer advertisement={advertisement} screenId={screenId} />

      {/* Hidden video element for Mediapipe */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />

      {/* Diagnostic overlay to show the active scenario (hidden by default) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>الشاشة {screenId} نشطة عبر الشبكة</span>
          {signalRConnected && (
            <>
              <span className="mx-1">•</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300">SignalR</span>
            </>
          )}
        </div>
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex flex-col gap-1 items-end text-right">
          <span className="text-indigo-400 font-bold">{activeScenario}</span>
          {campaignName && <span className="text-slate-300 text-[10px]">اسم الحملة: {campaignName}</span>}
          {cameraWarning && (
            <span className="text-amber-300 text-[10px] font-bold">
              تنبيه: هذه الشاشة غير مربوطة بكاميرا – لن يعمل منطق المهلة حتى يتم الربط
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
