// API client لـ GenderAi
import { apiClient } from './client';
import type { GenderAiResponse, GenderAiInput } from '../types/genderAi';

class GenderAiApi {
  private basePath = '/api/GenderAi';

  // تحليل صورة باستخدام AI للتعرف على الجنس والعمر
  async analyze(input: GenderAiInput): Promise<GenderAiResponse> {
    const formData = new FormData();
    formData.append('cameraId', String(input.cameraId));
    formData.append('image', input.image);
    
    if (input.niqabThreshold !== undefined) {
      formData.append('niqab_threshold', String(input.niqabThreshold));
    }
    
    if (input.childConfThreshold !== undefined) {
      formData.append('child_conf_threshold', String(input.childConfThreshold));
    }

    return apiClient.postFormData<GenderAiResponse>(`${this.basePath}/GetGenderAi`, formData);
  }
}

export const genderAiApi = new GenderAiApi();
