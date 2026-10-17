import type { UserRole } from '@/types/auth'

export interface NavItem {
  to: string
  label: string
  roles?: UserRole[]
}

export interface NavSection {
  key: string
  label: string
  items: NavItem[]
}

/** Main sidebar items. '/' (dashboard) is intentionally excluded — it's always reachable. */
export const navItems: NavItem[] = [
  { to: '/', label: 'لوحة التحكم' },
  { to: '/admissions', label: 'سجل التنويم ' },
  { to: '/patients', label: 'سجل المرضى' },
  { to: '/facility-map', label: 'الغرف' },
  { to: '/operations', label: 'العمليات' },
  { to: '/expenses', label: 'المصروفات', roles: ['admin', 'cashier'] },
]

export const reportsNavItems: NavItem[] = [
  { to: '/reports/daily-revenue', label: 'الإيراد اليومي', roles: ['admin', 'cashier'] },
  { to: '/reports/doctor-entitlements', label: 'استحقاقات الأطباء', roles: ['admin', 'cashier'] },
  { to: '/reports/expenses', label: 'تقرير المصروفات', roles: ['admin', 'cashier'] },
  { to: '/reports/admission-revenue', label: 'إيرادات التنويم (الغرف)', roles: ['admin', 'cashier'] },
  { to: '/reports/referring-doctor-revenue', label: 'إيراد مرضى الطبيب المحول', roles: ['admin', 'cashier'] },
]

export const settingsNavItems: NavItem[] = [
  { to: '/settings/facility', label: 'الإعدادات العامة' },
  { to: '/settings/doctors', label: 'الأطباء' },
  { to: '/settings/services', label: 'كتالوج الخدمات' },
  { to: '/settings/procedures', label: 'كتالوج العمليات' },
  { to: '/settings/team-roles', label: 'أدوار الفريق الطبي' },
  { to: '/settings/insurance-companies', label: 'شركات التأمين' },
  { to: '/settings/users', label: 'المستخدمون' },
  { to: '/settings/whatsapp', label: 'واتساب' },
  { to: '/settings/sessions', label: 'الجلسات النشطة' },
  { to: '/settings/activity-log', label: 'سجل النشاط' },
  { to: '/settings/backup', label: 'النسخ الاحتياطي' },
]

/** All restrictable pages, grouped for the per-user access picker in settings. */
export const navSections: NavSection[] = [
  { key: 'main', label: 'القائمة الرئيسية', items: navItems.filter((item) => item.to !== '/') },
  { key: 'reports', label: 'التقارير', items: reportsNavItems },
  { key: 'settings', label: 'الإعدادات', items: settingsNavItems },
]

export function filterNavItemsByRole(items: NavItem[], role: UserRole | undefined): NavItem[] {
  return items.filter((item) => !item.roles || (role && item.roles.includes(role)))
}

/**
 * Whether `pathname` is reachable given a user's `allowedPages` list. `null`/`undefined`
 * means unrestricted (governed by role alone). The dashboard is always reachable.
 * Detail routes (e.g. `/admissions/42`) inherit their parent nav item's permission.
 */
export function isPathAllowed(pathname: string, allowedPages: string[] | null | undefined): boolean {
  if (!allowedPages) return true
  if (pathname === '/') return true

  return allowedPages.some((allowed) => allowed !== '/' && pathname.startsWith(allowed))
}
