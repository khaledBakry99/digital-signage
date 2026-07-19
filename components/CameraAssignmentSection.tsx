"use client";

import { useState, useEffect } from "react";
import { cameraApi, type BackendCamera } from "@/lib/api/camera.api";
import { extractApiError } from "@/lib/api/client";
import { useTheme } from "@/lib/context/ThemeContext";

interface CameraAssignmentSectionProps {
  screenId: number;
  clientId: number;
  currentCameraId?: number;
  aiEnabled: boolean;
  onAssignCamera: (cameraId: number) => Promise<boolean>;
  onRemoveCamera: () => Promise<boolean>;
  onToggleAI?: (enabled: boolean) => Promise<boolean>;
}

export default function CameraAssignmentSection({
  screenId,
  clientId,
  currentCameraId,
  aiEnabled,
  onAssignCamera,
  onRemoveCamera,
  onToggleAI,
}: CameraAssignmentSectionProps) {
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [togglingAI, setTogglingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"assign" | "remove" | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  useEffect(() => {
    loadCameras();
  }, [clientId]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      // جلب الكاميرات النشطة فقط
      const data = await cameraApi.getAll({ clientId, state: "Active" });
      setCameras(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = () => {
    if (!aiEnabled) {
      setError("لا يمكن ربط كاميرا. يجب تفعيل الذكاء الاصطناعي أولاً");
      return;
    }
    if (!selectedCameraId) return;
    setConfirmAction("assign");
    setShowConfirm(true);
  };

  const handleRemoveClick = () => {
    setConfirmAction("remove");
    setShowConfirm(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCameraId) return;

    setAssigning(true);
    setError(null);

    try {
      const success = await onAssignCamera(selectedCameraId);
      if (success) {
        setShowConfirm(false);
        setSelectedCameraId(null);
        await loadCameras();
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    setAssigning(true);
    setError(null);

    try {
      const success = await onRemoveCamera();
      if (success) {
        setShowConfirm(false);
        await loadCameras();
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleToggleAI = async () => {
    if (!onToggleAI) {
      setError("وظيفة تبديل AI غير متاحة");
      return;
    }

    setTogglingAI(true);
    setError(null);

    try {
      const success = await onToggleAI(!aiEnabled);
      if (!success) {
        setError("فشل تبديل حالة الذكاء الاصطناعي");
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setTogglingAI(false);
    }
  };

  const currentCamera = cameras.find((c) => c.id === currentCameraId);

  if (loading) {
    return (
      <div className="glass p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  const containerClass = `relative overflow-hidden rounded-[28px] border p-6 lg:p-7 shadow-lg animate-fade-in ${isLightTheme ? "border-white/60 shadow-[0_25px_80px_rgba(15,23,42,0.08)]" : "border-white/5"
    }`;

  const containerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(235,250,248,0.95), rgba(226,236,255,0.92))",
      backdropFilter: "blur(20px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(15,23,42,1), rgba(20,11,42,0.9))",
    };

  const headingClass = `text-lg font-bold flex items-center gap-2 ${isLightTheme ? "text-slate-800" : "text-white"}`;
  const headingIconClass = `w-5 h-5 ${isLightTheme ? "text-indigo-500" : "text-indigo-300"}`;

  return (
    <div className={containerClass} style={containerStyle}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: isLightTheme
            ? "radial-gradient(circle at top right, rgba(134,239,172,0.3), transparent 55%)"
            : "radial-gradient(circle at top right, rgba(99,102,241,0.25), transparent 55%)",
        }}
      />
      <div
        className="absolute -left-16 bottom-0 w-60 h-60 blur-3xl"
        style={{ background: isLightTheme ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.05)", opacity: isLightTheme ? 0.6 : 0.1 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className={headingClass}>
            <svg className={headingIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            ربط الكاميرا (AI)
          </h3>
        </div>

        {/* AI Status Indicator */}
        <div
          className={`mb-5 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-500 ${aiEnabled
            ? isLightTheme
              ? "bg-emerald-50 border border-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.18)]"
              : "bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]"
            : isLightTheme
              ? "bg-amber-50 border border-amber-200"
              : "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_-5px_rgba(245,158,11,0.1)]"
            }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${aiEnabled
                ? isLightTheme
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-emerald-500/20 text-emerald-400"
                : isLightTheme
                  ? "bg-amber-100 text-amber-600"
                  : "bg-amber-500/20 text-amber-400"
                }`}
            >
              {aiEnabled ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className="font-bold text-base"
                style={{ color: aiEnabled ? (isLightTheme ? "#059669" : "#34d399") : isLightTheme ? "#b45309" : "#fbbf24" }}
              >
                {aiEnabled ? "الذكاء الاصطناعي مفعّل" : "الذكاء الاصطناعي معطّل"}
              </p>
              <p className={`text-xs ${isLightTheme ? "text-slate-500" : "text-white/60"}`}>
                {aiEnabled
                  ? "تحليل الجمهور نشط حالياً"
                  : "قم بتفعيل الميزة لبدء التحليل"}
              </p>
            </div>
          </div>

          {onToggleAI && (
            <button
              onClick={handleToggleAI}
              disabled={togglingAI}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              style={{
                background: aiEnabled
                  ? isLightTheme
                    ? "rgba(248,113,113,0.15)"
                    : "rgba(239,68,68,0.15)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                border: aiEnabled
                  ? isLightTheme
                    ? "1px solid rgba(248,113,113,0.35)"
                    : "1px solid rgba(239,68,68,0.3)"
                  : "none",
                color: aiEnabled ? (isLightTheme ? "#b91c1c" : "#f87171") : "white",
                boxShadow: aiEnabled ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
              }}
            >
              {togglingAI ? "..." : aiEnabled ? "تعطيل الآن" : "تفعيل الآن"}
            </button>
          )}
        </div>

        {error && (
          <div
            className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 animate-shake ${isLightTheme
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-red-500/10 border border-red-500/20 text-red-200"
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {currentCamera ? (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-2xl border transition-all ${isLightTheme
                ? "bg-white/85 border-white/70 text-slate-700 shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
                : "bg-white/5 border-white/10 text-slate-200"
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-xl font-bold ${isLightTheme ? "text-slate-900" : "text-white"}`}>{currentCamera.name}</p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${isLightTheme
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-emerald-500/15 border-emerald-500/30"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLightTheme ? "bg-emerald-500" : "bg-emerald-400"} animate-pulse`} />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isLightTheme ? "text-emerald-600" : "text-emerald-400"
                      }`}
                  >
                    Online
                  </span>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-3 pt-3 border-t ${isLightTheme ? "border-white" : "border-white/5"}`}>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLightTheme ? "bg-white/80 text-slate-400" : "bg-white/5 text-white/40"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z" />
                    </svg>
                  </div>
                  <span className={isLightTheme ? "text-slate-500" : "text-white/60"}>الموقع:</span>
                  <span className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white/90"}`}>
                    {currentCamera.location}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLightTheme ? "bg-white/80 text-slate-400" : "bg-white/5 text-white/40"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={isLightTheme ? "text-slate-500" : "text-white/60"}>التحديث:</span>
                  <span className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white/90"}`}>
                    كل {currentCamera.timeToScreenshot} ثانية
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRemoveClick}
              disabled={assigning}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ${isLightTheme
                ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
                }`}
            >
              {assigning ? "جاري الإزالة..." : "إزالة الكاميرا"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? "text-slate-600" : "text-white/60"}`}>
                اختر كاميرا من القائمة
              </label>
              <div className="relative group">
                <select
                  value={selectedCameraId || ""}
                  onChange={(e) => setSelectedCameraId(Number(e.target.value) || null)}
                  disabled={!aiEnabled}
                  className={`w-full px-4 py-3 rounded-2xl text-sm outline-none cursor-pointer appearance-none transition-all disabled:opacity-40 ${isLightTheme ? "focus:ring-2 focus:ring-emerald-200" : ""
                    }`}
                  style={{
                    background: isLightTheme ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.6)",
                    border: isLightTheme ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(148,163,184,0.2)",
                    color: isLightTheme ? "#0f172a" : "#f8fafc",
                    boxShadow: isLightTheme ? "0 10px 25px rgba(15,23,42,0.08)" : "none",
                  }}
                >
                  <option value="" className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>— اختر كاميرا —</option>
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id} className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>
                      {camera.name} — {camera.location}
                    </option>
                  ))}
                </select>
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isLightTheme ? "text-emerald-400/80" : "text-white/40 group-hover:text-white/60"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {cameras.length === 0 && (
              <div
                className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${isLightTheme
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-200/80"
                  }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>لا توجد كاميرات نشطة متاحة حالياً</p>
              </div>
            )}

            <button
              onClick={handleAssignClick}
              disabled={!selectedCameraId || !aiEnabled || assigning}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 ${selectedCameraId && aiEnabled
                ? "text-white"
                : isLightTheme
                  ? "bg-white/70 border border-white/80 text-slate-400"
                  : "text-white"
                }`}
              style={{
                background:
                  selectedCameraId && aiEnabled
                    ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                    : isLightTheme
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(15,23,42,0.5)",
                color: selectedCameraId && aiEnabled ? "#fff" : undefined,
                boxShadow:
                  selectedCameraId && aiEnabled
                    ? "0 18px 35px -12px rgba(79,70,229,0.5)"
                    : isLightTheme
                      ? "0 10px 30px rgba(15,23,42,0.08)"
                      : "none",
              }}
            >
              {assigning ? "جاري الربط..." : "ربط الكاميرا"}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in"
          style={{ background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-7 shadow-2xl animate-scale-in border border-white/10"
            style={{
              background: "linear-gradient(145deg, #1e293b, #0f172a)",
            }}
          >
            <h3 className="text-xl font-bold mb-3 text-white">
              {confirmAction === "assign" ? "تأكيد ربط الكاميرا" : "تأكيد إزالة الكاميرا"}
            </h3>
            <p className="mb-8 text-white/60 leading-relaxed">
              {confirmAction === "assign"
                ? `هل أنت متأكد من ربط الكاميرا "${cameras.find((c) => c.id === selectedCameraId)?.name}" بهذه الشاشة؟ سيتم البدء بتحليل الجمهور فوراً.`
                : `هل أنت متأكد من إزالة الكاميرا "${currentCamera?.name}" من هذه الشاشة؟ سيتوقف تحليل الجمهور التلقائي.`}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmAction === "assign" ? handleConfirmAssign : handleConfirmRemove}
                disabled={assigning}
                className="flex-1 py-3 rounded-2xl text-sm font-bold cursor-pointer disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
                style={{
                  background:
                    confirmAction === "assign"
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                }}
              >
                {assigning ? "..." : "نعم، متأكد"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={assigning}
                className="px-8 py-3 rounded-2xl text-sm font-bold cursor-pointer bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
