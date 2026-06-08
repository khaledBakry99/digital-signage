"use client";

import { useState } from "react";
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
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300 scale-100 border border-red-500/20"
        style={{
          background: "linear-gradient(135deg, #0b0f19 0%, #1c0e15 100%)",
        }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full blur-3xl -z-10" />

        {/* Warning Icon Container */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 shadow-inner animate-bounce-slow">
          <svg
            className="w-7 h-7 text-red-500"
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
        <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
          إزالة الإعلان بشكل نهائي
        </h3>
        <p className="text-sm text-slate-400 text-center px-4 leading-relaxed">
          أنت على وشك إزالة الإعلان بشكل كامل من النظام. يرجى تأكيد رغبتك في حذف الإعلان التالي:
        </p>

        {/* Elegant Asset Name Card */}
        <div className="my-4 px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-center font-bold text-sm truncate max-w-full shadow-inner">
          &quot;{ad.name}&quot;
        </div>

      

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-700 text-slate-300 font-semibold text-sm transition-all duration-200 hover:text-slate-100 cursor-pointer active:scale-[0.98] select-none text-center"
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
