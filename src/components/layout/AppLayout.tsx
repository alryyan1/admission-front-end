import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ModeToggle } from '@/components/common/ModeToggle'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/auth'

interface NavItem {
  to: string
  label: string
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'لوحة التحكم' },
  { to: '/admissions', label: 'حالات التنويم' },
  { to: '/patients', label: 'المرضى' },
  { to: '/facility-map', label: 'خريطة المستشفى' },
  { to: '/operations', label: 'العمليات' },
  { to: '/statistics', label: 'الإحصائيات' },
  { to: '/settings/facility', label: 'الإعدادات', roles: ['admin'] },
  { to: '/settings/procedures', label: 'كتالوج العمليات', roles: ['admin'] },
]

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent font-bold text-accent-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleNavItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b bg-primary px-4 text-primary-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="flex-1 truncate text-base font-semibold">نظام التنويم — Jawda Inpatient</span>
        {user && <span className="hidden text-sm sm:inline">{user.name}</span>}
        <ModeToggle className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
        <Button
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-60 p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <NavList items={visibleNavItems} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <aside className="fixed inset-y-0 start-0 top-14 hidden w-60 border-e bg-background sm:block">
        <NavList items={visibleNavItems} />
      </aside>

      <main className="flex-1 p-6 pt-20 sm:ms-60">
        <Outlet />
      </main>
    </div>
  )
}
