"use client";

import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("الرجاء إدخال اسم الإعلان");
      return;
    }
    if (!file && !initialData) {
      setError("الرجاء اختيار ملف");
      return;
    }
    if (!fileType) {
      setError("الرجاء اختيار نوع الملف");
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
    color: "var(--text-secondary)",
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
          className="input-dark"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: عرض الصيف"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>الوصف</label>
        <textarea
          className="input-dark"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="وصف الإعلان..."
        />
      </div>

      {/* Duration for Images Only */}
      {fileType === 'Image' && file && (
        <div>
          <label style={labelStyle}>مدة عرض الصورة (بالثواني)</label>
          <div className="grid grid-cols-5 gap-3">
            {/* Input field first */}
            <input
              type="number"
              className="input-dark"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Math.max(1, parseInt(e.target.value) || 10))}
              min="1"
              placeholder="مخصص"
              dir="ltr"
              lang="en"
              inputMode="numeric"
              style={{
                MozAppearance: "textfield",
                WebkitAppearance: "none",
                appearance: "none",
                fontVariantNumeric: "lining-nums",
                unicodeBidi: "embed",
              }}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {/* Preset buttons */}
            {[10, 20, 30, 60].map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => setDurationSeconds(seconds)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                  durationSeconds === seconds
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                    : "border-transparent hover:border-indigo-500/30"
                }`}
                style={{
                  background: durationSeconds === seconds ? undefined : "var(--bg-secondary)",
                  color: durationSeconds === seconds ? undefined : "var(--text-secondary)",
                  direction: "ltr",
                }}
              >
                <span style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>{seconds}</span>
              </button>
            ))}
          </div>
          <style jsx>{`
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              font-variant-numeric: lining-nums;
              -moz-font-feature-settings: "lnum" 1;
              -webkit-font-feature-settings: "lnum" 1;
              font-feature-settings: "lnum" 1;
            }
          `}</style>
        </div>
      )}

      {/* Drop zone */}
      <div>
        <label style={labelStyle}>الملف</label>
        <div
          className={`drop-zone cursor-pointer ${isDragging ? "dragging" : ""}`}
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
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <svg
                className="w-7 h-7"
                style={{ color: "#818cf8" }}
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
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              {file ? file.name : "اسحب الملف هنا أو انقر للاختيار"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              JPG · PNG · GIF · WebP · MP4 · WebM · MOV — حتى 100MB
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <label style={labelStyle}>معاينة</label>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
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
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
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
