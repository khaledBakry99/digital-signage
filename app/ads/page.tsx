"use client";

import { useState } from "react";
import AdList from "@/components/AdList";
import AdEditModal from "@/components/AdEditModal";
import AdCreateModal from "@/components/AdCreateModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import TableSkeleton from "@/components/TableSkeleton";
import { useMediaAssets } from "@/lib/hooks/useMediaAssets";
import { useAuth } from "@/lib/hooks/useAuth";
import type { MediaAsset } from "@/lib/types/mediaAsset";

export default function AdsPage() {
  const { clientId } = useAuth();
  const {
    mediaAssets,
    loading,
    error,
    refetch,
    deleteMediaAsset,
    updateMediaAsset,
  } = useMediaAssets({ clientId });
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<MediaAsset | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteAd, setSelectedDeleteAd] = useState<MediaAsset | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredAds = mediaAssets.filter((ad) => {
    const matchesSearch =
      ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteTrigger = (ad: MediaAsset) => {
    setSelectedDeleteAd(ad);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDeleteAd) {
      await deleteMediaAsset(selectedDeleteAd.id);
    }
  };

  const handleEdit = (ad: MediaAsset) => {
    setSelectedAd(ad);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (id: number, data: { name: string; description: string; isFallback: boolean }) => {
    await updateMediaAsset(id, data);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-text">الإعلانات</span>
          </h1>
         
        </div>
        <button
          className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98] select-none flex items-center gap-2"
          onClick={() => setCreateModalOpen(true)}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          إعلان جديد
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger">
        {[
          { label: "الإجمالي", value: mediaAssets.length, color: "#818cf8" },
          {
            label: "صور",
            value: mediaAssets.filter((a) => a.type === "Image").length,
            color: "#c084fc",
          },
          {
            label: "فيديوهات",
            value: mediaAssets.filter((a) => a.type === "Video").length,
            color: "#34d399",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="glass animate-fade-in p-4 flex items-center gap-4"
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-4 mb-6 animate-fade-in flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-48">
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            بحث
          </label>
          <input
            className="input-dark"
            placeholder="ابحث عن إعلان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <p
            className="text-sm self-end pb-2.5"
            style={{ color: "var(--text-muted)" }}
          >
            {filteredAds.length} نتيجة
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 p-4 rounded-xl animate-fade-in"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton cols={6} rows={4} />
      ) : (
        <div className="glass overflow-hidden animate-fade-in">
          <AdList
            advertisements={filteredAds}
            onEdit={handleEdit}
            onDelete={handleDeleteTrigger}
          />
        </div>
      )}

      {/* Edit Modal */}
      <AdEditModal
        key={selectedAd?.id || 'empty'}
        ad={selectedAd}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAd(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        ad={selectedDeleteAd}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDeleteAd(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Create Modal */}
      <AdCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => refetch()}
        clientId={clientId}
      />
    </div>
  );
}
