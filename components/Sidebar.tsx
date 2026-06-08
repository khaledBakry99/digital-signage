"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useScreens } from "@/lib/hooks/useScreens";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCampaigns } from "@/lib/hooks/useCampaigns";

// قسم شاشات الإعلانات (للمستخدمين)
const adNavItems = [
  {
    href: "/",
    label: "لوحة التحكم",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/ads",
    label: "الإعلانات",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: "/ads/new",
    label: "إضافة إعلان",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/campaigns",
    label: "الحملات الإعلانية",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    href: "/screens",
    label: "شاشات الإعلانات",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// قسم كاميرات المراقبة (للمشرفين)
const cameraNavItems = [
  {
    href: "/cameras",
    label: "كاميرات المراقبة",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/screens/manage",
    label: "إدارة الشاشات",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/cameras/screenshots",
    label: "لقطات الكاميرات",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/monitoring",
    label: "المراقبة",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { advertisements } = useAdvertisements();
  const { screens } = useScreens();
  const { cameras } = useCameras();
  const { campaigns } = useCampaigns();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavigation = (href: string) => {
    if (typeof window !== "undefined") {
      router.push(href);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className="fixed top-0 right-0 h-screen flex flex-col z-40 backdrop-blur-xl"
      style={{ 
        width: "280px", 
        background: "linear-gradient(180deg, rgba(15, 20, 25, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%)",
        borderLeft: "1.5px solid var(--border)",
        boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b relative overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center animate-glow-pulse relative"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Digital Signage</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>نظام الشاشات الرقمية</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-105 group" 
               style={{ 
                 background: "linear-gradient(135deg, rgba(129, 140, 248, 0.15), rgba(129, 140, 248, 0.05))",
                 border: "1px solid rgba(129, 140, 248, 0.2)"
               }}>
            <p className="text-xl font-bold transition-transform duration-300 group-hover:scale-110" style={{ color: "#818cf8" }}>{advertisements.length}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>إعلان</p>
          </div>
          <div className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-105 group" 
               style={{ 
                 background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))",
                 border: "1px solid rgba(168, 85, 247, 0.2)"
               }}>
            <p className="text-xl font-bold transition-transform duration-300 group-hover:scale-110" style={{ color: "#c084fc" }}>{campaigns.length}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>حملة</p>
          </div>
          <div className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-105 group" 
               style={{ 
                 background: "linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05))",
                 border: "1px solid rgba(52, 211, 153, 0.2)"
               }}>
            <p className="text-xl font-bold transition-transform duration-300 group-hover:scale-110" style={{ color: "#34d399" }}>{cameras.length}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>كاميرا</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 overflow-y-auto space-y-6">

        {/* قسم شاشات الإعلانات */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-linear-to-b from-indigo-500 to-purple-500" />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              شاشات الإعلانات
            </p>
          </div>
          <div className="space-y-1.5">
            {adNavItems.map((item, index) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`nav-link ${isActive(item.href) ? "active" : ""} animate-slide-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="mr-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* فاصل */}
        <div className="relative">
          <div style={{ borderTop: "1px solid var(--border)" }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />
        </div>

        {/* قسم كاميرات المراقبة */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-linear-to-b from-green-500 to-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              كاميرات المراقبة
            </p>
          </div>
          <div className="space-y-1.5">
            {cameraNavItems.map((item, index) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`nav-link ${isActive(item.href) ? "active" : ""} animate-slide-in`}
                style={{ animationDelay: `${(index + adNavItems.length) * 50}ms` }}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="mr-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Screens quick links */}
      <div className="p-5 border-t relative" style={{ borderColor: "var(--border)" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-linear-to-b from-green-500 to-emerald-500" />
          <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
            فتح الشاشات
          </p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((id) => {
            const screen = screens.find((s) => s.id === id);
            const active = screen?.connectionStatus === "Online";
            return (
              <button
                key={id}
                onClick={() => handleNavigation(`/screens/${id}`)}
                title={screen?.name || `شاشة ${id}`}
                className="rounded-xl py-3 text-sm font-bold transition-all duration-300 hover:scale-110 hover:-translate-y-1 group relative overflow-hidden"
                style={{
                  background: active 
                    ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))" 
                    : "var(--bg-card)",
                  color: active ? "#34d399" : "var(--text-muted)",
                  border: `1.5px solid ${active ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
                  boxShadow: active ? "0 4px 12px rgba(16,185,129,0.2)" : "none",
                }}
              >
                {active && (
                  <div className="absolute inset-0 bg-linear-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className="relative z-10">{id}</span>
                {active && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-5 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
               style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))" }}>
            <svg className="w-5 h-5" style={{ color: "#818cf8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user?.fullName || "مستخدم"}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{(user?.role === "Admin" || user?.role === "SuperAdmin") ? "مدير" : "مستخدم"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171"
          }}
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
