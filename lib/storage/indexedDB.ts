import type { Screenshot } from "../types";

// اسم قاعدة البيانات والإصدار
const DB_NAME = "digital-signage-db";
const DB_VERSION = 1;

// أسماء المخازن
const STORES = {
  FILES: "files",
  SCREENSHOTS: "screenshots",
} as const;

// أخطاء IndexedDB
export class IndexedDBError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "IndexedDBError";
  }
}

/**
 * خدمة IndexedDB للتعامل مع الملفات الكبيرة واللقطات
 */
export class IndexedDBService {
  private db: IDBDatabase | null = null;

  /**
   * فتح قاعدة البيانات
   */
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(
          new IndexedDBError("فشل فتح قاعدة البيانات", request.error as Error),
        );
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // إنشاء مخزن الملفات
        if (!db.objectStoreNames.contains(STORES.FILES)) {
          db.createObjectStore(STORES.FILES);
        }

        // إنشاء مخزن اللقطات
        if (!db.objectStoreNames.contains(STORES.SCREENSHOTS)) {
          const screenshotStore = db.createObjectStore(STORES.SCREENSHOTS, {
            keyPath: "id",
          });
          // إنشاء فهرس للبحث حسب رقم الشاشة
          screenshotStore.createIndex("screenId", "screenId", {
            unique: false,
          });
          // إنشاء فهرس للبحث حسب الوقت
          screenshotStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  /**
   * حفظ ملف في IndexedDB
   * @returns URL للملف المحفوظ
   */
  async saveFile(file: File): Promise<string> {
    try {
      const db = await this.openDB();
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.FILES], "readwrite");
        const store = transaction.objectStore(STORES.FILES);

        const request = store.put(file, fileId);

        request.onsuccess = () => {
          // إنشاء URL للملف
          const url = `indexeddb://${fileId}`;
          resolve(url);
        };

        request.onerror = () => {
          reject(new IndexedDBError("فشل حفظ الملف", request.error as Error));
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل حفظ الملف", error as Error);
    }
  }

  /**
   * الحصول على ملف من IndexedDB
   */
  async getFile(fileId: string): Promise<File | null> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.FILES], "readonly");
        const store = transaction.objectStore(STORES.FILES);

        const request = store.get(fileId);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(new IndexedDBError("فشل تحميل الملف", request.error as Error));
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل تحميل الملف", error as Error);
    }
  }

  /**
   * حذف ملف من IndexedDB
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.FILES], "readwrite");
        const store = transaction.objectStore(STORES.FILES);

        const request = store.delete(fileId);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new IndexedDBError("فشل حذف الملف", request.error as Error));
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل حذف الملف", error as Error);
    }
  }

  /**
   * حفظ لقطة شاشة في IndexedDB
   */
  async saveScreenshot(screenshot: Screenshot): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SCREENSHOTS], "readwrite");
        const store = transaction.objectStore(STORES.SCREENSHOTS);

        // تحويل التاريخ إلى timestamp للتخزين
        const data = {
          ...screenshot,
          timestamp: screenshot.timestamp.getTime(),
        };

        const request = store.put(data);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new IndexedDBError("فشل حفظ اللقطة", request.error as Error));
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل حفظ اللقطة", error as Error);
    }
  }

  /**
   * الحصول على لقطة شاشة من IndexedDB
   */
  async getScreenshot(id: string): Promise<Screenshot | null> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SCREENSHOTS], "readonly");
        const store = transaction.objectStore(STORES.SCREENSHOTS);

        const request = store.get(id);

        request.onsuccess = () => {
          const data = request.result;
          if (!data) {
            resolve(null);
            return;
          }

          // تحويل timestamp إلى Date
          resolve({
            ...data,
            timestamp: new Date(data.timestamp),
          });
        };

        request.onerror = () => {
          reject(
            new IndexedDBError("فشل تحميل اللقطة", request.error as Error),
          );
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل تحميل اللقطة", error as Error);
    }
  }

  /**
   * الحصول على جميع اللقطات
   */
  async getAllScreenshots(): Promise<Screenshot[]> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SCREENSHOTS], "readonly");
        const store = transaction.objectStore(STORES.SCREENSHOTS);

        const request = store.getAll();

        request.onsuccess = () => {
          const screenshots = request.result.map((data: any) => ({
            ...data,
            timestamp: new Date(data.timestamp),
          }));
          resolve(screenshots);
        };

        request.onerror = () => {
          reject(
            new IndexedDBError("فشل تحميل اللقطات", request.error as Error),
          );
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل تحميل اللقطات", error as Error);
    }
  }

  /**
   * الحصول على اللقطات حسب رقم الشاشة
   */
  async getScreenshotsByScreen(screenId: number): Promise<Screenshot[]> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SCREENSHOTS], "readonly");
        const store = transaction.objectStore(STORES.SCREENSHOTS);
        const index = store.index("screenId");

        const request = index.getAll(screenId);

        request.onsuccess = () => {
          const screenshots = request.result.map((data: any) => ({
            ...data,
            timestamp: new Date(data.timestamp),
          }));
          resolve(screenshots);
        };

        request.onerror = () => {
          reject(
            new IndexedDBError("فشل تحميل اللقطات", request.error as Error),
          );
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل تحميل اللقطات", error as Error);
    }
  }

  /**
   * الحصول على أحدث لقطة لكل شاشة
   */
  async getLatestScreenshots(): Promise<Screenshot[]> {
    try {
      const allScreenshots = await this.getAllScreenshots();

      // تجميع اللقطات حسب الشاشة
      const latestByScreen = new Map<number, Screenshot>();

      for (const screenshot of allScreenshots) {
        const existing = latestByScreen.get(screenshot.screenId);
        if (!existing || screenshot.timestamp > existing.timestamp) {
          latestByScreen.set(screenshot.screenId, screenshot);
        }
      }

      return Array.from(latestByScreen.values());
    } catch (error) {
      throw new IndexedDBError("فشل تحميل أحدث اللقطات", error as Error);
    }
  }

  /**
   * حذف لقطة شاشة
   */
  async deleteScreenshot(id: string): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SCREENSHOTS], "readwrite");
        const store = transaction.objectStore(STORES.SCREENSHOTS);

        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new IndexedDBError("فشل حذف اللقطة", request.error as Error));
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل حذف اللقطة", error as Error);
    }
  }

  /**
   * حذف اللقطات القديمة (أكثر من 7 أيام)
   */
  async deleteOldScreenshots(daysToKeep: number = 7): Promise<number> {
    try {
      const allScreenshots = await this.getAllScreenshots();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      for (const screenshot of allScreenshots) {
        if (screenshot.timestamp < cutoffDate) {
          await this.deleteScreenshot(screenshot.id);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      throw new IndexedDBError("فشل حذف اللقطات القديمة", error as Error);
    }
  }

  /**
   * مسح جميع البيانات (للاختبار فقط)
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [STORES.FILES, STORES.SCREENSHOTS],
          "readwrite",
        );

        transaction.objectStore(STORES.FILES).clear();
        transaction.objectStore(STORES.SCREENSHOTS).clear();

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(
            new IndexedDBError("فشل مسح البيانات", transaction.error as Error),
          );
        };
      });
    } catch (error) {
      throw new IndexedDBError("فشل مسح البيانات", error as Error);
    }
  }

  /**
   * إغلاق قاعدة البيانات
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// تصدير instance واحد للاستخدام في التطبيق
export const indexedDBService = new IndexedDBService();
