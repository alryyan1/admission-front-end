import { useEffect, useState } from 'react'
import {
  Modal,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Button,
  Tag,
  Typography,
  Space,
  Flex,
  Divider,
  Listy,
} from 'antd'
import { formatDateTime } from '@/lib/utils'
import type { Doctor } from '@/types/patient'
import type { Operation, OperationPriority, OperationSupply, OperationTeamMember, OperationTeamRole } from '@/types/admission'

const { Text, Title } = Typography
const { TextArea } = Input

interface OperationDetailModalProps {
  operation: Operation | null
  open: boolean
  onClose: () => void
  doctors: Doctor[]
  onPrepare: (payload: {
    consent_obtained: boolean
    fasting_confirmed: boolean
    site_marked: boolean
    preop_vitals_checked: boolean
    preop_notes?: string
  }) => void
  onStart: () => void
  onComplete: (payload: {
    findings?: string
    complications?: string
    blood_loss_ml?: number
    outcome?: string
    report_notes?: string
  }) => void
  onCancel: () => void
  onAddTeamMember: (payload: { doctor_id?: number | null; name?: string; role: OperationTeamRole; notes?: string }) => void
  onRemoveTeamMember: (teamMemberId: number) => void
  onAddSupply: (payload: { name: string; quantity?: number; unit?: string }) => void
  onRemoveSupply: (supplyId: number) => void
  isPreparing: boolean
  isStarting: boolean
  isCompleting: boolean
  isAddingTeamMember: boolean
  isAddingSupply: boolean
}

const TEAM_ROLE_OPTIONS: { label: string; value: OperationTeamRole }[] = [
  { label: 'جراح', value: 'surgeon' },
  { label: 'مساعد جراح', value: 'assistant_surgeon' },
  { label: 'طبيب تخدير', value: 'anesthesiologist' },
  { label: 'ممرض/ة تعقيم', value: 'scrub_nurse' },
  { label: 'ممرض/ة تداول', value: 'circulating_nurse' },
  { label: 'فني', value: 'technician' },
  { label: 'أخرى', value: 'other' },
]

const TEAM_ROLE_LABEL: Record<OperationTeamRole, string> = Object.fromEntries(
  TEAM_ROLE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<OperationTeamRole, string>

const OUTCOME_OPTIONS = [
  { label: 'نجحت دون مضاعفات', value: 'successful' },
  { label: 'حدثت مضاعفات', value: 'complicated' },
  { label: 'أخرى', value: 'other' },
]

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

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text style={{ fontSize: 12 }} type="secondary">
        {label}
      </Text>
      {children}
    </Space>
  )
}

export function OperationDetailModal({
  operation,
  open,
  onClose,
  doctors,
  onPrepare,
  onStart,
  onComplete,
  onCancel,
  onAddTeamMember,
  onRemoveTeamMember,
  onAddSupply,
  onRemoveSupply,
  isPreparing,
  isStarting,
  isCompleting,
  isAddingTeamMember,
  isAddingSupply,
}: OperationDetailModalProps) {
  const [consentObtained, setConsentObtained] = useState(false)
  const [fastingConfirmed, setFastingConfirmed] = useState(false)
  const [siteMarked, setSiteMarked] = useState(false)
  const [preopVitalsChecked, setPreopVitalsChecked] = useState(false)
  const [preopNotes, setPreopNotes] = useState('')

  const [teamRole, setTeamRole] = useState<OperationTeamRole>('assistant_surgeon')
  const [teamDoctorId, setTeamDoctorId] = useState<number | undefined>(undefined)
  const [teamName, setTeamName] = useState('')

  const [supplyName, setSupplyName] = useState('')
  const [supplyQuantity, setSupplyQuantity] = useState<number | null>(1)
  const [supplyUnit, setSupplyUnit] = useState('')

  const [findings, setFindings] = useState('')
  const [complications, setComplications] = useState('')
  const [bloodLoss, setBloodLoss] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<string | undefined>(undefined)
  const [reportNotes, setReportNotes] = useState('')

  useEffect(() => {
    if (!operation) return
    setConsentObtained(operation.consent_obtained)
    setFastingConfirmed(operation.fasting_confirmed)
    setSiteMarked(operation.site_marked)
    setPreopVitalsChecked(operation.preop_vitals_checked)
    setPreopNotes(operation.preop_notes ?? '')
    setFindings(operation.findings ?? '')
    setComplications(operation.complications ?? '')
    setBloodLoss(operation.blood_loss_ml)
    setOutcome(operation.outcome ?? undefined)
    setReportNotes(operation.report_notes ?? '')
  }, [operation])

  if (!operation) return null

  const isScheduled = operation.status === 'scheduled'
  const isInProgress = operation.status === 'in_progress'
  const isPrepared =
    operation.consent_obtained && operation.fasting_confirmed && operation.site_marked && operation.preop_vitals_checked

  function handleSavePreop() {
    onPrepare({
      consent_obtained: consentObtained,
      fasting_confirmed: fastingConfirmed,
      site_marked: siteMarked,
      preop_vitals_checked: preopVitalsChecked,
      preop_notes: preopNotes || undefined,
    })
  }

  function handleAddTeamMember() {
    if (!teamDoctorId && !teamName.trim()) return
    onAddTeamMember({
      role: teamRole,
      doctor_id: teamDoctorId ?? undefined,
      name: teamDoctorId ? undefined : teamName,
    })
    setTeamName('')
    setTeamDoctorId(undefined)
  }

  function handleAddSupply() {
    if (!supplyName.trim()) return
    onAddSupply({ name: supplyName, quantity: supplyQuantity ?? 1, unit: supplyUnit || undefined })
    setSupplyName('')
    setSupplyQuantity(1)
    setSupplyUnit('')
  }

  function handleComplete() {
    onComplete({
      findings: findings || undefined,
      complications: complications || undefined,
      blood_loss_ml: bloodLoss ?? undefined,
      outcome: outcome || undefined,
      report_notes: reportNotes || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          {operation.procedure?.name_ar ?? '—'}
          {operation.procedure?.category && <Tag>{operation.procedure.category.name}</Tag>}
          <Tag color={PRIORITY_COLORS[operation.priority]}>{PRIORITY_LABELS[operation.priority]}</Tag>
        </Space>
      }
      width={720}
      footer={null}
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Text type="secondary">
            {operation.operation_number ?? '—'} · د. {operation.surgeon?.name ?? '—'} ·{' '}
            {formatDateTime(operation.scheduled_at)}
            {operation.expected_duration_minutes && ` · ${operation.expected_duration_minutes} دقيقة`}
            {operation.anesthesia_type && ` · تخدير ${operation.anesthesia_type}`}
          </Text>
          {operation.requested_by_doctor && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                الطبيب المسؤول: {operation.requested_by_doctor.name}
              </Text>
            </div>
          )}
          {operation.diagnosis && (
            <div>
              <Text style={{ fontSize: 13 }}>التشخيص: {operation.diagnosis}</Text>
            </div>
          )}
        </div>

        <div>
          <Flex justify="space-between" align="center">
            <Title level={5} style={{ margin: 0 }}>
              تجهيز المريض قبل العملية
            </Title>
            {operation.prepared_at && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                تم التجهيز في {formatDateTime(operation.prepared_at)}
              </Text>
            )}
          </Flex>
          <Space direction="vertical" size={8} style={{ marginTop: 8 }}>
            <Checkbox checked={consentObtained} disabled={!isScheduled} onChange={(e) => setConsentObtained(e.target.checked)}>
              تم الحصول على موافقة المريض
            </Checkbox>
            <Checkbox checked={fastingConfirmed} disabled={!isScheduled} onChange={(e) => setFastingConfirmed(e.target.checked)}>
              تم تأكيد الصيام
            </Checkbox>
            <Checkbox checked={siteMarked} disabled={!isScheduled} onChange={(e) => setSiteMarked(e.target.checked)}>
              تم تحديد موضع العملية
            </Checkbox>
            <Checkbox
              checked={preopVitalsChecked}
              disabled={!isScheduled}
              onChange={(e) => setPreopVitalsChecked(e.target.checked)}
            >
              تم فحص العلامات الحيوية
            </Checkbox>
            <TextArea
              placeholder="ملاحظات التجهيز"
              disabled={!isScheduled}
              value={preopNotes}
              onChange={(e) => setPreopNotes(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
            {isScheduled && (
              <Button size="small" onClick={handleSavePreop} loading={isPreparing}>
                حفظ التجهيز
              </Button>
            )}
          </Space>
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Title level={5} style={{ margin: '0 0 8px' }}>
            الفريق الطبي
          </Title>
          {(operation.team_members ?? []).length === 0 ? (
            <Text type="secondary">لم يُضف أعضاء بعد</Text>
          ) : (
            <Listy
              items={operation.team_members ?? []}
              rowKey="id"
              itemRender={(member: OperationTeamMember, index) => (
                <Flex
                  justify="space-between"
                  align="center"
                  style={{ padding: '6px 0', borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
                >
                  <Space>
                    <Tag>{TEAM_ROLE_LABEL[member.role] ?? member.role}</Tag>
                    <Text>{member.doctor?.name ?? member.name ?? '—'}</Text>
                  </Space>
                  <Button size="small" danger type="text" onClick={() => onRemoveTeamMember(member.id)}>
                    إزالة
                  </Button>
                </Flex>
              )}
            />
          )}
          <Flex wrap="wrap" align="flex-end" gap={8} style={{ marginTop: 8 }}>
            <FieldLabel label="الدور">
              <Select style={{ width: 160 }} value={teamRole} onChange={setTeamRole} options={TEAM_ROLE_OPTIONS} />
            </FieldLabel>
            <FieldLabel label="الطبيب (اختياري)">
              <Select
                style={{ width: 176 }}
                allowClear
                showSearch
                placeholder="اختر طبيباً"
                value={teamDoctorId}
                onChange={(v) => setTeamDoctorId(v)}
                optionFilterProp="label"
                options={doctors.map((d) => ({ label: d.name, value: d.id }))}
              />
            </FieldLabel>
            <FieldLabel label="أو الاسم">
              <Input
                style={{ width: 160 }}
                value={teamName}
                disabled={!!teamDoctorId}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </FieldLabel>
            <Button size="small" onClick={handleAddTeamMember} loading={isAddingTeamMember}>
              إضافة
            </Button>
          </Flex>
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Title level={5} style={{ margin: '0 0 8px' }}>
            المستلزمات
          </Title>
          {(operation.supplies ?? []).length === 0 ? (
            <Text type="secondary">لم تُضف مستلزمات بعد</Text>
          ) : (
            <Listy
              items={operation.supplies ?? []}
              rowKey="id"
              itemRender={(supply: OperationSupply, index) => (
                <Flex
                  justify="space-between"
                  align="center"
                  style={{ padding: '6px 0', borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
                >
                  <Text>
                    {supply.name} × {supply.quantity} {supply.unit ?? ''}
                  </Text>
                  <Button size="small" danger type="text" onClick={() => onRemoveSupply(supply.id)}>
                    إزالة
                  </Button>
                </Flex>
              )}
            />
          )}
          <Flex wrap="wrap" align="flex-end" gap={8} style={{ marginTop: 8 }}>
            <FieldLabel label="الاسم">
              <Input style={{ width: 176 }} value={supplyName} onChange={(e) => setSupplyName(e.target.value)} />
            </FieldLabel>
            <FieldLabel label="الكمية">
              <InputNumber
                style={{ width: 80 }}
                min={1}
                value={supplyQuantity}
                onChange={(value) => setSupplyQuantity(typeof value === 'number' ? value : null)}
              />
            </FieldLabel>
            <FieldLabel label="الوحدة">
              <Input style={{ width: 96 }} value={supplyUnit} onChange={(e) => setSupplyUnit(e.target.value)} />
            </FieldLabel>
            <Button size="small" onClick={handleAddSupply} loading={isAddingSupply}>
              إضافة
            </Button>
          </Flex>
        </div>

        {(isInProgress || operation.status === 'completed') && (
          <>
            <Divider style={{ margin: 0 }} />
            <div>
              <Title level={5} style={{ margin: '0 0 8px' }}>
                تقرير العملية
              </Title>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <FieldLabel label="النتائج">
                  <TextArea
                    disabled={!isInProgress}
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                  />
                </FieldLabel>
                <FieldLabel label="المضاعفات">
                  <TextArea
                    disabled={!isInProgress}
                    value={complications}
                    onChange={(e) => setComplications(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                  />
                </FieldLabel>
                <Flex wrap="wrap" gap={8}>
                  <FieldLabel label="فقد الدم (مل)">
                    <InputNumber
                      style={{ width: 128 }}
                      min={0}
                      disabled={!isInProgress}
                      value={bloodLoss}
                      onChange={(value) => setBloodLoss(typeof value === 'number' ? value : null)}
                    />
                  </FieldLabel>
                  <FieldLabel label="النتيجة">
                    <Select
                      style={{ width: 192 }}
                      allowClear
                      disabled={!isInProgress}
                      value={outcome}
                      onChange={setOutcome}
                      options={OUTCOME_OPTIONS}
                    />
                  </FieldLabel>
                </Flex>
                <FieldLabel label="ملاحظات التقرير">
                  <TextArea
                    disabled={!isInProgress}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                  />
                </FieldLabel>
              </Space>
            </div>
          </>
        )}

        <Divider style={{ margin: 0 }} />

        <Flex justify="end" gap={8}>
          {isScheduled && (
            <>
              <Button danger onClick={onCancel}>
                إلغاء العملية
              </Button>
              <Button type="primary" disabled={!isPrepared} loading={isStarting} onClick={onStart}>
                بدء العملية
              </Button>
            </>
          )}
          {isInProgress && (
            <>
              <Button danger onClick={onCancel}>
                إلغاء العملية
              </Button>
              <Button type="primary" loading={isCompleting} onClick={handleComplete}>
                إنهاء العملية
              </Button>
            </>
          )}
        </Flex>
      </Space>
    </Modal>
  )
}
