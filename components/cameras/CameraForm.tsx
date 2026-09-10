"use client";

import { useState, useEffect, useRef } from "react";
import { localCameraHandler } from "@/lib/cameras/streaming/localCamera";
import { useTheme } from "@/lib/context/ThemeContext";
import type { CameraSourceType } from "@/lib/api/camera.api";

interface CameraFormProps {
  camera?: {
    id: string;
    name: string;
    location: string;
    source: string;
    timeToScreenshot?: number;
    sourceType?: string;
    rtspConfig?: {
      rtspUrl: string;
    };
  };
  usedWebcamDeviceIds?: string[];
  onSubmit: (data: {
    name: string;
    location: string;
    cameraDeviceName: string;
    cameraDeviceRealName?: string;
    timeToScreenshot: number;
    sourceType: string;
  }) => Promise<void>;
  onCancel: () => void;
}

type SourceType = "USB" | "RTSP" | "HLS" | "HTTP";

function detectSourceType(sourceType?: string, source?: string): SourceType {
  if (sourceType) {
    const normalized = sourceType.toUpperCase();
    if (normalized === "USB") return "USB";
    if (normalized === "RTSP") return "RTSP";
    if (normalized === "HLS") return "HLS";
    if (normalized === "HTTP") return "HTTP";
  }

  // Fallback: derive from source URL
  const s = (source || "").toLowerCase();
  if (s.startsWith("rtsp:")) return "RTSP";
  if (s.endsWith(".m3u8") || s.includes("m3u8") || s.includes("/hls")) return "HLS";
  if (s.startsWith("http:") || s.startsWith("https:")) return "HTTP";
  return "USB";
}

function urlPlaceholder(type: SourceType): string {
  switch (type) {
    case "HLS":
      return "مثال: https://example.com/live/stream.m3u8";
    case "RTSP":
      return "مثال: rtsp://admin:password@192.168.1.10:554/h264.sdp";
    case "HTTP":
      return "مثال: http://192.168.1.20/mjpeg";
    default:
      return "";
  }
}

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
    detectSourceType(camera?.sourceType, camera?.source)
  );
  const [cameraDeviceName, setCameraDeviceName] = useState("");
  const [cameraDeviceRealName, setCameraDeviceRealName] = useState("");
  const [timeToScreenshot] = useState<number>(camera?.timeToScreenshot || 10);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const rtspUrlRef = useRef<HTMLInputElement>(null);

  const FIELD_MAX_LENGTH = 40;

  // Load webcam devices when USB is selected
  useEffect(() => {
    async function loadDevices() {
      try {
        setLoadingDevices(true);
        if (sourceType === "USB") {
          const availableDevices = await localCameraHandler.getDevices();
          setDevices(availableDevices);
        } else {
          setDevices([]);
        }
      } catch (err) {
        console.error('Failed to load webcam devices:', err);
      } finally {
        setLoadingDevices(false);
      }
    }
    loadDevices();
  }, [sourceType]);

  // Initialize camera data when editing
  useEffect(() => {
    if (camera) {
      if (sourceType === "RTSP" && camera.rtspConfig?.rtspUrl) {
        setCameraDeviceName(camera.rtspConfig.rtspUrl);
      } else if (sourceType === "USB") {
        // Will be selected from dropdown
        setCameraDeviceName("");
      } else {
        setCameraDeviceName(camera.source || "");
      }
    }
  }, [camera, sourceType]);

  const scrollToField = (ref: React.RefObject<HTMLElement | null>, fieldName: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setFieldErrors(prev => ({ ...prev, [fieldName]: "هذا الحقل مطلوب" }));
  };

  const validateRtspUrl = (url: string): boolean => {
    if (!url.startsWith('rtsp://')) {
      setError('يجب أن يبدأ رابط RTSP بـ rtsp://');
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      setError('رابط RTSP غير صالح');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    console.log('[CameraForm] ===== بدء عملية إضافة/تعديل الكاميرا =====');
    console.log('[CameraForm] نوع المصدر المحدد:', sourceType);
    console.log('[CameraForm] اسم الكاميرا:', name.trim());
    console.log('[CameraForm] الموقع:', location.trim());

    // Validate required fields
    if (!name.trim()) {
      console.error('[CameraForm] خطأ: اسم الكاميرا مطلوب');
      scrollToField(nameInputRef, 'name');
      return;
    }
    if (!location.trim()) {
      console.error('[CameraForm] خطأ: الموقع مطلوب');
      scrollToField(locationInputRef, 'location');
      return;
    }

    // Validate source-specific fields
    if (sourceType === "USB") {
      console.log('[CameraForm] التحقق من كاميرا USB...');
      console.log('[CameraForm] عدد الأجهزة المتاحة:', devices.length);
      console.log('[CameraForm] الجهاز المحدد:', cameraDeviceName);

      if (devices.length > 0 && !cameraDeviceName.trim()) {
        console.error('[CameraForm] خطأ: لم يتم اختيار كاميرا ويب');
        setError("الرجاء اختيار كاميرا الويب");
        return;
      }

      // Check if webcam is already used
      if (cameraDeviceName.trim()) {
        const usedByOthers = new Set(
          usedWebcamDeviceIds.filter((id) => !!id && id !== camera?.source)
        );
        if (usedByOthers.has(cameraDeviceName.trim())) {
          console.error('[CameraForm] خطأ: الكاميرا مستخدمة بالفعل');
          setError("هذه الكاميرا مستخدمة بالفعل في كاميرا أخرى");
          return;
        }
      }
    } else {
      // For network cameras (RTSP, HLS, HTTP)
      console.log('[CameraForm] التحقق من كاميرا شبكية (' + sourceType + ')...');
      console.log('[CameraForm] رابط البث:', cameraDeviceName.trim());

      if (!cameraDeviceName.trim()) {
        console.error('[CameraForm] خطأ: رابط البث مطلوب');
        setError("رابط البث مطلوب");
        scrollToField(rtspUrlRef, 'url');
        return;
      }

      // Validate RTSP URL
      if (sourceType === "RTSP") {
        console.log('[CameraForm] التحقق من صحة رابط RTSP...');
        if (!validateRtspUrl(cameraDeviceName.trim())) {
          console.error('[CameraForm] خطأ: رابط RTSP غير صالح');
          scrollToField(rtspUrlRef, 'url');
          return;
        }
        console.log('[CameraForm] ✓ رابط RTSP صالح');
      }
    }

    const submitData = {
      name: name.trim(),
      location: location.trim(),
      cameraDeviceName: cameraDeviceName.trim(),
      cameraDeviceRealName: cameraDeviceRealName.trim() || undefined,
      timeToScreenshot: 10,
      sourceType: sourceType,
    };

    console.log('[CameraForm] البيانات التي سيتم إرسالها:', JSON.stringify(submitData, null, 2));

    try {
      setLoading(true);
      console.log('[CameraForm] جاري إرسال البيانات إلى الخادم...');
      const result = await onSubmit(submitData);
      console.log('[CameraForm] ✓ تم حفظ الكاميرا بنجاح');
      console.log('[CameraForm] النتيجة من الخادم:', result);
    } catch (err) {
      console.error('[CameraForm] ✗ فشل حفظ الكاميرا:', err);
      console.error('[CameraForm] تفاصيل الخطأ:', err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : "فشل حفظ الكاميرا");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = `block text-xs font-bold mb-2 uppercase tracking-wider text-right ${
    isLightTheme ? "text-slate-500" : "text-slate-400"
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
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= FIELD_MAX_LENGTH) {
              setName(value);
              setFieldErrors(prev => ({ ...prev, name: "" }));
            }
          }}
          placeholder="مثال: كاميرا المدخل الرئيسي"
          className={`${inputClass} ${fieldErrors.name ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          maxLength={FIELD_MAX_LENGTH}
          required
        />
        {fieldErrors.name && (
          <p className="text-red-500 text-xs mt-1 animate-fade-in text-right">{fieldErrors.name}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>الموقع الجغرافي *</label>
        <input
          ref={locationInputRef}
          type="text"
          value={location}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= FIELD_MAX_LENGTH) {
              setLocation(value);
              setFieldErrors(prev => ({ ...prev, location: "" }));
            }
          }}
          placeholder="مثال: الطابق الأول - قسم الخدمة"
          className={`${inputClass} ${fieldErrors.location ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          maxLength={FIELD_MAX_LENGTH}
          required
        />
        {fieldErrors.location && (
          <p className="text-red-500 text-xs mt-1 animate-fade-in text-right">{fieldErrors.location}</p>
        )}
      </div>

      {/* Source Type */}
      <div>
        <label className={labelClass}>نوع المصدر *</label>
        <div className="relative mb-3">
          <select
            value={sourceType}
            onChange={(e) => {
              const v = e.target.value as SourceType;
              setSourceType(v);
              setCameraDeviceName("");
              setCameraDeviceRealName("");
            }}
            className={selectClass}
          >
            <option value="USB" className={lightOptionClass}>
              كاميرا محلية (Webcam)
            </option>
            <option value="RTSP" className={lightOptionClass}>
              كاميرا  (RTSP)
            </option>
            <option value="HLS" className={lightOptionClass}>
              HLS Stream
            </option>
            <option value="HTTP" className={lightOptionClass}>
              HTTP/MJPEG Stream
            </option>
          </select>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Source-specific input */}
        <div>
          <label className={labelClass}>
            {sourceType === "USB" ? "اختيار كاميرا الويب *" : "رابط البث *"}
          </label>

          {sourceType === "USB" ? (
            <div className="relative">
              <select
                value={cameraDeviceName}
                onChange={(e) => {
                  const deviceId = e.target.value;
                  setCameraDeviceName(deviceId);
                  const selectedDevice = devices.find(d => d.deviceId === deviceId);
                  setCameraDeviceRealName(selectedDevice?.label || "");
                }}
                disabled={loadingDevices}
                className={`${selectClass} ${!cameraDeviceName.trim() && devices.length > 0 ? "border-red-500" : ""}`}
              >
                <option value="" disabled className={lightOptionClass}>
                  {loadingDevices ? "جاري تحميل الكاميرات..." : "اختر كاميرا"}
                </option>
                {devices.map((d, idx) => (
                  <option key={d.deviceId} value={d.deviceId} className={lightOptionClass}>
                    {d.label || `كاميرا ${idx + 1} (${d.deviceId.slice(0, 8)}...)`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ) : (
            <>
              <input
                ref={rtspUrlRef}
                type="text"
                value={cameraDeviceName}
                onChange={(e) => setCameraDeviceName(e.target.value)}
                placeholder={urlPlaceholder(sourceType)}
                className={inputClass}
                required
              />
              {sourceType === "RTSP" && (
                <p className="text-xs mt-2 text-slate-500 text-right">
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={`p-3 rounded-xl text-sm animate-fade-in text-right border ${
          isLightTheme
            ? "bg-rose-50 border-rose-200 text-rose-500"
            : "bg-[rgba(239,68,68,0.1)] border-rose-500/30 text-rose-300"
        }`}>
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || (sourceType === "USB" && !cameraDeviceName.trim() && devices.length > 0)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md"
        >
          {loading ? "جاري الحفظ..." : camera ? "تحديث الكاميرا" : "إضافة الكاميرا"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
            isLightTheme
              ? "bg-white/85 border-white/60 text-slate-500 hover:text-slate-700"
              : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
          }`}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
