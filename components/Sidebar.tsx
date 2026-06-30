"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { useAuth } from "@/lib/hooks/useAuth";
import { getRoleLabel } from "@/lib/utils/roleLabels";

// Professional Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const AdsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);
const CampaignIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const ScreensIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ManageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const adNavItems = [
  { href: "/", label: "لوحة التحكم", shortLabel: "الرئيسية", icon: DashboardIcon },
  { href: "/ads", label: "الإعلانات", shortLabel: "إعلانات", icon: AdsIcon },
  { href: "/ads/new", label: "إضافة إعلان", shortLabel: "إضافة", icon: PlusIcon },
  { href: "/campaigns", label: "الحملات الإعلانية", shortLabel: "حملات", icon: CampaignIcon },
  { href: "/screens", label: "شاشات الإعلانات", shortLabel: "شاشات", icon: ScreensIcon },
  { href: "/screens/manage", label: "إدارة الشاشات", shortLabel: "إدارة", icon: ManageIcon },
];

const cameraNavItems = [
  { href: "/cameras", label: "كاميرات المراقبة", shortLabel: "كاميرات", icon: CameraIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { advertisements } = useAdvertisements();
  const { cameras } = useCameras();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--client-sidebar-width",
      isCollapsed ? "80px" : "280px"
    );
  }, [isCollapsed]);

  const quickStats = useMemo(() => [
    {
      label: isCollapsed ? "إ" : "إعلانات",
      fullLabel: "إعلانات",
      value: advertisements.length,
      color: "#818cf8",
    },
    {
      label: isCollapsed ? "ك" : "كاميرات",
      fullLabel: "كاميرات",
      value: cameras.length,
      color: "#34d399",
    },
  ], [advertisements.length, cameras.length, isCollapsed]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      router.push(href);
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={`fixed top-0 right-0 h-screen flex flex-col z-40 transition-all duration-300 ease-out will-change-transform ${isCollapsed ? "translate-x-0" : ""}`}
      style={{
        width: isCollapsed ? "80px" : "280px",
        background: "linear-gradient(180deg, #0a0e1a 0%, #0f1419 50%, #0a0e1a 100%)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: isCollapsed
          ? "-2px 0 16px rgba(0, 0, 0, 0.3)"
          : "-4px 0 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Toggle Button - Same as SuperAdmin */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-84 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition-colors duration-200 z-50 shadow-lg"
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

      {/* Header */}
      <div className={`p-5 border-b border-white/5 ${isCollapsed ? "text-center px-3" : ""}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0e1a]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Digital Signage</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">نظام الشاشات</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0e1a]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className={`p-4 border-b border-white/5 ${isCollapsed ? "px-2" : ""}`}>
        <div className={`flex gap-2 items-stretch ${isCollapsed ? "flex-col" : ""}`}>
          {quickStats.map((stat) => (
            <div
              key={stat.fullLabel}
              className={`group relative rounded-xl transition-all duration-300 hover:scale-105 cursor-default ${isCollapsed ? "w-full px-2 py-3 text-center" : "flex-1 px-3 py-3"
                }`}
              style={{
                background: `linear-gradient(135deg, ${stat.color}12, ${stat.color}05)`,
                border: `1px solid ${stat.color}25`,
              }}
              title={`${stat.fullLabel}: ${stat.value}`}
            >
              <div
                className={`flex items-center ${isCollapsed ? "flex-col gap-1 justify-center" : "gap-2 justify-between"
                  }`}
              >
                <span className="text-lg font-bold leading-none" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                {!isCollapsed && (
                  <span className="text-[10px] text-slate-400 leading-none">{stat.label}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Ad Screens Section */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              شاشات الإعلانات
            </p>
          </div>
        )}
        <div className="space-y-1">
          {adNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`
                    group relative flex items-center w-full rounded-xl transition-all duration-300 ease-out
                    ${active
                    ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                    ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}
                  `}
              >
                {active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/5 opacity-50 blur-sm" />
                )}
                {active && (
                  <div className="absolute inset-0 rounded-xl border border-indigo-500/30" />
                )}
                <span className={`
                    relative z-10 transition-all duration-300
                    ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-300"}
                  `}>
                  <Icon />
                </span>
                {!isCollapsed && (
                  <span className="relative z-10 text-sm font-medium">{item.label}</span>
                )}
                {active && isCollapsed && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
                {active && !isCollapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />

        {/* Cameras Section */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-green-500 to-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              كاميرات المراقبة
            </p>
          </div>
        )}
        <div className="space-y-1">
          {cameraNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`
                    group relative flex items-center w-full rounded-xl transition-all duration-300 ease-out
                    ${active
                    ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                    ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}
                  `}
              >
                {active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/5 opacity-50 blur-sm" />
                )}
                {active && (
                  <div className="absolute inset-0 rounded-xl border border-emerald-500/30" />
                )}
                <span className={`
                    relative z-10 transition-all duration-300
                    ${active ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300"}
                  `}>
                  <Icon />
                </span>
                {!isCollapsed && (
                  <span className="relative z-10 text-sm font-medium">{item.label}</span>
                )}
                {active && isCollapsed && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {active && !isCollapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-green-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className={`p-4 border-t border-white/5 ${isCollapsed ? "px-2" : ""}`}>
        {!isCollapsed ? (
          <>
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
  );
}
