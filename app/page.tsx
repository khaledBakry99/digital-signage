"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { dashboardApi, type ClientDashboardStats } from "@/lib/api";
import { useScreens } from "@/lib/hooks/useScreens";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="glass glass-hover animate-fade-in p-7 flex items-center gap-6 group relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)` }} />
      </div>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ 
          background: `linear-gradient(135deg, ${color}25, ${color}15)`,
          border: `1.5px solid ${color}40`,
          boxShadow: `0 8px 24px ${color}20`
        }}
      >
        <span style={{ color }} className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-bold mb-1 transition-all duration-300 group-hover:scale-105" style={{ color }}>
          {value}
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  label,
  desc,
  color,
  icon,
  onClick,
  delay = 0,
}: {
  label: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="glass glass-hover animate-fade-in p-7 text-right w-full group relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
           style={{ background: `radial-gradient(circle, ${color}20, transparent 70%)` }} />
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 relative z-10"
        style={{ 
          background: `linear-gradient(135deg, ${color}30, ${color}15)`,
          border: `1.5px solid ${color}40`,
          boxShadow: `0 4px 16px ${color}25`
        }}
      >
        <span style={{ color }} className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
      </div>
      <p
        className="font-bold text-lg mb-2 relative z-10 transition-colors duration-300"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </p>
      <p className="text-sm relative z-10 transition-colors duration-300" style={{ color: "var(--text-muted)" }}>
        {desc}
      </p>
      <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ backgroundImage: `linear-gradient(to left, ${color}, transparent)` }} />
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const { clientId, loading: authLoading } = useAuth();
  const { screens } = useScreens(clientId);
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      
      {/* Header */}
      <div className="mb-12 animate-fade-in relative z-10">
        <div className="inline-flex items-center gap-3 mb-4">
        </div>
        <h1 className="text-5xl font-bold mb-3">
          <span className="gradient-text-modern">لوحة التحكم</span>
        </h1>
        <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
          مرحباً بك في نظام إدارة الشاشات الرقمية الاحترافي
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12 stagger relative z-10">
        {statsLoading ? (
          // Skeletons while loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass p-7 h-[116px] animate-pulse flex items-center justify-between">
              <div className="space-y-2.5 w-2/3">
                <div className="h-8 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/5" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="إجمالي الشاشات"
              value={stats?.totalScreens ?? 0}
              sub={`${stats?.totalScreens ?? 0} شاشات مسجلة`}
              color="#818cf8"
              delay={0}
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
            <StatCard
              label="الشاشات المتصلة"
              value={stats?.connectedScreens ?? 0}
              sub={`${stats?.connectedScreens ?? 0} شاشة نشطة ومتصلة`}
              color="#34d399"
              delay={50}
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
            <StatCard
              label="الشاشات غير المتصلة"
              value={stats?.disconnectedScreens ?? 0}
              sub={`${stats?.disconnectedScreens ?? 0} شاشة غير متصلة بالشبكة`}
              color="#ef4444"
              delay={100}
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
            <StatCard
              label="الحملات النشطة"
              value={stats?.activeCampaigns ?? 0}
              sub={`${stats?.activeCampaigns ?? 0} حملة ترويجية نشطة`}
              color="#c084fc"
              delay={150}
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

      {/* Quick Actions */}
      <div className="mb-12 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            الإجراءات السريعة
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger">
          <QuickAction
            label="إضافة إعلان"
            desc="ارفع صورة أو فيديو جديد"
            color="#818cf8"
            onClick={() => router.push("/ads/new")}
            delay={0}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          />
          <QuickAction
            label="الإعلانات"
            desc="إدارة وتعديل الإعلانات"
            color="#c084fc"
            onClick={() => router.push("/ads")}
            delay={50}
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            }
          />
          <QuickAction
            label="الشاشات"
            desc="عرض حالة الشاشات الخمس"
            color="#34d399"
            onClick={() => router.push("/screens")}
            delay={100}
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
          <QuickAction
            label="المراقبة"
            desc="لقطات تلقائية كل 10 ثوان"
            color="#fb923c"
            onClick={() => router.push("/monitoring")}
            delay={150}
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
        </div>
      </div>

      {/* Screens status */}
      <div className="animate-fade-in relative z-10" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-green-500 to-emerald-500" />
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            حالة الشاشات
          </h2>
        </div>
        <div className="glass p-8">
          {screens.length === 0 ? (
            <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
              لا توجد شاشات مسجلة حالياً. توجه إلى إدارة الشاشات لإضافة شاشتك الأولى.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {screens.map((screen) => {
                const isActive = screen.connectionStatus === "Online";
                return (
                  <button
                    key={screen.id}
                    onClick={() => router.push(`/screens/${screen.id}`)}
                    className="rounded-2xl p-5 text-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 group relative overflow-hidden cursor-pointer"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))"
                        : "var(--bg-secondary)",
                      border: `1.5px solid ${isActive ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
                      boxShadow: isActive ? "0 8px 24px rgba(16,185,129,0.2)" : "none",
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold relative z-10 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.15))"
                          : "var(--bg-card)",
                        color: isActive ? "#34d399" : "var(--text-muted)",
                        boxShadow: isActive ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
                      }}
                    >
                      {screen.id}
                    </div>
                    <p
                      className="text-xs font-bold truncate mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {screen.name}
                    </p>
                    <p
                      className="text-xs font-semibold relative z-10"
                      style={{
                        color: isActive ? "#34d399" : "var(--text-muted)",
                      }}
                    >
                      {isActive ? "نشط" : "غير متصل"}
                    </p>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-green-400 mx-auto mt-3 animate-pulse relative z-10" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
