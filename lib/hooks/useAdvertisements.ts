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
    data: {
      name: string;
      description?: string;
      isFallback?: boolean;
      file?: File;
      durationSeconds?: number;
    },
  ) => Promise<MediaAsset | null>;
  deleteAdvertisement: (id: number) => Promise<boolean>;
  getAdvertisementsByScreen: (screenId: number) => MediaAsset[];
  refresh: () => Promise<void>;
}

/**
 * Custom Hook for managing advertisements
 */
export function useAdvertisements(clientId?: number): UseAdvertisementsReturn {
  const [advertisements, setAdvertisements] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all advertisements
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
   * Create new advertisement
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
   * Update existing advertisement
   */
  const updateAdvertisement = useCallback(
    async (
      id: number,
      data: {
        name: string;
        description?: string;
        isFallback?: boolean;
        file?: File;
        durationSeconds?: number;
      },
    ): Promise<MediaAsset | null> => {
      try {
        setError(null);
        
        // If file is provided, use updateWithFile endpoint
        if (data.file) {
          const mediaType = data.file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(data.file.name)
            ? 'Image'
            : 'Video';
          const ad = await mediaAssetApi.updateWithFile(id, {
            name: data.name,
            description: data.description,
            file: data.file,
            type: mediaType,
            durationSeconds: data.durationSeconds,
          });
          await loadAdvertisements();
          return ad;
        }
        
        // Otherwise, use regular update endpoint
        const existingAdvertisement = advertisements.find((advertisement) => advertisement.id === id);
        const ad = await mediaAssetApi.update(id, {
          name: data.name,
          description: data.description,
          type: existingAdvertisement?.type,
          isFallback: data.isFallback,
          durationSeconds: data.durationSeconds,
        });
        await loadAdvertisements();
        return ad;
      } catch (err) {
        setError(extractApiError(err, "فشل تحديث الإعلان"));
        return null;
      }
    },
    [advertisements, loadAdvertisements],
  );

  /**
   * Delete advertisement
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
   * Get advertisements for specific screen
   */
  const getAdvertisementsByScreen = useCallback(
    (screenId: number): MediaAsset[] => {
      return advertisements.filter((ad) => ad.clientId === screenId);
    },
    [advertisements],
  );

  /**
   * Reload advertisements
   */
  const refresh = useCallback(async () => {
    await loadAdvertisements();
  }, [loadAdvertisements]);

  // Load advertisements on first mount
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
