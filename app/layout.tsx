import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionExpiryToast from "@/components/SessionExpiryToast";
import CameraTabStateSync from "@/components/CameraTabStateSync";
import { ThemeProvider } from "@/lib/context/ThemeContext";

export const metadata: Metadata = {
  title: "نظام إدارة الشاشات الرقمية Firasah Live",
  description: "Digital Signage Management System Firasah Live",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <SessionExpiryToast />
        <CameraTabStateSync />
      </body>
    </html>
  );
}
