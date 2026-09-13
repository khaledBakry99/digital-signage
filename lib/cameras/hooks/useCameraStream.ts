"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Camera } from "@/lib/types/camera";
import { localCameraHandler } from "../streaming/localCamera";
import { networkCameraHandler } from "../streaming/networkCamera";
import { webrtcHandler } from "../streaming/webrtcHandler";

interface UseCameraStreamReturn {
  isPlaying: boolean;
  isConnecting: boolean;
  error: string | null;
  startStream: (element: HTMLVideoElement | HTMLImageElement) => Promise<void>;
  stopStream: () => void;
  reconnect: (element: HTMLVideoElement | HTMLImageElement) => Promise<void>;
}

/**
 * useCameraStream Hook
 * Manages camera stream state and operations
 *
 * Architecture:
 * - Local Webcam → getUserMedia
 * - RTSP → WebRTC (via playbackUrl from backend)
 * - HLS → HLS.js
 * - HTTP/MJPEG → Image element
 */
export function useCameraStream(camera: Camera | null): UseCameraStreamReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const elementRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const currentPlaybackUrlRef = useRef<string | null>(null);

  /**
   * Start camera stream
   */
  const startStream = useCallback(
    async (element: HTMLVideoElement | HTMLImageElement): Promise<void> => {
      console.log('[useCameraStream] ===== بدء تشغيل بث الكاميرا =====');

      if (!camera) {
        console.error('[useCameraStream] خطأ: لا توجد كاميرا محددة');
        setError("لا توجد كاميرا محددة");
        return;
      }

      console.log('[useCameraStream] معلومات الكاميرا:');
      console.log('[useCameraStream]   - المعرف:', camera.id);
      console.log('[useCameraStream]   - الاسم:', camera.name);
      console.log('[useCameraStream]   - النوع:', camera.type);
      console.log('[useCameraStream]   - نوع المصدر:', camera.sourceType);
      console.log('[useCameraStream]   - المصدر:', camera.source);
      console.log('[useCameraStream]   - معلومات التشغيل:', camera.playback);

      try {
        setIsConnecting(true);
        setError(null);
        elementRef.current = element;

        // Local Webcam
        if (camera.type === "local") {
          console.log('[useCameraStream] نوع الكاميرا: محلية (USB/Webcam)');
          if (element instanceof HTMLVideoElement) {
            console.log('[useCameraStream] جاري بدء بث الكاميرا المحلية...');
            const stream = await localCameraHandler.startStream(
              camera.source,
              element,
            );
            streamRef.current = stream;
            console.log('[useCameraStream] ✓ تم بدء بث الكاميرا المحلية بنجاح');
          } else {
            console.error('[useCameraStream] خطأ: الكاميرا المحلية تتطلب عنصر فيديو');
            throw new Error("Local camera requires a video element");
          }
        }
        // RTSP Camera → WebRTC
        else if (camera.type === "rtsp") {
          console.log('[useCameraStream] نوع الكاميرا: RTSP');

          if (!(element instanceof HTMLVideoElement)) {
            console.error('[useCameraStream] خطأ: كاميرا RTSP تتطلب عنصر فيديو');
            throw new Error("RTSP camera requires a video element");
          }

          // Get WebRTC playback URL from backend
          let webrtcUrl = camera.playback?.webrtcUrl;
          console.log('[useCameraStream] رابط WebRTC للتشغيل (أصلي):', webrtcUrl || 'غير متاح');

          if (!webrtcUrl) {
            console.error('[useCameraStream] خطأ: رابط WebRTC للتشغيل غير متاح');
            console.error('[useCameraStream] تفاصيل الكاميرا:', JSON.stringify(camera, null, 2));
            throw new Error(
              "WebRTC playback URL غير متاح. " +
              "يرجى التأكد من أن MediaMTX مكوّن بشكل صحيح على الخادم."
            );
          }

          // Fix localhost URLs by replacing with actual backend host
          // Only replace if backend is NOT localhost (i.e., backend is remote)
          if (webrtcUrl.includes('localhost') || webrtcUrl.includes('127.0.0.1')) {
            const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-42316129731.europe-west1.run.app';
            const isBackendLocal = backendUrl.includes('localhost') 
                    || backendUrl.includes('127.0.0.1')
                    || backendUrl.includes('host.docker.internal');

            
            // Only replace localhost if backend is remote
            if (!isBackendLocal) {
              const backendHost = new URL(backendUrl).hostname;
              
              // Replace localhost with backend hostname, keep the port
              webrtcUrl = webrtcUrl.replace(/localhost|127\.0\.0\.1/g, backendHost);
              
              console.log('[useCameraStream] ⚠️ تم استبدال localhost بعنوان الخادم (Backend على Cloud)');
              console.log('[useCameraStream] رابط WebRTC للتشغيل (بعد الإصلاح):', webrtcUrl);
            } else {
              console.log('[useCameraStream] ℹ️ Backend محلي - استخدام localhost مباشرة');
            }
          }

          // Start WebRTC stream
          console.log('[useCameraStream] جاري بدء بث WebRTC...');
          await webrtcHandler.startWebRTCStream(webrtcUrl, element);
          currentPlaybackUrlRef.current = webrtcUrl;
          console.log('[useCameraStream] ✓ تم بدء بث WebRTC بنجاح');
        }
        // Network cameras (HLS, HTTP/MJPEG)
        else {
          console.log('[useCameraStream] نوع الكاميرا: شبكية (' + camera.type + ')');
          console.log('[useCameraStream] جاري بدء بث الكاميرا الشبكية...');
          await networkCameraHandler.startNetworkStream(
            camera.source,
            camera.type,
            element,
          );
          console.log('[useCameraStream] ✓ تم بدء بث الكاميرا الشبكية بنجاح');
        }

        setIsPlaying(true);
        console.log('[useCameraStream] ✓ تم تشغيل البث بنجاح');
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل بدء البث";
        setError(message);
        console.error('[useCameraStream] ✗ فشل بدء البث:', err);
        if (err instanceof Error) {
          console.error('[useCameraStream] رسالة الخطأ:', err.message);
          console.error('[useCameraStream] تتبع الخطأ:', err.stack);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [camera],
  );

  /**
   * Stop camera stream
   */
  const stopStream = useCallback(() => {
    try {
      if (!camera) return;

      if (camera.type === "local" && streamRef.current) {
        // For local cameras, remove this element as a user
        if (elementRef.current instanceof HTMLVideoElement) {
          localCameraHandler.removeUser(camera.source, elementRef.current);
        }
        streamRef.current = null;
      } else if (camera.type === "rtsp" && currentPlaybackUrlRef.current) {
        // Stop WebRTC stream
        webrtcHandler.stopWebRTCStream(currentPlaybackUrlRef.current);
        currentPlaybackUrlRef.current = null;
      } else {
        // Stop network camera stream
        networkCameraHandler.stopNetworkStream(camera.source, camera.type);
      }

      setIsPlaying(false);
      setError(null);
    } catch (err) {
      console.error('[useCameraStream] Error stopping stream:', err);
    }
  }, [camera]);

  /**
   * Reconnect to camera
   */
  const reconnect = useCallback(
    async (element: HTMLVideoElement | HTMLImageElement): Promise<void> => {
      stopStream();

      // Small delay before reconnecting
      await new Promise(resolve => setTimeout(resolve, 500));

      await startStream(element);
    },
    [stopStream, startStream],
  );

  /**
   * Cleanup on unmount or camera change
   */
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    isPlaying,
    isConnecting,
    error,
    startStream,
    stopStream,
    reconnect,
  };
}
