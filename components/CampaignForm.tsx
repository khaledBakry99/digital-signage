"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import type { Campaign, CampaignStatus, CreateCampaignInput, DayOfWeek } from "@/lib/types/campaign";
import { useMediaAssets } from "@/lib/hooks/useMediaAssets";
import { useTheme } from "@/lib/context/ThemeContext";
import MediaSearchInput from "@/components/MediaSearchInput";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import type { MediaAsset } from "@/lib/types/mediaAsset";

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const DAYS_ARABIC: Record<DayOfWeek, string> = {
  Sunday: 'الأحد',
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

type AllowedFormStatus = Extract<CampaignStatus, "Active" | "Paused" | "Completed">;

interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: CreateCampaignInput) => void;
  onCancel?: () => void;
  clientId: number;
}

export default function CampaignForm({ campaign, onSubmit, onCancel, clientId }: CampaignFormProps) {
  const { mediaAssets, loading: mediaAssetsLoading } = useMediaAssets({ clientId });
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const [name, setName] = useState(campaign?.name || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Track field-specific errors
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Character limits
  const NAME_MAX_LENGTH = 40;
  const DESCRIPTION_MAX_LENGTH = 100;
  const ALLOWED_STATUSES: AllowedFormStatus[] = ['Active', 'Paused', 'Completed'];
  const initialStatus: AllowedFormStatus = (campaign?.status && ALLOWED_STATUSES.includes(campaign.status as AllowedFormStatus)
    ? (campaign.status as AllowedFormStatus)
    : 'Active');
  const [status, setStatus] = useState<AllowedFormStatus>(initialStatus);
  const [priority, setPriority] = useState(campaign?.priority || 1);
  const [startsAtUtc, setStartsAtUtc] = useState(
    campaign?.startsAtUtc ? new Date(campaign.startsAtUtc).toISOString().slice(0, 10) : ""
  );
  const [endsAtUtc, setEndsAtUtc] = useState(
    campaign?.endsAtUtc ? new Date(campaign.endsAtUtc).toISOString().slice(0, 10) : ""
  );
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(campaign?.daysOfWeek || []);
  const [dayStartsAt, setDayStartsAt] = useState(
    campaign?.dayStartsAt ? campaign.dayStartsAt.slice(0, 5) : "00:00"
  );
  const [dayEndsAt, setDayEndsAt] = useState(
    campaign?.dayEndsAt ? campaign.dayEndsAt.slice(0, 5) : "23:59"
  );
  const [boysKidsMediaAssetId, setBoysKidsMediaAssetId] = useState(campaign?.boysKidsMediaAssetId || 0);
  const [girlsKidsMediaAssetId, setGirlsKidsMediaAssetId] = useState(campaign?.girlsKidsMediaAssetId || 0);
  const [menMediaAssetId, setMenMediaAssetId] = useState(campaign?.menMediaAssetId || 0);
  const [womenMediaAssetId, setWomenMediaAssetId] = useState(campaign?.womenMediaAssetId || 0);
  const [defaultMediaAssetId, setDefaultMediaAssetId] = useState(campaign?.defaultMediaAssetId || 0);

  const handleDayToggle = (day: DayOfWeek) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Scroll to field and highlight it
  const scrollToField = (ref: React.RefObject<HTMLElement | null>, fieldName: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setFieldErrors(prev => ({ ...prev, [fieldName]: "هذا الحقل مطلوب" }));
  };

  const getUtcDateWithCurrentTime = (dateStr: string): string => {
    try {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const day = Number(dayStr);
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        throw new Error('Invalid date');
      }
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
    } catch {
      return new Date(dateStr).toISOString();
    }
  };

  const getIsoDateTimeFromTime = (timeStr: string): string => {
    try {
      const [hoursStr, minutesStr] = timeStr.split(':');
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        throw new Error('Invalid time');
      }
      return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0)).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    setFieldErrors({});
    
    if (!name.trim()) {
      scrollToField(nameInputRef, 'name');
      return;
    }
    
    if (!description.trim()) {
      scrollToField(descriptionInputRef, 'description');
      return;
    }

    const data: CreateCampaignInput = {
      clientId,
      name,
      description,
      status,
      startsAtUtc: getUtcDateWithCurrentTime(startsAtUtc),
      endsAtUtc: getUtcDateWithCurrentTime(endsAtUtc),
      priority,
      daysOfWeek,
      dayStartsAt: getIsoDateTimeFromTime(dayStartsAt),
      dayEndsAt: getIsoDateTimeFromTime(dayEndsAt),
      boysKidsMediaAssetId,
      girlsKidsMediaAssetId,
      menMediaAssetId,
      womenMediaAssetId,
      defaultMediaAssetId,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="glass p-6 space-y-5">
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          المعلومات الأساسية
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            اسم الحملة *
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= NAME_MAX_LENGTH) {
                setName(value);
                setFieldErrors(prev => ({ ...prev, name: "" }));
              }
            }}
            className={`input-dark ${fieldErrors.name ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            style={isLightTheme && fieldErrors.name ? {
              backgroundColor: "#ffffff",
              border: "1px solid #ef4444",
              color: "#0f172a",
            } : undefined}
            placeholder="أدخل اسم الحملة"
            required
            maxLength={NAME_MAX_LENGTH}
          />
          {/* Character counter */}
          <div className={`text-xs mt-1 text-left ${name.length >= NAME_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            {name.length} / {NAME_MAX_LENGTH}
          </div>
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            الوصف *
          </label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= DESCRIPTION_MAX_LENGTH) {
                setDescription(value);
                setFieldErrors(prev => ({ ...prev, description: "" }));
              }
            }}
            className={`input-dark ${fieldErrors.description ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            style={isLightTheme && fieldErrors.description ? {
              backgroundColor: "#ffffff",
              border: "1px solid #ef4444",
              color: "#0f172a",
            } : undefined}
            rows={3}
            placeholder="وصف الحملة..."
            required
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
          {/* Character counter */}
          <div className={`text-xs mt-1 text-left ${description.length >= DESCRIPTION_MAX_LENGTH ? 'text-red-500 font-semibold' : isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            {description.length} / {DESCRIPTION_MAX_LENGTH}
          </div>
          {fieldErrors.description && (
            <p className="text-red-500 text-xs mt-1 animate-fade-in">{fieldErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              حالة الحملة *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AllowedFormStatus)}
              className="input-dark cursor-pointer"
              required
            >
              <option value="Active">نشطة</option>
              <option value="Paused">متوقفة مؤقتًا</option>
              <option value="Completed">مكتملة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              أولوية الحملة * <span className="text-xs font-normal opacity-70">(الرقم الأكبر يُعرض أولاً)</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="input-dark cursor-pointer"
              required
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Schedule */}
      <div className="glass p-6 space-y-5">
        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          الجدولة
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              تاريخ البداية *
            </label>
            <input
              type="date"
              value={startsAtUtc}
              onChange={(e) => setStartsAtUtc(e.target.value)}
              className="input-dark cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              تاريخ النهاية *
            </label>
            <input
              type="date"
              value={endsAtUtc}
              onChange={(e) => setEndsAtUtc(e.target.value)}
              className="input-dark cursor-pointer"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
            أيام الأسبوع
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className="rounded-xl py-3 text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  background: daysOfWeek.includes(day)
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))"
                    : "var(--bg-secondary)",
                  color: daysOfWeek.includes(day) ? "#818cf8" : "var(--text-muted)",
                  border: `1.5px solid ${daysOfWeek.includes(day) ? "rgba(99, 102, 241, 0.4)" : "var(--border)"}`,
                }}
              >
                {DAYS_ARABIC[day]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              وقت البداية اليومي
            </label>
            <input
              type="time"
              value={dayStartsAt}
              onChange={(e) => setDayStartsAt(e.target.value)}
              className="input-dark cursor-pointer"
              style={{ cursor: 'pointer' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              وقت النهاية اليومي
            </label>
            <input
              type="time"
              value={dayEndsAt}
              onChange={(e) => setDayEndsAt(e.target.value)}
              className="input-dark cursor-pointer"
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        <style jsx global>{`
          input[type="time"]::-webkit-calendar-picker-indicator {
            cursor: pointer !important;
            filter: ${isLightTheme ? 'invert(0)' : 'invert(1)'};
          }
        `}</style>
      </div>

      {/* Media Assets */}
      <MediaSlotSelector
        boysKidsMediaAssetId={boysKidsMediaAssetId}
        setBoysKidsMediaAssetId={setBoysKidsMediaAssetId}
        girlsKidsMediaAssetId={girlsKidsMediaAssetId}
        setGirlsKidsMediaAssetId={setGirlsKidsMediaAssetId}
        menMediaAssetId={menMediaAssetId}
        setMenMediaAssetId={setMenMediaAssetId}
        womenMediaAssetId={womenMediaAssetId}
        setWomenMediaAssetId={setWomenMediaAssetId}
        defaultMediaAssetId={defaultMediaAssetId}
        setDefaultMediaAssetId={setDefaultMediaAssetId}
        mediaAssets={mediaAssets}
        mediaAssetsLoading={mediaAssetsLoading}
        clientId={clientId}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            إلغاء
          </button>
        )}
        <button type="submit" className="btn-primary">
          {campaign ? "تحديث الحملة" : "إنشاء الحملة"}
        </button>
      </div>
    </form>
  );
}

type MediaSlot = "Men" | "Women" | "BoysKids" | "GirlsKids" | "Default";

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

interface MediaSlotSelectorProps {
  boysKidsMediaAssetId: number;
  setBoysKidsMediaAssetId: (id: number) => void;
  girlsKidsMediaAssetId: number;
  setGirlsKidsMediaAssetId: (id: number) => void;
  menMediaAssetId: number;
  setMenMediaAssetId: (id: number) => void;
  womenMediaAssetId: number;
  setWomenMediaAssetId: (id: number) => void;
  defaultMediaAssetId: number;
  setDefaultMediaAssetId: (id: number) => void;
  mediaAssets: MediaAsset[];
  mediaAssetsLoading: boolean;
  clientId: number;
}

function MediaSlotSelector({
  boysKidsMediaAssetId,
  setBoysKidsMediaAssetId,
  girlsKidsMediaAssetId,
  setGirlsKidsMediaAssetId,
  menMediaAssetId,
  setMenMediaAssetId,
  womenMediaAssetId,
  setWomenMediaAssetId,
  defaultMediaAssetId,
  setDefaultMediaAssetId,
  mediaAssets,
  mediaAssetsLoading,
  clientId,
}: MediaSlotSelectorProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [editingSlot, setEditingSlot] = useState<MediaSlot | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAssets, setFilteredAssets] = useState<MediaAsset[]>(mediaAssets);
  const [isSearching, setIsSearching] = useState(false);

  // Search function using API only
  const searchMediaAssets = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await mediaAssetApi.search({
        clientId,
        name: query,
      });
      setFilteredAssets(results);
    } catch (err) {
      console.error("Search error:", err);
      setFilteredAssets([]);
    } finally {
      setIsSearching(false);
    }
  }, [clientId]);

  // Handle search with debounce
  useEffect(() => {
    if (!editingSlot) return;

    const timeoutId = setTimeout(() => {
      searchMediaAssets(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, editingSlot, searchMediaAssets]);

  const displayedAssets = searchQuery.trim() ? filteredAssets : mediaAssets;

  const handleEditSlot = (slot: MediaSlot) => {
    setSearchQuery("");
    setFilteredAssets(mediaAssets);
    setEditingSlot(slot);
  };

  const handleCloseModal = () => {
    setEditingSlot(null);
    setSearchQuery("");
    setFilteredAssets(mediaAssets);
  };

  const handleAssignMedia = (mediaAssetId: number) => {
    if (!editingSlot) return;

    setAssigning(true);

    switch (editingSlot) {
      case "Men":
        setMenMediaAssetId(mediaAssetId);
        break;
      case "Women":
        setWomenMediaAssetId(mediaAssetId);
        break;
      case "BoysKids":
        setBoysKidsMediaAssetId(mediaAssetId);
        break;
      case "GirlsKids":
        setGirlsKidsMediaAssetId(mediaAssetId);
        break;
      case "Default":
        setDefaultMediaAssetId(mediaAssetId);
        break;
    }

    setAssigning(false);
    handleCloseModal();
  };

  const getSlotMediaId = (slot: MediaSlot): number => {
    switch (slot) {
      case "Men":
        return menMediaAssetId;
      case "Women":
        return womenMediaAssetId;
      case "BoysKids":
        return boysKidsMediaAssetId;
      case "GirlsKids":
        return girlsKidsMediaAssetId;
      case "Default":
        return defaultMediaAssetId;
    }
  };

  const getSlotMedia = (slot: MediaSlot): MediaAsset | null => {
    const mediaId = getSlotMediaId(slot);
    if (!mediaId) return null;
    return mediaAssets.find((asset) => asset.id === mediaId) || null;
  };

  const SlotMediaPreview = ({ media }: { media: MediaAsset }) => {
    const [loaded, setLoaded] = useState(false);
    const isVideo = media.type === "Video";

    return (
      <div
        className={`relative w-20 h-20 rounded-2xl overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isVideo
          ? isLightTheme
            ? "border-fuchsia-200 bg-fuchsia-50"
            : "border-fuchsia-400/30 bg-fuchsia-500/10"
          : isLightTheme
            ? "border-indigo-100 bg-white"
            : "border-white/15 bg-white/5"
          }`}
        title="معاينة الوسيط"
      >
        {isVideo ? (
          <video
            src={media.url}
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
            src={media.url}
            alt={media.name}
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
              className={`block w-8 h-0.5 animate-pulse ${isLightTheme ? "bg-slate-400/60" : "bg-white/30"
                }`}
            />
          </div>
        )}
      </div>
    );
  };

  const allSlotsAssigned = () => {
    return boysKidsMediaAssetId > 0 && girlsKidsMediaAssetId > 0 && menMediaAssetId > 0 && womenMediaAssetId > 0 && defaultMediaAssetId > 0;
  };

  if (mediaAssetsLoading) {
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            الإعلانات المرتبطة
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
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
              <div
                className="absolute inset-y-0 right-0 w-1/2 opacity-30 blur-2xl"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent)" }}
              />
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
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
                      {slotMedia.name}
                    </p>
                  ) : (
                    <p
                      className={`text-xs font-bold mr-12 uppercase tracking-wider italic ${isLightTheme ? "text-amber-600" : "text-amber-500/80"
                        }`}
                    >
                      في انتظار التعيين

                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  {slotMedia && (
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg ${slotMedia.type === "Image"
                        ? isLightTheme
                          ? "bg-blue-100 text-blue-600 border border-blue-200"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : isLightTheme
                          ? "bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200"
                          : "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
                        }`}
                    >
                      {slotMedia.type === "Image" ? "Image" : "Video"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEditSlot(slot)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-md ${isLightTheme ? SLOT_THEMES[slot].typeBadgeLight : SLOT_THEMES[slot].typeBadgeDark
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className={`font-bold ${isLightTheme ? "text-amber-700" : "text-amber-200"}`}>إعدادات الحملة غير مكتملة</p>
            <p className={`text-xs mt-0.5 ${isLightTheme ? "text-amber-600" : "text-amber-500/70"}`}>
              يجب تخصيص وسائط لجميع فئات الجمهور لضمان أفضل أداء للحملة.
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
            className={`w-full max-w-2xl max-h-[80vh] rounded-[28px] p-6 animate-fade-in border overflow-hidden flex flex-col ${isLightTheme ? "border-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.15)]" : "border-white/5"
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

            {/* Search Input */}
            <div className="mb-4">
              <MediaSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="ابحث باستخدام اسم الإعلان..."
              />
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
              {isSearching ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-20 rounded-xl ${isLightTheme ? "bg-slate-200/60" : "bg-white/5"} animate-pulse`} />
                  ))}
                </div>
              ) : displayedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <p className={isLightTheme ? "text-slate-500" : "text-white/40"}>
                    {searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد إعلانات متاحة"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleAssignMedia(asset.id)}
                      disabled={assigning}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${isLightTheme
                        ? "bg-white/80 border-slate-200 hover:border-indigo-300 hover:shadow-md"
                        : "bg-white/5 border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/10"
                        } ${assigning ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {asset.type === "Video" ? (
                          <div
                            className={`w-full h-full flex items-center justify-center ${isLightTheme ? "bg-fuchsia-100" : "bg-fuchsia-500/20"
                              }`}
                          >
                            <svg className="w-6 h-6 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>{asset.name}</p>
                        <p className={`text-sm ${isLightTheme ? "text-slate-500" : "text-white/60"}`}>
                          {asset.description || "بدون وصف"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${asset.type === "Image"
                            ? isLightTheme
                              ? "bg-blue-100 text-blue-600"
                              : "bg-blue-500/20 text-blue-300"
                            : isLightTheme
                              ? "bg-fuchsia-100 text-fuchsia-600"
                              : "bg-fuchsia-500/20 text-fuchsia-300"
                            }`}
                        >
                          {asset.type === "Image" ? "صورة" : "فيديو"}
                        </span>
                        <svg
                          className={`w-5 h-5 ${isLightTheme ? "text-indigo-500" : "text-indigo-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                type="button"
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
