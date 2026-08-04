/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { mediaAssetApi } from '@/lib/api/mediaAsset.api';
import type { MediaAsset, UpdateMediaAssetInput } from '@/lib/types/mediaAsset';

export function useMediaAssets(params?: { clientId?: number }) {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaAssetApi.getAll(params);
      setMediaAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateMediaAsset = useCallback(async (
    id: number, 
    data: UpdateMediaAssetInput | { name: string; description?: string; file: File; type?: 'Image' | 'Video'; durationSeconds?: number }
  ) => {
    try {
      setError(null);
      // Check if file is provided for upload
      if ('file' in data && data.file) {
        await mediaAssetApi.updateWithFile(id, data);
      } else {
        await mediaAssetApi.update(id, data as UpdateMediaAssetInput);
      }
      await fetchMediaAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الإعلان');
      throw err;
    }
  }, [fetchMediaAssets]);

  const deleteMediaAsset = useCallback(async (id: number, force: boolean = false) => {
    try {
      setError(null);
      await mediaAssetApi.delete(id, force);
      await fetchMediaAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الإعلان');
      throw err;
    }
  }, [fetchMediaAssets]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchMediaAssets();
  }, [params?.clientId]);

  return { mediaAssets, loading, error, refetch: fetchMediaAssets, updateMediaAsset, deleteMediaAsset };
}
