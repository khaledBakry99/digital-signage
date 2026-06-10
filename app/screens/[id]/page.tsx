"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ScreenPlayer from "@/components/ScreenPlayer";
import { screenApi } from "@/lib/api/screen.api";
import { mediaAssetApi } from "@/lib/api/mediaAsset.api";
import type { MediaAsset } from "@/lib/types/mediaAsset";

export default function ScreenPage() {
  const params = useParams();
  const screenId = Number(params.id);
  const [advertisement, setAdvertisement] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<string>("جاري التحقق...");
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // تحميل الإعلان وتطبيق السيناريوهات كل 5 ثوانٍ بالكامل من الـ API
  useEffect(() => {
    const loadAndAnalyze = async () => {
      try {
        // 1. جلب بيانات الشاشة الفعالة والحملة النشطة الحالية
        const campaignData = await screenApi.getActiveCampaign(screenId).catch(() => null);
        const currentMedia = await screenApi.getCurrentMedia(screenId).catch(() => null);

        let finalMediaAssetId: number | undefined = undefined;
        let finalMediaUrl: string | undefined = undefined;

        // تطبيق سيناريو الأولوية المطلوب:
        // السيناريو الأول (الأولوية القصوى): إذا كان وقت حملة نشطة يتم تشغيل إعلانات الحملة
        if (campaignData && campaignData.ruleApplied && campaignData.campaign) {
          setActiveScenario("السيناريو 2: تشغيل حملة إعلانية نشطة جدولة زمنية");
          setCampaignName(campaignData.campaign.name);
          
          // تحديد الإعلان الأنسب للحملة بناءً على ما حدده الـ API حالياً
          finalMediaAssetId = currentMedia?.currentMediaAssetId;
          finalMediaUrl = currentMedia?.url;
        } 
        // السيناريو الثاني: تحليل الذكاء الاصطناعي عبر الكاميرا لتحديد الجمهور
        else if (currentMedia && currentMedia.currentMediaAssetId) {
          setActiveScenario("السيناريو 1: تحليل ذكي عبر الكاميرا للجمهور المتواجد");
          setCampaignName(null);
          finalMediaAssetId = currentMedia.currentMediaAssetId;
          finalMediaUrl = currentMedia.url;
        } else {
          setActiveScenario("العرض الافتراضي: لا توجد حملات أو تحليل كاميرا نشط");
          setCampaignName(null);
        }

        if (finalMediaAssetId && finalMediaUrl) {
          // جلب تفاصيل الإعلان من الـ API للحصول على البيانات المحدثة دائماً (النوع، الاسم، المدة)
          try {
            const realAsset = await mediaAssetApi.getById(finalMediaAssetId);
            setAdvertisement(realAsset);
          } catch {
            // كخطة احتياطية إذا فشل جلب تفاصيل الإعلان، نصنع كائناً افتراضياً بالرابط المباشر
            const isVideo = finalMediaUrl.toLowerCase().match(/\.(mp4|webm|mov|m4v)/);
            setAdvertisement({
              id: finalMediaAssetId,
              clientId: 0,
              name: campaignData?.campaign?.name || "إعلان ديناميكي",
              description: "تم إنشاؤه تلقائياً",
              type: isVideo ? "Video" : "Image",
              url: finalMediaUrl,
              durationSeconds: 15,
              fileSizeMb: 0,
              resolution: "1920x1080",
              isFallback: false,
              createdAtUtc: new Date().toISOString(),
            });
          }
        } else if (currentMedia?.url) {
          // إذا توفر الرابط فقط بدون ID
          const isVideo = currentMedia.url.toLowerCase().match(/\.(mp4|webm|mov|m4v)/);
          setAdvertisement({
            id: currentMedia.currentMediaAssetId || 0,
            clientId: 0,
            name: "بث مباشر",
            description: "",
            type: isVideo ? "Video" : "Image",
            url: currentMedia.url,
            durationSeconds: 15,
            fileSizeMb: 0,
            resolution: "",
            isFallback: false,
            createdAtUtc: new Date().toISOString(),
          });
        } else {
          setAdvertisement(null);
        }
      } catch (err) {
        console.error("فشل تطبيق سيناريوهات العرض من الـ API:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAndAnalyze();
    const interval = setInterval(loadAndAnalyze, 5_000); // تحديث وسيناريو تلقائي كل 5 ثوانٍ
    return () => clearInterval(interval);
  }, [screenId]);

  // التقاط لقطة شاشة دورية وإرسالها للخادم - تم حذفها
  // Screenshot يجب أن يكون فقط من الكاميرات للـ AI وليس من شاشات الإعلانات

  const handleClick = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // تجاهل
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <div className="text-indigo-200 text-xl font-medium">جاري تشغيل الشاشة والتحقق من الخادم...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onClick={handleClick} className="w-full h-screen relative overflow-hidden select-none">
      <ScreenPlayer advertisement={advertisement} screenId={screenId} />

      {/* شريط معلومات تشخيصي رائع ومخفي جزئياً لتوضيح أي سيناريو يعمل حالياً */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>الشاشة {screenId} نشطة عبر الشبكة</span>
        </div>
        <div className="glass px-4 py-2.5 rounded-2xl text-xs font-semibold flex flex-col gap-1 items-end text-right">
          <span className="text-indigo-400 font-bold">{activeScenario}</span>
          {campaignName && <span className="text-slate-300 text-[10px]">اسم الحملة: {campaignName}</span>}
        </div>
      </div>
    </div>
  );
}
