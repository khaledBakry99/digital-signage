import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storageService";
import { indexedDBService } from "../storage/indexedDB";
import type { Screenshot } from "../types";

/**
 * تحويل imageUrl من indexeddb:// إلى Blob URL
 */
async function resolveBlobUrl(imageUrl: string): Promise<string> {
  if (!imageUrl.startsWith("indexeddb://")) return imageUrl;
  const fileId = imageUrl.replace("indexeddb://", "");
  const file = await indexedDBService.getFile(fileId);
  if (!file) throw new Error("الملف غير موجود");
  return URL.createObjectURL(file);
}

export interface ScreenshotWithBlobUrl extends Screenshot {
  blobUrl?: string;
}

export interface UseScreenshotsReturn {
  screenshots: ScreenshotWithBlobUrl[];
  screenshotsByScreen: Record<number, ScreenshotWithBlobUrl[]>;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook لتحميل وعرض اللقطات مع Blob URLs
 */
export function useScreenshots(screenId?: number): UseScreenshotsReturn {
  const [screenshots, setScreenshots] = useState<ScreenshotWithBlobUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = screenId
        ? await storageService.getScreenshotsByScreen(screenId)
        : await storageService.getAllScreenshots();

      // ترتيب من الأحدث للأقدم
      const sorted = [...raw].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // تحويل كل لقطة إلى Blob URL
      const withBlobs = await Promise.all(
        sorted.map(async (s) => {
          try {
            const blobUrl = await resolveBlobUrl(s.imageUrl);
            return { ...s, blobUrl };
          } catch {
            return { ...s, blobUrl: undefined };
          }
        }),
      );

      setScreenshots(withBlobs);
    } catch (err) {
      console.error("فشل تحميل اللقطات:", err);
    } finally {
      setLoading(false);
    }
  }, [screenId]);

  useEffect(() => {
    load();
    // تحديث تلقائي كل 10 ثوان
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  // تجميع اللقطات حسب الشاشة
  const screenshotsByScreen: Record<number, ScreenshotWithBlobUrl[]> = {};
  for (const s of screenshots) {
    if (!screenshotsByScreen[s.screenId]) screenshotsByScreen[s.screenId] = [];
    screenshotsByScreen[s.screenId].push(s);
  }

  return { screenshots, screenshotsByScreen, loading, refresh: load };
}
