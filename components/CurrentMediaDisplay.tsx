"use client";

import { useState, useEffect } from "react";
import { screenApi } from "@/lib/api/screen.api";
import { useTheme } from "@/lib/context/ThemeContext";
import type { ScreenCurrentMedia } from "@/lib/types/screen";

type ActiveSlotKey = "Men" | "Women" | "BoysKids" | "GirlsKids" | "Default" | "General";

interface SlotTheme {
  lightGradient: string;
  darkGradient: string;
  borderLightClass: string;
  borderDarkClass: string;
  labelLightClass: string;
  labelDarkClass: string;
  badgeLightClass: string;
  badgeDarkClass: string;
  dotLightClass: string;
  dotDarkClass: string;
}

const SLOT_THEMES: Record<ActiveSlotKey, SlotTheme> = {
  Men: {
    lightGradient: "linear-gradient(135deg, rgba(191,219,254,0.9), rgba(219,234,254,0.85))",
    darkGradient: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,41,59,0.75))",
    borderLightClass: "border-blue-200",
    borderDarkClass: "border-blue-500/30",
    labelLightClass: "text-blue-700",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-blue-200 text-blue-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-blue-500",
    dotDarkClass: "bg-blue-300",
  },
  Women: {
    lightGradient: "linear-gradient(135deg, rgba(252,231,243,0.95), rgba(251,207,232,0.8))",
    darkGradient: "linear-gradient(135deg, rgba(42,15,32,0.85), rgba(92,12,88,0.65))",
    borderLightClass: "border-pink-200",
    borderDarkClass: "border-pink-500/30",
    labelLightClass: "text-pink-700",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-pink-200 text-pink-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-pink-500",
    dotDarkClass: "bg-pink-300",
  },
  BoysKids: {
    lightGradient: "linear-gradient(135deg, rgba(204,251,241,0.95), rgba(187,247,208,0.85))",
    darkGradient: "linear-gradient(135deg, rgba(9,53,44,0.85), rgba(6,95,70,0.65))",
    borderLightClass: "border-emerald-200",
    borderDarkClass: "border-emerald-500/30",
    labelLightClass: "text-emerald-700",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-emerald-200 text-emerald-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-emerald-500",
    dotDarkClass: "bg-emerald-300",
  },
  GirlsKids: {
    lightGradient: "linear-gradient(135deg, rgba(237,233,254,0.95), rgba(221,214,254,0.85))",
    darkGradient: "linear-gradient(135deg, rgba(49,28,87,0.85), rgba(88,28,135,0.65))",
    borderLightClass: "border-purple-200",
    borderDarkClass: "border-purple-500/30",
    labelLightClass: "text-purple-700",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-purple-200 text-purple-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-purple-500",
    dotDarkClass: "bg-purple-300",
  },
  Default: {
    lightGradient: "linear-gradient(135deg, rgba(241,245,249,0.95), rgba(226,232,240,0.85))",
    darkGradient: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.65))",
    borderLightClass: "border-slate-200",
    borderDarkClass: "border-slate-500/30",
    labelLightClass: "text-slate-800",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-slate-200 text-slate-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-slate-500",
    dotDarkClass: "bg-white/70",
  },
  General: {
    lightGradient: "linear-gradient(135deg, rgba(224,231,255,0.95), rgba(199,210,254,0.85))",
    darkGradient: "linear-gradient(135deg, rgba(41,37,92,0.85), rgba(30,27,75,0.65))",
    borderLightClass: "border-indigo-200",
    borderDarkClass: "border-indigo-500/30",
    labelLightClass: "text-indigo-700",
    labelDarkClass: "text-white",
    badgeLightClass: "bg-white/80 border-indigo-200 text-indigo-600",
    badgeDarkClass: "bg-white/10 border-white/20 text-white/70",
    dotLightClass: "bg-indigo-500",
    dotDarkClass: "bg-indigo-300",
  },
};

interface CurrentMediaDisplayProps {
  screenId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  activeCampaignName?: string;
  fallbackCampaignId?: number;
}

export default function CurrentMediaDisplay({
  screenId,
  autoRefresh = true,
  refreshInterval = 10000,
  activeCampaignName,
  fallbackCampaignId,
}: CurrentMediaDisplayProps) {
  const [currentMedia, setCurrentMedia] = useState<ScreenCurrentMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTimerTick] = useState(0); // Force re-render every second
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const fetchCurrentMedia = async () => {
    try {
      const data = await screenApi.getCurrentMedia(screenId);
      if (data && typeof data === 'object') {
        setCurrentMedia(data);
        setLastUpdated(new Date());
      } else {
        setCurrentMedia(null);
      }
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setCurrentMedia(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMedia();
  }, [screenId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCurrentMedia();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [screenId, autoRefresh, refreshInterval]);

  // Update timer every second to refresh timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const openMediaPreview = (mediaId?: number) => {
    if (!mediaId) return;
    window.open(`/media-assets/${mediaId}`, "_blank", "noopener,noreferrer");
  };

  const MediaPreview = ({
    mediaId,
    url,
  }: {
    mediaId?: number;
    url?: string;
  }) => {
    const [loaded, setLoaded] = useState(false);
    if (!url) {
      return (
        <div className="w-32 h-48 rounded-3xl border border-dashed border-white/15 flex items-center justify-center text-white/40 text-xs">
          لا يوجد وسائط
        </div>
      );
    }

    const isVideo = /(\.mp4|\.mov|\.m4v|\.webm|\.ogg)$/i.test(url.split('?')[0] || "");

    return (
      <button
        type="button"
        onClick={() => openMediaPreview(mediaId)}
        className={`relative w-32 h-48 rounded-3xl overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isVideo ? "border-fuchsia-400/30 bg-fuchsia-500/10" : "border-white/15 bg-white/5"
          }`}
        title="عرض الوسيط"
      >
        {isVideo ? (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            loop
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <img
            src={url}
            alt="media"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        )}

        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.35em] text-white/80 uppercase bg-slate-900/70">
            load
            <span className="block w-8 h-0.5 bg-white/30 animate-pulse" />
          </div>
        )}
      </button>
    );
  };

  const getActiveSlotInfo = () => {
    if (!currentMedia) return null;

    if (currentMedia.currentMenMediaAssetId) {
      return {
        slot: "رجال",
        slotEn: "Men",
        mediaId: currentMedia.currentMenMediaAssetId,
        url: currentMedia.currentMenMediaUrl,
        theme: SLOT_THEMES.Men,
      };
    }
    if (currentMedia.currentWomenMediaAssetId) {
      return {
        slot: "نساء",
        slotEn: "Women",
        mediaId: currentMedia.currentWomenMediaAssetId,
        url: currentMedia.currentWomenMediaUrl,
        theme: SLOT_THEMES.Women,
      };
    }
    if (currentMedia.currentBoysKidsMediaAssetId) {
      return {
        slot: "أطفال ذكور",
        slotEn: "BoysKids",
        mediaId: currentMedia.currentBoysKidsMediaAssetId,
        url: currentMedia.currentBoysKidsMediaUrl,
        theme: SLOT_THEMES.BoysKids,
      };
    }
    if (currentMedia.currentGirlsKidsMediaAssetId) {
      return {
        slot: "أطفال إناث",
        slotEn: "GirlsKids",
        mediaId: currentMedia.currentGirlsKidsMediaAssetId,
        url: currentMedia.currentGirlsKidsMediaUrl,
        theme: SLOT_THEMES.GirlsKids,
      };
    }
    if (currentMedia.currentDefaultMediaAssetId) {
      return {
        slot: "افتراضي",
        slotEn: "Default",
        mediaId: currentMedia.currentDefaultMediaAssetId,
        url: currentMedia.currentDefaultMediaUrl,
        theme: SLOT_THEMES.Default,
      };
    }
    if (currentMedia.currentMediaAssetId) {
      return {
        slot: "محتوى عام",
        slotEn: "General",
        mediaId: currentMedia.currentMediaAssetId,
        url: currentMedia.url,
        theme: SLOT_THEMES.General,
      };
    }

    return null;
  };



  const formatRelativeTime = (date?: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    if (diffSec < 10) return "الآن";
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHour < 24) return `منذ ${diffHour} ساعة`;
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="glass p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  const activeSlot = getActiveSlotInfo();

  const containerClass = `relative overflow-hidden rounded-[28px] border p-6 animate-fade-in ${isLightTheme ? "border-white/60 shadow-[0_25px_90px_rgba(15,23,42,0.07)]" : "border-white/5"
    }`;
  const containerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(235,244,255,0.95), rgba(232,249,255,0.9))",
      backdropFilter: "blur(20px)",
    }
    : undefined;
  const headingColor = isLightTheme ? "text-slate-900" : "text-white";
  const subBadgeClass = isLightTheme ? "bg-white/80 border-white/60 text-slate-600" : "bg-black/30 border-white/10 text-white/70";

  return (
    <div className={containerClass} style={containerStyle}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: isLightTheme
            ? "radial-gradient(circle at top left, rgba(167,216,255,0.35), transparent 55%)"
            : "radial-gradient(circle at top left, rgba(99,102,241,0.35), transparent 50%)",
        }}
      />
      {!isLightTheme && <div className="absolute inset-0 bg-gradient-to-br from-[#111828] via-[#12143a] to-[#1b0f2d] opacity-80" />}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${headingColor}`}>
              <svg className={`w-5 h-5 ${isLightTheme ? "text-indigo-500" : "text-indigo-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              المحتوى المعروض حالياً
            </h3>
          </div>
          {lastUpdated && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${subBadgeClass}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {formatRelativeTime(lastUpdated)}
            </div>
          )}
        </div>

        {activeSlot ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border ${isLightTheme ? activeSlot.theme.borderLightClass : activeSlot.theme.borderDarkClass
                }`}
              style={{
                background: isLightTheme ? activeSlot.theme.lightGradient : activeSlot.theme.darkGradient,
              }}
            >
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${isLightTheme ? activeSlot.theme.badgeLightClass : activeSlot.theme.badgeDarkClass
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isLightTheme ? activeSlot.theme.dotLightClass : activeSlot.theme.dotDarkClass
                    }`}
                />
                فئة الجمهور النشطة
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${isLightTheme ? activeSlot.theme.labelLightClass : activeSlot.theme.labelDarkClass}`}>
                  {activeSlot.slot}
                </p>
              </div>
            </div>

            {currentMedia && (currentMedia.currentCampaignId || activeCampaignName || fallbackCampaignId) && (
              <div
                className={`px-4 py-3 rounded-2xl border flex items-center justify-between ${isLightTheme
                  ? "bg-gradient-to-r from-indigo-100/70 to-purple-100/70 border-indigo-200 text-slate-700"
                  : "border-indigo-500/30 bg-indigo-500/15 text-indigo-50"
                  }`}
              >
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLightTheme ? "bg-white/70 text-indigo-500" : "bg-white/20"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs ${isLightTheme ? "text-indigo-500" : "text-indigo-200"}`}>
                      يتم العرض من خلال حملة إعلانية
                    </p>
                    <p className="font-semibold">
                      {activeCampaignName ||
                        (currentMedia.currentCampaignId || fallbackCampaignId
                          ? `حملة رقم ${currentMedia.currentCampaignId || fallbackCampaignId}`
                          : "—")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`p-10 text-center ${isLightTheme ? "text-slate-500" : "text-white/60"}`}>
            <svg
              className={`w-16 h-16 mx-auto mb-4 opacity-40 ${isLightTheme ? "text-slate-400" : "text-white/40"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            لا يوجد محتوى نشط حالياً على هذه الشاشة
          </div>
        )}
      </div>
    </div>
  );
}
