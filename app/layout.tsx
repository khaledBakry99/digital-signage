import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CameraBackgroundService from "@/components/CameraBackgroundService";

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
        <CameraBackgroundService />
      </body>
    </html>
  );
}
