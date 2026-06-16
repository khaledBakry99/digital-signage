"use client";

import { useRouter } from "next/navigation";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useState, useEffect, useCallback } from "react";
import { indexedDBService } from "@/lib/storage/indexedDB";
import type { Screen } from "@/lib/types/screen";

interface ScreenGridProps {
  screens: Screen[];
}

/**
 * Convert indexeddb:// URLs to displayable blob URLs.
 */
async function resolveBlobUrl(fileUrl: string): Promise<string> {
  if (!fileUrl.startsWith("indexeddb://")) return fileUrl;
  const fileId = fileUrl.replace("indexeddb://", "");
  const file = await indexedDBService.getFile(fileId);
  if (!file) throw new Error("الملف غير موجود");
  return URL.createObjectURL(file);
}

function ScreenPreview({
  adFileUrl,
  adType,
}: {
  adFileUrl: string;
  adType: "image" | "video";
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    resolveBlobUrl(adFileUrl)
      .then((resolvedUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(resolvedUrl);
          return;
        }
        url = resolvedUrl;
        setBlobUrl(resolvedUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [adFileUrl]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          فشل تحميل الإعلان
        </p>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="inline-block w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (adType === "image") {
    return (
      <img
        src={blobUrl}
        alt="معاينة الإعلان"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <video
      src={blobUrl}
      className="w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      onError={() => setError(true)}
    />
  );
}

export default function ScreenGrid({ screens }: ScreenGridProps) {
  const router = useRouter();
  const { advertisements } = useAdvertisements();
  const [openCameraTabs, setOpenCameraTabs] = useState<Set<number>>(new Set());

  // Track opened camera tabs via localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('openCameraTabs');
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setOpenCameraTabs(new Set(ids));
        } catch {
          setOpenCameraTabs(new Set());
        }
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const openCamera = useCallback((cameraId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Update local list of open tabs
    const stored = localStorage.getItem('openCameraTabs');
    const currentOpen = stored ? JSON.parse(stored) : [];
    if (!currentOpen.includes(cameraId)) {
      currentOpen.push(cameraId);
      localStorage.setItem('openCameraTabs', JSON.stringify(currentOpen));
      setOpenCameraTabs(new Set(currentOpen));
    }

    // Open camera in a new tab
    window.open(`/cameras/${cameraId}`, '_blank');
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
      {screens.map((screen, i) => {
        const isActive = screen.connectionStatus === "Online";
        const ad = advertisements.find((a) => a.id === screen.currentMediaAssetId);

        return (
          <div
            key={screen.id}
            onClick={() => router.push(`/screens/${screen.id}`)}
            className="glass glass-hover animate-fade-in cursor-pointer p-6 group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{
                    background: isActive
                      ? "rgba(16,185,129,0.15)"
                      : "var(--bg-secondary)",
                    color: isActive ? "#34d399" : "var(--text-muted)",
                    border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                  }}
                >
                  {screen.id}
                </div>
                <div>
                  <p
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {screen.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {screen.lastHeartbeatAtUtc ? new Date(screen.lastHeartbeatAtUtc).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "غير متصل"}
                  </p>
                </div>
              </div>
              <span
                className={`badge ${isActive ? "badge-green" : "badge-gray"}`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
                {isActive ? "نشط" : "خامل"}
              </span>
            </div>

            {/* Screen preview area - عرض الإعلان الفعلي */}
            <div
              className="rounded-xl mb-4 overflow-hidden relative"
              style={{
                height: "180px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {isActive && ad ? (
                <>
                  <ScreenPreview adFileUrl={ad.url} adType={ad.type.toLowerCase() as "image" | "video"} />
                  {/* معلومات الإعلان فوق المعاينة */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "white" }}
                    >
                      {ad.name}
                    </p>
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
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      لا يوجد إعلان
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {/* Open Screen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/screens/${screen.id}`, "_blank");
                }}
                className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "#818cf8",
                }}
                title="فتح الشاشة في تبويب جديد"
              >
                فتح الشاشة ←
              </button>

              {/* Open Camera Button */}
              {screen.cameraId && (
                <button
                  onClick={(e) => openCamera(screen.cameraId!, e)}
                  disabled={openCameraTabs.has(screen.cameraId)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: openCameraTabs.has(screen.cameraId)
                      ? "rgba(100,116,139,0.15)"
                      : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
                    border: openCameraTabs.has(screen.cameraId)
                      ? "1px solid rgba(100,116,139,0.2)"
                      : "1px solid rgba(16,185,129,0.3)",
                    color: openCameraTabs.has(screen.cameraId) ? "#94a3b8" : "#34d399",
                  }}
                  title={openCameraTabs.has(screen.cameraId) ? "الكاميرا مفتوحة بالفعل" : "فتح الكاميرا المربوطة"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
      })}
    </div>
  );
}
