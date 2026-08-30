import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionExpiryToast from "@/components/SessionExpiryToast";
import CameraTabStateSync from "@/components/CameraTabStateSync";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { FloatingCameraProvider } from "@/lib/context/FloatingCameraContext";
import { FloatingCameraWrapper } from "@/components/FloatingCameraWrapper";

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
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Firasah Live" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <FloatingCameraProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
            <FloatingCameraWrapper />
          </ThemeProvider>
          <SessionExpiryToast />
          <CameraTabStateSync />
        </FloatingCameraProvider>
      </body>
    </html>
  );
}
