"use client";

import { useState, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Camera } from "@/lib/types/camera";
import { CameraCard } from "./CameraCard";
import { MAX_CAMERAS } from "@/lib/cameras/constants";
import { cameraApi } from "@/lib/api/camera.api";
import { registerOpenCameraTab } from "@/lib/cameras/utils/openCameraTabs";

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
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [activatingCameraIds, setActivatingCameraIds] = useState<Set<number>>(new Set());

  const toggleActivating = useCallback((cameraId: number, isActive: boolean) => {
    setActivatingCameraIds((prev) => {
      const next = new Set(prev);
      if (isActive) {
        next.add(cameraId);
      } else {
        next.delete(cameraId);
      }
      return next;
    });
  }, []);

  const handleViewCamera = (camera: Camera) => {
    const cameraId = Number(camera.id);
    if (!Number.isFinite(cameraId) || cameraId <= 0) {
      console.error("❌ رقم كاميرا غير صالح", camera.id);
      return;
    }

    const newTab = window.open(`/cameras/${cameraId}`, "_blank");
    if (!newTab) {
      console.error("❌ لم يتم فتح تبويب الكاميرا - ربما تم منع النوافذ المنبثقة");
      return;
    }

    registerOpenCameraTab(cameraId);
    toggleActivating(cameraId, true);
    cameraApi
      .activate(cameraId)
      .then(() => console.log(`✅ تم تفعيل الكاميرا ${cameraId} من صفحة الكاميرات`))
      .catch((err) => console.error(`❌ فشل تفعيل الكاميرا ${cameraId} من صفحة الكاميرات:`, err))
      .finally(() => toggleActivating(cameraId, false));
  };

  const canAddMore = cameras.length < MAX_CAMERAS;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">


        {onAdd && canAddMore && (
          <button
            onClick={onAdd}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all select-none cursor-pointer shadow-lg ${isLightTheme ? "text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_18px_40px_rgba(79,70,229,0.25)]" : "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30"}`}
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
        <div className={`text-center py-16 rounded-[28px] border backdrop-blur-md ${isLightTheme ? "bg-white/80 border-white/70 shadow-[0_25px_60px_rgba(15,23,42,0.08)]" : "bg-white/5 border-white/5"}`}>
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${isLightTheme ? "text-slate-300" : "text-slate-500"}`}
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
          <h3 className={`text-lg font-semibold mb-2 ${isLightTheme ? "text-slate-900" : "text-slate-100"}`}>
            لا توجد كاميرات مضافة
          </h3>
          <p className={`text-sm mb-4 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
            ابدأ بإضافة كاميرا لعرض البث المباشر والتحليل الذكي
          </p>
          {onAdd && (
            <button
              onClick={onAdd}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all select-none cursor-pointer inline-flex items-center gap-2 shadow-lg ${isLightTheme ? "text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_18px_40px_rgba(79,70,229,0.25)]" : "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30"}`}
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
              activatingCameraIds={activatingCameraIds}
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
