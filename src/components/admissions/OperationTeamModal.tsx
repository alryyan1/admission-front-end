import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, Form, Select, Input, Button, Flex, Space, Tag, Table, Typography, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { addOperationTeamMember, removeOperationTeamMember } from '@/services/admissionService'
import type { OperationTeamMember } from '@/types/admission'

interface OperationTeamModalProps {
  open: boolean
  onClose: () => void
  operationId: number
  existingMembers?: OperationTeamMember[]
  onAdded?: () => void
}

type MemberRow = { role_id?: number; doctor_id?: number; name?: string }

const memberIdentity = (m: { doctor_id?: number | null; name?: string | null }) =>
  m.doctor_id ? `doctor:${m.doctor_id}` : m.name?.trim() ? `name:${m.name.trim().toLowerCase()}` : null

export function OperationTeamModal({ open, onClose, operationId, existingMembers = [], onAdded }: OperationTeamModalProps) {
  const [form] = Form.useForm<{ members: MemberRow[] }>()
  const membersWatch = Form.useWatch('members', form)

  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const defaultTeamRoleId = teamRolesQuery.data?.find((r) => r.slug === 'assistant_surgeon')?.id
  const teamRoleLabel = (roleId: number | undefined) =>
    teamRolesQuery.data?.find((r) => r.id === roleId)?.name ?? '—'

  const existingMemberKeys = new Set(existingMembers.map(memberIdentity).filter(Boolean) as string[])
  const existingDoctorIds = new Set(existingMembers.map((m) => m.doctor_id).filter(Boolean) as number[])

  const addMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperationTeamMember>[1]) => addOperationTeamMember(operationId, payload),
  })

  const removeMutation = useMutation({
    mutationFn: (teamMemberId: number) => removeOperationTeamMember(operationId, teamMemberId),
    onSuccess: () => {
      toast.success('تمت إزالة العضو')
      onAdded?.()
    },
    onError: () => toast.error('تعذر إزالة العضو'),
  })

  const existingMemberColumns: ColumnsType<OperationTeamMember> = [
    {
      title: 'الدور',
      key: 'role',
      render: (_, m) => <Tag>{m.role?.name ?? teamRoleLabel(m.role_id)}</Tag>,
    },
    {
      title: 'العضو',
      key: 'member',
      render: (_, m) => m.doctor?.name ?? m.name ?? '—',
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, m) => (
        <Popconfirm
          title="إزالة هذا العضو؟"
          okText="إزالة"
          cancelText="إلغاء"
          onConfirm={() => removeMutation.mutate(m.id)}
        >
          <Button
            danger
            type="text"
            size="small"
            loading={removeMutation.isPending && removeMutation.variables === m.id}
          >
            إزالة
          </Button>
        </Popconfirm>
      ),
    },
  ]

  async function handleFinish(values: { members: MemberRow[] }) {
    const candidates = (values.members ?? []).filter((m) => m.role_id && (m.doctor_id || m.name?.trim()))
    if (candidates.length === 0) return

    const seen = new Set<string>()
    const members: MemberRow[] = []
    let skipped = 0
    for (const m of candidates) {
      const key = memberIdentity(m)
      if (!key || existingMemberKeys.has(key) || seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      members.push(m)
    }

    if (skipped > 0) {
      toast.warning(`تم تجاهل ${skipped} عضواً مكرراً`)
    }
    if (members.length > 0) {
      await Promise.all(
        members.map((m) =>
          addMutation.mutateAsync({
            role_id: m.role_id as number,
            doctor_id: m.doctor_id ?? undefined,
            name: m.doctor_id ? undefined : m.name,
          }),
        ),
      )
      toast.success('تمت إضافة الفريق الطبي')
      onAdded?.()
    }
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="إضافة أعضاء الفريق الطبي"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="إضافة الكل"
      cancelText="إلغاء"
      confirmLoading={addMutation.isPending}
      width={680}
      destroyOnClose
    >
      {existingMembers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            الأعضاء الحاليون ({existingMembers.length})
          </Typography.Text>
          <Table<OperationTeamMember>
            rowKey="id"
            size="small"
            style={{ marginTop: 4 }}
            columns={existingMemberColumns}
            dataSource={existingMembers}
            pagination={false}
          />
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ members: [{ role_id: defaultTeamRoleId }] }}
      >
        <Form.List name="members">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {fields.map((field) => {
                const rowRoleId: number | undefined = membersWatch?.[field.name]?.role_id ?? defaultTeamRoleId
                const rowDoctorId: number | undefined = membersWatch?.[field.name]?.doctor_id
                const roleDoctors = (doctorsQuery.data ?? []).filter(
                  (d) => d.role_id === rowRoleId && (!existingDoctorIds.has(d.id) || d.id === rowDoctorId),
                )

                return (
                  <Flex key={field.key} gap={8} align="flex-end" wrap="wrap">
                    <Form.Item
                      {...field}
                      name={[field.name, 'role_id']}
                      label="الدور"
                      style={{ marginBottom: 0, width: 160 }}
                      initialValue={defaultTeamRoleId}
                    >
                      <Select
                        loading={teamRolesQuery.isLoading}
                        options={(teamRolesQuery.data ?? []).map((r) => ({ label: r.name, value: r.id }))}
                        onChange={() => form.setFieldValue(['members', field.name, 'doctor_id'], undefined)}
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'doctor_id']}
                      label="الطبيب (اختياري)"
                      style={{ marginBottom: 0, width: 200 }}
                    >
                      <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="اختر طبيباً"
                        notFoundContent={`لا يوجد أطباء بدور "${teamRoleLabel(rowRoleId)}"`}
                        options={roleDoctors.map((d) => ({ label: d.name, value: d.id }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      label="أو الاسم"
                      style={{ marginBottom: 0, width: 160 }}
                    >
                      <Input />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        إزالة
                      </Button>
                    )}
                  </Flex>
                )
              })}
              <Button type="dashed" onClick={() => add({ role_id: defaultTeamRoleId })} block>
                + إضافة صف
              </Button>
            </Space>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
