"use client";

import { useTheme } from "@/lib/context/ThemeContext";
import { useState, useEffect } from "react";

export default function PoweredBy() {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!imageLoaded) {
        setShowFallback(true);
      }
    }, 2000); // Show fallback after 2 seconds if image hasn't loaded

    return () => clearTimeout(timeout);
  }, [imageLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setShowFallback(true);
  };

  return (
    <div className="absolute bottom-4 left-4">
      {!showFallback ? (
        <img
          src={isLightTheme ? "/powerd-by-black.png" : "/powerd-by-white.png"}
          alt="Powered by"
          className="h-2 w-auto object-contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div
          className="h-2 w-auto object-contain text-xs font-semibold"
          style={{ color: isLightTheme ? "black" : "white" }}
        >
          POWERED BY LIVE-INTERACTIVE.COM
        </div>
      )}
    </div>
  );
}
