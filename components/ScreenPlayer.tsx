"use client";

import { useState, useEffect, useRef } from "react";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import { API_CONFIG } from "@/lib/api/config";

interface ScreenPlayerProps {
  advertisement: MediaAsset | null;
  screenId: number;
  onEnded?: () => void;
  shouldLoop?: boolean;
  onPlaybackError?: (error: unknown) => void;
}

// Helper to normalize media URLs from backend
function resolveMediaUrl(url: string): string {
  if (!url) return "";

  // If it's relative, prefix with the backend host
  if (url.startsWith("/")) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }

  // Return URL as-is from backend
  return url;
}

export default function ScreenPlayer({
  advertisement,
  screenId,
  onEnded,
  shouldLoop = false,
  onPlaybackError,
}: ScreenPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRetryRef = useRef(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const imageEndedRef = useRef(false);
  const imageStartedAtRef = useRef<number>(Date.now());
  const videoAnchorWallAtRef = useRef<number>(Date.now());
  const videoAnchorMediaAtRef = useRef<number>(0);

  const resolvedUrl = advertisement ? resolveMediaUrl(advertisement.url) : "";

  console.log('🎬 SCREEN PLAYER RECEIVED:', {
    screenId,
    advertisement: advertisement ? {
      id: advertisement.id,
      name: advertisement.name,
      type: advertisement.type,
      url: advertisement.url,
      durationSeconds: advertisement.durationSeconds,
    } : null,
    resolvedUrl,
    shouldLoop,
  });

  const isVideo = advertisement?.type?.toLowerCase() === "video" || (advertisement?.url ? /\.(mp4|webm|ogg)$/i.test(advertisement.url) : false);
  const inferredVideoType = (() => {
    const lower = resolvedUrl.toLowerCase();
    if (lower.endsWith(".mp4")) return "video/mp4";
    if (lower.endsWith(".webm")) return "video/webm";
    if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
    return undefined;
  })();

  const clearErrorTimer = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  };

  const clearImageTimer = () => {
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  };

  const scheduleError = (message: string) => {
    clearErrorTimer();
    errorTimeoutRef.current = setTimeout(() => {
      setError(message);
    }, 800);
  };

  const tryPlay = (videoElement: HTMLVideoElement) => {
    return videoElement.play().then(() => {
      clearErrorTimer();
      setError(null);
      videoAnchorWallAtRef.current = Date.now();
      videoAnchorMediaAtRef.current = videoElement.currentTime || 0;
    });
  };

  useEffect(() => {
    setError(null);
    videoRetryRef.current = 0;
    clearErrorTimer();
    clearImageTimer();
    endedRef.current = false;
    imageEndedRef.current = false;
    hiddenAtRef.current = null;
    imageStartedAtRef.current = Date.now();
    videoAnchorWallAtRef.current = Date.now();
    videoAnchorMediaAtRef.current = 0;
    return () => {
      clearErrorTimer();
    };
  }, [advertisement]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const syncOnResume = () => {
      if (!advertisement) return;
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const hiddenForMs = hiddenAtRef.current ? now - hiddenAtRef.current : 0;
      hiddenAtRef.current = null;

      const isImage = advertisement.type?.toLowerCase() === "image";
      const durationSeconds = advertisement.durationSeconds || 10;

      if (isImage) {
        if (imageEndedRef.current) return;
        if (hiddenForMs > 3000) {
          const elapsedSeconds = (now - imageStartedAtRef.current) / 1000;
          if (elapsedSeconds >= durationSeconds) {
            imageEndedRef.current = true;
            clearImageTimer();
            onEnded?.();
          }
        }
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;
      if (endedRef.current) return;

      const durationFromElement = Number.isFinite(videoElement.duration) && videoElement.duration > 0 ? videoElement.duration : null;
      const finalDurationSeconds = durationFromElement ?? (advertisement.durationSeconds || null);

      if (finalDurationSeconds && hiddenForMs > 3000) {
        const estimatedMediaTime = videoAnchorMediaAtRef.current + (now - videoAnchorWallAtRef.current) / 1000;
        const nearEnd = estimatedMediaTime >= Math.max(0, finalDurationSeconds - 0.2);

        if (nearEnd) {
          if (shouldLoop) {
            try {
              videoElement.currentTime = 0;
            } catch {
            }
          } else {
            endedRef.current = true;
            onEnded?.();
            return;
          }
        }
      }

      if (videoElement.ended) {
        if (shouldLoop) {
          try {
            videoElement.currentTime = 0;
          } catch {
          }
          void tryPlay(videoElement).catch((err) => {
            if (err && typeof err === "object" && "name" in err && (err as any).name === "AbortError") {
              return;
            }
            onPlaybackError?.(err);
          });
        } else {
          endedRef.current = true;
          onEnded?.();
        }
        return;
      }

      const estimatedNow = videoAnchorMediaAtRef.current + (now - videoAnchorWallAtRef.current) / 1000;
      const driftSeconds = Math.max(0, estimatedNow - (videoElement.currentTime || 0));

      if (driftSeconds > 1.5) {
        try {
          if (Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
            videoElement.currentTime = Math.min(estimatedNow, Math.max(0, videoElement.duration - 0.25));
          }
        } catch {
        }
      }

      void tryPlay(videoElement).catch((err) => {
        if (err && typeof err === "object" && "name" in err && (err as any).name === "AbortError") {
          return;
        }
        onPlaybackError?.(err);
      });
    };

    document.addEventListener("visibilitychange", syncOnResume);
    window.addEventListener("focus", syncOnResume);

    return () => {
      document.removeEventListener("visibilitychange", syncOnResume);
      window.removeEventListener("focus", syncOnResume);
    };
  }, [advertisement, onEnded, onPlaybackError, shouldLoop]);

  // Autoplay video after load
  useEffect(() => {
    if (isVideo && videoRef.current && resolvedUrl) {
      const videoElement = videoRef.current;
      videoElement.muted = true;
      videoElement.volume = 0;
      videoElement.currentTime = 0;

      tryPlay(videoElement).catch((err) => {
        if (err && typeof err === "object" && "name" in err && (err as any).name === "AbortError") {
          return;
        }
        if (videoRetryRef.current < 1) {
          videoRetryRef.current += 1;
          try {
            videoElement.load();
          } catch {
            // ignore
          }
          setTimeout(() => {
            tryPlay(videoElement).catch(() => {
              scheduleError("فشل تشغيل الفيديو من الخادم");
              onPlaybackError?.(err);
            });
          }, 250);
          return;
        }
        scheduleError("فشل تشغيل الفيديو من الخادم");
        onPlaybackError?.(err);
      });
    }
  }, [advertisement, resolvedUrl, isVideo, onPlaybackError]);

  // Video countdown timer
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const videoElement = videoRef.current;

      const updateTimer = () => {
        if (videoElement.duration && !isNaN(videoElement.duration)) {
          const remaining = Math.max(0, videoElement.duration - videoElement.currentTime);
          setRemainingTime(Math.ceil(remaining));
          console.log(`⏱️ VIDEO TIMER: ${Math.ceil(remaining)}s remaining (current: ${videoElement.currentTime.toFixed(1)}s, duration: ${videoElement.duration.toFixed(1)}s)`);
        }
      };

      const timerInterval = setInterval(updateTimer, 100);

      videoElement.addEventListener('timeupdate', updateTimer);
      videoElement.addEventListener('loadedmetadata', updateTimer);

      return () => {
        clearInterval(timerInterval);
        videoElement.removeEventListener('timeupdate', updateTimer);
        videoElement.removeEventListener('loadedmetadata', updateTimer);
      };
    } else {
      setRemainingTime(0);
    }
  }, [isVideo]);

  useEffect(() => {
    if (!shouldLoop) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (!resolvedUrl) return;
    if (videoElement.ended) {
      videoElement.currentTime = 0;
      videoElement.play().catch((err) => {
        if (err && typeof err === "object" && "name" in err && (err as any).name === "AbortError") {
          return;
        }
        scheduleError("فشل تشغيل الفيديو من الخادم");
        onPlaybackError?.(err);
      });
    }
  }, [resolvedUrl, shouldLoop, onPlaybackError]);

  // Image countdown timer - use ref instead of state to avoid re-renders
  useEffect(() => {
    const isImage = advertisement?.type?.toLowerCase() === "image";
    const duration = advertisement?.durationSeconds || 10;

    if (isImage) {
      imageStartedAtRef.current = Date.now();
      setRemainingTime(duration);

      imageTimerRef.current = setInterval(() => {
        if (imageEndedRef.current) {
          return;
        }
        const elapsed = Math.floor((Date.now() - imageStartedAtRef.current) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setRemainingTime(remaining);

        console.log(`⏱️ IMAGE TIMER: ${remaining}s remaining (elapsed: ${elapsed}s, duration: ${duration}s)`);

        if (elapsed >= duration) {
          // Image duration ended, trigger callback
          if (onEnded) {
            imageEndedRef.current = true;
            clearImageTimer();
            onEnded();
          }
        }
      }, 1000);

      return () => {
        clearImageTimer();
      };
    } else {
      setRemainingTime(0);
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
          onError={() => {
            console.error('❌ IMAGE LOAD ERROR:', {
              screenId,
              advertisementId: advertisement?.id,
              advertisementName: advertisement?.name,
              advertisementType: advertisement?.type,
              resolvedUrl,
              originalUrl: advertisement?.url,
            });
            setError("فشل تحميل الصورة من الخادم");
          }}
        />
        {/* Countdown timer overlay */}
        {remainingTime > 0 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-xl font-bold">
            {remainingTime}s
          </div>
        )}
      </div>
    );
  }

  // Render video
  return (
    <div className="w-full h-screen bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={false}
        autoPlay
        loop={shouldLoop}
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          videoAnchorWallAtRef.current = Date.now();
          videoAnchorMediaAtRef.current = v.currentTime || 0;
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          videoAnchorWallAtRef.current = Date.now();
          videoAnchorMediaAtRef.current = v.currentTime || 0;
        }}
        onPlaying={() => {
          clearErrorTimer();
          setError(null);
          const v = videoRef.current;
          if (!v) return;
          videoAnchorWallAtRef.current = Date.now();
          videoAnchorMediaAtRef.current = v.currentTime || 0;
        }}
        onError={() => {
          const err = videoRef.current?.error;
          if (videoRetryRef.current < 1 && videoRef.current) {
            videoRetryRef.current += 1;
            try {
              videoRef.current.load();
            } catch {
              // ignore
            }
            setTimeout(() => {
              if (videoRef.current) {
                tryPlay(videoRef.current).catch(() => {
                  scheduleError("فشل تحميل أو تشغيل ملف الفيديو");
                  onPlaybackError?.(err);
                });
              }
            }, 250);
            return;
          }
          scheduleError("فشل تحميل أو تشغيل ملف الفيديو");
          onPlaybackError?.(err);
        }}
        onEnded={() => {
          endedRef.current = true;
          onEnded?.();
        }}
      >
        <source src={resolvedUrl} type={inferredVideoType} />
      </video>
      {/* Countdown timer overlay */}
      {remainingTime > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-xl font-bold">
          {remainingTime}s
        </div>
      )}
    </div>
  );
}
