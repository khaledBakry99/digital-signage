import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { LocalStorageService } from "./localStorage";
import type { Advertisement } from "../types";

// Feature: digital-signage-system, Property 1: حفظ واستعادة الإعلانات (Round Trip)
// يتحقق من: المتطلبات 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.4

describe("LocalStorageService - Property Based Tests", () => {
  let service: LocalStorageService;

  beforeEach(() => {
    // مسح localStorage قبل كل اختبار
    localStorage.clear();
    service = new LocalStorageService();
  });

  // مولد إعلانات عشوائية
  const advertisementArbitrary = () =>
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      type: fc.constantFrom("image" as const, "video" as const),
      fileUrl: fc.webUrl(),
      fileName: fc.string({ minLength: 1, maxLength: 100 }),
      fileSize: fc.integer({ min: 1, max: 100_000_000 }),
      screenId: fc.integer({ min: 1, max: 5 }),
      duration: fc.option(fc.integer({ min: 1, max: 60 }), { nil: undefined }),
      // استخدام تواريخ صالحة فقط
      createdAt: fc.date({
        min: new Date("2020-01-01"),
        max: new Date("2030-12-31"),
      }),
      updatedAt: fc.date({
        min: new Date("2020-01-01"),
        max: new Date("2030-12-31"),
      }),
    });

  describe("Property 1: حفظ واستعادة الإعلانات (Round Trip)", () => {
    it("يجب أن يحفظ ويستعيد الإعلان بنفس البيانات", async () => {
      await fc.assert(
        fc.asyncProperty(
          advertisementArbitrary(),
          async (ad: Advertisement) => {
            // تخطي التواريخ غير الصالحة
            if (
              isNaN(ad.createdAt.getTime()) ||
              isNaN(ad.updatedAt.getTime())
            ) {
              return true;
            }

            // حفظ الإعلان
            await service.saveAdvertisement(ad);

            // استعادة الإعلان
            const retrieved = await service.getAdvertisement(ad.id);

            // التحقق من التطابق
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(ad.id);
            expect(retrieved?.name).toBe(ad.name);
            expect(retrieved?.type).toBe(ad.type);
            expect(retrieved?.fileUrl).toBe(ad.fileUrl);
            expect(retrieved?.fileName).toBe(ad.fileName);
            expect(retrieved?.fileSize).toBe(ad.fileSize);
            expect(retrieved?.screenId).toBe(ad.screenId);
            expect(retrieved?.duration).toBe(ad.duration);

            // التحقق من التواريخ (قد تختلف بالميلي ثانية بسبب التحويل)
            expect(retrieved?.createdAt.getTime()).toBe(ad.createdAt.getTime());
            expect(retrieved?.updatedAt.getTime()).toBe(ad.updatedAt.getTime());
          },
        ),
        { numRuns: 100 },
      );
    });

    it("يجب أن يحفظ عدة إعلانات ويستعيدها جميعاً", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(advertisementArbitrary(), { minLength: 1, maxLength: 10 }),
          async (ads: Advertisement[]) => {
            // حفظ جميع الإعلانات
            for (const ad of ads) {
              await service.saveAdvertisement(ad);
            }

            // استعادة جميع الإعلانات
            const allAds = await service.getAllAdvertisements();

            // التحقق من أن جميع الإعلانات موجودة
            for (const ad of ads) {
              expect(allAds[ad.id]).toBeDefined();
              expect(allAds[ad.id].name).toBe(ad.name);
            }

            // التحقق من العدد
            expect(Object.keys(allAds).length).toBeGreaterThanOrEqual(
              ads.length,
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it("يجب أن يحذف الإعلان بشكل صحيح", async () => {
      await fc.assert(
        fc.asyncProperty(
          advertisementArbitrary(),
          async (ad: Advertisement) => {
            // حفظ الإعلان
            await service.saveAdvertisement(ad);

            // التحقق من وجوده
            let retrieved = await service.getAdvertisement(ad.id);
            expect(retrieved).not.toBeNull();

            // حذف الإعلان
            await service.deleteAdvertisement(ad.id);

            // التحقق من عدم وجوده
            retrieved = await service.getAdvertisement(ad.id);
            expect(retrieved).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("يجب أن يتعامل مع تحديث الإعلان بشكل صحيح", async () => {
      await fc.assert(
        fc.asyncProperty(
          advertisementArbitrary(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (ad: Advertisement, newName: string) => {
            // حفظ الإعلان الأصلي
            await service.saveAdvertisement(ad);

            // تحديث الإعلان
            const updatedAd = { ...ad, name: newName, updatedAt: new Date() };
            await service.saveAdvertisement(updatedAd);

            // استعادة الإعلان
            const retrieved = await service.getAdvertisement(ad.id);

            // التحقق من التحديث
            expect(retrieved?.name).toBe(newName);
            expect(retrieved?.id).toBe(ad.id);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 2: إدارة الشاشات", () => {
    it("يجب أن يهيئ الشاشات الخمس تلقائياً", async () => {
      const screens = await service.getAllScreens();

      // التحقق من وجود 5 شاشات
      expect(Object.keys(screens).length).toBe(5);

      // التحقق من أن كل شاشة لها معرف من 1 إلى 5
      for (let i = 1; i <= 5; i++) {
        expect(screens[i]).toBeDefined();
        expect(screens[i].id).toBe(i);
        expect(screens[i].name).toBe(`شاشة ${i}`);
        expect(screens[i].status).toBe("idle");
        expect(screens[i].currentAdId).toBeNull();
      }
    });

    it("يجب أن يحفظ ويستعيد الشاشة بنفس البيانات", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.option(fc.uuid()),
          fc.constantFrom("active" as const, "idle" as const),
          async (
            screenId: number,
            adId: string | null,
            status: "active" | "idle",
          ) => {
            const screen = {
              id: screenId,
              name: `شاشة ${screenId}`,
              currentAdId: adId,
              cameraId: null,
              status,
              lastUpdate: new Date(),
            };

            // حفظ الشاشة
            await service.saveScreen(screen);

            // استعادة الشاشة
            const retrieved = await service.getScreen(screenId);

            // التحقق من التطابق
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(screen.id);
            expect(retrieved?.name).toBe(screen.name);
            expect(retrieved?.currentAdId).toBe(screen.currentAdId);
            expect(retrieved?.cameraId).toBe(screen.cameraId);
            expect(retrieved?.status).toBe(screen.status);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("معالجة الأخطاء", () => {
    it("يجب أن يرجع null للإعلان غير الموجود", async () => {
      const result = await service.getAdvertisement("non-existent-id");
      expect(result).toBeNull();
    });

    it("يجب أن يرجع null للشاشة غير الموجودة", async () => {
      const result = await service.getScreen(999);
      expect(result).toBeNull();
    });

    it("يجب أن يتعامل مع حذف إعلان غير موجود بدون خطأ", async () => {
      await expect(
        service.deleteAdvertisement("non-existent-id"),
      ).resolves.not.toThrow();
    });
  });

  describe("إعدادات التطبيق", () => {
    it("يجب أن يحفظ ويستعيد الإعدادات", async () => {
      const config = {
        screenshotInterval: 3000,
        screenshotQuality: 0.9,
        autoRefresh: false,
        lastUpdate: new Date(),
      };

      await service.saveAppConfig(config);
      const retrieved = await service.getAppConfig();

      expect(retrieved.screenshotInterval).toBe(config.screenshotInterval);
      expect(retrieved.screenshotQuality).toBe(config.screenshotQuality);
      expect(retrieved.autoRefresh).toBe(config.autoRefresh);
    });

    it("يجب أن يرجع الإعدادات الافتراضية إذا لم توجد", async () => {
      const config = await service.getAppConfig();

      expect(config.screenshotInterval).toBe(5000);
      expect(config.screenshotQuality).toBe(0.8);
      expect(config.autoRefresh).toBe(true);
    });
  });
});
