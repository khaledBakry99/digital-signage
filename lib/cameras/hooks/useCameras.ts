"use client";

import { useState, useEffect, useCallback } from "react";
import type { Camera, CameraType } from "@/lib/types/camera";
import { cameraApi, type BackendCamera, type CameraState } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface UseCamerasReturn {
  cameras: Camera[];
  backendCameras: BackendCamera[];
  cameraOnlineStatus: { [cameraId: number]: boolean };
  loading: boolean;
  error: string | null;
  addCamera: (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    cameraDeviceRealName?: string;
    timeToScreenshot?: number;
  }) => Promise<BackendCamera>;
  updateCamera: (
    id: string | number,
    data: {
      name: string;
      location: string;
      cameraDeviceName: string;
      cameraDeviceRealName?: string;
      timeToScreenshot?: number;
    },
  ) => Promise<BackendCamera>;
  deleteCamera: (id: string | number) => Promise<void>;
  activateCamera: (id: string | number) => Promise<BackendCamera>;
  deactivateCamera: (id: string | number) => Promise<BackendCamera>;
  refreshCameras: () => Promise<void>;
}

// Function to convert server object to interface-compatible object
function deriveTypeFromSource(source: string): CameraType {
  const s = (source || "").toLowerCase();
  if (s.startsWith("rtsp:")) return "rtsp";
  if (s.endsWith(".m3u8") || s.includes("m3u8") || s.includes("/hls")) return "hls";
  if (s.startsWith("http:") || s.startsWith("https:")) return "http";
  return "local";
}

export function mapBackendToFrontendCamera(bc: BackendCamera, isOnline?: boolean | number): Camera {
  // If isOnline is a number, it's an index from map() - ignore it
  const onlineStatus = typeof isOnline === 'boolean' ? isOnline : undefined;

  return {
    id: String(bc.id),
    name: bc.name,
    location: bc.location,
    type: deriveTypeFromSource(bc.cameraDeviceName),
    source: bc.cameraDeviceName,
    cameraDeviceRealName: bc.cameraDeviceRealName,
    // Status depends on heartbeat, not state
    status: onlineStatus !== undefined ? (onlineStatus ? "connected" : "disconnected") : (bc.state === "Active" ? "connected" : "disconnected"),
    timeToScreenshot: bc.timeToScreenshot,
    settings: {
      resolution: "1080p",
      frameRate: 30,
      quality: "high",
    },
    createdAtUtc: bc.createdAtUtc,
    createdAt: new Date(bc.createdAtUtc),
    updatedAt: new Date(bc.createdAtUtc),
  };
}

/**
 * useCameras Hook
 * Heartbeat system controls camera status:
 *    - heartbeat every 40 seconds from open tab = ACTIVE
 *    - heartbeat stops for 60+ seconds = INACTIVE
 *    - Server determines status from last heartbeat
 */
export function useCameras(): UseCamerasReturn {
  const { clientId, loading: authLoading } = useAuth();
  const [backendCameras, setBackendCameras] = useState<BackendCamera[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraOnlineStatus, setCameraOnlineStatus] = useState<{ [cameraId: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cameras from server
   */
  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!clientId) {
        setError("No client ID provided");
        setLoading(false);
        return;
      }

      const response = await cameraApi.getAll({ clientId });

      setBackendCameras(response);
      // On Login: Update all cameras status from last heartbeat
      const statusMap: { [cameraId: number]: boolean } = {};

      for (const camera of response) {
        try {
          const statusResponse = await cameraApi.checkOnlineStatus(camera.id);
          // Status depends on heartbeat from server
          statusMap[camera.id] = statusResponse.state === "Active";
        } catch (err) {
          statusMap[camera.id] = false;
        }
      }

      setCameraOnlineStatus(statusMap);
      setCameras(response.map(cam => mapBackendToFrontendCamera(cam, statusMap[cam.id])));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load cameras from server";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Send heartbeat for single camera
   */
  const sendHeartbeatForCamera = useCallback(async (cameraId: number) => {
    try {
      await cameraApi.sendHeartbeat(cameraId);
    } catch (err) {
    }
  }, []);

  /**
   * Check camera status (online or offline)
   */
  const checkCameraStatus = useCallback(async (cameraId: number) => {
    try {
      const response = await cameraApi.checkOnlineStatus(cameraId);
      const isOnline = response.state === "Active";

      setCameraOnlineStatus(prev => ({
        ...prev,
        [cameraId]: isOnline
      }));

    } catch (err) {
      // On error, consider camera offline
      setCameraOnlineStatus(prev => ({
        ...prev,
        [cameraId]: false
      }));
    }
  }, []);

  /**
   * Start heartbeat cycle for all cameras (every 40 seconds)
   */
  const startHeartbeatCycle = useCallback(async () => {
    if (backendCameras.length === 0) return;

    backendCameras.forEach(camera => {
      // Send heartbeat
      sendHeartbeatForCamera(camera.id);

      // Check status
      checkCameraStatus(camera.id);
    });
  }, [backendCameras, sendHeartbeatForCamera, checkCameraStatus]);

  /**
   * Add a new camera
   */
  const addCamera = useCallback(
    async (data: {
      name: string;
      location: string;
      cameraDeviceName: string;
      cameraDeviceRealName?: string;
      timeToScreenshot?: number;
    }): Promise<BackendCamera> => {
      try {
        setError(null);

        if (!clientId) {
          throw new Error("No client ID provided");
        }

        const newCamera = await cameraApi.create({
          clientId,
          name: data.name,
          location: data.location,
          cameraDeviceName: data.cameraDeviceName,
          cameraDeviceRealName: data.cameraDeviceRealName,
          timeToScreenshot: data.timeToScreenshot || 10,
        });

        await loadCameras();
        return newCamera;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add camera via server";
        setError(message);
        throw err;
      }
    },
    [clientId, loadCameras],
  );

  /**
   * Update an existing camera
   */
  const updateCamera = useCallback(
    async (
      id: string | number,
      data: {
        name: string;
        location: string;
        cameraDeviceName: string;
        cameraDeviceRealName?: string;
        timeToScreenshot?: number;
      },
    ): Promise<BackendCamera> => {
      try {
        setError(null);
        const numericId = Number(id);

        const updated = await cameraApi.update(numericId, {
          name: data.name,
          location: data.location,
          cameraDeviceName: data.cameraDeviceName,
          cameraDeviceRealName: data.cameraDeviceRealName,
          timeToScreenshot: data.timeToScreenshot || 10,
        });

        await loadCameras();
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update camera via server";
        setError(message);
        throw err;
      }
    },
    [loadCameras],
  );

  /**
   * Delete a camera
   */
  const deleteCamera = useCallback(async (id: string | number): Promise<void> => {
    try {
      setError(null);
      const numericId = Number(id);

      await cameraApi.delete(numericId);
      await loadCameras();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete camera from server";
      setError(message);
      throw err;
    }
  }, [loadCameras]);

  /**
   * Activate a camera
   */
  const activateCamera = useCallback(async (id: string | number): Promise<BackendCamera> => {
    try {
      setError(null);
      const numericId = Number(id);
      const updated = await cameraApi.activate(numericId);
      await loadCameras();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to activate camera";
      setError(message);
      throw err;
    }
  }, [loadCameras]);

  /**
   * Deactivate a camera
   */
  const deactivateCamera = useCallback(async (id: string | number): Promise<BackendCamera> => {
    try {
      setError(null);
      const numericId = Number(id);
      const updated = await cameraApi.deactivate(numericId);
      await loadCameras();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to deactivate camera";
      setError(message);
      throw err;
    }
  }, [loadCameras]);

  /**
   * Refresh cameras list
   */
  const refreshCameras = useCallback(async (): Promise<void> => {
    await loadCameras();
  }, [loadCameras]);

  // Load cameras when auth loads or changes
  useEffect(() => {
    if (!authLoading) {
      const fetchCameras = async () => {
        await loadCameras();
      };
      fetchCameras();
    }
  }, [loadCameras, authLoading]);

  /**
   * localStorage listener
   * Listen for heartbeat from other tabs (same device)
   * Instant update without reload
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("camera-heartbeat-")) {
        const cameraId = parseInt(e.key.split("-")[2], 10);
        if (Number.isFinite(cameraId)) {

          setCameraOnlineStatus(prev => ({
            ...prev,
            [cameraId]: true
          }));

          // Update camera in list
          setCameras(prev =>
            prev.map(cam =>
              Number(cam.id) === cameraId
                ? mapBackendToFrontendCamera(backendCameras.find(bc => bc.id === cameraId)!, true)
                : cam
            )
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [backendCameras]);

  /**
   * Periodic check every 60 seconds
   * Verify actual status from server
   * (necessary for different devices and delayed updates)
   */
  useEffect(() => {
    if (backendCameras.length === 0) return;

    const checkAllCamerasStatus = async () => {

      const statusMap: { [cameraId: number]: boolean } = {};

      for (const camera of backendCameras) {
        try {
          const statusResponse = await cameraApi.checkOnlineStatus(camera.id);
          // Check if response has the expected structure
          if (statusResponse && typeof statusResponse.state === 'string') {
            statusMap[camera.id] = statusResponse.state === "Active";
          } else {
            statusMap[camera.id] = false;
          }
        } catch (err) {
          statusMap[camera.id] = false;
        }
      }

      setCameraOnlineStatus(statusMap);
      setCameras(
        backendCameras.map(cam =>
          mapBackendToFrontendCamera(cam, statusMap[cam.id])
        )
      );
    };

    // First time after 30 seconds (avoid initial instability)
    const initialTimer = setTimeout(() => {
      checkAllCamerasStatus();
    }, 30000);

    // Then every 60 seconds
    const interval = setInterval(() => {
      checkAllCamerasStatus();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [backendCameras]);

  return {
    cameras,
    backendCameras,
    cameraOnlineStatus,
    loading,
    error,
    addCamera,
    updateCamera,
    deleteCamera,
    activateCamera,
    deactivateCamera,
    refreshCameras,
  };
}
