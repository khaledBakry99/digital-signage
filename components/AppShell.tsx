"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminGuard from "./SuperAdminGuard";

// صفحات الشاشات تعمل بدون sidebar (fullscreen)
const FULLSCREEN_ROUTES = ["/screens/1", "/screens/2", "/screens/3", "/screens/4", "/screens/5"];
const CAMERA_VIEW_PREFIX = "/cameras/";
const SUPER_ADMIN_PREFIX = "/super-admin";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname === r);
  const isCameraView = pathname?.startsWith(CAMERA_VIEW_PREFIX) && pathname?.split("/").length === 3;
  const isLoginPage = pathname === "/login";
  const isSuperAdminRoute = pathname?.startsWith(SUPER_ADMIN_PREFIX);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isFullscreen || isCameraView) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  if (isSuperAdminRoute) {
    return (
      <SuperAdminGuard>
        <div
          className="flex min-h-screen"
          style={{ background: "var(--bg-primary)" }}
        >
          <SuperAdminSidebar />
          <main className="flex-1 overflow-y-auto min-h-screen transition-all duration-500">
            {children}
          </main>
        </div>
      </SuperAdminGuard>
    );
  }

  return (
    <AuthGuard>
      <div
        className="flex min-h-screen"
        style={{
          background: "var(--bg-primary)",
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
    </AuthGuard>
  );
}
