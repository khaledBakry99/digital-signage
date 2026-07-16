"use client";

import { useState } from "react";
import Link from "next/link";
import { useScreensWithHeartbeat } from "@/lib/hooks/useScreensWithHeartbeat";
import { useCameras } from "@/lib/cameras/hooks/useCameras";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";
import { extractApiError } from "@/lib/api/client";
import type { Screen, ConnectionStatus, OperationalStatus } from "@/lib/types/screen";
import DeleteScreenModal from "@/components/DeleteScreenModal";

export default function ManageScreensPage() {
  const { clientId } = useAuth();
  const { screens, loading, error: screensError, createScreen, updateScreen, deleteScreen, refresh } = useScreensWithHeartbeat(clientId);
  const { cameras } = useCameras();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const [showForm, setShowForm] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formExternalId, setFormExternalId] = useState("");
  const [formLocationName, setFormLocationName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCameraEnabled, setFormCameraEnabled] = useState(false);
  const [formAiEnabled, setFormAiEnabled] = useState(false);
  const [formCameraId, setFormCameraId] = useState<string>("");
  const [formConnectionStatus, setFormConnectionStatus] = useState<ConnectionStatus>("Offline");
  const [formOperationalStatus, setFormOperationalStatus] = useState<OperationalStatus>("Draft");

  // Delete modal state
  const [screenToDelete, setScreenToDelete] = useState<Screen | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroContainerClass = isLightTheme
    ? "relative mb-8 overflow-hidden rounded-[32px] border border-white/60 shadow-[0_35px_95px_rgba(15,23,42,0.12)]"
    : "relative mb-8 overflow-hidden rounded-[32px] border border-white/5 shadow-[0_35px_95px_rgba(2,6,23,0.65)]";

  const heroContainerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(249,252,255,0.95), rgba(222,231,255,0.9))",
      backdropFilter: "blur(30px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(21,27,51,0.85), rgba(15,18,34,0.95))",
    };

  const statsCardClass = isLightTheme
    ? "relative overflow-hidden rounded-[24px] border border-white/50 p-5 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
    : "relative overflow-hidden rounded-[24px] border border-white/10 p-5 bg-white/5 backdrop-blur-sm";

  const activeCount = screens.filter((screen) => screen.connectionStatus === "Online").length;
  const stats = [
    {
      label: "إجمالي الشاشات",
      value: screens.length,
      accent: "#818cf8",
      tint: "linear-gradient(135deg, rgba(216,226,255,0.92), rgba(237,247,255,0.85))",
    },
    {
      label: "نشطة",
      value: activeCount,
      accent: "#34d399",
      tint: "linear-gradient(135deg, rgba(209,250,229,0.92), rgba(224,242,254,0.85))",
    },
    {
      label: "خاملة",
      value: screens.length - activeCount,
      accent: "#94a3b8",
      tint: "linear-gradient(135deg, rgba(226,232,240,0.92), rgba(241,245,249,0.9))",
    },
  ];

  const openAddForm = () => {
    setEditingScreen(null);
    setFormName("");
    setFormExternalId("");
    setFormLocationName("");
    setFormCity("");
    setFormCameraEnabled(false);
    setFormAiEnabled(false);
    setFormCameraId("");
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (screen: Screen) => {
    setEditingScreen(screen);
    setFormName(screen.name);
    setFormExternalId(screen.externalId || "");
    setFormLocationName(screen.locationName || "");
    setFormCity(screen.city || "");
    setFormCameraEnabled(screen.cameraEnabled);
    setFormAiEnabled(screen.aiEnabled);
    setFormCameraId(screen.cameraId?.toString() || "");
    setFormConnectionStatus(screen.connectionStatus);
    setFormOperationalStatus(screen.operationalStatus);
    setError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("اسم الشاشة مطلوب");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingScreen) {
        // Update existing screen
        const success = await updateScreen(editingScreen.id, {
          name: formName.trim(),
          externalId: formExternalId.trim() || undefined,
          locationName: formLocationName.trim() || undefined,
          city: formCity.trim() || undefined,
          cameraEnabled: formCameraEnabled,
          aiEnabled: formAiEnabled,
          cameraId: formCameraEnabled && formCameraId ? Number(formCameraId) : undefined,
          connectionStatus: formConnectionStatus,
          operationalStatus: formOperationalStatus,
        });
        if (!success) {
          throw new Error("فشل تحديث الشاشة على الخادم");
        }
      } else {
        // Add new screen
        if (!clientId) {
          throw new Error("لم يتم تحديد معرّف العميل. يرجى تسجيل الدخول مجدداً.");
        }
        const success = await createScreen({
          clientId,
          name: formName.trim(),
          externalId: formExternalId.trim() || undefined,
          locationName: formLocationName.trim() || undefined,
          city: formCity.trim() || undefined,
          cameraEnabled: formCameraEnabled,
          aiEnabled: formAiEnabled,
          cameraId: formCameraEnabled && formCameraId ? Number(formCameraId) : undefined,
        });
        if (!success) {
          throw new Error("فشل إنشاء الشاشة على الخادم");
        }
      }

      await refresh();
      setShowForm(false);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (screen: Screen) => {
    setScreenToDelete(screen);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!screenToDelete) return;
    const success = await deleteScreen(screenToDelete.id);
    if (!success) {
      throw new Error("حدث خطأ أثناء محاولة حذف الشاشة من الخادم");
    }
    await refresh();
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20";
  const inputStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className={heroContainerClass} style={heroContainerStyle}>
        <div
          className="absolute inset-0 opacity-30"
          style={
            isLightTheme
              ? { background: "radial-gradient(circle at top left, rgba(255,255,255,0.65), transparent 55%)" }
              : { background: "radial-gradient(circle at top left, rgba(99,102,241,0.25), transparent 50%)" }
          }
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 lg:p-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text-modern">إدارة الشاشات</span>
            </h1>
            <p className={`text-lg ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
              إضافة وتعديل وحذف الشاشات وربطها بكاميرات المراقبة
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="btn-primary cursor-pointer active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>إضافة شاشة</span>
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={statsCardClass}
              style={isLightTheme ? { background: stat.tint } : undefined}
            >
              <p className={`${isLightTheme ? "text-slate-500" : "text-white/60"} text-xs font-semibold mb-2`}>
                {stat.label}
              </p>
              <p className="text-3xl font-black" style={{ color: stat.accent }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {screensError && (
        <div
          className="mb-6 p-4 rounded-xl animate-fade-in text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {screensError}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 cursor-pointer hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2
              className="text-xl font-bold mb-6 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="w-1.5 h-6 rounded-full bg-indigo-500" />
              {editingScreen ? "تعديل الشاشة" : "إضافة شاشة جديدة"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    اسم الشاشة *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: شاشة المدخل"
                    className={`${inputClass} cursor-text`}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    المعرّف الخارجي (External ID)
                  </label>
                  <input
                    type="text"
                    value={formExternalId}
                    onChange={(e) => setFormExternalId(e.target.value)}
                    placeholder="مثال: SCR-101"
                    className={`${inputClass} cursor-text`}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    الموقع / صالة العرض
                  </label>
                  <input
                    type="text"
                    value={formLocationName}
                    onChange={(e) => setFormLocationName(e.target.value)}
                    placeholder="مثال: البوابة الرئيسية"
                    className={`${inputClass} cursor-text`}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="مثال: الرياض"
                    className={`${inputClass} cursor-text`}
                    style={inputStyle}
                  />
                </div>
              </div>

              {editingScreen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 text-indigo-300"
                    >
                      حالة الاتصال
                    </label>
                    <select
                      value={formConnectionStatus}
                      onChange={(e) => setFormConnectionStatus(e.target.value as ConnectionStatus)}
                      className={`${inputClass} cursor-pointer`}
                      style={inputStyle}
                    >
                      <option className="cursor-pointer" value="Online">متصلة (Online)</option>
                      <option className="cursor-pointer" value="Offline">غير متصلة (Offline)</option>
                      <option className="cursor-pointer" value="Unknown">غير معروفة (Unknown)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 text-indigo-300"
                    >
                      الحالة التشغيلية
                    </label>
                    <select
                      value={formOperationalStatus}
                      onChange={(e) => setFormOperationalStatus(e.target.value as OperationalStatus)}
                      className={`${inputClass} cursor-pointer`}
                      style={inputStyle}
                    >
                      <option className="cursor-pointer" value="Draft">مسودة (Draft)</option>
                      <option className="cursor-pointer" value="Active">نشطة تشغيلياً (Active)</option>
                      <option className="cursor-pointer" value="Inactive">غير نشطة (Inactive)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={formCameraEnabled}
                    onChange={(e) => setFormCameraEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded-md cursor-pointer accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>تفعيل الكاميرا</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>ربط كاميرا لمراقبة الجمهور</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={formAiEnabled}
                    onChange={(e) => setFormAiEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded-md cursor-pointer accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>تحليل الذكاء الاصطناعي</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>تفعيل تصنيف الفئات الديموغرافية</p>
                  </div>
                </label>
              </div>

              {formCameraEnabled && (
                <div className="animate-fade-in">
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    اختر الكاميرا المرتبطة
                  </label>
                  <select
                    value={formCameraId}
                    onChange={(e) => setFormCameraId(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                    style={inputStyle}
                  >
                    <option className="cursor-pointer" value="">— اختر من الكاميرات المتوفرة —</option>
                    {cameras.map((cam) => (
                      <option key={cam.id} className="cursor-pointer" value={cam.id}>
                        {cam.name} {cam.location ? `— ${cam.location}` : ""}
                      </option>
                    ))}
                  </select>
                  {cameras.length === 0 && (
                    <p
                      className="text-xs mt-1 text-amber-400/80"
                    >
                      ملاحظة: لا توجد كاميرات مسجلة بالنظام حالياً. يمكنك إضافتها لاحقاً.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div
                  className="p-3.5 rounded-xl text-xs font-medium border animate-pulse"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                  }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الحفظ...
                    </span>
                  ) : editingScreen ? (
                    "تحديث الشاشة"
                  ) : (
                    "إضافة الشاشة"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer select-none hover:bg-white/5 transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screens List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass p-5 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/6" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-6 bg-white/5 rounded-full w-16" />
                <div className="h-9 bg-white/5 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : screens.length === 0 ? (
        <div className="glass p-16 text-center animate-fade-in">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            لا توجد شاشات مسجلة بالنظام حالياً. أضف شاشتك الأولى الآن للبدء.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {screens.map((screen, i) => {
            const isOnline = screen.connectionStatus === "Online";
            return (
              <div
                key={screen.id}
                className="glass animate-fade-in p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-bold truncate text-base ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}
                    >
                      {screen.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                      {screen.locationName && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {screen.locationName} {screen.city && `، ${screen.city}`}
                        </span>
                      )}

                      {screen.cameraEnabled && (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          الكاميرا مفعلة
                        </span>
                      )}

                      {screen.aiEnabled && (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 text-[10px] font-semibold">
                          ذكاء اصطناعي نشط
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                  {/* Status Badge */}
                  <span
                    className={`badge ${isOnline ? "badge-green" : "badge-gray"} shrink-0`}
                  >
                    {isOnline && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    )}
                    {isOnline ? "متصلة" : "خاملة"}
                  </span>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/screens/${screen.id}/manage`}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                      style={{
                        background: "rgba(99,102,241,0.1)",
                      }}
                    >
                      إدارة الربط
                    </Link>
                    <button
                      onClick={() => openEditForm(screen)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-white/5 hover:text-slate-100 border border-slate-800/40 hover:border-slate-700 text-slate-400"
                      style={{
                        background: "var(--bg-secondary)",
                      }}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(screen)}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-100 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                      title="حذف الشاشة"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteScreenModal
        screen={screenToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setScreenToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
