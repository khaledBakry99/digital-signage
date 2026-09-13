"use client";

import type { ReactElement } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { ActiveScenarioType } from "@/lib/types/screen";

interface ActiveScenarioIndicatorProps {
  scenario: ActiveScenarioType;
  campaignName?: string;
  cameraName?: string;
  lastUpdated?: Date;
}

interface ScenarioTheme {
  label: string;
  description: string;
  icon: ReactElement;
  darkBackground: string;
  lightBackground: string;
  darkAccent: string;
  lightAccent: string;
}

const SCENARIO_THEMES: Record<ActiveScenarioType, ScenarioTheme> = {
  campaign: {
    label: "حملة إعلانية نشطة",
    description: "",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
    darkBackground: "linear-gradient(135deg, rgba(67,56,202,0.95), rgba(147,51,234,0.9))",
    lightBackground: "linear-gradient(135deg, rgba(224,231,255,0.95), rgba(248,232,255,0.9))",
    darkAccent: "rgba(139,92,246,0.45)",
    lightAccent: "rgba(129,140,248,0.25)",
  },
  ai: {
    label: "تحليل ذكي نشط",
    description: "",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    darkBackground: "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(6,78,59,0.9))",
    lightBackground: "linear-gradient(135deg, rgba(187,247,208,0.95), rgba(224,255,247,0.9))",
    darkAccent: "rgba(45,212,191,0.35)",
    lightAccent: "rgba(16,185,129,0.25)",
  },
  default: {
    label: "عرض افتراضي",
    description: "",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    darkBackground: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(51,65,85,0.9))",
    lightBackground: "linear-gradient(135deg, rgba(248,250,252,0.9), rgba(224,231,255,0.95))",
    darkAccent: "rgba(148,163,184,0.35)",
    lightAccent: "rgba(148,163,184,0.25)",
  },
};

export default function ActiveScenarioIndicator({
  scenario,
  campaignName,
  cameraName,
  lastUpdated,
}: ActiveScenarioIndicatorProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const scenarioTheme = SCENARIO_THEMES[scenario] || SCENARIO_THEMES.default;

  const getDescription = () => {
    if (scenario === "campaign") {
      return campaignName || "حملة مجدولة";
    }
    if (scenario === "ai") {
      return cameraName ? `الكاميرا: ${cameraName}` : "عبر الكاميرا";
    }
    return "محتوى محدد مسبقاً";
  };



  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border shadow-lg ${isLightTheme ? "border-white/60 shadow-[0_25px_70px_rgba(15,23,42,0.08)]" : "border-white/10"}`}
      style={{ background: isLightTheme ? scenarioTheme.lightBackground : scenarioTheme.darkBackground, backdropFilter: isLightTheme ? "blur(20px)" : undefined }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(circle at top left, ${isLightTheme ? scenarioTheme.lightAccent : scenarioTheme.darkAccent}, transparent 45%)`,
        }}
      />
      <div
        className={`absolute -right-10 top-0 w-56 h-56 rounded-full blur-3xl ${isLightTheme ? "bg-white/70 opacity-40" : "bg-white/10 opacity-20"
          }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
        <div className={`flex items-center gap-4 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
          <div className={`p-3 rounded-2xl backdrop-blur-md shadow-inner ${isLightTheme ? "bg-white/80 border border-white/60" : "bg-white/15"}`}>
            {scenarioTheme.icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">{scenarioTheme.label}</h3>
            <p className={`${isLightTheme ? "text-slate-600" : "text-white/80"} text-sm`}>{getDescription()}</p>
          </div>
        </div>

        <div className={`flex flex-col items-start md:items-end gap-2 ${isLightTheme ? "text-slate-600" : "text-white/80"}`}>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${isLightTheme ? "bg-white/80 border-white/70" : "bg-white/15 border-white/10"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            نشط حالياً
          </div>

        </div>
      </div>
    </div>
  );
}
