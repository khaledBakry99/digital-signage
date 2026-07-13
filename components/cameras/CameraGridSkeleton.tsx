"use client";

import { useTheme } from "@/lib/context/ThemeContext";

export function CameraGridSkeleton() {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const skeletonBase = isLightTheme ? "bg-slate-200/60" : "bg-slate-800/40";
  const cardBg = isLightTheme
    ? "bg-white/85 border-white/70 shadow-[0_25px_65px_rgba(15,23,42,0.12)]"
    : "border-white/5 bg-gradient-to-br from-[#111528] to-[#090c18] shadow-[0_25px_70px_rgba(2,6,23,0.65)]";
  const previewBg = isLightTheme ? "bg-gradient-to-br from-indigo-50 via-white to-slate-100 border-white/70" : "bg-[#070b19]/60 border-white/5";
  const infoBg = isLightTheme ? "bg-white/40" : "bg-black/10";

  return (
    <div>
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-[28px] overflow-hidden flex flex-col border ${cardBg}`}
          >
            {/* Thumbnail Skeleton */}
            <div className={`relative h-48 flex items-center justify-center border-b ${previewBg}`}>
              <div className={`w-14 h-14 rounded-2xl animate-pulse ${skeletonBase}`} />
            </div>

            {/* Info Skeleton */}
            <div className={`p-5 flex flex-col flex-1 ${infoBg}`}>
              {/* Title */}
              <div className="mb-3">
                <div className={`h-6 w-32 rounded animate-pulse ${skeletonBase}`} />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 justify-end mb-3.5">
                <div className={`h-6 w-20 rounded-lg animate-pulse ${skeletonBase}`} />
                <div className={`h-6 w-16 rounded-lg animate-pulse ${skeletonBase}`} />
                <div className={`h-6 w-16 rounded-lg animate-pulse ${skeletonBase}`} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <div className={`h-10 w-20 rounded-xl animate-pulse ${skeletonBase}`} />
                <div className={`h-10 w-20 rounded-xl animate-pulse ${skeletonBase}`} />
                <div className={`h-10 flex-1 rounded-xl animate-pulse ${skeletonBase}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
