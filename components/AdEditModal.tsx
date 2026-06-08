"use client";

import { useState } from "react";
import { extractApiError } from "@/lib/api/client";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface AdEditModalProps {
  ad: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: { name: string; description: string; isFallback: boolean }) => Promise<void>;
}

export default function AdEditModal({ ad, isOpen, onClose, onSave }: AdEditModalProps) {
  const [name, setName] = useState(ad?.name || "");
  const [description, setDescription] = useState(ad?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;

    try {
      setLoading(true);
      setError(null);
      await onSave(ad.id, { name, description, isFallback: ad.isFallback });
      onClose();
    } catch (err) {
      setError(extractApiError(err, "فشل تحديث الإعلان"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ad) return null;

  const formatSize = (mb: number) => {
    if (!mb) return "—";
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay with smooth fade */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-300 scale-100 border border-slate-800"
        style={{
          background: "linear-gradient(135deg, #0b0f19 0%, #15132d 100%)",
        }}
      >
        {/* Decorative lighting background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                تعديل بيانات الإعلان
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تعديل الاسم والوصف وتفاصيل العرض للإعلان المحدد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Technical Media Preview Card (Incredibly Premium UX!) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Thumbnail / Media Visual */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
            {ad.url && ad.type === "Image" ? (
              <img
                src={ad.url}
                alt={ad.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-purple-500/10 text-purple-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-[9px] font-bold tracking-wider mt-1">VIDEO</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border mb-2 ${
              ad.type === "Image"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ad.type === "Image" ? "bg-indigo-400" : "bg-purple-400"}`} />
              {ad.type === "Image" ? "ملف صورة" : "ملف فيديو"}
            </span>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
              <div className="text-slate-500">الأبعاد: <span className="text-slate-300 font-mono">{ad.resolution || "—"}</span></div>
              <div className="text-slate-500">الحجم: <span className="text-slate-300 font-mono">{formatSize(ad.fileSizeMb)}</span></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              اسم الإعلان
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 shadow-inner"
              required
              placeholder="مثال: عسل طبيعي فاخر"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              الوصف
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 resize-none shadow-inner"
              rows={3}
              placeholder="اكتب تفاصيل عروضك، مثل عسل للبيع مع شحن سريع..."
            />
          </div>

          {/* Buttons Footer with professional modern styling */}
          <div className="flex items-center gap-3 pt-5 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-700 text-slate-300 font-semibold text-sm transition-all duration-200 hover:text-slate-100 cursor-pointer active:scale-[0.98] select-none text-center"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 cursor-pointer active:scale-[0.98] select-none text-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الحفظ...
                </span>
              ) : (
                "حفظ التغييرات"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
