"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScreenshots } from "@/lib/hooks/useScreenshots";
import { useScreens } from "@/lib/hooks/useScreens";

export default function MonitoringPage() {
  const router = useRouter();
  const { screenshotsByScreen, loading, refresh } = useScreenshots();
  const { screens } = useScreens();
  const [selectedScreen, setSelectedScreen] = useState<number | "all">("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const activeScreens = screens.filter((s) => s.connectionStatus === "Online");
  const totalShots = Object.values(screenshotsByScreen).reduce(
    (s, a) => s + a.length,
    0,
  );
  const screensToShow =
    selectedScreen === "all"
      ? activeScreens.map((s) => s.id)
      : [selectedScreen];

  const formatTime = (date: Date) =>
    new Date(date).toLocaleString("ar-SA", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="لقطة"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
          <button
            className="absolute top-6 left-6 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.1)" }}
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-text">المراقبة</span>
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            لقطات تلقائية كل 10 ثوان للشاشات النشطة
          </p>
        </div>
        <button className="btn-ghost" onClick={refresh}>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {[
          {
            label: "الشاشات النشطة",
            value: activeScreens.length,
            color: "#34d399",
          },
          { label: "إجمالي اللقطات", value: totalShots, color: "#818cf8" },
          {
            label: "الشاشات الخاملة",
            value: screens.length - activeScreens.length,
            color: "#94a3b8",
          },
          { label: "فترة الالتقاط", value: "10s", color: "#c084fc" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="glass animate-fade-in p-5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Screen filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap animate-fade-in">
        <button
          onClick={() => setSelectedScreen("all")}
          className={selectedScreen === "all" ? "btn-primary" : "btn-ghost"}
          style={{ padding: "8px 16px", fontSize: "13px" }}
        >
          الكل
        </button>
        {activeScreens.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedScreen(s.id)}
            className={selectedScreen === s.id ? "btn-primary" : "btn-ghost"}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass p-16 text-center animate-fade-in">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
          <p style={{ color: "var(--text-muted)" }}>جاري تحميل اللقطات...</p>
        </div>
      )}

      {/* No active screens */}
      {!loading && activeScreens.length === 0 && (
        <div className="glass p-16 text-center animate-fade-in">
          <div className="text-5xl mb-4">📺</div>
          <p
            className="font-bold text-lg mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            لا توجد شاشات نشطة
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            أضف إعلاناً على شاشة لبدء التقاط اللقطات تلقائياً
          </p>
          <button
            className="btn-primary"
            onClick={() => router.push("/ads/new")}
          >
            إضافة إعلان
          </button>
        </div>
      )}

      {/* Screenshots by screen */}
      {!loading && activeScreens.length > 0 && (
        <div className="space-y-10">
          {screensToShow.map((sid) => {
            const screen = screens.find((s) => s.id === sid);
            const shots = screenshotsByScreen[sid] ?? [];

            return (
              <section key={sid} className="animate-fade-in">
                {/* Section header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <h2
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {screen?.name ?? `شاشة ${sid}`}
                    </h2>
                    <span className="badge badge-blue">
                      {shots.length} لقطة
                    </span>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                    onClick={() => router.push(`/screens/${sid}`)}
                  >
                    فتح الشاشة ←
                  </button>
                </div>

                {/* No shots yet */}
                {shots.length === 0 && (
                  <div className="glass p-10 text-center">
                    <div className="text-4xl mb-3">⏳</div>
                    <p style={{ color: "var(--text-muted)" }}>
                      في انتظار أول لقطة... (تلتقط بعد 3 ثوان من فتح الشاشة)
                    </p>
                  </div>
                )}

                {/* Grid */}
                {shots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 stagger">
                    {shots.map((shot, index) => (
                      <div
                        key={shot.id}
                        className="glass glass-hover animate-fade-in cursor-pointer overflow-hidden group"
                        style={{
                          animationDelay: `${index * 20}ms`,
                          borderRadius: "12px",
                        }}
                        onClick={() =>
                          shot.blobUrl && setLightbox(shot.blobUrl)
                        }
                      >
                        {/* Image */}
                        <div
                          className="relative aspect-video"
                          style={{ background: "var(--bg-secondary)" }}
                        >
                          {shot.blobUrl ? (
                            <img
                              src={shot.blobUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span style={{ color: "var(--text-muted)" }}>
                                🖼️
                              </span>
                            </div>
                          )}
                          {index === 0 && (
                            <span
                              className="absolute top-1.5 right-1.5 badge badge-green"
                              style={{ fontSize: "10px", padding: "2px 6px" }}
                            >
                              أحدث
                            </span>
                          )}
                          {/* Hover overlay */}
                          <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(0,0,0,0.4)" }}
                          >
                            <svg
                              className="w-7 h-7 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-2">
                          <p
                            className="text-xs font-mono leading-tight"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {formatTime(shot.timestamp)}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {(shot.imageSize / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
