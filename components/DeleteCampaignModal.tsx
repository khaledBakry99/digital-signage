"use client";

import { createPortal } from "react-dom";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Campaign } from "@/lib/types/campaign";

interface DeleteCampaignModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function DeleteCampaignModal({ isOpen, campaign, onConfirm, onClose, loading = false, error }: DeleteCampaignModalProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  if (!isOpen || !campaign || typeof document === "undefined") {
    return null;
  }

  const overlayStyle = {
    background: isLightTheme ? "rgba(15,23,42,0.18)" : "rgba(2,6,23,0.75)",
    backdropFilter: "blur(10px)",
  } as const;

  const cardStyle = isLightTheme
    ? {
        background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(231,237,255,0.96))",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 45px 120px rgba(15,23,42,0.18)",
      }
    : {
        background: "linear-gradient(145deg, rgba(22,31,55,0.95), rgba(10,14,27,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 45px 120px rgba(0,0,0,0.65)",
      };

  const dangerButtonClass = isLightTheme
    ? "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:opacity-90"
    : "bg-gradient-to-r from-rose-400 to-red-400 text-white hover:opacity-90";

  const cancelButtonClass = isLightTheme
    ? "bg-white/70 text-slate-600 border border-white/80 hover:bg-white"
    : "bg-white/10 text-white/80 border border-white/15 hover:bg-white/20";

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0" style={overlayStyle} onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-lg rounded-[32px] p-8" style={cardStyle}>
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{
            background: isLightTheme ? "rgba(248,113,113,0.15)" : "rgba(248,113,113,0.2)",
            border: isLightTheme ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(248,113,113,0.35)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-rose-500">
              <path d="M3 6h18" strokeLinecap="round" />
              <path d="M8 6V4h8v2" strokeLinecap="round" />
              <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" />
              <path d="M10 11v6" strokeLinecap="round" />
              <path d="M14 11v6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLightTheme ? "text-rose-500" : "text-rose-300"}`}>تأكيد حذف الحملة</p>
            <h3 className={`text-2xl font-black mt-1 ${isLightTheme ? "text-slate-800" : "text-white"}`}>
              {campaign.name}
            </h3>
            <p className={`mt-2 ${isLightTheme ? "text-slate-500" : "text-white/70"}`}>
              لا يمكن التراجع عن هذه العملية. سيتم حذف جميع بيانات الحملة المرتبطة.
            </p>
          </div>
          {error ? (
            <div className="text-sm text-rose-500 bg-rose-50/80 border border-rose-100 rounded-2xl px-4 py-2">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition ${cancelButtonClass} disabled:opacity-60`}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition disabled:opacity-60 ${dangerButtonClass}`}
            >
              {loading ? "جار الحذف..." : "حذف نهائي"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
