"use client";

import { useState, useEffect, useCallback } from "react";
import type { Camera, CameraType } from "@/lib/types/camera";
import { cameraApi, type BackendCamera, type CameraState } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface UseCamerasReturn {
  cameras: Camera[];
  backendCameras: BackendCamera[];
  loading: boolean;
  error: string | null;
  addCamera: (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    timeToScreenshot?: number;
  }) => Promise<BackendCamera>;
  updateCamera: (
    id: string | number,
    data: {
      name: string;
      location: string;
      cameraDeviceName: string;
      timeToScreenshot?: number;
    },
  ) => Promise<BackendCamera>;
  deleteCamera: (id: string | number) => Promise<void>;
  activateCamera: (id: string | number) => Promise<BackendCamera>;
  deactivateCamera: (id: string | number) => Promise<BackendCamera>;
  refreshCameras: () => Promise<void>;
}

// دالة تحويل الكائن القادم من الخادم لكائن متوافق مع الواجهة
function deriveTypeFromSource(source: string): CameraType {
  const s = (source || "").toLowerCase();
  if (s.startsWith("rtsp:")) return "rtsp";
  if (s.endsWith(".m3u8") || s.includes("m3u8") || s.includes("/hls")) return "hls";
  if (s.startsWith("http:" ) || s.startsWith("https:")) return "http";
  return "local";
}

export function mapBackendToFrontendCamera(bc: BackendCamera): Camera {
  return {
    id: String(bc.id),
    name: bc.name,
    location: bc.location,
    type: deriveTypeFromSource(bc.cameraDeviceName),
    source: bc.cameraDeviceName,
    status: bc.state === "Active" ? "connected" : "disconnected",
    timeToScreenshot: bc.timeToScreenshot,
    settings: {
      resolution: "1080p",
      frameRate: 30,
      quality: "high",
    },
    createdAt: new Date(bc.createdAtUtc),
    updatedAt: new Date(bc.createdAtUtc),
  };
}

/**
 * useCameras Hook
 * Manages camera list state and operations via backend API
 */
export function useCameras(): UseCamerasReturn {
  const { clientId, loading: authLoading } = useAuth();
  const [backendCameras, setBackendCameras] = useState<BackendCamera[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cameras from API
   */
  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // نستخدم clientId الموثق أو الافتراضي (1)
      const targetClientId = clientId || 1;
      const response = await cameraApi.getAll({ clientId: targetClientId });
      
      setBackendCameras(response);
      setCameras(response.map(mapBackendToFrontendCamera));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "فشل تحميل الكاميرات من الخادم";
      setError(message);
      console.error("Failed to load cameras from API:", err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Add a new camera
   */
  const addCamera = useCallback(
    async (data: {
      name: string;
      location: string;
      cameraDeviceName: string;
      timeToScreenshot?: number;
    }): Promise<BackendCamera> => {
      try {
        setError(null);
        const targetClientId = clientId || 1;

        const newCamera = await cameraApi.create({
          clientId: targetClientId,
          name: data.name,
          location: data.location,
          cameraDeviceName: data.cameraDeviceName,
          timeToScreenshot: data.timeToScreenshot || 10,
        });

        await loadCameras();
        return newCamera;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "فشل إضافة الكاميرا عبر السيرفر";
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
          timeToScreenshot: data.timeToScreenshot || 10,
        });

        await loadCameras();
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "فشل تحديث الكاميرا عبر السيرفر";
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
      const message = err instanceof Error ? err.message : "فشل حذف الكاميرا من السيرفر";
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
      const message = err instanceof Error ? err.message : "فشل تفعيل الكاميرا";
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
      const message = err instanceof Error ? err.message : "فشل إيقاف تفعيل الكاميرا";
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

  return {
    cameras,
    backendCameras,
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
