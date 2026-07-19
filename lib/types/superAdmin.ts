export type SystemUserRole = 'SuperAdmin' | 'ClientAdmin' | 'Operator' | 'Analyst';

export interface SuperAdminDashboardStats {
  totalClients: number;
  totalScreens: number;
  connectedScreens: number;
  disconnectedScreens: number;
  activeCampaigns: number;
  alerts: string[];
}

export interface ManagedUser {
  id: number;
  clientId: number;
  fullName: string;
  email: string;
  role: SystemUserRole;
  isActive: boolean;
  lastLoginAtUtc?: string;
}

export interface CreateManagedUserInput {
  clientId: number;
  fullName: string;
  email: string;
  password: string;
  role: SystemUserRole;
  isActive: boolean;
}

export interface UpdateManagedUserInput {
  fullName: string;
  email: string;
  role: SystemUserRole;
  isActive: boolean;
}

export interface ManagedClient {
  id: number;
  name: string;
  contactEmail: string;
  city: string;
  isActive: boolean;
  isAiEnabled: boolean;
  maxScreens: number;
  maxCameras: number;
  retentionDays: number;
  deactivationReason?: string | null;
  createdAtUtc: string;
}

export interface CreateClientInput {
  name: string;
  contactEmail: string;
  city: string;
  isAiEnabled: boolean;
  maxScreens: number;
  maxCameras: number;
  retentionDays: number;
}

export interface UpdateClientInput {
  name: string;
  contactEmail: string;
  city: string;
  isActive: boolean;
  isAiEnabled: boolean;
  maxScreens: number;
  maxCameras: number;
  retentionDays: number;
}

export interface DeactivateClientInput {
  reason: string;
}

// Subscription types
export type SubscriptionStatus = 'Draft' | 'Active' | 'Expired' | 'Cancelled';

export interface Subscription {
  id: number;
  clientId: number;
  planName: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: SubscriptionStatus;
  maxScreens: number;
  maxCameras: number;
  autoRenew: boolean;
}

export interface CreateSubscriptionInput {
  clientId: number;
  planName: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: SubscriptionStatus;
  maxScreens: number;
  maxCameras: number;
  autoRenew: boolean;
}

export interface UpdateSubscriptionInput {
  planName?: string;
  startsAtUtc?: string;
  endsAtUtc?: string;
  status?: SubscriptionStatus;
  maxScreens?: number;
  maxCameras?: number;
  autoRenew?: boolean;
}

export interface RenewSubscriptionInput {
  durationInDays: number;
}

export interface RenewSubscriptionDateInput {
  endsAtUtc: string;
}
