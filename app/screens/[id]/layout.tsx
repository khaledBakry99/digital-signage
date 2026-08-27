"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";

export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const screenId = Number(params.id);

  // Only track open tabs for the main screen display page, not manage page
  const isScreenDisplayPage = pathname === `/screens/${params.id}`;

  useEffect(() => {
    if (!isScreenDisplayPage) return;

 
    const stored = localStorage.getItem("openScreenTabs");
    const currentOpen = stored ? JSON.parse(stored) : [];
    if (!currentOpen.includes(screenId)) {
      currentOpen.push(screenId);
      localStorage.setItem("openScreenTabs", JSON.stringify(currentOpen));
      window.dispatchEvent(new Event("storage"));
    }


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
  }, [screenId, isScreenDisplayPage]);

  return <>{children}</>;
}
