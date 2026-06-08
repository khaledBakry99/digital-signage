"use client";

import { useState, useEffect } from "react";
import { cameraApi, type BackendCamera } from "@/lib/api/camera.api";
import { extractApiError } from "@/lib/api/client";

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

  return (
    <div className="glass p-6 animate-fade-in">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        ربط الكاميرا (AI)
      </h3>

      {/* AI Status Indicator */}
      <div className={`mb-4 p-3 rounded-xl flex items-center justify-between gap-3 ${
        aiEnabled
          ? "bg-emerald-500/10 border border-emerald-500/20"
          : "bg-amber-500/10 border border-amber-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${aiEnabled ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
            {aiEnabled ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <p className="text-sm font-semibold" style={{ color: aiEnabled ? "#34d399" : "#fbbf24" }}>
              {aiEnabled ? "الذكاء الاصطناعي: مفعّل" : "الذكاء الاصطناعي: غير مفعّل"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {aiEnabled
                ? "يمكنك ربط كاميرا لتحليل الجمهور"
                : "قم بتفعيل AI لتحليل الجمهور تلقائياً"}
            </p>
          </div>
        </div>
        
        {onToggleAI && (
          <button
            onClick={handleToggleAI}
            disabled={togglingAI}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:opacity-80 disabled:opacity-50 shrink-0"
            style={{
              background: aiEnabled 
                ? "rgba(239,68,68,0.2)" 
                : "linear-gradient(135deg, #10b981, #059669)",
              border: aiEnabled ? "1px solid rgba(239,68,68,0.3)" : "none",
              color: aiEnabled ? "#f87171" : "white",
            }}
          >
            {togglingAI ? "..." : aiEnabled ? "تعطيل" : "تفعيل"}
          </button>
        )}
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {currentCamera ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                  الكاميرا المربوطة
                </p>
                <p className="text-lg font-bold text-indigo-300">{currentCamera.name}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">نشطة</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span style={{ color: "var(--text-muted)" }}>الموقع:</span>
                <span style={{ color: "var(--text-primary)" }}>{currentCamera.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span style={{ color: "var(--text-muted)" }}>فاصل الالتقاط:</span>
                <span style={{ color: "var(--text-primary)" }}>{currentCamera.timeToScreenshot} ثانية</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span style={{ color: "var(--text-muted)" }}>الجهاز:</span>
                <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                  {currentCamera.cameraDeviceName}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRemoveClick}
            disabled={assigning}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            {assigning ? "جاري الإزالة..." : "إزالة الكاميرا"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              اختر كاميرا
            </label>
            <select
              value={selectedCameraId || ""}
              onChange={(e) => setSelectedCameraId(Number(e.target.value) || null)}
              disabled={!aiEnabled}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">— اختر كاميرا —</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name} — {camera.location}
                </option>
              ))}
            </select>
          </div>

          {cameras.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
              <p>لا توجد كاميرات نشطة متاحة حالياً</p>
            </div>
          )}

          <button
            onClick={handleAssignClick}
            disabled={!selectedCameraId || !aiEnabled || assigning}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selectedCameraId && aiEnabled
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "var(--bg-secondary)",
              color: "white",
            }}
          >
            {assigning ? "جاري الربط..." : "ربط الكاميرا"}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {confirmAction === "assign" ? "تأكيد ربط الكاميرا" : "تأكيد إزالة الكاميرا"}
            </h3>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              {confirmAction === "assign"
                ? `هل أنت متأكد من ربط الكاميرا "${cameras.find((c) => c.id === selectedCameraId)?.name}" بهذه الشاشة؟`
                : `هل أنت متأكد من إزالة الكاميرا "${currentCamera?.name}" من هذه الشاشة؟`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAction === "assign" ? handleConfirmAssign : handleConfirmRemove}
                disabled={assigning}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={{
                  background:
                    confirmAction === "assign"
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                }}
              >
                {assigning ? "جاري المعالجة..." : "تأكيد"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={assigning}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white/5"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
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
