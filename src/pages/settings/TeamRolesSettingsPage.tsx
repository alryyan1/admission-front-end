import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { ConfigProvider, Card, Input, Button, Row, Col, Space, Typography, Tag, Popconfirm } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { getTeamRoles, createTeamRole, updateTeamRole, deleteTeamRole } from '@/services/teamRoleService'
import { InlineEditableField } from '@/components/patients/InlineEditableField'

const { Title, Text } = Typography

export function TeamRolesSettingsPage() {
  const antTheme = useAntTheme()
  const queryClient = useQueryClient()
  const [newRoleName, setNewRoleName] = useState('')

  const rolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team-roles'] })
  }

  const addRoleMutation = useMutation({
    mutationFn: createTeamRole,
    onSuccess: () => {
      toast.success('تمت إضافة الدور')
      setNewRoleName('')
      invalidate()
    },
  })

  const renameRoleMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateTeamRole(id, name),
    onSuccess: invalidate,
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteTeamRole,
    onSuccess: () => {
      toast.success('تم حذف الدور')
      invalidate()
    },
    onError: (error: unknown) => {
      const message = isAxiosError<{ errors?: { team_role?: string[] } }>(error)
        ? error.response?.data.errors?.team_role?.[0]
        : undefined
      toast.error(message ?? 'تعذر حذف الدور')
    },
  })

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        أدوار الفريق الطبي
      </Title>

      <Card title="الأدوار">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {(rolesQuery.data ?? []).map((role) => (
            <Row key={role.id} justify="space-between" align="middle">
              <Col>
                <Space>
                  <InlineEditableField
                    editable
                    value={role.name}
                    onSave={async (v) => {
                      await renameRoleMutation.mutateAsync({ id: role.id, name: String(v ?? '') })
                    }}
                  />
                  {role.is_protected && <Tag>أساسي</Tag>}
                </Space>
              </Col>
              <Col>
                {!role.is_protected && (
                  <Popconfirm
                    title="حذف الدور؟"
                    description="ستفشل إذا كان الدور مرتبطاً بأطباء أو أعضاء فريق."
                    onConfirm={() => deleteRoleMutation.mutate(role.id)}
                  >
                    <Button size="small" type="text" danger>
                      حذف
                    </Button>
                  </Popconfirm>
                )}
              </Col>
            </Row>
          ))}
          {(rolesQuery.data ?? []).length === 0 && <Text type="secondary">لا توجد أدوار بعد</Text>}
        </Space>

        <Space.Compact style={{ width: '100%', marginTop: 16 }}>
          <Input
            placeholder="دور جديد"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onPressEnter={() => newRoleName.trim() && addRoleMutation.mutate(newRoleName)}
          />
          <Button
            type="primary"
            loading={addRoleMutation.isPending}
            disabled={!newRoleName.trim()}
            onClick={() => addRoleMutation.mutate(newRoleName)}
          >
            إضافة
          </Button>
        </Space.Compact>
      </Card>
    </ConfigProvider>
  )
}
