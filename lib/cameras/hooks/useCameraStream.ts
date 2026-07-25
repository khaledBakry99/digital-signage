"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Camera } from "@/lib/types/camera";
import { localCameraHandler } from "../streaming/localCamera";
import { networkCameraHandler } from "../streaming/networkCamera";

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
 */
export function useCameraStream(camera: Camera | null): UseCameraStreamReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const elementRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);

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

        if (camera.type === "local") {
          // Local camera
          if (element instanceof HTMLVideoElement) {
            const stream = await localCameraHandler.startStream(
              camera.source,
              element,
            );
            streamRef.current = stream;
          } else {
            throw new Error("Local camera requires a video element");
          }
        } else {
          // Network camera
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
        // Don't stop the stream if other elements are using it
        if (elementRef.current instanceof HTMLVideoElement) {
          localCameraHandler.removeUser(camera.source, elementRef.current);
        }
        streamRef.current = null;
      } else {
        networkCameraHandler.stopNetworkStream(camera.source, camera.type);
      }

      setIsPlaying(false);
      setError(null);
    } catch (err) {
    }
  }, [camera]);

  /**
   * Reconnect to camera
   */
  const reconnect = useCallback(
    async (element: HTMLVideoElement | HTMLImageElement): Promise<void> => {
      stopStream();
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
