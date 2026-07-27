import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export class PasswordApi {
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post<void>(API_ENDPOINTS.PASSWORD.FORGOT_PASSWORD, { email });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post<void>(API_ENDPOINTS.PASSWORD.RESET_PASSWORD, data);
  }
}

export const passwordApi = new PasswordApi();
