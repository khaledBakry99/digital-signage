import type {
  Advertisement,
  Screen,
  AdvertisementsStore,
  ScreensStore,
  AppConfig,
} from "../types";

// مفاتيح التخزين
const STORAGE_KEYS = {
  ADVERTISEMENTS: "advertisements",
  SCREENS: "screens",
  APP_CONFIG: "app_config",
} as const;

// أخطاء التخزين
export class StorageError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class QuotaExceededError extends StorageError {
  constructor() {
    super("مساحة التخزين ممتلئة. الرجاء حذف بعض الإعلانات أو اللقطات القديمة");
    this.name = "QuotaExceededError";
  }
}

export class CorruptedDataError extends StorageError {
  constructor(key: string) {
    super(`تم اكتشاف بيانات تالفة في ${key}. سيتم إعادة تهيئة النظام`);
    this.name = "CorruptedDataError";
  }
}

/**
 * خدمة LocalStorage للتعامل مع تخزين البيانات محلياً
 */
export class LocalStorageService {
  /**
   * حفظ إعلان في LocalStorage
   */
  async saveAdvertisement(ad: Advertisement): Promise<void> {
    try {
      const ads = await this.getAllAdvertisements();
      ads[ad.id] = ad;
      this.setItem(STORAGE_KEYS.ADVERTISEMENTS, ads);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new QuotaExceededError();
      }
      throw new StorageError("فشل حفظ الإعلان", error as Error);
    }
  }

  /**
   * الحصول على إعلان من LocalStorage
   */
  async getAdvertisement(id: string): Promise<Advertisement | null> {
    try {
      const ads = await this.getAllAdvertisements();
      const ad = ads[id];

      if (!ad) {
        return null;
      }

      // تحويل التواريخ من strings إلى Date objects
      return {
        ...ad,
        createdAt: new Date(ad.createdAt),
        updatedAt: new Date(ad.updatedAt),
      };
    } catch (error) {
      throw new StorageError("فشل تحميل الإعلان", error as Error);
    }
  }

  /**
   * الحصول على جميع الإعلانات
   */
  async getAllAdvertisements(): Promise<AdvertisementsStore> {
    try {
      const data = this.getItem<AdvertisementsStore>(
        STORAGE_KEYS.ADVERTISEMENTS,
      );
      return data || {};
    } catch (error) {
      throw new CorruptedDataError(STORAGE_KEYS.ADVERTISEMENTS);
    }
  }

  /**
   * حذف إعلان من LocalStorage
   */
  async deleteAdvertisement(id: string): Promise<void> {
    try {
      const ads = await this.getAllAdvertisements();
      delete ads[id];
      this.setItem(STORAGE_KEYS.ADVERTISEMENTS, ads);
    } catch (error) {
      throw new StorageError("فشل حذف الإعلان", error as Error);
    }
  }

  /**
   * حفظ شاشة في LocalStorage
   */
  async saveScreen(screen: Screen): Promise<void> {
    try {
      const screens = await this.getAllScreens();
      screens[screen.id] = screen;
      this.setItem(STORAGE_KEYS.SCREENS, screens);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new QuotaExceededError();
      }
      throw new StorageError("فشل حفظ الشاشة", error as Error);
    }
  }

  /**
   * الحصول على شاشة من LocalStorage
   */
  async getScreen(id: number): Promise<Screen | null> {
    try {
      const screens = await this.getAllScreens();
      const screen = screens[id];

      if (!screen) {
        return null;
      }

      // تحويل التاريخ من string إلى Date object
      return {
        ...screen,
        lastUpdate: new Date(screen.lastUpdate),
      };
    } catch (error) {
      throw new StorageError("فشل تحميل الشاشة", error as Error);
    }
  }

  /**
   * الحصول على جميع الشاشات
   */
  async getAllScreens(): Promise<ScreensStore> {
    try {
      const data = this.getItem<ScreensStore>(STORAGE_KEYS.SCREENS);

      // إذا لم توجد بيانات، نقوم بتهيئة الشاشات الخمس
      if (!data || Object.keys(data).length === 0) {
        const initialScreens: ScreensStore = {};
        for (let i = 1; i <= 5; i++) {
          initialScreens[i] = {
            id: i,
            name: `شاشة ${i}`,
            currentAdId: null,
            cameraId: null,
            status: "idle",
            lastUpdate: new Date(),
          };
        }
        this.setItem(STORAGE_KEYS.SCREENS, initialScreens);
        return initialScreens;
      }

      // Migrate existing screens to add cameraId if missing
      let needsMigration = false;
      Object.values(data).forEach((screen: Screen) => {
        if (!("cameraId" in screen)) {
          (screen as Screen).cameraId = null;
          needsMigration = true;
        }
      });
      if (needsMigration) {
        this.setItem(STORAGE_KEYS.SCREENS, data);
      }

      return data;
    } catch (error) {
      throw new CorruptedDataError(STORAGE_KEYS.SCREENS);
    }
  }

  /**
   * الحصول على إعدادات التطبيق
   */
  async getAppConfig(): Promise<AppConfig> {
    try {
      const data = this.getItem<AppConfig>(STORAGE_KEYS.APP_CONFIG);

      // إذا لم توجد إعدادات، نقوم بإنشاء الإعدادات الافتراضية
      if (!data) {
        const defaultConfig: AppConfig = {
          screenshotInterval: 5000,
          screenshotQuality: 0.8,
          autoRefresh: true,
          lastUpdate: new Date(),
        };
        this.setItem(STORAGE_KEYS.APP_CONFIG, defaultConfig);
        return defaultConfig;
      }

      return {
        ...data,
        lastUpdate: new Date(data.lastUpdate),
      };
    } catch (error) {
      throw new CorruptedDataError(STORAGE_KEYS.APP_CONFIG);
    }
  }

  /**
   * حفظ إعدادات التطبيق
   */
  async saveAppConfig(config: AppConfig): Promise<void> {
    try {
      this.setItem(STORAGE_KEYS.APP_CONFIG, config);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new QuotaExceededError();
      }
      throw new StorageError("فشل حفظ الإعدادات", error as Error);
    }
  }

  /**
   * مسح جميع البيانات (للاختبار فقط)
   */
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.ADVERTISEMENTS);
      localStorage.removeItem(STORAGE_KEYS.SCREENS);
      localStorage.removeItem(STORAGE_KEYS.APP_CONFIG);
    } catch (error) {
      throw new StorageError("فشل مسح البيانات", error as Error);
    }
  }

  // دوال مساعدة خاصة

  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      throw new CorruptedDataError(key);
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }
}

// تصدير instance واحد للاستخدام في التطبيق
export const localStorageService = new LocalStorageService();
