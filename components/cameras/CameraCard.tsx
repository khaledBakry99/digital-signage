"use client";

import type { Camera } from "@/lib/types/camera";
import { useTheme } from "@/lib/context/ThemeContext";

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
  const isLightTheme = theme === "light";
  const isConnected = camera.status === "connected";
  const numericId = Number(camera.id);
  const isOpening = Number.isFinite(numericId) && activatingCameraIds?.has(numericId);

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

  const formatCreatedAt = () => {
    if (!camera.createdAtUtc) return "";
    try {
      // Parse UTC date string directly without converting to local timezone
      const dateStr = camera.createdAtUtc;
      const date = new Date(dateStr);

      // Use UTC methods to get the original UTC values
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');

      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const containerClass = `rounded-[28px] overflow-hidden flex flex-col group border transition-all duration-500 ${isLightTheme
    ? "bg-white/85 border-white/70 shadow-[0_25px_65px_rgba(15,23,42,0.12)] hover:-translate-y-1 hover:shadow-[0_35px_85px_rgba(15,23,42,0.18)]"
    : "border-white/5 bg-gradient-to-br from-[#111528] to-[#090c18] shadow-[0_25px_70px_rgba(2,6,23,0.65)] hover:shadow-[0_35px_90px_rgba(2,6,23,0.75)]"
    }`;

  const previewAreaClass = `relative h-48 flex flex-col items-center justify-center p-4 border-b ${isLightTheme ? "bg-gradient-to-br from-indigo-50 via-white to-slate-100 border-white/70" : "bg-[#070b19]/60 border-white/5"
    }`;

  const infoPanelClass = `p-5 flex flex-col flex-1 text-right ${isLightTheme ? "bg-white/40" : "bg-black/10"
    }`;

  const secondaryBadgeClass = isLightTheme
    ? "text-[11px] font-bold px-2.5 py-1 bg-white/90 border border-white/70 text-slate-600 rounded-lg flex items-center gap-1"
    : "text-[11px] font-bold px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg flex items-center gap-1";

  return (
    <div className={containerClass}>
      {/* Thumbnail/Preview Area (Upper Dark Panel) */}
      <div className={previewAreaClass}>
        {camera.thumbnail ? (
          <img
            src={camera.thumbnail}
            alt={camera.name}
            className="w-full h-full object-cover rounded-t-[24px]"
          />
        ) : (
          <div className={`${isLightTheme ? "text-slate-400" : "text-slate-500/80"} text-center flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isLightTheme
              ? "bg-white/80 border-white/70 group-hover:border-indigo-200 group-hover:bg-indigo-50"
              : "bg-white/5 border-white/10 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5"
              }`}>
              <svg
                className={`w-7 h-7 ${isLightTheme ? "text-indigo-400" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className={`text-xs font-semibold ${isLightTheme ? "text-slate-400" : "text-slate-400/80"}`}>
              لا توجد معاينة
            </p>
          </div>
        )}

        {/* Live Status Badge */}
        <div className={`absolute top-4 left-4 flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-lg select-none ${isLightTheme ? "bg-white/85 border-white/80" : "bg-[#0a0f1d]/80 border-white/5"
          }`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className={`text-[11px] font-bold tracking-wide ${isLightTheme ? "text-slate-700" : "text-white"}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Camera Info Panel (Glassmorphic Dark Section) */}
      <div className={infoPanelClass}>
        {/* Title / Name */}
        <div className="mb-3">
          <h3 className={`text-lg font-bold leading-tight transition-colors ${isLightTheme ? "text-slate-900 group-hover:text-indigo-500" : "text-slate-100 group-hover:text-indigo-400"
            }`}>
            {camera.name}
          </h3>
        </div>

        {/* Badges / Tech Info */}
        <div className="flex items-center gap-2 justify-start mb-3.5">
          {camera.location && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${isLightTheme
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
          <span className={secondaryBadgeClass}>
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatCreatedAt()}</span>
          </span>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">




          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpening && !isCameraOpen) {
                onView(camera);
              }
            }}
            disabled={isOpening || isCameraOpen}
            className={`flex-1 text-white py-2.5 px-6 transition-all duration-150 rounded-xl text-xs font-bold text-center cursor-pointer select-none shadow-lg active:scale-95 ${isLightTheme
              ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_18px_35px_rgba(124,58,237,0.35)]"
              : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10 hover:shadow-indigo-500/20"
              } ${(isOpening || isCameraOpen) ? "opacity-40 cursor-not-allowed" : ""}`}
            title={
              isCameraOpen
                ? "الكاميرا مفتوحة بالفعل"
                : isOpening
                  ? "جاري التفعيل"
                  : "عرض البث"
            }
          >
            {isOpening ? "جاري التفعيل..." : isCameraOpen ? "الكاميرا مفتوحة ✓" : "عرض البث"}
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
