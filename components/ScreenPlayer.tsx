"use client";

import { useState, useEffect, useRef } from "react";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface ScreenPlayerProps {
  advertisement: MediaAsset | null;
  screenId: number;
  onEnded?: () => void;
}

// Helper to normalize media URLs from backend
function resolveMediaUrl(url: string): string {
  if (!url) return "";
  
  // If it's relative, prefix with the backend host
  if (url.startsWith("/")) {
    return `https://backend-42316129731.europe-west1.run.app${url}`;
  }
  
  // Return URL as-is from backend
  return url;
}

export default function ScreenPlayer({
  advertisement,
  screenId,
  onEnded,
}: ScreenPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resolvedUrl = advertisement ? resolveMediaUrl(advertisement.url) : "";

  useEffect(() => {
    setError(null);
  }, [advertisement]);

  // Autoplay video after load
  useEffect(() => {
    const isVideo = advertisement?.type?.toLowerCase() === "video";
    if (isVideo && videoRef.current && resolvedUrl) {
      videoRef.current.play().catch((err) => {
        console.error("فشل تشغيل الفيديو:", err);
        setError("فشل تشغيل الفيديو من الخادم");
      });
    }
  }, [advertisement, resolvedUrl]);

  // Image countdown timer
  useEffect(() => {
    const isImage = advertisement?.type?.toLowerCase() === "image";
    const duration = advertisement?.durationSeconds || 10; // default 10s if not provided

    if (isImage) {
      setCurrentTime(0);
      imageTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            // Image duration ended, trigger callback
            if (onEnded) {
              onEnded();
            }
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => {
        if (imageTimerRef.current) {
          clearInterval(imageTimerRef.current);
        }
      };
    }
  }, [advertisement, onEnded]);

  // No advertisement
  if (!advertisement) {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl text-white mb-2">شاشة {screenId}</h2>
          <p className="text-gray-400">لا يوجد إعلان معروض حالياً</p>
        </div>
      </div>
    );
  }

  // Playback error
  if (error) {
    return (
      <div className="w-full h-screen bg-red-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl text-white mb-2">خطأ في العرض</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <p className="text-xs text-red-300/60 truncate">{resolvedUrl || advertisement.url}</p>
        </div>
      </div>
    );
  }

  const isImage = advertisement.type?.toLowerCase() === "image";
  const duration = advertisement.durationSeconds || 10;

  // Render image
  if (isImage) {
    return (
      <div className="w-full h-screen bg-black relative">
        <img
          src={resolvedUrl}
          alt={advertisement.name}
          className="w-full h-full object-contain"
          onError={() => setError("فشل تحميل الصورة من الخادم")}
        />
      </div>
    );
  }

  // Render video
  return (
    <div className="w-full h-screen bg-black">
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-contain"
        controls={false}
        autoPlay
        loop={false}
        muted
        playsInline
        onError={() => setError("فشل تحميل أو تشغيل ملف الفيديو")}
        onEnded={onEnded}
      />
    </div>
  );
}
