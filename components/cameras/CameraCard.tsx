"use client";

import type { Camera } from "@/lib/types/camera";

interface CameraCardProps {
  camera: Camera;
  onView: (camera: Camera) => void;
  onEdit?: (camera: Camera) => void;
  onDelete?: (camera: Camera) => void;
  onToggleActivate?: (camera: Camera) => Promise<void>;
}

export function CameraCard({
  camera,
  onView,
  onEdit,
  onDelete,
  onToggleActivate,
}: CameraCardProps) {
  const isConnected = camera.status === "connected";

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

  return (
    <div
      className="rounded-[24px] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 border border-white/5 flex flex-col group"
      style={{
        background:
          "linear-gradient(145deg, rgba(30, 41, 59, 0.35), rgba(15, 23, 42, 0.55))",
        boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Thumbnail/Preview Area (Upper Dark Panel) */}
      <div className="relative h-48 bg-[#070b19]/60 flex flex-col items-center justify-center p-4 border-b border-white/5">
        {camera.thumbnail ? (
          <img
            src={camera.thumbnail}
            alt={camera.name}
            className="w-full h-full object-cover rounded-t-[24px]"
          />
        ) : (
          <div className="text-slate-500/80 text-center flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all">
              <svg
                className="w-7 h-7 text-slate-400"
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
            <p className="text-xs font-semibold text-slate-400/80">
              لا توجد معاينة
            </p>
          </div>
        )}

        {/* Live Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0a0f1d]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5 shadow-lg select-none">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-white text-[11px] font-bold tracking-wide">
            {getStatusText()}
          </span>
        </div>

        {/* Quick Power Toggle */}
        {onToggleActivate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActivate(camera);
            }}
            className={`absolute top-4 right-4 flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg transition-all duration-300 cursor-pointer select-none active:scale-95 z-10 ${
              isConnected
                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30"
            }`}
            title={
              isConnected ? "تعطيل معالجة الكاميرا" : "تفعيل معالجة الكاميرا"
            }
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isConnected ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              )}
            </svg>
            <span className="text-[10px] font-bold tracking-wide">
              {isConnected ? "تعطيل" : "تفعيل"}
            </span>
          </button>
        )}
      </div>

      {/* Camera Info Panel (Glassmorphic Dark Section) */}
      <div className="p-5 flex flex-col flex-1 text-right bg-black/10">
        {/* Title / Name */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-semibold">
            #{camera.id}
          </span>
          <h3 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-indigo-400 transition-colors">
            {camera.name}
          </h3>
        </div>

        {/* Badges / Tech Info */}
        <div className="flex items-center gap-2 justify-end mb-3.5">
          {camera.timeToScreenshot && camera.timeToScreenshot > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg flex items-center gap-1.5"
              dir="ltr"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{camera.timeToScreenshot}s</span>
            </span>
          )}
          <span className="text-[11px] font-bold px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg flex items-center gap-1">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{getTypeText()}</span>
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg flex items-center gap-1">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>1080p</span>
          </span>
        </div>

        {/* Location Section */}
        {camera.location && (
          <div className="flex items-center gap-1.5 justify-end text-xs text-slate-400 font-medium mb-4">
            <span>{camera.location}</span>
            <svg
              className="w-3.5 h-3.5 text-slate-500 shrink-0"
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
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(camera);
              }}
              className="px-4 py-2.5 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-150 rounded-xl text-xs font-bold cursor-pointer select-none"
            >
              حذف
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(camera);
              }}
              className="px-4 py-2.5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-slate-100 hover:bg-white/5 active:scale-95 transition-all duration-150 rounded-xl text-xs font-bold cursor-pointer select-none"
            >
              تعديل
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(camera);
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white py-2.5 px-6 transition-all duration-150 rounded-xl text-xs font-bold text-center cursor-pointer select-none shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20"
          >
            عرض البث
          </button>
        </div>
      </div>
    </div>
  );
}
