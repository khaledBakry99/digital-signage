"use client";

import Link from "next/link";
import ScreenGrid from "@/components/ScreenGrid";
import { useScreens } from "@/lib/hooks/useScreens";

export default function ScreensPage() {
  const { screens, loading, error } = useScreens();
  const active = screens.filter((s) => s.connectionStatus === "Online").length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-text">الشاشات</span>
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            {active} شاشة نشطة من أصل {screens.length}
          </p>
        </div>
        <Link
          href="/screens/manage"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer select-none active:scale-95 transition-all duration-100 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            color: "white",
          }}
        >
          <svg
            className="w-4.5 h-4.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          إدارة الشاشات (تعديل / حذف)
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger">
        {[
          { label: "إجمالي الشاشات", value: screens.length, color: "#818cf8" },
          { label: "نشطة", value: active, color: "#34d399" },
          { label: "خاملة", value: screens.length - active, color: "#94a3b8" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass animate-fade-in p-4 flex items-center gap-4"
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
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
