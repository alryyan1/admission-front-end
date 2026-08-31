import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { ConfigProvider, Card, Button, Tag, Tabs, Typography, Flex, Avatar, Badge, theme as antdThemeApi, Divider, Modal, Popover } from 'antd'
import {
  FileTextOutlined,
  BankOutlined,
  ApartmentOutlined,
  HomeOutlined,
  UserOutlined,
  BorderOutlined,
  PrinterOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import { formatNumber } from '@/lib/utils'
import { useFacilityPdfAssets } from '@/hooks/useFacilityPdfAssets'
import { AdmissionSummaryPdfDocument } from '@/components/admissions/AdmissionSummaryPdfDocument'
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
} from '@/services/admissionService'
import { OverviewTab } from '@/components/admissions/OverviewTab'
import { VitalsTab } from '@/components/admissions/VitalsTab'
import { OrdersTab } from '@/components/admissions/OrdersTab'
import { BillingTab } from '@/components/admissions/BillingTab'
import { AccountStatementTab } from '@/components/admissions/AccountStatementTab'
import { InvoiceTab } from '@/components/admissions/InvoiceTab'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { PageLoader } from '@/components/common/PageLoader'
import type { AdmissionStatus } from '@/types/admission'
import type { Room } from '@/types/facility'

const { Text } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

const GENDER_LABEL: Record<string, string> = { male: 'ذكر', female: 'أنثى' }

const ROOM_TYPE_TAG: Record<Room['room_type'], { label: string; color: string }> = {
  normal: { label: 'عادية', color: 'default' },
  vip: { label: 'VIP', color: 'gold' },
  operation: { label: 'عمليات', color: 'red' },
  ward: { label: 'عنبر', color: 'cyan' },
}

const TAB_ITEMS = [
  { key: 'overview', label: 'نظرة عامة' },
  // { key: 'vitals', label: 'العلامات الحيوية' },
  // { key: 'orders', label: 'أوامر الأطباء' },
  { key: 'billing', label: 'الفوترة' },
  { key: 'statement', label: 'كشف الحساب' },
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

  const { assets: pdfAssets } = useFacilityPdfAssets()
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryPreviewUrl, setSummaryPreviewUrl] = useState<string | null>(null)
  const summaryIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    return () => {
      if (summaryPreviewUrl) URL.revokeObjectURL(summaryPreviewUrl)
    }
  }, [summaryPreviewUrl])

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

  async function handleOpenSummaryPdf() {
    if (!admission) return
    setIsGeneratingSummary(true)
    try {
      const blob = await pdf(<AdmissionSummaryPdfDocument assets={pdfAssets} admission={admission} />).toBlob()
      setSummaryPreviewUrl(URL.createObjectURL(blob))
    } catch {
      toast.error('تعذر إنشاء ملف PDF')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  function handleCloseSummaryPreview() {
    if (summaryPreviewUrl) URL.revokeObjectURL(summaryPreviewUrl)
    setSummaryPreviewUrl(null)
  }

  function handlePrintSummary() {
    summaryIframeRef.current?.contentWindow?.print()
  }

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

  const locationPopoverContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
      <Flex align="center" gap={6}>
        <BankOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
          {admission.bed?.room?.ward?.floor?.name ?? '—'}
        </Text>
      </Flex>
      <Flex align="center" gap={6}>
        <ApartmentOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
          {admission.bed?.room?.ward?.name ?? '—'}
        </Text>
      </Flex>
      <Flex align="center" gap={6} wrap="wrap">
        <HomeOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
          غرفة {admission.bed?.room?.room_number ?? '—'}
        </Text>
        {admission.bed?.room?.room_type && (
          <Tag color={ROOM_TYPE_TAG[admission.bed.room.room_type].color} style={{ marginInlineEnd: 0 }}>
            {ROOM_TYPE_TAG[admission.bed.room.room_type].label}
          </Tag>
        )}
      </Flex>
      <Flex align="center" gap={6}>
        <BorderOutlined style={{ color: token.colorPrimary }} />
        <Text style={{ fontSize: secondaryFontSize, fontWeight: 600 }}>
          سرير {admission.bed?.bed_number ?? '—'}
        </Text>
      </Flex>
    </div>
  )

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
            <Popover content={locationPopoverContent} title="الموقع" trigger="click" placement="bottomLeft">
              <Button size="small" icon={<EnvironmentOutlined />}>
                الموقع
              </Button>
            </Popover>
            <Button size="small" icon={<PrinterOutlined />} loading={isGeneratingSummary} onClick={handleOpenSummaryPdf}>
              طباعة ملخص التنويم
            </Button>
            {admission.status === 'admitted' && (
              <>
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
                    if (dueBalance > 0) {
                      toast.error(`لا يمكن إخراج المريض، يوجد مبلغ مستحق قدره ${formatNumber(dueBalance)}`)
                      return
                    }
                    const summary = window.prompt('ملخص الخروج (اختياري):') ?? ''
                    dischargeMutation.mutate(summary)
                  }}
                >
                  إخراج المريض
                </Button>
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
          isShortStayRoom={admission.bed?.room?.is_short_stay ?? false}
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
          patientName={admission.patient?.name ?? ''}
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

      <Modal
        open={!!summaryPreviewUrl}
        onCancel={handleCloseSummaryPreview}
        width={860}
        title="معاينة ملخص التنويم"
        destroyOnHidden
        footer={[
          <Button key="close" onClick={handleCloseSummaryPreview}>
            إغلاق
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintSummary}>
            طباعة
          </Button>,
        ]}
      >
        {summaryPreviewUrl && (
          <iframe
            ref={summaryIframeRef}
            src={summaryPreviewUrl}
            title="معاينة ملخص التنويم"
            style={{ width: '100%', height: 640, border: 'none' }}
          />
        )}
      </Modal>
    </ConfigProvider>
  )
}
