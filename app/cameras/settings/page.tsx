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
import { useTheme } from "@/lib/context/ThemeContext";

export default function CameraSettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
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

  const textPrimary = isLightTheme ? "text-slate-900" : "text-white";
  const textSecondary = isLightTheme ? "text-slate-600" : "text-white/60";
  const textMuted = isLightTheme ? "text-slate-500" : "text-white/40";

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
      <div className="min-h-screen px-6 lg:px-12 py-10 relative overflow-hidden">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          {isLightTheme ? (
            <>
              <div className="absolute -top-[8%] -right-[5%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ background: "rgba(191,219,254,0.55)" }} />
              <div className="absolute top-[30%] -left-[10%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: "rgba(196,181,253,0.45)" }} />
            </>
          ) : (
            <>
              <div className="absolute -top-[5%] -right-[10%] w-[45%] h-[45%] bg-indigo-500/15 blur-[120px] rounded-full" />
              <div className="absolute bottom-[15%] left-[5%] w-[35%] h-[35%] bg-purple-500/15 blur-[120px] rounded-full" />
            </>
          )}
        </div>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 lg:px-12 py-10 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {isLightTheme ? (
          <>
            <div className="absolute -top-[8%] -right-[5%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ background: "rgba(191,219,254,0.55)" }} />
            <div className="absolute top-[30%] -left-[10%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: "rgba(196,181,253,0.45)" }} />
            <div className="absolute bottom-[5%] left-[30%] w-[30%] h-[30%] rounded-full blur-[110px]" style={{ background: "rgba(248,250,252,0.9)" }} />
          </>
        ) : (
          <>
            <div className="absolute -top-[5%] -right-[10%] w-[45%] h-[45%] bg-indigo-500/15 blur-[120px] rounded-full" />
            <div className="absolute bottom-[15%] left-[5%] w-[35%] h-[35%] bg-purple-500/15 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className={`relative mb-10 overflow-hidden rounded-[32px] border animate-fade-in ${isLightTheme
            ? "border-white/70 shadow-[0_35px_95px_rgba(15,23,42,0.08)]"
            : "border-white/5 shadow-[0_25px_75px_rgba(2,6,23,0.65)]"
            }`}
          style={
            isLightTheme
              ? {
                background: "linear-gradient(135deg, rgba(239,246,255,0.96), rgba(223,231,255,0.92))",
                backdropFilter: "blur(30px)",
              }
              : {
                background: "linear-gradient(135deg, rgba(21,30,55,0.9), rgba(12,18,35,0.95))",
              }
          }
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: isLightTheme
                ? "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 55%)"
                : "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.3), transparent 60%)",
            }}
          />
          <div className="relative z-10 flex items-center gap-6 p-6">
            <button
              onClick={() => router.push("/cameras")}
              className={`p-3 rounded-2xl transition-all duration-300 ${isLightTheme
                ? "bg-white/50 hover:bg-white/70 text-slate-700"
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
            >
              <svg
                className="w-5 h-5"
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
            <div className="flex-1">
              <h1 className={`text-3xl lg:text-4xl font-black ${textPrimary}`}>
                معايرة الكاميرات
              </h1>
              <p className={`${textSecondary} text-sm mt-1`}>
                ضبط حساسية الحركة وتقليل التنبيهات الخاطئة
              </p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className={`relative overflow-hidden rounded-[32px] border p-8 animate-fade-in ${isLightTheme
          ? "border-white/50 bg-white/85 backdrop-blur-2xl shadow-[0_35px_90px_rgba(15,23,42,0.1)]"
          : "border-white/5 bg-[#0f172a]/20 backdrop-blur-md shadow-2xl"
          }`}>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: isLightTheme
                ? "radial-gradient(circle at bottom right, rgba(99,102,241,0.15), transparent 50%)"
                : "radial-gradient(circle at bottom right, rgba(99,102,241,0.2), transparent 50%)",
            }}
          />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-xl font-bold ${textPrimary}`}>
                  {settings.detectionMode === "motion" ? "معايرة اكتشاف الحركة" : "معايرة كشف الأشخاص"}
                </h2>
                <p className={`${textMuted} text-sm mt-1`}>
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
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${isLightTheme
                  ? "bg-white/70 border border-gray-300 text-slate-700 hover:bg-white hover:border-gray-400"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                استعادة الافتراضي
              </button>
            </div>

            <div className="space-y-6">
              <label className={`flex cursor-pointer items-center justify-between gap-4 border-b pb-6 transition-colors ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                <span>
                  <span className={`block font-semibold ${textPrimary}`}>كشف الأشخاص داخل المنطقة</span>
                  <span className={`mt-1 block text-sm ${textMuted}`}>
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
                  <span className={`h-6 w-11 rounded-full transition-colors peer-checked:bg-emerald-500 ${isLightTheme ? "bg-gray-300" : "bg-gray-600"}`} />
                  <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
              <label className={`flex cursor-pointer items-center justify-between gap-4 border-b pb-6 transition-colors ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                <span>
                  <span className={`block font-semibold ${textPrimary}`}>التقاط صورة الكاميرا كاملة</span>
                  <span className={`mt-1 block text-sm ${textMuted}`}>
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
                  <span className={`h-6 w-11 rounded-full transition-colors peer-checked:bg-emerald-500 ${isLightTheme ? "bg-gray-300" : "bg-gray-600"}`} />
                  <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
              {settings.detectionMode === "person" && (
              <label className={`flex cursor-pointer items-center justify-between gap-4 border-b pb-6 transition-colors ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                <span>
                  <span className={`block font-semibold ${textPrimary}`}>إظهار مربعات الأشخاص للتصحيح</span>
                  <span className={`mt-1 block text-sm ${textMuted}`}>
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
                  <span className={`h-6 w-11 rounded-full transition-colors peer-checked:bg-emerald-500 ${isLightTheme ? "bg-gray-300" : "bg-gray-600"}`} />
                  <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
              )}
              {settings.detectionMode === "motion" && (
              <label className={`flex cursor-pointer items-center justify-between gap-4 border-b pb-6 transition-colors ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                <span>
                  <span className={`block font-semibold ${textPrimary}`}>إظهار معلومات الحركة للتصحيح</span>
                  <span className={`mt-1 block text-sm ${textMuted}`}>
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
                  <span className={`h-6 w-11 rounded-full transition-colors peer-checked:bg-emerald-500 ${isLightTheme ? "bg-gray-300" : "bg-gray-600"}`} />
                  <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
              )}
              <div className={`border-b pb-6 ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="capture-cooldown" className={`font-semibold ${textPrimary}`}>
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
                <div className={`space-y-6 border-b pb-6 ${isLightTheme ? "border-gray-200" : "border-white/10"}`}>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>معايرة كشف الأشخاص</h3>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-confidence" className={`font-semibold ${textPrimary}`}>الحد الأدنى للثقة</label>
                      <output htmlFor="person-confidence" className="font-mono text-emerald-400">{(settings.personDetection.minimumConfidence * 100).toFixed(0)}%</output>
                    </div>
                    <input id="person-confidence" type="range" min="30" max="95" step="5" value={settings.personDetection.minimumConfidence * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, minimumConfidence: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-min-size" className={`font-semibold ${textPrimary}`}>أصغر حجم للشخص</label>
                      <output htmlFor="person-min-size" className="font-mono text-emerald-400">{(settings.personDetection.minimumBoxAreaRatio * 100).toFixed(2)}%</output>
                    </div>
                    <input id="person-min-size" type="range" min="0.05" max="20" step="0.05" value={settings.personDetection.minimumBoxAreaRatio * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, minimumBoxAreaRatio: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-max-size" className={`font-semibold ${textPrimary}`}>أكبر حجم للشخص</label>
                      <output htmlFor="person-max-size" className="font-mono text-emerald-400">{(settings.personDetection.maximumBoxAreaRatio * 100).toFixed(0)}%</output>
                    </div>
                    <input id="person-max-size" type="range" min="20" max="99" step="1" value={settings.personDetection.maximumBoxAreaRatio * 100} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, maximumBoxAreaRatio: Number(event.target.value) / 100 } })} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-confirmation" className={`font-semibold ${textPrimary}`}>إطارات تأكيد الشخص</label>
                      <output htmlFor="person-confirmation" className="font-mono text-emerald-400">{settings.personDetection.positiveVotesRequired}</output>
                    </div>
                    <input id="person-confirmation" type="range" min="1" max="7" step="1" value={settings.personDetection.positiveVotesRequired} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, positiveVotesRequired: Number(event.target.value) } })} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-disappearance" className={`font-semibold ${textPrimary}`}>إطارات اختفاء الشخص</label>
                      <output htmlFor="person-disappearance" className="font-mono text-emerald-400">{settings.personDetection.zeroVotesRequired}</output>
                    </div>
                    <input id="person-disappearance" type="range" min="1" max="15" step="1" value={settings.personDetection.zeroVotesRequired} onChange={(event) => setSettings({ ...settings, personDetection: { ...settings.personDetection, zeroVotesRequired: Number(event.target.value) } })} className="w-full accent-emerald-500" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="person-interval" className={`font-semibold ${textPrimary}`}>الفاصل بين عمليات الكشف (مللي ثانية)</label>
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
                      <label htmlFor="motion-area" className={`font-semibold ${textPrimary}`}>
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
                      <label htmlFor="pixel-difference" className={`font-semibold ${textPrimary}`}>
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
                      <label htmlFor="movement-density" className={`font-semibold ${textPrimary}`}>
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

            {/* Message */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-200"
                  }`}
              >
                {message.type === "success" ? (
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${isLightTheme
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-500/30"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-500/30"
                  }`}
              >
                {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/cameras")}
                disabled={saving}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isLightTheme
                  ? "bg-white/70 border border-gray-300 text-slate-700 hover:bg-white hover:border-gray-400"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
