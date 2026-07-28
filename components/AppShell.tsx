"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminGuard from "./SuperAdminGuard";
import PoweredBy from "./PoweredBy";

// صفحات الشاشات والكاميرات تعمل بدون sidebar (fullscreen)
const SCREEN_VIEW_PREFIX = "/screens/";
const CAMERA_VIEW_PREFIX = "/cameras/";
const SUPER_ADMIN_PREFIX = "/super-admin";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isScreenView = pathname?.startsWith(SCREEN_VIEW_PREFIX) && pathname?.split("/").length === 3 && pathname !== "/screens/" && !isNaN(Number(pathname?.split("/")[2])) && !pathname?.includes("/manage");
  const isCameraView = pathname?.startsWith(CAMERA_VIEW_PREFIX) && pathname?.split("/").length === 3;
  const isLoginPage = pathname === "/login";
  const isForgotPasswordPage = pathname === "/forgot-password";
  const isResetPasswordPage = pathname === "/reset-password";
  const isSuperAdminRoute = pathname?.startsWith(SUPER_ADMIN_PREFIX);

  if (isLoginPage || isForgotPasswordPage || isResetPasswordPage) {
    return <>{children}</>;
  }

  if (isScreenView || isCameraView) {
    return (
      <AuthGuard>
        <div className="relative min-h-screen">
          {children}
          <PoweredBy />
        </div>
      </AuthGuard>
    );
  }

  if (isSuperAdminRoute) {
    return (
      <SuperAdminGuard>
        <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
          <div className="flex min-h-screen">
            <SuperAdminSidebar />
            <main className="flex-1 overflow-y-auto min-h-screen transition-all duration-500">
              {children}
            </main>
          </div>
          <PoweredBy />
        </div>
      </SuperAdminGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div
          className="flex min-h-screen"
          style={{
            paddingRight: "var(--client-sidebar-width, 280px)",
            transition: "padding-right 0.35s ease"
          }}
        >
          <Sidebar />
          <main
            className="flex-1 overflow-y-auto"
            style={{ minHeight: "100vh" }}
          >
            {children}
          </main>
        </div>
        <PoweredBy />
      </div>
    </AuthGuard>
  );
}
