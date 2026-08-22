import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu as MenuIcon, Moon, Sun } from 'lucide-react'
import { ConfigProvider, Layout, Menu, Drawer, Button, Typography, Grid } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import type { UserRole } from '@/types/auth'

const { Header, Sider, Content } = Layout
const { Text } = Typography

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
  { to: '/settings/sessions', label: 'الجلسات النشطة', roles: ['admin'] },
]

const SIDER_WIDTH = 240
const HEADER_HEIGHT = 56

export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const antTheme = useAntTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const screens = Grid.useBreakpoint()
  const isDesktop = screens.sm ?? true

  const visibleNavItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  const selectedKey =
    visibleNavItems.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
    )?.to ?? ''

  const menuItems = visibleNavItems.map((item) => ({ key: item.to, label: item.label }))

  function handleNavigate(key: string) {
    navigate(key)
    setMobileOpen(false)
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Header
          style={{
            position: 'fixed',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            top: 0,
            zIndex: 40,
            height: HEADER_HEIGHT,
            lineHeight: `${HEADER_HEIGHT}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            background: 'var(--primary)',
          }}
        >
          {!isDesktop && (
            <Button
              type="text"
              icon={<MenuIcon size={18} color="var(--primary-foreground)" />}
              onClick={() => setMobileOpen(true)}
            />
          )}
          <Text strong ellipsis style={{ flex: 1, fontSize: 16 }}>
            نظام إدارة التنويم 
          </Text>
          {user && isDesktop && (
            <Text style={{ color: 'var(--primary-foreground)', fontSize: 13 }}>{user.name}</Text>
          )}
          <Button
            type="text"
            aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            icon={
              theme === 'dark' ? (
                <Sun size={18} color="var(--primary-foreground)" />
              ) : (
                <Moon size={18} color="var(--primary-foreground)" />
              )
            }
            onClick={toggleTheme}
          />
          <Button
            type="text"
            icon={<LogOut size={16} color="var(--primary-foreground)" />}
            onClick={() => logout()}
            style={{ color: 'var(--primary-foreground)' }}
          >
            تسجيل الخروج
          </Button>
        </Header>

        {!isDesktop && (
          <Drawer
            title="القائمة"
            placement="right"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            size={SIDER_WIDTH}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => handleNavigate(key)}
            />
          </Drawer>
        )}

        {isDesktop && (
          <Sider
            width={SIDER_WIDTH}
            style={{
              position: 'fixed',
              insetInlineStart: 0,
              top: HEADER_HEIGHT,
              bottom: 0,
              borderInlineEnd: '1px solid var(--border)',
              background: 'var(--background)',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => handleNavigate(key)}
              style={{ height: '100%', borderInlineEnd: 'none', background: 'transparent' }}
            />
          </Sider>
        )}

        <Layout
          style={{
            marginTop: HEADER_HEIGHT,
            marginInlineStart: isDesktop ? SIDER_WIDTH : 0,
            background: 'var(--background)',
          }}
        >
          <Content style={{ padding: 24, background: 'var(--background)' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
