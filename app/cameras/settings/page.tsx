"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cameraStorage } from "@/lib/cameras/storage/cameraStorage";
import { DEFAULT_MOTION_DETECTION_SETTINGS } from "@/lib/services/motionDetection";
import { DEFAULT_PERSON_DETECTION_SETTINGS } from "@/lib/services/personDetection";
import {
  DEFAULT_CAPTURE_COOLDOWN_SECONDS,
  DEFAULT_CAPTURE_FULL_FRAME,
  DEFAULT_SHOW_PERSON_DETECTION_DEBUG,
  DEFAULT_SHOW_MOTION_DETECTION_DEBUG,
} from "@/lib/services/screenshotRegion";
import type { CameraSettings } from "@/lib/types/camera";

export default function CameraSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CameraSettings>({
    autoReconnect: true,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    streamQuality: "medium",
    motionDetection: { ...DEFAULT_MOTION_DETECTION_SETTINGS },
    captureFullFrame: DEFAULT_CAPTURE_FULL_FRAME,
    detectionMode: "motion",
    captureCooldownSeconds: DEFAULT_CAPTURE_COOLDOWN_SECONDS,
    showPersonDetectionDebug: DEFAULT_SHOW_PERSON_DETECTION_DEBUG,
    showMotionDetectionDebug: DEFAULT_SHOW_MOTION_DETECTION_DEBUG,
    personDetection: { ...DEFAULT_PERSON_DETECTION_SETTINGS },
    lastUpdate: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    cameraStorage.getSettings()
      .then((savedSettings) => {
        if (!cancelled) setSettings(savedSettings);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updatedSettings = { ...settings, lastUpdate: new Date() };
      await cameraStorage.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "فشل حفظ الإعدادات",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/cameras")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">معايرة الكاميرات</h1>
            <p className="text-gray-400 mt-1">
              ضبط حساسية الحركة وتقليل التنبيهات الخاطئة
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-gray-800 rounded-lg p-6">
          <div>
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  {settings.detectionMode === "motion" && (
                    <h2 className="text-xl font-bold text-white">
                      معايرة اكتشاف الحركة
                    </h2>
                  )}
                  <p className="mt-1 text-sm text-gray-400">
                    القيم المحفوظة تطبق عند فتح الكاميرا أو إعادة تشغيلها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    motionDetection: { ...DEFAULT_MOTION_DETECTION_SETTINGS },
                    captureFullFrame: DEFAULT_CAPTURE_FULL_FRAME,
                    detectionMode: "motion",
                    captureCooldownSeconds: DEFAULT_CAPTURE_COOLDOWN_SECONDS,
                    showPersonDetectionDebug: DEFAULT_SHOW_PERSON_DETECTION_DEBUG,
                    showMotionDetectionDebug: DEFAULT_SHOW_MOTION_DETECTION_DEBUG,
                    personDetection: { ...DEFAULT_PERSON_DETECTION_SETTINGS },
                  })}
                  className="shrink-0 rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
                >
                  استعادة الافتراضي
                </button>
              </div>

              <div className="space-y-6">
                <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-700 pb-6">
                  <span>
                    <span className="block font-medium text-white">كشف الأشخاص داخل المنطقة</span>
                    <span className="mt-1 block text-sm text-gray-400">
                      {settings.detectionMode === "person" ? "الوضع الحالي: كشف الأشخاص" : "الوضع الحالي: التقاط عند الحركة"}
                    </span>
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.detectionMode === "person"}
                      onChange={(event) => setSettings({ ...settings, detectionMode: event.target.checked ? "person" : "motion" })}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400" />
                    <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-700 pb-6">
                  <span>
                    <span className="block font-medium text-white">التقاط صورة الكاميرا كاملة</span>
                    <span className="mt-1 block text-sm text-gray-400">
                      عند إيقافه ترسل صورة المنطقة المحددة فقط؛ يبقى الكشف داخل المنطقة في الحالتين
                    </span>
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.captureFullFrame}
                      onChange={(event) => setSettings({
                        ...settings,
                        captureFullFrame: event.target.checked,
                      })}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-800" />
                    <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
                {settings.detectionMode === "person" && (
                <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-700 pb-6">
                  <span>
                    <span className="block font-medium text-white">إظهار مربعات الأشخاص للتصحيح</span>
                    <span className="mt-1 block text-sm text-gray-400">
                      عرض حدود الشخص المكتشف فوق صورة الكاميرا
                    </span>
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.showPersonDetectionDebug}
                      onChange={(event) => setSettings({ ...settings, showPersonDetectionDebug: event.target.checked })}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400" />
                    <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
                )}
                {settings.detectionMode === "motion" && (
                <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-700 pb-6">
                  <span>
                    <span className="block font-medium text-white">إظهار معلومات الحركة للتصحيح</span>
                    <span className="mt-1 block text-sm text-gray-400">
                      عرض نسبة الحركة وحالة الكشف فوق صورة الكاميرا
                    </span>
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.showMotionDetectionDebug}
                      onChange={(event) => setSettings({ ...settings, showMotionDetectionDebug: event.target.checked })}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400" />
                    <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
                )}
                <div className="border-b border-gray-700 pb-6">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label htmlFor="capture-cooldown" className="font-medium text-white">
                      مدة الانتظار بين اللقطات (بالثواني)
                    </label>
                    <output htmlFor="capture-cooldown" className="min-w-16 text-left font-mono text-emerald-400">
                      {settings.captureCooldownSeconds}s
                    </output>
                  </div>
                  <input
                    id="capture-cooldown"
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={settings.captureCooldownSeconds}
                    onChange={(event) => setSettings({
                      ...settings,
                      captureCooldownSeconds: Number(event.target.value),
                    })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                {settings.detectionMode === "person" && (
                  <div className="space-y-6 border-b border-gray-700 pb-6">
                    <h3 className="text-lg font-semibold text-white">معايرة كشف الأشخاص</h3>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-confidence" className="font-medium text-white">الحد الأدنى للثقة</label>
                        <output htmlFor="person-confidence" className="font-mono text-emerald-400">{(settings.personDetection.minimumConfidence * 100).toFixed(0)}%</output>
                      </div>
                      <input id="person-confidence" type="range" min="30" max="95" step="5" value={settings.personDetection.minimumConfidence * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, minimumConfidence: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-min-size" className="font-medium text-white">أصغر حجم للشخص</label>
                        <output htmlFor="person-min-size" className="font-mono text-emerald-400">{(settings.personDetection.minimumBoxAreaRatio * 100).toFixed(2)}%</output>
                      </div>
                      <input id="person-min-size" type="range" min="0.05" max="20" step="0.05" value={settings.personDetection.minimumBoxAreaRatio * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, minimumBoxAreaRatio: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-max-size" className="font-medium text-white">أكبر حجم للشخص</label>
                        <output htmlFor="person-max-size" className="font-mono text-emerald-400">{(settings.personDetection.maximumBoxAreaRatio * 100).toFixed(0)}%</output>
                      </div>
                      <input id="person-max-size" type="range" min="20" max="99" step="1" value={settings.personDetection.maximumBoxAreaRatio * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, maximumBoxAreaRatio: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-confirmation" className="font-medium text-white">إطارات تأكيد الشخص</label>
                        <output htmlFor="person-confirmation" className="font-mono text-emerald-400">{settings.personDetection.positiveVotesRequired}</output>
                      </div>
                      <input id="person-confirmation" type="range" min="1" max="7" step="1" value={settings.personDetection.positiveVotesRequired} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, positiveVotesRequired: Number(event.target.value) } })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-disappearance" className="font-medium text-white">إطارات اختفاء الشخص</label>
                        <output htmlFor="person-disappearance" className="font-mono text-emerald-400">{settings.personDetection.zeroVotesRequired}</output>
                      </div>
                      <input id="person-disappearance" type="range" min="1" max="15" step="1" value={settings.personDetection.zeroVotesRequired} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, zeroVotesRequired: Number(event.target.value) } })} className="w-full accent-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="person-interval" className="font-medium text-white">الفاصل بين عمليات الكشف (مللي ثانية)</label>
                        <output htmlFor="person-interval" className="font-mono text-emerald-400">{settings.personDetection.detectionIntervalMs}</output>
                      </div>
                      <input id="person-interval" type="range" min="50" max="1000" step="50" value={settings.personDetection.detectionIntervalMs} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, detectionIntervalMs: Number(event.target.value) } })} className="w-full accent-emerald-500" />
                    </div>
                  </div>
                )}
                {settings.detectionMode === "motion" && (
                  <>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="motion-area" className="font-medium text-white">
                          الحد الأدنى لمساحة الحركة
                        </label>
                        <output htmlFor="motion-area" className="min-w-16 text-left font-mono text-emerald-400">
                          {(settings.motionDetection.motionRatioThreshold * 100).toFixed(1)}%
                        </output>
                      </div>
                      <input
                        id="motion-area"
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={settings.motionDetection.motionRatioThreshold * 100}
                        onChange={(event) => setSettings({
                          ...settings,
                          motionDetection: {
                            ...settings.motionDetection,
                            motionRatioThreshold: Number(event.target.value) / 100,
                          },
                        })}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="pixel-difference" className="font-medium text-white">
                          قوة تغير البكسل
                        </label>
                        <output htmlFor="pixel-difference" className="min-w-16 text-left font-mono text-emerald-400">
                          {settings.motionDetection.pixelDifferenceThreshold}
                        </output>
                      </div>
                      <input
                        id="pixel-difference"
                        type="range"
                        min="10"
                        max="100"
                        step="1"
                        value={settings.motionDetection.pixelDifferenceThreshold}
                        onChange={(event) => setSettings({
                          ...settings,
                          motionDetection: {
                            ...settings.motionDetection,
                            pixelDifferenceThreshold: Number(event.target.value),
                          },
                        })}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label htmlFor="movement-density" className="font-medium text-white">
                          كثافة الحركة داخل المنطقة
                        </label>
                        <output htmlFor="movement-density" className="min-w-16 text-left font-mono text-emerald-400">
                          {(settings.motionDetection.minimumBlockChangedRatio * 100).toFixed(0)}%
                        </output>
                      </div>
                      <input
                        id="movement-density"
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={settings.motionDetection.minimumBlockChangedRatio * 100}
                        onChange={(event) => setSettings({
                          ...settings,
                          motionDetection: {
                            ...settings.motionDetection,
                            minimumBlockChangedRatio: Number(event.target.value) / 100,
                          },
                        })}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${message.type === "success"
                  ? "bg-green-900 text-green-200"
                  : "bg-red-900 text-red-200"
                }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/cameras")}
              disabled={saving}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
