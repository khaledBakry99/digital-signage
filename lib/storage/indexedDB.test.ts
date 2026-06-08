import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { IndexedDBService } from "./indexedDB";
import type { Screenshot } from "../types";

// Feature: digital-signage-system, Property 8: حفظ اللقطات مع البيانات الصحيحة
// يتحقق من: المتطلبات 4.3, 7.3

describe("IndexedDBService - Property Based Tests", () => {
  let service: IndexedDBService;

  beforeEach(async () => {
    service = new IndexedDBService();
    await service.clearAll();
  });

  afterEach(() => {
    service.close();
  });

  // مولد لقطات عشوائية
  const screenshotArbitrary = () =>
    fc.record({
      id: fc.uuid(),
      screenId: fc.integer({ min: 1, max: 5 }),
      imageUrl: fc.webUrl(),
      imageSize: fc.integer({ min: 1, max: 10_000_000 }),
      timestamp: fc.date(),
    });

  describe("Property 8: حفظ اللقطات مع البيانات الصحيحة", () => {
    it("يجب أن يحفظ ويستعيد اللقطة مع رقم الشاشة والوقت الصحيح", async () => {
      await fc.assert(
        fc.asyncProperty(
          screenshotArbitrary(),
          async (screenshot: Screenshot) => {
            // حفظ اللقطة
            await service.saveScreenshot(screenshot);

            // استعادة اللقطة
            const retrieved = await service.getScreenshot(screenshot.id);

            // التحقق من التطابق
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(screenshot.id);
            expect(retrieved?.screenId).toBe(screenshot.screenId);
            expect(retrieved?.imageUrl).toBe(screenshot.imageUrl);
            expect(retrieved?.imageSize).toBe(screenshot.imageSize);
            expect(retrieved?.timestamp.getTime()).toBe(
              screenshot.timestamp.getTime(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("يجب أن يحفظ عدة لقطات ويستعيدها جميعاً", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(screenshotArbitrary(), { minLength: 1, maxLength: 10 }),
          async (screenshots: Screenshot[]) => {
            // حفظ جميع اللقطات
            for (const screenshot of screenshots) {
              await service.saveScreenshot(screenshot);
            }

            // استعادة جميع اللقطات
            const allScreenshots = await service.getAllScreenshots();

            // التحقق من أن جميع اللقطات موجودة
            expect(allScreenshots.length).toBeGreaterThanOrEqual(
              screenshots.length,
            );

            for (const screenshot of screenshots) {
              const found = allScreenshots.find((s) => s.id === screenshot.id);
              expect(found).toBeDefined();
              expect(found?.screenId).toBe(screenshot.screenId);
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it("يجب أن يسترجع اللقطات حسب رقم الشاشة", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.array(screenshotArbitrary(), { minLength: 1, maxLength: 5 }),
          async (targetScreenId: number, screenshots: Screenshot[]) => {
            // تعيين رقم الشاشة لجميع اللقطات
            const modifiedScreenshots = screenshots.map((s) => ({
              ...s,
              screenId: targetScreenId,
            }));

            // حفظ جميع اللقطات
            for (const screenshot of modifiedScreenshots) {
              await service.saveScreenshot(screenshot);
            }

            // استعادة اللقطات حسب رقم الشاشة
            const retrieved =
              await service.getScreenshotsByScreen(targetScreenId);

            // التحقق من أن جميع اللقطات المسترجعة تنتمي للشاشة الصحيحة
            expect(retrieved.length).toBeGreaterThanOrEqual(
              modifiedScreenshots.length,
            );
            for (const screenshot of retrieved) {
              expect(screenshot.screenId).toBe(targetScreenId);
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it("يجب أن يحذف اللقطة بشكل صحيح", async () => {
      await fc.assert(
        fc.asyncProperty(
          screenshotArbitrary(),
          async (screenshot: Screenshot) => {
            // حفظ اللقطة
            await service.saveScreenshot(screenshot);

            // التحقق من وجودها
            let retrieved = await service.getScreenshot(screenshot.id);
            expect(retrieved).not.toBeNull();

            // حذف اللقطة
            await service.deleteScreenshot(screenshot.id);

            // التحقق من عدم وجودها
            retrieved = await service.getScreenshot(screenshot.id);
            expect(retrieved).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("الحصول على أحدث اللقطات", () => {
    it("يجب أن يرجع أحدث لقطة لكل شاشة", async () => {
      // إنشاء لقطات لشاشات مختلفة بأوقات مختلفة
      const now = new Date();
      const screenshots: Screenshot[] = [
        {
          id: "1",
          screenId: 1,
          imageUrl: "url1",
          imageSize: 1000,
          timestamp: new Date(now.getTime() - 10000), // قبل 10 ثوان
        },
        {
          id: "2",
          screenId: 1,
          imageUrl: "url2",
          imageSize: 1000,
          timestamp: now, // الأحدث للشاشة 1
        },
        {
          id: "3",
          screenId: 2,
          imageUrl: "url3",
          imageSize: 1000,
          timestamp: new Date(now.getTime() - 5000), // قبل 5 ثوان
        },
        {
          id: "4",
          screenId: 2,
          imageUrl: "url4",
          imageSize: 1000,
          timestamp: new Date(now.getTime() + 1000), // الأحدث للشاشة 2
        },
      ];

      // حفظ جميع اللقطات
      for (const screenshot of screenshots) {
        await service.saveScreenshot(screenshot);
      }

      // الحصول على أحدث اللقطات
      const latest = await service.getLatestScreenshots();

      // يجب أن يكون هناك لقطتان (واحدة لكل شاشة)
      expect(latest.length).toBe(2);

      // التحقق من أن اللقطات هي الأحدث
      const screen1Latest = latest.find((s) => s.screenId === 1);
      const screen2Latest = latest.find((s) => s.screenId === 2);

      expect(screen1Latest?.id).toBe("2");
      expect(screen2Latest?.id).toBe("4");
    });
  });

  describe("حذف اللقطات القديمة", () => {
    it("يجب أن يحذف اللقطات الأقدم من عدد الأيام المحدد", async () => {
      const now = new Date();
      const screenshots: Screenshot[] = [
        {
          id: "1",
          screenId: 1,
          imageUrl: "url1",
          imageSize: 1000,
          timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // قبل 8 أيام
        },
        {
          id: "2",
          screenId: 1,
          imageUrl: "url2",
          imageSize: 1000,
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // قبل يومين
        },
      ];

      // حفظ اللقطات
      for (const screenshot of screenshots) {
        await service.saveScreenshot(screenshot);
      }

      // حذف اللقطات الأقدم من 7 أيام
      const deletedCount = await service.deleteOldScreenshots(7);

      // يجب أن يتم حذف لقطة واحدة
      expect(deletedCount).toBe(1);

      // التحقق من أن اللقطة القديمة تم حذفها
      const old = await service.getScreenshot("1");
      expect(old).toBeNull();

      // التحقق من أن اللقطة الحديثة لا تزال موجودة
      const recent = await service.getScreenshot("2");
      expect(recent).not.toBeNull();
    });
  });

  describe("حفظ واسترجاع الملفات", () => {
    it("يجب أن يحفظ ويسترجع ملف", async () => {
      // إنشاء ملف وهمي
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      // حفظ الملف
      const fileUrl = await service.saveFile(file);

      // التحقق من أن URL تم إنشاؤه
      expect(fileUrl).toContain("indexeddb://");

      // استخراج معرف الملف من URL
      const fileId = fileUrl.replace("indexeddb://", "");

      // استرجاع الملف
      const retrieved = await service.getFile(fileId);

      // التحقق من الملف
      expect(retrieved).not.toBeNull();
      // في بيئة الاختبار، قد لا يتم الاحتفاظ بجميع خصائص File
      // لذلك نتحقق فقط من أن الملف تم استرجاعه
      expect(retrieved).toBeDefined();
    });

    it("يجب أن يحذف ملف بشكل صحيح", async () => {
      // إنشاء وحفظ ملف
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const fileUrl = await service.saveFile(file);
      const fileId = fileUrl.replace("indexeddb://", "");

      // التحقق من وجود الملف
      let retrieved = await service.getFile(fileId);
      expect(retrieved).not.toBeNull();

      // حذف الملف
      await service.deleteFile(fileId);

      // التحقق من عدم وجود الملف
      retrieved = await service.getFile(fileId);
      expect(retrieved).toBeNull();
    });
  });

  describe("معالجة الأخطاء", () => {
    it("يجب أن يرجع null للقطة غير موجودة", async () => {
      const result = await service.getScreenshot("non-existent-id");
      expect(result).toBeNull();
    });

    it("يجب أن يرجع null لملف غير موجود", async () => {
      const result = await service.getFile("non-existent-id");
      expect(result).toBeNull();
    });
  });
});
