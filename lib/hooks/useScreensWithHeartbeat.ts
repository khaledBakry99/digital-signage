"use client";

import { useState, useEffect, useCallback } from "react";
import { screenApi } from "@/lib/api/screen.api";
import type { Screen, CreateScreenInput, UpdateScreenInput } from "@/lib/types/screen";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * مساعد: تسجيل تبويب شاشة مفتوح
 */
function registerOpenScreenTab(screenId: number): number[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("openScreenTabs");
  let ids: number[] = [];
  if (stored) {
    try {
      ids = JSON.parse(stored);
    } catch {
      ids = [];
    }
  }
  if (!ids.includes(screenId)) {
    ids.push(screenId);
  }
  localStorage.setItem("openScreenTabs", JSON.stringify(ids));
  return ids;
}

/**
 * مساعد: إلغاء تسجيل تبويب شاشة (عند الإغلاق)
 */
function unregisterOpenScreenTab(screenId: number): number[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("openScreenTabs");
  let ids: number[] = [];
  if (stored) {
    try {
      ids = JSON.parse(stored);
    } catch {
      ids = [];
    }
  }
  ids = ids.filter(id => id !== screenId);
  localStorage.setItem("openScreenTabs", JSON.stringify(ids));
  return ids;
}

interface UseScreensWithHeartbeatReturn {
  screens: Screen[];
  screenOnlineStatus: { [screenId: number]: boolean };
  openScreenTabs: Set<number>;
  loading: boolean;
  error: string | null;
  createScreen: (input: CreateScreenInput) => Promise<Screen | null>;
  updateScreen: (id: number, input: UpdateScreenInput) => Promise<Screen | null>;
  deleteScreen: (id: number) => Promise<boolean>;
  assignCampaign: (id: number, campaignId: number) => Promise<Screen | null>;
  removeCampaign: (id: number) => Promise<Screen | null>;
  refresh: () => Promise<void>;
}

/**
 * Custom Hook للشاشات مع نظام Heartbeat
 * ✅ نظام الـ heartbeat يتحكم في حالة الشاشة:
 *    - heartbeat كل 40 ثانية من تبويب مفتوح = ONLINE
 *    - توقف heartbeat 10+ ثاني = OFFLINE
 *    - الخادم يقرر الحالة من آخر heartbeat
 */
export function useScreensWithHeartbeat(clientId?: number): UseScreensWithHeartbeatReturn {
  const { clientId: authClientId, loading: authLoading } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenOnlineStatus, setScreenOnlineStatus] = useState<{ [screenId: number]: boolean }>({});
  const [openScreenTabs, setOpenScreenTabs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetClientId = clientId || authClientId || 1;

  // Track opened screen tabs via localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("openScreenTabs");
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setOpenScreenTabs(new Set(ids));
        } catch {
          setOpenScreenTabs(new Set());
        }
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    const interval = setInterval(handleStorageChange, 500); // تقليل الفاصل الزمني

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Auto-clean openScreenTabs if screen becomes offline
  useEffect(() => {
    const stored = localStorage.getItem("openScreenTabs");
    if (stored) {
      try {
        const ids: number[] = JSON.parse(stored);
        // الاحتفاظ فقط بالشاشات المتصلة
        const updated = ids.filter(id => {
          const screen = screens.find(s => s.id === id);
          return screen && screen.connectionStatus === "Online";
        });
        
        if (updated.length !== ids.length) {
          localStorage.setItem("openScreenTabs", JSON.stringify(updated));
          setOpenScreenTabs(new Set(updated));
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [screens]);

  /**
   * تحميل الشاشات من الخادم
   */
  const loadScreens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await screenApi.getAll({ clientId: targetClientId });

      // 🔄 عند Login: تحديث حالة جميع الشاشات من آخر heartbeat
      console.log("🔄 Checking online status for all screens...");
      const statusMap: { [screenId: number]: boolean } = {};

      for (const screen of response) {
        try {
          const statusResponse = await screenApi.checkOnlineStatus(screen.id);
          // ✅ الحالة تعتمد على heartbeat من الخادم
          statusMap[screen.id] = statusResponse.connectionStatus === "Online";
          console.log(
            `✅ Screen ${screen.id}: ${statusMap[screen.id] ? "ONLINE" : "OFFLINE"}`,
          );
        } catch (err) {
          console.error(`❌ Failed to check screen ${screen.id}:`, err);
          statusMap[screen.id] = false;
        }
      }

      setScreenOnlineStatus(statusMap);
      setScreens(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "فشل تحميل الشاشات من الخادم";
      setError(message);
      console.error("Failed to load screens from API:", err);
    } finally {
      setLoading(false);
    }
  }, [targetClientId]);

  /**
   * جديد: إرسال heartbeat لشاشة واحدة
   */
  const sendHeartbeatForScreen = useCallback(async (screenId: number) => {
    try {
      await screenApi.sendHeartbeat(screenId);
      console.log(`Heartbeat sent for screen ${screenId}`);
    } catch (err) {
      console.error(`Failed to send heartbeat for screen ${screenId}:`, err);
    }
  }, []);

  /**
   * جديد: التحقق من حالة الشاشة (هل هي online أم offline)
   */
  const checkScreenStatus = useCallback(async (screenId: number) => {
    try {
      const response = await screenApi.checkOnlineStatus(screenId);
      const isOnline = response.connectionStatus === "Online";

      setScreenOnlineStatus((prev) => ({
        ...prev,
        [screenId]: isOnline,
      }));

      console.log(`Screen ${screenId} status: ${isOnline ? "ONLINE" : "OFFLINE"}`);
    } catch (err) {
      console.error(`Failed to check status for screen ${screenId}:`, err);
      // في حالة الخطأ، نعتبر الشاشة offline
      setScreenOnlineStatus((prev) => ({
        ...prev,
        [screenId]: false,
      }));
    }
  }, []);

  const createScreen = useCallback(
    async (input: CreateScreenInput): Promise<Screen | null> => {
      try {
        setError(null);
        const screen = await screenApi.create(input);
        await loadScreens();
        return screen;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل إنشاء الشاشة");
        return null;
      }
    },
    [loadScreens],
  );

  const updateScreen = useCallback(
    async (id: number, input: UpdateScreenInput): Promise<Screen | null> => {
      try {
        setError(null);
        const screen = await screenApi.update(id, input);
        await loadScreens();
        return screen;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تحديث الشاشة");
        return null;
      }
    },
    [loadScreens],
  );

  const deleteScreen = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);
        await screenApi.delete(id);
        await loadScreens();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل حذف الشاشة");
        return false;
      }
    },
    [loadScreens],
  );

  const assignCampaign = useCallback(
    async (id: number, campaignId: number): Promise<Screen | null> => {
      try {
        setError(null);
        const screen = await screenApi.assignCampaign(id, campaignId);
        await loadScreens();
        return screen;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تعيين الحملة");
        return null;
      }
    },
    [loadScreens],
  );

  const removeCampaign = useCallback(
    async (id: number): Promise<Screen | null> => {
      try {
        setError(null);
        const screen = await screenApi.removeCampaign(id);
        await loadScreens();
        return screen;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل إزالة الحملة");
        return null;
      }
    },
    [loadScreens],
  );

  const refresh = useCallback(async () => {
    await loadScreens();
  }, [loadScreens]);

  // Load screens when auth loads or changes
  useEffect(() => {
    if (!authLoading) {
      loadScreens();
    }
  }, [loadScreens, authLoading]);

  /**
   * ✅ 🔄 localStorage listener
   * الاستماع لـ heartbeat من التبويبات الأخرى (نفس الجهاز)
   * تحديث فوري بدون reload
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("screen-heartbeat-")) {
        const screenId = parseInt(e.key.split("-")[2], 10);
        if (Number.isFinite(screenId)) {
          console.log(`📝 Storage update: Screen ${screenId} is ACTIVE`);

          setScreenOnlineStatus((prev) => ({
            ...prev,
            [screenId]: true,
          }));

          // تحديث الشاشة في القائمة
          setScreens((prev) =>
            prev.map((screen) =>
              screen.id === screenId
                ? { ...screen, connectionStatus: "Online" }
                : screen,
            ),
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * ✅ ⏱️ Periodic check كل 10 ثواني (محسّن)
   * للتحقق من الحالة الفعلية من الخادم
   * (ضروري للأجهزة المختلفة والتحديثات المتأخرة)
   * وقت Offline: بعد 10 ثواني من توقف heartbeat
   */
  useEffect(() => {
    if (screens.length === 0) return;

    const checkAllScreensStatus = async () => {
      console.log("🔄 Periodic check: checking all screens status...");

      const statusMap: { [screenId: number]: boolean } = {};

      for (const screen of screens) {
        try {
          const statusResponse = await screenApi.checkOnlineStatus(screen.id);
          statusMap[screen.id] = statusResponse.connectionStatus === "Online";
          console.log(
            `✅ Screen ${screen.id}: ${statusMap[screen.id] ? "ONLINE" : "OFFLINE"}`,
          );
        } catch (err) {
          console.error(`❌ Failed to check screen ${screen.id}:`, err);
          statusMap[screen.id] = false;
        }
      }

      setScreenOnlineStatus(statusMap);
      setScreens((prev) =>
        prev.map((screen) => ({
          ...screen,
          connectionStatus: statusMap[screen.id] ? "Online" : "Offline",
        })),
      );
    };

    // أول مرة بعد 5 ثواني (تجنب عدم الاستقرار في البداية)
    const initialTimer = setTimeout(() => {
      checkAllScreensStatus();
    }, 5000);

    // ثم كل 10 ثواني (بدلاً من 60)
    const interval = setInterval(() => {
      checkAllScreensStatus();
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [screens]);

  return {
    screens,
    screenOnlineStatus,
    openScreenTabs,
    loading,
    error,
    createScreen,
    updateScreen,
    deleteScreen,
    assignCampaign,
    removeCampaign,
    refresh,
  };
}
