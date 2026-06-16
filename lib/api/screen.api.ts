// API client لـ Screens
import { apiClient } from './client';
import type {
  Screen,
  CreateScreenInput,
  UpdateScreenInput,
  ScreenCurrentMedia,
  ScreenActiveCampaign,
  MediaSlot,
  ScreenMediaSlots,
  MediaAssignments,
} from '../types/screen';

class ScreenApi {
  private basePath = '/api/Screens';

  // جلب جميع الشاشات
  async getAll(params?: { clientId?: number }): Promise<Screen[]> {
    return apiClient.get<Screen[]>(this.basePath, params);
  }

  // إنشاء شاشة جديدة
  async create(input: CreateScreenInput): Promise<Screen> {
    return apiClient.post<Screen>(this.basePath, input);
  }

  // جلب شاشة بالـ ID
  async getById(id: number): Promise<Screen> {
    return apiClient.get<Screen>(`${this.basePath}/${id}`);
  }

  // تحديث شاشة
  async update(id: number, input: UpdateScreenInput): Promise<Screen> {
    return apiClient.put<Screen>(`${this.basePath}/${id}`, input);
  }

  // حذف شاشة
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // جلب الإعلان الحالي للشاشة
  async getCurrentMedia(id: number): Promise<ScreenCurrentMedia> {
    return apiClient.get<ScreenCurrentMedia>(`${this.basePath}/${id}/GetScreenCurrentMedia`);
  }

  // جلب الحملة النشطة للشاشة
  async getActiveCampaign(id: number): Promise<ScreenActiveCampaign> {
    return apiClient.get<ScreenActiveCampaign>(`${this.basePath}/${id}/GetActiveCampaign`);
  }

  // تعيين حملة للشاشة
  async assignCampaign(id: number, campaignId: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-campaign`, { campaignId });
  }

  // إزالة حملة من الشاشة
  async removeCampaign(id: number): Promise<Screen> {
    return apiClient.delete<Screen>(`${this.basePath}/${id}/campaign`);
  }

  // تعيين كاميرا للشاشة
  async assignCamera(id: number, cameraId: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-camera`, { cameraId });
  }

  // إزالة كاميرا من الشاشة
  async removeCamera(id: number): Promise<Screen> {
    return apiClient.delete<Screen>(`${this.basePath}/${id}/camera`);
  }

  // تفعيل/تعطيل الذكاء الاصطناعي
  async toggleAI(id: number, aiEnabled: boolean): Promise<Screen> {
    return apiClient.put<Screen>(`${this.basePath}/${id}`, { aiEnabled });
  }

  // تعيين إعلان لـ slot معين
  async assignMediaSlot(id: number, slot: MediaSlot, mediaAssetId: number): Promise<ScreenMediaSlots> {
    return apiClient.post<ScreenMediaSlots>(
      `${this.basePath}/${id}/assign-media/slots/${slot}`,
      { mediaAssetId }
    );
  }

  // إزالة إعلان من slot معين
  async removeMediaSlot(id: number, slot: MediaSlot): Promise<ScreenMediaSlots> {
    return apiClient.delete<ScreenMediaSlots>(`${this.basePath}/${id}/assign-media/slots/${slot}`);
  }

  // جلب جميع الإعلانات للشاشة
  async getMedia(id: number): Promise<ScreenMediaSlots> {
    return apiClient.get<ScreenMediaSlots>(`${this.basePath}/${id}/media`);
  }

  // تعيين جميع الإعلانات دفعة واحدة
  async assignAllMedia(id: number, assignments: MediaAssignments): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/assign-media`, assignments);
  }

  // حذف جميع الإعلانات
  async clearAllMedia(id: number): Promise<ScreenMediaSlots> {
    return apiClient.delete<ScreenMediaSlots>(`${this.basePath}/${id}/assign-media`);
  }

  // تفعيل الشاشة (عند فتحها)
  async activate(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/activate`, {});
  }

  // تعطيل الشاشة (عند إغلاقها)
  async deactivate(id: number): Promise<Screen> {
    return apiClient.post<Screen>(`${this.basePath}/${id}/deactivate`, {});
  }
}

export const screenApi = new ScreenApi();
