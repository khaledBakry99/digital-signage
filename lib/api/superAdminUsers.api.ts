import { apiClient } from './client';
import type {
  ManagedUser,
  CreateManagedUserInput,
  UpdateManagedUserInput,
} from '@/lib/types/superAdmin';

interface UserQuery {
  clientId?: number;
}

class SuperAdminUsersApi {
  async getAll(params?: UserQuery): Promise<ManagedUser[]> {
    const query: Record<string, unknown> | undefined = params?.clientId !== undefined
      ? { clientId: params.clientId }
      : undefined;
    return apiClient.get<ManagedUser[]>('/api/Users', query);
  }

  async create(payload: CreateManagedUserInput): Promise<ManagedUser> {
    return apiClient.post<ManagedUser>('/api/Users', payload);
  }

  async update(id: number, payload: UpdateManagedUserInput): Promise<ManagedUser> {
    return apiClient.put<ManagedUser>(`/api/Users/${id}`, payload);
  }
}

export const superAdminUsersApi = new SuperAdminUsersApi();
