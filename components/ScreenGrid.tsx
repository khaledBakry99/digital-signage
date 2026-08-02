"use client";

import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { screenApi } from "@/lib/api/screen.api";
import { cameraApi } from "@/lib/api/camera.api";
import { useScreenSignalR } from "@/lib/hooks/useScreenSignalR";
import { useFloatingCamera } from "@/lib/context/FloatingCameraContext";
import { LIVE_SCREEN_MEDIA_STORAGE_KEY, LiveScreenMediaEntry, readLiveScreenMediaCache } from "@/lib/screens/utils/liveScreenMediaCache";
import type { Screen, ScreenCurrentMedia } from "@/lib/types/screen";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import type { Camera } from "@/lib/types/camera";

/**
 * Helper: Register open screen tab
 */
function registerOpenScreenTab(screenId: number): number[] {
  if (typeof window === "undefined") return [];
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
  return ids;
}

interface ScreenGridProps {
  screens: Screen[];
  openScreenTabs?: Set<number>;
}

function ScreenPreview({
  adFileUrl,
  adType,
}: {
  adFileUrl: string;
  adType: "image" | "video";
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          فشل تحميل الإعلان

        </p>
      </div>
    );
  }

  if (adType === "image") {
    return (
      <img
        src={adFileUrl}
        alt="معاينة الإعلان"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <video
      src={adFileUrl}
      className="w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      onError={() => setError(true)}
    />
  );
}

export default function ScreenGrid({ screens, openScreenTabs: initialOpenScreenTabs = new Set() }: ScreenGridProps) {
  const { advertisements } = useAdvertisements();
  const { openFloatingCamera, closeFloatingCamera, isCameraFloating } = useFloatingCamera();
  const [openScreenTabs, setOpenScreenTabs] = useState<Set<number>>(initialOpenScreenTabs);
  const [liveMediaByScreen, setLiveMediaByScreen] = useState<Map<number, LiveScreenMediaEntry>>(new Map());

  // Track opened screen tabs via localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("openScreenTabs");
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setOpenScreenTabs(new Set(ids));
        } catch {
          setOpenScreenTabs(new Set());
        }
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const syncLiveMedia = () => {
      const cache = readLiveScreenMediaCache();
      const entries = Object.values(cache);
      setLiveMediaByScreen(new Map(entries.map((entry) => [entry.screenId, entry])));
    };

    syncLiveMedia();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LIVE_SCREEN_MEDIA_STORAGE_KEY) {
        syncLiveMedia();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncLiveMedia);
    const interval = setInterval(syncLiveMedia, 1500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncLiveMedia);
      clearInterval(interval);
    };
  }, []);

  const openScreen = useCallback((screenId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!screenId || openScreenTabs.has(screenId)) {
      return;
    }

    const width = window.screen.width * 0.8;
    const height = window.screen.height * 0.8;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const newWindow = window.open(
      `/screens/${screenId}`,
      "_blank",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (!newWindow) {
      return;
    }

    registerOpenScreenTab(screenId);
  }, [openScreenTabs]);

  const openCamera = useCallback(async (cameraId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!cameraId) {
      return;
    }

    const isFloating = isCameraFloating(cameraId);
    if (isFloating) {
      closeFloatingCamera(String(cameraId));
      return;
    }

    try {
      const backendCamera = await cameraApi.getById(cameraId);
      const source = backendCamera.cameraDeviceName;
      let cameraType: "local" | "rtsp" | "http" | "hls" = "local";
      if (source.startsWith("rtsp://")) {
        cameraType = "rtsp";
      } else if (source.includes(".m3u8") || source.includes("/hls")) {
        cameraType = "hls";
      } else if (source.startsWith("http://") || source.startsWith("https://")) {
        cameraType = "http";
      }

      const camera: Camera = {
        id: String(backendCamera.id),
        name: backendCamera.name,
        location: backendCamera.location,
        source: source,
        type: cameraType,
        status: backendCamera.state === 'Active' ? 'connected' : 'disconnected',
        timeToScreenshot: backendCamera.timeToScreenshot,
        settings: {
          resolution: "1080p",
          frameRate: 30,
          quality: "medium",
        },
        createdAt: new Date(backendCamera.createdAtUtc),
        updatedAt: new Date(),
      };
      openFloatingCamera(camera);
    } catch (err) {
      console.error("Failed to load camera:", err);
    }
  }, [isCameraFloating, closeFloatingCamera, openFloatingCamera]);

  const sortedScreens = useMemo(() => screens.map((screen, order) => ({ screen, order })), [screens]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
      {sortedScreens.map(({ screen, order }) => (
        <ScreenCard
          key={screen.id}
          screen={screen}
          order={order}
          advertisements={advertisements}
          onOpenCamera={openCamera}
          onOpenScreen={openScreen}
          liveMedia={liveMediaByScreen.get(screen.id)}
          openScreenTabs={openScreenTabs}
        />
      ))}
    </div>
  );
}

interface ScreenCardProps {
  screen: Screen;
  order: number;
  advertisements: MediaAsset[];
  onOpenCamera: (cameraId: number, e: React.MouseEvent) => void;
  onOpenScreen: (screenId: number, e: React.MouseEvent) => void;
  liveMedia?: LiveScreenMediaEntry;
  openScreenTabs?: Set<number>;
}

function ScreenCard({
  screen,
  order,
  advertisements,
  onOpenCamera,
  onOpenScreen,
  liveMedia,
  openScreenTabs = new Set(),
}: ScreenCardProps) {
  const { theme } = useTheme();
  const { isCameraFloating } = useFloatingCamera();
  const isLightTheme = theme === "light";
  const isActive = screen.connectionStatus === "Online";
  const [currentMedia, setCurrentMedia] = useState<ScreenCurrentMedia | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const isCameraFloatingState = !!screen.cameraId && isCameraFloating(screen.cameraId);
  const isScreenOpen = openScreenTabs.has(screen.id);
  const LIVE_MEDIA_STALE_MS = 30_000;

  const freshLiveMedia = useMemo(() => {
    if (!liveMedia) return null;
    const updatedAt = Date.parse(liveMedia.updatedAt);
    if (!Number.isFinite(updatedAt)) return null;
    if (Date.now() - updatedAt > LIVE_MEDIA_STALE_MS) {
      return null;
    }
    return liveMedia;
  }, [liveMedia]);

  const loadCurrentMedia = useCallback(async () => {
    try {
      setLoadingMedia(true);
      const media = await screenApi.getCurrentMedia(screen.id);
      setCurrentMedia(media);
    } catch (err) {
      if (!isActive) {
        setCurrentMedia(null);
      }
    } finally {
      setLoadingMedia(false);
    }
  }, [isActive, screen.id]);

  useEffect(() => {
    loadCurrentMedia();
  }, [loadCurrentMedia]);

  useScreenSignalR(screen.id, () => {
    loadCurrentMedia();
  });

  const effectiveMediaId = currentMedia?.currentMediaAssetId ?? screen.currentMediaAssetId;
  const ad = effectiveMediaId ? advertisements.find((a) => a.id === effectiveMediaId) : undefined;
  const previewUrl = currentMedia?.url ?? ad?.url;
  const mediaType = useMemo(() => {
    if (ad?.type) {
      return ad.type.toLowerCase() as "image" | "video";
    }
    if (previewUrl && /\.(mp4|webm|ogg)$/i.test(previewUrl)) {
      return "video";
    }
    return "image";
  }, [ad, previewUrl]);

  const livePreviewUrl = freshLiveMedia?.url || undefined;
  const livePreviewType = freshLiveMedia?.type || undefined;
  const previewSource = livePreviewUrl ?? previewUrl;
  const previewMediaType = livePreviewType ?? mediaType;
  const adTitle = freshLiveMedia?.name || ad?.name || (effectiveMediaId ? `المادة ${effectiveMediaId}` : undefined);
  const previewAvailable = !!previewSource;

  return (
    <div
      className="glass glass-hover animate-fade-in relative p-6 group"
      style={{ animationDelay: `${order * 60}ms` }}
    >
      {/* Live Status Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-lg select-none z-10" style={{
        background: isLightTheme
          ? isActive
            ? "rgba(34, 197, 94, 0.15)" // أخضر فاتح للنشط
            : "rgba(239, 68, 68, 0.15)" // أحمر فاتح للخامل
          : "rgba(10, 15, 29, 0.8)",
        border: isActive
          ? isLightTheme ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)"
          : isLightTheme ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <span className={`w-2 h-2 rounded-full ${isActive
          ? "bg-green-500 animate-pulse"
          : isLightTheme ? "bg-red-500" : "bg-slate-500"
          }`} />
        <span className={`text-[11px] font-bold tracking-wide ${isActive
          ? isLightTheme ? "text-green-700" : "text-white"
          : isLightTheme ? "text-red-700" : "text-white"
          }`}>
          {isActive ? "نشط" : "خامل"}
        </span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {screen.name}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {screen.lastHeartbeatAtUtc
              ? new Date(screen.lastHeartbeatAtUtc).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "غير متصل"}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl mb-4 overflow-hidden relative"
        style={{
          height: "180px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        {(previewAvailable && (isActive || freshLiveMedia)) ? (
          <>
            <ScreenPreview adFileUrl={previewSource!} adType={previewMediaType} />
            <div
              className="absolute bottom-0 left-0 right-0 p-2"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold truncate" style={{ color: "white" }}>
                  {adTitle || "إعلان مباشر"}
                </p>
                <div className="flex items-center gap-2">
                  {freshLiveMedia && (
                    <span className="text-[10px] text-emerald-300 font-semibold">مباشر</span>
                  )}
                  {loadingMedia && <span className="text-[10px] text-white/70">يتم التحديث...</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-10 h-10 mx-auto mb-2"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isActive ? "لا يوجد إعلان" : "الشاشة غير متصلة"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => onOpenScreen(screen.id, e)}
          disabled={isScreenOpen}
          className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95 ${isScreenOpen ? "disabled:opacity-40 disabled:cursor-not-allowed" : ""
            }`}
          style={{
            background: isScreenOpen
              ? "rgba(100,116,139,0.15)"
              : "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
            border: isScreenOpen
              ? "1px solid rgba(100,116,139,0.2)"
              : "1px solid rgba(99,102,241,0.2)",
            color: isScreenOpen ? "#94a3b8" : "#818cf8",
          }}
          title={
            isScreenOpen
              ? "الشاشة مفتوحة بالفعل"
              : "فتح الشاشة في تبويب جديد"
          }
        >
          {isScreenOpen ? "الشاشة مفتوحة" : "فتح الشاشة ←"}
        </button>

        {screen.cameraId && (
          <button
            onClick={(e) => onOpenCamera(screen.cameraId!, e)}
            disabled={isCameraFloatingState}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer ${isCameraFloatingState ? "disabled:opacity-40 disabled:cursor-not-allowed" : ""
              }`}
            style={{
              background: isCameraFloatingState
                ? "rgba(100,116,139,0.15)"
                : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
              border: isCameraFloatingState
                ? "1px solid rgba(100,116,139,0.2)"
                : "1px solid rgba(16,185,129,0.3)",
              color: isCameraFloatingState ? "#94a3b8" : "#34d399",
            }}
            title={
              isCameraFloatingState
                ? "الكاميرا مفتوحة بالفعل"
                : "فتح الكاميرا المربوطة"
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
