"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { dashboardApi, type Subscription } from "@/lib/api";
import { cameraApi } from "@/lib/api/camera.api";
import { CameraGrid } from "@/components/cameras/CameraGrid";
import { CameraGridSkeleton } from "@/components/cameras/CameraGridSkeleton";
import { CameraForm } from "@/components/cameras/CameraForm";
import DeleteCameraModal from "@/components/DeleteCameraModal";
import type { Camera } from "@/lib/types/camera";
import { useEffect } from "react";

export default function CamerasPage() {
  const router = useRouter();
  const {
    cameras,
    loading,
    addCamera,
    updateCamera,
    deleteCamera,
  } = useCameras();
  const { theme } = useTheme();
  const { clientId, loading: authLoading, isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<string | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);
  const [openCameraTabs, setOpenCameraTabs] = useState<Set<number>>(new Set());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const isLightTheme = theme === "light";
  const activeCameras = cameras.filter((c) => c.status === "connected").length;
  const statsLoaded = !loading;
  const maxCameras = subscription?.maxCameras ?? 0;
  const isAtMaxCameras = maxCameras > 0 && cameras.length >= maxCameras;


  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("openCameraTabs");
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setOpenCameraTabs(new Set(ids));
        } catch {
          setOpenCameraTabs(new Set());
        }
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch subscription data to get maximum cameras limit
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await dashboardApi.getSubscriptions(clientId!);
        if (data && data.length > 0) {
          setSubscription(data[0]);
        }
      } catch (err) {
      }
    };

    if (!authLoading && isAuthenticated && clientId) {
      fetchSubscription();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [clientId, authLoading, isAuthenticated]);

  const handleAddCamera = async (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    cameraDeviceRealName?: string;
    timeToScreenshot: number;
    sourceType: string;
  }) => {
    console.log('[CamerasPage] ===== بدء إضافة كاميرا جديدة =====');
    console.log('[CamerasPage] البيانات:', JSON.stringify(data, null, 2));
    
    try {
      const newCamera = await addCamera(data);
      console.log('[CamerasPage] ✓ تم إنشاء الكاميرا:', newCamera);
      
      // Save camera device name for permanent binding
      if (newCamera.id && data.cameraDeviceName) {
        try {
          console.log('[CamerasPage] جاري حفظ اسم جهاز الكاميرا...');
          await cameraApi.setCameraDeviceName(newCamera.id, data.cameraDeviceName);
          console.log('[CamerasPage] ✓ تم حفظ اسم جهاز الكاميرا');
        } catch (err) {
          console.error('[CamerasPage] ✗ فشل حفظ اسم جهاز الكاميرا:', err);
        }
      }
      
      setShowForm(false);
      console.log('[CamerasPage] ✓ تمت إضافة الكاميرا بنجاح');
    } catch (error) {
      console.error('[CamerasPage] ✗ فشل إضافة الكاميرا:', error);
    }
  };

  const handleUpdateCamera = async (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    cameraDeviceRealName?: string;
    timeToScreenshot: number;
    sourceType?: string;
  }) => {
    if (!editingCamera) return;
    await updateCamera(editingCamera, data);
    // Update camera device name for permanent binding
    if (data.cameraDeviceName) {
      try {
        await cameraApi.setCameraDeviceName(Number(editingCamera), data.cameraDeviceName);
      } catch (err) {
      }
    }
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
    <div className="min-h-screen px-6 lg:px-12 py-10 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {isLightTheme ? (
          <>
            <div className="absolute -top-[8%] -right-[5%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ background: "rgba(191,219,254,0.55)" }} />
            <div className="absolute top-[30%] -left-[10%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: "rgba(196,181,253,0.45)" }} />
            <div className="absolute bottom-[5%] left-[30%] w-[30%] h-[30%] rounded-full blur-[110px]" style={{ background: "rgba(248,250,252,0.9)" }} />
          </>
        ) : (
          <>
            <div className="absolute -top-[5%] -right-[10%] w-[45%] h-[45%] bg-indigo-500/15 blur-[120px] rounded-full" />
            <div className="absolute bottom-[15%] left-[5%] w-[35%] h-[35%] bg-purple-500/15 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      {/* Hero */}
      <div
        className={`relative mb-10 overflow-hidden rounded-[32px] border animate-fade-in ${isLightTheme
          ? "border-white/70 shadow-[0_35px_95px_rgba(15,23,42,0.08)]"
          : "border-white/5 shadow-[0_25px_75px_rgba(2,6,23,0.65)]"
          }`}
        style={
          isLightTheme
            ? {
              background: "linear-gradient(135deg, rgba(239,246,255,0.96), rgba(223,231,255,0.92))",
              backdropFilter: "blur(30px)",
            }
            : {
              background: "linear-gradient(135deg, rgba(21,30,55,0.9), rgba(12,18,35,0.95))",
            }
        }
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 55%)"
              : "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.3), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8 p-4">
          <div className="flex-1 text-right">

            <h1 className={`text-3xl lg:text-4xl font-black mb-3 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
              كاميرات المراقبة
            </h1>
            <p className={`text-base leading-relaxed ${isLightTheme ? "text-slate-500" : "text-slate-300"}`}>
              واجهة كاميرات ذكية للمراقبة المباشرة والتحكم بالكمرات           </p>
          </div>
          <div className="flex flex-col items-end gap-3 min-w-[210px]">
            {statsLoaded ? (
              <div className={`w-full rounded-[22px]_border text-right px-5 py-3 shadow-sm ${isLightTheme ? "bg-white/85 border-white/70 shadow-[0_15px_40px_rgba(15,23,42,0.09)]" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold tracking-[0.25em] ${isLightTheme ? "text-indigo-400" : "text-indigo-300"}`}>
                    الكاميرات النشطة
                  </span>
                  <span className={`w-2 h-2 rounded-full ${activeCameras > 0 ? "bg-emerald-400" : "bg-rose-400"}`} />
                </div>
                <div className="flex items-baseline justify-end gap-2">
                  <span className={`text-3xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{activeCameras}</span>
                  <span className={`text-base font-semibold ${isLightTheme ? "text-slate-400" : "text-slate-300"}`}>
                    / {cameras.length || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`w-full rounded-[22px] border px-5 py-3 shadow-sm ${isLightTheme ? "bg-white/85 border-white/70" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`h-4 w-24 rounded animate-pulse ${isLightTheme ? "bg-slate-200/60" : "bg-slate-800/40"}`} />
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isLightTheme ? "bg-slate-200/60" : "bg-slate-800/40"}`} />
                </div>
                <div className={`h-8 w-16 rounded animate-pulse ml-auto ${isLightTheme ? "bg-slate-200/60" : "bg-slate-800/40"}`} />
              </div>
            )}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                disabled={isAtMaxCameras}
                title={isAtMaxCameras ? `وصلت للحد الأقصى من الكاميرات (${cameras.length}/${maxCameras})` : undefined}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-lg ${isLightTheme ? "text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:-translate-y-0.5" : "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30"} ${isAtMaxCameras ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة كاميرا
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backdropFilter: "blur(18px)",
            background: isLightTheme ? "rgba(248,250,252,0.8)" : "rgba(3,7,18,0.75)",
          }}
        >
          <div
            className={`w-full max-w-md rounded-[28px] p-6 animate-fade-in border ${isLightTheme ? "border-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.15)]" : "border-white/5"}`}
            style={
              isLightTheme
                ? {
                  background: "linear-gradient(150deg, rgba(255,255,255,0.95), rgba(235,242,255,0.92))",
                }
                : {
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                }
            }
          >
            <h2
              className={`text-xl font-bold mb-6 text-right ${isLightTheme ? "text-slate-900" : "text-white"}`}
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
          openCameraTabs={openCameraTabs}
          maxCameras={maxCameras}
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
