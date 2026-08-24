import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Table, Tag, Popconfirm, Typography, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { ROLE_LABEL } from '@/lib/roles'
import { useAuth } from '@/contexts/AuthContext'
import { getUsers, createUser, updateUser, deleteUser, type UserPayload } from '@/services/userService'
import { UserFormModal } from '@/components/settings/UserFormModal'
import type { User } from '@/types/auth'

const { Title } = Typography

export function UsersSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [userModal, setUserModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: getUsers })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const saveUserMutation = useMutation({
    mutationFn: (payload: UserPayload & { id?: number }) => {
      const { id, ...data } = payload
      return id ? updateUser(id, data) : createUser(data)
    },
    onSuccess: () => {
      toast.success('تم حفظ المستخدم')
      invalidate()
      setUserModal({ open: false, user: null })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('تم حذف المستخدم')
      invalidate()
    },
  })

  const columns: ColumnsType<User> = [
    { title: 'الاسم', dataIndex: 'name', key: 'name' },
    { title: 'اسم المستخدم', dataIndex: 'username', key: 'username', render: (v) => `@${v}` },
    { title: 'الدور', key: 'role', render: (_, u) => <Tag>{ROLE_LABEL[u.role]}</Tag> },
    {
      title: 'الحالة',
      key: 'is_active',
      render: (_, u) => (u.is_active ? <Tag color="success">مفعّل</Tag> : <Tag color="error">غير مفعل</Tag>),
    },
    {
      title: '',
      key: 'actions',
      render: (_, u) => (
        <Space size={4}>
          <Button size="small" onClick={() => setUserModal({ open: true, user: u })}>
            تعديل
          </Button>
          <Popconfirm
            title="حذف المستخدم؟"
            description="لا يمكن التراجع عن هذا الإجراء."
            disabled={currentUser?.id === u.id}
            onConfirm={() => deleteUserMutation.mutate(u.id)}
          >
            <Button size="small" danger disabled={currentUser?.id === u.id}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        المستخدمون
      </Title>

      <Card
        title="قائمة المستخدمين"
        extra={
          <Button type="primary" onClick={() => setUserModal({ open: true, user: null })}>
            + مستخدم جديد
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={usersQuery.isLoading}
          columns={columns}
          dataSource={usersQuery.data ?? []}
          pagination={false}
        />
      </Card>

      <UserFormModal
        open={userModal.open}
        onClose={() => setUserModal({ open: false, user: null })}
        user={userModal.user}
        isSelf={currentUser?.id === userModal.user?.id}
        onSubmit={(payload) => saveUserMutation.mutate({ ...payload, id: userModal.user?.id })}
        isSubmitting={saveUserMutation.isPending}
      />
    </ConfigProvider>
  )
}
