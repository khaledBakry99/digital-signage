"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { cameraApi } from "@/lib/api/camera.api";
import { useFloatingCamera } from "@/lib/context/FloatingCameraContext";
import MirrorPlayer from "@/components/MirrorPlayer";
import type { Screen } from "@/lib/types/screen";
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

/**
 * Helper: Unregister screen tab (on close)
 */
function unregisterOpenScreenTab(screenId: number): number[] {
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
  ids = ids.filter(id => id !== screenId);
  localStorage.setItem("openScreenTabs", JSON.stringify(ids));
  return ids;
}

interface ScreenGridProps {
  screens: Screen[];
  openScreenTabs?: Set<number>;
}



export default function ScreenGrid({ screens, openScreenTabs: initialOpenScreenTabs = new Set() }: ScreenGridProps) {
  const { openFloatingCamera, closeFloatingCamera, isCameraFloating } = useFloatingCamera();
  const [openScreenTabs, setOpenScreenTabs] = useState<Set<number>>(initialOpenScreenTabs);
  const [openWindows, setOpenWindows] = useState<Map<number, Window>>(new Map());
  const [screenHeartbeats, setScreenHeartbeats] = useState<{ [screenId: number]: number }>({});

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

  // Track heartbeats from open screen tabs
  useEffect(() => {
    const checkHeartbeats = () => {
      const heartbeats: { [screenId: number]: number } = {};
      const now = Date.now();
      const staleThreshold = 60000; // 60 seconds

      for (const screen of screens) {
        const heartbeatKey = `screen-heartbeat-${screen.id}`;
        const heartbeatStr = localStorage.getItem(heartbeatKey);
        if (heartbeatStr) {
          const heartbeatTime = Number(heartbeatStr);
          if (!Number.isNaN(heartbeatTime) && (now - heartbeatTime) < staleThreshold) {
            heartbeats[screen.id] = heartbeatTime;
          }
        }
      }

      setScreenHeartbeats(heartbeats);

      // Remove stale entries from openScreenTabs
      setOpenScreenTabs((prev) => {
        const updated = new Set<number>();
        for (const screenId of prev) {
          const heartbeatTime = heartbeats[screenId];
          if (heartbeatTime) {
            updated.add(screenId);
          }
        }
        return updated;
      });
    };

    checkHeartbeats();
    const interval = setInterval(checkHeartbeats, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [screens]);

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

    // Track window to detect quick closure
    setOpenWindows((prev) => new Map(prev).set(screenId, newWindow));

    // Check if window is closed every second
    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(checkClosed);
        setOpenWindows((prev) => {
          const updated = new Map(prev);
          updated.delete(screenId);
          return updated;
        });
        unregisterOpenScreenTab(screenId);
      }
    }, 1000);
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
          onOpenCamera={openCamera}
          onOpenScreen={openScreen}
          openScreenTabs={openScreenTabs}
        />
      ))}
    </div>
  );
}

interface ScreenCardProps {
  screen: Screen;
  order: number;
  onOpenCamera: (cameraId: number, e: React.MouseEvent) => void;
  onOpenScreen: (screenId: number, e: React.MouseEvent) => void;
  openScreenTabs?: Set<number>;
}

function ScreenCard({
  screen,
  order,
  onOpenCamera,
  onOpenScreen,
  openScreenTabs = new Set(),
}: ScreenCardProps) {
  const { theme } = useTheme();
  const { isCameraFloating } = useFloatingCamera();
  const isLightTheme = theme === "light";
  const isActive = screen.connectionStatus === "Online";
  const isCameraFloatingState = !!screen.cameraId && isCameraFloating(screen.cameraId);
  const isScreenOpen = openScreenTabs.has(screen.id);

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
        {/* MIRROR PLAYER - يعرض بالضبط ما تعرضه الشاشة الأصلية */}
        <MirrorPlayer screenId={screen.id} isScreenOpen={isScreenOpen} />
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
