"use client";

import Link from "next/link";
import ScreenGrid from "@/components/ScreenGrid";
import { useScreens } from "@/lib/hooks/useScreens";
import { useTheme } from "@/lib/context/ThemeContext";

export default function ScreensPage() {
  const { screens, loading, error } = useScreens();
  const active = screens.filter((s) => s.connectionStatus === "Online").length;
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

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
      value: screens.length,
      accent: "#818cf8",
      tint: "linear-gradient(135deg, rgba(216,226,255,0.92), rgba(237,247,255,0.85))",
    },
    {
      label: "نشطة",
      value: active,
      accent: "#34d399",
      tint: "linear-gradient(135deg, rgba(209,250,229,0.92), rgba(224,242,254,0.85))",
    },
    {
      label: "خاملة",
      value: screens.length - active,
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
            <p className={`text-lg ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
              {active} شاشة نشطة من أصل {screens.length}
            </p>
          </div>
          <Link
            href="/screens/manage"
            className="btn-primary cursor-pointer active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>إدارة الشاشات</span>
          </Link>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
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
        </div>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-xl animate-fade-in"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <ScreenGrid screens={screens} />
      )}
    </div>
  );
}
