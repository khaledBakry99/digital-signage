"use client";

import { useState, useEffect, useCallback } from "react";
import { screenApi } from "@/lib/api/screen.api";
import type { Screen, CreateScreenInput, UpdateScreenInput } from "@/lib/types/screen";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Helper: Register open screen tab
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
 * Helper: Unregister screen tab (on close)
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
 * Custom Hook for screens with Heartbeat system
 * Heartbeat system controls screen status:
 *    - heartbeat every 40 seconds from open tab = ONLINE
 *    - heartbeat stops for 10+ seconds = OFFLINE
 *    - Server determines status from last heartbeat
 */
export function useScreensWithHeartbeat(clientId?: number): UseScreensWithHeartbeatReturn {
  const { clientId: authClientId, loading: authLoading } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenOnlineStatus, setScreenOnlineStatus] = useState<{ [screenId: number]: boolean }>({});
  const [openScreenTabs, setOpenScreenTabs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetClientId = clientId || authClientId;

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

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Note: We do NOT auto-clean openScreenTabs based on online/offline status
  // The tab remains "open" until the user explicitly closes the window/tab
  // This ensures the "Open Screen" button stays disabled as long as the tab is open

  /**
   * Load screens from server
   */
  const loadScreens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!targetClientId) {
        setError("No client ID provided");
        setLoading(false);
        return;
      }

      const response = await screenApi.getAll({ clientId: targetClientId });

      // On Login: Update all screens status from last heartbeat
      const statusMap: { [screenId: number]: boolean } = {};

      for (const screen of response) {
        try {
          const statusResponse = await screenApi.checkOnlineStatus(screen.id);
          // Status depends on heartbeat from server
          statusMap[screen.id] = statusResponse.connectionStatus === "Online";
        } catch (err) {
          statusMap[screen.id] = false;
        }
      }

      setScreenOnlineStatus(statusMap);
      setScreens(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load screens from server";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [targetClientId]);

  /**
   * Send heartbeat for single screen
   */
  const sendHeartbeatForScreen = useCallback(async (screenId: number) => {
    try {
      await screenApi.sendHeartbeat(screenId);
    } catch (err) {
    }
  }, []);

  /**
   * Check screen status (online or offline)
   */
  const checkScreenStatus = useCallback(async (screenId: number) => {
    try {
      const response = await screenApi.checkOnlineStatus(screenId);
      const isOnline = response.connectionStatus === "Online";

      setScreenOnlineStatus((prev) => ({
        ...prev,
        [screenId]: isOnline,
      }));

    } catch (err) {
      // On error, consider screen offline
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
        setError(err instanceof Error ? err.message : "Failed to create screen");
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
        setError(err instanceof Error ? err.message : "Failed to update screen");
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
        setError(err instanceof Error ? err.message : "Failed to delete screen");
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
        setError(err instanceof Error ? err.message : "Failed to assign campaign");
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
        setError(err instanceof Error ? err.message : "Failed to remove campaign");
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
   * localStorage listener
   * Listen for heartbeat from other tabs (same device)
   * Instant update without reload
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("screen-heartbeat-")) {
        const screenId = parseInt(e.key.split("-")[2], 10);
        if (Number.isFinite(screenId)) {

          setScreenOnlineStatus((prev) => ({
            ...prev,
            [screenId]: true,
          }));

          // Update screen in list
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
   * Periodic check every 10 seconds (improved)
   * Verify actual status from server
   * (necessary for different devices and delayed updates)
   * Offline time: after 10 seconds of heartbeat stop
   */
  useEffect(() => {
    if (screens.length === 0) return;

    const checkAllScreensStatus = async () => {

      const statusMap: { [screenId: number]: boolean } = {};

      for (const screen of screens) {
        try {
          const statusResponse = await screenApi.checkOnlineStatus(screen.id);
          statusMap[screen.id] = statusResponse.connectionStatus === "Online";
        } catch (err) {
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

    // First time after 5 seconds (avoid initial instability)
    const initialTimer = setTimeout(() => {
      checkAllScreensStatus();
    }, 5000);

    // Then every 10 seconds (instead of 60)
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
