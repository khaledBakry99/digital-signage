"use client";

import type { Camera } from "@/lib/types/camera";
import { useTheme } from "@/lib/context/ThemeContext";
import { useFloatingCamera } from "@/lib/context/FloatingCameraContext";

interface CameraCardProps {
  camera: Camera;
  onView: (camera: Camera) => void;
  onEdit?: (camera: Camera) => void;
  onDelete?: (camera: Camera) => void;
  activatingCameraIds?: Set<number>;
  isCameraOpen?: boolean;
}

export function CameraCard({
  camera,
  onView,
  onEdit,
  onDelete,
  activatingCameraIds,
  isCameraOpen,
}: CameraCardProps) {
  const { theme } = useTheme();
  const { openFloatingCamera, closeFloatingCamera, isCameraFloating } = useFloatingCamera();
  const isLightTheme = theme === "light";
  const isConnected = camera.status === "connected";
  const numericId = Number(camera.id);
  const isOpening = Number.isFinite(numericId) && activatingCameraIds?.has(numericId);
  const isFloating = isCameraFloating(numericId);

  const getStatusText = () => {
    return isConnected ? "متصلة" : "غير متصلة";
  };

  const getStatusColor = () => {
    return isConnected
      ? "bg-green-500 shadow-[0_0_8px_#10b981]"
      : "bg-red-500 shadow-[0_0_8px_#ef4444]";
  };

  const getTypeText = () => {
    switch (camera.type) {
      case "local":
        return "كاميرا محلية";
      case "rtsp":
        return "RTSP";
      case "http":
        return "HTTP";
      case "hls":
        return "HLS";
      default:
        return "كاميرا محلية";
    }
  };


  const containerClass = `rounded-[28px] overflow-hidden flex flex-col group border transition-all duration-500 ${isLightTheme
    ? "bg-white/85 border-white/70 shadow-[0_25px_65px_rgba(15,23,42,0.12)] hover:shadow-[0_35px_85px_rgba(15,23,42,0.18)]"
    : "border-white/5 bg-gradient-to-br from-[#111528] to-[#090c18] shadow-[0_25px_70px_rgba(2,6,23,0.65)] hover:shadow-[0_35px_90px_rgba(2,6,23,0.75)]"
    }`;

  const headerClass = `relative h-32 flex items-center justify-center overflow-hidden ${isLightTheme
    ? "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50"
    : "bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/10"
    }`;

  const infoPanelClass = `p-6 flex flex-col flex-1 text-right ${isLightTheme ? "bg-white/40" : "bg-black/10"
    }`;

  const secondaryBadgeClass = isLightTheme
    ? "text-[11px] font-bold px-2.5 py-1 bg-white/90 border border-white/70 text-slate-600 rounded-lg flex items-center gap-1"
    : "text-[11px] font-bold px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg flex items-center gap-1";

  return (
    <div className={containerClass}>
      {/* Camera Icon Header */}
      <div className={headerClass}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30" style={{
          background: isLightTheme
            ? "radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)"
        }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-20" style={{
          background: isLightTheme
            ? "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(236,72,153,0.2), transparent 70%)"
        }} />

        {/* Camera Icon */}
        <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${isLightTheme
          ? "bg-white/80 shadow-lg shadow-indigo-500/20"
          : "bg-white/10 shadow-xl shadow-indigo-500/10"
          }`}>
          <svg
            className={`w-8 h-8 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 flex items-center gap-2 backdrop-blur-md px-3 py-1 rounded-full border shadow-lg select-none ${isLightTheme ? "bg-white/90 border-white/80" : "bg-[#0a0f1d]/90 border-white/10"
          }`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className={`text-[10px] font-bold tracking-wide ${isLightTheme ? "text-slate-700" : "text-white"}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Camera Info Panel */}
      <div className={infoPanelClass}>
        {/* Title / Name */}
        <h3 className={`text-xl font-bold leading-relaxed transition-colors mb-4 ${isLightTheme ? "text-slate-900 group-hover:text-indigo-500" : "text-slate-100 group-hover:text-indigo-400"
          }`}>
          {camera.name}
        </h3>

        {/* Badges / Tech Info */}
        <div className="flex items-center gap-2 justify-start mb-4">
          {camera.location && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${isLightTheme
                ? "bg-indigo-50 border border-indigo-100 text-indigo-600"
                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{camera.location}</span>
            </span>
          )}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${isLightTheme
            ? "bg-purple-50 border border-purple-100 text-purple-600"
            : "bg-purple-500/10 border border-purple-500/20 text-purple-300"
            }`}>
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <span className="break-all">{camera.source}</span>
          </span>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">




          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isFloating) {
                closeFloatingCamera(camera.id);
              } else if (!isOpening && !isCameraOpen) {
                openFloatingCamera(camera);
              }
            }}
            disabled={isOpening || isCameraOpen}
            className={`flex-1 text-white py-2.5 px-6 transition-all duration-150 rounded-xl text-xs font-bold text-center cursor-pointer select-none shadow-lg active:scale-95 ${isFloating
              ? "bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-[0_18px_35px_rgba(239,68,68,0.35)]"
              : isLightTheme
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_18px_35px_rgba(124,58,237,0.35)]"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10 hover:shadow-indigo-500/20"
              } ${(isOpening || isCameraOpen) ? "opacity-40 cursor-not-allowed" : ""}`}
            title={
              isFloating
                ? "إيقاف الكاميرا"
                : isCameraOpen
                  ? "الكاميرا مفتوحة بالفعل"
                  : isOpening
                    ? "جاري التفعيل"
                    : "عرض البث"
            }
          >
            {isFloating ? "إيقاف الكاميرا" : isOpening ? "جاري التفعيل..." : isCameraOpen ? "الكاميرا مفتوحة ✓" : "عرض البث"}
          </button>


          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(camera);
              }}
              className={`px-4 py-2.5 border active:scale-95 transition-all duration-150 rounded-xl text-xs font-bold cursor-pointer select-none ${isLightTheme
                ? "border-slate-200 text-slate-600 hover:bg-white"
                : "border-white/10 hover:border-white/20 text-slate-300 hover:text-slate-100 hover:bg-white/5"
                }`}
            >
              تعديل
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(camera);
              }}
              className={`px-4 py-2.5 border active:scale-95 transition-all duration-150 rounded-xl text-xs font-bold cursor-pointer select-none ${isLightTheme
                ? "border-rose-100 text-rose-500 hover:bg-rose-50"
                : "border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                }`}
            >
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
