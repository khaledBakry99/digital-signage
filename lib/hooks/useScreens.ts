import { useState, useEffect, useCallback } from "react";
import { screenApi } from "../api/screen.api";
import type { Screen, CreateScreenInput, UpdateScreenInput } from "../types/screen";

export interface UseScreensReturn {
  screens: Screen[];
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
 * Custom Hook للشاشات
 */
export function useScreens(clientId?: number): UseScreensReturn {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScreens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allScreens = await screenApi.getAll({ clientId });
      setScreens(allScreens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل الشاشات");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const createScreen = useCallback(async (input: CreateScreenInput): Promise<Screen | null> => {
    try {
      setError(null);
      const screen = await screenApi.create(input);
      await loadScreens();
      return screen;
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء الشاشة");
      return null;
    }
  }, [loadScreens]);

  const updateScreen = useCallback(async (id: number, input: UpdateScreenInput): Promise<Screen | null> => {
    try {
      setError(null);
      const screen = await screenApi.update(id, input);
      await loadScreens();
      return screen;
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحديث الشاشة");
      return null;
    }
  }, [loadScreens]);

  const deleteScreen = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await screenApi.delete(id);
      await loadScreens();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف الشاشة");
      return false;
    }
  }, [loadScreens]);

  const assignCampaign = useCallback(async (id: number, campaignId: number): Promise<Screen | null> => {
    try {
      setError(null);
      const screen = await screenApi.assignCampaign(id, campaignId);
      await loadScreens();
      return screen;
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تعيين الحملة");
      return null;
    }
  }, [loadScreens]);

  const removeCampaign = useCallback(async (id: number): Promise<Screen | null> => {
    try {
      setError(null);
      const screen = await screenApi.removeCampaign(id);
      await loadScreens();
      return screen;
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إزالة الحملة");
      return null;
    }
  }, [loadScreens]);

  const refresh = useCallback(async () => {
    await loadScreens();
  }, [loadScreens]);

  useEffect(() => {
    loadScreens();
  }, [loadScreens]);

  return {
    screens,
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
