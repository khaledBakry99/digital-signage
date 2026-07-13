"use client";

import { useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Screen } from "@/lib/types/screen";

interface DeleteScreenModalProps {
  screen: Screen | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteScreenModal({
  screen,
  isOpen,
  onClose,
  onConfirm,
}: DeleteScreenModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const handleConfirm = async () => {
    if (!screen) return;
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف الشاشة");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !screen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: isLightTheme ? "rgba(15,23,42,0.2)" : "rgba(2,6,23,0.75)",
          backdropFilter: "blur(10px)",
        }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300 scale-100"
        style={
          isLightTheme
            ? {
              background: "linear-gradient(140deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))",
              border: "1px solid rgba(226,232,255,0.7)",
              boxShadow: "0 35px 95px rgba(15,23,42,0.18)",
            }
            : {
              background: "linear-gradient(135deg, #0b0f19 0%, #1c0e15 100%)",
              border: "1px solid rgba(248,113,113,0.15)",
            }
        }
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10"
          style={{ background: isLightTheme ? "rgba(248,113,113,0.12)" : "rgba(248,113,113,0.1)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl -z-10"
          style={{ background: isLightTheme ? "rgba(251,191,36,0.1)" : "rgba(244,114,182,0.1)" }}
        />

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
        <h3 className={`text-xl font-bold text-center mb-2 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
          إزالة الشاشة بشكل نهائي
        </h3>
        <p className={`text-sm text-center px-4 leading-relaxed ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
          أنت على وشك إزالة هذه الشاشة بالكامل من النظام. سيؤدي هذا إلى قطع اتصالها وإيقاف عرض الإعلانات والحملات عليها. يرجى تأكيد رغبتك في حذف الشاشة التالية:
        </p>

        {/* Screen Name Card */}
        <div
          className={`my-4 px-4 py-3 rounded-2xl text-center font-bold text-sm truncate max-w-full shadow-inner ${isLightTheme ? "bg-rose-50 border border-rose-100 text-rose-500" : "bg-red-500/5 border border-red-500/10 text-red-400"
            }`}
        >
          &quot;{screen.name}&quot;
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
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] select-none text-center ${isLightTheme
              ? "bg-white/80 border border-white/70 text-slate-600 hover:bg-white"
              : "bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-700 text-slate-300"
              }`}
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg cursor-pointer active:scale-[0.98] select-none text-center disabled:opacity-50 disabled:cursor-not-allowed ${isLightTheme
              ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-500 shadow-rose-500/20"
              : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-red-600/15"
              }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الحذف...
              </span>
            ) : (
              "حذف الشاشة"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
