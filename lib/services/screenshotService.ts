import { v4 as uuidv4 } from "uuid";
import { storageService } from "./storageService";
import type { Screenshot } from "../types";

/**
 * خدمة أخذ لقطات الشاشة باستخدام html2canvas
 * تعمل داخل صفحة الشاشة نفسها وتلتقط ما يُعرض فعلياً
 */
export class ScreenshotService {
  /**
   * التقاط لقطة من عنصر HTML وحفظها
   */
  async captureElement(
    element: HTMLElement,
    screenId: number,
  ): Promise<Screenshot> {
    // استيراد html2canvas ديناميكياً (client-side فقط)
    const html2canvas = (await import("html2canvas")).default;

    // Timeout wrapper - إذا استغرقت أكثر من 10 ثواني، توقف
    const capturePromise = html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 0.5, // تصغير الحجم لتوفير المساحة
      logging: false,
      ignoreElements: (el) => {
        // تخطي العناصر التي لا يمكن تحميلها
        if (el.tagName === 'IMG') {
          const img = el as HTMLImageElement;
          return !img.complete || !img.src;
        }
        return false;
      },
    });

    const canvas = await capturePromise;    // تحويل Canvas إلى Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("فشل تحويل اللقطة"))),
        "image/jpeg",
        0.7,
      );
    });

    // اسم الملف: شاشة-{id}-{تاريخ-وقت}.jpg
    const now = new Date();
    const dateStr = now
      .toLocaleString("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/[/:,\s]/g, "-")
      .replace(/-+/g, "-");

    const fileName = `شاشة-${screenId}-${dateStr}.jpg`;
    const file = new File([blob], fileName, { type: "image/jpeg" });

    // حفظ الملف في IndexedDB
    const imageUrl = await storageService.saveFile(file);

    const screenshot: Screenshot = {
      id: uuidv4(),
      screenId,
      imageUrl,
      imageSize: blob.size,
      timestamp: now,
    };

    await storageService.saveScreenshot(screenshot);
    return screenshot;
  }
}

export const screenshotService = new ScreenshotService();
