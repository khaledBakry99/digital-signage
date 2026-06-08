import { storageService } from "./storageService";
import type { Screen, Advertisement } from "../types";

/**
 * خدمة إدارة الشاشات
 */
export class ScreenService {
  /**
   * الحصول على شاشة
   */
  async getScreen(id: number): Promise<Screen | null> {
    return await storageService.getScreen(id);
  }

  /**
   * الحصول على جميع الشاشات
   */
  async getAllScreens(): Promise<Screen[]> {
    return await storageService.getAllScreens();
  }

  /**
   * تحديث شاشة
   */
  async updateScreen(screen: Screen): Promise<void> {
    await storageService.saveScreen(screen);
  }

  /**
   * الحصول على إعلان الشاشة
   */
  async getScreenAdvertisement(screenId: number): Promise<Advertisement | null> {
    const screen = await this.getScreen(screenId);
    if (!screen || !screen.currentAdId) {
      return null;
    }
    return await storageService.getAdvertisement(screen.currentAdId);
  }
}

export const screenService = new ScreenService();
