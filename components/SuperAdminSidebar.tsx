"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSuperAdminDashboard } from "@/lib/hooks/useSuperAdminDashboard";
import { useAuth } from "@/lib/hooks/useAuth";
import { getRoleLabel } from "@/lib/utils/roleLabels";

// Professional Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BuildingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const navItems = [
  {
    href: "/super-admin",
    label: "لوحة النظام",
    shortLabel: "الرئيسية",
    icon: DashboardIcon,
  },
  {
    href: "/super-admin/users",
    label: "مستخدمي النظام",
    shortLabel: "المستخدمين",
    icon: UsersIcon,
  },
  {
    href: "/super-admin/clients",
    label: "إدارة الشركات/المنشآت",
    shortLabel: "الشركات",
    icon: BuildingsIcon,
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stats } = useSuperAdminDashboard();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const quickStats = useMemo(() => [
    {
      label: isCollapsed ? "ع" : "عملاء",
      fullLabel: "عملاء",
      value: stats?.totalClients ?? 0,
      color: "#34d399",
    },
    {
      label: isCollapsed ? "ش" : "شاشات",
      fullLabel: "شاشات",
      value: stats?.totalScreens ?? 0,
      color: "#818cf8",
    },
    {
      label: isCollapsed ? "ح" : "حملات",
      fullLabel: "حملات",
      value: stats?.activeCampaigns ?? 0,
      color: "#f472b6",
    },
  ], [stats, isCollapsed]);

  const isActive = (href: string) => pathname === href;

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      router.push(href);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Main Sidebar */}
      <aside
        className={`sticky top-0 self-start h-screen flex flex-col z-40 transition-all duration-500 ease-out ${isCollapsed ? "translate-x-0" : ""}`}
        style={{
          width: isCollapsed ? "80px" : "280px",
          background: "linear-gradient(180deg, #0a0e1a 0%, #0f1419 50%, #0a0e1a 100%)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: isCollapsed
            ? "-2px 0 16px rgba(0, 0, 0, 0.3)"
            : "-4px 0 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-84 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition-colors z-50 shadow-lg"
          aria-label={isCollapsed ? "فتح القائمة" : "إغلاق القائمة"}
        >
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Header Section */}
        <div className={`p-5 border-b border-white/5 ${isCollapsed ? "text-center" : ""}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400/80">Smart HQ</p>
                  <h2 className="text-lg font-bold text-white">Super Admin</h2>
                </div>
              </div>
            </>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`p-4 border-b border-white/5 ${isCollapsed ? "px-2" : ""}`}>
          <div className={`grid gap-2 ${isCollapsed ? "grid-cols-1" : "grid-cols-3"}`}>
            {quickStats.map((stat) => (
              <div
                key={stat.fullLabel}
                className="group relative rounded-xl p-2 text-center transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}10, ${stat.color}05)`,
                  border: `1px solid ${stat.color}20`,
                }}
                title={`${stat.fullLabel}: ${stat.value}`}
              >
                <p className="text-lg font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                {!isCollapsed && (
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`
                  group relative flex items-center gap-3 w-full rounded-xl px-3 py-3 text-sm font-medium
                  transition-all duration-300 ease-out overflow-hidden
                  ${active
                    ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 border border-indigo-500/30 text-white"
                    : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                  }
                  ${isCollapsed ? "justify-center px-2" : ""}
                `}
              >
                {/* Hover Background Effect */}
                {!active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                {/* Active Indicator */}
                {active && !isCollapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-gradient-to-b from-indigo-400 to-violet-400" />
                )}

                {/* Icon */}
                <span className={`relative z-10 transition-colors duration-300 ${active ? "text-indigo-400" : "group-hover:text-indigo-300"}`}>
                  <Icon />
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span className="relative z-10">{item.label}</span>
                )}

                {/* Active Dot */}
                {active && isCollapsed && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={`p-4 border-t border-white/5 ${isCollapsed ? "px-2" : ""}`}>
          {!isCollapsed ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.fullName || "مستخدم"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{getRoleLabel(user?.role)}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full group relative overflow-hidden rounded-xl py-2.5 px-3 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="relative z-10">تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full group relative overflow-hidden rounded-xl py-3 px-2 transition-all duration-300 flex items-center justify-center text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500/40"
              title="تسجيل الخروج"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
