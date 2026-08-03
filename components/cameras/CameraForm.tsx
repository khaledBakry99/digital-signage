"use client";

import { useState, useEffect } from "react";
import { localCameraHandler } from "@/lib/cameras/streaming/localCamera";
import { useTheme } from "@/lib/context/ThemeContext";
import { cameraApi } from "@/lib/api/camera.api";

interface CameraFormProps {
  camera?: {
    id: string;
    name: string;
    location: string;
    source: string; // represent cameraDeviceName
    timeToScreenshot?: number;
  };
  usedWebcamDeviceIds?: string[];
  onSubmit: (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    timeToScreenshot: number;
  }) => Promise<void>;
  onCancel: () => void;
}

type SourceType = "webcam" | "hls" | "rtsp" | "http";

function detectSourceType(source?: string): SourceType {
  const s = (source || "").toLowerCase();
  if (s.startsWith("rtsp:")) return "rtsp";
  if (s.endsWith(".m3u8") || s.includes("m3u8") || s.includes("/hls"))
    return "hls";
  if (s.startsWith("http:") || s.startsWith("https:")) return "http";
  return "webcam";
}

function urlPlaceholder(type: SourceType): string {
  switch (type) {
    case "hls":
      return "مثال: https://example.com/live/stream.m3u8";
    case "rtsp":
      return "مثال: rtsp://user:pass@192.168.1.10:554/stream";
    case "http":
      return "مثال: http://192.168.1.20/mjpeg";
    default:
      return "";
  }
}

const PRESETS = [
  { value: 5, label: "5 ثوانٍ", desc: "استجابة فائقة السرعة" },
  { value: 10, label: "10 ثوانٍ", desc: "المعدل الافتراضي الموصى به" },
  { value: 30, label: "30 ثانية", desc: "تحليل متوازن مستمر" },
  { value: 60, label: "60 ثانية", desc: "توفير موارد البث" },
];

export function CameraForm({
  camera,
  usedWebcamDeviceIds = [],
  onSubmit,
  onCancel,
}: CameraFormProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [name, setName] = useState(camera?.name || "");
  const [location, setLocation] = useState(camera?.location || "");
  const [sourceType, setSourceType] = useState<SourceType>(
    detectSourceType(camera?.source),
  );
  const [cameraDeviceName, setCameraDeviceName] = useState(
    camera ? "" : "", // Always empty initially, even for editing
  );
  const [timeToScreenshot, setTimeToScreenshot] = useState<number>(
    camera?.timeToScreenshot || 10,
  );
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    async function loadDevices() {
      try {
        setLoadingDevices(true);
        if (sourceType === "webcam") {
          const availableDevices = await localCameraHandler.getDevices();
          setDevices(availableDevices);
        } else {
          setDevices([]);
        }
      } catch (err) {
      } finally {
        setLoadingDevices(false);
      }
    }
    loadDevices();
  }, [sourceType]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("اسم الكاميرا مطلوب");
      return;
    }
    if (!location.trim()) {
      setError("موقع الكاميرا مطلوب");
      return;
    }
    // For non-webcam sources, cameraDeviceName is required
    if (sourceType !== "webcam" && !cameraDeviceName.trim()) {
      setError("رابط البث مطلوب");
      return;
    }

    if (sourceType === "webcam" && devices.length > 0 && !cameraDeviceName.trim()) {
      setError("الرجاء اختيار كاميرا الويب");
      return;
    }

    if (sourceType === "webcam" && cameraDeviceName.trim()) {
      const usedByOthers = new Set(
        usedWebcamDeviceIds.filter((id) => !!id && id !== camera?.source),
      );
      if (usedByOthers.has(cameraDeviceName.trim())) {
        setError("هذه الكاميرا مستخدمة بالفعل في كاميرا أخرى داخل التطبيق");
        return;
      }
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        location: location.trim(),
        cameraDeviceName: cameraDeviceName.trim() || "", // Allow empty for webcam (will use default)
        timeToScreenshot: Number(timeToScreenshot) || 10,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حفظ الكاميرا");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = `block text-xs font-bold mb-2 uppercase tracking-wider text-right ${isLightTheme ? "text-slate-500" : "text-slate-400"
    }`;
  const baseFieldClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-right";
  const inputClass = isLightTheme
    ? `${baseFieldClass} bg-white/90 border border-white/70 text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.08)] focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100`
    : `${baseFieldClass} bg-slate-950/50 border border-white/10 text-slate-100 focus:border-indigo-500/50 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]`;
  const selectClass = `${inputClass} pr-4 pl-10 appearance-none cursor-pointer`;
  const lightOptionClass = isLightTheme ? "bg-white text-slate-700" : "bg-slate-900 text-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Camera Name */}
      <div>
        <label className={labelClass}>اسم الكاميرا *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: كاميرا المدخل الرئيسي"
          className={inputClass}
          maxLength={50}
          required
        />
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>الموقع الجغرافي / الوصف *</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="مثال: الطابق الأول - قسم الخدمة"
          className={inputClass}
          maxLength={100}
          required
        />
      </div>

      {/* Source Type + Device/URL */}
      <div>
        <label className={labelClass}>نوع المصدر</label>
        <div className="relative mb-3">
          <select
            value={sourceType}
            onChange={(e) => {
              const v = e.target.value as SourceType;
              setSourceType(v);
              if (v !== "webcam") {
                setCameraDeviceName("");
              } else {
                setCameraDeviceName("");
              }
            }}
            className={selectClass}
          >
            <option value="webcam" className={lightOptionClass}>
              كاميرا محلية (Webcam)
            </option>
            <option value="hls" className={lightOptionClass}>
              HLS Stream
            </option>
            <option value="rtsp" className={lightOptionClass}>
              RTSP Stream
            </option>
            <option value="http" className={lightOptionClass}>
              HTTP/MJPEG Stream
            </option>
          </select>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Conditional: Stream URL */}
        <div>
          <label className={labelClass}>
            {sourceType === "webcam"
              ? "اختيار كاميرا الويب"
              : "رابط البث *"}
          </label>
          {sourceType === "webcam" ? (
            <div className="relative">
              <select
                value={cameraDeviceName}
                onChange={(e) => setCameraDeviceName(e.target.value)}
                disabled={loadingDevices}
                className={`${selectClass} ${!cameraDeviceName.trim() && devices.length > 0 ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
              >
                <option value="" disabled className={lightOptionClass}>
                  {loadingDevices ? "جاري تحميل الكاميرات..." : "اختر كاميرا"}
                </option>
                {devices.map((d, idx) => (
                  <option
                    key={d.deviceId}
                    value={d.deviceId}
                    className={lightOptionClass}
                  >
                    {d.label || `كاميرا ${idx + 1}`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <input
              type="url"
              value={cameraDeviceName}
              onChange={(e) => setCameraDeviceName(e.target.value)}
              placeholder={urlPlaceholder(sourceType)}
              className={inputClass}
              required
            />
          )}
        </div>
      </div>


      {error && (
        <div
          className={`p-3 rounded-xl text-sm animate-fade-in text-right border ${isLightTheme ? "bg-rose-50 border-rose-200 text-rose-500" : "bg-[rgba(239,68,68,0.1)] border-rose-500/30 text-rose-300"}`}
        >
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || (sourceType === "webcam" && !cameraDeviceName.trim() && devices.length > 0)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95 bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
        >
          {loading
            ? "جاري الحفظ..."
            : camera
              ? "تحديث الكاميرا"
              : "إضافة الكاميرا"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${isLightTheme ? "bg-white/85 border-white/60 text-slate-500 hover:text-slate-700 hover:shadow-[0_15px_30px_rgba(15,23,42,0.08)]" : "bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-950/60 hover:text-slate-200"}`}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
