"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import { API_CONFIG } from "@/lib/api/config";

interface ScreenPlayerProps {
  advertisement: MediaAsset | null;
  screenId: number;
  onEnded?: () => void;
  shouldLoop?: boolean;
  onPlaybackError?: (error: unknown) => void;
}

const VIDEO_STALL_TIMEOUT_MS = 4000;
const VIDEO_WATCHDOG_INTERVAL_MS = 1000;
const VIDEO_END_TOLERANCE_SECONDS = 0.5;

const isAbortError = (error: unknown) =>
  Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");

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
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const imageEndedRef = useRef(false);
  const imageStartedAtRef = useRef<number>(0);
  const videoAnchorWallAtRef = useRef<number>(0);
  const videoAnchorMediaAtRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(0);
  const lastVideoProgressAtRef = useRef(0);
  const lastRecoveryAtRef = useRef(0);
  const stallRecoveryCountRef = useRef(0);
  const recoveryInFlightRef = useRef(false);
  const recoveryGenerationRef = useRef(0);

  const resolvedUrl = advertisement ? resolveMediaUrl(advertisement.url) : "";

  const isVideo = advertisement?.type?.toLowerCase() === "video" || (advertisement?.url ? /\.(mp4|webm|ogg)$/i.test(advertisement.url) : false);
  const clearErrorTimer = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const clearImageTimer = useCallback(() => {
    if (imageTimerRef.current) {
      clearInterval(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  }, []);

  const clearReloadTimer = useCallback(() => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
    }
  }, []);

  const scheduleError = useCallback((message: string) => {
    clearErrorTimer();
    errorTimeoutRef.current = setTimeout(() => {
      setError(message);
    }, 800);
  }, [clearErrorTimer]);

  const tryPlay = useCallback((videoElement: HTMLVideoElement) => {
    return videoElement.play().then(() => {
      clearErrorTimer();
      setError(null);
      videoAnchorWallAtRef.current = Date.now();
      videoAnchorMediaAtRef.current = videoElement.currentTime || 0;
    });
  }, [clearErrorTimer]);

  const recordVideoProgress = useCallback((videoElement: HTMLVideoElement) => {
    const currentTime = videoElement.currentTime || 0;
    const previousTime = lastVideoTimeRef.current;
    const advanced = currentTime > previousTime + 0.05;
    const looped = currentTime + 0.5 < previousTime;

    if (advanced || looped) {
      lastVideoProgressAtRef.current = Date.now();
      if (!lastRecoveryAtRef.current || Date.now() - lastRecoveryAtRef.current > 10000) {
        stallRecoveryCountRef.current = 0;
      }
      recoveryInFlightRef.current = false;
    }

    lastVideoTimeRef.current = currentTime;
    videoAnchorWallAtRef.current = Date.now();
    videoAnchorMediaAtRef.current = currentTime;
  }, []);

  const finishPlaybackAtEndpoint = useCallback((videoElement: HTMLVideoElement) => {
    const elementDuration = Number.isFinite(videoElement.duration) && videoElement.duration > 0
      ? videoElement.duration
      : null;
    const duration = elementDuration ?? advertisement?.durationSeconds ?? null;

    if (!duration || videoElement.currentTime < Math.max(0, duration - VIDEO_END_TOLERANCE_SECONDS)) {
      return false;
    }

    if (shouldLoop) {
      endedRef.current = false;
      videoElement.currentTime = 0;
      void tryPlay(videoElement).catch((error) => {
        if (!isAbortError(error)) onPlaybackError?.(error);
      });
      return true;
    }

    if (!endedRef.current) {
      endedRef.current = true;
      onEnded?.();
    }
    return true;
  }, [advertisement?.durationSeconds, onEnded, onPlaybackError, shouldLoop, tryPlay]);

  const recoverFrozenVideo = useCallback((videoElement: HTMLVideoElement) => {
    if (recoveryInFlightRef.current || videoElement.ended || endedRef.current) return;
    if (finishPlaybackAtEndpoint(videoElement)) return;

    const recoveryAttempt = stallRecoveryCountRef.current + 1;
    stallRecoveryCountRef.current = recoveryAttempt;
    recoveryInFlightRef.current = true;
    lastRecoveryAtRef.current = Date.now();
    lastVideoProgressAtRef.current = lastRecoveryAtRef.current;

    const resumeAt = videoElement.currentTime || lastVideoTimeRef.current || 0;

    const resumePlayback = () => {
      clearReloadTimer();

      try {
        if (resumeAt > 0 && Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
          videoElement.currentTime = Math.min(resumeAt, Math.max(0, videoElement.duration - 0.25));
        }
      } catch {
        // Some browsers reject seeks until metadata is available.
      }

      void tryPlay(videoElement)
        .catch((error) => {
          if (!isAbortError(error)) {
            onPlaybackError?.(error);
          }
        })
        .finally(() => {
          recoveryInFlightRef.current = false;
        });
    };

    if (recoveryAttempt === 1) {
      try {
        videoElement.currentTime = Math.max(0, resumeAt - 0.1);
      } catch {
        // Continue with play even when a small recovery seek is unavailable.
      }
      resumePlayback();
      return;
    }

    if (recoveryAttempt === 2) {
      let resumed = false;
      const recoveryGeneration = recoveryGenerationRef.current;
      const resumeOnce = () => {
        if (resumed) return;
        resumed = true;
        videoElement.removeEventListener("loadedmetadata", resumeOnce);
        if (recoveryGeneration !== recoveryGenerationRef.current) return;
        resumePlayback();
      };

      videoElement.addEventListener("loadedmetadata", resumeOnce, { once: true });
      reloadTimeoutRef.current = setTimeout(resumeOnce, 1200);

      try {
        videoElement.load();
      } catch {
        resumeOnce();
      }
      return;
    }

    recoveryInFlightRef.current = false;
    onPlaybackError?.(new Error("Video playback stopped advancing"));
  }, [clearReloadTimer, finishPlaybackAtEndpoint, onPlaybackError, tryPlay]);

  useEffect(() => {
    const resetErrorTimer = setTimeout(() => setError(null), 0);
    recoveryGenerationRef.current += 1;
    videoRetryRef.current = 0;
    stallRecoveryCountRef.current = 0;
    lastRecoveryAtRef.current = 0;
    recoveryInFlightRef.current = false;
    lastVideoTimeRef.current = 0;
    lastVideoProgressAtRef.current = Date.now();
    clearErrorTimer();
    clearImageTimer();
    clearReloadTimer();
    endedRef.current = false;
    imageEndedRef.current = false;
    hiddenAtRef.current = null;
    imageStartedAtRef.current = Date.now();
    videoAnchorWallAtRef.current = Date.now();
    videoAnchorMediaAtRef.current = 0;
    return () => {
      clearTimeout(resetErrorTimer);
      clearErrorTimer();
      clearReloadTimer();
    };
  }, [advertisement, clearErrorTimer, clearImageTimer, clearReloadTimer]);

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
            if (isAbortError(err)) {
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
        if (isAbortError(err)) {
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
  }, [advertisement, clearImageTimer, onEnded, onPlaybackError, shouldLoop, tryPlay]);

  // Autoplay video after load
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;

    if (isVideo && videoRef.current && resolvedUrl) {
      const videoElement = videoRef.current;
      videoElement.muted = true;
      videoElement.volume = 0;
      videoElement.currentTime = 0;

      tryPlay(videoElement).catch((err) => {
        if (isAbortError(err)) {
          return;
        }
        if (videoRetryRef.current < 1) {
          videoRetryRef.current += 1;
          try {
            videoElement.load();
          } catch {
            // ignore
          }
          retryTimeout = setTimeout(() => {
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

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [advertisement, resolvedUrl, isVideo, onPlaybackError, scheduleError, tryPlay]);

  // Browsers can remain in a "playing" state even when the media clock freezes.
  useEffect(() => {
    if (!isVideo || !resolvedUrl) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    lastVideoTimeRef.current = videoElement.currentTime || 0;
    lastVideoProgressAtRef.current = Date.now();

    const watchdog = setInterval(() => {
      if (document.hidden || videoElement.ended || videoElement.seeking || endedRef.current) return;

      const currentTime = videoElement.currentTime || 0;
      const previousTime = lastVideoTimeRef.current;
      if (currentTime > previousTime + 0.05 || currentTime + 0.5 < previousTime) {
        recordVideoProgress(videoElement);
        return;
      }

      if (Date.now() - lastVideoProgressAtRef.current < VIDEO_STALL_TIMEOUT_MS) return;
      recoverFrozenVideo(videoElement);
    }, VIDEO_WATCHDOG_INTERVAL_MS);

    return () => clearInterval(watchdog);
  }, [isVideo, recoverFrozenVideo, recordVideoProgress, resolvedUrl]);

  useEffect(() => {
    if (!shouldLoop) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (!resolvedUrl) return;
    if (videoElement.ended) {
      videoElement.currentTime = 0;
      videoElement.play().catch((err) => {
        if (isAbortError(err)) {
          return;
        }
        scheduleError("فشل تشغيل الفيديو من الخادم");
        onPlaybackError?.(err);
      });
    }
  }, [resolvedUrl, shouldLoop, onPlaybackError, scheduleError]);

  // Image countdown timer - use ref instead of state to avoid re-renders
  useEffect(() => {
    const isImage = advertisement?.type?.toLowerCase() === "image";
    const duration = advertisement?.durationSeconds || 10;

    if (isImage) {
      imageStartedAtRef.current = Date.now();
      const initialCountdownTimer = setTimeout(() => setRemainingTime(duration), 0);

      imageTimerRef.current = setInterval(() => {
        if (imageEndedRef.current) {
          return;
        }
        const elapsed = Math.floor((Date.now() - imageStartedAtRef.current) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setRemainingTime(remaining);

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
        clearTimeout(initialCountdownTimer);
        clearImageTimer();
      };
    } else {
      const clearCountdownTimer = setTimeout(() => setRemainingTime(0), 0);
      return () => clearTimeout(clearCountdownTimer);
    }
  }, [advertisement, clearImageTimer, onEnded]);

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
        aria-label={advertisement.name}
        className="w-full h-full object-contain"
        controls={false}
        autoPlay
        loop={shouldLoop}
        playsInline
        muted
        preload="auto"
        src={resolvedUrl}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          videoAnchorWallAtRef.current = Date.now();
          videoAnchorMediaAtRef.current = v.currentTime || 0;
          lastVideoTimeRef.current = v.currentTime || 0;
          lastVideoProgressAtRef.current = Date.now();
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          recordVideoProgress(v);
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
          if (shouldLoop && videoRef.current) {
            endedRef.current = false;
            videoRef.current.currentTime = 0;
            void tryPlay(videoRef.current).catch((playbackError) => {
              if (!isAbortError(playbackError)) onPlaybackError?.(playbackError);
            });
            return;
          }
          endedRef.current = true;
          onEnded?.();
        }}
      />
    </div>
  );
}
