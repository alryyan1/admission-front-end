import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Button, Input, Table, Tag, Typography, Flex, Space, Badge } from 'antd'
import { EditOutlined, TeamOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDateTime } from '@/lib/utils'
import { getAllOperations } from '@/services/operationService'
import { updateOperation } from '@/services/admissionService'
import { ScheduleOperationModal } from '@/components/admissions/ScheduleOperationModal'
import { OperationPriceCell } from '@/components/admissions/OperationPriceCell'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import type { Operation } from '@/types/admission'

const { Title, Text } = Typography

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function OperationsPage() {
  const antTheme = useAntTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')

  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)

  const operationsQuery = useQuery({
    queryKey: ['operations', date, search],
    queryFn: () =>
      getAllOperations({
        date: date || undefined,
        search: search || undefined,
      }),
  })

  const teamOperation =
    teamOperationId != null
      ? (operationsQuery.data?.data ?? []).find((op) => op.id === teamOperationId) ?? null
      : null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['operations'] })
  }

  const updateMutation = useMutation({
    mutationFn: (vars: { operationId: number; payload: Parameters<typeof updateOperation>[1] }) =>
      updateOperation(vars.operationId, vars.payload),
    onSuccess: invalidate,
  })

  const columns: ColumnsType<Operation> = [
    { title: 'رقم العملية', dataIndex: 'operation_number', key: 'operation_number', render: (v) => v ?? '—' },
    { title: 'المريض', key: 'patient', render: (_, op) => op.admission?.patient?.name ?? '—' },
    {
      title: 'الإجراء',
      key: 'procedure',
      render: (_, op) => (
        <Space size={4}>
          <Text>{op.procedure?.name_ar ?? '—'}</Text>
          {op.procedure?.category && <Tag>{op.procedure.category.name}</Tag>}
        </Space>
      ),
    },
    { title: 'الجراح', key: 'surgeon', render: (_, op) => op.surgeon?.name ?? '—' },
    {
      title: 'السعر',
      key: 'price',
      render: (_, op) => (
        <OperationPriceCell
          operation={op}
          onCommit={(price) => updateMutation.mutate({ operationId: op.id, payload: { price } })}
        />
      ),
    },
    { title: 'تاريخ العملية', key: 'scheduled_at', render: (_, op) => formatDateTime(op.scheduled_at) },
    {
      title: '',
      key: 'actions',
      render: (_, op) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setEditingOperation(op)
            }}
          >
            تعديل
          </Button>
          <Badge count={op.team_members?.length ?? 0} size="small" offset={[-4, 2]}>
            <Button
              size="small"
              icon={<TeamOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                setTeamOperationId(op.id)
              }}
            >
              الفريق الطبي
            </Button>
          </Badge>
        </Space>
      ),
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        العمليات
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Flex wrap="wrap" gap={12}>
          <FieldLabel label="تاريخ العملية">
            <Input type="date" style={{ width: 160 }} value={date} onChange={(e) => setDate(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="بحث">
            <Input
              style={{ width: 192 }}
              placeholder="اسم المريض أو الإجراء"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FieldLabel>
        </Flex>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={operationsQuery.isLoading}
          columns={columns}
          dataSource={[...(operationsQuery.data?.data ?? [])].sort((a, b) => b.id - a.id)}
          pagination={false}
          onRow={(op) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/admissions/${op.admission_id}`),
          })}
        />
      </Card>

      <ScheduleOperationModal
        open={!!editingOperation}
        operation={editingOperation}
        onClose={() => setEditingOperation(null)}
        onSchedule={async () => {
          throw new Error('not supported here')
        }}
        onUpdate={async (operationId, payload) => {
          await updateMutation.mutateAsync({ operationId, payload })
          setEditingOperation(null)
        }}
        isSubmitting={updateMutation.isPending}
      />

      {teamOperation && (
        <OperationTeamModal
          open={!!teamOperation}
          onClose={() => setTeamOperationId(null)}
          operationId={teamOperation.id}
          existingMembers={teamOperation.team_members ?? []}
          onAdded={invalidate}
        />
      )}
    </ConfigProvider>
  )
}
