import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Listy, Tag, Typography, Flex, Space } from 'antd'
import { formatDateTime } from '@/lib/utils'
import { getDoctors } from '@/services/patientService'
import { ScheduleOperationModal } from '@/components/admissions/ScheduleOperationModal'
import { OperationDetailModal } from '@/components/admissions/OperationDetailModal'
import type { Operation, OperationPriority, OperationStatus, OperationTeamRole } from '@/types/admission'

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
  onPrepare: (
    operationId: number,
    payload: {
      consent_obtained: boolean
      fasting_confirmed: boolean
      site_marked: boolean
      preop_vitals_checked: boolean
      preop_notes?: string
    },
  ) => void
  onStart: (operationId: number) => void
  onComplete: (
    operationId: number,
    payload: {
      findings?: string
      complications?: string
      blood_loss_ml?: number
      outcome?: string
      report_notes?: string
    },
  ) => void
  onCancel: (operationId: number, cancellationReason: string) => void
  onAddTeamMember: (
    operationId: number,
    payload: { doctor_id?: number | null; name?: string; role: OperationTeamRole; notes?: string },
  ) => void
  onRemoveTeamMember: (operationId: number, teamMemberId: number) => void
  onAddSupply: (operationId: number, payload: { name: string; quantity?: number; unit?: string }) => void
  onRemoveSupply: (operationId: number, supplyId: number) => void
  isSubmitting: boolean
  isPreparing: boolean
  isStarting: boolean
  isCompleting: boolean
  isAddingTeamMember: boolean
  isAddingSupply: boolean
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

export function OperationsTab({
  operations,
  onSchedule,
  onPrepare,
  onStart,
  onComplete,
  onCancel,
  onAddTeamMember,
  onRemoveTeamMember,
  onAddSupply,
  onRemoveSupply,
  isSubmitting,
  isPreparing,
  isStarting,
  isCompleting,
  isAddingTeamMember,
  isAddingSupply,
}: OperationsTabProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [managingOperationId, setManagingOperationId] = useState<number | null>(null)

  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })

  const managingOperation = operations.find((o) => o.id === managingOperationId) ?? null

  function handleCancel(operation: Operation) {
    const reason = window.prompt('سبب الإلغاء (اختياري):') ?? ''
    if (window.confirm('هل أنت متأكد من إلغاء هذه العملية؟')) {
      onCancel(operation.id, reason)
    }
  }

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
                <Button size="small" onClick={() => setManagingOperationId(operation.id)}>
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

      <OperationDetailModal
        operation={managingOperation}
        open={managingOperationId !== null}
        onClose={() => setManagingOperationId(null)}
        doctors={doctorsQuery.data ?? []}
        onPrepare={(payload) => managingOperation && onPrepare(managingOperation.id, payload)}
        onStart={() => managingOperation && onStart(managingOperation.id)}
        onComplete={(payload) => managingOperation && onComplete(managingOperation.id, payload)}
        onCancel={() => managingOperation && handleCancel(managingOperation)}
        onAddTeamMember={(payload) => managingOperation && onAddTeamMember(managingOperation.id, payload)}
        onRemoveTeamMember={(teamMemberId) => managingOperation && onRemoveTeamMember(managingOperation.id, teamMemberId)}
        onAddSupply={(payload) => managingOperation && onAddSupply(managingOperation.id, payload)}
        onRemoveSupply={(supplyId) => managingOperation && onRemoveSupply(managingOperation.id, supplyId)}
        isPreparing={isPreparing}
        isStarting={isStarting}
        isCompleting={isCompleting}
        isAddingTeamMember={isAddingTeamMember}
        isAddingSupply={isAddingSupply}
      />
    </Space>
  )
}
