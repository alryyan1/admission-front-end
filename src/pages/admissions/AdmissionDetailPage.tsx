import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Tag, Tabs, Typography, Flex, Avatar, theme as antdThemeApi } from 'antd'
import {
  FileTextOutlined,
  BankOutlined,
  ApartmentOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import { useTheme, ADMISSION_HEADER_FONT_SIZE_PX } from '@/contexts/ThemeContext'
import {
  getAdmission,
  dischargeAdmission,
  cancelAdmission,
  addVitalSign,
  addDoctorOrder,
  addDose,
  addDeposit,
  addRequestedService,
  updateRequestedService,
  removeRequestedService,
  calculateAccommodationFee,
  getInvoice,
  getInvoices,
  generateInvoice,
  markInvoicePaid,
  addOperation,
} from '@/services/admissionService'
import { OverviewTab } from '@/components/admissions/OverviewTab'
import { VitalsTab } from '@/components/admissions/VitalsTab'
import { OrdersTab } from '@/components/admissions/OrdersTab'
import { BillingTab } from '@/components/admissions/BillingTab'
import { InvoiceTab } from '@/components/admissions/InvoiceTab'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { PageLoader } from '@/components/common/PageLoader'
import type { AdmissionStatus } from '@/types/admission'

const { Text } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

const TAB_ITEMS = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'vitals', label: 'العلامات الحيوية' },
  { key: 'orders', label: 'أوامر الأطباء' },
  { key: 'billing', label: 'الفوترة' },
  { key: 'operations', label: 'العمليات' },
  { key: 'invoice', label: 'الفاتورة' },
]

export function AdmissionDetailPage() {
  const antTheme = useAntTheme()
  const { token } = antdThemeApi.useToken()
  const { admissionHeaderBg, admissionHeaderFontSize } = useTheme()
  const { admissionId } = useParams<{ admissionId: string }>()
  const id = Number(admissionId)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'
  const setTab = (key: string) => setSearchParams(key === 'overview' ? {} : { tab: key }, { replace: true })

  const admissionQuery = useQuery({
    queryKey: ['admissions', id],
    queryFn: () => getAdmission(id),
    enabled: !!id,
  })

  const invoiceQuery = useQuery({
    queryKey: ['admissions', id, 'invoice'],
    queryFn: () => getInvoice(id),
    enabled: !!id && tab === 'invoice',
  })

  const invoicesQuery = useQuery({
    queryKey: ['admissions', id, 'invoices'],
    queryFn: () => getInvoices(id),
    enabled: !!id && tab === 'invoice',
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

  const admission = admissionQuery.data

  if (!admission) {
    return <PageLoader />
  }

  const autoAddedServices = (admission.requested_services ?? []).filter((s) => s.is_auto_added)

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
        size="small"
        style={{ marginBottom: 12, backgroundColor: headerBgColor }}
        styles={{ body: { padding: '8px 14px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
          <Flex align="center" gap={8} wrap="wrap">
            <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }} />
            <Text strong style={{ fontSize: nameFontSize }}>
              <Link to={`/patients/${admission.patient_id}`}>{admission.patient?.name}</Link>
            </Text>
            <Tag color={admission.status === 'admitted' ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
              {STATUS_LABEL[admission.status] ?? admission.status}
            </Tag>
            <Text type="secondary" style={{ fontSize: secondaryFontSize }}>
              <FileTextOutlined style={{ marginInlineEnd: 4 }} />
              {admission.id != null ? `#${admission.id}` : '—'}
            </Text>
            {admission.patient?.gender && (
              <Tag style={{ marginInlineEnd: 0 }}>{GENDER_LABEL[admission.patient.gender] ?? admission.patient.gender}</Tag>
            )}
            {admission.patient?.age_year != null && <Tag style={{ marginInlineEnd: 0 }}>{admission.patient.age_year} سنة</Tag>}
            {admission.patient?.blood_type && (
              <Tag color="red" style={{ marginInlineEnd: 0 }}>{admission.patient.blood_type}</Tag>
            )}
          </Flex>

          <Text type="secondary" style={{ fontSize: secondaryFontSize, whiteSpace: 'nowrap' }}>
            <BankOutlined style={{ marginInlineEnd: 4 }} />
            {admission.bed?.room?.ward?.floor?.name ?? '—'}
            {' / '}
            <ApartmentOutlined style={{ marginInlineEnd: 4 }} />
            {admission.bed?.room?.ward?.name ?? '—'}
            {' / '}
            <HomeOutlined style={{ marginInlineEnd: 4 }} />
            غرفة {admission.bed?.room?.room_number ?? '—'}
            {' / '}
            سرير {admission.bed?.bed_number ?? '—'}
          </Text>

          <Text type="secondary" style={{ fontSize: secondaryFontSize }}>
            الطبيب: {admission.admitting_doctor?.name ?? '—'}
            {admission.diagnosis && ` • التشخيص: ${admission.diagnosis}`}
          </Text>

          {admission.status === 'admitted' && (
            <Flex align="center" gap={6}>
              <Button
                size="small"
                loading={cancelMutation.isPending}
                onClick={() => {
                  const reason = window.prompt('سبب الإلغاء (اختياري):') ?? ''
                  if (window.confirm('هل أنت متأكد من إلغاء هذا التنويم؟')) {
                    cancelMutation.mutate(reason)
                  }
                }}
              >
                إلغاء التنويم
              </Button>
              <Button
                danger
                size="small"
                loading={dischargeMutation.isPending}
                onClick={() => {
                  const summary = window.prompt('ملخص الخروج (اختياري):') ?? ''
                  dischargeMutation.mutate(summary)
                }}
              >
                إخراج المريض
              </Button>
            </Flex>
          )}
        </Flex>

        {autoAddedServices.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
            تمت إضافة {autoAddedServices.map((s) => s.name).join('، ')} تلقائياً لهذا التنويم
          </Text>
        )}
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
          isShortStayRoom={admission.bed?.room?.is_short_stay ?? false}
          onAddService={(payload) => serviceMutation.mutate(payload)}
          onAddDeposit={(payload) => depositMutation.mutate(payload)}
          onUpdateService={(serviceId, payload) => updateServiceMutation.mutate({ serviceId, ...payload })}
          onRemoveService={(serviceId) => removeServiceMutation.mutate(serviceId)}
          onCalculateAccommodationFee={() => accommodationFeeMutation.mutate()}
          isSubmittingService={serviceMutation.isPending}
          isSubmittingDeposit={depositMutation.isPending}
          isUpdatingService={updateServiceMutation.isPending}
          isRemovingService={removeServiceMutation.isPending}
          isCalculatingAccommodationFee={accommodationFeeMutation.isPending}
        />
      )}

      {tab === 'operations' && (
        <OperationsTab
          operations={admission.operations ?? []}
          loading={admissionQuery.isFetching}
          onSchedule={(payload) => operationMutation.mutateAsync(payload)}
          isSubmitting={operationMutation.isPending}
        />
      )}

      {tab === 'invoice' && (
        <InvoiceTab
          invoice={invoiceQuery.data}
          isLoading={invoiceQuery.isLoading}
          persistedInvoices={invoicesQuery.data ?? []}
          onGenerateInvoice={() => generateInvoiceMutation.mutate()}
          onMarkPaid={(invoiceId) => markPaidMutation.mutate(invoiceId)}
          isGenerating={generateInvoiceMutation.isPending}
        />
      )}
    </ConfigProvider>
  )
}
