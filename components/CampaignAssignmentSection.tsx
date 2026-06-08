"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign.api";
import { extractApiError } from "@/lib/api/client";
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  return (
    <div className="glass p-6 animate-fade-in">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        ربط الحملة الإعلانية
      </h3>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {currentCampaign ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                  الحملة المربوطة حالياً
                </p>
                <p className="text-lg font-bold text-indigo-300">{currentCampaign.name}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20">
                <p className="text-xs font-semibold text-indigo-300">أولوية: {currentCampaign.priority}</p>
              </div>
            </div>

            {currentCampaign.description && (
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                {currentCampaign.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="mb-1" style={{ color: "var(--text-muted)" }}>
                  بداية الحملة
                </p>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatDate(currentCampaign.startsAtUtc)}
                </p>
              </div>
              <div>
                <p className="mb-1" style={{ color: "var(--text-muted)" }}>
                  نهاية الحملة
                </p>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatDate(currentCampaign.endsAtUtc)}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-500/20">
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                أيام العرض
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentCampaign.daysOfWeek.map((day) => (
                  <span
                    key={day}
                    className="px-2 py-1 rounded-lg bg-indigo-500/20 text-xs font-semibold text-indigo-300"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRemoveClick}
            disabled={assigning}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            {assigning ? "جاري الإزالة..." : "إزالة الحملة"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              اختر حملة إعلانية
            </label>
            <select
              value={selectedCampaignId || ""}
              onChange={(e) => setSelectedCampaignId(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">— اختر حملة —</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} (أولوية: {campaign.priority})
                </option>
              ))}
            </select>
          </div>

          {campaigns.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
              <p>لا توجد حملات نشطة متاحة حالياً</p>
            </div>
          )}

          <button
            onClick={handleAssignClick}
            disabled={!selectedCampaignId || assigning}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selectedCampaignId
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "var(--bg-secondary)",
              color: "white",
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
  );
}
