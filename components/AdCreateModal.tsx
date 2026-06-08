"use client";

import { useEffect } from "react";
import AdForm from "./AdForm";
import { useAdvertisements } from "@/lib/hooks/useAdvertisements";

interface AdCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: number;
}

/**
 * ==========================================
 * 💎 قوالب الشاشات المنبثقة الاحترافية (Reusable Modal Template)
 * ==========================================
 * هذا الملف يعمل كقالب موحد ومرجع تصميمي متكامل لجميع الشاشات المنبثقة في النظام.
 * يمكنك نسخه وتعديله بسهولة لإنشاء شاشات جديدة.
 * 
 * المكونات الأساسية المتوفرة:
 * 1. الخلفية المعتمة (Backdrop with backdrop-blur-md)
 * 2. الحاوية الزجاجية (Glass container with purple border glow)
 * 3. رأس الصفحة المميز (Header with Modern Gradient)
 * 4. زر الإغلاق الذكي (No-rotation, cursor-pointer, and press reaction)
 */

export default function AdCreateModal({ isOpen, onClose, onSuccess, clientId }: AdCreateModalProps) {
  const { createAdvertisement, error } = useAdvertisements(clientId);

  // منع التمرير في الخلفية عند فتح الشاشة المنبثقة
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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 2. Modal Body (الحاوية الزجاجية وتدرج الإضاءة) */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl animate-scale-in overflow-hidden border border-slate-800"
        style={{
          background: "linear-gradient(135deg, #0b0f19 0%, #15132d 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)",
        }}
      >
        {/* تأثيرات الإضاءة الخلفية الفخمة */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        {/* 3. Header (رأس الشاشة المنبثقة) */}
        <div 
          className="flex-shrink-0 px-8 py-6 border-b border-slate-800/60"
          style={{ 
            background: "linear-gradient(180deg, rgba(11, 15, 25, 0.95), rgba(11, 15, 25, 0.8))"
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  إضافة إعلان جديد
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ارفع صورة أو فيديو واملأ البيانات المطلوبة لإنشاء مادة إعلانية جديدة
              </p>
            </div>
            
            {/* 4. Close Button (زر الإغلاق المودرن - تفاعلي تماماً وبدون دوران) */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 cursor-pointer group"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
              }}
              title="إغلاق النافذة"
            >
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors"
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AdForm onSubmit={handleSubmit} />
          
          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
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
