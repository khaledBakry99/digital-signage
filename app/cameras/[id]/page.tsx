"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CameraPlayer } from "@/components/cameras/CameraPlayer";
import { cameraApi } from "@/lib/api";
import type { Camera, CameraType } from "@/lib/types/camera";

export default function CameraViewPage() {
  const params = useParams();
  const router = useRouter();
  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Activate the camera on mount and deactivate on unmount
  useEffect(() => {
    const id = Number(params.id);
    
    // Activate camera
    cameraApi.activate(id)
      .then(() => console.log(`✅ تم تفعيل الكاميرا ${id}`))
      .catch((err) => console.error(`❌ فشل تفعيل الكاميرا ${id}:`, err));

    // Deactivate camera on cleanup
    return () => {
      cameraApi.deactivate(id)
        .then(() => console.log(`🔴 تم تعطيل الكاميرا ${id}`))
        .catch((err) => console.error(`❌ فشل تعطيل الكاميرا ${id}:`, err));
    };
  }, [params.id]);

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

        // Map backend camera to UI shape
        const cameraData: Camera = {
          id: String(backendCamera.id),
          name: backendCamera.name,
          location: backendCamera.location,
          type: deriveTypeFromSource(backendCamera.cameraDeviceName),
          source: backendCamera.cameraDeviceName,
          status:
            backendCamera.state === "Active" ? "connected" : "disconnected",
          timeToScreenshot: backendCamera.timeToScreenshot,
          settings: {
            resolution: "1080p",
            frameRate: 30,
            quality: "high",
          },
          createdAt: new Date(backendCamera.createdAtUtc),
          updatedAt: new Date(backendCamera.createdAtUtc),
        };

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

  // Helper function to derive camera type from source
  function deriveTypeFromSource(source: string): CameraType {
    const s = (source || "").toLowerCase();
    if (s.startsWith("rtsp:")) return "rtsp";
    if (s.endsWith(".m3u8") || s.includes("m3u8") || s.includes("/hls"))
      return "hls";
    if (s.startsWith("http:") || s.startsWith("https:")) return "http";
    return "local";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحميل...</p>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-gray-900">
      <CameraPlayer camera={camera} autoStart={true} />

      {/* Back Button */}
      <button
        onClick={() => router.push("/cameras")}
        className="fixed top-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg hover:bg-opacity-70 transition-colors z-50"
        title="العودة"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
    </div>
  );
}
