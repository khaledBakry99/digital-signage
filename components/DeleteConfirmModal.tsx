"use client";

import { useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface DeleteConfirmModalProps {
  ad: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({ ad, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const handleConfirm = async () => {
    if (!ad) return;
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف الإعلان");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300 scale-100 border ${isLightTheme ? "border-rose-200 bg-white/95 shadow-[0_25px_65px_rgba(244,63,94,0.15)]" : "border-red-500/20"}`}
        style={isLightTheme ? {} : {
          background: "linear-gradient(135deg, #0b0f19 0%, #1c0e15 100%)",
        }}
      >
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 animate-pulse ${isLightTheme ? "bg-rose-100" : "bg-red-500/10"}`} />
        <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl -z-10 ${isLightTheme ? "bg-rose-50" : "bg-rose-500/5"}`} />

        {/* Warning Icon Container */}
        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-inner animate-bounce-slow ${isLightTheme ? "bg-rose-100 border border-rose-200" : "bg-red-500/10 border border-red-500/20"}`}>
          <svg
            className={`w-7 h-7 ${isLightTheme ? "text-rose-500" : "text-red-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Content */}
        <h3 className={`text-xl font-bold text-center mb-2 ${isLightTheme ? "text-slate-900" : "text-slate-100"}`}>
          إزالة الإعلان بشكل نهائي
        </h3>
        <p className={`text-sm text-center px-4 leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
          أنت على وشك إزالة الإعلان بشكل كامل من النظام. يرجى تأكيد رغبتك في حذف الإعلان التالي:
        </p>

        {/* Elegant Asset Name Card */}
        <div className={`my-4 px-4 py-3 rounded-2xl border text-center font-bold text-sm truncate max-w-full shadow-inner ${isLightTheme ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-red-500/5 border-red-500/10 text-red-400"}`}>
          &quot;{ad.name}&quot;
        </div>



        {error && (
          <div className={`mb-4 p-3.5 rounded-xl border text-xs text-center ${isLightTheme ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {error}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] select-none text-center ${isLightTheme ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700" : "bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-700 text-slate-300 hover:text-slate-100"}`}
            disabled={loading}
          >
            الاحتفاظ بالإعلان
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-red-600/15 hover:shadow-red-600/25 cursor-pointer active:scale-[0.98] select-none text-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الحذف...
              </span>
            ) : (
              "حذف الإعلان نهائياً"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
