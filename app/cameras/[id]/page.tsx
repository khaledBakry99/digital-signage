"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CameraPlayer } from "@/components/cameras/CameraPlayer";
import { cameraApi } from "@/lib/api";
import type { Camera } from "@/lib/types/camera";
import { mapBackendToFrontendCamera } from "@/lib/cameras/hooks/useCameras";

export default function CameraViewPage() {
  const params = useParams();
  const router = useRouter();
  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCamera = async () => {
      try {
        const id = Number(params.id);

        // Fetch from backend API using cameraApi
        const backendCamera = await cameraApi.getById(id);

        if (!backendCamera) {
          setError("الكاميرا غير موجودة");
          return;
        }

        // Map backend camera to UI shape using the updated mapper
        const cameraData = mapBackendToFrontendCamera(backendCamera);

        setCamera(cameraData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "فشل تحميل بيانات الكاميرا",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCamera();
  }, [params.id]);

  /**
   * Server determines status from last heartbeat:
   * - If heartbeat stops for 60+ seconds = INACTIVE
   * - If heartbeat continues = ACTIVE
   */
  useEffect(() => {
    return () => {
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black" />
    );
  }

  if (error || !camera) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">خطأ</h2>
          <p className="text-gray-400 mb-6">{error || "الكاميرا غير موجودة"}</p>
          <button
            onClick={() => router.push("/cameras")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <CameraPlayer camera={camera} autoStart={true} />
    </div>
  );
}
