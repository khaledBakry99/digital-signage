"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useScreenAssignment } from "@/lib/hooks/useScreenAssignment";
import { useTheme } from "@/lib/context/ThemeContext";
import { cameraApi } from "@/lib/api/camera.api";
import ActiveScenarioIndicator from "@/components/ActiveScenarioIndicator";
import CurrentMediaDisplay from "@/components/CurrentMediaDisplay";
import CampaignAssignmentSection from "@/components/CampaignAssignmentSection";
import MediaSlotAssignment from "@/components/MediaSlotAssignment";
import CameraAssignmentSection from "@/components/CameraAssignmentSection";
import type { ActiveScenarioType } from "@/lib/types/screen";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ScreenManagePage({ params }: PageProps) {
  const { id } = use(params);
  const screenId = parseInt(id, 10);
  const { clientId } = useAuth();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [cameraName, setCameraName] = useState<string | null>(null);

  const {
    screen,
    mediaSlots,
    activeCampaign,
    currentMedia,
    loading,
    error,
    assignCampaign,
    removeCampaign,
    assignMediaSlot,
    removeMediaSlot,
    assignCamera,
    removeCamera,
    toggleAI,
    refresh,
  } = useScreenAssignment(screenId);

  // Fetch camera name when screen has a camera
  useEffect(() => {
    const fetchCameraName = async () => {
      if (screen?.cameraId) {
        try {
          const camera = await cameraApi.getById(screen.cameraId);
          setCameraName(camera.name);
        } catch (err) {
          setCameraName(null);
        }
      } else {
        setCameraName(null);
      }
    };
    fetchCameraName();
  }, [screen?.cameraId]);

  // Determine active scenario
  const getActiveScenario = (): {
    type: ActiveScenarioType;
    campaignName?: string;
    cameraName?: string;
  } => {
    if (activeCampaign?.ruleApplied && activeCampaign.campaign) {
      return {
        type: "campaign",
        campaignName: activeCampaign.campaign.name,
      };
    } else if (screen?.aiEnabled && screen?.cameraEnabled && screen?.cameraId) {
      return {
        type: "ai",
        cameraName: cameraName || "كاميرا غير معروفة",
      };
    } else {
      return {
        type: "default",
      };
    }
  };

  const activeScenario = getActiveScenario();

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/5 rounded w-1/3" />
          <div className="h-64 bg-white/5 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-white/5 rounded" />
            <div className="h-96 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div
          className="p-6 rounded-xl"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="glass p-16 text-center">
          <p style={{ color: "var(--text-muted)" }}>الشاشة غير موجودة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {isLightTheme ? (
          <>
            <div className="absolute -top-[12%] -left-[5%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ background: "rgba(147,197,253,0.35)" }} />
            <div className="absolute top-[30%] -right-[10%] w-[40%] h-[35%] rounded-full blur-[140px]" style={{ background: "rgba(191,219,254,0.4)" }} />
            <div className="absolute bottom-[5%] left-[20%] w-[30%] h-[30%] rounded-full blur-[110px]" style={{ background: "rgba(196,181,253,0.35)" }} />
          </>
        ) : (
          <>
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-blue-500/5 blur-[80px] rounded-full" />
          </>
        )}
      </div>

      {/* Header */}
      <div
        className={`relative mb-8 overflow-hidden rounded-[32px] border animate-fade-in ${isLightTheme
          ? "border-white/60 shadow-[0_35px_95px_rgba(15,23,42,0.12)]"
          : "border-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)]"
          }`}
        style={
          isLightTheme
            ? {
              background: "linear-gradient(135deg, rgba(249,252,255,0.95), rgba(230,240,255,0.9))",
              backdropFilter: "blur(30px)",
            }
            : {
              background: "linear-gradient(135deg, rgba(63,76,119,0.45), rgba(32,18,101,0.75))",
            }
        }
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 55%)"
              : "radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 45%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 blur-3xl opacity-50"
          style={{
            background: isLightTheme
              ? "linear-gradient(180deg, rgba(167,139,250,0.35), rgba(59,130,246,0.15))"
              : "linear-gradient(180deg, rgba(99,102,241,0.6), rgba(14,165,233,0.2))",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 lg:p-8">
          <div>
            <h1 className={`text-3xl lg:text-4xl font-extrabold mb-2 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
              {screen.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`px-3 py-1 rounded-full border ${isLightTheme
                  ? "bg-white/70 border-white/80 text-slate-600"
                  : "bg-white/10 border-white/15 text-white/80"
                  }`}
              >
                {screen.city || "مدينة غير محددة"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${screen.connectionStatus === "Online"
                  ? isLightTheme
                    ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : isLightTheme
                    ? "bg-rose-100 text-rose-600 border border-rose-200"
                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}
              >
                {screen.connectionStatus === "Online" ? "متصلة" : "غير متصلة"}
              </span>

            </div>
          </div>

          <Link
            href="/screens/manage"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all ${isLightTheme
              ? "bg-gradient-to-r from-slate-50 to-white border border-slate-200 text-slate-700 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]"
              : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)]"
              }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>رجوع لإدارة الشاشات</span>
          </Link>
        </div>
      </div>

      {/* Active Scenario Indicator */}
      <div className="mb-6">
        <ActiveScenarioIndicator
          scenario={activeScenario.type}
          campaignName={activeScenario.campaignName}
          cameraName={activeScenario.cameraName}
          lastUpdated={new Date()}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Campaign Assignment */}
          <CampaignAssignmentSection
            screenId={screenId}
            clientId={clientId || 0}
            onUpdate={refresh}
          />

          {/* Camera Assignment */}
          <CameraAssignmentSection
            screenId={screenId}
            clientId={clientId || 0}
            currentCameraId={screen.cameraId}
            aiEnabled={screen.aiEnabled}
            onAssignCamera={assignCamera}
            onRemoveCamera={removeCamera}
            onToggleAI={toggleAI}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Media Display */}
          <CurrentMediaDisplay
            screenId={screenId}
            autoRefresh={true}
            refreshInterval={10000}
            activeCampaignName={activeCampaign?.campaign?.name}
            fallbackCampaignId={activeCampaign?.campaign?.id || screen.currentCampaignId}
          />

          {/* Screen Info Card */}
          <div
            className={`relative overflow-hidden rounded-[28px] border p-6 lg:p-7 animate-fade-in ${isLightTheme
              ? "border-white/60 shadow-[0_35px_95px_rgba(15,23,42,0.08)]"
              : "border-white/5 bg-gradient-to-br from-[#0f172a] via-[#111c35] to-[#0b1424] shadow-lg"
              }`}
            style={
              isLightTheme
                ? {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(233,244,255,0.92))",
                  backdropFilter: "blur(20px)",
                }
                : undefined
            }
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: isLightTheme
                  ? "radial-gradient(circle at bottom right, rgba(147,197,253,0.25), transparent 55%)"
                  : "radial-gradient(circle at bottom right, rgba(56,189,248,0.15), transparent 50%)",
              }}
            />

            <div className="relative z-10">
              <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isLightTheme ? "text-indigo-800" : "text-white"}`}>
                <svg className={`w-5 h-5 ${isLightTheme ? "text-sky-500" : "text-sky-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                معلومات الشاشة
              </h3>

              <div className="space-y-4 text-sm">
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border ${isLightTheme ? "bg-gradient-to-r from-white/85 to-sky-50 border-white/70" : "bg-white/5 border-white/5"
                    }`}
                >
                  <span className={isLightTheme ? "text-slate-600" : "text-white/60"}>حالة الاتصال</span>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isLightTheme ? "bg-white/95 border-white/70" : "bg-black/20 border-white/10"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${screen.connectionStatus === "Online" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${screen.connectionStatus === "Online" ? "text-emerald-400" : "text-rose-400"}`}>
                      {screen.connectionStatus === "Online" ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border ${isLightTheme ? "bg-gradient-to-r from-white/85 via-indigo-50/60 to-white/85 border-white/70" : "bg-white/5 border-white/5"
                    }`}
                >
                  <span className={isLightTheme ? "text-slate-600" : "text-white/60"}>الحالة التشغيلية</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-[11px] border uppercase tracking-widest ${isLightTheme ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-indigo-500/15 text-white border-indigo-500/30"
                      }`}
                  >
                    {screen.operationalStatus}
                  </span>
                </div>

                {screen.locationName && (
                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl border ${isLightTheme ? "bg-gradient-to-r from-white/85 to-cyan-50 border-white/70" : "bg-white/5 border-white/5"
                      }`}
                  >
                    <span className={isLightTheme ? "text-slate-600" : "text-white/60"}>الموقع الحالي</span>
                    <span className={isLightTheme ? "text-slate-800 font-semibold" : "text-white font-medium"}>
                      {screen.locationName}
                      {screen.city && <span className={isLightTheme ? "text-slate-400 mx-1" : "text-white/40 mx-1"}>/</span>}
                      {screen.city}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-2xl border flex flex-col gap-1 ${isLightTheme ? "bg-gradient-to-br from-white/85 to-emerald-50 border-white/70" : "bg-white/5 border-white/5"
                      }`}
                  >
                    <span className={`text-[10px] uppercase tracking-widest ${isLightTheme ? "text-slate-400" : "text-white/40"}`}>
                      Camera
                    </span>
                    <span className={`font-bold ${screen.cameraEnabled ? "text-emerald-500" : isLightTheme ? "text-slate-500" : "text-white/60"}`}>
                      {screen.cameraEnabled ? "مفعّلة" : "معطّلة"}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border flex flex-col gap-1 ${isLightTheme ? "bg-gradient-to-br from-white/85 to-purple-50 border-white/70" : "bg-white/5 border-white/5"
                      }`}
                  >
                    <span className={`text-[10px] uppercase tracking-widest ${isLightTheme ? "text-slate-400" : "text-white/40"}`}>
                      AI Engine
                    </span>
                    <span className={`font-bold ${screen.aiEnabled ? "text-emerald-500" : isLightTheme ? "text-slate-500" : "text-white/60"}`}>
                      {screen.aiEnabled ? "نشط" : "متوقف"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Slots - Full Width */}
      <div className="mt-6">
        <MediaSlotAssignment
          screenId={screenId}
          clientId={clientId || 0}
          currentSlots={mediaSlots}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
