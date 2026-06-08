import { localStorageService } from "../storage/localStorage";
import { indexedDBService } from "../storage/indexedDB";
import type { Advertisement, Screen, Screenshot, AppConfig } from "../types";

/**
 * خدمة تخزين موحدة تجمع بين LocalStorage و IndexedDB
 * توفر واجهة واحدة للتعامل مع جميع عمليات التخزين
 */
export class StorageService {
  // إدارة الإعلانات

  /**
   * حفظ إعلان
   */
  async saveAdvertisement(ad: Advertisement): Promise<void> {
    await localStorageService.saveAdvertisement(ad);
  }

  /**
   * الحصول على إعلان
   */
  async getAdvertisement(id: string): Promise<Advertisement | null> {
    return await localStorageService.getAdvertisement(id);
  }

  /**
   * الحصول على جميع الإعلانات
   */
  async getAllAdvertisements(): Promise<Advertisement[]> {
    const adsStore = await localStorageService.getAllAdvertisements();
    return Object.values(adsStore).map((ad) => ({
      ...ad,
      createdAt: new Date(ad.createdAt),
      updatedAt: new Date(ad.updatedAt),
    }));
  }

  /**
   * حذف إعلان
   */
  async deleteAdvertisement(id: string): Promise<void> {
    // حذف بيانات الإعلان من LocalStorage
    await localStorageService.deleteAdvertisement(id);

    // TODO: حذف ملف الإعلان من IndexedDB إذا كان موجوداً
  }

  /**
   * الحصول على الإعلانات حسب الشاشة
   */
  async getAdvertisementsByScreen(screenId: number): Promise<Advertisement[]> {
    const allAds = await this.getAllAdvertisements();
    return allAds.filter((ad) => ad.screenId === screenId);
  }

  // إدارة الشاشات

  /**
   * حفظ شاشة
   */
  async saveScreen(screen: Screen): Promise<void> {
    await localStorageService.saveScreen(screen);
  }

  /**
   * الحصول على شاشة
   */
  async getScreen(id: number): Promise<Screen | null> {
    return await localStorageService.getScreen(id);
  }

  /**
   * الحصول على جميع الشاشات
   */
  async getAllScreens(): Promise<Screen[]> {
    const screensStore = await localStorageService.getAllScreens();
    return Object.values(screensStore).map((screen) => ({
      ...screen,
      lastUpdate: new Date(screen.lastUpdate),
    }));
  }

  // إدارة الملفات

  /**
   * حفظ ملف في IndexedDB
   * @returns URL للملف المحفوظ
   */
  async saveFile(file: File): Promise<string> {
    return await indexedDBService.saveFile(file);
  }

  /**
   * الحصول على ملف من IndexedDB
   */
  async getFile(fileId: string): Promise<File | null> {
    return await indexedDBService.getFile(fileId);
  }

  /**
   * حذف ملف من IndexedDB
   */
  async deleteFile(fileId: string): Promise<void> {
    await indexedDBService.deleteFile(fileId);
  }

  /**
   * إنشاء URL للملف من File object
   */
  createFileURL(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * إلغاء URL للملف
   */
  revokeFileURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  // إدارة اللقطات

  /**
   * حفظ لقطة شاشة
   */
  async saveScreenshot(screenshot: Screenshot): Promise<void> {
    await indexedDBService.saveScreenshot(screenshot);
  }

  /**
   * الحصول على لقطة شاشة
   */
  async getScreenshot(id: string): Promise<Screenshot | null> {
    return await indexedDBService.getScreenshot(id);
  }

  /**
   * الحصول على جميع اللقطات
   */
  async getAllScreenshots(): Promise<Screenshot[]> {
    return await indexedDBService.getAllScreenshots();
  }

  /**
   * الحصول على اللقطات حسب رقم الشاشة
   */
  async getScreenshotsByScreen(screenId: number): Promise<Screenshot[]> {
    return await indexedDBService.getScreenshotsByScreen(screenId);
  }

  /**
   * الحصول على أحدث لقطة لكل شاشة
   */
  async getLatestScreenshots(): Promise<Screenshot[]> {
    return await indexedDBService.getLatestScreenshots();
  }

  /**
   * حذف لقطة شاشة
   */
  async deleteScreenshot(id: string): Promise<void> {
    await indexedDBService.deleteScreenshot(id);
  }

  /**
   * حذف اللقطات القديمة
   */
  async deleteOldScreenshots(daysToKeep: number = 7): Promise<number> {
    return await indexedDBService.deleteOldScreenshots(daysToKeep);
  }

  // إدارة الإعدادات

  /**
   * الحصول على إعدادات التطبيق
   */
  async getAppConfig(): Promise<AppConfig> {
    return await localStorageService.getAppConfig();
  }

  /**
   * حفظ إعدادات التطبيق
   */
  async saveAppConfig(config: AppConfig): Promise<void> {
    await localStorageService.saveAppConfig(config);
  }

  // دوال مساعدة

  /**
   * مسح جميع البيانات (للاختبار فقط)
   */
  async clearAll(): Promise<void> {
    await localStorageService.clearAll();
    await indexedDBService.clearAll();
  }

  /**
   * إغلاق الاتصالات
   */
  close(): void {
    indexedDBService.close();
  }
}

// تصدير instance واحد للاستخدام في التطبيق
export const storageService = new StorageService();
