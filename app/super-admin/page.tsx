"use client";

import { useMemo } from "react";
import SuperAdminGuard from "@/components/SuperAdminGuard";
import SkeletonCard from "@/components/SkeletonCard";
import { useSuperAdminDashboard } from "@/lib/hooks/useSuperAdminDashboard";
import { useSuperAdminClients } from "@/lib/hooks/useSuperAdminClients";
import { useSuperAdminUsers } from "@/lib/hooks/useSuperAdminUsers";
import { getRoleLabel } from "@/lib/utils/roleLabels";

const metricColors = {
  clients: "#34d399",
  screens: "#818cf8",
  connected: "#4ade80",
  disconnected: "#f97316",
  campaigns: "#c084fc",
};

const metricGradients: Record<string, string> = {
  clients: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
  screens: "from-violet-500/10 to-purple-500/10 border-violet-500/20",
  connected: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  disconnected: "from-orange-500/10 to-amber-500/10 border-orange-500/20",
  campaigns: "from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/20",
};

function MetricCard({
  label,
  value,
  description,
  color,
  delay = 0,
  metricKey,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
  delay?: number;
  metricKey: string;
}) {
  const gradientClass = metricGradients[metricKey] || metricGradients.clients;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} border p-5 animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative gradient orb */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-50"
        style={{ background: color }}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center border"
          style={{
            borderColor: `${color}30`,
            background: `linear-gradient(135deg, ${color}15, transparent)`,
          }}
        >
          <span className="text-xl" style={{ color }}>
            ●
          </span>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ alerts = [] }: { alerts?: string[] }) {
  if (!alerts.length) {
    return (
      <div className="p-4 text-center rounded-xl bg-slate-800/30 border border-white/5 text-slate-400 text-sm">
        لا توجد تنبيهات حرجة حالياً
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={`${alert}-${index}`}
          className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <p className="flex-1 text-slate-200">{alert}</p>
        </div>
      ))}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const { stats, loading: statsLoading } = useSuperAdminDashboard();
  const { clients, loading: clientsLoading } = useSuperAdminClients();
  const { users, loading: usersLoading } = useSuperAdminUsers();

  const alerts = stats?.alerts ?? [];
  const totalClients = clients.length;
  const topClients = useMemo(() => clients.slice(0, 5), [clients]);
  const inactiveClients = useMemo(() => clients.filter((client) => !client.isActive), [clients]);
  const aiEnabledClients = useMemo(() => clients.filter((client) => client.isAiEnabled), [clients]);
  const recentUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      const aTime = a.lastLoginAtUtc ? new Date(a.lastLoginAtUtc).getTime() : 0;
      const bTime = b.lastLoginAtUtc ? new Date(b.lastLoginAtUtc).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 5);
  }, [users]);

  const connectedScreens = stats?.connectedScreens ?? 0;
  const totalScreensCount = stats?.totalScreens ?? 0;
  const activeClients = totalClients - inactiveClients.length;
  const isBusy = statsLoading || clientsLoading || usersLoading;

  const insightItems = useMemo(
    () => [
      {
        label: "تفعيل العملاء",
        value: totalClients ? `${activeClients}/${totalClients}` : "0",
        desc: "عملاء بحالة نشطة الآن",
        color: "#34d399",
      },
      {
        label: "الشاشات المتصلة",
        value: `${connectedScreens}/${totalScreensCount}`,
        desc: "مرتبطة بالمنصة",
        color: "#818cf8",
      },
      {
        label: "الذكاء الاصطناعي",
        value: String(aiEnabledClients.length),
        desc: "عملاء فعّلوا التحليلات",
        color: "#fbbf24",
      },
      {
        label: "تنبيهات حرجة",
        value: String(alerts.length),
        desc: "مرسلة من واجهة البرمجة",
        color: "#f87171",
      },
    ],
    [activeClients, totalClients, connectedScreens, totalScreensCount, aiEnabledClients.length, alerts.length]
  );

  return (
    <SuperAdminGuard>
      <div className="p-8 space-y-8 min-h-screen bg-[#0a0e1a]">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/80 via-[#0f1419] to-slate-900/80 border border-white/10 p-6">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left Side: Title & Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">لوحة تحكم النظام الشاملة</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                رؤية لحظية لحالة العملاء، الشاشات، والحملات مع تنبيهات ذكية تساعدك على اتخاذ قرارات أسرع.
              </p>
            </div>

            {/* Right Side: Quick Stats Card */}
            <div className="w-full lg:w-[260px]">
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">النشاط العام</p>
                    <p className="text-lg font-bold text-violet-400">{stats?.totalClients ?? 0} عميل</p>
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  <div className="flex-1 text-center py-2 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="block text-lg font-bold text-emerald-400">{stats?.totalScreens ?? 0}</span>
                    <span className="text-slate-400 text-xs">شاشة</span>
                  </div>
                  <div className="flex-1 text-center py-2 px-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="block text-lg font-bold text-blue-400">{stats?.connectedScreens ?? 0}</span>
                    <span className="text-slate-400 text-xs">متصلة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {statsLoading && !stats ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} className="rounded-2xl bg-slate-800/50 border border-white/5 p-5" lines={4} />
              ))
            ) : (
              <>
                <MetricCard
                  label="إجمالي العملاء"
                  value={stats?.totalClients ?? 0}
                  description="عملاء لديهم تراخيص فعّالة"
                  color={metricColors.clients}
                  metricKey="clients"
                />
                <MetricCard
                  label="إجمالي الشاشات"
                  value={stats?.totalScreens ?? 0}
                  description="شاشات مرتبطة بالمنصة"
                  color={metricColors.screens}
                  delay={50}
                  metricKey="screens"
                />
                <MetricCard
                  label="الشاشات المتصلة"
                  value={stats?.connectedScreens ?? 0}
                  description="مراقبة آنية بإتصال فعّال"
                  color={metricColors.connected}
                  delay={100}
                  metricKey="connected"
                />
                <MetricCard
                  label="الشاشات غير المتصلة"
                  value={stats?.disconnectedScreens ?? 0}
                  description="تحتاج إلى متابعة تقنية"
                  color={metricColors.disconnected}
                  delay={150}
                  metricKey="disconnected"
                />
              </>
            )}
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 p-5">
            {/* Decorative orb */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-fuchsia-500/20 rounded-full blur-2xl" />

            {statsLoading && !stats ? (
              <SkeletonCard lines={5} />
            ) : (
              <>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">الحملات النشطة</p>
                    <p className="text-3xl font-bold text-fuchsia-400">
                      {stats?.activeCampaigns ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-fuchsia-500/20 bg-fuchsia-500/10">
                    <span className="text-xl text-fuchsia-400">●</span>
                  </div>
                </div>
                <div className="relative mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">نسبة التفعيل</span>
                    <span className="text-fuchsia-400 font-semibold">
                      {stats && stats.totalClients
                        ? Math.round(((stats.activeCampaigns ?? 0) / Math.max(stats.totalClients, 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 right-0 rounded-full bg-fuchsia-500"
                      style={{
                        width: stats && stats.totalClients
                          ? `${Math.min(100, ((stats.activeCampaigns ?? 0) / Math.max(stats.totalClients, 1)) * 100)}%`
                          : '0%',
                        boxShadow: '0 0 10px rgba(232, 121, 249, 0.5)',
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-sm text-slate-400 mb-3">تنبيهات فورية</p>
                  <AlertsPanel alerts={stats?.alerts} />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card-elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
              <h2 className="text-xl font-bold text-white">الشركات/المنشآت المسجلة</h2>
            </div>
            {clientsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} className="rounded-2xl bg-white/5" lines={2} />
                ))}
              </div>
            ) : topClients.length ? (
              <div className="space-y-3">
                {topClients.map((client) => (
                  <div key={client.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-base font-semibold text-white">{client.name}</p>
                      <p className="text-xs text-slate-400">
                        {client.city || "—"} • {client.contactEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-lg border ${client.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
                        {client.isActive ? "نشط" : "معطل"}
                      </span>
                      <span className={`px-2 py-1 rounded-lg border ${client.isAiEnabled ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-rose-500/10 border border-rose-700/20 text-rose-500"}`}>
                        {client.isAiEnabled ? "AI مفعل" : "بدون AI"}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">{client.maxScreens} شاشة</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-slate-400">
                لا يوجد عملاء مسجلون حالياً.
              </p>
            )}
          </div>
          <div className="card-elevated space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
              <h2 className="text-lg font-bold text-white">مؤشرات موحدة</h2>
            </div>
            <div className="space-y-3">
              {insightItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-sky-500 to-indigo-500" />
              <h2 className="text-lg font-bold text-white">أحدث تسجيلات الدخول</h2>
            </div>
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} className="rounded-2xl bg-white/5" lines={2} />
                ))}
              </div>
            ) : recentUsers.length ? (
              <ul className="space-y-3">
                {recentUsers.map((user) => (
                  <li key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                    <div>
                      <p className="font-semibold text-sm text-white">{user.fullName}</p>
                      <p className="text-xs text-slate-400">
                        {getRoleLabel(user.role)} • {user.email}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {user.lastLoginAtUtc ? new Date(user.lastLoginAtUtc).toLocaleString("ar-SA") : "لم يسجل"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                لا يوجد سجل دخول متاح حالياً.
              </p>
            )}
          </div>
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-rose-500 to-orange-500" />
              <h2 className="text-lg font-bold text-white">الشركات/المنشآت غير النشطة</h2>
            </div>
            {clientsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <SkeletonCard key={idx} className="rounded-2xl bg-white/5" lines={2} />
                ))}
              </div>
            ) : inactiveClients.length ? (
              <ul className="space-y-3 text-sm">
                {inactiveClients.slice(0, 5).map((client) => (
                  <li key={client.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-800/50 border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{client.name}</p>
                      <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">معطل</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {client.deactivationReason || "لا يوجد سبب محدد"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium">جميع الشركات/المنشآت نشطة</p>
                <p className="text-xs text-slate-500 mt-1">لا توجد شركات معطلة حالياً</p>
              </div>
            )}
          </div>
        </section>

        {isBusy && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-full text-sm flex items-center gap-2 text-slate-300 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            يتم تحديث البيانات...
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
