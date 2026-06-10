import { genderAiApi } from "@/lib/api/genderAi.api";

/**
 * خدمة التقاط لقطات الشاشة من الكاميرا وإرسالها للـ AI
 * تعمل فقط على صفحات الكاميرات وليس على صفحات الإعلانات
 */
export class CameraScreenshotService {
  /**
   * التقاط لقطة من عنصر الفيديو/الكاميرا وإرسالها للـ AI
   * @param videoElement - عنصر الفيديو المراد التقاط اللقطة منه
   * @param cameraId - معرف الكاميرا
   * @param onSuccess - دالة النجاح (اختيارية)
   * @param onError - دالة الخطأ (اختيارية)
   */
  async captureAndSendToAi(
    videoElement: HTMLVideoElement,
    cameraId: number,
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      // التحقق من أن الفيديو يعمل
      if (videoElement.paused || videoElement.ended) {
        throw new Error("الفيديو ليس قيد التشغيل");
      }

      // إنشاء Canvas بحجم الفيديو
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // رسم الإطار الحالي من الفيديو على Canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("فشل إنشاء Canvas context");
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // تحويل Canvas إلى Blob (صورة JPEG)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error("فشل تحويل اللقطة إلى صورة"));
            }
          },
          "image/jpeg",
          0.85, // جودة عالية للدقة في الكشف
        );
      });

      // إنشاء ملف من Blob
      const file = new File([blob], `camera-${cameraId}-screenshot.jpg`, {
        type: "image/jpeg",
      });

      // إرسال الصورة للـ AI
      console.log(`جاري إرسال لقطة الكاميرا ${cameraId} للـ AI...`);
      const result = await genderAiApi.detectGender(cameraId, file);

      // تنفيذ دالة النجاح إذا تم توفيرها
      if (onSuccess) {
        onSuccess(result);
      }

      console.log(`تم إرسال لقطة الكاميرا ${cameraId} للـ AI بنجاح:`, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`فشل إرسال لقطة الكاميرا ${cameraId}:`, err);

      // تنفيذ دالة الخطأ إذا تم توفيرها
      if (onError) {
        onError(err);
      }

      throw err;
    }
  }

  /**
   * بدء التقاط دوري للقطات الشاشة من الكاميرا
   * @param videoElement - عنصر الفيديو
   * @param cameraId - معرف الكاميرا
   * @param intervalSeconds - الفاصل الزمني بين اللقطات بالثواني
   * @returns دالة للتوقف عن التقاط اللقطات
   */
  startPeriodicCapture(
    videoElement: HTMLVideoElement,
    cameraId: number,
    intervalSeconds: number = 30,
  ): () => void {
    // بدء اللقطة الأولى بعد تأخير
    const initialTimeout = setTimeout(() => {
      this.captureAndSendToAi(videoElement, cameraId).catch((error) => {
        console.error("خطأ في اللقطة الأولية:", error);
      });
    }, 3000);

    // التقاط الدورية
    const interval = setInterval(() => {
      // تجاهل الأخطاء في اللقطات الدورية
      this.captureAndSendToAi(videoElement, cameraId).catch((error) => {
        console.error("خطأ في لقطة دورية:", error);
      });
    }, intervalSeconds * 1000);

    // إرجاع دالة للتوقف
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      console.log(`تم إيقاف التقاط لقطات الكاميرا ${cameraId}`);
    };
  }
}

export const cameraScreenshotService = new CameraScreenshotService();
