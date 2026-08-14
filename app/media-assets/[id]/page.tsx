"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import type { MediaAsset } from "@/lib/types/mediaAsset";

export default function MediaAssetPreviewPage() {
  const params = useParams<{ id: string }>();
  const assetId = Number(params?.id);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAsset() {
      if (!assetId || Number.isNaN(assetId)) {
        setError("لا يمكن العثور على الإعلان المطلوب.");
        setLoading(false);
        return;
      }
      try {
        const data = await mediaAssetApi.getById(assetId);
        if (mounted) {
          setAsset(data);
        }
      } catch (err) {
        if (mounted) {
          setError("تعذر تحميل بيانات الإعلان المحدد.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAsset();
    return () => {
      mounted = false;
    };
  }, [assetId]);

  const formatSize = (mb: number) => {
    if (!mb) return "—";
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const metaInfo = useMemo(() => {
    if (!asset) return [] as Array<{ label: string; value: string }>;
    return [
      { label: "النوع", value: asset.type === "Image" ? "صورة" : "فيديو" },
      { label: "الحجم", value: formatSize(asset.fileSizeMb) },
      { label: "تاريخ الرفع", value: formatDate(asset.createdAtUtc) },
    ];
  }, [asset]);

  const renderMedia = () => {
    if (!asset) return null;
    const baseClass =
      "block max-h-[88vh] max-w-[75vw] w-auto rounded-[38px] border border-white/15 shadow-[0_45px_90px_rgba(3,5,20,0.7)]";

    if (asset.type === "Image") {
      return (
        <img
          src={asset.url}
          alt={asset.name}
          className={`${baseClass} object-contain`}
          loading="lazy"
        />
      );
    }

    return (
      <video
        src={asset.url}
        controls
        autoPlay
        playsInline
        loop
        className={`${baseClass} bg-black`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-blue-500/10 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
            
              {asset?.type && (
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${asset.type === "Image" ? "bg-blue-500/20 border-blue-500/30 text-blue-300" : "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300"
                  }`}>
                  {asset.type}
                </div>
              )}
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {asset?.name || "جار التحميل..."}
            </h1>
          </div>

          <button
            onClick={() => window.close()}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm select-none active:scale-95"
          >
            إغلاق المعاينة
          </button>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start flex-1">
          <div className="flex items-center justify-center min-h-[50vh] relative group">
            {loading && (
              <div className="px-16 py-12 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl text-slate-200 text-sm font-black tracking-[0.4em] uppercase animate-pulse shadow-2xl">
                loading
              </div>
            )}
            {error && !loading && (
              <div className="px-10 py-8 rounded-[32px] border border-rose-500/30 bg-rose-500/10 backdrop-blur-xl text-rose-100 text-center max-w-md shadow-2xl animate-shake">
                <svg className="w-12 h-12 mx-auto mb-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
            {!loading && !error && (
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 transition-transform duration-500 hover:scale-[1.01]">
                  {renderMedia()}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="relative overflow-hidden rounded-[32px] border border-white/5 p-8 bg-[#0f172a]/40 backdrop-blur-md shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               معلومات الملف
              </h3>
              <div className="space-y-5">
                {metaInfo.map((meta) => (
                  <div key={meta.label} className="group">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1 ml-1 group-hover:text-indigo-400/50 transition-colors">{meta.label}</p>
                    <p className="text-lg font-bold text-white/90 group-hover:text-white transition-colors">{meta.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {asset?.description && (
              <div className="relative overflow-hidden rounded-[32px] border border-white/5 p-8 bg-[#0f172a]/30 backdrop-blur-md shadow-2xl">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl -ml-16 -mb-16" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Description
                </h3>
                <p className="text-slate-100 leading-relaxed text-sm font-medium">
                  {asset.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
