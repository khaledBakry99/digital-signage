import { useState, useEffect, useCallback } from "react";
import { mediaAssetApi } from "../api/mediaAsset.api";
import { extractApiError } from "../api/client";
import type { MediaAsset, CreateMediaAssetInput } from "../types/mediaAsset";

export interface UseAdvertisementsReturn {
  advertisements: MediaAsset[];
  loading: boolean;
  error: string | null;
  createAdvertisement: (data: {
    name: string;
    file: File;
    description?: string;
    type: 'Image' | 'Video';
    durationSeconds?: number;
  }) => Promise<MediaAsset | null>;
  updateAdvertisement: (
    id: number,
    data: Partial<{
      name: string;
      description?: string;
      type?: 'Image' | 'Video';
    }>,
  ) => Promise<MediaAsset | null>;
  deleteAdvertisement: (id: number) => Promise<boolean>;
  getAdvertisementsByScreen: (screenId: number) => MediaAsset[];
  refresh: () => Promise<void>;
}

/**
 * Custom Hook لإدارة الإعلانات
 */
export function useAdvertisements(clientId?: number): UseAdvertisementsReturn {
  const [advertisements, setAdvertisements] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * تحميل جميع الإعلانات
   */
  const loadAdvertisements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ads = await mediaAssetApi.getAll({ clientId });
      setAdvertisements(ads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * إنشاء إعلان جديد
   */
  const createAdvertisement = useCallback(
    async (data: {
      name: string;
      file: File;
      description?: string;
      type: 'Image' | 'Video';
      durationSeconds?: number;
    }): Promise<MediaAsset | null> => {
      try {
        setError(null);
        if (!clientId) {
          setError("يجب تسجيل الدخول أولاً");
          return null;
        }
        const mediaAssetData: CreateMediaAssetInput = {
          clientId,
          name: data.name,
          description: data.description,
          type: data.type,
          file: data.file,
          durationSeconds: data.durationSeconds,
        };
        const ad = await mediaAssetApi.create(mediaAssetData);
        await loadAdvertisements();
        return ad;
      } catch (err) {
        setError(extractApiError(err, "فشل إنشاء الإعلان"));
        return null;
      }
    },
    [loadAdvertisements, clientId],
  );

  /**
   * تحديث إعلان موجود
   */
  const updateAdvertisement = useCallback(
    async (
      id: number,
      data: Partial<{
        name: string;
        description?: string;
        type?: 'Image' | 'Video';
      }>,
    ): Promise<MediaAsset | null> => {
      try {
        setError(null);
        const ad = await mediaAssetApi.update(id, data);
        await loadAdvertisements();
        return ad;
      } catch (err) {
        setError(extractApiError(err, "فشل تحديث الإعلان"));
        return null;
      }
    },
    [loadAdvertisements],
  );

  /**
   * حذف إعلان
   */
  const deleteAdvertisement = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);
        await mediaAssetApi.delete(id);
        await loadAdvertisements();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل حذف الإعلان");
        return false;
      }
    },
    [loadAdvertisements],
  );

  /**
   * الحصول على إعلانات شاشة معينة
   */
  const getAdvertisementsByScreen = useCallback(
    (screenId: number): MediaAsset[] => {
      return advertisements.filter((ad) => ad.clientId === screenId);
    },
    [advertisements],
  );

  /**
   * إعادة تحميل الإعلانات
   */
  const refresh = useCallback(async () => {
    await loadAdvertisements();
  }, [loadAdvertisements]);

  // تحميل الإعلانات عند التحميل الأول
  useEffect(() => {
    loadAdvertisements();
  }, [loadAdvertisements]);

  return {
    advertisements,
    loading,
    error,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    getAdvertisementsByScreen,
    refresh,
  };
}
