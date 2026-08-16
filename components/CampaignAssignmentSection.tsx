"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign.api";
import { screenApi } from "@/lib/api/screen.api";
import { extractApiError } from "@/lib/api/client";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Campaign } from "@/lib/types/campaign";

interface CampaignAssignmentSectionProps {
  screenId: number;
  clientId: number;
  onUpdate?: () => void;
}

export default function CampaignAssignmentSection({
  screenId,
  clientId,
  onUpdate,
}: CampaignAssignmentSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assignedCampaigns, setAssignedCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'assign' | 'remove'; campaignId?: number } | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  useEffect(() => {
    loadData();
  }, [clientId, screenId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all active campaigns
      const allCampaigns = await campaignApi.getAll({ clientId });
      const activeCampaigns = allCampaigns.filter(c =>
        c.status === 'Active' || c.status === 'Ready' || c.status === 'Scheduled' || c.status === 'Draft'
      );
      setCampaigns(activeCampaigns);

      // Fetch campaigns associated with screen
      const assigned = await screenApi.getAllCampaigns(screenId);
      setAssignedCampaigns(assigned);
    } catch (err) {
      setError(extractApiError(err, "فشل تحميل البيانات"));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = () => {
    if (!selectedCampaignId) return;
    
    // Verify that campaign is not already assigned
    if (assignedCampaigns.some(c => c.id === selectedCampaignId)) {
      setError("هذه الحملة مربوطة بالشاشة مسبقاً");
      return;
    }
    
    setConfirmAction({ type: 'assign', campaignId: selectedCampaignId });
    setShowConfirm(true);
  };

  const handleRemoveClick = (campaignId: number) => {
    setConfirmAction({ type: 'remove', campaignId });
    setShowConfirm(true);
  };

  const handleConfirmAssign = async () => {
    if (!confirmAction?.campaignId) return;

    setAssigning(true);
    setError(null);

    try {
      await screenApi.assignCampaign(screenId, confirmAction.campaignId);
      setShowConfirm(false);
      setSelectedCampaignId(null);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError(extractApiError(err, "فشل ربط الحملة"));
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!confirmAction?.campaignId) return;

    setRemovingId(confirmAction.campaignId);
    setError(null);

    try {
      await screenApi.removeCampaign(screenId, confirmAction.campaignId);
      setShowConfirm(false);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError(extractApiError(err, "فشل إزالة الحملة"));
    } finally {
      setRemovingId(null);
    }
  };

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

  // Filter available campaigns (not assigned)
  const availableCampaigns = campaigns.filter(
    c => !assignedCampaigns.some(ac => ac.id === c.id)
  );

  if (loading) {
    return (
      <div className="glass p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  const containerClass = `relative overflow-hidden rounded-[28px] border p-6 lg:p-7 shadow-lg animate-fade-in ${
    isLightTheme ? "border-white/60 shadow-[0_25px_80px_rgba(15,23,42,0.08)]" : "border-white/5"
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
            ربط الحملات الإعلانية
          </h3>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{
              background: isLightTheme ? "rgba(254,226,226,0.95)" : "rgba(239,68,68,0.1)",
              border: isLightTheme ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(239,68,68,0.2)",
              color: isLightTheme ? "#b91c1c" : "#f87171",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* قسم الحملات المرتبطة */}
        {assignedCampaigns.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className={`text-sm font-semibold ${isLightTheme ? "text-indigo-600" : "text-indigo-300"}`}>
              الحملات المرتبطة ({assignedCampaigns.length})
            </p>
            {assignedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLightTheme
                    ? "bg-white/85 border-indigo-100 text-slate-800 shadow-[0_15px_40px_rgba(15,23,42,0.06)]"
                    : "border-indigo-500/30 bg-indigo-500/15 text-indigo-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-lg font-bold ${isLightTheme ? "text-indigo-700" : "text-white"}`}>
                        {campaign.name}
                      </p>
                      <span 
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                          isLightTheme 
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200" 
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                        title="الأولوية: الرقم الأكبر يُعرض أولاً"
                      >
                        أولوية {campaign.priority}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className={`text-sm mb-2 ${isLightTheme ? "text-indigo-500/90" : "text-indigo-100/80"}`}>
                        {campaign.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <p className={`mb-0.5 ${isLightTheme ? "text-slate-500" : "text-indigo-200"}`}>بداية</p>
                        <p className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                          {formatDateWithTime(campaign.startsAtUtc, campaign.dayStartsAt)}
                        </p>
                      </div>
                      <div>
                        <p className={`mb-0.5 ${isLightTheme ? "text-slate-500" : "text-indigo-200"}`}>نهاية</p>
                        <p className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                          {formatDateWithTime(campaign.endsAtUtc, campaign.dayEndsAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveClick(campaign.id)}
                    disabled={removingId === campaign.id}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLightTheme
                        ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
                        : "bg-rose-500/15 border border-rose-400/40 text-rose-200 hover:bg-rose-500/25"
                    }`}
                    title="إزالة الحملة"
                  >
                    {removingId === campaign.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* قسم إضافة حملة جديدة */}
        <div className="space-y-4">
          <p className={`text-sm font-semibold ${isLightTheme ? "text-slate-700" : "text-white/90"}`}>
            إضافة حملة جديدة
          </p>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
              اختر حملة إعلانية
            </label>
            <div className="relative group">
              <select
                value={selectedCampaignId || ""}
                onChange={(e) => {
                  setSelectedCampaignId(Number(e.target.value) || null);
                  setError(null);
                }}
                className={`w-full px-4 py-3 rounded-2xl text-sm outline-none cursor-pointer appearance-none transition-all ${
                  isLightTheme ? "focus:ring-2 focus:ring-indigo-200" : ""
                }`}
                style={{
                  background: isLightTheme ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.6)",
                  border: isLightTheme ? "1px solid rgba(191,219,254,0.8)" : "1px solid rgba(148,163,184,0.2)",
                  color: isLightTheme ? "#0f172a" : "#f8fafc",
                }}
              >
                <option value="" className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>
                  — اختر حملة —
                </option>
                {availableCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id} className={isLightTheme ? "bg-white" : "bg-[#0f172a]"}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  isLightTheme ? "text-slate-400 group-hover:text-slate-600" : "text-white/40 group-hover:text-white/60"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div
              className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${
                isLightTheme
                  ? "bg-slate-100 border border-slate-200 text-slate-600"
                  : "bg-slate-500/10 border border-slate-500/20 text-slate-300"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>لا يوجد حملات لإضافتها</p>
            </div>
          ) : availableCampaigns.length === 0 ? (
            <div
              className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${
                isLightTheme
                  ? "bg-amber-100 border border-amber-200 text-amber-700"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-200/90"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>جميع الحملات المتاحة مربوطة بالشاشة</p>
            </div>
          ) : null}

          <button
            onClick={handleAssignClick}
            disabled={!selectedCampaignId || assigning}
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:scale-[0.98] active:scale-95 ${
              selectedCampaignId ? "shadow-lg shadow-indigo-500/30" : isLightTheme ? "bg-slate-200 text-slate-400" : "bg-slate-900/50 text-white/40"
            }`}
            style={{
              background: selectedCampaignId ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : undefined,
              color: selectedCampaignId ? "white" : undefined,
            }}
          >
            {assigning ? "جاري الربط..." : "ربط الحملة"}
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && confirmAction && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          >
            <div
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
                isLightTheme ? "bg-white border border-slate-200" : "bg-slate-900 border border-slate-800"
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                {confirmAction.type === 'assign' ? 'تأكيد ربط الحملة' : 'تأكيد إزالة الحملة'}
              </h3>
              <p className={`mb-6 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {confirmAction.type === 'assign'
                  ? `هل أنت متأكد من ربط الحملة "${campaigns.find(c => c.id === confirmAction.campaignId)?.name}" بهذه الشاشة؟`
                  : `هل أنت متأكد من إزالة الحملة "${assignedCampaigns.find(c => c.id === confirmAction.campaignId)?.name}" من هذه الشاشة؟`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmAction.type === 'assign' ? handleConfirmAssign : handleConfirmRemove}
                  disabled={assigning || removingId !== null}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 ${
                    confirmAction.type === 'assign'
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : "bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                  }`}
                >
                  {assigning || removingId !== null ? "جاري المعالجة..." : "تأكيد"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={assigning || removingId !== null}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                    isLightTheme
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      : "bg-slate-800/40 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
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
