"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign.api";
import { extractApiError } from "@/lib/api/client";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Campaign } from "@/lib/types/campaign";

interface CampaignAssignmentSectionProps {
  screenId: number;
  clientId: number;
  currentCampaignId?: number;
  onAssignCampaign: (campaignId: number) => Promise<boolean>;
  onRemoveCampaign: () => Promise<boolean>;
}

export default function CampaignAssignmentSection({
  screenId,
  clientId,
  currentCampaignId,
  onAssignCampaign,
  onRemoveCampaign,
}: CampaignAssignmentSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'assign' | 'remove' | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  useEffect(() => {
    loadCampaigns();
  }, [clientId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignApi.getAll({ clientId });
      // Filter to active/ready/scheduled campaigns, and Draft for testing
      const activeCampaigns = data.filter(c =>
        c.status === 'Active' || c.status === 'Ready' || c.status === 'Scheduled' || c.status === 'Draft'
      );
      setCampaigns(activeCampaigns);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = () => {
    if (!selectedCampaignId) return;
    setConfirmAction('assign');
    setShowConfirm(true);
  };

  const handleRemoveClick = () => {
    setConfirmAction('remove');
    setShowConfirm(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCampaignId) return;

    setAssigning(true);
    setError(null);

    try {
      const success = await onAssignCampaign(selectedCampaignId);
      if (success) {
        setShowConfirm(false);
        setSelectedCampaignId(null);
        await loadCampaigns();
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    setAssigning(true);
    setError(null);

    try {
      const success = await onRemoveCampaign();
      if (success) {
        setShowConfirm(false);
        await loadCampaigns();
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setAssigning(false);
    }
  };

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId);

  const formatDateWithTime = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);

    if (timeStr) {
      const [hoursStr, minutesStr] = timeStr.split(':');
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);

      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        date.setHours(hours, minutes, 0, 0);
      }
    }

    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDailyTime = (timeStr: string) => {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timeStr;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="glass p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  const containerClass = `relative overflow-hidden rounded-[28px] border p-6 lg:p-7 shadow-lg animate-fade-in ${isLightTheme ? "border-white/60 shadow-[0_25px_80px_rgba(15,23,42,0.08)]" : "border-white/5"
    }`;

  const containerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(238,245,255,0.92), rgba(230,236,255,0.88))",
      backdropFilter: "blur(20px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(15,23,42,1), rgba(36,11,46,0.85))",
    };

  const headingClass = `text-lg font-bold flex items-center gap-2 ${isLightTheme ? "text-indigo-700" : "text-white"}`;
  const headingIconClass = `w-5 h-5 ${isLightTheme ? "text-indigo-500" : "text-indigo-300"}`;
  const subTextClass = isLightTheme ? "text-slate-500" : "text-white/80";

  return (
    <div className={containerClass} style={containerStyle}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: isLightTheme
            ? "radial-gradient(circle at top left, rgba(167,201,255,0.35), transparent 55%)"
            : "radial-gradient(circle at top left, rgba(99,102,241,0.35), transparent 55%)",
        }}
      />
      <div
        className="absolute -right-16 top-0 w-60 h-60 blur-3xl"
        style={{ background: isLightTheme ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)", opacity: isLightTheme ? 0.6 : 0.2 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className={headingClass}>
            <svg className={headingIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            ربط الحملة الإعلانية
          </h3>

        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{
              background: isLightTheme ? "rgba(254,226,226,0.95)" : "rgba(239,68,68,0.1)",
              border: isLightTheme ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(239,68,68,0.2)",
              color: isLightTheme ? "#b91c1c" : "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {currentCampaign ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border transition-all ${isLightTheme
                ? "bg-white/85 border-indigo-100 text-slate-800 shadow-[0_25px_60px_rgba(15,23,42,0.08)]"
                : "border-indigo-500/30 bg-indigo-500/15 text-indigo-50"
                }`}
            >
              <div className="mb-3">
                <p className={`text-sm mb-1 ${isLightTheme ? "text-indigo-500/80" : "text-indigo-200"}`}>الحملة المربوطة حالياً</p>
                <p className={`text-2xl font-bold ${isLightTheme ? "text-indigo-700" : ""}`}>{currentCampaign.name}</p>
              </div>

              {currentCampaign.description && (
                <p className={`text-sm mb-3 ${isLightTheme ? "text-indigo-500/90" : "text-indigo-100/80"}`}>
                  {currentCampaign.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className={`mb-1 ${isLightTheme ? "text-slate-500" : "text-indigo-200"}`}>بداية الحملة</p>
                  <p className={`font-semibold ${isLightTheme ? "text-slate-900" : ""}`}>
                    {formatDateWithTime(currentCampaign.startsAtUtc, currentCampaign.dayStartsAt)}
                  </p>
                </div>
                <div>
                  <p className={`mb-1 ${isLightTheme ? "text-slate-500" : "text-indigo-200"}`}>نهاية الحملة</p>
                  <p className={`font-semibold ${isLightTheme ? "text-slate-900" : ""}`}>
                    {formatDateWithTime(currentCampaign.endsAtUtc, currentCampaign.dayEndsAt)}
                  </p>
                </div>
              </div>

              <div className={`mt-4 pt-4 border-t ${isLightTheme ? "border-indigo-100" : "border-indigo-500/25"}`}>
                <p className={`text-xs mb-2 uppercase tracking-wider font-semibold ${isLightTheme ? "text-indigo-500" : "text-indigo-200"}`}>
                  أيام العرض
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentCampaign.daysOfWeek.map((day) => (
                    <span
                      key={day}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm ${isLightTheme ? "bg-gradient-to-r from-white to-indigo-50 border-indigo-100 text-indigo-600" : "bg-white/10 border-white/20 text-white"
                        }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className={`mb-1 ${isLightTheme ? "text-indigo-500" : "text-indigo-200"}`}>يبدأ العرض من</p>
                    <div className={`px-3 py-2 rounded-xl border text-sm font-semibold ${isLightTheme ? "bg-white/90 border-indigo-100 text-indigo-700" : "border-white/10 text-white"}`}>
                      {formatDailyTime(currentCampaign.dayStartsAt)}
                    </div>
                  </div>
                  <div>
                    <p className={`mb-1 ${isLightTheme ? "text-indigo-500" : "text-indigo-200"}`}>ينتهي العرض عند</p>
                    <div className={`px-3 py-2 rounded-xl border text-sm font-semibold ${isLightTheme ? "bg-white/90 border-indigo-100 text-indigo-700" : "border-white/10 text-white"}`}>
                      {formatDailyTime(currentCampaign.dayEndsAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRemoveClick}
              disabled={assigning}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isLightTheme
                ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
                : "bg-rose-500/15 border border-rose-400/40 text-rose-200 hover:bg-rose-500/25 shadow-lg shadow-rose-900/10"
                }`}
            >
              {assigning ? "جاري الإزالة..." : "إزالة الحملة"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
                اختر حملة إعلانية
              </label>
              <div className="relative group">
                <select
                  value={selectedCampaignId || ""}
                  onChange={(e) => setSelectedCampaignId(Number(e.target.value) || null)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm outline-none cursor-pointer appearance-none transition-all ${isLightTheme ? "focus:ring-2 focus:ring-indigo-200" : ""
                    }`}
                  style={{
                    background: isLightTheme ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.6)",
                    border: isLightTheme ? "1px solid rgba(191,219,254,0.8)" : "1px solid rgba(148,163,184,0.2)",
                    color: isLightTheme ? "#0f172a" : "#f8fafc",
                  }}
                >
                  <option value="" className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>— اختر حملة —</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id} className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isLightTheme ? "text-slate-400 group-hover:text-slate-600" : "text-white/40 group-hover:text-white/60"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {campaigns.length === 0 && (
              <div
                className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${isLightTheme
                  ? "bg-amber-100 border border-amber-200 text-amber-700"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-200/90"
                  }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>لا توجد حملات نشطة متاحة حالياً</p>
              </div>
            )}

            <button
              onClick={handleAssignClick}
              disabled={!selectedCampaignId || assigning}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:scale-[0.98] active:scale-95 ${selectedCampaignId
                ? "shadow-lg shadow-indigo-500/30"
                : isLightTheme
                  ? "bg-slate-200 text-slate-400"
                  : "bg-slate-900/50 text-white/40"
                }`}
              style={{
                background: selectedCampaignId
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : undefined,
                color: selectedCampaignId ? "white" : undefined,
              }}
            >
              {assigning ? "جاري الربط..." : "ربط الحملة"}
            </button>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                {confirmAction === 'assign' ? 'تأكيد ربط الحملة' : 'تأكيد إزالة الحملة'}
              </h3>
              <p className="mb-6" style={{ color: "var(--text-muted)" }}>
                {confirmAction === 'assign'
                  ? `هل أنت متأكد من ربط الحملة "${campaigns.find(c => c.id === selectedCampaignId)?.name}" بهذه الشاشة؟`
                  : `هل أنت متأكد من إزالة الحملة "${currentCampaign?.name}" من هذه الشاشة؟`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmAction === 'assign' ? handleConfirmAssign : handleConfirmRemove}
                  disabled={assigning}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    background: confirmAction === 'assign'
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                  }}
                >
                  {assigning ? "جاري المعالجة..." : "تأكيد"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={assigning}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white/5"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
