import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  adService,
  UnsupportedFileFormatError,
  FileTooLargeError,
} from "./adService";
import { storageService } from "./storageService";
import type { Advertisement } from "../types";

// Mock UUID
vi.mock("uuid", () => ({
  v4: () => "test-uuid-" + Math.random().toString(36).substring(7),
}));

describe("AdService - Property-Based Tests", () => {
  beforeEach(() => {
    // تنظيف التخزين قبل كل اختبار
    localStorage.clear();
  });

  /**
   * الخاصية 2: ربط الإعلان بالشاشة الصحيحة
   * يتحقق من: المتطلبات 1.2, 1.5, 2.1
   */
  describe("Property 2: Advertisement linked to correct screen", () => {
    it("should link advertisement to the specified screen", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // اسم الإعلان
          fc.integer({ min: 1, max: 5 }), // رقم الشاشة
          fc.integer({ min: 5, max: 60 }), // مدة العرض
          async (name, screenId, duration) => {
            // إنشاء ملف صورة وهمي
            const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

            // إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name,
              file,
              screenId,
              duration,
            });

            // التحقق من ربط الإعلان بالشاشة الصحيحة
            expect(ad.screenId).toBe(screenId);

            // التحقق من تحديث الشاشة
            const screen = await storageService.getScreen(screenId);
            expect(screen).not.toBeNull();
            expect(screen?.currentAdId).toBe(ad.id);
            expect(screen?.status).toBe("active");

            // التحقق من أن الإعلان يظهر في قائمة إعلانات الشاشة
            const screenAds =
              await adService.getAdvertisementsByScreen(screenId);
            expect(screenAds.some((a) => a.id === ad.id)).toBe(true);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should update screen when advertisement is moved to different screen", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (name, oldScreenId, newScreenId) => {
            fc.pre(oldScreenId !== newScreenId); // تأكد من أن الشاشات مختلفة

            const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

            // إنشاء الإعلان على الشاشة القديمة
            const ad = await adService.createAdvertisement({
              name,
              file,
              screenId: oldScreenId,
              duration: 10,
            });

            // نقل الإعلان للشاشة الجديدة
            await adService.updateAdvertisement(ad.id, {
              screenId: newScreenId,
            });

            // التحقق من الشاشة القديمة
            const oldScreen = await storageService.getScreen(oldScreenId);
            expect(oldScreen?.currentAdId).toBeNull();
            expect(oldScreen?.status).toBe("idle");

            // التحقق من الشاشة الجديدة
            const newScreen = await storageService.getScreen(newScreenId);
            expect(newScreen?.currentAdId).toBe(ad.id);
            expect(newScreen?.status).toBe("active");
          },
        ),
        { numRuns: 15 },
      );
    });
  });

  /**
   * الخاصية 6: تحديث الإعلان يحفظ التغييرات
   * يتحقق من: المتطلبات 3.3, 3.5
   */
  describe("Property 6: Update advertisement saves changes", () => {
    it("should save all updated fields correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 5, max: 60 }),
          async (originalName, newName, screenId, newDuration) => {
            const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

            // إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name: originalName,
              file,
              screenId,
              duration: 10,
            });

            const originalUpdatedAt = ad.updatedAt;

            // الانتظار قليلاً لضمان تغيير التاريخ
            await new Promise((resolve) => setTimeout(resolve, 10));

            // تحديث الإعلان
            const updatedAd = await adService.updateAdvertisement(ad.id, {
              name: newName,
              duration: newDuration,
            });

            // التحقق من حفظ التغييرات
            expect(updatedAd.name).toBe(newName);
            expect(updatedAd.duration).toBe(newDuration);
            expect(updatedAd.id).toBe(ad.id);
            expect(updatedAd.screenId).toBe(screenId);
            expect(updatedAd.updatedAt.getTime()).toBeGreaterThan(
              originalUpdatedAt.getTime(),
            );

            // التحقق من استمرار التغييرات بعد إعادة التحميل
            const reloadedAd = await adService.getAdvertisement(ad.id);
            expect(reloadedAd?.name).toBe(newName);
            expect(reloadedAd?.duration).toBe(newDuration);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should update file when new file is provided", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          async (name, screenId) => {
            const originalFile = new File(["original"], "original.jpg", {
              type: "image/jpeg",
            });

            // إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name,
              file: originalFile,
              screenId,
              duration: 10,
            });

            const originalFileUrl = ad.fileUrl;

            // تحديث الملف
            const newFile = new File(["new content"], "new.png", {
              type: "image/png",
            });
            const updatedAd = await adService.updateAdvertisement(ad.id, {
              file: newFile,
            });

            // التحقق من تحديث الملف
            expect(updatedAd.fileUrl).not.toBe(originalFileUrl);
            expect(updatedAd.fileName).toBe("new.png");
            expect(updatedAd.fileSize).toBe(newFile.size);

            // التحقق من حذف الملف القديم (لا يمكن الوصول إليه)
            const oldFileId = originalFileUrl.replace("indexeddb://", "");
            const oldFile = await storageService.getFile(oldFileId);
            expect(oldFile).toBeNull();
          },
        ),
        { numRuns: 15 },
      );
    });
  });

  /**
   * الخاصية 5: حذف الإعلان يزيله من النظام والشاشة
   * يتحقق من: المتطلبات 3.4
   */
  describe("Property 5: Delete advertisement removes it from system and screen", () => {
    it("should remove advertisement and update screen status", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          async (name, screenId) => {
            const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

            // إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name,
              file,
              screenId,
              duration: 10,
            });

            const fileUrl = ad.fileUrl;
            const fileId = fileUrl.replace("indexeddb://", "");

            // حذف الإعلان
            await adService.deleteAdvertisement(ad.id);

            // التحقق من حذف الإعلان
            const deletedAd = await adService.getAdvertisement(ad.id);
            expect(deletedAd).toBeNull();

            // التحقق من حذف الملف
            const deletedFile = await storageService.getFile(fileId);
            expect(deletedFile).toBeNull();

            // التحقق من تحديث الشاشة
            const screen = await storageService.getScreen(screenId);
            expect(screen?.currentAdId).toBeNull();
            expect(screen?.status).toBe("idle");

            // التحقق من عدم ظهور الإعلان في القائمة
            const allAds = await adService.getAllAdvertisements();
            expect(allAds.some((a) => a.id === ad.id)).toBe(false);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should handle deleting multiple advertisements", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              screenId: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          async (adsData) => {
            const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

            // إنشاء عدة إعلانات
            const ads: Advertisement[] = [];
            for (const data of adsData) {
              const ad = await adService.createAdvertisement({
                name: data.name,
                file,
                screenId: data.screenId,
                duration: 10,
              });
              ads.push(ad);
            }

            // حذف جميع الإعلانات
            for (const ad of ads) {
              await adService.deleteAdvertisement(ad.id);
            }

            // التحقق من حذف جميع الإعلانات
            for (const ad of ads) {
              const deletedAd = await adService.getAdvertisement(ad.id);
              expect(deletedAd).toBeNull();
            }

            // التحقق من أن القائمة فارغة
            const allAds = await adService.getAllAdvertisements();
            expect(allAds.length).toBe(0);
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  /**
   * الخاصية 15: قبول صيغ الملفات المدعومة
   * الخاصية 16: رفض الصيغ غير المدعومة
   * يتحقق من: المتطلبات 9.1, 9.2, 9.3
   */
  describe("Property 15 & 16: File format validation", () => {
    const supportedImageFormats = [
      { name: "test.jpg", type: "image/jpeg" },
      { name: "test.jpeg", type: "image/jpeg" },
      { name: "test.png", type: "image/png" },
      { name: "test.gif", type: "image/gif" },
      { name: "test.webp", type: "image/webp" },
    ];

    const supportedVideoFormats = [
      { name: "test.mp4", type: "video/mp4" },
      { name: "test.webm", type: "video/webm" },
      { name: "test.mov", type: "video/quicktime" },
    ];

    const unsupportedFormats = [
      { name: "test.txt", type: "text/plain" },
      { name: "test.pdf", type: "application/pdf" },
      { name: "test.doc", type: "application/msword" },
      { name: "test.avi", type: "video/x-msvideo" },
      { name: "test.mkv", type: "video/x-matroska" },
    ];

    it("should accept all supported image formats", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...supportedImageFormats),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 5, max: 60 }),
          async (format, name, screenId, duration) => {
            const file = new File(["test content"], format.name, {
              type: format.type,
            });

            // يجب أن ينجح إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name,
              file,
              screenId,
              duration,
            });

            expect(ad).toBeDefined();
            expect(ad.type).toBe("image");
            expect(ad.fileName).toBe(format.name);
            expect(ad.duration).toBe(duration);
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should accept all supported video formats", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...supportedVideoFormats),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          async (format, name, screenId) => {
            const file = new File(["test content"], format.name, {
              type: format.type,
            });

            // يجب أن ينجح إنشاء الإعلان
            const ad = await adService.createAdvertisement({
              name,
              file,
              screenId,
            });

            expect(ad).toBeDefined();
            expect(ad.type).toBe("video");
            expect(ad.fileName).toBe(format.name);
            expect(ad.duration).toBeUndefined(); // الفيديوهات لا تحتاج مدة
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should reject all unsupported formats", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...unsupportedFormats),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          async (format, name, screenId) => {
            const file = new File(["test content"], format.name, {
              type: format.type,
            });

            // يجب أن يفشل إنشاء الإعلان
            await expect(
              adService.createAdvertisement({
                name,
                file,
                screenId,
                duration: 10,
              }),
            ).rejects.toThrow(UnsupportedFileFormatError);
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should reject files larger than 100MB", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 101, max: 200 }), // حجم أكبر من 100MB
          async (name, screenId, sizeMB) => {
            // إنشاء ملف كبير (محاكاة)
            const largeSize = sizeMB * 1024 * 1024;
            const file = new File(["x".repeat(1000)], "large.jpg", {
              type: "image/jpeg",
            });

            // تعديل حجم الملف للاختبار
            Object.defineProperty(file, "size", { value: largeSize });

            // يجب أن يفشل إنشاء الإعلان
            await expect(
              adService.createAdvertisement({
                name,
                file,
                screenId,
                duration: 10,
              }),
            ).rejects.toThrow(FileTooLargeError);
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should use isFileFormatSupported helper correctly", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedImageFormats, ...supportedVideoFormats),
          (format) => {
            const file = new File(["test"], format.name, { type: format.type });
            expect(adService.isFileFormatSupported(file)).toBe(true);
          },
        ),
        { numRuns: 20 },
      );

      fc.assert(
        fc.property(fc.constantFrom(...unsupportedFormats), (format) => {
          const file = new File(["test"], format.name, { type: format.type });
          expect(adService.isFileFormatSupported(file)).toBe(false);
        }),
        { numRuns: 20 },
      );
    });

    it("should detect file type correctly", () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedImageFormats), (format) => {
          const file = new File(["test"], format.name, { type: format.type });
          expect(adService.getFileType(file)).toBe("image");
        }),
        { numRuns: 10 },
      );

      fc.assert(
        fc.property(fc.constantFrom(...supportedVideoFormats), (format) => {
          const file = new File(["test"], format.name, { type: format.type });
          expect(adService.getFileType(file)).toBe("video");
        }),
        { numRuns: 10 },
      );

      fc.assert(
        fc.property(fc.constantFrom(...unsupportedFormats), (format) => {
          const file = new File(["test"], format.name, { type: format.type });
          expect(adService.getFileType(file)).toBeNull();
        }),
        { numRuns: 10 },
      );
    });
  });
});
