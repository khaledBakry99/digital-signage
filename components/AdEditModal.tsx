"use client";

import { useState, useRef, useEffect } from "react";
import { extractApiError } from "@/lib/api/client";
import { useTheme } from "@/lib/context/ThemeContext";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface AdEditModalProps {
  ad: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: { name: string; description: string; isFallback: boolean; file?: File; durationSeconds?: number }) => Promise<void>;
}

export default function AdEditModal({ ad, isOpen, onClose, onSave }: AdEditModalProps) {
  const [name, setName] = useState(ad?.name || "");
  const [description, setDescription] = useState(ad?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(ad?.durationSeconds || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Track field-specific errors
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);
  
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  // Character limits
  const NAME_MAX_LENGTH = 40;
  const DESCRIPTION_MAX_LENGTH = 100;

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

  // Update state when ad changes
  useEffect(() => {
    if (ad) {
      setName(ad.name);
      setDescription(ad.description || "");
      setDurationSeconds(ad.durationSeconds || 10);
      setFile(null);
      setPreview(null);
      setError(null);
      setFieldErrors({});
    }
  }, [ad]);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setFieldErrors(prev => ({ ...prev, file: "" }));
    
    const fn = selectedFile.name.toLowerCase();
    const isImage =
      selectedFile.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/.test(fn);
    const isVideo =
      selectedFile.type.startsWith("video/") || /\.(mp4|webm|mov)$/.test(fn);
    if (!isImage && !isVideo) {
      setError(
        "الرجاء اختيار ملف صورة (JPG, PNG, GIF, WebP) أو فيديو (MP4, WebM, MOV)",
      );
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("حجم الملف كبير جداً. الحد الأقصى 100 ميجابايت");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  // Scroll to field and highlight it
  const scrollToField = (ref: React.RefObject<HTMLElement | null>, fieldName: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setFieldErrors(prev => ({ ...prev, [fieldName]: "هذا الحقل مطلوب" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;

    setError(null);
    setFieldErrors({});

    // Validate all required fields
    if (!name.trim()) {
      scrollToField(nameInputRef, 'name');
      return;
    }
    
    if (!description.trim()) {
      scrollToField(descriptionInputRef, 'description');
      return;
    }

    // Determine if we're dealing with an image (either existing or new file)
    const isImageContent = file ? file.type.startsWith('image/') : ad.type === 'Image';
    
    // Validate duration for images
    if (isImageContent && (!durationSeconds || durationSeconds < 1)) {
      scrollToField(durationInputRef, 'duration');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onSave(ad.id, { 
        name, 
        description, 
        isFallback: ad.isFallback,
        file: file || undefined,
        durationSeconds: isImageContent ? durationSeconds : undefined
      });
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

  const isImage = ad.type === 'Image' || (file && file.type.startsWith('image/'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 1. Backdrop (الخلفية المضببة التفاعلية) */}
      <div
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${
          isLightTheme ? "bg-slate-900/30" : "bg-slate-950/80"
        }`}
        onClick={onClose}
      />

      {/* 2. Modal Body (الحاوية الزجاجية وتدرج الإضاءة) */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl animate-scale-in overflow-hidden border ${
          isLightTheme ? "border-white/70" : "border-slate-800"
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
          className={`flex-shrink-0 px-8 py-6 border-b ${
            isLightTheme ? "border-white/60" : "border-slate-800/60"
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
                  تعديل بيانات الإعلان
                </span>
              </h2>
              <p className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                تعديل الاسم والوصف وتفاصيل العرض للإعلان المحدد
              </p>
            </div>

            {/* 4. Close Button (زر الإغلاق المودرن - تفاعلي تماماً وبدون دوران) */}
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group border ${
                isLightTheme
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
                className={`w-5 h-5 transition-colors ${
                  isLightTheme
                    ? "text-slate-500 group-hover:text-rose-500"
                    : "text-slate-400 group-hover:text-red-400"
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

          {/* Current Media Preview Card */}
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 relative overflow-hidden group ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isLightTheme ? "bg-indigo-100/30" : "bg-indigo-500/5"}`} />

          {/* Thumbnail / Media Visual */}
          <div className={`w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-slate-950 border border-slate-800"}`}>
            {preview ? (
              file?.type.startsWith('image/') ? (
                <img
                  src={preview}
                  alt="معاينة جديدة"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center ${isLightTheme ? "bg-purple-100 text-purple-600" : "bg-purple-500/10 text-purple-400"}`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-wider mt-1">VIDEO</span>
                </div>
              )
            ) : ad.url && ad.type === "Image" ? (
              <img
                src={ad.url}
                alt={ad.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center ${isLightTheme ? "bg-purple-100 text-purple-600" : "bg-purple-500/10 text-purple-400"}`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-[9px] font-bold tracking-wider mt-1">VIDEO</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border mb-2 ${ad.type === "Image"
                ? isLightTheme
                  ? "bg-indigo-100 border-indigo-200 text-indigo-600"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                : isLightTheme
                  ? "bg-purple-100 border-purple-200 text-purple-600"
                  : "bg-purple-500/10 border-purple-500/20 text-purple-400"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ad.type === "Image" ? (isLightTheme ? "bg-indigo-500" : "bg-indigo-400") : (isLightTheme ? "bg-purple-500" : "bg-purple-400")}`} />
              {ad.type === "Image" ? "ملف صورة" : "ملف فيديو"}
            </span>

            <div className={`grid grid-cols-2 gap-y-1 gap-x-4 text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
              <div className={`${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>الأبعاد: <span className={`font-mono ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{ad.resolution || "—"}</span></div>
              <div className={`${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>الحجم: <span className={`font-mono ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{formatSize(ad.fileSizeMb)}</span></div>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-5 p-3.5 rounded-2xl border text-sm flex items-center gap-2 ${isLightTheme ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              اسم الإعلان
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= NAME_MAX_LENGTH) {
                  setName(value);
                  setFieldErrors(prev => ({ ...prev, name: "" }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 shadow-inner focus:outline-none focus:ring-2 ${fieldErrors.name ? 'ring-2 ring-red-500 border-red-500' : ''} ${
                isLightTheme
                  ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/50 focus:border-indigo-500"
                  : "bg-slate-900/60 border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
              }`}
              required
              maxLength={NAME_MAX_LENGTH}
              placeholder="مثال: عسل طبيعي فاخر"
            />
            {/* Character counter */}
            <div className={`text-xs mt-1 text-left ${name.length >= NAME_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              {name.length} / {NAME_MAX_LENGTH}
            </div>
            {fieldErrors.name && (
              <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              الوصف
            </label>
            <textarea
              ref={descriptionInputRef}
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= DESCRIPTION_MAX_LENGTH) {
                  setDescription(value);
                  setFieldErrors(prev => ({ ...prev, description: "" }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none shadow-inner focus:outline-none focus:ring-2 ${fieldErrors.description ? 'ring-2 ring-red-500 border-red-500' : ''} ${
                isLightTheme
                  ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/50 focus:border-indigo-500"
                  : "bg-slate-900/60 border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
              }`}
              rows={3}
              required
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="اكتب تفاصيل عروضك، مثل عسل للبيع مع شحن سريع..."
            />
            {/* Character counter */}
            <div className={`text-xs mt-1 text-left ${description.length >= DESCRIPTION_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              {description.length} / {DESCRIPTION_MAX_LENGTH}
            </div>
            {fieldErrors.description && (
              <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.description}</p>
            )}
          </div>

          {/* Duration for Images */}
          {isImage && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                مدة عرض الصورة (بالثواني)
              </label>
              <div className="grid grid-cols-5 gap-3">
                <input
                  ref={durationInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 shadow-inner focus:outline-none focus:ring-2 text-center ${fieldErrors.duration ? 'ring-2 ring-red-500 border-red-500' : ''} ${
                    isLightTheme
                      ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/50 focus:border-indigo-500"
                      : "bg-slate-900/60 border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
                  }`}
                  value={durationSeconds}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 1;
                    setDurationSeconds(Math.max(1, numValue));
                    setFieldErrors(prev => ({ ...prev, duration: "" }));
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      setDurationSeconds(10);
                    }
                  }}
                  placeholder="01"
                  dir="ltr"
                  lang="en"
                  required
                />
                {[10, 20, 30, 60].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => {
                      setDurationSeconds(seconds);
                      setFieldErrors(prev => ({ ...prev, duration: "" }));
                    }}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                      durationSeconds === seconds
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                        : isLightTheme
                          ? "border-transparent bg-slate-100 text-slate-600 hover:border-indigo-500/30"
                          : "border-transparent bg-slate-900/60 text-slate-400 hover:border-indigo-500/30"
                    }`}
                    style={{ direction: "ltr" }}
                  >
                    <span style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>{seconds}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.duration && (
                <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.duration}</p>
              )}
            </div>
          )}

          {/* File Upload Section */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              تغيير الملف (اختياري)
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
                isDragging 
                  ? "border-indigo-500 bg-indigo-500/10" 
                  : fieldErrors.file
                    ? "border-red-500"
                    : isLightTheme
                      ? "border-slate-200 hover:border-indigo-300 bg-slate-50"
                      : "border-slate-700 hover:border-indigo-500/50 bg-slate-900/40"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0])
                  handleFileChange(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />
              <div className="space-y-3 text-center">
                <div
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                    isLightTheme 
                      ? "bg-indigo-100 border border-indigo-200" 
                      : "bg-indigo-500/10 border border-indigo-500/20"
                  }`}
                >
                  <svg
                    className={`w-7 h-7 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className={`font-medium text-sm ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                  {file ? file.name : "اسحب الملف هنا أو انقر للاختيار"}
                </p>
                <p className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                  JPG · PNG · GIF · WebP · MP4 · WebM · MOV — حتى 100MB
                </p>
              </div>
            </div>
          </div>

          {/* New File Preview */}
          {preview && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                معاينة الملف الجديد
              </label>
              <div
                className={`rounded-2xl overflow-hidden ${
                  isLightTheme 
                    ? "bg-slate-100 border border-slate-200" 
                    : "bg-slate-900/60 border border-slate-800"
                }`}
              >
                {file?.type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt="معاينة"
                    className="max-h-64 w-full object-contain"
                  />
                ) : (
                  <video src={preview} controls className="max-h-64 w-full" />
                )}
              </div>
            </div>
          )}

          {/* Buttons Footer */}
          <div className={`flex items-center gap-3 pt-5 border-t ${isLightTheme ? "border-slate-200" : "border-slate-800/60"}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] select-none text-center ${
                isLightTheme
                  ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                  : "bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-700 text-slate-300 hover:text-slate-100"
              }`}
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
    </div>
  );
}
