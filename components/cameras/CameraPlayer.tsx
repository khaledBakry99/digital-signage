"use client";

import { useEffect, useRef, useState } from "react";
import type { Camera } from "@/lib/types/camera";
import { useCameraStream } from "@/lib/cameras/hooks/useCameraStream";
import { useReconnect } from "@/lib/cameras/hooks/useReconnect";
import { cameraScreenshotService } from "@/lib/services/cameraScreenshotService";

interface CameraPlayerProps {
  camera: Camera;
  autoStart?: boolean;
}

export function CameraPlayer({ camera, autoStart = true }: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isPlaying, isConnecting, error, startStream, stopStream, reconnect } =
    useCameraStream(camera);

  const { isReconnecting, reconnectAttempt, startMonitoring, manualReconnect } =
    useReconnect(camera);

  // Start stream on mount
  useEffect(() => {
    if (!autoStart) return;

    const element =
      camera.type === "local" || camera.type === "hls" || camera.type === "rtsp"
        ? videoRef.current
        : imgRef.current;

    if (element) {
      // Notify background service that camera is opened in a tab
      if (typeof window !== "undefined") {
        // For same-window communication, directly call the service
        if (camera.type === "local") {
          // Import dynamically to avoid SSR issues
          import("@/lib/cameras/services/backgroundCameraService").then(
            ({ backgroundCameraService }) => {
              backgroundCameraService.pauseCamera(camera.id);
            },
          );
        }

        // For cross-tab communication, use localStorage
        localStorage.setItem("camera-tab-open", camera.id);
        localStorage.removeItem("camera-tab-open");
        localStorage.setItem("camera-tab-open", camera.id);
      }

      startStream(element);

      // Start monitoring for disconnections
      startMonitoring(() => {
        if (element) {
          reconnect(element);
        }
      });

      // ✅ بدء التقاط لقطات الكاميرا وإرسالها للـ AI
      let stopCapture: (() => void) | null = null;
      if (
        element instanceof HTMLVideoElement &&
        (camera.type === "local" || camera.type === "hls" || camera.type === "rtsp")
      ) {
        try {
          stopCapture = cameraScreenshotService.startPeriodicCapture(
            element,
            Number(camera.id),
            camera.timeToScreenshot || 30, // الفاصل الزمني من إعدادات الكاميرا
          );
          console.log(`✅ تم بدء التقاط لقطات الكاميرا ${camera.id} كل ${camera.timeToScreenshot || 30} ثانية`);
        } catch (error) {
          console.error(`❌ فشل بدء التقاط لقطات الكاميرا ${camera.id}:`, error);
        }
      }

      return () => {
        stopStream();

        // ✅ إيقاف التقاط اللقطات
        if (stopCapture) {
          stopCapture();
        }

        // Notify background service that camera tab is closed
        if (typeof window !== "undefined") {
          // For same-window communication, directly call the service
          if (camera.type === "local") {
            import("@/lib/cameras/services/backgroundCameraService").then(
              ({ backgroundCameraService }) => {
                backgroundCameraService.resumeCamera(camera.id);
              },
            );
          }

          // For cross-tab communication, use localStorage
          localStorage.setItem("camera-tab-close", camera.id);
          localStorage.removeItem("camera-tab-close");
          localStorage.setItem("camera-tab-close", camera.id);
        }
      };
    }
  }, [camera, autoStart, startStream, stopStream, startMonitoring, reconnect]);

  const handleFullscreen = () => {
    const element = videoRef.current || imgRef.current;
    if (!element) return;

    if (!isFullscreen) {
      element.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleManualReconnect = async () => {
    const element =
      camera.type === "local" || camera.type === "hls" || camera.type === "rtsp"
        ? videoRef.current
        : imgRef.current;

    if (element) {
      await reconnect(element);
    }
  };

  const showVideo =
    camera.type === "local" || camera.type === "hls" || camera.type === "rtsp";

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video Element */}
      {showVideo && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted
        />
      )}

      {/* Image Element (for MJPEG) */}
      {!showVideo && (
        <img
          ref={imgRef}
          className="w-full h-full object-contain"
          alt={camera.name}
        />
      )}

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>جاري الاتصال بالكاميرا...</p>
          </div>
        </div>
      )}

      {/* Reconnecting Overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p>جاري إعادة الاتصال...</p>
            <p className="text-sm text-gray-300 mt-2">
              محاولة {reconnectAttempt} من 3
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isConnecting && !isReconnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white max-w-md px-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
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
            <p className="text-lg font-semibold mb-2">فشل الاتصال</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleManualReconnect}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {isPlaying && !error && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={handleFullscreen}
            className="bg-black bg-opacity-50 text-white p-3 rounded-lg hover:bg-opacity-70 transition-colors"
            title="ملء الشاشة"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            onClick={handleManualReconnect}
            className="bg-black bg-opacity-50 text-white p-3 rounded-lg hover:bg-opacity-70 transition-colors"
            title="إعادة الاتصال"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Camera Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
        <p className="font-semibold">{camera.name}</p>
        <p className="text-xs text-gray-300">{camera.settings.resolution}</p>
      </div>
    </div>
  );
}
