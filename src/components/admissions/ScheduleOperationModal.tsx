import { useEffect, useRef, useState } from 'react'
import type { ElementRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Row, Col, Select, Input, InputNumber, Typography, Space } from 'antd'
import dayjs, { APP_TIMEZONE } from '@/lib/dayjs'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import { getProcedures } from '@/services/procedureService'
import type { Operation } from '@/types/admission'

const { Text } = Typography

export interface OperationFormPayload {
  surgeon_id: number
  procedure_id: number
  price: number | null
  scheduled_at: string | null
}

interface ScheduleOperationModalProps {
  open: boolean
  onClose: () => void
  operation?: Operation | null
  onSchedule: (payload: OperationFormPayload) => Promise<unknown>
  onUpdate?: (operationId: number, payload: Partial<OperationFormPayload>) => Promise<unknown>
  isSubmitting: boolean
}

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

export function ScheduleOperationModal({
  open,
  onClose,
  operation,
  onSchedule,
  onUpdate,
  isSubmitting,
}: ScheduleOperationModalProps) {
  const [procedureId, setProcedureId] = useState<number | undefined>(undefined)
  const [surgeonId, setSurgeonId] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const procedureSelectRef = useRef<ElementRef<typeof Select>>(null)
  const surgeonSelectRef = useRef<ElementRef<typeof Select>>(null)
  const surgeonDropdownOpenRef = useRef(false)

  const proceduresQuery = useQuery({ queryKey: ['procedures', 'active'], queryFn: () => getProcedures({ active_only: true }) })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const surgeonRoleId = teamRolesQuery.data?.find((r) => r.slug === 'surgeon')?.id
  const doctorsQuery = useQuery({
    queryKey: ['doctors', '', surgeonRoleId],
    queryFn: () => getDoctors(undefined, surgeonRoleId),
    enabled: surgeonRoleId !== undefined,
  })

  const procedureOptions = groupProceduresByCategory(proceduresQuery.data ?? [])

  useEffect(() => {
    if (!open) {
      setProcedureId(undefined)
      setSurgeonId(undefined)
      setPrice(null)
      setScheduledAt('')
      return
    }
    if (operation) {
      setProcedureId(operation.procedure_id)
      setSurgeonId(operation.surgeon_id)
      setPrice(operation.price != null ? Number(operation.price) : null)
      setScheduledAt(operation.scheduled_at ? dayjs(operation.scheduled_at).tz().format('YYYY-MM-DDTHH:mm') : '')
    }
  }, [open, operation])

  async function handleSubmit() {
    if (!procedureId || !surgeonId) return
    try {
      const payload: OperationFormPayload = {
        procedure_id: procedureId,
        surgeon_id: surgeonId,
        price: price ?? null,
        scheduled_at: scheduledAt ? dayjs.tz(scheduledAt, APP_TIMEZONE).toISOString() : null,
      }
      if (operation) {
        await onUpdate?.(operation.id, payload)
      } else {
        await onSchedule(payload)
      }
    } catch {
      // request failed — surfaced by the global API error toast; keep the modal open for retry
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={operation ? 'تعديل العملية' : 'طلب عملية جديدة'}
      width={520}
      okText={operation ? 'حفظ التعديلات' : 'طلب العملية'}
      cancelText="إلغاء"
      onOk={handleSubmit}
      confirmLoading={isSubmitting}
      okButtonProps={{ disabled: !procedureId || !surgeonId }}
      afterOpenChange={(opened) => {
        if (opened) procedureSelectRef.current?.focus()
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FieldLabel label="الإجراء المطلوب" required>
            <Select
              ref={procedureSelectRef}
              style={{ width: '100%' }}
              showSearch
              placeholder="اختر العملية"
              value={procedureId}
              onChange={(value) => {
                setProcedureId(value)
                surgeonSelectRef.current?.focus()
              }}
              optionFilterProp="label"
              options={procedureOptions}
            />
          </FieldLabel>
        </Col>

        <Col span={24}>
          <FieldLabel label="الجراح" required>
            <Select
              ref={surgeonSelectRef}
              style={{ width: '100%' }}
              showSearch
              placeholder="اختر الجراح"
              value={surgeonId}
              onChange={setSurgeonId}
              optionFilterProp="label"
              options={(doctorsQuery.data ?? []).map((d) => ({ label: d.name, value: d.id }))}
              onOpenChange={(visible) => {
                surgeonDropdownOpenRef.current = visible
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !surgeonDropdownOpenRef.current && surgeonId) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </FieldLabel>
        </Col>

        <Col xs={24} md={12}>
          <FieldLabel label="سعر العملية">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              placeholder="0"
              value={price}
              onChange={(value) => setPrice(typeof value === 'number' ? value : null)}
            />
          </FieldLabel>
        </Col>

        <Col xs={24} md={12}>
          <FieldLabel label="تاريخ العملية">
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
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
