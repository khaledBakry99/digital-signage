"use client";

import { useEffect, useState } from "react";
import { useCampaigns } from "@/lib/hooks/useCampaigns";
import { useAuth } from "@/lib/hooks/useAuth";
import { extractApiError } from "@/lib/api/client";
import CampaignList from "@/components/CampaignList";
import CampaignModal from "@/components/CampaignModal";
import DeleteCampaignModal from "@/components/DeleteCampaignModal";
import TableSkeleton from "@/components/TableSkeleton";
import { useTheme } from "@/lib/context/ThemeContext";
import type { Campaign, CreateCampaignInput } from "@/lib/types/campaign";
import { dashboardApi, CampaignStats } from "@/lib/api/dashboard.api";

export default function CampaignsPage() {
  const { clientId } = useAuth();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    activateCampaign,
    pauseCampaign,
    completeCampaign,
    refreshCampaigns,
  } = useCampaigns({ clientId });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [campaignStatsLoading, setCampaignStatsLoading] = useState(true);
  const [campaignStatsError, setCampaignStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchCampaignStats = async () => {
      try {
        setCampaignStatsLoading(true);
        setCampaignStatsError(null);
        const data = await dashboardApi.getCampaignStats(clientId);
        setCampaignStats(data);
      } catch (err) {
        setCampaignStatsError("Failed to load campaign statistics");
        console.error("Error fetching campaign stats:", err);
      } finally {
        setCampaignStatsLoading(false);
      }
    };

    fetchCampaignStats();
  }, [clientId]);

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCampaign(undefined);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: CreateCampaignInput) => {
    try {
      setSubmitError(null);
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, data);
      } else {
        await createCampaign(data);
      }
      setIsModalOpen(false);
      setEditingCampaign(undefined);
    } catch (err) {
      setSubmitError(extractApiError(err, 'فشل حفظ الحملة'));
    }
  };

  const handleDeleteRequest = (campaign: Campaign) => {
    setDeleteError(null);
    setCampaignToDelete(campaign);
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCampaign(campaignToDelete.id);
      setCampaignToDelete(null);
    } catch (err) {
      setDeleteError(extractApiError(err, 'فشل حذف الحملة'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDismissDeleteModal = () => {
    if (isDeleting) return;
    setCampaignToDelete(null);
    setDeleteError(null);
  };

  const handleStatusChange = async (campaign: Campaign, status: 'Active' | 'Paused' | 'Completed') => {
    try {
      if (status === 'Active') {
        await activateCampaign(campaign.id);
      } else if (status === 'Paused') {
        await pauseCampaign(campaign.id);
      } else if (status === 'Completed') {
        await completeCampaign(campaign.id);
      }
    } catch (err) {
      alert(extractApiError(err, 'فشل تغيير حالة الحملة'));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(undefined);
    setSubmitError(null);
  };

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

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "Active").length;
  const pausedCampaigns = campaigns.filter((c) => c.status === "Paused").length;

  const statSkeleton = (
    <div
      className={`h-8 w-full rounded-2xl animate-pulse ${isLightTheme ? "bg-white/50" : "bg-white/10"
        }`}
    />
  );

  const stats = [
    {
      label: "إجمالي الحملات",
      value: campaignStats?.totalCampaigns ?? 0,
      accent: "#818cf8",
      tint: "linear-gradient(135deg, rgba(216,226,255,0.9), rgba(237,247,255,0.85))",
    },
    {
      label: "الحملات النشطة",
      value: campaignStats?.totalActiveCampaigns ?? 0,
      accent: "#34d399",
      tint: "linear-gradient(135deg, rgba(209,250,229,0.9), rgba(224,242,254,0.85))",
    },
    {
      label: "الحملات المتوقفة",
      value: campaignStats?.totalinactiveCampaigns ?? 0,
      accent: "#ef4444",
      tint: "linear-gradient(135deg, rgba(254,226,226,0.9), rgba(254,242,242,0.9))",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
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
              <span className="gradient-text-modern">الحملات الإعلانية</span>
            </h1>
            <p className={`text-lg ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
              إدارة وجدولة الحملات الإعلانية
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary cursor-pointer active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>إضافة حملة</span>
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
              {campaignStatsLoading ? (
                statSkeleton
              ) : (
                <p className="text-3xl font-black" style={{ color: stat.accent }}>
                  {stat.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={7} rows={4} />
      ) : error ? (
        <div className="glass p-6 text-center" style={{ color: "#ef4444" }}>
          {error}
        </div>
      ) : (
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CampaignList
            campaigns={campaigns}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        campaign={editingCampaign}
        clientId={clientId || 0}
        error={submitError}
      />

      <DeleteCampaignModal
        isOpen={Boolean(campaignToDelete)}
        campaign={campaignToDelete}
        onClose={handleDismissDeleteModal}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
