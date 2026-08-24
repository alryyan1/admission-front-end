import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu as MenuIcon, Moon, Sun } from 'lucide-react'
import { ConfigProvider, Layout, Menu, Drawer, Button, Typography, Grid, theme as antdTheme } from 'antd'
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
  { to: '/settings/services', label: 'كتالوج الخدمات', roles: ['admin'] },
  { to: '/settings/doctors', label: 'الأطباء', roles: ['admin'] },
  { to: '/settings/team-roles', label: 'أدوار الفريق الطبي', roles: ['admin'] },
  { to: '/settings/sessions', label: 'الجلسات النشطة', roles: ['admin'] },
  { to: '/settings/activity-log', label: 'سجل النشاط', roles: ['admin'] },
]

const SIDER_WIDTH = 240
const HEADER_HEIGHT = 56

export function AppLayout() {
  const antTheme = useAntTheme()
  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <AppLayoutContent />
    </ConfigProvider>
  )
}

function AppLayoutContent() {
  const { user, logout } = useAuth()
  const { theme: mode, toggleTheme } = useTheme()
  const { token } = antdTheme.useToken()
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
    <Layout style={{ minHeight: '100vh' }}>
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
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {!isDesktop && (
          <Button type="text" icon={<MenuIcon size={18} />} onClick={() => setMobileOpen(true)} />
        )}
        <Text strong ellipsis style={{ flex: 1, fontSize: 16 }}>
          نظام إدارة التنويم
        </Text>
        {user && isDesktop && <Text style={{ fontSize: 13 }}>{user.name}</Text>}
        <Button
          type="text"
          aria-label={mode === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          icon={mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleTheme}
        />
        <Button type="text" icon={<LogOut size={16} />} onClick={() => logout()}>
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
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => handleNavigate(key)}
            style={{ height: '100%', borderInlineEnd: 'none' }}
          />
        </Sider>
      )}

      <Layout
        style={{
          marginTop: HEADER_HEIGHT,
          marginInlineStart: isDesktop ? SIDER_WIDTH : 0,
        }}
      >
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
