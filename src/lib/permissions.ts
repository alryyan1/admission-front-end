import type { AuthUser, User } from '@/types/auth'

export const PERMISSION_ADD_DIRECT_DEPOSIT = 'add_direct_deposit'

export interface PermissionOption {
  key: string
  label: string
}

/** Grantable, additive capabilities beyond what a role implies by default — see the matching User::AVAILABLE_PERMISSIONS on the backend. */
export const permissionOptions: PermissionOption[] = [
  {
    key: PERMISSION_ADD_DIRECT_DEPOSIT,
    label: 'إضافة دفعة مباشرة (غير مرتبطة بخدمة أو عملية)',
  },
]

export function hasPermission(user: AuthUser | User | null | undefined, permission: string): boolean {
  return Boolean(user?.permissions?.includes(permission))
}
