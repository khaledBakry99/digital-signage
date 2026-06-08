"use client";

import { useState, useEffect, useRef } from "react";
import type { MediaAsset } from "@/lib/types/mediaAsset";

interface ScreenPlayerProps {
  advertisement: MediaAsset | null;
  screenId: number;
}

// دالة ذكية لمعالجة الروابط
function resolveMediaUrl(url: string, type?: string): string {
  if (!url) return "";
  
  // 1. إذا كان رابطاً نسبياً، نربطه مع السيرفر الحقيقي
  if (url.startsWith("/")) {
    return `https://backend-42316129731.europe-west1.run.app${url}`;
  }
  
  // 2. إذا كان نطاقاً وهمياً غير موجود (مثل cdn.example.com) نقم بالتبديل التلقائي لوسائط حقيقية جذابة للعرض التجريبي
  if (url.includes("example.com") || url.includes("cdn.example.com")) {
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov|m4v)/) || type?.toLowerCase() === "video";
    if (isVideo) {
      // فيديو تجريدي رائع مخصص للشاشات الرقمية
      return "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32025-large.mp4";
    } else {
      // صورة جمالية تجريدية رائعة بدقة عالية للشاشات الرقمية
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920";
    }
  }
  
  return url;
}

export default function ScreenPlayer({
  advertisement,
  screenId,
}: ScreenPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resolvedUrl = advertisement ? resolveMediaUrl(advertisement.url, advertisement.type) : "";

  useEffect(() => {
    setError(null);
  }, [advertisement]);

  // تشغيل الفيديو تلقائياً بعد التحميل
  useEffect(() => {
    const isVideo = advertisement?.type?.toLowerCase() === "video";
    if (isVideo && videoRef.current && resolvedUrl) {
      videoRef.current.play().catch((err) => {
        console.error("فشل تشغيل الفيديو:", err);
        setError("فشل تشغيل الفيديو من الخادم");
      });
    }
  }, [advertisement, resolvedUrl]);

  // مؤقت الصور
  useEffect(() => {
    const isImage = advertisement?.type?.toLowerCase() === "image";
    const duration = advertisement?.durationSeconds || 10; // افتراضي 10 ثوانٍ إذا لم توجد مدة

    if (isImage) {
      setCurrentTime(0);
      imageTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => {
        if (imageTimerRef.current) {
          clearInterval(imageTimerRef.current);
        }
      };
    }
  }, [advertisement]);

  // لا يوجد إعلان
  if (!advertisement) {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl text-white mb-2">شاشة {screenId}</h2>
          <p className="text-gray-400">لا يوجد إعلان معروض حالياً</p>
        </div>
      </div>
    );
  }

  // خطأ في التشغيل
  if (error) {
    return (
      <div className="w-full h-screen bg-red-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl text-white mb-2">خطأ في العرض</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <p className="text-xs text-red-300/60 truncate">{resolvedUrl || advertisement.url}</p>
        </div>
      </div>
    );
  }

  const isImage = advertisement.type?.toLowerCase() === "image";
  const duration = advertisement.durationSeconds || 10;

  // عرض الصورة
  if (isImage) {
    return (
      <div className="w-full h-screen bg-black relative">
        <img
          src={resolvedUrl}
          alt={advertisement.name}
          className="w-full h-full object-contain"
          onError={() => setError("فشل تحميل الصورة من الخادم")}
        />
        {/* مؤشر الوقت */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-semibold border border-white/5">
          {currentTime} / {duration} ثانية
        </div>
      </div>
    );
  }

  // عرض الفيديو
  return (
    <div className="w-full h-screen bg-black">
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-contain"
        controls={false}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError("فشل تحميل أو تشغيل ملف الفيديو")}
      />
    </div>
  );
}
