"use client";

import { useState, useEffect } from "react";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import { extractApiError } from "@/lib/api/client";
import type { MediaAsset } from "@/lib/types/mediaAsset";
import type { MediaSlot, ScreenMediaSlots } from "@/lib/types/screen";

interface MediaSlotAssignmentProps {
  screenId: number;
  clientId: number;
  currentSlots: ScreenMediaSlots | null;
  onUpdate: (slot: MediaSlot, mediaId: number) => Promise<boolean>;
  onRemove: (slot: MediaSlot) => Promise<boolean>;
}

const SLOT_LABELS: Record<MediaSlot, { ar: string; color: string; icon: string }> = {
  Men: {
    ar: "رجال",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "👨",
  },
  Women: {
    ar: "نساء",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    icon: "👩",
  },
  BoysKids: {
    ar: "أطفال ذكور",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: "👦",
  },
  GirlsKids: {
    ar: "أطفال إناث",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: "👧",
  },
  Default: {
    ar: "افتراضي",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    icon: "📺",
  },
};

export default function MediaSlotAssignment({
  screenId,
  clientId,
  currentSlots,
  onUpdate,
  onRemove,
}: MediaSlotAssignmentProps) {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MediaSlot | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMediaAssets();
  }, [clientId]);

  const loadMediaAssets = async () => {
    try {
      setLoading(true);
      const data = await mediaAssetApi.getAll({ clientId });
      setMediaAssets(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const getSlotMedia = (slot: MediaSlot) => {
    if (!currentSlots) return null;
    return currentSlots.mediaSlots.find((s) => s.slot === slot);
  };

  const handleEditSlot = (slot: MediaSlot) => {
    setSelectedSlot(slot);
    const slotMedia = getSlotMedia(slot);
    setSelectedMediaId(slotMedia?.mediaAssetId || null);
    setShowModal(true);
  };

  const handleAssignMedia = async () => {
    if (!selectedSlot || !selectedMediaId) return;

    setUpdating(true);
    setError(null);

    try {
      const success = await onUpdate(selectedSlot, selectedMediaId);
      if (success) {
        setShowModal(false);
        setSelectedSlot(null);
        setSelectedMediaId(null);
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMedia = async (slot: MediaSlot) => {
    if (!confirm(`هل أنت متأكد من إزالة الوسيط من فتحة "${SLOT_LABELS[slot].ar}"؟`)) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await onRemove(slot);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  const allSlotsAssigned = () => {
    if (!currentSlots) return false;
    const slots: MediaSlot[] = ["Men", "Women", "BoysKids", "GirlsKids", "Default"];
    return slots.every((slot) => getSlotMedia(slot) !== undefined);
  };

  const selectedMedia = mediaAssets.find((m) => m.id === selectedMediaId);

  if (loading) {
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

  return (
    <div className="glass p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          محتوى الوسائط حسب فئة الجمهور
        </h3>

        {allSlotsAssigned() ? (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            مكتمل (5/5)
          </span>
        ) : (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            غير مكتمل
          </span>
        )}
      </div>

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

      <div className="space-y-3">
        {(Object.keys(SLOT_LABELS) as MediaSlot[]).map((slot) => {
          const slotMedia = getSlotMedia(slot);
          const config = SLOT_LABELS[slot];

          return (
            <div key={slot} className={`p-4 rounded-xl border ${config.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-0.5">{config.ar}</p>
                    {slotMedia ? (
                      <div className="flex items-center gap-2">
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {slotMedia.mediaAssetName}
                        </p>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold">
                          #{slotMedia.mediaAssetId}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400">لم يتم التعيين</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditSlot(slot)}
                    disabled={updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:bg-white/5 disabled:opacity-50"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {slotMedia ? "تعديل" : "تعيين"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allSlotsAssigned() && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <p className="font-semibold mb-1">⚠️ تنبيه</p>
          <p>يجب تعيين جميع الفتحات الخمس قبل تفعيل الشاشة</p>
        </div>
      )}

      {/* Media Selection Modal */}
      {showModal && selectedSlot && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                اختر وسيط لـ "{SLOT_LABELS[selectedSlot].ar}"
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedMedia && (
              <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                  الوسيط المحدد
                </p>
                <p className="font-bold text-indigo-300">{selectedMedia.name}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  النوع: {selectedMedia.type} • الحجم: {selectedMedia.fileSizeMb.toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {mediaAssets.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    لا توجد وسائط متاحة
                  </p>
                </div>
              ) : (
                mediaAssets.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => setSelectedMediaId(media.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedMediaId === media.id
                        ? "bg-indigo-500/20 border-indigo-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                          {media.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          <span>#{media.id}</span>
                          <span>•</span>
                          <span>{media.type}</span>
                          <span>•</span>
                          <span>{media.fileSizeMb.toFixed(2)} MB</span>
                          {media.resolution && (
                            <>
                              <span>•</span>
                              <span>{media.resolution}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {selectedMediaId === media.id && (
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignMedia}
                disabled={!selectedMediaId || updating}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={{
                  background: selectedMediaId
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "var(--bg-secondary)",
                  color: "white",
                }}
              >
                {updating ? "جاري التعيين..." : "تعيين"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={updating}
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
