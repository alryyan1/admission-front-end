import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Tag, Tabs, Typography, Flex, Avatar, Badge, theme as antdThemeApi, Divider, Modal, Tooltip, Input } from 'antd'
import { FileTextOutlined, UserOutlined, PrinterOutlined } from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import { formatNumber } from '@/lib/utils'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { PdfPreviewModal } from '@/components/common/PdfPreviewModal'
import { useTheme, ADMISSION_HEADER_FONT_SIZE_PX } from '@/contexts/ThemeContext'
import {
  getAdmission,
  dischargeAdmission,
  cancelAdmission,
  addVitalSign,
  addDoctorOrder,
  addDose,
  addDeposit,
  removeDeposit,
  addRequestedService,
  updateRequestedService,
  removeRequestedService,
  calculateAccommodationFee,
  getInvoice,
  getInvoices,
  generateInvoice,
  markInvoicePaid,
  addOperation,
  updateOperation,
  admissionPdfPaths,
} from '@/services/admissionService'
import { OverviewTab } from '@/components/admissions/OverviewTab'
import { VitalsTab } from '@/components/admissions/VitalsTab'
import { OrdersTab } from '@/components/admissions/OrdersTab'
import { BillingTab } from '@/components/admissions/BillingTab'
import { AccountStatementTab } from '@/components/admissions/AccountStatementTab'
import { InvoiceTab } from '@/components/admissions/InvoiceTab'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { PageLoader } from '@/components/common/PageLoader'
import { PatientLocationButton } from '@/components/admissions/PatientLocationButton'
import type { AdmissionStatus } from '@/types/admission'

const { Text } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

const TAB_ITEMS = [
  // { key: 'vitals', label: 'العلامات الحيوية' },
  // { key: 'orders', label: 'أوامر الأطباء' },
  { key: 'billing', label: 'الفوترة' },
  { key: 'statement', label: 'كشف الحساب' },
  { key: 'operations', label: 'العمليات' },
  { key: 'overview', label: 'نظرة عامة' },
]

export function AdmissionDetailPage() {
  const antTheme = useAntTheme()
  const { token } = antdThemeApi.useToken()
  const { admissionHeaderBg, admissionHeaderFontSize } = useTheme()
  const { admissionId } = useParams<{ admissionId: string }>()
  const id = Number(admissionId)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') ?? 'billing'
  const tab = TAB_ITEMS.some((item) => item.key === tabParam) ? tabParam : 'billing'
  const setTab = (key: string) => setSearchParams(key === 'overview' ? {} : { tab: key }, { replace: true })

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false)
  const [dischargeSummary, setDischargeSummary] = useState('')

  const summaryPdf = usePdfPreview()

  const admissionQuery = useQuery({
    queryKey: ['admissions', id],
    queryFn: () => getAdmission(id),
    enabled: !!id,
  })

  const invoiceQuery = useQuery({
    queryKey: ['admissions', id, 'invoice'],
    queryFn: () => getInvoice(id),
    enabled: !!id && isInvoiceModalOpen,
  })

  const invoicesQuery = useQuery({
    queryKey: ['admissions', id, 'invoices'],
    queryFn: () => getInvoices(id),
    enabled: !!id && isInvoiceModalOpen,
  })

  function invalidateAdmission() {
    queryClient.invalidateQueries({ queryKey: ['admissions', id] })
    queryClient.invalidateQueries({ queryKey: ['admissions', id, 'invoice'] })
    queryClient.invalidateQueries({ queryKey: ['admissions', id, 'invoices'] })
  }

  const dischargeMutation = useMutation({
    mutationFn: (summary: string) => dischargeAdmission(id, { discharge_summary: summary }),
    onSuccess: () => {
      toast.success('تم إخراج المريض')
      invalidateAdmission()
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelAdmission(id, { cancellation_reason: reason }),
    onSuccess: () => {
      toast.success('تم إلغاء التنويم')
      invalidateAdmission()
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    },
  })

  const generateInvoiceMutation = useMutation({
    mutationFn: () => generateInvoice(id),
    onSuccess: () => {
      toast.success('تم إصدار الفاتورة')
      invalidateAdmission()
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: number) => markInvoicePaid(invoiceId),
    onSuccess: () => {
      toast.success('تم تسجيل التحصيل')
      invalidateAdmission()
    },
  })

  const vitalMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addVitalSign>[1]) => addVitalSign(id, payload),
    onSuccess: invalidateAdmission,
  })

  const orderMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addDoctorOrder>[1]) => addDoctorOrder(id, payload),
    onSuccess: invalidateAdmission,
  })

  const doseMutation = useMutation({
    mutationFn: ({ orderId, ...payload }: { orderId: number } & Parameters<typeof addDose>[1]) =>
      addDose(orderId, payload),
    onSuccess: invalidateAdmission,
  })

  const depositMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addDeposit>[1]) => addDeposit(id, payload),
    onSuccess: invalidateAdmission,
  })

  const removeDepositMutation = useMutation({
    mutationFn: (depositId: number) => removeDeposit(id, depositId),
    onSuccess: invalidateAdmission,
  })

  const serviceMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addRequestedService>[1]) => addRequestedService(id, payload),
    onSuccess: invalidateAdmission,
  })

  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, ...payload }: { serviceId: number; quantity?: number; unit_price?: number }) =>
      updateRequestedService(id, serviceId, payload),
    onSuccess: invalidateAdmission,
  })

  const removeServiceMutation = useMutation({
    mutationFn: (requestedServiceId: number) => removeRequestedService(id, requestedServiceId),
    onSuccess: invalidateAdmission,
  })

  const accommodationFeeMutation = useMutation({
    mutationFn: () => calculateAccommodationFee(id),
    onSuccess: () => {
      toast.success('تم احتساب رسوم الإقامة')
      invalidateAdmission()
    },
  })

  const operationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperation>[1]) => addOperation(id, payload),
    onSuccess: invalidateAdmission,
  })

  const updateOperationMutation = useMutation({
    mutationFn: ({ operationId, ...payload }: { operationId: number } & Parameters<typeof updateOperation>[1]) =>
      updateOperation(operationId, payload),
    onSuccess: invalidateAdmission,
  })

  const admission = admissionQuery.data

  if (!admission) {
    return <PageLoader />
  }

  const totalServices = (admission.requested_services ?? []).reduce((sum, s) => sum + Number(s.total_price), 0)
  const totalOperations = (admission.operations ?? []).reduce(
    (sum, op) => sum + (op.price != null ? Number(op.price) : 0),
    0,
  )
  const totalDeposits = (admission.deposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0)
  const dueBalance = totalServices + totalOperations - totalDeposits

  const headerBgColor = (() => {
    switch (admissionHeaderBg) {
      case 'fillAlter':
        return token.colorFillAlter
      case 'primaryBg':
        return token.colorPrimaryBg
      case 'infoBg':
        return token.colorInfoBg
      case 'statusReactive':
        return admission.status === 'admitted' ? token.colorSuccessBg : token.colorFillAlter
      default:
        return undefined
    }
  })()

  const { name: nameFontSize, secondary: secondaryFontSize } = ADMISSION_HEADER_FONT_SIZE_PX[admissionHeaderFontSize]

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Card
        style={{ marginBottom: 12, borderRadius: 16, backgroundColor: headerBgColor, boxShadow: token.boxShadowTertiary }}
        styles={{ body: { padding: '18px 20px' } }}
      >
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
          <Flex align="center" gap={14}>
            <Avatar
              size={56}
              icon={<UserOutlined />}
              style={{
                backgroundColor: admission.patient?.gender === 'female' ? token.colorError : token.colorPrimary,
                flexShrink: 0,
                boxShadow: `0 0 0 3px ${token.colorPrimaryBg}`,
              }}
            />
            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: nameFontSize, lineHeight: 1.2 }}>
                <Link to={`/patients/${admission.patient_id}`} style={{ color: token.colorText }}>
                  {admission.patient?.name}
                </Link>
              </Text>
              <Flex align="center" gap={8} wrap="wrap">
                <Badge
                  status={admission.status === 'admitted' ? 'success' : 'default'}
                  text={
                    <Text style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
                      {STATUS_LABEL[admission.status] ?? admission.status}
                    </Text>
                  }
                />
                <Divider type="vertical" style={{ margin: 0 }} />
                <Text type="secondary" style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
                  <FileTextOutlined style={{ marginInlineEnd: 4 }} />
                  {admission.id != null ? `#${admission.id}` : '—'}
                </Text>
                <Divider type="vertical" style={{ margin: 0 }} />
                <Text type="secondary" style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
                  الطبيب: {admission.admitting_doctor?.name ?? '—'}
                </Text>
                {admission.referred_by_doctor && (
                  <>
                    <Divider type="vertical" style={{ margin: 0 }} />
                    <Text type="secondary" style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
                      محوّل من: {admission.referred_by_doctor.name}
                    </Text>
                  </>
                )}
                {admission.patient?.gender && (
                  <Tag style={{ marginInlineEnd: 0 }}>{GENDER_LABEL[admission.patient.gender] ?? admission.patient.gender}</Tag>
                )}
                {admission.patient?.age_year != null && <Tag style={{ marginInlineEnd: 0 }}>{admission.patient.age_year} سنة</Tag>}
                {admission.patient?.blood_type && (
                  <Tag color="red" style={{ marginInlineEnd: 0 }}>{admission.patient.blood_type}</Tag>
                )}
              </Flex>
            </Flex>
          </Flex>

          <Flex gap={8}>
            <PatientLocationButton bed={admission.bed} />
            <Tooltip title="إنشاء ملف PDF بملخص التنويم (بيانات المريض والإقامة) وفتحه في نافذة جديدة للطباعة">
              <Button
                size="small"
                icon={<PrinterOutlined />}
                loading={summaryPdf.isLoading()}
                onClick={() => summaryPdf.open(admissionPdfPaths.admissionSummary(id), 'معاينة ملخص التنويم')}
              >
                طباعة ملخص التنويم
              </Button>
            </Tooltip>
            <Tooltip title="عرض فاتورة التنويم بكل الخدمات والمبالغ والمدفوعات في نافذة منبثقة">
              <Button size="small" icon={<FileTextOutlined />} onClick={() => setIsInvoiceModalOpen(true)}>
                الفاتورة
              </Button>
            </Tooltip>
            {admission.status === 'admitted' && (
              <>
                <Tooltip title="إلغاء التنويم نهائياً (يُطلب سبب اختياري وتأكيد). يُستخدم عند تسجيل التنويم بالخطأ ولا يُحتسب كخروج للمريض">
                  <Button
                    size="small"
                    loading={cancelMutation.isPending}
                    onClick={() => {
                      setCancelReason('')
                      setCancelModalOpen(true)
                    }}
                  >
                    إلغاء التنويم
                  </Button>
                </Tooltip>
                <Tooltip title="إخراج المريض وإنهاء التنويم (يُطلب ملخص خروج اختياري). لا يمكن التنفيذ إذا كان هناك مبلغ مستحق غير مسدد">
                  <Button
                    danger
                    size="small"
                    loading={dischargeMutation.isPending}
                    onClick={() => {
                      if (dueBalance > 0) {
                        toast.error(`لا يمكن إخراج المريض، يوجد مبلغ مستحق قدره ${formatNumber(dueBalance)}`)
                        return
                      }
                      setDischargeSummary('')
                      setDischargeModalOpen(true)
                    }}
                  >
                    إخراج المريض
                  </Button>
                </Tooltip>
              </>
            )}
          </Flex>
        </Flex>

        {/* {autoAddedServices.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
            تمت إضافة {autoAddedServices.map((s) => s.name).join('، ')} تلقائياً لهذا التنويم
          </Text>
        )} */}
      </Card>

      <Tabs activeKey={tab} onChange={setTab} items={TAB_ITEMS} />

      {tab === 'overview' && <OverviewTab admission={admission} />}

      {tab === 'vitals' && (
        <VitalsTab
          vitals={admission.vital_signs ?? []}
          onAdd={(payload) => vitalMutation.mutate(payload)}
          isSubmitting={vitalMutation.isPending}
        />
      )}

      {tab === 'orders' && (
        <OrdersTab
          orders={admission.doctor_orders ?? []}
          onAddOrder={(payload) => orderMutation.mutate(payload)}
          onAddDose={(orderId, payload) => doseMutation.mutate({ orderId, ...payload })}
          isSubmittingOrder={orderMutation.isPending}
        />
      )}

      {tab === 'billing' && (
        <BillingTab
          services={admission.requested_services ?? []}
          deposits={admission.deposits ?? []}
          admissionId={admission.id}
          patientBalance={dueBalance}
          onAddService={(payload) => serviceMutation.mutate(payload)}
          onAddDeposit={(payload) => depositMutation.mutate(payload)}
          onUpdateService={(serviceId, payload) => updateServiceMutation.mutate({ serviceId, ...payload })}
          onRemoveService={(serviceId) => removeServiceMutation.mutate(serviceId)}
          onRemoveDeposit={(depositId) => removeDepositMutation.mutate(depositId)}
          onCalculateAccommodationFee={() => accommodationFeeMutation.mutate()}
          isSubmittingService={serviceMutation.isPending}
          isSubmittingDeposit={depositMutation.isPending}
          isUpdatingService={updateServiceMutation.isPending}
          isRemovingService={removeServiceMutation.isPending}
          isRemovingDeposit={removeDepositMutation.isPending}
          isCalculatingAccommodationFee={accommodationFeeMutation.isPending}
        />
      )}

      {tab === 'statement' && (
        <AccountStatementTab
          services={admission.requested_services ?? []}
          operations={admission.operations ?? []}
          deposits={admission.deposits ?? []}
          admissionId={admission.id}
        />
      )}

      {tab === 'operations' && (
        <OperationsTab
          operations={admission.operations ?? []}
          loading={admissionQuery.isFetching}
          onSchedule={(payload) => operationMutation.mutateAsync(payload)}
          onUpdate={(operationId, payload) => updateOperationMutation.mutateAsync({ operationId, ...payload })}
          onTeamChanged={invalidateAdmission}
          isSubmitting={operationMutation.isPending || updateOperationMutation.isPending}
        />
      )}

      <Modal
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        title="إلغاء التنويم"
        okText="تأكيد الإلغاء"
        cancelText="تراجع"
        okButtonProps={{ danger: true }}
        confirmLoading={cancelMutation.isPending}
        destroyOnHidden
        onOk={() =>
          cancelMutation.mutate(cancelReason, {
            onSuccess: () => setCancelModalOpen(false),
          })
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          هل أنت متأكد من إلغاء هذا التنويم؟ لا يمكن التراجع عن هذا الإجراء.
        </Text>
        <Input.TextArea
          rows={3}
          placeholder="سبب الإلغاء (اختياري)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>

      <Modal
        open={dischargeModalOpen}
        onCancel={() => setDischargeModalOpen(false)}
        title="إخراج المريض"
        okText="تأكيد الإخراج"
        cancelText="تراجع"
        okButtonProps={{ danger: true }}
        confirmLoading={dischargeMutation.isPending}
        destroyOnHidden
        onOk={() =>
          dischargeMutation.mutate(dischargeSummary, {
            onSuccess: () => setDischargeModalOpen(false),
          })
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          سيتم إنهاء التنويم وإخلاء السرير.
        </Text>
        <Input.TextArea
          rows={3}
          placeholder="ملخص الخروج (اختياري)"
          value={dischargeSummary}
          onChange={(e) => setDischargeSummary(e.target.value)}
        />
      </Modal>

      <Modal
        open={isInvoiceModalOpen}
        onCancel={() => setIsInvoiceModalOpen(false)}
        width={640}
        title="الفاتورة"
        destroyOnHidden
        footer={null}
      >
        <InvoiceTab
          invoice={invoiceQuery.data}
          isLoading={invoiceQuery.isLoading}
          persistedInvoices={invoicesQuery.data ?? []}
          onGenerateInvoice={() => generateInvoiceMutation.mutate()}
          onMarkPaid={(invoiceId) => markPaidMutation.mutate(invoiceId)}
          isGenerating={generateInvoiceMutation.isPending}
        />
      </Modal>

      <PdfPreviewModal url={summaryPdf.url} title={summaryPdf.title} onClose={summaryPdf.close} />
    </ConfigProvider>
  )
}
