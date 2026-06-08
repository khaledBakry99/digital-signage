"use client";

import { useState, useEffect } from "react";
import { screenApi } from "@/lib/api/screen.api";
import type { ScreenCurrentMedia } from "@/lib/types/screen";

interface CurrentMediaDisplayProps {
  screenId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function CurrentMediaDisplay({
  screenId,
  autoRefresh = true,
  refreshInterval = 10000,
}: CurrentMediaDisplayProps) {
  const [currentMedia, setCurrentMedia] = useState<ScreenCurrentMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTimerTick] = useState(0); // Force re-render every second

  const fetchCurrentMedia = async () => {
    try {
      const data = await screenApi.getCurrentMedia(screenId);
      setCurrentMedia(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch current media:", err);
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

  const getActiveSlotInfo = () => {
    if (!currentMedia) return null;

    // Determine which slot is currently active
    if (currentMedia.currentMenMediaAssetId) {
      return {
        slot: "رجال",
        slotEn: "Men",
        mediaId: currentMedia.currentMenMediaAssetId,
        url: currentMedia.currentMenMediaUrl,
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    } else if (currentMedia.currentWomenMediaAssetId) {
      return {
        slot: "نساء",
        slotEn: "Women",
        mediaId: currentMedia.currentWomenMediaAssetId,
        url: currentMedia.currentWomenMediaUrl,
        color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      };
    } else if (currentMedia.currentBoysKidsMediaAssetId) {
      return {
        slot: "أطفال ذكور",
        slotEn: "BoysKids",
        mediaId: currentMedia.currentBoysKidsMediaAssetId,
        url: currentMedia.currentBoysKidsMediaUrl,
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      };
    } else if (currentMedia.currentGirlsKidsMediaAssetId) {
      return {
        slot: "أطفال إناث",
        slotEn: "GirlsKids",
        mediaId: currentMedia.currentGirlsKidsMediaAssetId,
        url: currentMedia.currentGirlsKidsMediaUrl,
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    } else if (currentMedia.currentDefaultMediaAssetId) {
      return {
        slot: "افتراضي",
        slotEn: "Default",
        mediaId: currentMedia.currentDefaultMediaAssetId,
        url: currentMedia.currentDefaultMediaUrl,
        color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
    } else if (currentMedia.currentMediaAssetId) {
      return {
        slot: "محتوى عام",
        slotEn: "General",
        mediaId: currentMedia.currentMediaAssetId,
        url: currentMedia.url,
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      };
    }

    return null;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) {
      return "الآن";
    } else if (diffSec < 60) {
      return `منذ ${diffSec} ثانية`;
    } else {
      const diffMin = Math.floor(diffSec / 60);
      return `منذ ${diffMin} دقيقة`;
    }
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

  return (
    <div className="glass p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          المحتوى المعروض حالياً
        </h3>

        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{formatTimestamp(lastUpdated)}</span>
          </div>
        )}
      </div>

      {activeSlot ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${activeSlot.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  فئة الجمهور النشطة
                </p>
                <p className="text-lg font-bold">{activeSlot.slot}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs font-mono text-slate-400">#{activeSlot.mediaId}</p>
              </div>
            </div>

            {activeSlot.url && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                  رابط الوسيط
                </p>
                <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs font-mono text-slate-300 truncate">{activeSlot.url}</p>
                </div>
              </div>
            )}
          </div>

          {currentMedia && currentMedia.currentCampaignId && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-indigo-300">يتم العرض من خلال حملة إعلانية (ID: {currentMedia.currentCampaignId})</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: "var(--text-muted)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            لا يوجد محتوى نشط حالياً على هذه الشاشة
          </p>
        </div>
      )}
    </div>
  );
}
