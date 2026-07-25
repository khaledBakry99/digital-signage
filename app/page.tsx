"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { dashboardApi, cameraApi, type ClientDashboardStats, type Subscription } from "@/lib/api";
import { useScreensWithHeartbeat } from "@/lib/hooks/useScreensWithHeartbeat";
import { useTheme } from "@/lib/context/ThemeContext";
import ScreenStatusDisplay from "@/components/ScreenStatusDisplay";

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

export default function Home() {
  const router = useRouter();
  const { clientId, loading: authLoading, isAuthenticated } = useAuth();
  const { screens, loading: screensLoading, openScreenTabs } = useScreensWithHeartbeat(clientId);
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [cameras, setCameras] = useState<any[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(true);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const heroSectionClass = isLightTheme
    ? "relative overflow-hidden rounded-3xl p-8 mb-10 border border-white/10 shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
    : "relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600/10 via-slate-800/20 to-transparent p-8 mb-10 border border-white/5";

  const heroSectionStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(196,210,255,0.85))",
      backdropFilter: "blur(24px)",
    }
    : undefined;

  const miniWrapperClass = isLightTheme
    ? "flex items-center gap-2 rounded-2xl p-1.5 border border-white/40 shadow-lg"
    : "flex items-center gap-2 bg-slate-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/50 shadow-lg";

  const miniWrapperStyle = isLightTheme
    ? { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(18px)" }
    : undefined;

  const miniChipClass = isLightTheme
    ? "flex items-center gap-3 px-4 py-2.5 rounded-xl"
    : "flex items-center gap-3 px-4 py-2.5 bg-slate-800/50 rounded-xl";

  const miniChipStyle = isLightTheme ? { background: "rgba(255,255,255,0.45)" } : undefined;
  const miniChipLoadingStyle = isLightTheme ? { background: "rgba(255,255,255,0.4)" } : undefined;

  const criticalSectionClass = isLightTheme
    ? "lg:col-span-1 rounded-2xl p-5 shadow-[0_20px_55px_rgba(244,63,94,0.15)]"
    : "lg:col-span-1 rounded-2xl bg-gradient-to-br from-rose-500/5 to-slate-800/30 border border-rose-500/10 p-5";

  const criticalSectionStyle = isLightTheme
    ? {
      background: "linear-gradient(140deg, rgba(255,219,226,0.7), rgba(255,255,255,0.45))",
      border: "1px solid rgba(244,114,182,0.3)",
      backdropFilter: "blur(18px)",
    }
    : undefined;

  const criticalCardStyle = isLightTheme
    ? {
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(244,114,182,0.25)",
      backdropFilter: "blur(16px)",
    }
    : undefined;

  const campaignSectionClass = isLightTheme
    ? "lg:col-span-2 rounded-2xl p-5 shadow-[0_20px_55px_rgba(99,102,241,0.18)]"
    : "lg:col-span-2 rounded-2xl bg-gradient-to-br from-violet-500/5 to-slate-800/30 border border-violet-500/10 p-5";

  const campaignSectionStyle = isLightTheme
    ? {
      background: "linear-gradient(140deg, rgba(209,219,255,0.8), rgba(255,255,255,0.5))",
      border: "1px solid rgba(129,140,248,0.35)",
      backdropFilter: "blur(18px)",
    }
    : undefined;

  const campaignCardStyle = isLightTheme
    ? {
      background: "rgba(255,255,255,0.6)",
      border: "1px solid rgba(129,140,248,0.25)",
      backdropFilter: "blur(16px)",
    }
    : undefined;

  const disconnectedScreens = useMemo(
    () => screens.filter((screen) => screen.connectionStatus !== "Online"),
    [screens],
  );

  // Format date to DD/MM/YYYY
  const formatDateEnglish = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate remaining days
  const calculateRemainingDays = (endDateString: string) => {
    const endDate = new Date(endDateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };


  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
        const data = await dashboardApi.getClientStats(clientId!);
        setStats(data);
      } catch (err) {
      } finally {
        setStatsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && clientId) {
      fetchDashboardStats();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [clientId, authLoading, isAuthenticated, router]);

  // جلب بيانات الاشتراك
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const data = await dashboardApi.getSubscriptions(clientId!);
        if (data && data.length > 0) {
          setSubscription(data[0]);
        }
      } catch (err) {
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && clientId) {
      fetchSubscription();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [clientId, authLoading, isAuthenticated, router]);

  // جلب بيانات الكاميرات
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setCamerasLoading(true);
        const data = await cameraApi.getAll({ clientId: clientId! });
        setCameras(data);
      } catch (err) {
      } finally {
        setCamerasLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && clientId) {
      fetchCameras();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [clientId, authLoading, isAuthenticated, router]);

  return (
    <div
      className={`min-h-screen p-8 ${isLightTheme ? "" : "bg-[#0a0e1a]"}`}
      style={isLightTheme ? { background: "var(--bg-primary)" } : undefined}
    >
      {/* === HERO HEADER SECTION === */}
      <section className={heroSectionClass} style={heroSectionStyle}>
        {/* Blur orbs */}
        <div
          className={`absolute top-0 right-20 w-72 h-72 rounded-full blur-3xl ${isLightTheme ? "bg-violet-300/40" : "bg-violet-500/20"}`}
        />
        <div
          className={`absolute bottom-0 left-10 w-64 h-64 rounded-full blur-3xl ${isLightTheme ? "bg-cyan-300/25" : "bg-blue-500/10"}`}
        />

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
            <div className={miniWrapperClass} style={miniWrapperStyle}>
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-[180px]"
                  style={miniChipLoadingStyle}
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
            <div className={miniWrapperClass} style={miniWrapperStyle}>
              <div className={miniChipClass} style={miniChipStyle}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-bold ${isLightTheme ? "" : "text-white"}`}
                    style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                  >
                    {stats.connectedScreens}
                  </span>
                  <span
                    className={`text-sm ${isLightTheme ? "" : "text-slate-400"}`}
                    style={isLightTheme ? { color: "var(--text-secondary)" } : undefined}
                  >
                    من
                  </span>
                  <span
                    className={`text-lg font-semibold ${isLightTheme ? "" : "text-slate-300"}`}
                    style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                  >
                    {stats.totalScreens}
                  </span>
                  <span
                    className={`text-xs mr-1 ${isLightTheme ? "" : "text-slate-500"}`}
                    style={isLightTheme ? { color: "var(--text-muted)" } : undefined}
                  >
                    شاشة نشطة
                  </span>
                </div>
              </div>
              <div className={miniChipClass} style={miniChipStyle}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-bold ${isLightTheme ? "" : "text-white"}`}
                    style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                  >
                    {stats.activeCampaigns}
                  </span>
                  <span
                    className={`text-xs ${isLightTheme ? "" : "text-slate-500"}`}
                    style={isLightTheme ? { color: "var(--text-muted)" } : undefined}
                  >
                    حملة نشطة
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-10">
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
              label="الشاشات المنشأة"
              value={`${stats?.totalScreens ?? 0}/${subscription?.maxScreens ?? 0}`}
              sub={`${(subscription?.maxScreens ?? 0) - (stats?.totalScreens ?? 0)} شاشة متبقية للإنشاء`}
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
              label="الكاميرات المنشأة"
              value={`${cameras.length}/${subscription?.maxCameras ?? 0}`}
              sub={`${(subscription?.maxCameras ?? 0) - cameras.length} كاميرا متبقية للإنشاء`}
              color="#10b981"
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />
            {subscriptionLoading ? (
              <div className="lg:col-span-2 rounded-2xl bg-slate-800/40 border border-white/5 p-6 h-28 animate-pulse flex items-center justify-between">
                <div className="space-y-2.5 w-2/3">
                  <div className="h-8 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5" />
              </div>
            ) : subscription ? (
              <div
                className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-slate-800/40 border border-white/5 p-6 hover:bg-slate-800/60 transition-all duration-500"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{ background: `linear-gradient(90deg, #f59e0b40, #f59e0b)` }}
                />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold text-white mb-1">{calculateRemainingDays(subscription.endsAtUtc)}</p>
                    <p className="text-sm font-medium text-slate-300">أيام متبقية</p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, #f59e0b20, #f59e0b08)`,
                      border: `1px solid #f59e0b30`,
                    }}
                  >
                    <svg className="w-7 h-7" style={{ color: "#f59e0b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">تاريخ البدء</p>
                    <p className="text-sm font-semibold text-white">{formatDateEnglish(subscription.startsAtUtc)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">تاريخ النهاية</p>
                    <p className="text-sm font-semibold text-white">{formatDateEnglish(subscription.endsAtUtc)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-slate-800/40 border border-white/5 p-6 hover:bg-slate-800/60 transition-all duration-500"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{ background: `linear-gradient(90deg, #64748b40, #64748b)` }}
                />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold text-white mb-1">—</p>
                    <p className="text-sm font-medium text-slate-300">أيام متبقية</p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, #64748b20, #64748b08)`,
                      border: `1px solid #64748b30`,
                    }}
                  >
                    <svg className="w-7 h-7" style={{ color: "#64748b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">تاريخ البدء</p>
                    <p className="text-sm font-semibold text-white">—</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">تاريخ النهاية</p>
                    <p className="text-sm font-semibold text-white">—</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alerts & Campaigns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Critical Alerts */}
        <section className={criticalSectionClass} style={criticalSectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-sm font-semibold ${isLightTheme ? "" : "text-white"}`}
                  style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                >
                  التنبيهات الحرجة
                </h2>
                {statsLoading ? (
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className={`text-xs ${isLightTheme ? "text-rose-500" : "text-rose-400"}`}>
                    {stats?.disconnectedScreens ?? 0} شاشات غير متصلة
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {statsLoading || screensLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-14 rounded-xl animate-pulse ${isLightTheme ? "" : "bg-slate-900/40 border border-rose-500/10"
                    }`}
                  style={isLightTheme ? { background: "rgba(255,255,255,0.45)", border: "1px solid rgba(244,114,182,0.25)" } : undefined}
                />
              ))
            ) : disconnectedScreens.length ? (
              disconnectedScreens.slice(0, 3).map((screen) => (
                <div
                  key={screen.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isLightTheme ? "" : "bg-slate-900/40 border border-rose-500/10"
                    }`}
                  style={criticalCardStyle}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${isLightTheme ? "" : "text-white"}`}
                      style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                    >
                      {screen.name}
                    </p>
                    <p className={`text-xs ${isLightTheme ? "text-rose-500/90" : "text-rose-400/80"}`}>
                      غير متصلة
                    </p>
                  </div>
                </div>
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
        <section className={campaignSectionClass} style={campaignSectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-sm font-semibold ${isLightTheme ? "" : "text-white"}`}
                  style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                >
                  الحملات النشطة
                </h2>
                {statsLoading ? (
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className={`text-xs ${isLightTheme ? "text-violet-500" : "text-violet-400"}`}>
                    {stats?.activeCampaigns ?? 0} حملة قيد التشغيل
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push("/ads")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isLightTheme
                ? "text-violet-800 bg-violet-100/10 border border-violet-800/20 hover:bg-violet-500/20"
                : "text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20"
                }`}
            >
              إدارة الإعلانات
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl animate-pulse h-32 ${isLightTheme ? "" : "bg-slate-900/30 border border-violet-500/5"
                    }`}
                  style={isLightTheme ? { background: "rgba(255,255,255,0.45)", border: "1px solid rgba(129,140,248,0.2)" } : undefined}
                />
              ))
            ) : stats?.activeCampaigns && stats.activeCampaigns > 0 ? (
              Array.from({ length: Math.min(stats.activeCampaigns, 3) }).map((_, idx) => (
                <div
                  key={idx}
                  className={`group relative p-4 rounded-xl transition-all cursor-pointer ${isLightTheme ? "" : "bg-slate-900/40 border border-violet-500/10 hover:border-violet-500/25"
                    }`}
                  style={campaignCardStyle}
                  onClick={() => router.push("/ads")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${isLightTheme ? "" : "text-white"}`}
                        style={isLightTheme ? { color: "var(--text-primary)" } : undefined}
                      >
                        حملة نشطة {idx + 1}
                      </p>
                      <p
                        className={`text-xs ${isLightTheme ? "" : "text-slate-400"}`}
                        style={isLightTheme ? { color: "var(--text-secondary)" } : undefined}
                      >
                        تعرض على {stats?.connectedScreens ?? 0} شاشة
                      </p>
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
                <div
                  className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center ${isLightTheme ? "" : "bg-slate-800/50"
                    }`}
                  style={isLightTheme ? { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(129,140,248,0.3)" } : undefined}
                >
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <p
                  className={`text-sm ${isLightTheme ? "" : "text-slate-400"}`}
                  style={isLightTheme ? { color: "var(--text-secondary)" } : undefined}
                >
                  لا توجد حملات نشطة حالياً
                </p>
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

      {/* Screens Status Section - Display Only */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
          <h2 className="text-xl font-semibold text-white">
            حالة الشاشات
          </h2>
        </div>

        <div className="rounded-2xl bg-slate-800/30 border border-white/5 p-8">
          <ScreenStatusDisplay screens={screens} loading={screensLoading || statsLoading} />
        </div>
      </section>
    </div>
  );
}
