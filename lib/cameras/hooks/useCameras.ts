"use client";

import { useState, useEffect, useCallback } from "react";
import type { Camera, CameraType } from "@/lib/types/camera";
import { cameraApi, type BackendCamera, type CameraState } from "@/lib/api";
import type { CameraSourceType } from "@/lib/api/camera.api";
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
    sourceType: string;
  }) => Promise<BackendCamera>;
  updateCamera: (
    id: string | number,
    data: {
      name: string;
      location: string;
      cameraDeviceName: string;
      cameraDeviceRealName?: string;
      timeToScreenshot?: number;
      sourceType?: string;
    },
  ) => Promise<BackendCamera>;
  deleteCamera: (id: string | number) => Promise<void>;
  activateCamera: (id: string | number) => Promise<BackendCamera>;
  deactivateCamera: (id: string | number) => Promise<BackendCamera>;
  refreshCameras: () => Promise<void>;
}

// Function to map backend sourceType to CameraType
function mapSourceTypeToCameraType(sourceType: string): CameraType {
  const normalized = sourceType.toLowerCase();
  if (normalized === "rtsp") return "rtsp";
  if (normalized === "hls") return "hls";
  if (normalized === "http") return "http";
  if (normalized === "usb" || normalized === "local" || normalized === "webcam") return "local";
  return "local";
}

export function mapBackendToFrontendCamera(bc: BackendCamera, isOnline?: boolean | number): Camera {
  console.log('[mapBackendToFrontendCamera] ===== تحويل كاميرا من الباك إند إلى الفرونت إند =====');
  console.log('[mapBackendToFrontendCamera] معرف الكاميرا:', bc.id);
  console.log('[mapBackendToFrontendCamera] نوع المصدر من الباك إند:', bc.sourceType);
  console.log('[mapBackendToFrontendCamera] اسم جهاز الكاميرا:', bc.cameraDeviceName);
  console.log('[mapBackendToFrontendCamera] رابط التشغيل (playbackUrl):', bc.playbackUrl || 'غير متاح');
  console.log('[mapBackendToFrontendCamera] مسار الكاميرا (cameraPathName):', bc.cameraPathName || 'غير متاح');

  // If isOnline is a number, it's an index from map() - ignore it
  const onlineStatus = typeof isOnline === 'boolean' ? isOnline : undefined;

  // Map backend sourceType to CameraType
  const cameraType = mapSourceTypeToCameraType(bc.sourceType);
  console.log('[mapBackendToFrontendCamera] نوع الكاميرا بعد التحويل:', cameraType);

  const camera: Camera = {
    id: String(bc.id),
    name: bc.name,
    location: bc.location,
    type: cameraType,
    source: bc.cameraDeviceName,
    sourceType: bc.sourceType,

    // NEW: Playback information from Backend
    playback: bc.playbackUrl ? {
      webrtcUrl: bc.playbackUrl,
      streamPath: bc.cameraPathName
    } : undefined,

    // RTSP config (source only, not for playback)
    rtspConfig: bc.sourceType === 'RTSP' && bc.cameraDeviceName ? {
      rtspUrl: bc.cameraDeviceName
    } : undefined,

    cameraDeviceRealName: bc.cameraDeviceRealName,
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

  console.log('[mapBackendToFrontendCamera] معلومات التشغيل:', camera.playback);
  console.log('[mapBackendToFrontendCamera] ✓ تم التحويل بنجاح');

  return camera;
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
    console.log('[useCameras] ===== بدء تحميل قائمة الكاميرات =====');
    console.log('[useCameras] معرف العميل:', clientId);

    try {
      setLoading(true);
      setError(null);

      if (!clientId) {
        console.error('[useCameras] خطأ: معرف العميل غير موجود');
        setError("No client ID provided");
        setLoading(false);
        return;
      }

      console.log('[useCameras] جاري جلب الكاميرات من الخادم...');
      const response = await cameraApi.getAll({ clientId });
      console.log('[useCameras] تم استلام', response.length, 'كاميرا من الخادم');

      setBackendCameras(response);
      // On Login: Update all cameras status from last heartbeat
      const statusMap: { [cameraId: number]: boolean } = {};

      console.log('[useCameras] جاري التحقق من حالة كل كاميرا...');
      for (const camera of response) {
        console.log('[useCameras] التحقق من حالة الكاميرا', camera.id, '-', camera.name);
        try {
          const statusResponse = await cameraApi.checkOnlineStatus(camera.id);
          // Status depends on heartbeat from server
          statusMap[camera.id] = statusResponse.state === "Active";
          console.log('[useCameras]   ✓ حالة الكاميرا:', statusMap[camera.id] ? 'نشطة' : 'غير نشطة');
        } catch (err) {
          console.error('[useCameras]   ✗ فشل التحقق من حالة الكاميرا:', err);
          statusMap[camera.id] = false;
        }
      }

      setCameraOnlineStatus(statusMap);

      console.log('[useCameras] جاري تحويل الكاميرات إلى تنسيق الفرونت إند...');
      const frontendCameras = response.map(cam => mapBackendToFrontendCamera(cam, statusMap[cam.id]));
      setCameras(frontendCameras);

      console.log('[useCameras] ✓ تم تحميل', frontendCameras.length, 'كاميرا بنجاح');
    } catch (err) {
      console.error('[useCameras] ✗ فشل تحميل الكاميرات:', err);
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
      sourceType: string;
    }): Promise<BackendCamera> => {
      console.log('[useCameras] ===== بدء عملية إضافة كاميرا =====');
      console.log('[useCameras] البيانات المستلمة:', JSON.stringify(data, null, 2));
      console.log('[useCameras] معرف العميل (clientId):', clientId);

      try {
        setError(null);

        if (!clientId) {
          console.error('[useCameras] خطأ: معرف العميل غير موجود');
          throw new Error("No client ID provided");
        }

        const requestData = {
          clientId,
          name: data.name,
          location: data.location,
          cameraDeviceName: data.cameraDeviceName,
          cameraDeviceRealName: data.cameraDeviceRealName,
          timeToScreenshot: data.timeToScreenshot || 10,
          sourceType: data.sourceType as CameraSourceType, // البak إند يتوقع string وليس enum
        };

        console.log('[useCameras] البيانات التي سيتم إرسالها إلى API:', JSON.stringify(requestData, null, 2));
        console.log('[useCameras] جاري إرسال الطلب إلى /api/Cameras...');

        const newCamera = await cameraApi.create(requestData);

        console.log('[useCameras] ✓ تم إنشاء الكاميرا بنجاح');
        console.log('[useCameras] معرف الكاميرا الجديدة:', newCamera.id);
        console.log('[useCameras] نوع المصدر المرجع:', newCamera.sourceType);
        console.log('[useCameras] رابط التشغيل (playbackUrl):', newCamera.playbackUrl || 'غير متاح');
        console.log('[useCameras] مسار الكاميرا (cameraPathName):', newCamera.cameraPathName || 'غير متاح');

        console.log('[useCameras] جاري تحديث قائمة الكاميرات...');
        await loadCameras();
        console.log('[useCameras] ✓ تم تحديث قائمة الكاميرات');

        return newCamera;
      } catch (err) {
        console.error('[useCameras] ✗ فشل إضافة الكاميرا:', err);

        if (err instanceof Error) {
          console.error('[useCameras] رسالة الخطأ:', err.message);
          console.error('[useCameras] تتبع الخطأ:', err.stack);
        }

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
        sourceType?: string;
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
          sourceType: (data.sourceType || 'USB') as CameraSourceType, // البak إند يتوقع string
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
