"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScreenGrid from "@/components/ScreenGrid";
import { useScreensWithHeartbeat } from "@/lib/hooks/useScreensWithHeartbeat";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { dashboardApi, ScreensStats } from "@/lib/api/dashboard.api";
import { extractApiError } from "@/lib/api/client";
import { refreshAllScreensDefaultMedia } from "@/lib/screens/screenControl";

export default function ScreensPage() {
  const { clientId } = useAuth();
  const { screens, loading, error, openScreenTabs } = useScreensWithHeartbeat(clientId);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [screensStats, setScreensStats] = useState<ScreensStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchScreensStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await dashboardApi.getScreensStats(clientId);
        setScreensStats(data);
      } catch (err) {
        setStatsError("Failed to load screens statistics");
        console.error("Error fetching screens stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchScreensStats();
  }, [clientId]);


  const handleResetOpenTabs = () => {
    // Send close message to all open screen tabs
    const channel = new BroadcastChannel('screen-tabs');
    channel.postMessage('close-all-tabs');
    channel.close();

    // Wait a moment for tabs to close, then clear localStorage
    setTimeout(() => {
      localStorage.removeItem('openScreenTabs');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('screen-heartbeat-')) {
          localStorage.removeItem(key);
        }
      });
      setShowConfirmDialog(false);
      window.location.reload();
    }, 500);
  };

  const handleSyncAllScreens = async () => {
    if (screens.length === 0 || isSyncingAll) return;
    setIsSyncingAll(true);
    setSyncMessage(null);

    try {
      await refreshAllScreensDefaultMedia(screens.map((screen) => screen.id));
      setSyncMessage({
        type: "success",
        text: "تمت مزامنة جميع الشاشات بالمحتوى الافتراضي.",
      });
    } catch (error) {
      setSyncMessage({
        type: "error",
        text: extractApiError(error, "فشلت مزامنة جميع الشاشات"),
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const heroContainerClass = isLightTheme
    ? "relative mb-8 overflow-hidden rounded-[32px] border border-white/60 shadow-[0_35px_95px_rgba(15,23,42,0.12)]"
    : "relative mb-8 overflow-hidden rounded-[32px] border border-white/5 shadow-[0_35px_95px_rgba(2,6,23,0.65)]";

  const heroContainerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(249,252,255,0.95), rgba(222,231,255,0.9))",
      backdropFilter: "blur(30px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(21,27,51,0.85), rgba(15,18,34,0.95))",
    };

  const statsCardClass = isLightTheme
    ? "relative overflow-hidden rounded-[24px] border border-white/50 p-5 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
    : "relative overflow-hidden rounded-[24px] border border-white/10 p-5 bg-white/5 backdrop-blur-sm";

  const stats = [
    {
      label: "إجمالي الشاشات",
      value: screensStats?.totalScreens ?? 0,
      accent: "#818cf8",
      tint: "linear-gradient(135deg, rgba(216,226,255,0.92), rgba(237,247,255,0.85))",
    },
    {
      label: "نشطة",
      value: screensStats?.connectedScreens ?? 0,
      accent: "#34d399",
      tint: "linear-gradient(135deg, rgba(209,250,229,0.92), rgba(224,242,254,0.85))",
    },
    {
      label: "خاملة",
      value: screensStats?.disconnectedScreens ?? 0,
      accent: "#94a3b8",
      tint: "linear-gradient(135deg, rgba(226,232,240,0.92), rgba(241,245,249,0.9))",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className={heroContainerClass} style={heroContainerStyle}>
        <div
          className="absolute inset-0 opacity-30"
          style={
            isLightTheme
              ? { background: "radial-gradient(circle at top left, rgba(255,255,255,0.65), transparent 55%)" }
              : { background: "radial-gradient(circle at top left, rgba(99,102,241,0.25), transparent 50%)" }
          }
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 lg:p-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text-modern">الشاشات</span>
            </h1>

          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSyncAllScreens}
              disabled={isSyncingAll || screens.length === 0}
              className="flex items-center gap-2 rounded-md border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              title="تحديث جميع الشاشات بالمحتوى الافتراضي من الخادم"
            >
              <svg className={`h-5 w-5 ${isSyncingAll ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5.1 15a7 7 0 0011.2 2.1L20 14M4 10l3.7-3.1A7 7 0 0118.9 9" />
              </svg>
              {isSyncingAll ? "جارٍ المزامنة..." : "مزامنة جميع الشاشات"}
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
              }}
              title="إغلاق جميع الشاشات المفتوحة"
            >
              اغلاق جميع الشاشات
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
            <Link
              href="/screens/manage"
              className="btn-primary cursor-pointer active:scale-95 transition-transform flex items-center gap-2"
            >
              <span>إدارة الشاشات</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
          {statsLoading ? (
            // Skeleton for stats cards
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={statsCardClass}
                  style={
                    isLightTheme
                      ? { background: "linear-gradient(135deg, rgba(226,232,240,0.92), rgba(241,245,249,0.9))" }
                      : undefined
                  }
                >
                  <div className="animate-pulse">
                    <div
                      className={`h-3 w-20 rounded mb-3 ${isLightTheme ? "bg-slate-300/60" : "bg-white/10"
                        }`}
                    />
                    <div
                      className={`h-8 w-12 rounded ${isLightTheme ? "bg-slate-300/60" : "bg-white/10"
                        }`}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Actual stats cards
            <>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={statsCardClass}
                  style={isLightTheme ? { background: stat.tint } : undefined}
                >
                  <p className={`${isLightTheme ? "text-slate-500" : "text-white/60"} text-xs font-semibold mb-2`}>
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black" style={{ color: stat.accent }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {(error || statsError) && (
        <div
          className="mb-6 p-4 rounded-xl animate-fade-in"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error || statsError}
        </div>
      )}

      {syncMessage && (
        <div
          className="mb-6 border px-4 py-3 text-sm"
          style={{
            borderColor: syncMessage.type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
            background: syncMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: syncMessage.type === "success" ? "#34d399" : "#f87171",
          }}
        >
          {syncMessage.text}
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
          <div
            className="relative z-10 p-6 rounded-2xl max-w-md w-full animate-fade-in"
            style={{
              background: isLightTheme ? "rgba(255,255,255,0.95)" : "rgba(15,23,42,0.95)",
              border: isLightTheme ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                <svg className="w-6 h-6" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                إغلاق الشاشات  المفتوحة
              </h3>
            </div>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              سيتم اغلاق جميع الشاشات المفتوحة وإعادة تحميل الصفحة. هذا سيؤدي إلى تفعيل جميع أزرار &quot;فتح الشاشة&quot;.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                  border: isLightTheme ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-primary)",
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleResetOpenTabs}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                }}
              >
                تأكيد إعادة التعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass p-6 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-16" />
                  </div>
                </div>
                <div className="h-6 bg-white/5 rounded-full w-12" />
              </div>
              <div className="h-44 bg-white/5 rounded-xl" />
              <div className="h-10 bg-indigo-500/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <ScreenGrid screens={screens} openScreenTabs={openScreenTabs} />
      )}
    </div>
  );
}
