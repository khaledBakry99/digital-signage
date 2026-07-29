"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Camera } from "@/lib/types/camera";

interface FloatingCameraContextType {
  floatingCameras: Map<string, Camera>;
  openFloatingCamera: (camera: Camera) => void;
  closeFloatingCamera: (cameraId: string) => void;
  isCameraFloating: (cameraId: number) => boolean;
}

const FloatingCameraContext = createContext<FloatingCameraContextType | undefined>(
  undefined
);

export function FloatingCameraProvider({ children }: { children: ReactNode }) {
  const [floatingCameras, setFloatingCameras] = useState<Map<string, Camera>>(new Map());

  const openFloatingCamera = (camera: Camera) => {
    setFloatingCameras((prev) => {
      const next = new Map(prev);
      next.set(camera.id, camera);
      return next;
    });
  };

  const closeFloatingCamera = (cameraId: string) => {
    setFloatingCameras((prev) => {
      const next = new Map(prev);
      next.delete(cameraId);
      return next;
    });
  };

  const isCameraFloating = (cameraId: number) => {
    return floatingCameras.has(String(cameraId));
  };

  return (
    <FloatingCameraContext.Provider
      value={{
        floatingCameras,
        openFloatingCamera,
        closeFloatingCamera,
        isCameraFloating,
      }}
    >
      {children}
    </FloatingCameraContext.Provider>
  );
}

export function useFloatingCamera() {
  const context = useContext(FloatingCameraContext);
  if (context === undefined) {
    throw new Error("useFloatingCamera must be used within a FloatingCameraProvider");
  }
  return context;
}
