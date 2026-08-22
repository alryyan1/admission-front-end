import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Listy, Tag, Typography, Flex, Space } from 'antd'
import { formatDateTime } from '@/lib/utils'
import { ScheduleOperationModal } from '@/components/admissions/ScheduleOperationModal'
import type { Operation, OperationPriority, OperationStatus } from '@/types/admission'

const { Text } = Typography

interface OperationsTabProps {
  operations: Operation[]
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
  }) => void
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

export function OperationsTab({ operations, onSchedule, isSubmitting }: OperationsTabProps) {
  const navigate = useNavigate()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="end">
        <Button type="primary" onClick={() => setScheduleOpen(true)}>
          + طلب عملية جديدة
        </Button>
      </Flex>

      <Card>
        {operations.length === 0 ? (
          <Text type="secondary">لا توجد عمليات مجدولة بعد</Text>
        ) : (
          <Listy
            items={operations}
            rowKey="id"
            itemRender={(operation, index) => (
              <Flex
                justify="space-between"
                align="center"
                gap={16}
                style={{
                  padding: '12px 0',
                  borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                }}
              >
                <div>
                  <Space size={8}>
                    <Text strong>{operation.procedure?.name_ar ?? '—'}</Text>
                    {operation.procedure?.category && <Tag>{operation.procedure.category.name}</Tag>}
                    <Tag color={PRIORITY_COLORS[operation.priority]}>{PRIORITY_LABELS[operation.priority]}</Tag>
                    <Tag color={STATUS_COLORS[operation.status]}>{STATUS_LABELS[operation.status]}</Tag>
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {operation.operation_number ?? '—'} · د. {operation.surgeon?.name ?? '—'}
                      {operation.operation_room && ` · غرفة ${operation.operation_room.room_number}`}
                      {' · '}
                      {formatDateTime(operation.scheduled_at)}
                    </Text>
                  </div>
                </div>
                <Button size="small" onClick={() => navigate(`/operations/${operation.id}`)}>
                  إدارة
                </Button>
              </Flex>
            )}
          />
        )}
      </Card>

      <ScheduleOperationModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={(payload) => {
          onSchedule(payload)
          setScheduleOpen(false)
        }}
        isSubmitting={isSubmitting}
      />
    </Space>
  )
}
