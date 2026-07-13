"use client";

import { useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface MediaThumbnailProps {
  asset: MediaAsset;
  onPreview: () => void;
  isLightTheme: boolean;
}

function MediaThumbnail({ asset, onPreview, isLightTheme }: MediaThumbnailProps) {
  const [loaded, setLoaded] = useState(false);

  if (!asset.url) {
    return (
      <div
        className={`w-20 h-20 rounded-[20px] flex items-center justify-center border border-dashed ${isLightTheme
          ? "bg-white/80 text-slate-400 border-slate-200"
          : "bg-white/5 text-white/20 border-white/10"
          }`}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const isImage = asset.type === "Image";

  return (
    <button
      type="button"
      onClick={onPreview}
      className={`relative group w-20 h-20 overflow-hidden rounded-[20px] border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme
        ? "focus-visible:ring-indigo-200 focus-visible:ring-offset-white shadow-[0_15px_45px_rgba(15,23,42,0.1)] bg-white/85"
        : "focus-visible:ring-offset-[#0f172a] shadow-lg"
        } ${isLightTheme
          ? "border-slate-200"
          : isImage
            ? "border-white/10 bg-white/5"
            : "border-fuchsia-500/30 bg-fuchsia-500/5"
        }`}
      title={isImage ? "عرض الصورة بالحجم الكامل" : "عرض الفيديو"}
    >
      {isImage ? (
        <img
          src={asset.url}
          alt={asset.name}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"
            }`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <video
          src={asset.url}
          muted
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"
            }`}
          onLoadedData={() => setLoaded(true)}
        />
      )}

      {!loaded && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-[8px] font-black tracking-widest uppercase ${isLightTheme ? "text-slate-400 bg-white/70" : "text-white/60 bg-slate-900/80"
            }`}
        >
          LOAD
          <span className="block w-6 h-0.5 bg-white/20 animate-pulse" />
        </div>
      )}

      <div
        className={`absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md flex items-center justify-center pointer-events-none ${isLightTheme ? "bg-white/70" : "bg-black/50"
          }`}
      >
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md ${isLightTheme ? "bg-white text-slate-700 border-white/60" : "bg-white/20 text-white border-white/30"
            }`}
        >
          {isImage ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

interface AdListProps {
  advertisements: MediaAsset[];
  onEdit: (ad: MediaAsset) => void;
  onDelete: (ad: MediaAsset) => void;
}

export default function AdList({
  advertisements,
  onEdit,
  onDelete,
}: AdListProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  const headerRowClass = isLightTheme
    ? "border-b border-[rgba(149,156,202,0.35)] bg-gradient-to-r from-[#dfe8ff]/95 via-[#edf2ff]/95 to-[#f4f8ff]/95 shadow-[0_18px_45px_rgba(99,102,241,0.08)]"
    : "border-b border-white/5 bg-white/5 shadow-sm";

  const bodyDividerClass = isLightTheme
    ? "divide-y divide-white/60"
    : "divide-y divide-white/[0.03]";

  const rowClass = isLightTheme
    ? "group transition-colors duration-300 bg-white/80 even:bg-[#f2f6ff]/80 hover:bg-[#e6f0ff]/90"
    : "group transition-colors duration-300 hover:bg-white/[0.02]";

  const openMediaPreview = (ad: MediaAsset) => {
    if (!ad?.id) return;
    const targetUrl = `/media-assets/${ad.id}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatSize = (mb: number) => {
    if (mb === 0) return "—";
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  if (advertisements.length === 0) {
    return (
      <div
        className={`p-20 text-center flex flex-col items-center justify-center gap-6 ${isLightTheme ? "bg-white/60 rounded-[32px] border border-white/70" : ""
          }`}
      >
        <div
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-white/10 shadow-inner border ${isLightTheme ? "bg-white text-indigo-200 border-white/70" : "bg-white/5 border-white/10"
            }`}
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div>
          <h3 className={`text-xl font-bold mb-2 ${isLightTheme ? "text-slate-900" : "text-white"}`}>
            لا توجد وسائط متوفرة
          </h3>
          <p
            className={`${isLightTheme ? "text-slate-500" : "text-white/40"
              } text-sm max-w-xs mx-auto leading-relaxed`}
          >
            لم يتم رفع أي صور أو فيديوهات بعد. ابدأ بإضافة أول إعلان لمكتبتك.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className={headerRowClass}>
            {["الإعلان", "الوصف", "المعاينة", "الحجم", "النوع", "التاريخ", "إجراءات"].map((heading, idx) => (
              <th
                key={heading}
                className={`${idx === 2
                  ? "text-center"
                  : idx === 6
                    ? "text-left"
                    : "text-right"
                  } px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] ${isLightTheme ? "text-[#6d6fb4]" : "text-white/40"
                  }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyDividerClass}>
          {advertisements.map((ad, i) => (
            <tr
              key={ad.id}
              className={rowClass}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p
                    className={`font-bold transition-colors ${isLightTheme ? "text-slate-900 group-hover:text-indigo-500" : "text-white group-hover:text-indigo-300"
                      }`}
                  >
                    {ad.name}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p
                  className={`text-sm max-w-[200px] truncate leading-relaxed ${isLightTheme ? "text-slate-500" : "text-white/50"
                    }`}
                >
                  {ad.description || "—"}
                </p>
              </td>
              <td className="px-6 py-4 text-center">
                <MediaThumbnail asset={ad} onPreview={() => openMediaPreview(ad)} isLightTheme={isLightTheme} />
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-medium tabular-nums ${isLightTheme ? "text-slate-500" : "text-white/40"
                    }`}
                >
                  {formatSize(ad.fileSizeMb)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${ad.type === "Image"
                    ? isLightTheme
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : isLightTheme
                      ? "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100"
                      : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"
                    }`}
                >
                  {ad.type === "Image" ? "Image" : "Video"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-medium ${isLightTheme ? "text-slate-500" : "text-white/40"
                    }`}
                >
                  {formatDate(ad.createdAtUtc)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div
                  className={`flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${isLightTheme ? "text-slate-600" : "text-white"
                    }`}
                >
                  <button
                    onClick={() => onEdit(ad)}
                    className={`cursor-pointer p-2.5 rounded-xl border transition-all active:scale-90 ${isLightTheme
                      ? "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-500"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      }`}
                    title="تعديل الإعلان"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(ad)}
                    className={`cursor-pointer p-2.5 rounded-xl transition-all active:scale-90 border ${isLightTheme
                      ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                      : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                      }`}
                    title="حذف الإعلان"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
