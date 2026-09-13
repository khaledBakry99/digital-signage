"use client";

import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface AdFormProps {
  onSubmit: (data: {
    name: string;
    file: File;
    description?: string;
    type: 'Image' | 'Video';
    durationSeconds?: number;
  }) => Promise<void>;
  initialData?: MediaAsset;
  submitLabel?: string;
}

export default function AdForm({
  onSubmit,
  initialData,
  submitLabel = "حفظ الإعلان",
}: AdFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'Image' | 'Video' | null>(
    initialData?.type || null,
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setFileType(isImage ? 'Image' : 'Video');
    setPreview(URL.createObjectURL(selectedFile));
  };

  // Scroll to field and highlight it
  const scrollToField = (ref: React.RefObject<HTMLElement | null>, fieldName: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setFieldErrors(prev => ({ ...prev, [fieldName]: "هذا الحقل مطلوب" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    
    if (!file && !initialData) {
      setFieldErrors(prev => ({ ...prev, file: "الرجاء اختيار ملف" }));
      fileInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    if (!fileType) {
      setError("الرجاء اختيار نوع الملف");
      return;
    }

    // Validate duration for images
    if (fileType === 'Image' && (!durationSeconds || durationSeconds < 1)) {
      scrollToField(durationInputRef, 'duration');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        file: file!,
        description: description.trim() || undefined,
        type: fileType,
        durationSeconds: fileType === 'Image' ? durationSeconds : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    color: isLightTheme ? "#475569" : "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label style={labelStyle}>اسم الإعلان</label>
        <input
          ref={nameInputRef}
          className={`input-dark ${fieldErrors.name ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          style={isLightTheme ? {
            backgroundColor: "#ffffff",
            border: fieldErrors.name ? "1px solid #ef4444" : "1px solid #e2e8f0",
            color: "#0f172a",
          } : undefined}
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= NAME_MAX_LENGTH) {
              setName(value);
              setFieldErrors(prev => ({ ...prev, name: "" }));
            }
          }}
          placeholder="مثال: عرض الصيف"
          required
          maxLength={NAME_MAX_LENGTH}
        />
        {/* Character counter */}
        <div className={`text-xs mt-1 text-left ${name.length >= NAME_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          {name.length} / {NAME_MAX_LENGTH}
        </div>
        {fieldErrors.name && (
          <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>الوصف</label>
        <textarea
          ref={descriptionInputRef}
          className={`input-dark ${fieldErrors.description ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          style={isLightTheme ? {
            backgroundColor: "#ffffff",
            border: fieldErrors.description ? "1px solid #ef4444" : "1px solid #e2e8f0",
            color: "#0f172a",
          } : undefined}
          value={description}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= DESCRIPTION_MAX_LENGTH) {
              setDescription(value);
              setFieldErrors(prev => ({ ...prev, description: "" }));
            }
          }}
          rows={3}
          placeholder="وصف الإعلان..."
          required
          maxLength={DESCRIPTION_MAX_LENGTH}
        />
        {/* Character counter */}
        <div className={`text-xs mt-1 text-left ${description.length >= DESCRIPTION_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          {description.length} / {DESCRIPTION_MAX_LENGTH}
        </div>
        {fieldErrors.description && (
          <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.description}</p>
        )}
      </div>

      {/* Duration for Images Only */}
      {fileType === 'Image' && file && (
        <div>
          <label style={labelStyle}>مدة عرض الصورة (بالثواني)</label>
          <div className="grid grid-cols-5 gap-3">
            {/* Input field first */}
            <input
              ref={durationInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`input-dark text-center ${fieldErrors.duration ? 'ring-2 ring-red-500 border-red-500' : ''}`}
              style={isLightTheme ? {
                backgroundColor: "#ffffff",
                border: fieldErrors.duration ? "1px solid #ef4444" : "1px solid #e2e8f0",
                color: "#0f172a",
              } : undefined}
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
            {/* Preset buttons */}
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
                      ? "border-slate-200 bg-white text-slate-600 hover:border-indigo-500/30"
                      : "border-transparent hover:border-indigo-500/30"
                }`}
                style={{
                  background: durationSeconds === seconds ? undefined : isLightTheme ? "#ffffff" : "var(--bg-secondary)",
                  color: durationSeconds === seconds ? undefined : isLightTheme ? "#475569" : "var(--text-secondary)",
                  direction: "ltr",
                }}
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

      {/* Drop zone */}
      <div>
        <label style={labelStyle}>الملف</label>
        <div
          className={`drop-zone cursor-pointer ${isDragging ? "dragging" : ""} ${fieldErrors.file ? 'ring-2 ring-red-500' : ''}`}
          style={isLightTheme && fieldErrors.file ? {
            border: "2px dashed #ef4444",
          } : undefined}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />
          <div className="space-y-3">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{
                background: isLightTheme ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.1)",
                border: isLightTheme ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <svg
                className="w-7 h-7"
                style={{ color: isLightTheme ? "#6366f1" : "#818cf8" }}
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
            <p className="font-medium" style={{ color: isLightTheme ? "#0f172a" : "var(--text-primary)" }}>
              {file ? file.name : "اسحب الملف هنا أو انقر للاختيار"}
            </p>
            <p className="text-xs" style={{ color: isLightTheme ? "#64748b" : "var(--text-muted)" }}>
              JPG · PNG · GIF · WebP · MP4 · WebM · MOV — حتى 100MB
            </p>
          </div>
        </div>
        {fieldErrors.file && (
          <p className="text-red-500 text-xs mt-2 animate-fade-in">{fieldErrors.file}</p>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <label style={labelStyle}>معاينة</label>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: isLightTheme ? "#f8fafc" : "var(--bg-secondary)",
              border: isLightTheme ? "1px solid #e2e8f0" : "1px solid var(--border)",
            }}
          >
            {fileType === 'Image' ? (
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


      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-xl text-sm animate-fade-in"
          style={{
            background: isLightTheme ? "rgba(254,226,226,0.5)" : "rgba(239,68,68,0.1)",
            border: isLightTheme ? "1px solid #fecaca" : "1px solid rgba(239,68,68,0.2)",
            color: isLightTheme ? "#dc2626" : "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center py-3 cursor-pointer transition-transform active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
