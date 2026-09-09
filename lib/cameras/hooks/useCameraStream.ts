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
      if (!camera) {
        setError("لا توجد كاميرا محددة");
        return;
      }

      try {
        setIsConnecting(true);
        setError(null);
        elementRef.current = element;

        // Local Webcam
        if (camera.type === "local") {
          if (element instanceof HTMLVideoElement) {
            const stream = await localCameraHandler.startStream(
              camera.source,
              element,
            );
            streamRef.current = stream;
          } else {
            throw new Error("Local camera requires a video element");
          }
        }
        // RTSP Camera → WebRTC
        else if (camera.type === "rtsp") {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error("RTSP camera requires a video element");
          }

          // Get WebRTC playback URL from backend
          const webrtcUrl = camera.playback?.webrtcUrl;

          if (!webrtcUrl) {
            throw new Error(
              "WebRTC playback URL غير متاح. " +
              "يرجى التأكد من أن MediaMTX مكوّن بشكل صحيح على الخادم."
            );
          }

          // Start WebRTC stream
          await webrtcHandler.startWebRTCStream(webrtcUrl, element);
          currentPlaybackUrlRef.current = webrtcUrl;
        }
        // Network cameras (HLS, HTTP/MJPEG)
        else {
          await networkCameraHandler.startNetworkStream(
            camera.source,
            camera.type,
            element,
          );
        }

        setIsPlaying(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل بدء البث";
        setError(message);
        console.error('[useCameraStream] Error starting stream:', err);
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
