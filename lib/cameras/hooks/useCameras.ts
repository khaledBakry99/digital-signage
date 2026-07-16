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
  if (s.startsWith("http:") || s.startsWith("https:")) return "http";
  return "local";
}

export function mapBackendToFrontendCamera(bc: BackendCamera, isOnline?: boolean | number): Camera {
  // إذا كان isOnline رقماً، فهو index من map() - نتجاهله
  const onlineStatus = typeof isOnline === 'boolean' ? isOnline : undefined;

  return {
    id: String(bc.id),
    name: bc.name,
    location: bc.location,
    type: deriveTypeFromSource(bc.cameraDeviceName),
    source: bc.cameraDeviceName,
    // 🔄 الحالة تعتمد على heartbeat وليس على state
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
 * ✅ نظام الـ heartbeat يتحكم في حالة الكاميرا:
 *    - heartbeat كل 40 ثانية من تبويب مفتوح = ACTIVE
 *    - توقف heartbeat 60+ ثانية = INACTIVE
 *    - الخادم يقرر الحالة من آخر heartbeat
 */
export function useCameras(): UseCamerasReturn {
  const { clientId, loading: authLoading } = useAuth();
  const [backendCameras, setBackendCameras] = useState<BackendCamera[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraOnlineStatus, setCameraOnlineStatus] = useState<{ [cameraId: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * تحميل الكاميرات من الخادم
   */
  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const targetClientId = clientId || 1;
      const response = await cameraApi.getAll({ clientId: targetClientId });

      setBackendCameras(response);
      // 🔄 عند Login: تحديث حالة جميع الكاميرات من آخر heartbeat
      console.log("🔄 Checking online status for all cameras...");
      const statusMap: { [cameraId: number]: boolean } = {};

      for (const camera of response) {
        try {
          const statusResponse = await cameraApi.checkOnlineStatus(camera.id);
          // ✅ الحالة تعتمد على heartbeat من الخادم
          statusMap[camera.id] = statusResponse.state === "Active";
          console.log(`✅ Camera ${camera.id}: ${statusMap[camera.id] ? 'ONLINE' : 'OFFLINE'}`);
        } catch (err) {
          console.error(`❌ Failed to check camera ${camera.id}:`, err);
          statusMap[camera.id] = false;
        }
      }

      setCameraOnlineStatus(statusMap);
      setCameras(response.map(cam => mapBackendToFrontendCamera(cam, statusMap[cam.id])));
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
   * جديد: إرسال heartbeat لكاميرا واحدة
   */
  const sendHeartbeatForCamera = useCallback(async (cameraId: number) => {
    try {
      await cameraApi.sendHeartbeat(cameraId);
      console.log(`Heartbeat sent for camera ${cameraId}`);
    } catch (err) {
      console.error(`Failed to send heartbeat for camera ${cameraId}:`, err);
    }
  }, []);

  /**
   * جديد: التحقق من حالة الكاميرا (هل هي online أم offline)
   */
  const checkCameraStatus = useCallback(async (cameraId: number) => {
    try {
      const response = await cameraApi.checkOnlineStatus(cameraId);
      const isOnline = response.state === "Active";

      setCameraOnlineStatus(prev => ({
        ...prev,
        [cameraId]: isOnline
      }));

      console.log(`Camera ${cameraId} status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (err) {
      console.error(`Failed to check status for camera ${cameraId}:`, err);
      // في حالة الخطأ، نعتبر الكاميرا offline
      setCameraOnlineStatus(prev => ({
        ...prev,
        [cameraId]: false
      }));
    }
  }, []);

  /**
   * جديد: بدء دورة heartbeat لجميع الكاميرات (كل 40 ثانية)
   */
  const startHeartbeatCycle = useCallback(async () => {
    if (backendCameras.length === 0) return;

    backendCameras.forEach(camera => {
      // إرسال heartbeat
      sendHeartbeatForCamera(camera.id);

      // التحقق من الحالة
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

  /**
   * ✅ 🔄 localStorage listener
   * الاستماع لـ heartbeat من التبويبات الأخرى (نفس الجهاز)
   * تحديث فوري بدون reload
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("camera-heartbeat-")) {
        const cameraId = parseInt(e.key.split("-")[2], 10);
        if (Number.isFinite(cameraId)) {
          console.log(`📝 Storage update: Camera ${cameraId} is ACTIVE`);

          setCameraOnlineStatus(prev => ({
            ...prev,
            [cameraId]: true
          }));

          // تحديث الكاميرا في القائمة
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
   * ✅ ⏱️ Periodic check كل 60 ثانية
   * للتحقق من الحالة الفعلية من الخادم
   * (ضروري للأجهزة المختلفة والتحديثات المتأخرة)
   */
  useEffect(() => {
    if (backendCameras.length === 0) return;

    const checkAllCamerasStatus = async () => {
      console.log("🔄 Periodic check: checking all cameras status...");

      const statusMap: { [cameraId: number]: boolean } = {};

      for (const camera of backendCameras) {
        try {
          const statusResponse = await cameraApi.checkOnlineStatus(camera.id);
          // Check if response has the expected structure
          if (statusResponse && typeof statusResponse.state === 'string') {
            statusMap[camera.id] = statusResponse.state === "Active";
            console.log(`✅ Camera ${camera.id}: ${statusMap[camera.id] ? 'ONLINE' : 'OFFLINE'}`);
          } else {
            console.warn(`⚠️ Invalid response for camera ${camera.id}:`, statusResponse);
            statusMap[camera.id] = false;
          }
        } catch (err) {
          console.error(`❌ Failed to check camera ${camera.id}:`, err);
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

    // أول مرة بعد 30 ثانية (تجنب عدم الاستقرار في البداية)
    const initialTimer = setTimeout(() => {
      checkAllCamerasStatus();
    }, 30000);

    // ثم كل 60 ثانية
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
