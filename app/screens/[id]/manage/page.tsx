"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useScreenAssignment } from "@/lib/hooks/useScreenAssignment";
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
      // في الحقيقة نحتاج اسم الكاميرا، لكن ليس لدينا هذه البيانات في screen
      return {
        type: "ai",
        cameraName: `كاميرا #${screen.cameraId}`,
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm animate-fade-in" style={{ color: "var(--text-muted)" }}>
        <Link href="/screens" className="hover:text-indigo-400 transition-colors">
          الشاشات
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span style={{ color: "var(--text-primary)" }}>{screen.name}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span style={{ color: "var(--text-primary)" }}>إدارة الربط</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">{screen.name}</span>
            </h1>
            {screen.externalId && (
              <span className="px-3 py-1 rounded-lg bg-white/5 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                {screen.externalId}
              </span>
            )}
          </div>
          <p style={{ color: "var(--text-muted)" }}>إدارة الحملات والوسائط والكاميرات</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/screens/${screenId}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:bg-white/5"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            عرض الشاشة
          </Link>

          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:bg-indigo-500/10"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            تحديث
          </button>
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
            currentCampaignId={screen.currentCampaignId}
            onAssignCampaign={assignCampaign}
            onRemoveCampaign={removeCampaign}
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
          <CurrentMediaDisplay screenId={screenId} autoRefresh={true} refreshInterval={10000} />

          {/* Screen Info Card */}
          <div className="glass p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              معلومات الشاشة
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>حالة الاتصال</span>
                <span
                  className={`badge ${
                    screen.connectionStatus === "Online" ? "badge-green" : "badge-gray"
                  }`}
                >
                  {screen.connectionStatus === "Online" ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      متصلة
                    </>
                  ) : (
                    "خاملة"
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>الحالة التشغيلية</span>
                <span style={{ color: "var(--text-primary)" }} className="font-semibold">
                  {screen.operationalStatus}
                </span>
              </div>

              {screen.locationName && (
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-muted)" }}>الموقع</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {screen.locationName}
                    {screen.city && `, ${screen.city}`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>الكاميرا</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {screen.cameraEnabled ? "مفعّلة" : "معطّلة"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>الذكاء الاصطناعي</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {screen.aiEnabled ? "مفعّل" : "معطّل"}
                </span>
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
          onUpdate={assignMediaSlot}
          onRemove={removeMediaSlot}
        />
      </div>
    </div>
  );
}
