"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera } from "@/lib/types/camera";
import { useCameraStream } from "@/lib/cameras/hooks/useCameraStream";
import { useReconnect } from "@/lib/cameras/hooks/useReconnect";
import { cameraScreenshotService } from "@/lib/services/cameraScreenshotService";
import { cameraApi } from "@/lib/api";
import {
  getStoredCaptureCooldownMs,
  getStoredMotionDetectionDebug,
  getStoredPersonDetectionDebug,
} from "@/lib/services/screenshotRegion";
import { getStoredDetectionMode } from "@/lib/services/cameraCaptureDetector";
import {
  getDetectionRegionPoints,
  getStoredCameraDetectionRegion,
  sanitizeDetectionRegion,
  storeCameraDetectionRegion,
  type NormalizedDetectionRegion,
  type NormalizedPoint,
  type PersonBoundingBox,
} from "@/lib/services/personDetection";

interface CameraPlayerProps {
  camera: Camera;
  autoStart?: boolean;
}

export function CameraPlayer({ camera, autoStart = true }: CameraPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const captureFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isCaptureFlashVisible, setIsCaptureFlashVisible] = useState(false);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [detectionRegion, setDetectionRegion] = useState<NormalizedDetectionRegion | null>(null);
  const detectionRegionRef = useRef<NormalizedDetectionRegion | null>(detectionRegion);
  const [selectionPoints, setSelectionPoints] = useState<NormalizedPoint[]>([]);
  const [personBoundingBoxes, setPersonBoundingBoxes] = useState<PersonBoundingBox[]>([]);
  const [mediaRect, setMediaRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [showPersonDetectionDebug, setShowPersonDetectionDebug] = useState(false);
  const [showMotionDetectionDebug, setShowMotionDetectionDebug] = useState(false);
  const [detectionMode, setDetectionMode] = useState<"motion" | "person">("motion");
  const [motionDebug, setMotionDebug] = useState({
    motionRatio: 0,
    active: false,
    started: false,
    paused: false,
  });

  const { isPlaying, isConnecting, error, startStream, stopStream, reconnect } =
    useCameraStream(camera);

  const { isReconnecting, reconnectAttempt, startMonitoring } =
    useReconnect(camera);

  const showCaptureFlash = useCallback(() => {
    setIsCaptureFlashVisible(true);

    if (captureFlashTimeoutRef.current) {
      clearTimeout(captureFlashTimeoutRef.current);
    }

    captureFlashTimeoutRef.current = setTimeout(() => {
      setIsCaptureFlashVisible(false);
      captureFlashTimeoutRef.current = null;
    }, 1000);
  }, []);

  const startCooldownIndicator = useCallback(() => {
    const endsAt = Date.now() + getStoredCaptureCooldownMs();

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    const updateRemaining = () => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      setCooldownRemainingSeconds(Math.ceil(remainingMs / 1000));

      if (remainingMs === 0 && cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };

    updateRemaining();
    cooldownIntervalRef.current = setInterval(updateRemaining, 250);
  }, []);

  const updateMediaRect = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (!video?.videoWidth || !video.videoHeight) {
      setVideoSize({ width: 0, height: 0 });
      setMediaRect({ left: 0, top: 0, width: containerWidth, height: containerHeight });
      return;
    }

    setVideoSize({ width: video.videoWidth, height: video.videoHeight });

    const scale = Math.min(
      containerWidth / video.videoWidth,
      containerHeight / video.videoHeight,
    );
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    setMediaRect({
      left: (containerWidth - width) / 2,
      top: (containerHeight - height) / 2,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedRegion = getStoredCameraDetectionRegion(camera.id);
      detectionRegionRef.current = savedRegion;
      setDetectionRegion(savedRegion);
      setSelectionPoints([]);
      setIsSelectingRegion(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [camera.id]);

  useEffect(() => {
    const updateDebugVisibility = () => {
      setShowPersonDetectionDebug(getStoredPersonDetectionDebug());
      setShowMotionDetectionDebug(getStoredMotionDetectionDebug());
      setDetectionMode(getStoredDetectionMode());
    };

    updateDebugVisibility();
    window.addEventListener("storage", updateDebugVisibility);
    window.addEventListener("camera-settings-changed", updateDebugVisibility);
    return () => {
      window.removeEventListener("storage", updateDebugVisibility);
      window.removeEventListener("camera-settings-changed", updateDebugVisibility);
    };
  }, []);

  useEffect(() => {
    const handleMotionDebug = (event: Event) => {
      const detail = (event as CustomEvent<{
        cameraId?: number;
        motionRatio?: number;
        active?: boolean;
        started?: boolean;
        paused?: boolean;
      }>).detail;
      if (detail?.cameraId !== Number(camera.id)) return;
      setMotionDebug({
        motionRatio: detail.motionRatio ?? 0,
        active: detail.active === true,
        started: detail.started === true,
        paused: detail.paused === true,
      });
    };

    window.addEventListener("motion-debug", handleMotionDebug);
    return () => window.removeEventListener("motion-debug", handleMotionDebug);
  }, [camera.id]);

  useEffect(() => {
    const handlePersonDetection = (event: Event) => {
      const detail = (event as CustomEvent<{
        cameraId?: number;
        boxes?: PersonBoundingBox[];
      }>).detail;
      if (detail?.cameraId !== Number(camera.id)) return;
      setPersonBoundingBoxes(detail.boxes ?? []);
    };

    window.addEventListener("person-detected", handlePersonDetection);
    return () => {
      window.removeEventListener("person-detected", handlePersonDetection);
      setPersonBoundingBoxes([]);
    };
  }, [camera.id]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    updateMediaRect();

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateMediaRect)
      : null;
    if (container) observer?.observe(container);
    video?.addEventListener("resize", updateMediaRect);
    window.addEventListener("resize", updateMediaRect);

    return () => {
      observer?.disconnect();
      video?.removeEventListener("resize", updateMediaRect);
      window.removeEventListener("resize", updateMediaRect);
    };
  }, [updateMediaRect]);

  useEffect(() => {
    return () => {
      if (captureFlashTimeoutRef.current) {
        clearTimeout(captureFlashTimeoutRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Start stream on mount
  useEffect(() => {
    if (!autoStart) return;

    const element =
      camera.type === "local" || camera.type === "hls" || camera.type === "rtsp"
        ? videoRef.current
        : imgRef.current;

    if (element) {
      // Notify background service that camera is opened in a tab
      if (typeof window !== "undefined") {
        // For same-window communication, directly call the service
        if (camera.type === "local") {
          // Import dynamically to avoid SSR issues
          import("@/lib/cameras/services/backgroundCameraService").then(
            ({ backgroundCameraService }) => {
              backgroundCameraService.pauseCamera(camera.id);
            },
          );
        }

        // For cross-tab communication, use localStorage
        localStorage.setItem("camera-tab-open", camera.id);
        localStorage.removeItem("camera-tab-open");
        localStorage.setItem("camera-tab-open", camera.id);
      }

      startStream(element);

      // Start monitoring for disconnections
      startMonitoring(() => {
        if (element) {
          reconnect(element);
        }
      });

      // Capture using the saved motion or person detection mode.
      let stopCapture: (() => void) | null = null;
      if (
        element instanceof HTMLVideoElement &&
        (camera.type === "local" || camera.type === "hls" || camera.type === "rtsp")
      ) {
        try {
          stopCapture = cameraScreenshotService.startDetectionCapture(
            element,
            Number(camera.id),
            true,
            () => {
              showCaptureFlash();
              startCooldownIndicator();
            },
            () => detectionRegionRef.current,
          );
        } catch {
        }
      }

      return () => {
        stopStream();

        // Stop screenshot capture
        if (stopCapture) {
          stopCapture();
        }

        // Notify background service that camera tab is closed
        if (typeof window !== "undefined") {
          // For same-window communication, directly call the service
          if (camera.type === "local") {
            import("@/lib/cameras/services/backgroundCameraService").then(
              ({ backgroundCameraService }) => {
                backgroundCameraService.resumeCamera(camera.id);
              },
            );
          }

          // For cross-tab communication, use localStorage
          localStorage.setItem("camera-tab-close", camera.id);
          localStorage.removeItem("camera-tab-close");
          localStorage.setItem("camera-tab-close", camera.id);
        }
      };
    }
  }, [camera, autoStart, startStream, stopStream, startMonitoring, reconnect, showCaptureFlash, startCooldownIndicator]);

  /**
   * HEARTBEAT controls camera status
   * + Updates localStorage for other pages (same device)
   * + Updates server directly (different devices)
   */
  useEffect(() => {
    if (!autoStart) return;

    const cameraId = Number(camera.id);
    if (!Number.isFinite(cameraId) || cameraId <= 0) return;


    // Send heartbeat immediately when tab opens
    const sendHeartbeat = async () => {
      try {
        await cameraApi.sendHeartbeat(cameraId);

        // Update localStorage for other pages (same device)
        if (typeof window !== "undefined") {
          const timestamp = Date.now().toString();
          localStorage.setItem(`camera-heartbeat-${cameraId}`, timestamp);
        }
      } catch {
      }
    };

    sendHeartbeat();

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 40000); // 40 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [camera.id, autoStart]);


  const handleManualReconnect = async () => {
    const element =
      camera.type === "local" || camera.type === "hls" || camera.type === "rtsp"
        ? videoRef.current
        : imgRef.current;

    if (element) {
      await reconnect(element);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const setRegion = useCallback((region: NormalizedDetectionRegion | null) => {
    const safeRegion = sanitizeDetectionRegion(region);
    detectionRegionRef.current = safeRegion;
    setDetectionRegion(safeRegion);
    storeCameraDetectionRegion(camera.id, safeRegion);
  }, [camera.id]);

  const getPointerPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;

    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const handleRegionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion) return;
    const point = getPointerPosition(event);
    if (!point) return;

    const nextPoints = [...selectionPoints, point];
    if (nextPoints.length < 4) {
      setSelectionPoints(nextPoints);
      return;
    }

    const region = sanitizeDetectionRegion({ points: nextPoints });
    if (region && region.width * mediaRect.width >= 20 && region.height * mediaRect.height >= 20) {
      setRegion(region);
      setSelectionPoints([]);
      setIsSelectingRegion(false);
    } else {
      setSelectionPoints([]);
    }
  };

  const showVideo =
    camera.type === "local" || camera.type === "hls" || camera.type === "rtsp";
  const displayedPoints = selectionPoints.length > 0
    ? selectionPoints
    : detectionRegion
      ? getDetectionRegionPoints(detectionRegion)
      : [];
  const svgPoints = displayedPoints
    .concat(displayedPoints.length === 4 ? displayedPoints[0] : [])
    .map((point) => `${point.x * 100},${point.y * 100}`)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center"
    >
      {/* Video Element */}
      {showVideo && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted
          onDoubleClick={handleDoubleClick}
          onLoadedMetadata={updateMediaRect}
        />
      )}

      {/* Image Element (for MJPEG) */}
      {!showVideo && (
        <img
          ref={imgRef}
          className="w-full h-full object-contain"
          alt={camera.name}
          onDoubleClick={handleDoubleClick}
        />
      )}

      {isCaptureFlashVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-20 bg-red-600/40"
          aria-hidden="true"
        />
      )}

      {showVideo && isPlaying && mediaRect.width > 0 && mediaRect.height > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[25]" aria-label="Person detection boxes">
      {showPersonDetectionDebug && personBoundingBoxes.map((box, index) => {
            if (!videoSize.width || !videoSize.height) return null;

            const left = mediaRect.left + (box.originX / videoSize.width) * mediaRect.width;
            const top = mediaRect.top + (box.originY / videoSize.height) * mediaRect.height;
            const width = (box.width / videoSize.width) * mediaRect.width;
            const height = (box.height / videoSize.height) * mediaRect.height;

            return (
              <div
                key={`${box.originX}-${box.originY}-${box.width}-${box.height}-${index}`}
                className="absolute border-2 border-emerald-400 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(6,78,59,0.45)]"
                style={{ left, top, width, height }}
              >
                <span className="absolute -top-6 left-0 bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  person
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showVideo && isPlaying && showMotionDetectionDebug && detectionMode === "motion" && (
        <div
          className={`pointer-events-none absolute bottom-3 left-3 z-30 rounded-md border px-3 py-2 text-xs font-medium shadow-sm ${
            motionDebug.paused
              ? "border-amber-300/60 bg-black/75 text-amber-200"
              : motionDebug.active
                ? "border-red-300/70 bg-red-950/80 text-red-100"
                : "border-emerald-300/60 bg-black/75 text-emerald-100"
          }`}
          dir="rtl"
          aria-live="polite"
        >
          <div>الحركة: {(motionDebug.motionRatio * 100).toFixed(1)}%</div>
          <div>
            {motionDebug.paused
              ? "متوقف مؤقتا أثناء التهدئة"
              : motionDebug.started
                ? "تم بدء الالتقاط"
                : motionDebug.active
                  ? "حركة مكتشفة"
                  : "لا توجد حركة كافية"}
          </div>
        </div>
      )}

      {showVideo && isPlaying && mediaRect.width > 0 && mediaRect.height > 0 && (
        <div
          className={`absolute z-10 touch-none ${isSelectingRegion ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"}`}
          style={mediaRect}
          onClick={handleRegionClick}
        >
          {displayedPoints.length > 0 && (
            <>
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {displayedPoints.length === 4 && (
                  <path
                    d={`M 0 0 H 100 V 100 H 0 Z M ${displayedPoints
                      .map((point) => `${point.x * 100} ${point.y * 100}`)
                      .join(" L ")} Z`}
                    fill="rgba(0, 0, 0, 0.32)"
                    fillRule="evenodd"
                  />
                )}
                <polyline
                  points={svgPoints}
                  fill={displayedPoints.length === 4 ? "rgba(16, 185, 129, 0.08)" : "none"}
                  stroke={selectionPoints.length > 0 ? "#fbbf24" : "#34d399"}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {displayedPoints.map((point, index) => (
                <span
                  key={`${point.x}-${point.y}-${index}`}
                  className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black ${
                    selectionPoints.length > 0 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                  aria-hidden="true"
                />
              ))}
            </>
          )}
        </div>
      )}

      {showVideo && isPlaying && !error && (
        <div className="absolute right-3 top-3 z-30 flex gap-2" dir="rtl">
          <button
            type="button"
            onClick={() => {
              setSelectionPoints([]);
              setIsSelectingRegion((current) => !current);
            }}
            className={`rounded-md border px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
              isSelectingRegion
                ? "border-amber-300 bg-amber-600 hover:bg-amber-500"
                : "border-white/30 bg-black/70 hover:bg-black/90"
            }`}
            title={detectionRegion ? "إعادة تحديد منطقة الكشف" : "تحديد منطقة الكشف"}
          >
            {isSelectingRegion
              ? `اختر النقاط (${selectionPoints.length}/4)`
              : detectionRegion
                ? "إعادة التحديد"
                : "تحديد منطقة الكشف"}
          </button>
          {detectionRegion && (
            <button
              type="button"
              onClick={() => {
                setSelectionPoints([]);
                setIsSelectingRegion(false);
                setRegion(null);
              }}
              className="rounded-md border border-white/30 bg-black/70 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
              title="استخدام كامل صورة الكاميرا"
            >
              مسح المنطقة
            </button>
          )}
        </div>
      )}

      {showVideo && cooldownRemainingSeconds > 0 && (
        <div
          className="pointer-events-none absolute left-3 top-3 z-30 rounded-md border border-amber-300/60 bg-black/75 px-3 py-2 text-sm font-medium text-amber-200 shadow-sm"
          dir="rtl"
          aria-live="polite"
        >
          التهدئة: {cooldownRemainingSeconds}ث
        </div>
      )}

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p style={{ color: '#ffffff' }}>جاري الاتصال بالكاميرا...</p>
          </div>
        </div>
      )}

      {/* Reconnecting Overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p>جاري إعادة الاتصال...</p>
            <p className="text-sm text-gray-300 mt-2">
              محاولة {reconnectAttempt} من 3
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isConnecting && !isReconnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-center text-white max-w-md px-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold mb-2">فشل الاتصال</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleManualReconnect}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
