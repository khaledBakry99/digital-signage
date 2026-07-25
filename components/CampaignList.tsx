"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, MouseEvent } from "react";
import type { Campaign, CampaignStatus } from "@/lib/types/campaign";
import { useTheme } from "@/lib/context/ThemeContext";

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
  onStatusChange?: (campaign: Campaign, status: "Active" | "Paused" | "Completed") => Promise<void> | void;
}

interface CampaignStatusCellProps {
  campaign: Campaign;
  disabled?: boolean;
  changing: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (event: MouseEvent<HTMLButtonElement>) => void;
  onCloseMenu: () => void;
  onSelectStatus: (status: MutableStatus) => Promise<void> | void;
}

function CampaignStatusCell({ campaign, disabled, changing, isMenuOpen, onToggleMenu, onCloseMenu, onSelectStatus }: CampaignStatusCellProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [hoveredOption, setHoveredOption] = useState<MutableStatus | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const endsAt = new Date(campaign.endsAtUtc).getTime();
  const isExpired = !Number.isNaN(endsAt) && endsAt < Date.now();

  const derivedStatus = useMemo<MutableStatus>(() => {
    if (isExpired) {
      return "Completed";
    }
    if (MUTABLE_SET.has(campaign.status as MutableStatus)) {
      return campaign.status as MutableStatus;
    }
    return "Active";
  }, [campaign.status, isExpired]);

  const badge = STATUS_BADGES[derivedStatus];
  const isLocked = disabled || isExpired;

  useEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition(null);
      setHoveredOption(null);
    }
  }, [isMenuOpen]);

  if (isExpired) {
    return (
      <div className="inline-flex items-center w-full">
        <div
          className="w-full rounded-[18px] px-4 py-2 text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.18), rgba(239,68,68,0.12))",
            color: "#f87171",
            border: "1px solid rgba(248,113,113,0.4)",
          }}
        >
          انتهى تاريخ الحملة
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          if (disabled) return;
          if (!isMenuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
              top: rect.bottom + 8,
              left: rect.right - 160,
            });
          }
          onToggleMenu(event);
        }}
        ref={buttonRef}
        className="w-full flex items-center justify-between rounded-[18px] px-4 py-2 text-sm font-semibold transition-all"
        style={{
          background: badge.background,
          color: badge.color,
          border: `1px solid ${badge.border}`,
          opacity: changing ? 0.6 : 1,
        }}
      >
        <span>{STATUS_LABELS[derivedStatus]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isMenuOpen && menuPosition && typeof document !== "undefined"
        ? createPortal(
          <div
            className="fixed w-44 rounded-2xl shadow-2xl border backdrop-blur-lg p-3 z-50"
            style={{
              background: isLightTheme ? "rgba(255,255,255,0.98)" : "rgba(6, 11, 25, 0.95)",
              borderColor: isLightTheme ? "rgba(226,232,255,0.6)" : "rgba(255,255,255,0.08)",
              boxShadow: isLightTheme ? "0 25px 60px rgba(15,23,42,0.2)" : undefined,
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <div className="flex flex-col gap-1">
              {MUTABLE_STATUSES.map((option) => {
                const optionBadge = STATUS_BADGES[option.value];
                const isActive = option.value === derivedStatus;
                const isHovered = hoveredOption === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-right text-sm font-semibold rounded-xl px-4 py-2 transition-all"
                    style={{
                      color: isActive || isHovered
                        ? optionBadge.color
                        : isLightTheme
                          ? "#475569"
                          : "var(--text-secondary)",
                      background: isActive || isHovered
                        ? optionBadge.background
                        : isLightTheme
                          ? "rgba(241,245,255,0.9)"
                          : "transparent",
                    }}
                    onMouseEnter={() => setHoveredOption(option.value)}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={async () => {
                      await onSelectStatus(option.value);
                      onCloseMenu();
                      setMenuPosition(null);
                      setHoveredOption(null);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  Draft: "مسودة",
  Ready: "جاهزة",
  Scheduled: "مجدولة",
  Active: "نشطة",
  Paused: "متوقفة",
  Completed: "مكتملة",
};

type MediaField = "boysKidsMediaAssetId" | "girlsKidsMediaAssetId" | "menMediaAssetId" | "womenMediaAssetId" | "defaultMediaAssetId";

const MEDIA_VARIANTS: {
  key: MediaField;
  label: string;
  tones: Record<"light" | "dark", CSSProperties>;
}[] = [
    {
      key: "boysKidsMediaAssetId",
      label: "أولاد",
      tones: {
        light: {
          background: "linear-gradient(120deg, rgba(219,234,254,0.95), rgba(191,219,254,0.9))",
          color: "#1d4ed8",
          border: "1px solid rgba(147,197,253,0.8)",
        },
        dark: {
          background: "rgba(37,99,235,0.18)",
          color: "#93c5fd",
          border: "1px solid rgba(96,165,250,0.3)",
        },
      },
    },
    {
      key: "girlsKidsMediaAssetId",
      label: "بنات",
      tones: {
        light: {
          background: "linear-gradient(120deg, rgba(252,231,243,0.95), rgba(248,218,253,0.9))",
          color: "#be185d",
          border: "1px solid rgba(244,114,182,0.5)",
        },
        dark: {
          background: "rgba(236,72,153,0.18)",
          color: "#fbcfe8",
          border: "1px solid rgba(236,72,153,0.35)",
        },
      },
    },
    {
      key: "menMediaAssetId",
      label: "رجال",
      tones: {
        light: {
          background: "linear-gradient(120deg, rgba(224,231,255,0.95), rgba(199,210,254,0.9))",
          color: "#4338ca",
          border: "1px solid rgba(165,180,252,0.8)",
        },
        dark: {
          background: "rgba(99,102,241,0.2)",
          color: "#c7d2fe",
          border: "1px solid rgba(99,102,241,0.35)",
        },
      },
    },
    {
      key: "womenMediaAssetId",
      label: "نساء",
      tones: {
        light: {
          background: "linear-gradient(120deg, rgba(250,232,255,0.95), rgba(238,216,255,0.9))",
          color: "#7e22ce",
          border: "1px solid rgba(216,180,254,0.7)",
        },
        dark: {
          background: "rgba(168,85,247,0.2)",
          color: "#e9d5ff",
          border: "1px solid rgba(168,85,247,0.4)",
        },
      },
    },
    {
      key: "defaultMediaAssetId",
      label: "افتراضي",
      tones: {
        light: {
          background: "linear-gradient(120deg, rgba(248,250,252,0.95), rgba(237,242,247,0.9))",
          color: "#334155",
          border: "1px solid rgba(148,163,184,0.6)",
        },
        dark: {
          background: "rgba(148,163,184,0.15)",
          color: "#cbd5f5",
          border: "1px solid rgba(100,116,139,0.35)",
        },
      },
    },
  ];

type MutableStatus = "Active" | "Paused" | "Completed";

const MUTABLE_STATUSES: { value: MutableStatus; label: string; badge: string }[] = [
  { value: "Active", label: "نشطة", badge: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))" },
  { value: "Paused", label: "متوقفة", badge: "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))" },
  { value: "Completed", label: "مكتملة", badge: "linear-gradient(135deg, rgba(148,163,184,0.25), rgba(71,85,105,0.15))" },
];

const MUTABLE_SET = new Set<MutableStatus>(["Active", "Paused", "Completed"]);

const STATUS_BADGES: Record<MutableStatus, { background: string; color: string; border: string }> = {
  Active: {
    background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.12))",
    color: "#34d399",
    border: "rgba(34,197,94,0.35)",
  },
  Paused: {
    background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.12))",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.35)",
  },
  Completed: {
    background: "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(71,85,105,0.12))",
    color: "#cbd5f5",
    border: "rgba(148,163,184,0.35)",
  },
};

export default function CampaignList({ campaigns, onEdit, onDelete, onStatusChange }: CampaignListProps) {
  const [changingId, setChangingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const tableWrapperClass = isLightTheme
    ? "relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_35px_95px_rgba(15,23,42,0.12)]"
    : "relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.45)]";

  const theadClass = isLightTheme
    ? "bg-gradient-to-r from-[#eef2ff] via-white to-[#f5f7ff] text-slate-500"
    : "bg-white/5 text-white/60";

  const rowClass = `${isLightTheme
    ? "bg-white/80 even:bg-white/60 hover:bg-[#eef2ff]/80"
    : "bg-white/5 even:bg-white/10 hover:bg-white/15"} transition-colors duration-300 align-middle`;

  const campaignNameClass = isLightTheme
    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#312e81] via-[#5b21b6] to-[#7c3aed]"
    : "text-transparent bg-clip-text bg-gradient-to-r from-[#c7d2fe] via-[#a5b4fc] to-[#fbcfe8]";

  const descriptionTextClass = isLightTheme ? "text-xs text-slate-600" : "text-xs text-white/70";

  const descriptionCardClass = isLightTheme
    ? "bg-white/80 border border-white/70 rounded-2xl px-4 py-2 shadow-[0_12px_35px_rgba(15,23,42,0.08)]"
    : "bg-white/5 border border-white/10 rounded-2xl px-4 py-2";

  const highlightPillBase = "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm whitespace-nowrap";

  const endDatePillStyle: CSSProperties = isLightTheme
    ? {
      background: "linear-gradient(120deg, rgba(237,233,254,0.95), rgba(224,231,255,0.9))",
      color: "#5b21b6",
      border: "1px solid rgba(255,255,255,0.85)",
    }
    : {
      background: "rgba(88,28,135,0.4)",
      color: "#f5d0fe",
      border: "1px solid rgba(255,255,255,0.08)",
    };

  const timePillStyle: CSSProperties = isLightTheme
    ? {
      background: "linear-gradient(120deg, rgba(222,247,236,0.95), rgba(204,251,241,0.9))",
      color: "#047857",
      border: "1px solid rgba(255,255,255,0.85)",
    }
    : {
      background: "rgba(16,185,129,0.18)",
      color: "#a7f3d0",
      border: "1px solid rgba(16,185,129,0.35)",
    };

  const startDatePillStyle: CSSProperties = isLightTheme
    ? {
      background: "linear-gradient(120deg, rgba(224,247,255,0.95), rgba(199,230,255,0.9))",
      color: "#0369a1",
      border: "1px solid rgba(224,231,255,0.8)",
    }
    : {
      background: "rgba(14,165,233,0.2)",
      color: "#bae6fd",
      border: "1px solid rgba(14,165,233,0.35)",
    };

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [openMenuId]);

  if (campaigns.length === 0) {
    return (
      <div className="glass p-12 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(99, 102, 241, 0.1)" }}>
          <svg className="w-10 h-10" style={{ color: "#818cf8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          لا توجد حملات
        </p>
        <p style={{ color: "var(--text-muted)" }}>
          ابدأ بإنشاء حملة إعلانية جديدة
        </p>
      </div>
    );
  }

  return (
    <div className={tableWrapperClass}>
      <div className="overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead className={theadClass}>
            <tr>
              {[
                "اسم الحملة",
                "تاريخ البداية",
                "تاريخ النهاية",
                "الوقت اليومي",
                "أيام الأسبوع",
                "حالة الحملة",
                "الإجراءات",
              ].map((heading) => (
                <th key={heading} className="text-center px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]">
                  {heading}
                </th>)
              )}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className={rowClass}>
                <td className="px-6 py-4 align-middle">
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <p className={`text-lg font-black leading-tight ${campaignNameClass}`}>
                      {campaign.name}
                    </p>
                    {campaign.description && (
                      <div className={descriptionCardClass}>
                        <p className={`${descriptionTextClass} leading-relaxed`}>{campaign.description}</p>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <span className={highlightPillBase} style={startDatePillStyle}>
                    {new Date(campaign.startsAtUtc).toLocaleDateString("en-GB")
                      .replace(/\//g, '-')}
                  </span>
                </td>
                <td className="px-6 py-4 align-middle">
                  <span className={highlightPillBase} style={endDatePillStyle}>
                    {new Date(campaign.endsAtUtc).toLocaleDateString("en-GB")
                      .replace(/\//g, '-')}
                  </span>
                </td>
                <td className="px-6 py-4 align-middle">
                  <span className={highlightPillBase} style={timePillStyle}>
                    {campaign.dayStartsAt.slice(0, 5)} - {campaign.dayEndsAt.slice(0, 5)}
                  </span>
                </td>
                <td className="px-6 py-4 align-middle">
                  <div className="flex flex-wrap items-center gap-1">
                    {campaign.daysOfWeek.slice(0, 3).map((day) => (
                      <span
                        key={day}
                        className={`px-2 py-1 text-[10px] font-bold rounded-full whitespace-nowrap ${isLightTheme
                          ? "bg-indigo-50 text-indigo-500"
                          : "bg-indigo-500/10 text-indigo-200"
                          }`}
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))}
                    {campaign.daysOfWeek.length > 3 && (
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${isLightTheme ? "text-slate-400" : "text-white/40"}`}>
                        +{campaign.daysOfWeek.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <CampaignStatusCell
                    campaign={campaign}
                    disabled={!onStatusChange}
                    changing={changingId === campaign.id}
                    isMenuOpen={openMenuId === campaign.id}
                    onToggleMenu={(event) => {
                      event.stopPropagation();
                      if (!onStatusChange) return;
                      setOpenMenuId((current) => (current === campaign.id ? null : campaign.id));
                    }}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onSelectStatus={async (status) => {
                      if (!onStatusChange) return;
                      setChangingId(campaign.id);
                      try {
                        await onStatusChange(campaign, status);
                      } finally {
                        setChangingId(null);
                        setOpenMenuId(null);
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(campaign)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-300 ${isLightTheme
                          ? "bg-white/90 border-indigo-200 text-indigo-500 hover:bg-indigo-50"
                          : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                          }`}
                      >
                        تعديل
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(campaign)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-300 ${isLightTheme
                          ? "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          }`}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
