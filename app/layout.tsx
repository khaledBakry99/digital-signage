import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionExpiryToast from "@/components/SessionExpiryToast";
import CameraTabStateSync from "@/components/CameraTabStateSync";

export const metadata: Metadata = {
  title: "نظام إدارة الشاشات الرقمية",
  description: "Digital Signage Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
        <SessionExpiryToast />
        <CameraTabStateSync />
      </body>
    </html>
  );
}
