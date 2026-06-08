"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

// صفحات الشاشات تعمل بدون sidebar (fullscreen)
const FULLSCREEN_ROUTES = ["/screens/1", "/screens/2", "/screens/3", "/screens/4", "/screens/5"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname === r);
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isFullscreen) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ marginRight: "280px", minHeight: "100vh" }}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
