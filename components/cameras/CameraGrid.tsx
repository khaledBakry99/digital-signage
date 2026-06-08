"use client";

import { useRouter } from "next/navigation";
import type { Camera } from "@/lib/types/camera";
import { CameraCard } from "./CameraCard";
import { MAX_CAMERAS } from "@/lib/cameras/constants";

interface CameraGridProps {
  cameras: Camera[];
  onEdit?: (camera: Camera) => void;
  onDelete?: (camera: Camera) => void;
  onAdd?: () => void;
  onToggleActivate?: (camera: Camera) => Promise<void>;
}

export function CameraGrid({
  cameras,
  onEdit,
  onDelete,
  onAdd,
  onToggleActivate,
}: CameraGridProps) {
  const router = useRouter();

  const handleViewCamera = (camera: Camera) => {
    // Open camera in new tab
    window.open(`/cameras/${camera.id}`, "_blank");
  };

  const canAddMore = cameras.length < MAX_CAMERAS;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            الكاميرات المباشرة
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {cameras.length} من {MAX_CAMERAS} كاميرات نشطة
          </p>
        </div>

        {onAdd && canAddMore && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة كاميرا
          </button>
        )}
      </div>

      {/* Grid */}
      {cameras.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/5 rounded-[24px] backdrop-blur-md">
          <svg
            className="w-16 h-16 mx-auto text-slate-500 mb-4"
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
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            لا توجد كاميرات مضافة
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            ابدأ بإضافة كاميرا لعرض البث المباشر والتحليل الذكي
          </p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none cursor-pointer inline-flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              إضافة كاميرا
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onView={handleViewCamera}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActivate={onToggleActivate}
            />
          ))}
        </div>
      )}

      {/* Max cameras reached message */}
      {!canAddMore && (
        <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
          <p className="text-yellow-400 text-sm text-right">
            تم الوصول للحد الأقصى من الكاميرات ({MAX_CAMERAS}). احذف كاميرا
            لإضافة واحدة جديدة.
          </p>
        </div>
      )}
    </div>
  );
}
