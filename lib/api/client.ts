/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_CONFIG } from './config';

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Campaign daily start time and end time cannot be the same.": "وقت بداية ونهاية الحملة اليومية لا يمكن أن يكونا متطابقين.",
  "Assign campaign media for these slots before activation:": "يرجى تعيين إعلانات لهذه الأصناف قبل تفعيل الحملة:",
  "Assign campaign media for these slots before activation": "يرجى تعيين إعلانات لهذه الأصناف قبل تفعيل الحملة",
  "The field Priority must be between 1 and 100.": "حقل الأولوية يجب أن يكون بين 1 و 100.",
  "GirlsKidsMediaAssetId": "إعلان البنات",
  "BoysKidsMediaAssetId": "إعلان الأولاد",
  "MenMediaAssetId": "إعلان الرجال",
  "WomenMediaAssetId": "إعلان النساء",
  "DefaultMediaAssetId": "الإعلان الافتراضي",
  "Name": "اسم الحملة",
  "Description": "الوصف",
  "StartsAtUtc": "تاريخ البداية",
  "EndsAtUtc": "تاريخ النهاية",
  "One or more validation errors occurred.": "حدث خطأ واحد أو أكثر في التحقق من صحة المدخلات."
};

function translateErrorMessage(msg: string): string {
  if (!msg) return msg;
  let translated = msg;

  Object.entries(ERROR_TRANSLATIONS).forEach(([eng, arb]) => {
    const escapedEng = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedEng, 'gi');
    translated = translated.replace(regex, arb);
  });

  return translated;
}

export function extractApiError(err: any, defaultMsg: string = 'حدث خطأ في الاتصال'): string {
  if (!err) return defaultMsg;

  let rawMessage = defaultMsg;

  if (err.detail) {
    rawMessage = err.detail;
  } else if (err.errors && typeof err.errors === 'object') {
    const errorDetails = Object.entries(err.errors)
      .map(([field, messages]) => {
        const msgList = Array.isArray(messages) ? messages.join(', ') : String(messages);
        return `${field}: ${msgList}`;
      })
      .join(' | ');
    if (errorDetails) {
      rawMessage = `${err.message || defaultMsg} (${errorDetails})`;
    } else {
      rawMessage = err.message || defaultMsg;
    }
  } else {
    rawMessage = err.message || (err instanceof Error ? err.message : defaultMsg);
  }

  return translateErrorMessage(rawMessage);
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private handleUnauthorized(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Only dispatch session-expired event if user was actually authenticated
    // (i.e., had a token). This prevents showing the toast on login errors.
    const hadToken = localStorage.getItem('accessToken');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('expiresAtUtc');
    localStorage.removeItem('user');

    if (hadToken) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }

  // Dynamic timeout setter based on camera screenshot interval
  setDynamicTimeout(screenshotIntervalSeconds: number): void {
    // Set timeout to 3x the screenshot interval, minimum 60 seconds
    const calculatedTimeout = Math.max(screenshotIntervalSeconds * 3 * 1000, 60000);
    this.timeout = calculatedTimeout;
  }

  // Reset to default timeout
  resetTimeout(): void {
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...API_CONFIG.HEADERS,
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        const errMsg = errorData.message || errorData.title || (typeof errorData === 'string' ? errorData : responseText) || response.statusText || 'حدث خطأ في الاتصال';
        if (response.status === 401) {
          this.handleUnauthorized();
        }
        throw {
          message: errMsg,
          status: response.status,
          detail: errorData.detail,
          errors: errorData.errors,
        } as ApiError;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'انتهت مهلة الطلب',
            status: 408,
          } as ApiError;
        }
        throw {
          message: error.message || 'حدث خطأ في الاتصال',
        } as ApiError;
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = params ? this.buildQueryString(endpoint, params) : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  private buildQueryString(endpoint: string, params: Record<string, unknown>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return `${endpoint}?${query.toString()}`;
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.formDataRequest<T>(endpoint, 'POST', formData);
  }

  async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.formDataRequest<T>(endpoint, 'PUT', formData);
  }

  private async formDataRequest<T>(endpoint: string, method: 'POST' | 'PUT', formData: FormData): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        const errMsg = errorData.message || errorData.title || (typeof errorData === 'string' ? errorData : responseText) || response.statusText || 'حدث خطأ في الاتصال';
        if (response.status === 401) {
          this.handleUnauthorized();
        }
        throw {
          message: errMsg,
          status: response.status,
          detail: errorData.detail,
          errors: errorData.errors,
        } as ApiError;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'انتهت مهلة الطلب',
            status: 408,
          } as ApiError;
        }
        throw {
          message: error.message || 'حدث خطأ في الاتصال',
        } as ApiError;
      }

      throw error;
    }
  }
}

export const apiClient = new ApiClient();
