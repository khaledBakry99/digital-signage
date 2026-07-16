"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ThemeProvider } from "@/lib/context/ThemeContext";

export default function CameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const cameraId = Number(params.id);

  useEffect(() => {
    // تسجيل فتح التبويب
    const stored = localStorage.getItem("openCameraTabs");
    const currentOpen = stored ? JSON.parse(stored) : [];
    if (!currentOpen.includes(cameraId)) {
      currentOpen.push(cameraId);
      localStorage.setItem("openCameraTabs", JSON.stringify(currentOpen));
      window.dispatchEvent(new Event("storage"));
    }

    // تنظيف عند إغلاق التبويب
    const handleBeforeUnload = () => {
      const stored = localStorage.getItem("openCameraTabs");
      if (stored) {
        const currentOpen = JSON.parse(stored);
        const updated = currentOpen.filter((id: number) => id !== cameraId);
        localStorage.setItem("openCameraTabs", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [cameraId]);

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
