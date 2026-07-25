"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { backgroundCameraService } from "@/lib/cameras/services/backgroundCameraService";

/**
 * Camera Background Service Component
 * Initializes and manages background camera streaming for screenshots
 */
export default function CameraBackgroundService() {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/forgot-password");

    // Skip initialization when auth state is loading, unauthenticated, or on auth-related pages
    if (loading || !isAuthenticated || isAuthPage) {
      return;
    }

    // Initialize background service after a delay to avoid blocking initial render
    // and to ensure the page is fully loaded
    const timer = setTimeout(() => {
      try {
        backgroundCameraService.initialize();
      } catch (error) {
      }
    }, 5000); // Wait 5 seconds after page load (increased from 3)

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      try {
        backgroundCameraService.cleanup();
      } catch (error) {
      }
    };
  }, [isAuthenticated, loading, pathname]);

  // This component doesn't render anything
  return null;
}
