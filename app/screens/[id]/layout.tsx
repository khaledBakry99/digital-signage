"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const screenId = Number(params.id);

  useEffect(() => {
    // تسجيل فتح التبويب
    const stored = localStorage.getItem("openScreenTabs");
    const currentOpen = stored ? JSON.parse(stored) : [];
    if (!currentOpen.includes(screenId)) {
      currentOpen.push(screenId);
      localStorage.setItem("openScreenTabs", JSON.stringify(currentOpen));
      window.dispatchEvent(new Event("storage"));
    }

    // تنظيف عند إغلاق التبويب
    const handleBeforeUnload = () => {
      const stored = localStorage.getItem("openScreenTabs");
      if (stored) {
        const currentOpen = JSON.parse(stored);
        const updated = currentOpen.filter((id: number) => id !== screenId);
        localStorage.setItem("openScreenTabs", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [screenId]);

  return <>{children}</>;
}
