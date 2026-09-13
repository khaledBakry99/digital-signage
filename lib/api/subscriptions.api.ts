import { apiClient } from './client';
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  RenewSubscriptionInput,
  RenewSubscriptionDateInput,
} from '@/lib/types/superAdmin';

class SubscriptionsApi {
  // GET /api/Subscriptions?clientId={clientId}
  async getByClientId(clientId: number): Promise<Subscription[]> {
    return apiClient.get<Subscription[]>('/api/Subscriptions', { clientId });
  }

  // GET /api/Subscriptions/client-subscription?clientId={clientId}
  async getClientSubscription(clientId: number): Promise<Subscription> {
    return apiClient.get<Subscription>('/api/Subscriptions/client-subscription', { clientId });
  }

  // POST /api/Subscriptions
  async create(payload: CreateSubscriptionInput): Promise<Subscription> {
    return apiClient.post<Subscription>('/api/Subscriptions', payload);
  }

  // PUT /api/Subscriptions/{id}
  async update(id: number, payload: UpdateSubscriptionInput): Promise<Subscription> {
    return apiClient.put<Subscription>(`/api/Subscriptions/${id}`, payload);
  }

  // DELETE /api/Subscriptions/{id}
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/Subscriptions/${id}`);
  }

  // GET /api/Subscriptions/{id}/remaining
  async getRemainingDays(id: number): Promise<number> {
    return apiClient.get<number>(`/api/Subscriptions/${id}/remaining`);
  }

  // POST /api/Subscriptions/{id}/renew
  async renewByDays(id: number, payload: RenewSubscriptionInput): Promise<Subscription> {
    return apiClient.post<Subscription>(`/api/Subscriptions/${id}/renew`, payload);
  }

  // POST /api/Subscriptions/{id}/renew-date
  async renewByDate(id: number, payload: RenewSubscriptionDateInput): Promise<{ endsAtUtc: string }> {
    return apiClient.post<{ endsAtUtc: string }>(`/api/Subscriptions/${id}/renew-date`, payload);
  }

  // POST /api/Subscriptions/{id}/update-expiration-status
  async updateExpirationStatus(id: number): Promise<Subscription> {
    return apiClient.post<Subscription>(`/api/Subscriptions/${id}/update-expiration-status`);
  }

  // POST /api/Subscriptions/update-expiration-status-byclient?clientId={clientId}
  async updateExpirationStatusByClient(clientId: number): Promise<Subscription> {
    return apiClient.post<Subscription>(`/api/Subscriptions/update-expiration-status-byclient?clientId=${clientId}`);
  }
}

export const subscriptionsApi = new SubscriptionsApi();
