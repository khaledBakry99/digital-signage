"use client";

import { useState } from "react";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { CameraGrid } from "@/components/cameras/CameraGrid";
import { CameraGridSkeleton } from "@/components/cameras/CameraGridSkeleton";
import { CameraForm } from "@/components/cameras/CameraForm";
import DeleteCameraModal from "@/components/DeleteCameraModal";
import type { Camera } from "@/lib/types/camera";

export default function CamerasPage() {
  const {
    cameras,
    loading,
    addCamera,
    updateCamera,
    deleteCamera,
    activateCamera,
    deactivateCamera,
  } = useCameras();
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<string | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);

  const handleToggleActivate = async (camera: Camera) => {
    try {
      if (camera.status === "connected") {
        await deactivateCamera(camera.id);
      } else {
        await activateCamera(camera.id);
      }
    } catch (err) {
      console.error("فشل تفعيل/تعطيل الكاميرا:", err);
    }
  };

  const handleAddCamera = async (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    timeToScreenshot: number;
  }) => {
    await addCamera(data);
    setShowForm(false);
  };

  const handleUpdateCamera = async (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    timeToScreenshot: number;
  }) => {
    if (!editingCamera) return;
    await updateCamera(editingCamera, data);
    setEditingCamera(null);
    setShowForm(false);
  };

  const handleEditCamera = (camera: Camera) => {
    setEditingCamera(camera.id);
    setShowForm(true);
  };

  const handleDeleteCamera = async (camera: Camera) => {
    setDeletingCamera(camera);
  };

  const confirmDelete = async () => {
    if (!deletingCamera) return;
    await deleteCamera(deletingCamera.id);
    setDeletingCamera(null);
  };

  const editingCameraData = editingCamera
    ? cameras.find((c) => c.id === editingCamera)
    : undefined;

  const usedWebcamDeviceIds = cameras
    .filter((c) => c.type === "local" && !!c.source)
    .map((c) => c.source);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-text">كاميرات المراقبة</span>
          </h1>
        </div>
        {cameras.length < 4 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
            }}
          >
            <svg
              className="w-4 h-4"
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

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md"
          style={{ background: "rgba(3, 7, 18, 0.75)" }}
        >
          <div
            className="w-full max-w-md rounded-[24px] p-6 animate-fade-in border border-white/5"
            style={{
              background:
                "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              className="text-xl font-bold mb-6 text-right"
              style={{ color: "var(--text-primary)" }}
            >
              {editingCamera ? "تعديل الكاميرا" : "إضافة كاميرا جديدة"}
            </h2>
            <CameraForm
              camera={editingCameraData}
              usedWebcamDeviceIds={usedWebcamDeviceIds}
              onSubmit={editingCamera ? handleUpdateCamera : handleAddCamera}
              onCancel={() => {
                setShowForm(false);
                setEditingCamera(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Camera Grid */}
      {loading ? (
        <CameraGridSkeleton />
      ) : cameras.length > 0 ? (
        <CameraGrid
          cameras={cameras}
          onEdit={handleEditCamera}
          onDelete={handleDeleteCamera}
          onToggleActivate={handleToggleActivate}
        />
      ) : (
        <div className="glass p-16 text-center animate-fade-in">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
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
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            لا توجد كاميرات
          </h3>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            ابدأ بإضافة كاميرا مراقبة
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
            }}
          >
            إضافة كاميرا
          </button>
        </div>
      )}

      {/* Delete Camera Modal */}
      <DeleteCameraModal
        camera={deletingCamera}
        isOpen={!!deletingCamera}
        onClose={() => setDeletingCamera(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
