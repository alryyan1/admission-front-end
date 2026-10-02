import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, LogOut, Menu as MenuIcon, Moon, Search, Settings, Sun, UserRound } from 'lucide-react'
import {
  ConfigProvider,
  Layout,
  Menu,
  Drawer,
  Button,
  Input,
  DatePicker,
  Select,
  Typography,
  Grid,
  Dropdown,
  theme as antdTheme,
} from 'antd'
import type { MenuProps } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getRooms, getBeds } from '@/services/facilityService'
import type { UserRole } from '@/types/auth'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

/** Provided to child routes via {@link Outlet}'s context; only {@link AdmissionsPage} reads it. */
export interface AdmissionsFiltersContext {
  dateRange: [Dayjs, Dayjs] | null
  setDateRange: (range: [Dayjs, Dayjs] | null) => void
  dateRangeClearedBySearch: boolean
  setDateRangeClearedBySearch: (value: boolean) => void
  roomId: number | null
  bedId: number | null
}

function defaultDateRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('month')]
}

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface NavItem {
  to: string
  label: string
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'لوحة التحكم' },
  { to: '/admissions', label: 'سجل التنويم ' },
  { to: '/patients', label: 'سجل المرضى' },
  { to: '/facility-map', label: 'الغرف' },
  { to: '/operations', label: 'العمليات' },
  { to: '/statistics', label: 'الإحصائيات' },
  { to: '/expenses', label: 'المصروفات', roles: ['admin', 'cashier'] },
]

const settingsNavItems: NavItem[] = [
  { to: '/settings/facility', label: 'الإعدادات العامة' },
  { to: '/settings/doctors', label: 'الأطباء' },
  { to: '/settings/services', label: 'كتالوج الخدمات' },
  { to: '/settings/procedures', label: 'كتالوج العمليات' },
  { to: '/settings/team-roles', label: 'أدوار الفريق الطبي' },
  { to: '/settings/users', label: 'المستخدمون' },
  { to: '/settings/sessions', label: 'الجلسات النشطة' },
  { to: '/settings/activity-log', label: 'سجل النشاط' },
  { to: '/settings/backup', label: 'النسخ الاحتياطي' },
]

const SIDER_WIDTH = 170
const HEADER_HEIGHT = 56

const sidebarMenuTheme = {
  components: {
    Menu: {
      itemHeight: 48,
      fontSize: 15,
      iconSize: 18,
      itemMarginInline: 10,
      itemMarginBlock: 4,
    },
  },
}

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
  const [globalSearch, setGlobalSearch] = useState('')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange())
  const [dateRangeClearedBySearch, setDateRangeClearedBySearch] = useState(false)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [bedId, setBedId] = useState<number | null>(null)
  const screens = Grid.useBreakpoint()
  const isDesktop = screens.sm ?? true
  const isAdmissionsPage = location.pathname === '/admissions'

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: () => getRooms(), enabled: isAdmissionsPage })
  const bedsQuery = useQuery({
    queryKey: ['beds', roomId],
    queryFn: () => getBeds(roomId ?? undefined),
    enabled: isAdmissionsPage && !!roomId,
  })

  function handleGlobalSearch() {
    const value = globalSearch.trim()
    if (!value) {
      navigate('/admissions?search=')
      return
    }
    const params = new URLSearchParams()
    params.set(/^\d+$/.test(value) ? 'admission_id' : 'search', value)
    navigate(`/admissions?${params.toString()}`)
  }

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

  const isAdmin = user?.role === 'admin'

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            @{user?.username}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    ...(isAdmin
      ? [
          {
            key: 'settings',
            label: 'الإعدادات',
            icon: <Settings size={14} />,
            children: settingsNavItems.map((item) => ({ key: item.to, label: item.label })),
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'logout',
      label: 'تسجيل الخروج',
      icon: <LogOut size={14} />,
      danger: true,
    },
  ]

  function handleUserMenuClick({ key }: { key: string }) {
    if (key === 'logout') {
      void logout()
      return
    }
    if (key.startsWith('/')) {
      navigate(key)
    }
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
     
        {isDesktop && (
          <Input
            allowClear
            placeholder="بحث باسم المريض أو رقم التنويم..."
            prefix={<Search size={14} color={token.colorTextQuaternary} />}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onPressEnter={handleGlobalSearch}
            onClear={() => navigate('/admissions?search=')}
            style={{ flex: '0 1 320px' }}
          />
        )}
        {isDesktop && isAdmissionsPage && (
          <>
            <RangePicker
              value={dateRange}
              onChange={(values) => {
                setDateRange(values as [Dayjs, Dayjs] | null)
                setDateRangeClearedBySearch(false)
              }}
              format="YYYY-MM-DD"
              allowClear
              placeholder={['من تاريخ', 'إلى تاريخ']}
              style={{ width: 220 }}
            />
            <Select
              style={{ width: 220 }}
              placeholder="الغرفة"
              allowClear
              showSearch
              optionFilterProp="label"
              loading={roomsQuery.isLoading}
              value={roomId ?? undefined}
              onChange={(value) => {
                setRoomId(value ?? null)
                setBedId(null)
              }}
              options={[...(roomsQuery.data ?? [])]
                .sort((a, b) => {
                  const floorCompare = (a.ward?.floor?.id ?? 0) - (b.ward?.floor?.id ?? 0)
                  if (floorCompare !== 0) return floorCompare
                  const wardCompare = (a.ward?.id ?? 0) - (b.ward?.id ?? 0)
                  if (wardCompare !== 0) return wardCompare
                  return a.room_number.localeCompare(b.room_number)
                })
                .map((room) => ({
                  value: room.id,
                  label: [room.ward?.floor?.name, room.ward?.name, `غرفة ${room.room_number}`]
                    .filter(Boolean)
                    .join(' — '),
                }))}
            />
            <Select
              style={{ width: 120 }}
              placeholder="السرير"
              allowClear
              disabled={!roomId}
              loading={bedsQuery.isLoading}
              value={bedId ?? undefined}
              onChange={(value) => setBedId(value ?? null)}
              options={(bedsQuery.data ?? []).map((bed) => ({
                value: bed.id,
                label: `سرير ${bed.bed_number}`,
              }))}
            />
          </>
        )}
        <div style={{ flex: 1 }} />
        <Button
          type="text"
          aria-label={mode === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          icon={mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleTheme}
        />
        {user && (
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserRound size={16} />
              {isDesktop && <Text style={{ fontSize: 13 }}>{user.name}</Text>}
              <ChevronDown size={14} />
            </Button>
          </Dropdown>
        )}
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
          <ConfigProvider theme={sidebarMenuTheme}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => handleNavigate(key)}
              style={{ fontWeight: 600 }}
            />
          </ConfigProvider>
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
          <ConfigProvider theme={sidebarMenuTheme}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => handleNavigate(key)}
              style={{ height: '100%', borderInlineEnd: 'none', fontWeight: 600 }}
            />
          </ConfigProvider>
        </Sider>
      )}

      <Layout
        style={{
          marginTop: HEADER_HEIGHT,
          marginInlineStart: isDesktop ? SIDER_WIDTH : 0,
        }}
      >
        <Content style={{ padding: 24 }}>
          <Outlet
            context={
              {
                dateRange,
                setDateRange,
                dateRangeClearedBySearch,
                setDateRangeClearedBySearch,
                roomId,
                bedId,
              } satisfies AdmissionsFiltersContext
            }
          />
        </Content>
      </Layout>
    </Layout>
  )
}
