"use client";

import { useRouter } from "next/navigation";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useState, useEffect } from "react";
import { indexedDBService } from "@/lib/storage/indexedDB";
import type { Screen } from "@/lib/types/screen";

interface ScreenGridProps {
  screens: Screen[];
}

/**
 * تحويل indexeddb:// URL إلى Blob URL قابل للعرض
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

            {/* Open button */}
            <div
              className="w-full py-2.5 rounded-xl text-center text-sm font-semibold transition-all group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#818cf8",
              }}
            >
              فتح الشاشة ←
            </div>
          </div>
        );
      })}
    </div>
  );
}
