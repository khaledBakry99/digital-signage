"use client";

import { useTheme } from "@/lib/context/ThemeContext";
import { Screen } from "@/lib/types/screen";

interface ScreenStatusDisplayProps {
  screens: Screen[];
  loading: boolean;
}

export default function ScreenStatusDisplay({ screens, loading }: ScreenStatusDisplayProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-36 rounded-2xl bg-slate-800/40 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (screens.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm">لا توجد شاشات مسجلة حالياً</p>
        <p className="text-xs text-slate-500 mt-1">توجه إلى إدارة الشاشات لإضافة شاشتك الأولى</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {screens.map((screen) => {
        const isActive = screen.connectionStatus === "Online";
        return (
          <div
            key={screen.id}
            className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300"
            style={{
              background: "rgba(15,23,42,0.3)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* Screen Orb */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.15), rgba(100,116,139,0.05))",
                border: `2px solid ${isActive ? "rgba(16,185,129,0.4)" : "rgba(100,116,139,0.3)"}`,
                boxShadow: isActive ? "0 0 25px rgba(16,185,129,0.12)" : "none",
              }}
            >
              {/* Pulse Ring for Active */}
              {isActive && (
                <span
                  className="absolute inset-[-3px] rounded-full animate-ping opacity-15"
                  style={{ border: "2px solid rgba(16,185,129,0.4)" }}
                />
              )}

              {/* Inner Circle with ID */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))"
                    : "linear-gradient(135deg, rgba(100,116,139,0.2), rgba(100,116,139,0.05))",
                  color: isActive ? "#34d399" : "#64748b",
                  border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`,
                }}
              >
                {screen.id}
              </div>

              {/* Status Indicator Dot */}
              <span
                className={`absolute bottom-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isActive ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </div>

            {/* Screen Name */}
            <div className="w-full text-center">
              <p className="text-sm font-semibold text-white text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                {screen.name}
              </p>
            </div>

            {/* Status Badge */}
            <span
              className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-500/15 text-slate-400 border border-slate-500/20"
              }`}
            >
              {isActive ? "متصل" : "غير متصل"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
