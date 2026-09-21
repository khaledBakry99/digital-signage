"use client";

import { useEffect, useState } from "react";
import AdList from "@/components/AdList";
import AdEditModal from "@/components/AdEditModal";
import AdCreateModal from "@/components/AdCreateModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import TableSkeleton from "@/components/TableSkeleton";
import Pagination from "@/components/Pagination";
import { useMediaAssetsPaginated } from "@/lib/hooks/useMediaAssets";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";
import type { MediaAsset, MediaType } from "@/lib/types/mediaAsset";
import { dashboardApi, MediaStats } from "@/lib/api/dashboard.api";

export default function AdsPage() {
  const { clientId } = useAuth();
  const {
    mediaAssets,
    loading,
    error,
    currentPage,
    totalItems,
    totalPages,
    itemsPerPage,
    isSearching,
    searchQuery,
    setSearchQuery,
    search,
    refetch,
    deleteMediaAsset,
    updateMediaAsset,
    goToPage,
    nextPage,
    previousPage,
    changeItemsPerPage,
  } = useMediaAssetsPaginated({ clientId, itemsPerPage: 8 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<MediaAsset | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteAd, setSelectedDeleteAd] = useState<MediaAsset | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [mediaStatsLoading, setMediaStatsLoading] = useState(true);
  const [mediaStatsError, setMediaStatsError] = useState<string | null>(null);

  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  useEffect(() => {
    if (!clientId) return;

    const fetchMediaStats = async () => {
      try {
        setMediaStatsLoading(true);
        setMediaStatsError(null);
        const data = await dashboardApi.getMediaStats(clientId);
        setMediaStats(data);
      } catch (err) {
        setMediaStatsError("Failed to load media statistics");
        console.error("Error fetching media stats:", err);
      } finally {
        setMediaStatsLoading(false);
      }
    };

    fetchMediaStats();
  }, [clientId]);

  const textPrimary = isLightTheme ? "text-slate-900" : "text-white";
  const textSecondary = isLightTheme ? "text-slate-600" : "text-white/60";
  const textMuted = isLightTheme ? "text-slate-500" : "text-white/40";

  const heroContainerClass = isLightTheme
    ? "relative mb-8 overflow-hidden rounded-[32px] border border-white/50 shadow-[0_35px_95px_rgba(15,23,42,0.12)] animate-fade-in"
    : "relative mb-8 overflow-hidden rounded-[32px] border border-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] animate-fade-in";

  const heroContainerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(212,225,255,0.88))",
      backdropFilter: "blur(30px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(63,76,119,0.45), rgba(32,18,101,0.75))",
    };

  const newAdButtonClass = isLightTheme
    ? "cursor-pointer px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-fuchsia-400/30 hover:shadow-fuchsia-400/45 active:scale-95 select-none flex items-center gap-2 group"
    : "cursor-pointer px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm transition-all duration-300 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 select-none flex items-center gap-2 group";

  const statsCardClass = isLightTheme
    ? "relative overflow-hidden rounded-[24px] border border-white/50 p-6 bg-white/80 backdrop-blur-2xl shadow-[0_30px_80px_rgba(15,23,42,0.08)] transition-transform hover:scale-[1.02] duration-300"
    : "relative overflow-hidden rounded-[24px] border border-white/5 p-6 bg-[#0f172a]/40 backdrop-blur-md shadow-xl transition-transform hover:scale-[1.02] duration-300";

  const statsLoaded = !mediaStatsLoading;

  const filterCardClass = isLightTheme
    ? "relative overflow-hidden rounded-[24px] border border-white/50 p-5 mb-8 bg-white/85 backdrop-blur-2xl animate-fade-in flex flex-col md:flex-row gap-6 items-center shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
    : "relative overflow-hidden rounded-[24px] border border-white/5 p-5 mb-8 bg-[#0f172a]/30 backdrop-blur-sm animate-fade-in flex flex-col md:flex-row gap-6 items-center";

  const searchInputClass = isLightTheme
    ? "w-full h-12 pr-12 pl-6 rounded-2xl bg-gradient-to-r from-[#f9f0ff]/90 via-[#f1f5ff]/90 to-[#eafafe]/90 border border-[#dcd6ff]/70 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-200 focus:ring-2 focus:ring-violet-100/60 transition-all duration-300 shadow-[inset_0_2px_14px_rgba(148,163,184,0.2)]"
    : "w-full h-12 pr-12 pl-6 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 group-hover:bg-black/30";

  const filterBadgeClass = isLightTheme
    ? "px-4 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-indigo-600 text-xs font-bold shadow-sm"
    : "px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold";

  const tableWrapperClass = isLightTheme
    ? "relative overflow-hidden rounded-[32px] border border-white/50 bg-white/85 backdrop-blur-2xl shadow-[0_35px_90px_rgba(15,23,42,0.1)]"
    : "relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0f172a]/20 backdrop-blur-md shadow-2xl";

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const timeoutId = setTimeout(() => {
      search(query);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  };

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

  const handleSaveEdit = async (id: number, data: { name: string; description: string; isFallback: boolean; type: MediaType; file?: File; durationSeconds?: number }) => {
    await updateMediaAsset(id, data);
  };

  return (
    <div
      className="min-h-screen p-8 max-w-7xl mx-auto relative"
      style={
        isLightTheme
          ? {
          }
          : undefined
      }
    >
      {/* Background Decorative Elements */}
      {!isLightTheme && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-[rgba(79,70,229,0.15)]" />
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full blur-[100px] bg-[rgba(139,92,246,0.12)]" />
          <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] rounded-full blur-[80px] bg-[rgba(59,130,246,0.12)]" />
        </div>
      )}

      {/* Header */}
      <div className={heroContainerClass} style={heroContainerStyle}>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle at top left, rgba(255,255,255,0.65), transparent 50%)"
              : "radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 45%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 blur-3xl opacity-40"
          style={{
            background: isLightTheme
              ? "linear-gradient(180deg, rgba(99,102,241,0.25), rgba(236,72,153,0.2))"
              : "linear-gradient(180deg, rgba(99,102,241,0.6), rgba(14,165,233,0.2))",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 lg:p-8">
          <div>
            <h1 className={`text-3xl lg:text-4xl font-extrabold mb-2 ${textPrimary}`}>
              مكتبة الإعلانات
            </h1>
            <p className={`${textSecondary} text-sm`}>
              إدارة ورفع الوسائط المخصصة لشاشات العرض
            </p>
          </div>

          <button className={newAdButtonClass} onClick={() => setCreateModalOpen(true)}>
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300 ${isLightTheme ? "bg-white/30 text-slate-900" : "bg-white/20 text-white"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            إضافة إعلان جديد
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          {
            label: "الإجمالي",
            value: mediaStats?.totalMedia ?? 0,
            color: "from-blue-500 to-indigo-500",
            accent: "37,99,235",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
          },
          {
            label: "صور",
            value: mediaStats?.totalImages ?? 0,
            color: "from-purple-500 to-fuchsia-500",
            accent: "168,85,247",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: "فيديوهات",
            value: mediaStats?.totalVideos ?? 0,
            color: "from-emerald-500 to-teal-500",
            accent: "16,185,129",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ),
          },
        ].map((s) => (
          <div
            key={s.label}
            className={statsCardClass}
            style=
            {isLightTheme
              ? {
                background: "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(227,233,255,0.9))",
                border: "1px solid rgba(148,163,184,0.35)",
              }
              : undefined}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl -mr-16 -mt-16"
              style={
                isLightTheme
                  ? { background: `radial-gradient(circle, rgba(${s.accent},0.25), transparent 65%)` }
                  : undefined
              }
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className={`${textMuted} text-xs font-bold uppercase tracking-widest mb-1`}>{s.label}</p>
                {statsLoaded ? (
                  <p className={`text-3xl font-black ${textPrimary}`}>{s.value}</p>
                ) : (
                  <div className={`h-10 w-16 rounded-lg animate-pulse ${isLightTheme ? "bg-slate-200/60" : "bg-white/10"}`} />
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isLightTheme ? "" : `bg-gradient-to-br ${s.color} text-white`
                  }`}
                style={
                  isLightTheme
                    ? {
                      background: `linear-gradient(135deg, rgba(${s.accent},0.16), rgba(${s.accent},0.05))`,
                      border: `1px solid rgba(${s.accent},0.25)`,
                      color: `rgb(${s.accent})`,
                    }
                    : undefined
                }
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={filterCardClass}>
        <div className="flex-1 w-full">
          <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-2 ${textMuted}`}>
            البحث في الوسائط
          </label>
          <div className="relative group">
            <input
              className={searchInputClass}
              placeholder="ابحث باستخدام اسم الإعلان"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${isLightTheme ? "text-slate-400" : "text-white/20"
                } group-hover:text-indigo-400 transition-colors duration-300`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        {searchQuery && (
          <div className={filterBadgeClass}>
            {mediaAssets.length} نتيجة مطابقة
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake ${isLightTheme
            ? "bg-rose-50 border border-rose-200 text-rose-700"
            : "bg-rose-500/10 border border-rose-500/20 text-rose-200"
            }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="relative mb-8">
        {loading ? (
          <div
            className="glass p-10 rounded-[32px] overflow-hidden"
            style={
              isLightTheme
                ? {
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(148,163,184,0.3)",
                  backdropFilter: "blur(24px)",
                }
                : undefined
            }
          >
            <TableSkeleton cols={6} rows={8} />
          </div>
        ) : (
          <div className={`${tableWrapperClass} animate-fade-in`}>
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: isLightTheme
                  ? "radial-gradient(circle at bottom right, rgba(99,102,241,0.15), transparent 50%)"
                  : "radial-gradient(circle at bottom right, rgba(99,102,241,0.2), transparent 50%)",
              }}
            />
            <AdList
              advertisements={mediaAssets}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !isSearching && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPreviousPage={previousPage}
          onItemsPerPageChange={changeItemsPerPage}
        />
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
