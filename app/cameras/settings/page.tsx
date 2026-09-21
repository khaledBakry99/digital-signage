"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cameraStorage } from "@/lib/cameras/storage/cameraStorage";
import { DEFAULT_MOTION_DETECTION_SETTINGS } from "@/lib/services/motionDetection";
import type { CameraSettings } from "@/lib/types/camera";

export default function CameraSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CameraSettings>({
    autoReconnect: true,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    streamQuality: "medium",
    motionDetection: { ...DEFAULT_MOTION_DETECTION_SETTINGS },
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
            <h1 className="text-3xl font-bold text-white">إعدادات الكاميرات</h1>
            <p className="text-gray-400 mt-1">
              تخصيص إعدادات البث ومعايرة اكتشاف الحركة
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            {/* Auto Reconnect */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">
                  إعادة الاتصال التلقائي
                </label>
                <p className="text-gray-400 text-sm mt-1">
                  محاولة إعادة الاتصال تلقائياً عند انقطاع البث
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoReconnect}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoReconnect: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Reconnect Attempts */}
            <div>
              <label className="block text-white font-medium mb-2">
                عدد محاولات إعادة الاتصال
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.reconnectAttempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reconnectAttempts: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-400 text-sm mt-1">
                عدد المحاولات قبل الاستسلام (1-10)
              </p>
            </div>

            {/* Reconnect Delay */}
            <div>
              <label className="block text-white font-medium mb-2">
                التأخير بين المحاولات (بالثواني)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.reconnectDelay / 1000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reconnectDelay: parseInt(e.target.value) * 1000,
                  })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-400 text-sm mt-1">
                الوقت بين كل محاولة إعادة اتصال (1-60 ثانية)
              </p>
            </div>

            {/* Stream Quality */}
            <div>
              <label className="block text-white font-medium mb-2">
                جودة البث الافتراضية
              </label>
              <select
                value={settings.streamQuality}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    streamQuality: e.target.value as "low" | "medium" | "high",
                  })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">منخفضة (توفير البيانات)</option>
                <option value="medium">متوسطة (موصى بها)</option>
                <option value="high">عالية (جودة أفضل)</option>
              </select>
              <p className="text-gray-400 text-sm mt-1">
                الجودة الافتراضية للكاميرات الجديدة
              </p>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    معايرة اكتشاف الحركة
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    القيم المحفوظة تطبق عند فتح الكاميرا أو إعادة تشغيلها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    motionDetection: { ...DEFAULT_MOTION_DETECTION_SETTINGS },
                  })}
                  className="shrink-0 rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
                >
                  استعادة الافتراضي
                </button>
              </div>

              <div className="space-y-6">
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
