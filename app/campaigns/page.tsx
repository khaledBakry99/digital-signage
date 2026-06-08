"use client";

import { useState } from "react";
import { useCampaigns } from "@/lib/hooks/useCampaigns";
import { useAuth } from "@/lib/hooks/useAuth";
import { extractApiError } from "@/lib/api/client";
import CampaignList from "@/components/CampaignList";
import CampaignModal from "@/components/CampaignModal";
import TableSkeleton from "@/components/TableSkeleton";
import type { Campaign, CreateCampaignInput } from "@/lib/types/campaign";

export default function CampaignsPage() {
  const { clientId } = useAuth();
  const { campaigns, loading, error, createCampaign, updateCampaign, deleteCampaign, refreshCampaigns } = useCampaigns({ clientId });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      console.log("🚀 Final payload sent to API client:", JSON.stringify(data, null, 2));
      console.log("🚀 Current Access Token:", localStorage.getItem("accessToken"));
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, data);
      } else {
        await createCampaign(data);
      }
      setIsModalOpen(false);
      setEditingCampaign(undefined);
      refreshCampaigns();
    } catch (err) {
      console.error("Campaign Submit Error Details:", err);
      setSubmitError(extractApiError(err, 'فشل حفظ الحملة'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCampaign(id);
      refreshCampaigns();
    } catch (err) {
      alert(extractApiError(err, 'فشل حذف الحملة'));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(undefined);
    setSubmitError(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text-modern">الحملات الإعلانية</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
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

      <div className="mb-6 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="glass p-5">
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>إجمالي الحملات</p>
          <p className="text-3xl font-bold" style={{ color: "#818cf8" }}>{campaigns.length}</p>
        </div>
        <div className="glass p-5">
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>حملات نشطة</p>
          <p className="text-3xl font-bold" style={{ color: "#60a5fa" }}>
            {campaigns.filter(c => c.status === 'Active').length}
          </p>
        </div>
        <div className="glass p-5">
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>حملات مسودة</p>
          <p className="text-3xl font-bold" style={{ color: "#c084fc" }}>
            {campaigns.filter(c => c.status === 'Draft').length}
          </p>
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
            onDelete={handleDelete}
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
    </div>
  );
}
