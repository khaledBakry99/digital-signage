"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { dashboardApi, type ClientDashboardStats } from "@/lib/api";
import { useScreens } from "@/lib/hooks/useScreens";

function ModernStatCard({
  label,
  value,
  sub,
  color,
  icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  index?: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-slate-800/40 border border-white/5 p-6 hover:bg-slate-800/60 transition-all duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${color}40, ${color})` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          <p className="text-sm font-medium text-slate-300">{label}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}08)`,
            border: `1px solid ${color}30`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ActionPill({
  label,
  desc,
  color,
  icon,
  onClick,
  index = 0,
}: {
  label: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  index?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-slate-800/30 border border-white/5 p-5 text-right w-full hover:border-white/10 transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            border: `1px solid ${color}25`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white text-sm mb-0.5">{label}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <svg
          className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const { clientId, loading: authLoading } = useAuth();
  const { screens, loading: screensLoading } = useScreens(clientId);
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const disconnectedScreens = useMemo(
    () => screens.filter((screen) => screen.connectionStatus !== "Online"),
    [screens],
  );

  // جلب إحصائيات لوحة التحكم من الـ API الحقيقي للعميل
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
        // نستخدم معرف العميل المسجل حالياً أو الافتراضي (1)
        const targetClientId = clientId || 1;
        const data = await dashboardApi.getClientStats(targetClientId);
        setStats(data);
      } catch (err) {
        console.error("فشل جلب إحصائيات لوحة التحكم:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardStats();
    }
  }, [clientId, authLoading]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      {/* === HERO HEADER SECTION === */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600/10 via-slate-800/20 to-transparent p-8 mb-10 border border-white/5">
        {/* Blur orbs */}
        <div className="absolute top-0 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              لوحة التحكم
            </h1>
            <p className="text-slate-400">
              مرحباً بك في نظام إدارة الشاشات الرقمية
            </p>
          </div>

          {/* Mini Stats Bar */}
          {statsLoading ? (
            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/50 shadow-lg">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/50 rounded-xl w-[180px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/50 shadow-lg">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/50 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{stats.connectedScreens}</span>
                  <span className="text-sm text-slate-400">من</span>
                  <span className="text-lg font-semibold text-slate-300">{stats.totalScreens}</span>
                  <span className="text-xs text-slate-500 mr-1">شاشة نشطة</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/50 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{stats.activeCampaigns}</span>
                  <span className="text-xs text-slate-500">حملة نشطة</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statsLoading ? (
          // Skeletons while loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-800/40 border border-white/5 p-6 h-28 animate-pulse flex items-center justify-between">
              <div className="space-y-2.5 w-2/3">
                <div className="h-8 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/5" />
            </div>
          ))
        ) : (
          <>
            <ModernStatCard
              label="إجمالي الشاشات"
              value={stats?.totalScreens ?? 0}
              sub={`${stats?.totalScreens ?? 0} شاشات مسجلة`}
              color="#818cf8"
              index={0}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <ModernStatCard
              label="الشاشات المتصلة"
              value={stats?.connectedScreens ?? 0}
              sub={`${stats?.connectedScreens ?? 0} شاشة نشطة ومتصلة`}
              color="#34d399"
              index={1}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <ModernStatCard
              label="الشاشات غير المتصلة"
              value={stats?.disconnectedScreens ?? 0}
              sub={`${stats?.disconnectedScreens ?? 0} شاشة غير متصلة بالشبكة`}
              color="#ef4444"
              index={2}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
            />
            <ModernStatCard
              label="الحملات النشطة"
              value={stats?.activeCampaigns ?? 0}
              sub={`${stats?.activeCampaigns ?? 0} حملة ترويجية نشطة`}
              color="#c084fc"
              index={3}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Alerts & Campaigns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Critical Alerts */}
        <section className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-rose-500/5 to-slate-800/30 border border-rose-500/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">التنبيهات الحرجة</h2>
                {statsLoading ? (
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-xs text-rose-400">{stats?.disconnectedScreens ?? 0} شاشات غير متصلة</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {statsLoading || screensLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 rounded-xl bg-slate-900/40 border border-rose-500/10 animate-pulse"
                />
              ))
            ) : disconnectedScreens.length ? (
              disconnectedScreens.slice(0, 3).map((screen) => (
                <a
                  key={screen.id}
                  href={`/screens/${screen.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-rose-500/10 hover:border-rose-500/25 hover:bg-rose-500/5 transition-all group"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{screen.name}</p>
                    <p className="text-xs text-rose-400/80">غير متصلة</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">جميع الشاشات متصلة</p>
              </div>
            )}
          </div>
        </section>

        {/* Active Campaigns */}
        <section className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-violet-500/5 to-slate-800/30 border border-violet-500/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">الحملات النشطة</h2>
                {statsLoading ? (
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-xs text-violet-400">{stats?.activeCampaigns ?? 0} حملة قيد التشغيل</p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push("/ads")}
              className="px-3 py-1.5 text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 transition-colors"
            >
              إدارة الإعلانات
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-violet-500/5 animate-pulse h-32" />
              ))
            ) : stats?.activeCampaigns && stats.activeCampaigns > 0 ? (
              Array.from({ length: Math.min(stats.activeCampaigns, 3) }).map((_, idx) => (
                <div
                  key={idx}
                  className="group relative p-4 rounded-xl bg-slate-900/40 border border-violet-500/10 hover:border-violet-500/25 transition-all cursor-pointer"
                  onClick={() => router.push("/ads")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">حملة نشطة {idx + 1}</p>
                      <p className="text-xs text-slate-400">تعرض على {stats?.connectedScreens ?? 0} شاشة</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">قيد التشغيل</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">لا توجد حملات نشطة حالياً</p>
                <button
                  onClick={() => router.push("/ads/new")}
                  className="mt-3 px-4 py-2 text-sm font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-colors"
                >
                  إنشاء حملة جديدة
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Screens Orbs Section - Unique Design */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
          <h2 className="text-xl font-semibold text-white">
            حالة الشاشات
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-800/30 border border-white/5 p-8">
          {screensLoading || statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-36 rounded-2xl bg-slate-800/40 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : screens.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm">لا توجد شاشات مسجلة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">توجه إلى إدارة الشاشات لإضافة شاشتك الأولى</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {screens.map((screen) => {
                const isActive = screen.connectionStatus === "Online";
                return (
                  <a
                    key={screen.id}
                    href={`/screens/${screen.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/20 border border-white/5 hover:border-white/10 hover:bg-slate-800/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Screen Orb */}
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? "group-hover:scale-105" : "group-hover:scale-102"}`}
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
                        <span className="absolute inset-[-3px] rounded-full animate-ping opacity-15" style={{ border: "2px solid rgba(16,185,129,0.4)" }} />
                      )}

                      {/* Inner Circle with ID */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 group-hover:scale-110"
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
                        className={`absolute bottom-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isActive ? "bg-emerald-400" : "bg-slate-500"}`}
                      />
                    </div>

                    {/* Screen Name - More Visible */}
                    <div className="w-full text-center">
                      <p className="text-sm font-semibold text-white text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {screen.name}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full font-medium ${isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}
                    >
                      {isActive ? "متصل" : "غير متصل"}
                    </span>

                    {/* New Tab Indicator */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
