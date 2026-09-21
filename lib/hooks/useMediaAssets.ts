/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { mediaAssetApi } from '@/lib/api/mediaAsset.api';
import type { MediaAsset, MediaType, UpdateMediaAssetInput } from '@/lib/types/mediaAsset';

type UpdateMediaAssetWithFileInput = {
  name: string;
  description?: string;
  file: File;
  type: MediaType;
  durationSeconds?: number;
};

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
    data: UpdateMediaAssetInput | UpdateMediaAssetWithFileInput
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

// Hook for paginated media assets
export function useMediaAssetsPaginated(params?: { clientId?: number; itemsPerPage?: number }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(params?.itemsPerPage || 8);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaAsset[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchMediaAssets = useCallback(async (page: number, perPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaAssetApi.getByPage(page, {
        clientId: params?.clientId,
        itemsPerPage: perPage,
      });
      setMediaAssets(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [params?.clientId]);

  const searchMediaAssets = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      fetchMediaAssets(1, itemsPerPage);
      return;
    }

    try {
      setLoading(true);
      setIsSearching(true);
      setError(null);
      const results = await mediaAssetApi.search({
        clientId: params?.clientId,
        name: query,
      });
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل البحث');
    } finally {
      setLoading(false);
    }
  }, [params?.clientId, itemsPerPage, fetchMediaAssets]);

  const updateMediaAsset = useCallback(async (
    id: number, 
    data: UpdateMediaAssetInput | UpdateMediaAssetWithFileInput
  ) => {
    try {
      setError(null);
      // Check if file is provided for upload
      if ('file' in data && data.file) {
        await mediaAssetApi.updateWithFile(id, data);
      } else {
        await mediaAssetApi.update(id, data as UpdateMediaAssetInput);
      }
      await fetchMediaAssets(currentPage, itemsPerPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الإعلان');
      throw err;
    }
  }, [fetchMediaAssets, currentPage, itemsPerPage]);

  const deleteMediaAsset = useCallback(async (id: number, force: boolean = false) => {
    try {
      setError(null);
      await mediaAssetApi.delete(id, force);
      // If deleting the last item on the current page, go to previous page
      if (mediaAssets.length === 1 && currentPage > 1) {
        await fetchMediaAssets(currentPage - 1, itemsPerPage);
      } else {
        await fetchMediaAssets(currentPage, itemsPerPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الإعلان');
      throw err;
    }
  }, [fetchMediaAssets, currentPage, mediaAssets.length, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchMediaAssets(page, itemsPerPage);
    }
  }, [totalPages, fetchMediaAssets, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchMediaAssets(currentPage + 1, itemsPerPage);
    }
  }, [currentPage, totalPages, fetchMediaAssets, itemsPerPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      fetchMediaAssets(currentPage - 1, itemsPerPage);
    }
  }, [currentPage, fetchMediaAssets, itemsPerPage]);

  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Reset to first page when changing items per page
    fetchMediaAssets(1, newItemsPerPage);
  }, [fetchMediaAssets]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMediaAssets(1, itemsPerPage);
    }
  }, [params?.clientId, itemsPerPage, searchQuery]);

  // Get the correct data source
  const displayedAssets = isSearching ? searchResults : mediaAssets;

  return { 
    mediaAssets: displayedAssets, 
    loading, 
    error, 
    currentPage, 
    totalItems: isSearching ? searchResults.length : totalItems, 
    totalPages: isSearching ? 1 : totalPages,
    itemsPerPage,
    isSearching,
    searchQuery,
    setSearchQuery,
    search: searchMediaAssets,
    refetch: () => fetchMediaAssets(currentPage, itemsPerPage), 
    updateMediaAsset, 
    deleteMediaAsset,
    goToPage,
    nextPage,
    previousPage,
    changeItemsPerPage,
  };
}
