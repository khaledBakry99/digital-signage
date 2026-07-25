import { useState, useEffect, useCallback } from 'react';
import { screenApi } from '@/lib/api/screen.api';
import { extractApiError } from '@/lib/api/client';
import type {
  Screen,
  ScreenMediaSlots,
  ScreenActiveCampaign,
  ScreenCurrentMedia,
  MediaSlot,
  MediaAssignments,
} from '@/lib/types/screen';

export interface UseScreenAssignmentResult {
  // State
  screen: Screen | null;
  mediaSlots: ScreenMediaSlots | null;
  activeCampaign: ScreenActiveCampaign | null;
  currentMedia: ScreenCurrentMedia | null;
  loading: boolean;
  error: string | null;

  // Actions
  assignCampaign: (campaignId: number) => Promise<boolean>;
  removeCampaign: () => Promise<boolean>;
  assignMediaSlot: (slot: MediaSlot, mediaId: number) => Promise<boolean>;
  assignAllMedia: (assignments: MediaAssignments) => Promise<boolean>;
  removeMediaSlot: (slot: MediaSlot) => Promise<boolean>;
  clearAllMedia: () => Promise<boolean>;
  assignCamera: (cameraId: number) => Promise<boolean>;
  removeCamera: () => Promise<boolean>;
  toggleAI: (enabled: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
  refreshCurrentMedia: () => Promise<void>;
}

export function useScreenAssignment(screenId: number): UseScreenAssignmentResult {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [mediaSlots, setMediaSlots] = useState<ScreenMediaSlots | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<ScreenActiveCampaign | null>(null);
  const [currentMedia, setCurrentMedia] = useState<ScreenCurrentMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all screen data
  const fetchScreenData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [screenData, mediaSlotsData, campaignData, currentMediaData] = await Promise.all([
        screenApi.getById(screenId),
        screenApi.getMedia(screenId).catch(() => null),
        screenApi.getActiveCampaign(screenId).catch(() => null),
        screenApi.getCurrentMedia(screenId).catch(() => null),
      ]);

      setScreen(screenData);
      setMediaSlots(mediaSlotsData);
      setActiveCampaign(campaignData);
      setCurrentMedia(currentMediaData);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [screenId]);

  // Refresh current media only
  const refreshCurrentMedia = useCallback(async () => {
    try {
      const data = await screenApi.getCurrentMedia(screenId);
      setCurrentMedia(data);
    } catch (err) {
    }
  }, [screenId]);

  // Initial load
  useEffect(() => {
    fetchScreenData();
  }, [fetchScreenData]);

  // Assign campaign
  const assignCampaign = useCallback(
    async (campaignId: number): Promise<boolean> => {
      try {
        setError(null);
        const updatedScreen = await screenApi.assignCampaign(screenId, campaignId);
        setScreen(updatedScreen);

        // Refresh campaign and current media
        const [campaignData, currentMediaData] = await Promise.all([
          screenApi.getActiveCampaign(screenId).catch(() => null),
          screenApi.getCurrentMedia(screenId).catch(() => null),
        ]);
        setActiveCampaign(campaignData);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Remove campaign
  const removeCampaign = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const updatedScreen = await screenApi.removeCampaign(screenId);
      setScreen(updatedScreen);

      // Refresh campaign and current media
      const [campaignData, currentMediaData] = await Promise.all([
        screenApi.getActiveCampaign(screenId).catch(() => null),
        screenApi.getCurrentMedia(screenId).catch(() => null),
      ]);
      setActiveCampaign(campaignData);
      setCurrentMedia(currentMediaData);

      return true;
    } catch (err) {
      setError(extractApiError(err));
      return false;
    }
  }, [screenId]);

  // Assign media to specific slot
  const assignMediaSlot = useCallback(
    async (slot: MediaSlot, mediaId: number): Promise<boolean> => {
      try {
        setError(null);
        const updatedSlots = await screenApi.assignMediaSlot(screenId, slot, mediaId);
        setMediaSlots(updatedSlots);

        // Refresh screen and current media
        const [screenData, currentMediaData] = await Promise.all([
          screenApi.getById(screenId),
          screenApi.getCurrentMedia(screenId).catch(() => null),
        ]);
        setScreen(screenData);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Assign all media slots at once
  const assignAllMedia = useCallback(
    async (assignments: MediaAssignments): Promise<boolean> => {
      try {
        setError(null);
        const updatedScreen = await screenApi.assignAllMedia(screenId, assignments);
        setScreen(updatedScreen);

        // Refresh media slots and current media
        const [mediaSlotsData, currentMediaData] = await Promise.all([
          screenApi.getMedia(screenId).catch(() => null),
          screenApi.getCurrentMedia(screenId).catch(() => null),
        ]);
        setMediaSlots(mediaSlotsData);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Remove media from specific slot
  const removeMediaSlot = useCallback(
    async (slot: MediaSlot): Promise<boolean> => {
      try {
        setError(null);
        const updatedSlots = await screenApi.removeMediaSlot(screenId, slot);
        setMediaSlots(updatedSlots);

        // Refresh screen and current media
        const [screenData, currentMediaData] = await Promise.all([
          screenApi.getById(screenId),
          screenApi.getCurrentMedia(screenId).catch(() => null),
        ]);
        setScreen(screenData);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Clear all media slots
  const clearAllMedia = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const updatedSlots = await screenApi.clearAllMedia(screenId);
      setMediaSlots(updatedSlots);

      // Refresh screen and current media
      const [screenData, currentMediaData] = await Promise.all([
        screenApi.getById(screenId),
        screenApi.getCurrentMedia(screenId).catch(() => null),
      ]);
      setScreen(screenData);
      setCurrentMedia(currentMediaData);

      return true;
    } catch (err) {
      setError(extractApiError(err));
      return false;
    }
  }, [screenId]);

  // Assign camera
  const assignCamera = useCallback(
    async (cameraId: number): Promise<boolean> => {
      try {
        setError(null);
        const updatedScreen = await screenApi.assignCamera(screenId, cameraId);
        setScreen(updatedScreen);

        // Refresh current media
        const currentMediaData = await screenApi.getCurrentMedia(screenId).catch(() => null);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Remove camera
  const removeCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const updatedScreen = await screenApi.removeCamera(screenId);
      setScreen(updatedScreen);

      // Refresh current media
      const currentMediaData = await screenApi.getCurrentMedia(screenId).catch(() => null);
      setCurrentMedia(currentMediaData);

      return true;
    } catch (err) {
      setError(extractApiError(err));
      return false;
    }
  }, [screenId]);

  // Toggle AI
  const toggleAI = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      try {
        setError(null);
        const updatedScreen = enabled
          ? await screenApi.enableScreenAI(screenId)
          : await screenApi.disableScreenAI(screenId);
        setScreen(updatedScreen);

        // Refresh current media
        const currentMediaData = await screenApi.getCurrentMedia(screenId).catch(() => null);
        setCurrentMedia(currentMediaData);

        return true;
      } catch (err) {
        setError(extractApiError(err));
        return false;
      }
    },
    [screenId]
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    await fetchScreenData();
  }, [fetchScreenData]);

  return {
    // State
    screen,
    mediaSlots,
    activeCampaign,
    currentMedia,
    loading,
    error,

    // Actions
    assignCampaign,
    removeCampaign,
    assignMediaSlot,
    assignAllMedia,
    removeMediaSlot,
    clearAllMedia,
    assignCamera,
    removeCamera,
    toggleAI,
    refresh,
    refreshCurrentMedia,
  };
}
