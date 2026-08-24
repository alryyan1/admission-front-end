import type { UserRole } from '@/types/auth'

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'مدير',
  doctor: 'طبيب',
  nurse: 'ممرض',
  admission_clerk: 'موظف استقبال',
  cashier: 'كاشير',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = (
  Object.keys(ROLE_LABEL) as UserRole[]
).map((value) => ({ value, label: ROLE_LABEL[value] }))
