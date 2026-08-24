import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Row, Col, Select, Input, InputNumber, Typography, Space } from 'antd'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { getOperationRooms } from '@/services/facilityService'
import { getProcedures } from '@/services/procedureService'
import type { OperationPriority } from '@/types/admission'

const { Text } = Typography
const { TextArea } = Input

interface ScheduleOperationModalProps {
  open: boolean
  onClose: () => void
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

const PRIORITY_OPTIONS: { label: string; value: OperationPriority }[] = [
  { label: 'طارئة', value: 'emergency' },
  { label: 'عاجلة', value: 'urgent' },
  { label: 'مجدولة', value: 'scheduled' },
]

const ANESTHESIA_OPTIONS = [
  { label: 'عام', value: 'عام' },
  { label: 'نصفي (سبينال)', value: 'نصفي' },
  { label: 'موضعي', value: 'موضعي' },
  { label: 'تخدير واعٍ', value: 'تخدير واعٍ' },
  { label: 'أخرى', value: 'أخرى' },
]

function FieldLabel({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
        {required && ' *'}
      </Text>
      {children}
    </Space>
  )
}

export function ScheduleOperationModal({ open, onClose, onSchedule, isSubmitting }: ScheduleOperationModalProps) {
  const [procedureId, setProcedureId] = useState<number | undefined>(undefined)
  const [priority, setPriority] = useState<OperationPriority>('scheduled')
  const [surgeonId, setSurgeonId] = useState<number | undefined>(undefined)
  const [requestedByDoctorId, setRequestedByDoctorId] = useState<number | undefined>(undefined)
  const [operationRoomId, setOperationRoomId] = useState<number | undefined>(undefined)
  const [scheduledAt, setScheduledAt] = useState('')
  const [expectedDuration, setExpectedDuration] = useState<number | null>(null)
  const [anesthesiaType, setAnesthesiaType] = useState<string | undefined>(undefined)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')

  const proceduresQuery = useQuery({ queryKey: ['procedures', 'active'], queryFn: () => getProcedures({ active_only: true }) })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id
  const doctorsQuery = useQuery({
    queryKey: ['doctors', '', surgeonRoleId],
    queryFn: () => getDoctors(undefined, surgeonRoleId),
    enabled: surgeonRoleId !== undefined,
  })
  const operationRoomsQuery = useQuery({ queryKey: ['rooms', 'operation'], queryFn: getOperationRooms })

  const procedureOptions = groupProceduresByCategory(proceduresQuery.data ?? [])

  function reset() {
    setProcedureId(undefined)
    setPriority('scheduled')
    setSurgeonId(undefined)
    setRequestedByDoctorId(undefined)
    setOperationRoomId(undefined)
    setScheduledAt('')
    setExpectedDuration(null)
    setAnesthesiaType(undefined)
    setDiagnosis('')
    setNotes('')
  }

  function handleSubmit() {
    if (!procedureId || !surgeonId || !scheduledAt) return
    onSchedule({
      procedure_id: procedureId,
      surgeon_id: surgeonId,
      operation_room_id: operationRoomId,
      priority,
      scheduled_at: scheduledAt,
      expected_duration_minutes: expectedDuration ?? undefined,
      anesthesia_type: anesthesiaType,
      requested_by_doctor_id: requestedByDoctorId,
      diagnosis: diagnosis || undefined,
      notes: notes || undefined,
    })
    reset()
  }

  return (
    <Modal
      open={open}
      onCancel={() => {
        reset()
        onClose()
      }}
      title="طلب عملية جديدة"
      width={640}
      okText="طلب العملية"
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !procedureId || !surgeonId || !scheduledAt }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="الإجراء المطلوب" required>
            <Select
              style={{ width: '100%' }}
              showSearch
              placeholder="اختر العملية"
              value={procedureId}
              onChange={setProcedureId}
              optionFilterProp="label"
              options={procedureOptions}
            />
          </FieldLabel>
        </Col>

        <Col xs={24} md={8}>
          <FieldLabel label="الأولوية">
            <Select style={{ width: '100%' }} value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
          </FieldLabel>
        </Col>
        <Col xs={24} md={8}>
          <FieldLabel label="الجراح" required>
            <Select
              style={{ width: '100%' }}
              showSearch
              placeholder="اختر الجراح"
              value={surgeonId}
              onChange={setSurgeonId}
              optionFilterProp="label"
              options={(doctorsQuery.data ?? []).map((d) => ({ label: d.name, value: d.id }))}
            />
          </FieldLabel>
        </Col>
        <Col xs={24} md={8}>
          <FieldLabel label="الطبيب المسؤول (اختياري)">
            <Select
              style={{ width: '100%' }}
              allowClear
              showSearch
              placeholder="اختر طبيباً"
              value={requestedByDoctorId}
              onChange={(v) => setRequestedByDoctorId(v ?? undefined)}
              optionFilterProp="label"
              options={(doctorsQuery.data ?? []).map((d) => ({ label: d.name, value: d.id }))}
            />
          </FieldLabel>
        </Col>

        <Col xs={24} md={8}>
          <FieldLabel label="غرفة العمليات (اختياري)">
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder="اختياري"
              value={operationRoomId}
              onChange={(v) => setOperationRoomId(v ?? undefined)}
              options={(operationRoomsQuery.data ?? []).map((room) => ({
                label: `غرفة ${room.room_number} — ${room.ward?.name}`,
                value: room.id,
              }))}
            />
          </FieldLabel>
        </Col>
        <Col xs={24} md={8}>
          <FieldLabel label="الموعد" required>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </FieldLabel>
        </Col>
        <Col xs={24} md={8}>
          <FieldLabel label="المدة المتوقعة (دقيقة)">
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              value={expectedDuration}
              onChange={(value) => setExpectedDuration(typeof value === 'number' ? value : null)}
            />
          </FieldLabel>
        </Col>

        <Col xs={24} md={12}>
          <FieldLabel label="نوع التخدير">
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder="اختياري"
              value={anesthesiaType}
              onChange={(v) => setAnesthesiaType(v ?? undefined)}
              options={ANESTHESIA_OPTIONS}
            />
          </FieldLabel>
        </Col>

        <Col span={24}>
          <FieldLabel label="التشخيص / سبب العملية">
            <TextArea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} autoSize={{ minRows: 1, maxRows: 3 }} />
          </FieldLabel>
        </Col>
        <Col span={24}>
          <FieldLabel label="ملاحظات الطبيب">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} autoSize={{ minRows: 1, maxRows: 3 }} />
          </FieldLabel>
        </Col>
      </Row>
    </Modal>
  )
}

function groupProceduresByCategory(procedures: { id: number; name_ar: string; category?: { id: number; name: string } | null }[]) {
  const groups = new Map<string, { label: string; value: number }[]>()

  for (const procedure of procedures) {
    const categoryName = procedure.category?.name ?? 'غير مصنفة'
    if (!groups.has(categoryName)) groups.set(categoryName, [])
    groups.get(categoryName)!.push({ label: procedure.name_ar, value: procedure.id })
  }

  return Array.from(groups.entries()).map(([label, options]) => ({ label, options }))
}
