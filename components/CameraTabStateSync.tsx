"use client";

import { useEffect, useRef } from "react";
import { cameraApi } from "@/lib/api";
import { extractApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/useAuth";

function readOpenCameraIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("openCameraTabs");
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

export default function CameraTabStateSync() {
  const { isAuthenticated, loading } = useAuth();
  const activeIdsRef = useRef<Set<number>>(new Set());
  const syncingRef = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      activeIdsRef.current.clear();
      return;
    }

    let cancelled = false;

    const syncState = async () => {
      if (cancelled || syncingRef.current) return;
      syncingRef.current = true;

      try {
        const openIds = new Set<number>(readOpenCameraIds());
        const activeIds = activeIdsRef.current;

        const toActivate = Array.from(openIds).filter(
          (id) => !activeIds.has(id),
        );
        const toDeactivate = Array.from(activeIds).filter(
          (id) => !openIds.has(id),
        );

        await Promise.allSettled([
          ...toActivate.map(async (id) => {
            try {
              await cameraApi.activate(id);
            } catch (error) {
            }
          }),
          ...toDeactivate.map(async (id) => {
            try {
              await cameraApi.deactivate(id);
            } catch (error) {
            }
          }),
        ]);

        activeIdsRef.current = openIds;
      } finally {
        syncingRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncState();
      }
    };

    const handleStorage = () => {
      void syncState();
    };

    void syncState();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(syncState, 2000);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, loading]);

  return null;
}
