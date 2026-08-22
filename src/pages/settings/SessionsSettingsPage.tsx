import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Table, Tag, Button, Popconfirm, Typography, Space, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { PageLoader } from '@/components/common/PageLoader'
import { getSessions, revokeSession, revokeAllSessionsForUser } from '@/services/sessionService'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/auth'
import type { UserSession, UserWithSessions } from '@/types/session'

const { Title, Text } = Typography

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'مدير',
  doctor: 'طبيب',
  nurse: 'ممرض',
  admission_clerk: 'موظف استقبال',
  cashier: 'كاشير',
}

export function SessionsSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: getSessions })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      toast.success('تم إنهاء الجلسة')
      invalidate()
    },
  })

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessionsForUser,
    onSuccess: () => {
      toast.success('تم إنهاء جميع الجلسات')
      invalidate()
    },
  })

  const columns: ColumnsType<UserSession> = [
    { title: 'الجهاز / الجلسة', dataIndex: 'name', key: 'name' },
    {
      title: 'آخر استخدام',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (v: string | null) => (v ? formatDateTime(v) : '—'),
    },
    { title: 'تاريخ الإنشاء', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, token) => (
        <Popconfirm title="إنهاء هذه الجلسة؟" onConfirm={() => revokeMutation.mutate(token.id)}>
          <Button size="small" danger loading={revokeMutation.isPending}>
            إنهاء
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const users = sessionsQuery.data ?? []

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        الجلسات النشطة
      </Title>

      {sessionsQuery.isLoading && <PageLoader />}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {users.map((u: UserWithSessions) => (
          <Card
            key={u.id}
            title={
              <Space>
                <span className="font-semibold">{u.name}</span>
                <Text type="secondary">@{u.username}</Text>
                <Tag>{ROLE_LABEL[u.role]}</Tag>
                {!u.is_active && <Tag color="error">غير مفعل</Tag>}
              </Space>
            }
            extra={
              u.tokens.length > 0 && (
                <Popconfirm
                  title="إنهاء جميع جلسات هذا المستخدم؟"
                  description={
                    currentUser?.id === u.id ? 'سيتم الإبقاء على جلستك الحالية.' : 'لا يمكن التراجع عن هذا الإجراء.'
                  }
                  onConfirm={() => revokeAllMutation.mutate(u.id)}
                >
                  <Button size="small" danger loading={revokeAllMutation.isPending}>
                    إنهاء الكل
                  </Button>
                </Popconfirm>
              )
            }
          >
            {u.tokens.length === 0 ? (
              <Empty description="لا توجد جلسات نشطة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={u.tokens}
                pagination={false}
              />
            )}
          </Card>
        ))}

        {!sessionsQuery.isLoading && users.length === 0 && <Empty description="لا يوجد مستخدمون" />}
      </Space>
    </ConfigProvider>
  )
}
