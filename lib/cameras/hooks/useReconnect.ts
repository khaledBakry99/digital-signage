"use client";

import { useState, useEffect, useCallback } from "react";
import type { Camera, ReconnectConfig } from "@/lib/types/camera";
import { reconnectService } from "../services/reconnectService";

interface UseReconnectReturn {
  isReconnecting: boolean;
  reconnectAttempt: number;
  startMonitoring: (onReconnect: () => void) => void;
  stopMonitoring: () => void;
  manualReconnect: () => Promise<boolean>;
}

/**
 * useReconnect Hook
 * Manages automatic reconnection for a camera
 */
export function useReconnect(
  camera: Camera | null,
  config?: Partial<ReconnectConfig>,
): UseReconnectReturn {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  /**
   * Start monitoring for disconnections
   */
  const startMonitoring = useCallback(
    (onReconnect: () => void) => {
      if (!camera) return;

      reconnectService.startMonitoring(
        camera,
        () => {
          setIsReconnecting(false);
          setReconnectAttempt(0);
          onReconnect();
        },
        config,
      );
    },
    [camera, config],
  );

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!camera) return;

    reconnectService.stopMonitoring(camera.id);
    setIsReconnecting(false);
    setReconnectAttempt(0);
  }, [camera]);

  /**
   * Manual reconnect attempt
   */
  const manualReconnect = useCallback(async (): Promise<boolean> => {
    if (!camera) return false;

    try {
      setIsReconnecting(true);
      setReconnectAttempt(0);

      const success = await reconnectService.attemptReconnect(camera, config);

      if (success) {
        setIsReconnecting(false);
        setReconnectAttempt(0);
      }

      return success;
    } catch (error) {
      setIsReconnecting(false);
      return false;
    }
  }, [camera, config]);

  /**
   * Update reconnect attempt count periodically
   */
  useEffect(() => {
    if (!camera || !isReconnecting) return;

    const interval = setInterval(() => {
      const attempt = reconnectService.getReconnectAttempt(camera.id);
      setReconnectAttempt(attempt);
    }, 1000);

    return () => clearInterval(interval);
  }, [camera, isReconnecting]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    isReconnecting,
    reconnectAttempt,
    startMonitoring,
    stopMonitoring,
    manualReconnect,
  };
}
