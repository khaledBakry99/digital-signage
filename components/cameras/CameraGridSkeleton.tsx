"use client";

export function CameraGridSkeleton() {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 w-48 bg-slate-800/50 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-32 bg-slate-800/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl overflow-hidden border border-white/5 flex flex-col"
            style={{
              background:
                "linear-gradient(145deg, rgba(30, 41, 59, 0.35), rgba(15, 23, 42, 0.55))",
              boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Thumbnail Skeleton */}
            <div className="relative h-48 bg-[#070b19]/60 flex items-center justify-center border-b border-white/5">
              <div className="w-14 h-14 bg-slate-800/40 rounded-2xl animate-pulse" />
            </div>

            {/* Info Skeleton */}
            <div className="p-5 flex flex-col flex-1 bg-black/10">
              {/* Title */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-12 bg-slate-800/40 rounded animate-pulse" />
                <div className="h-6 w-32 bg-slate-800/40 rounded animate-pulse" />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 justify-end mb-3.5">
                <div className="h-6 w-20 bg-slate-800/40 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-slate-800/40 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 justify-end mb-4">
                <div className="h-4 w-24 bg-slate-800/40 rounded animate-pulse" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <div className="h-10 w-20 bg-slate-800/40 rounded-xl animate-pulse" />
                <div className="h-10 w-20 bg-slate-800/40 rounded-xl animate-pulse" />
                <div className="h-10 flex-1 bg-slate-800/40 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
