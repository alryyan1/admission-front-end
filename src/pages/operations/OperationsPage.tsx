import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider, Card, Select, Input, Table, Tag, Typography, Flex, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAntTheme } from '@/lib/antdTheme'
import { formatDateTime } from '@/lib/utils'
import { getAllOperations } from '@/services/operationService'
import type { Operation, OperationPriority, OperationStatus } from '@/types/admission'

const { Title, Text } = Typography

const STATUS_LABELS: Record<OperationStatus, string> = {
  scheduled: 'مجدولة',
  in_progress: 'جارية',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
}

const STATUS_COLORS: Record<OperationStatus, string> = {
  scheduled: 'default',
  in_progress: 'gold',
  completed: 'success',
  cancelled: 'error',
}

const PRIORITY_LABELS: Record<OperationPriority, string> = {
  emergency: 'طارئة',
  urgent: 'عاجلة',
  scheduled: 'مجدولة',
}

const PRIORITY_COLORS: Record<OperationPriority, string> = {
  emergency: 'error',
  urgent: 'warning',
  scheduled: 'default',
}

const STATUS_OPTIONS = [
  { label: 'الكل', value: 'all' },
  { label: 'مجدولة', value: 'scheduled' },
  { label: 'جارية', value: 'in_progress' },
  { label: 'مكتملة', value: 'completed' },
  { label: 'ملغاة', value: 'cancelled' },
]

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
  const [status, setStatus] = useState<OperationStatus | 'all'>('all')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')

  const operationsQuery = useQuery({
    queryKey: ['operations', status, date, search],
    queryFn: () =>
      getAllOperations({
        status: status === 'all' ? undefined : status,
        date: date || undefined,
        search: search || undefined,
      }),
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
    {
      title: 'الأولوية',
      key: 'priority',
      render: (_, op) => <Tag color={PRIORITY_COLORS[op.priority]}>{PRIORITY_LABELS[op.priority]}</Tag>,
    },
    { title: 'الجراح', key: 'surgeon', render: (_, op) => op.surgeon?.name ?? '—' },
    { title: 'غرفة العمليات', key: 'room', render: (_, op) => op.operation_room?.room_number ?? '—' },
    { title: 'الموعد', key: 'scheduled_at', render: (_, op) => formatDateTime(op.scheduled_at) },
    {
      title: 'الحالة',
      key: 'status',
      render: (_, op) => <Tag color={STATUS_COLORS[op.status]}>{STATUS_LABELS[op.status]}</Tag>,
    },
  ]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        العمليات
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Flex wrap="wrap" gap={12}>
          <FieldLabel label="الحالة">
            <Select
              style={{ width: 160 }}
              value={status}
              onChange={(v) => setStatus(v as OperationStatus | 'all')}
              options={STATUS_OPTIONS}
            />
          </FieldLabel>
          <FieldLabel label="التاريخ">
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
    </ConfigProvider>
  )
}
