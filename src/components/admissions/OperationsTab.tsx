import { useState } from 'react'
import { Card, Button, Table, Tag, Typography, Flex, Space, Badge } from 'antd'
import { EditOutlined, TeamOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/lib/utils'
import { ScheduleOperationModal, type OperationFormPayload } from '@/components/admissions/ScheduleOperationModal'
import { OperationPriceCell } from '@/components/admissions/OperationPriceCell'
import { OperationTeamModal } from '@/components/admissions/OperationTeamModal'
import type { Operation } from '@/types/admission'

const { Text } = Typography

interface OperationsTabProps {
  operations: Operation[]
  loading?: boolean
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  onTeamChanged?: () => void
  isSubmitting: boolean
}

export function OperationsTab({ operations, loading, onSchedule, onUpdate, onTeamChanged, isSubmitting }: OperationsTabProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [teamOperationId, setTeamOperationId] = useState<number | null>(null)

  const teamOperation = teamOperationId != null ? operations.find((op) => op.id === teamOperationId) ?? null : null

  const columns: ColumnsType<Operation> = [
    { title: 'رقم العملية', dataIndex: 'operation_number', key: 'operation_number', render: (v) => v ?? '—' },
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
    { title: 'الجراح', key: 'surgeon', render: (_, op) => op.surgeon?.name ?? '—' },
    {
      title: 'السعر',
      key: 'price',
      render: (_, op) => (
        <OperationPriceCell operation={op} onCommit={(price) => onUpdate(op.id, { price })} />
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
              أعضاء الفريق الطبي
            </Button>
          </Badge>
        </Space>
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
            onClick: () => setTeamOperationId(op.id),
          })}
        />
      </Card>

      <ScheduleOperationModal
        open={scheduleOpen || !!editingOperation}
        operation={editingOperation}
        onClose={() => {
          setScheduleOpen(false)
          setEditingOperation(null)
        }}
        onSchedule={async (payload) => {
          await onSchedule(payload)
          setScheduleOpen(false)
        }}
        onUpdate={async (operationId, payload) => {
          await onUpdate(operationId, payload)
          setEditingOperation(null)
        }}
        isSubmitting={isSubmitting}
      />

      {teamOperation && (
        <OperationTeamModal
          open={!!teamOperation}
          onClose={() => setTeamOperationId(null)}
          operationId={teamOperation.id}
          existingMembers={teamOperation.team_members ?? []}
          onAdded={onTeamChanged}
        />
      )}
    </Space>
  )
}
