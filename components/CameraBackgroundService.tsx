"use client";

import { useEffect } from "react";
import { backgroundCameraService } from "@/lib/cameras/services/backgroundCameraService";

/**
 * Camera Background Service Component
 * Initializes and manages background camera streaming for screenshots
 */
export default function CameraBackgroundService() {
  useEffect(() => {
    // Initialize background service after a delay to avoid blocking initial render
    // and to ensure the page is fully loaded
    const timer = setTimeout(() => {
      try {
        backgroundCameraService.initialize();
      } catch (error) {
        console.error("Failed to initialize background camera service:", error);
      }
    }, 5000); // Wait 5 seconds after page load (increased from 3)

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      try {
        backgroundCameraService.cleanup();
      } catch (error) {
        console.error("Failed to cleanup background camera service:", error);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
