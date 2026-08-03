"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import { screenApi } from "@/lib/api/screen.api";
import type { MediaSlot, MediaSlotInfo, ScreenMediaSlots } from "@/lib/types/screen";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface MediaSlotAssignmentProps {
  screenId: number;
  clientId: number;
  currentSlots: ScreenMediaSlots | null;
  onRefresh?: () => void | Promise<void>;
}

const SLOT_LABELS: Record<MediaSlot, { ar: string }> = {
  Men: { ar: "رجال" },
  Women: { ar: "نساء" },
  BoysKids: { ar: "أطفال ذكور" },
  GirlsKids: { ar: "أطفال إناث" },
  Default: { ar: "افتراضي" },
};

const SLOT_THEMES: Record<MediaSlot, {
  lightBackground: string;
  darkBackground: string;
  borderLight: string;
  borderDark: string;
  labelLight: string;
  badgeLight: string;
  badgeDark: string;
  typeBadgeLight: string;
  typeBadgeDark: string;
}> = {
  Men: {
    lightBackground: "linear-gradient(135deg, rgba(191,219,254,0.95), rgba(219,234,254,0.85))",
    darkBackground: "linear-gradient(135deg, rgba(23,37,84,0.85), rgba(15,23,42,0.9))",
    borderLight: "border-blue-200",
    borderDark: "border-blue-500/30",
    labelLight: "text-blue-700",
    badgeLight: "bg-white/80 border-blue-100 text-blue-600",
    badgeDark: "bg-white/5 border-white/10 text-white/70",
    typeBadgeLight: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    typeBadgeDark: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  },
  Women: {
    lightBackground: "linear-gradient(135deg, rgba(252,231,243,0.95), rgba(251,207,232,0.85))",
    darkBackground: "linear-gradient(135deg, rgba(74,29,64,0.9), rgba(46,16,32,0.9))",
    borderLight: "border-pink-200",
    borderDark: "border-pink-500/30",
    labelLight: "text-pink-700",
    badgeLight: "bg-white/80 border-pink-100 text-pink-600",
    badgeDark: "bg-white/5 border-white/10 text-white/70",
    typeBadgeLight: "bg-pink-500/15 text-pink-600 border-pink-500/20",
    typeBadgeDark: "bg-pink-500/20 text-pink-200 border-pink-500/30",
  },
  BoysKids: {
    lightBackground: "linear-gradient(135deg, rgba(187,247,208,0.95), rgba(110,231,183,0.85))",
    darkBackground: "linear-gradient(135deg, rgba(6,95,70,0.9), rgba(15,118,110,0.85))",
    borderLight: "border-emerald-200",
    borderDark: "border-emerald-500/30",
    labelLight: "text-emerald-700",
    badgeLight: "bg-white/80 border-emerald-100 text-emerald-600",
    badgeDark: "bg-white/5 border-white/10 text-white/70",
    typeBadgeLight: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    typeBadgeDark: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  },
  GirlsKids: {
    lightBackground: "linear-gradient(135deg, rgba(233,213,255,0.95), rgba(216,180,254,0.85))",
    darkBackground: "linear-gradient(135deg, rgba(76,29,149,0.85), rgba(46,16,101,0.85))",
    borderLight: "border-purple-200",
    borderDark: "border-purple-500/30",
    labelLight: "text-purple-700",
    badgeLight: "bg-white/80 border-purple-100 text-purple-600",
    badgeDark: "bg-white/5 border-white/10 text-white/70",
    typeBadgeLight: "bg-purple-500/15 text-purple-600 border-purple-500/20",
    typeBadgeDark: "bg-purple-500/20 text-purple-200 border-purple-500/30",
  },
  Default: {
    lightBackground: "linear-gradient(135deg, rgba(226,232,240,0.95), rgba(203,213,225,0.85))",
    darkBackground: "linear-gradient(135deg, rgba(51,65,85,0.85), rgba(15,23,42,0.85))",
    borderLight: "border-slate-200",
    borderDark: "border-slate-500/30",
    labelLight: "text-slate-700",
    badgeLight: "bg-white/80 border-slate-100 text-slate-600",
    badgeDark: "bg-white/5 border-white/10 text-white/70",
    typeBadgeLight: "bg-slate-500/15 text-slate-600 border-slate-500/20",
    typeBadgeDark: "bg-slate-500/20 text-slate-200 border-slate-500/30",
  },
};

export default function MediaSlotAssignment({ screenId, clientId, currentSlots, onRefresh }: MediaSlotAssignmentProps) {
  const isLoading = !currentSlots;
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [editingSlot, setEditingSlot] = useState<MediaSlot | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaAssetsLoading, setMediaAssetsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Fetch media assets when modal opens
  useEffect(() => {
    if (editingSlot && clientId) {
      const fetchMediaAssets = async () => {
        try {
          setMediaAssetsLoading(true);
          const assets = await mediaAssetApi.getAll({ clientId });
          setMediaAssets(assets);
        } catch (err) {
        } finally {
          setMediaAssetsLoading(false);
        }
      };
      fetchMediaAssets();
    }
  }, [editingSlot, clientId]);

  const handleEditSlot = (slot: MediaSlot) => {
    setEditingSlot(slot);
  };

  const handleCloseModal = () => {
    setEditingSlot(null);
    setMediaAssets([]);
  };

  const handleAssignMedia = async (mediaAssetId: number) => {
    if (!editingSlot) return;
    try {
      setAssigning(true);
      await screenApi.assignMediaSlot(screenId, editingSlot, mediaAssetId);
      // Refresh the media slots data only
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
    } finally {
      setAssigning(false);
      handleCloseModal();
    }
  };

  const getSlotMedia = (slot: MediaSlot) => {
    if (!currentSlots) return null;
    return currentSlots.mediaSlots.find((s) => s.slot === slot);
  };

  const assignedCount = currentSlots ? currentSlots.mediaSlots.filter(Boolean).length : 0;
  const screenStatus = currentSlots?.screenStatus || "—";

  const allSlotsAssigned = () => {
    if (!currentSlots) return false;
    const slots: MediaSlot[] = ["Men", "Women", "BoysKids", "GirlsKids", "Default"];
    return slots.every((slot) => getSlotMedia(slot) !== undefined);
  };

  const openMediaPreview = (mediaId?: number) => {
    if (!mediaId) return;
    window.open(`/media-assets/${mediaId}`, "_blank", "noopener,noreferrer");
  };

  const SlotMediaPreview = ({ media }: { media: MediaSlotInfo }) => {
    const [loaded, setLoaded] = useState(false);
    const isVideo = media.mediaAssetType === "Video";

    return (
      <button
        type="button"
        onClick={() => openMediaPreview(media.mediaAssetId)}
        className={`relative w-20 h-20 rounded-2xl overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isVideo
          ? isLightTheme
            ? "border-fuchsia-200 bg-fuchsia-50"
            : "border-fuchsia-400/30 bg-fuchsia-500/10"
          : isLightTheme
            ? "border-indigo-100 bg-white"
            : "border-white/15 bg-white/5"
          }`}
        title="عرض الوسيط"
      >
        {isVideo ? (
          <video
            src={media.mediaAssetUrl}
            muted
            playsInline
            preload="metadata"
            loop
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <img
            src={media.mediaAssetUrl}
            alt={media.mediaAssetName}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        )}

        {!loaded && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.35em] uppercase ${isLightTheme ? "text-slate-500 bg-white/80" : "text-white/80 bg-slate-900/70"
              }`}
          >
            load
            <span
              className={`block w-8 h-0.5 animate-pulse ${isLightTheme ? "bg-slate-400/60" : "bg-white/30"}`}
            />
          </div>
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="glass p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const containerClass = `relative overflow-hidden rounded-[32px] border p-6 lg:p-8 shadow-2xl animate-fade-in ${isLightTheme ? "border-white/60 shadow-[0_35px_95px_rgba(15,23,42,0.08)]" : "border-white/5"
    }`;
  const containerStyle = isLightTheme
    ? {
      background: "linear-gradient(135deg, rgba(240,247,255,0.95), rgba(230,245,255,0.9))",
      backdropFilter: "blur(22px)",
    }
    : {
      background: "linear-gradient(135deg, rgba(15,23,42,1), rgba(22,13,46,0.85))",
    };

  return (
    <div className={containerClass} style={containerStyle}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: isLightTheme
            ? "radial-gradient(circle at bottom left, rgba(186,230,253,0.35), transparent 60%)"
            : "radial-gradient(circle at bottom left, rgba(99,102,241,0.2), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className={`text-2xl font-extrabold flex items-center gap-3 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
            <div
              className={`p-2.5 rounded-2xl border ${isLightTheme ? "bg-white/75 text-indigo-500 border-white/80" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/20"
                }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            محتوى الوسائط حسب فئة الجمهور
          </h3>
          <p className={`text-sm mt-1 mr-14 ${isLightTheme ? "text-slate-500" : "text-white/40"}`}>
            قائمة الإعلانات المخصصة لكل فئة مستهدفة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${allSlotsAssigned()
              ? isLightTheme
                ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : isLightTheme
                ? "bg-amber-50 border border-amber-200 text-amber-600"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              }`}
          >
            {allSlotsAssigned() ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold tracking-wide">مكتمل (5/5)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-bold tracking-wide">غير مكتمل</span>
              </div>
            )}
          </div>




        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(Object.keys(SLOT_LABELS) as MediaSlot[]).map((slot) => {
          const slotMedia = getSlotMedia(slot);
          const config = SLOT_LABELS[slot];

          return (
            <div
              key={slot}
              className={`relative overflow-hidden group rounded-[28px] border transition-all duration-500 ${isLightTheme ? SLOT_THEMES[slot].borderLight : SLOT_THEMES[slot].borderDark
                }`}
              style={{
                background: isLightTheme ? SLOT_THEMES[slot].lightBackground : SLOT_THEMES[slot].darkBackground,
              }}
            >
              <div className="absolute inset-y-0 right-0 w-1/2 opacity-30 blur-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent)" }} />
              <div className="relative z-10 flex items-center gap-5 p-4">
                <div className="shrink-0">
                  {slotMedia ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <SlotMediaPreview media={slotMedia} />
                    </div>
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 ${isLightTheme
                        ? "border-indigo-100 bg-white text-slate-300"
                        : "border-white/10 bg-black/20 text-white/20"
                        }`}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] font-bold">EMPTY</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1.5">
                    <p
                      className={`text-lg font-bold transition-colors ${isLightTheme ? SLOT_THEMES[slot].labelLight : "text-white"
                        }`}
                    >
                      {config.ar}
                    </p>
                  </div>

                  {slotMedia ? (
                    <p
                      className={`text-sm font-medium truncate mr-12 px-3 py-1 rounded-lg border inline-block ${isLightTheme ? SLOT_THEMES[slot].badgeLight : SLOT_THEMES[slot].badgeDark
                        }`}
                    >
                      {slotMedia.mediaAssetName}
                    </p>
                  ) : (
                    <p
                      className={`text-xs font-bold mr-12 uppercase tracking-wider italic ${isLightTheme ? "text-amber-600" : "text-amber-500/80"
                        }`}
                    >
                      Pending Assignment
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  {slotMedia && (
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg ${slotMedia.mediaAssetType === "Image"
                      ? isLightTheme
                        ? "bg-blue-100 text-blue-600 border border-blue-200"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : isLightTheme
                        ? "bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200"
                        : "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
                      }`}>
                      {slotMedia.mediaAssetType === "Image" ? "Image" : "Video"}
                    </span>
                  )}
                  <button
                    onClick={() => handleEditSlot(slot)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-md ${isLightTheme
                      ? SLOT_THEMES[slot].typeBadgeLight
                      : SLOT_THEMES[slot].typeBadgeDark
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allSlotsAssigned() && (
        <div
          className={`mt-8 p-5 rounded-[24px] border flex items-center gap-4 animate-pulse ${isLightTheme
            ? "bg-gradient-to-r from-amber-100 to-transparent border-amber-200"
            : "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20"
            }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isLightTheme ? "bg-amber-100 text-amber-600" : "bg-amber-500/20 text-amber-400"
              }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className={`font-bold ${isLightTheme ? "text-amber-700" : "text-amber-200"}`}>إعدادات الشاشة غير مكتملة</p>
            <p className={`text-xs mt-0.5 ${isLightTheme ? "text-amber-600" : "text-amber-500/70"}`}>
              يجب تخصيص وسائط لجميع فئات الجمهور لضمان أفضل أداء للتحليل الذكي.
            </p>
          </div>
        </div>
      )}

      {/* Media Selection Modal */}
      {editingSlot && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backdropFilter: "blur(18px)",
            background: isLightTheme ? "rgba(248,250,252,0.8)" : "rgba(3,7,18,0.75)",
          }}
        >
          <div
            className={`w-full max-w-2xl max-h-[80vh] rounded-[28px] p-6 animate-fade-in border overflow-hidden flex flex-col ${isLightTheme
              ? "border-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.15)]"
              : "border-white/5"
              }`}
            style={
              isLightTheme
                ? {
                  background: "linear-gradient(150deg, rgba(255,255,255,0.95), rgba(235,242,255,0.92))",
                }
                : {
                  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                }
            }
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                اختيار إعلان لـ {SLOT_LABELS[editingSlot].ar}
              </h2>
              <button
                onClick={handleCloseModal}
                className={`p-2 rounded-xl transition-all ${isLightTheme
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
              {mediaAssetsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-20 rounded-xl ${isLightTheme ? "bg-slate-200/60" : "bg-white/5"} animate-pulse`} />
                  ))}
                </div>
              ) : mediaAssets.length === 0 ? (
                <div className="text-center py-12">
                  <p className={isLightTheme ? "text-slate-500" : "text-white/40"}>
                    لا توجد إعلانات متاحة
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediaAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleAssignMedia(asset.id)}
                      disabled={assigning}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${isLightTheme
                        ? "bg-white/80 border-slate-200 hover:border-indigo-300 hover:shadow-md"
                        : "bg-white/5 border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/10"
                        } ${assigning ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {asset.type === "Video" ? (
                          <div className={`w-full h-full flex items-center justify-center ${isLightTheme ? "bg-fuchsia-100" : "bg-fuchsia-500/20"}`}>
                            <svg className="w-6 h-6 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        ) : (
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                          {asset.name}
                        </p>
                        <p className={`text-sm ${isLightTheme ? "text-slate-500" : "text-white/60"}`}>
                          {asset.description || "بدون وصف"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${asset.type === "Image"
                          ? isLightTheme
                            ? "bg-blue-100 text-blue-600"
                            : "bg-blue-500/20 text-blue-300"
                          : isLightTheme
                            ? "bg-fuchsia-100 text-fuchsia-600"
                            : "bg-fuchsia-500/20 text-fuchsia-300"
                          }`}>
                          {asset.type === "Image" ? "صورة" : "فيديو"}
                        </span>
                        <svg className={`w-5 h-5 ${isLightTheme ? "text-indigo-500" : "text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLightTheme
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
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
