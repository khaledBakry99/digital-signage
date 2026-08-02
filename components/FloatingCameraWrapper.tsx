"use client";

import { useFloatingCamera } from "@/lib/context/FloatingCameraContext";
import { FloatingCameraPlayer } from "@/components/cameras/FloatingCameraPlayer";

export function FloatingCameraWrapper() {
  const { floatingCameras, closeFloatingCamera } = useFloatingCamera();

  if (floatingCameras.size === 0) {
    return null;
  }

  return (
    <>
      {Array.from(floatingCameras.entries()).map(([cameraId, camera], index) => (
        <FloatingCameraPlayer
          key={cameraId}
          camera={camera}
          onClose={() => closeFloatingCamera(cameraId)}
          index={index}
        />
      ))}
    </>
  );
}
