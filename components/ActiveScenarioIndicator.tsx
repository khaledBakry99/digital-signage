"use client";

import type { ActiveScenarioType } from "@/lib/types/screen";

interface ActiveScenarioIndicatorProps {
  scenario: ActiveScenarioType;
  campaignName?: string;
  cameraName?: string;
  lastUpdated?: Date;
}

export default function ActiveScenarioIndicator({
  scenario,
  campaignName,
  cameraName,
  lastUpdated,
}: ActiveScenarioIndicatorProps) {
  const getScenarioConfig = () => {
    switch (scenario) {
      case "campaign":
        return {
          label: "حملة إعلانية نشطة",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          ),
          color: "bg-gradient-to-r from-indigo-500 to-purple-500",
          textColor: "text-white",
          borderColor: "border-indigo-400",
          description: campaignName || "حملة مجدولة",
        };
      case "ai":
        return {
          label: "تحليل ذكي نشط",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          ),
          color: "bg-gradient-to-r from-emerald-500 to-teal-500",
          textColor: "text-white",
          borderColor: "border-emerald-400",
          description: cameraName ? `الكاميرا: ${cameraName}` : "عبر الكاميرا",
        };
      case "default":
      default:
        return {
          label: "عرض افتراضي",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          ),
          color: "bg-gradient-to-r from-slate-500 to-slate-600",
          textColor: "text-white",
          borderColor: "border-slate-400",
          description: "محتوى محدد مسبقاً",
        };
    }
  };

  const config = getScenarioConfig();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) {
      return `منذ ${diffSec} ثانية`;
    } else if (diffMin < 60) {
      return `منذ ${diffMin} دقيقة`;
    } else if (diffHour < 24) {
      return `منذ ${diffHour} ساعة`;
    } else {
      return date.toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div
      className={`${config.color} ${config.textColor} rounded-2xl p-5 shadow-lg border ${config.borderColor} animate-fade-in`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg">{config.label}</h3>
            <p className="text-sm opacity-90">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-semibold">نشط</span>
        </div>
      </div>

    </div>
  );
}
