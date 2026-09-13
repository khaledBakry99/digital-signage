"use client";

import { useEffect, useRef, useState } from "react";
import type { Camera } from "@/lib/types/camera";
import { useCameraStream } from "@/lib/cameras/hooks/useCameraStream";
import { useReconnect } from "@/lib/cameras/hooks/useReconnect";
import { cameraScreenshotService } from "@/lib/services/cameraScreenshotService";
import { cameraApi } from "@/lib/api";

interface CameraPlayerProps {
  camera: Camera;
  autoStart?: boolean;
}

export function CameraPlayer({ camera, autoStart = true }: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

      // Start ObjectDetector and send screenshot only when person count changes
      let stopCapture: (() => void) | null = null;
      if (
        element instanceof HTMLVideoElement &&
        (camera.type === "local" || camera.type === "hls" || camera.type === "rtsp")
      ) {
        try {
          stopCapture = cameraScreenshotService.startObjectDetectionCapture(
            element,
            Number(camera.id),
            true,
          );
        } catch (error) {
        }
      }

      return () => {
        stopStream();

        // Stop screenshot capture
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

  /**
   * HEARTBEAT controls camera status
   * + Updates localStorage for other pages (same device)
   * + Updates server directly (different devices)
   */
  useEffect(() => {
    if (!autoStart) return;

    const cameraId = Number(camera.id);
    if (!Number.isFinite(cameraId) || cameraId <= 0) return;


    // Send heartbeat immediately when tab opens
    const sendHeartbeat = async () => {
      try {
        await cameraApi.sendHeartbeat(cameraId);

        // Update localStorage for other pages (same device)
        if (typeof window !== "undefined") {
          const timestamp = Date.now().toString();
          localStorage.setItem(`camera-heartbeat-${cameraId}`, timestamp);
        }
      } catch (err) {
      }
    };

    sendHeartbeat();

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 40000); // 40 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [camera.id, autoStart]);


  const handleManualReconnect = async () => {
    const element =
      camera.type === "local" || camera.type === "hls" || camera.type === "rtsp"
        ? videoRef.current
        : imgRef.current;

    if (element) {
      await reconnect(element);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
          onDoubleClick={handleDoubleClick}
        />
      )}

      {/* Image Element (for MJPEG) */}
      {!showVideo && (
        <img
          ref={imgRef}
          className="w-full h-full object-contain"
          alt={camera.name}
          onDoubleClick={handleDoubleClick}
        />
      )}

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: '#ffffff' }}>جاري الاتصال بالكاميرا...</p>
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
    </div>
  );
}
