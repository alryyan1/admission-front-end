import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Stethoscope, Users } from 'lucide-react'
import {
  ConfigProvider,
  Card,
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
  Row,
  Col,
  Listy,
  Modal,
  Form,
} from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { PageLoader } from '@/components/common/PageLoader'
import { formatDateTime } from '@/lib/utils'
import { getOperation } from '@/services/operationService'
import { getDoctors } from '@/services/patientService'
import { getTeamRoles } from '@/services/teamRoleService'
import {
  prepareOperation,
  startOperation,
  completeOperation,
  cancelOperation,
  addOperationTeamMember,
  removeOperationTeamMember,
  addOperationSupply,
  removeOperationSupply,
} from '@/services/admissionService'
import type {
  OperationPriority,
  OperationStatus,
  OperationSupply,
  OperationTeamMember,
} from '@/types/admission'

const { Title, Text } = Typography
const { TextArea } = Input

const OUTCOME_OPTIONS = [
  { label: 'نجحت دون مضاعفات', value: 'successful' },
  { label: 'حدثت مضاعفات', value: 'complicated' },
  { label: 'أخرى', value: 'other' },
]

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

export function OperationDetailPage() {
  const antTheme = useAntTheme()
  const { operationId } = useParams<{ operationId: string }>()
  const id = Number(operationId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const operationQuery = useQuery({
    queryKey: ['operations', id],
    queryFn: () => getOperation(id),
    enabled: !!id,
  })
  const doctorsQuery = useQuery({ queryKey: ['doctors', ''], queryFn: () => getDoctors() })
  const teamRolesQuery = useQuery({ queryKey: ['team-roles'], queryFn: getTeamRoles })
  const teamRoleLabel = (roleId: number | undefined) =>
    teamRolesQuery.data?.find((r) => r.id === roleId)?.name ?? '—'

  const operation = operationQuery.data

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['operations', id] })
    if (operation) {
      queryClient.invalidateQueries({ queryKey: ['admissions', operation.admission_id] })
    }
  }

  const prepareMutation = useMutation({
    mutationFn: (payload: Parameters<typeof prepareOperation>[1]) => prepareOperation(id, payload),
    onSuccess: invalidate,
  })
  const startMutation = useMutation({
    mutationFn: () => startOperation(id),
    onSuccess: invalidate,
  })
  const completeMutation = useMutation({
    mutationFn: (payload: Parameters<typeof completeOperation>[1]) => completeOperation(id, payload),
    onSuccess: invalidate,
  })
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelOperation(id, { cancellation_reason: reason }),
    onSuccess: () => {
      toast.success('تم إلغاء العملية')
      invalidate()
    },
  })
  const addTeamMemberMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperationTeamMember>[1]) => addOperationTeamMember(id, payload),
    onSuccess: invalidate,
  })
  const removeTeamMemberMutation = useMutation({
    mutationFn: (teamMemberId: number) => removeOperationTeamMember(id, teamMemberId),
    onSuccess: invalidate,
  })
  const addSupplyMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperationSupply>[1]) => addOperationSupply(id, payload),
    onSuccess: () => {
      invalidate()
      setSupplyModalOpen(false)
      setSupplyName('')
      setSupplyQuantity(1)
      setSupplyUnit('')
    },
  })
  const removeSupplyMutation = useMutation({
    mutationFn: (supplyId: number) => removeOperationSupply(id, supplyId),
    onSuccess: invalidate,
  })

  const [consentObtained, setConsentObtained] = useState(false)
  const [fastingConfirmed, setFastingConfirmed] = useState(false)
  const [siteMarked, setSiteMarked] = useState(false)
  const [preopVitalsChecked, setPreopVitalsChecked] = useState(false)
  const [preopNotes, setPreopNotes] = useState('')

  const [bulkTeamModalOpen, setBulkTeamModalOpen] = useState(false)
  const [bulkTeamForm] = Form.useForm<{
    members: { role_id?: number; doctor_id?: number; name?: string }[]
  }>()
  const membersWatch = Form.useWatch('members', bulkTeamForm)
  const defaultTeamRoleId = teamRolesQuery.data?.find((r) => r.slug === 'assistant_surgeon')?.id

  const [supplyModalOpen, setSupplyModalOpen] = useState(false)
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

  if (!operation) {
    return <PageLoader />
  }

  const isScheduled = operation.status === 'scheduled'
  const isInProgress = operation.status === 'in_progress'
  const isPrepared =
    operation.consent_obtained && operation.fasting_confirmed && operation.site_marked && operation.preop_vitals_checked

  function handleSavePreop() {
    prepareMutation.mutate({
      consent_obtained: consentObtained,
      fasting_confirmed: fastingConfirmed,
      site_marked: siteMarked,
      preop_vitals_checked: preopVitalsChecked,
      preop_notes: preopNotes || undefined,
    })
  }

  async function handleBulkAddTeamMembers(values: {
    members: { role_id?: number; doctor_id?: number; name?: string }[]
  }) {
    const members = (values.members ?? []).filter((m) => m.role_id && (m.doctor_id || m.name?.trim()))
    if (members.length === 0) return
    await Promise.all(
      members.map((m) =>
        addTeamMemberMutation.mutateAsync({
          role_id: m.role_id as number,
          doctor_id: m.doctor_id ?? undefined,
          name: m.doctor_id ? undefined : m.name,
        }),
      ),
    )
    bulkTeamForm.resetFields()
    setBulkTeamModalOpen(false)
  }

  function handleAddSupply() {
    if (!supplyName.trim()) return
    addSupplyMutation.mutate({ name: supplyName, quantity: supplyQuantity ?? 1, unit: supplyUnit || undefined })
  }

  function handleComplete() {
    completeMutation.mutate({
      findings: findings || undefined,
      complications: complications || undefined,
      blood_loss_ml: bloodLoss ?? undefined,
      outcome: outcome || undefined,
      report_notes: reportNotes || undefined,
    })
  }

  function handleCancel() {
    const reason = window.prompt('سبب الإلغاء (اختياري):') ?? ''
    if (window.confirm('هل أنت متأكد من إلغاء هذه العملية؟')) {
      cancelMutation.mutate(reason)
    }
  }

  const patient = operation.admission?.patient

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Card size="small" style={{ marginBottom: 2 }}>
        <Button
          type="link"
          size="small"
          style={{ paddingInlineStart: 0, height: 'auto', marginBottom: 4 }}
          onClick={() => navigate(-1)}
        >
          → رجوع
        </Button>

        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Flex align="center" wrap="wrap" gap={16}>
            <Flex align="center" gap={6}>
              <User size={18} strokeWidth={2.25} style={{ flexShrink: 0 }} />
              <Title level={4} style={{ margin: 0 }}>
                {patient ? (
                  <Link to={`/patients/${patient.id}`} style={{ color: 'inherit' }}>
                    {patient.name}
                  </Link>
                ) : (
                  '—'
                )}
              </Title>
            </Flex>
            <Flex align="center" gap={6}>
              <Stethoscope size={16} strokeWidth={2.25} style={{ flexShrink: 0 }} />
              <Text strong>د. {operation.surgeon?.name ?? '—'}</Text>
            </Flex>
            <Text type="secondary">{operation.procedure?.name_ar ?? '—'}</Text>
          </Flex>

          <Space wrap size={6}>
            {operation.procedure?.category && <Tag>{operation.procedure.category.name}</Tag>}
            <Tag color={PRIORITY_COLORS[operation.priority]}>{PRIORITY_LABELS[operation.priority]}</Tag>
            <Tag color={STATUS_COLORS[operation.status]}>{STATUS_LABELS[operation.status]}</Tag>
          </Space>
        </Flex>

        <Divider style={{ margin: '8px 0' }} />

        <Flex wrap="wrap" gap={16}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            رقم العملية: {operation.operation_number ?? '—'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            الموعد: {formatDateTime(operation.scheduled_at)}
            {operation.expected_duration_minutes && ` · ${operation.expected_duration_minutes} دقيقة`}
            {operation.anesthesia_type && ` · تخدير ${operation.anesthesia_type}`}
          </Text>
          {patient && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              رقم التنويم:{' '}
              <Link to={`/admissions/${operation.admission_id}`}>
                {operation.admission?.admission_number ?? `تنويم #${operation.admission_id}`}
              </Link>
            </Text>
          )}
          {operation.requested_by_doctor && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              الطبيب المسؤول: {operation.requested_by_doctor.name}
            </Text>
          )}
          {operation.diagnosis && <Text style={{ fontSize: 12 }}>التشخيص: {operation.diagnosis}</Text>}
        </Flex>
      </Card>

      <Card>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={8} className="md:border-e md:pe-6">
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    الفريق الطبي
                  </Title>
                  <Button size="small" onClick={() => setBulkTeamModalOpen(true)}>
                    إضافة عدة أعضاء
                  </Button>
                </Flex>
                {(operation.team_members ?? []).length === 0 ? (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={8}
                    style={{ padding: '24px 0', color: 'rgba(0,0,0,0.25)' }}
                  >
                    <Users size={48} strokeWidth={1.5} />
                    <Text type="secondary">لم يُضف أعضاء بعد</Text>
                  </Flex>
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
                          <Tag>{member.role?.name ?? '—'}</Tag>
                          <Text>{member.doctor?.name ?? member.name ?? '—'}</Text>
                        </Space>
                        <Button
                          size="small"
                          danger
                          type="text"
                          onClick={() => removeTeamMemberMutation.mutate(member.id)}
                        >
                          إزالة
                        </Button>
                      </Flex>
                    )}
                  />
                )}
              </div>
            </Col>

            <Col xs={24} md={8} className="md:border-e md:pe-6">
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div>
                  {(isInProgress || operation.status === 'completed') ? (
                    <>
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
                    </>
                  ) : (
                    <Text type="secondary">يظهر تقرير العملية بعد بدئها</Text>
                  )}
                </div>

                <Divider style={{ margin: 0 }} />

                <div>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>
                      المستلزمات
                    </Title>
                    <Button size="small" onClick={() => setSupplyModalOpen(true)}>
                      إضافة مستلزم
                    </Button>
                  </Flex>
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
                          <Button size="small" danger type="text" onClick={() => removeSupplyMutation.mutate(supply.id)}>
                            إزالة
                          </Button>
                        </Flex>
                      )}
                    />
                  )}
                </div>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
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
                    <Checkbox
                      checked={consentObtained}
                      disabled={!isScheduled}
                      onChange={(e) => setConsentObtained(e.target.checked)}
                    >
                      تم الحصول على موافقة المريض
                    </Checkbox>
                    <Checkbox
                      checked={fastingConfirmed}
                      disabled={!isScheduled}
                      onChange={(e) => setFastingConfirmed(e.target.checked)}
                    >
                      تم تأكيد الصيام
                    </Checkbox>
                    <Checkbox
                      checked={siteMarked}
                      disabled={!isScheduled}
                      onChange={(e) => setSiteMarked(e.target.checked)}
                    >
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
                      <Button size="small" onClick={handleSavePreop} loading={prepareMutation.isPending}>
                        حفظ التجهيز
                      </Button>
                    )}
                  </Space>
                </div>
              </Space>
            </Col>
          </Row>

          {(isScheduled || isInProgress) && (
            <>
              <Divider style={{ margin: 0 }} />
              <Flex justify="end" gap={8}>
                {isScheduled && (
                  <>
                    <Button danger onClick={handleCancel}>
                      إلغاء العملية
                    </Button>
                    <Button
                      type="primary"
                      disabled={!isPrepared}
                      loading={startMutation.isPending}
                      onClick={() => startMutation.mutate()}
                    >
                      بدء العملية
                    </Button>
                  </>
                )}
                {isInProgress && (
                  <>
                    <Button danger onClick={handleCancel}>
                      إلغاء العملية
                    </Button>
                    <Button type="primary" loading={completeMutation.isPending} onClick={handleComplete}>
                      إنهاء العملية
                    </Button>
                  </>
                )}
              </Flex>
            </>
          )}
        </Space>
      </Card>

      <Modal
        title="إضافة عدة أعضاء للفريق الطبي"
        open={bulkTeamModalOpen}
        onCancel={() => setBulkTeamModalOpen(false)}
        onOk={() => bulkTeamForm.submit()}
        okText="إضافة الكل"
        cancelText="إلغاء"
        confirmLoading={addTeamMemberMutation.isPending}
        width={680}
        destroyOnClose
      >
        <Form
          form={bulkTeamForm}
          layout="vertical"
          onFinish={handleBulkAddTeamMembers}
          initialValues={{ members: [{ role_id: defaultTeamRoleId }] }}
        >
          <Form.List name="members">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {fields.map((field) => {
                  const rowRoleId: number | undefined = membersWatch?.[field.name]?.role_id ?? defaultTeamRoleId
                  const roleDoctors = (doctorsQuery.data ?? []).filter((d) => d.role_id === rowRoleId)

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
                        onChange={() => bulkTeamForm.setFieldValue(['members', field.name, 'doctor_id'], undefined)}
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

      <Modal
        title="إضافة مستلزم"
        open={supplyModalOpen}
        onCancel={() => setSupplyModalOpen(false)}
        onOk={handleAddSupply}
        okText="إضافة"
        cancelText="إلغاء"
        confirmLoading={addSupplyMutation.isPending}
        okButtonProps={{ disabled: !supplyName.trim() }}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <FieldLabel label="الاسم">
            <Input value={supplyName} onChange={(e) => setSupplyName(e.target.value)} />
          </FieldLabel>
          <Flex gap={8}>
            <FieldLabel label="الكمية">
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                value={supplyQuantity}
                onChange={(value) => setSupplyQuantity(typeof value === 'number' ? value : null)}
              />
            </FieldLabel>
            <FieldLabel label="الوحدة">
              <Input value={supplyUnit} onChange={(e) => setSupplyUnit(e.target.value)} />
            </FieldLabel>
          </Flex>
        </Space>
      </Modal>
    </ConfigProvider>
  )
}
