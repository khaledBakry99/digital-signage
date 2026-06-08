// نماذج البيانات الأساسية للنظام

export interface Advertisement {
  id: string; // UUID
  name: string; // اسم الإعلان
  type: "image" | "video"; // نوع الإعلان
  fileUrl: string; // رابط الملف المحلي
  fileName: string; // اسم الملف الأصلي
  fileSize: number; // حجم الملف بالبايت
  screenId: number; // رقم الشاشة (1-5)
  duration?: number; // مدة العرض للصور (ثواني)
  createdAt: Date; // تاريخ الإنشاء
  updatedAt: Date; // تاريخ آخر تحديث
}

export interface Screen {
  id: number; // 1-5
  name: string; // "شاشة 1", "شاشة 2", ...
  currentAdId: string | null; // معرف الإعلان الحالي
  cameraId: string | null; // معرف الكاميرا المرتبطة
  status: "active" | "idle"; // حالة الشاشة
  lastUpdate: Date; // آخر تحديث
}

export interface Screenshot {
  id: string; // UUID
  screenId: number; // رقم الشاشة (1-5)
  imageUrl: string; // رابط الصورة المحلي
  imageSize: number; // حجم الصورة بالبايت
  timestamp: Date; // وقت الالتقاط
}

export interface AppConfig {
  screenshotInterval: number; // 5000ms
  screenshotQuality: number; // 0.8
  autoRefresh: boolean; // true
  lastUpdate: Date;
}

export interface Change {
  type: "ad_created" | "ad_updated" | "ad_deleted" | "screen_updated";
  screenId?: number;
  advertisementId?: string;
  timestamp: Date;
}

// أنواع التخزين
export interface AdvertisementsStore {
  [id: string]: Advertisement;
}

export interface ScreensStore {
  [id: number]: Screen;
}

// صيغ الملفات المدعومة
export const SUPPORTED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const SUPPORTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
