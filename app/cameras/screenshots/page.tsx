"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { screenshotService } from "@/lib/cameras/services/screenshotService";
import type { CameraScreenshot } from "@/lib/cameras/services/screenshotService";

export default function CameraScreenshotsPage() {
  const router = useRouter();
  const { cameras } = useCameras();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<CameraScreenshot[]>([]);
  const [selectedImage, setSelectedImage] = useState<CameraScreenshot | null>(
    null,
  );

  useEffect(() => {
    if (cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0].id);
    }
  }, [cameras, selectedCamera]);

  useEffect(() => {
    if (selectedCamera) {
      // Load screenshots from storage
      screenshotService.loadFromStorage(selectedCamera);

      // Get screenshots
      const cameraScreenshots =
        screenshotService.getScreenshots(selectedCamera);
      setScreenshots(cameraScreenshots);

      // Refresh every 5 seconds
      const interval = setInterval(() => {
        const updated = screenshotService.getScreenshots(selectedCamera);
        setScreenshots(updated);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedCamera]);

  const handleDownload = (screenshot: CameraScreenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.dataUrl;
    link.download = `${screenshot.cameraName}_${screenshot.timestamp.toISOString()}.jpg`;
    link.click();
  };

  const handleDelete = (index: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
      const updated = screenshots.filter((_, i) => i !== index);
      setScreenshots(updated);
      // Note: This only removes from UI, not from service
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/cameras")}
            className="text-gray-400 hover:text-white transition-colors"
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
          <div>
            <h1 className="text-3xl font-bold text-white">
              سكرين شوتات الكاميرات
            </h1>
            <p className="text-gray-400 mt-1">
              عرض وإدارة الصور الملتقطة من الكاميرات
            </p>
          </div>
        </div>

        {cameras.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">لا توجد كاميرات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Camera List */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-white font-semibold mb-4">الكاميرات</h2>
                <div className="space-y-2">
                  {cameras.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => setSelectedCamera(camera.id)}
                      className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                        selectedCamera === camera.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-medium">{camera.name}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {screenshots.length} صورة
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Screenshots Grid */}
            <div className="lg:col-span-3">
              {screenshots.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-400">لا توجد صور لهذه الكاميرا</p>
                  <p className="text-gray-500 text-sm mt-2">
                    سيتم التقاط الصور تلقائياً كل 30 ثانية
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {screenshots.map((screenshot, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg overflow-hidden group relative"
                    >
                      <img
                        src={screenshot.dataUrl}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => setSelectedImage(screenshot)}
                      />
                      <div className="p-3">
                        <p className="text-gray-400 text-xs">
                          {new Date(screenshot.timestamp).toLocaleString(
                            "ar-SA",
                          )}
                        </p>
                      </div>
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => handleDownload(screenshot)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                          title="تحميل"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                          title="حذف"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-5xl w-full">
              <img
                src={selectedImage.dataUrl}
                alt="Screenshot"
                className="w-full h-auto rounded-lg"
              />
              <div className="text-center mt-4">
                <p className="text-white text-lg">{selectedImage.cameraName}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedImage.timestamp).toLocaleString("ar-SA")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
