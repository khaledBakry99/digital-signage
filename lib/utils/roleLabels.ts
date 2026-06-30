import type { UserRole } from '@/lib/types/auth';
import type { SystemUserRole } from '@/lib/types/superAdmin';

type AnyRole = UserRole | SystemUserRole;

const ROLE_LABELS: Record<AnyRole, string> = {
  SuperAdmin: 'مدير النظام',
  ClientAdmin: 'مسؤول العميل',
  Operator: 'مشغل',
  Analyst: 'محلل البيانات',
};

export function getRoleLabel(role?: AnyRole | string | null): string {
  if (!role) {
    return '—';
  }
  return ROLE_LABELS[role as AnyRole] ?? role;
}

export { ROLE_LABELS };
