import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Table, Tag, Typography, Flex, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import { ScheduleOperationModal } from '@/components/admissions/ScheduleOperationModal'
import type { Operation, OperationPriority, OperationStatus } from '@/types/admission'

const { Text } = Typography

interface OperationsTabProps {
  operations: Operation[]
  loading?: boolean
  onSchedule: (payload: {
    surgeon_id: number
    operation_room_id?: number | null
    procedure_id: number
    priority?: OperationPriority
    diagnosis?: string
    expected_duration_minutes?: number
    anesthesia_type?: string
    requested_by_doctor_id?: number
    scheduled_at: string
    notes?: string
  }) => Promise<unknown>
  isSubmitting: boolean
}

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

export function OperationsTab({ operations, loading, onSchedule, isSubmitting }: OperationsTabProps) {
  const navigate = useNavigate()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const columns: ColumnsType<Operation> = [
    {
      title: 'الإجراء',
      key: 'procedure',
      render: (_, op) => (
        <Space size={4}>
          <Text strong>{op.procedure?.name_ar ?? '—'}</Text>
          {op.procedure?.category && <Tag>{op.procedure.category.name}</Tag>}
        </Space>
      ),
    },
    { title: 'رقم العملية', dataIndex: 'operation_number', key: 'operation_number', render: (v) => v ?? '—' },
    { title: 'الجراح', key: 'surgeon', render: (_, op) => op.surgeon?.name ?? '—' },
    { title: 'غرفة العمليات', key: 'room', render: (_, op) => op.operation_room?.room_number ?? '—' },
    { title: 'الموعد', key: 'scheduled_at', render: (_, op) => formatDateTime(op.scheduled_at) },
    {
      title: 'الأولوية',
      key: 'priority',
      render: (_, op) => <Tag color={PRIORITY_COLORS[op.priority]}>{PRIORITY_LABELS[op.priority]}</Tag>,
    },
    {
      title: 'الحالة',
      key: 'status',
      render: (_, op) => <Tag color={STATUS_COLORS[op.status]}>{STATUS_LABELS[op.status]}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_, op) => (
        <Button size="small" onClick={() => navigate(`/operations/${op.id}`)}>
          إدارة
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="end">
        <Button type="primary" onClick={() => setScheduleOpen(true)}>
          + طلب عملية جديدة
        </Button>
      </Flex>

      <Card size="small">
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={operations}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'لا توجد عمليات مجدولة بعد' }}
          onRow={(op) => ({
            className: 'cursor-pointer',
            onClick: () => navigate(`/operations/${op.id}`),
          })}
        />
      </Card>

      <ScheduleOperationModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={async (payload) => {
          await onSchedule(payload)
          setScheduleOpen(false)
        }}
        isSubmitting={isSubmitting}
      />
    </Space>
  )
}
