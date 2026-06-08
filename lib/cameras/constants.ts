// Camera System Constants

export const MAX_CAMERAS = 4;
export const RECONNECT_ATTEMPTS = 3;
export const RECONNECT_DELAY = 5000; // 5 seconds
export const RECONNECT_BACKOFF_MULTIPLIER = 1.5;

export const DEFAULT_FRAME_RATE = 30;
export const DEFAULT_RESOLUTION = "1080p" as const;
export const DEFAULT_QUALITY = "medium" as const;

export const STORAGE_KEYS = {
  CAMERAS: "cameras",
  CAMERA_SETTINGS: "camera_settings",
} as const;

export const ERROR_MESSAGES = {
  MAX_CAMERAS_REACHED: "تم الوصول للحد الأقصى من الكاميرات (4)",
  PERMISSION_DENIED: "الرجاء السماح بالوصول للكاميرا من إعدادات المتصفح",
  CAMERA_NOT_FOUND: "لم يتم العثور على كاميرا متصلة بالجهاز",
  CAMERA_IN_USE: "الكاميرا مستخدمة من تطبيق آخر. الرجاء إغلاق التطبيقات الأخرى",
  CONNECTION_FAILED: "فشل الاتصال بالكاميرا. جاري إعادة المحاولة...",
  INVALID_URL: "رابط البث غير صالح. الرجاء التحقق من الرابط",
  UNSUPPORTED_FORMAT:
    "صيغة البث غير مدعومة. الصيغ المدعومة: HLS, MJPEG, WebRTC",
  STORAGE_FULL: "مساحة التخزين ممتلئة. الرجاء حذف بعض الكاميرات",
  LOAD_FAILED: "فشل تحميل البيانات. الرجاء إعادة تحميل الصفحة",
  RECONNECT_FAILED: "فشل إعادة الاتصال. الرجاء التحقق من الكاميرا والشبكة",
} as const;
