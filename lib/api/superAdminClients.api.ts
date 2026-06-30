import { apiClient } from './client';
import type {
  ManagedClient,
  CreateClientInput,
  UpdateClientInput,
  DeactivateClientInput,
} from '@/lib/types/superAdmin';

interface ClientQuery {
  search?: string;
}

class SuperAdminClientsApi {
  async getAll(params?: ClientQuery): Promise<ManagedClient[]> {
    const query: Record<string, unknown> | undefined = params?.search
      ? { search: params.search }
      : undefined;
    return apiClient.get<ManagedClient[]>('/api/Clients', query);
  }

  async getById(id: number): Promise<ManagedClient> {
    return apiClient.get<ManagedClient>(`/api/Clients/${id}`);
  }

  async create(payload: CreateClientInput): Promise<ManagedClient> {
    return apiClient.post<ManagedClient>('/api/Clients', payload);
  }

  async update(id: number, payload: UpdateClientInput): Promise<ManagedClient> {
    return apiClient.put<ManagedClient>(`/api/Clients/${id}`, payload);
  }

  async activate(id: number): Promise<ManagedClient> {
    return apiClient.post<ManagedClient>(`/api/Clients/${id}/activate`);
  }

  async deactivate(id: number, payload: DeactivateClientInput): Promise<ManagedClient> {
    return apiClient.post<ManagedClient>(`/api/Clients/${id}/deactivate`, payload);
  }
}

export const superAdminClientsApi = new SuperAdminClientsApi();
