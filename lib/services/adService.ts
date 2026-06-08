import { v4 as uuidv4 } from "uuid";
import { storageService } from "./storageService";
import type { Advertisement } from "../types";
import {
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from "../types";

/**
 * أخطاء خدمة الإعلانات
 */
export class AdServiceError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "AdServiceError";
  }
}

export class UnsupportedFileFormatError extends AdServiceError {
  constructor(fileName: string, fileType: string) {
    super(
      `الصيغة غير مدعومة. الرجاء رفع ملف بصيغة JPG, PNG, GIF, WebP للصور أو MP4, WebM, MOV للفيديوهات. الملف: ${fileName} (${fileType})`,
    );
    this.name = "UnsupportedFileFormatError";
  }
}

export class FileTooLargeError extends AdServiceError {
  constructor(fileSize: number, maxSize: number) {
    super(
      `حجم الملف كبير جداً. الحد الأقصى ${Math.round(maxSize / 1024 / 1024)} ميجابايت. حجم الملف: ${Math.round(fileSize / 1024 / 1024)} ميجابايت`,
    );
    this.name = "FileTooLargeError";
  }
}

/**
 * خدمة إدارة الإعلانات
 */
export class AdService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * التحقق من صيغة الملف
   */
  private validateFileFormat(file: File): {
    isValid: boolean;
    type: "image" | "video" | null;
  } {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // التحقق من الصور
    const isImage =
      SUPPORTED_IMAGE_FORMATS.some((format) => fileType === format) ||
      IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (isImage) {
      return { isValid: true, type: "image" };
    }

    // التحقق من الفيديوهات
    const isVideo =
      SUPPORTED_VIDEO_FORMATS.some((format) => fileType === format) ||
      VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (isVideo) {
      return { isValid: true, type: "video" };
    }

    return { isValid: false, type: null };
  }

  /**
   * التحقق من حجم الملف
   */
  private validateFileSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  /**
   * إنشاء إعلان جديد
   */
  async createAdvertisement(data: {
    name: string;
    file: File;
    screenId: number;
    duration?: number;
  }): Promise<Advertisement> {
    try {
      // التحقق من صيغة الملف
      const formatValidation = this.validateFileFormat(data.file);
      if (!formatValidation.isValid || !formatValidation.type) {
        throw new UnsupportedFileFormatError(data.file.name, data.file.type);
      }

      // التحقق من حجم الملف
      if (!this.validateFileSize(data.file)) {
        throw new FileTooLargeError(data.file.size, this.MAX_FILE_SIZE);
      }

      // حفظ الملف في IndexedDB
      const fileUrl = await storageService.saveFile(data.file);

      // إنشاء الإعلان
      const now = new Date();
      const advertisement: Advertisement = {
        id: uuidv4(),
        name: data.name,
        type: formatValidation.type,
        fileUrl,
        fileName: data.file.name,
        fileSize: data.file.size,
        screenId: data.screenId,
        duration: formatValidation.type === "image" ? data.duration : undefined,
        createdAt: now,
        updatedAt: now,
      };

      // حفظ الإعلان في LocalStorage
      await storageService.saveAdvertisement(advertisement);

      // تحديث الشاشة
      await this.updateScreenAdvertisement(data.screenId, advertisement.id);

      return advertisement;
    } catch (error) {
      if (error instanceof AdServiceError) {
        throw error;
      }
      throw new AdServiceError("فشل إنشاء الإعلان", error as Error);
    }
  }

  /**
   * تحديث إعلان موجود
   */
  async updateAdvertisement(
    id: string,
    data: Partial<{
      name: string;
      screenId: number;
      duration: number;
      file: File;
    }>,
  ): Promise<Advertisement> {
    try {
      // الحصول على الإعلان الحالي
      const existingAd = await storageService.getAdvertisement(id);
      if (!existingAd) {
        throw new AdServiceError("الإعلان غير موجود");
      }

      let fileUrl = existingAd.fileUrl;
      let fileName = existingAd.fileName;
      let fileSize = existingAd.fileSize;
      let type = existingAd.type;

      // إذا تم تحديث الملف
      if (data.file) {
        // التحقق من صيغة الملف
        const formatValidation = this.validateFileFormat(data.file);
        if (!formatValidation.isValid || !formatValidation.type) {
          throw new UnsupportedFileFormatError(data.file.name, data.file.type);
        }

        // التحقق من حجم الملف
        if (!this.validateFileSize(data.file)) {
          throw new FileTooLargeError(data.file.size, this.MAX_FILE_SIZE);
        }

        // حذف الملف القديم
        const oldFileId = existingAd.fileUrl.replace("indexeddb://", "");
        await storageService.deleteFile(oldFileId);

        // حفظ الملف الجديد
        fileUrl = await storageService.saveFile(data.file);
        fileName = data.file.name;
        fileSize = data.file.size;
        type = formatValidation.type;
      }

      // تحديث الإعلان
      const updatedAd: Advertisement = {
        ...existingAd,
        name: data.name ?? existingAd.name,
        screenId: data.screenId ?? existingAd.screenId,
        duration: data.duration ?? existingAd.duration,
        fileUrl,
        fileName,
        fileSize,
        type,
        updatedAt: new Date(),
      };

      // حفظ التحديثات
      await storageService.saveAdvertisement(updatedAd);

      // إذا تم تغيير الشاشة
      if (data.screenId && data.screenId !== existingAd.screenId) {
        // إزالة الإعلان من الشاشة القديمة
        await this.updateScreenAdvertisement(existingAd.screenId, null);
        // إضافة الإعلان للشاشة الجديدة
        await this.updateScreenAdvertisement(data.screenId, updatedAd.id);
      } else {
        // تحديث الشاشة الحالية
        await this.updateScreenAdvertisement(updatedAd.screenId, updatedAd.id);
      }

      return updatedAd;
    } catch (error) {
      if (error instanceof AdServiceError) {
        throw error;
      }
      throw new AdServiceError("فشل تحديث الإعلان", error as Error);
    }
  }

  /**
   * حذف إعلان
   */
  async deleteAdvertisement(id: string): Promise<void> {
    try {
      // الحصول على الإعلان
      const ad = await storageService.getAdvertisement(id);
      if (!ad) {
        throw new AdServiceError("الإعلان غير موجود");
      }

      // حذف الملف من IndexedDB
      const fileId = ad.fileUrl.replace("indexeddb://", "");
      await storageService.deleteFile(fileId);

      // حذف الإعلان من LocalStorage
      await storageService.deleteAdvertisement(id);

      // إزالة الإعلان من الشاشة
      await this.updateScreenAdvertisement(ad.screenId, null);
    } catch (error) {
      if (error instanceof AdServiceError) {
        throw error;
      }
      throw new AdServiceError("فشل حذف الإعلان", error as Error);
    }
  }

  /**
   * الحصول على إعلان
   */
  async getAdvertisement(id: string): Promise<Advertisement | null> {
    try {
      return await storageService.getAdvertisement(id);
    } catch (error) {
      throw new AdServiceError("فشل تحميل الإعلان", error as Error);
    }
  }

  /**
   * الحصول على جميع الإعلانات
   */
  async getAllAdvertisements(): Promise<Advertisement[]> {
    try {
      return await storageService.getAllAdvertisements();
    } catch (error) {
      throw new AdServiceError("فشل تحميل الإعلانات", error as Error);
    }
  }

  /**
   * الحصول على الإعلانات حسب الشاشة
   */
  async getAdvertisementsByScreen(screenId: number): Promise<Advertisement[]> {
    try {
      return await storageService.getAdvertisementsByScreen(screenId);
    } catch (error) {
      throw new AdServiceError("فشل تحميل إعلانات الشاشة", error as Error);
    }
  }

  /**
   * تحديث إعلان الشاشة
   */
  private async updateScreenAdvertisement(
    screenId: number,
    advertisementId: string | null,
  ): Promise<void> {
    const screen = await storageService.getScreen(screenId);
    if (screen) {
      screen.currentAdId = advertisementId;
      screen.status = advertisementId ? "active" : "idle";
      screen.lastUpdate = new Date();
      await storageService.saveScreen(screen);
    }
  }

  /**
   * التحقق من صيغة الملف (دالة عامة)
   */
  isFileFormatSupported(file: File): boolean {
    return this.validateFileFormat(file).isValid;
  }

  /**
   * الحصول على نوع الملف
   */
  getFileType(file: File): "image" | "video" | null {
    return this.validateFileFormat(file).type;
  }
}

// تصدير instance واحد للاستخدام في التطبيق
export const adService = new AdService();
