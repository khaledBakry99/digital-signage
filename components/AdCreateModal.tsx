"use client";

import { useEffect } from "react";
import AdForm from "./AdForm";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";
import { useTheme } from "@/lib/context/ThemeContext";

interface AdCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: number;
}

export default function AdCreateModal({ isOpen, onClose, onSuccess, clientId }: AdCreateModalProps) {
  const { createAdvertisement, error } = useAdvertisements(clientId);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (data: {
    name: string;
    file: File;
    description?: string;
    type: 'Image' | 'Video';
    durationSeconds?: number;
  }) => {
    const ad = await createAdvertisement(data);
    if (ad) {
      onSuccess(); // لتحديث جدول الإعلانات مباشرة
      onClose(); // إغلاق المودال
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 1. Backdrop (الخلفية المضببة التفاعلية) */}
      <div
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${isLightTheme ? "bg-slate-900/30" : "bg-slate-950/80"
          }`}
        onClick={onClose}
      />

      {/* 2. Modal Body (الحاوية الزجاجية وتدرج الإضاءة) */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl animate-scale-in overflow-hidden border ${isLightTheme ? "border-white/70" : "border-slate-800"
          }`}
        style={
          isLightTheme
            ? {
              background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(237,243,255,0.92))",
              boxShadow: "0 45px 90px rgba(15,23,42,0.2)",
              backdropFilter: "blur(24px)",
            }
            : {
              background: "linear-gradient(135deg, #0b0f19 0%, #15132d 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)",
            }
        }
      >
        {/* تأثيرات الإضاءة الخلفية الفخمة */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -z-10 animate-pulse"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle, rgba(129,140,248,0.25), transparent 60%)"
              : "rgba(129,140,248,0.15)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl -z-10"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle, rgba(236,72,153,0.22), transparent 60%)"
              : "rgba(168,85,247,0.15)",
          }}
        />

        {/* 3. Header (رأس الشاشة المنبثقة) */}
        <div
          className={`flex-shrink-0 px-8 py-6 border-b ${isLightTheme ? "border-white/60" : "border-slate-800/60"
            }`}
          style={{
            background: isLightTheme
              ? "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(238,242,255,0.85))"
              : "linear-gradient(180deg, rgba(11, 15, 25, 0.95), rgba(11, 15, 25, 0.8))",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  إضافة إعلان جديد
                </span>
              </h2>
              <p className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                ارفع صورة أو فيديو واملأ البيانات المطلوبة لإنشاء مادة إعلانية جديدة
              </p>
            </div>

            {/* 4. Close Button (زر الإغلاق المودرن - تفاعلي تماماً وبدون دوران) */}
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group border ${isLightTheme
                ? "bg-white/70 text-slate-600 hover:bg-rose-50 border-white/80 hover:border-rose-200"
                : "hover:bg-red-500/10 border-slate-800 hover:border-red-500/20"
                }`}
              style={
                isLightTheme
                  ? { boxShadow: "0 10px 30px rgba(15,23,42,0.1)" }
                  : { background: "rgba(255, 255, 255, 0.02)" }
              }
              title="إغلاق النافذة"
            >
              <svg
                className={`w-5 h-5 transition-colors ${isLightTheme ? "text-slate-500 group-hover:text-rose-500" : "text-slate-400 group-hover:text-red-400"
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 5. Scrollable Content (منطقة المحتوى القابل للتمرير) */}
        <div
          className="flex-1 overflow-y-auto p-8 custom-scrollbar"
          style={
            isLightTheme
              ? { background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(248,250,255,0.7))" }
              : undefined
          }
        >
          <AdForm onSubmit={handleSubmit} />

          {error && (
            <div
              className={`mt-5 p-4 rounded-2xl text-sm flex items-center gap-2 ${isLightTheme
                ? "bg-rose-50 border border-rose-100 text-rose-600"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
