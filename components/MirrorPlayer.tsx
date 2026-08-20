
"use client";

import { useState, useEffect, useRef } from "react";
import { screenSyncService, type ScreenPlaybackState } from "@/lib/services/screenSyncService";

interface MirrorPlayerProps {
  screenId: number;
  isScreenOpen: boolean;
}

export default function MirrorPlayer({ screenId, isScreenOpen }: MirrorPlayerProps) {
  const [playbackState, setPlaybackState] = useState<ScreenPlaybackState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // Subscribe to sync service - only when screen is open
  useEffect(() => {
    if (!isScreenOpen) {
      return;
    }

    const unsubscribe = screenSyncService.subscribe(screenId, (state) => {
      setPlaybackState(state);
      lastSyncTimeRef.current = Date.now();
    });

    return () => {
      unsubscribe();
      setPlaybackState(null);
    };
  }, [screenId, isScreenOpen]);

  // Handle video playback and sync with main screen
  useEffect(() => {
    if (!playbackState || !videoRef.current) return;
    if (playbackState.mediaType !== "video") return;

    const video = videoRef.current;

    // Sync video time with broadcast state - more precise
    if (playbackState.currentTime !== undefined) {
      const timeDiff = Math.abs(video.currentTime - playbackState.currentTime);
      // Only sync if difference is greater than 0.5 seconds to avoid small jumps
      if (timeDiff > 0.5) {
        video.currentTime = playbackState.currentTime;
      }
    }

    // Start playing if not already
    if (video.paused && playbackState.isPlaying) {
      video.play().catch(() => { });
    }
  }, [playbackState]);

  // Handle image display with timer
  useEffect(() => {
    if (!playbackState) return;
    if (playbackState.mediaType !== "image") return;

    // Clear any existing timer
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
    }

    // No timer needed - just display
    return () => {
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current);
      }
    };
  }, [playbackState]);

  // If screen is not open - show message
  if (!isScreenOpen) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-10 h-10 mx-auto mb-2"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            افتح الشاشة لبدء العرض
          </p>
        </div>
      </div>
    );
  }

  // If screen is open but no content yet
  if (!playbackState || !playbackState.mediaUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {playbackState.mediaType === "video" ? (
        <video
          ref={videoRef}
          key={playbackState.mediaUrl}
          src={
            playbackState.mediaUrl?.startsWith("/")
              ? `https://backend-42316129731.europe-west1.run.app${playbackState.mediaUrl}`
              : playbackState.mediaUrl ?? undefined
          }
          className="w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      ) : (
        <img
          key={playbackState.mediaUrl}
          src={
            playbackState.mediaUrl?.startsWith("/")
              ? `https://backend-42316129731.europe-west1.run.app${playbackState.mediaUrl}`
              : playbackState.mediaUrl ?? undefined
          }
          alt={playbackState.mediaName || "إعلان"}
          className="w-full h-full object-contain"
        />
      )}

      {/* Overlay with ad title */}
      <div
        className="absolute bottom-0 left-0 right-0 p-2"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold truncate" style={{ color: "white" }}>
            {playbackState.mediaName || "إعلان"}
          </p>
          <span className="text-[10px] text-emerald-300 font-semibold">● مباشر</span>
        </div>
      </div>
    </div>
  );
}
