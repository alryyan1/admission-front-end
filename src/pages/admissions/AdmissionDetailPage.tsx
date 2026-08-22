import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfigProvider, Card, Button, Tag, Tabs, Typography, Flex } from 'antd'
import { FileTextOutlined, BankOutlined, ApartmentOutlined, HomeOutlined } from '@ant-design/icons'
import { useAntTheme } from '@/lib/antdTheme'
import {
  getAdmission,
  dischargeAdmission,
  cancelAdmission,
  addVitalSign,
  addDoctorOrder,
  addDose,
  addDeposit,
  addRequestedService,
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

const { Title, Text } = Typography

const STATUS_LABEL: Record<AdmissionStatus, string> = {
  admitted: 'نشطة',
  discharged: 'مخرّجة',
  cancelled: 'ملغاة',
}

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

  const operationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperation>[1]) => addOperation(id, payload),
    onSuccess: invalidateAdmission,
  })

  const admission = admissionQuery.data

  if (!admission) {
    return <PageLoader />
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Card style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <Link  to={`/patients/${admission.patient_id}`}>{admission.patient?.name}</Link>
            </Title>
            <Text style={{ borderBottom: '1px dashed #d9d9d9', paddingBottom: 2, display: 'inline-block' }}>
              <FileTextOutlined style={{ marginInlineEnd: 4 }} />
              {admission.id != null ? `#${admission.id}` : '—'}
            </Text>
            <Flex vertical gap={4} style={{ marginTop: 4 }}>
              <Flex align="center" gap={6}>
                <BankOutlined style={{ color: '#1677ff', fontSize: 15 }} />
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                  {admission.bed?.room?.ward?.floor?.name ?? '—'}
                </Text>
              </Flex>
              <Flex align="center" gap={6} style={{ marginInlineStart: 16 }}>
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>↳</Text>
                <ApartmentOutlined style={{ color: '#1677ff', fontSize: 15 }} />
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                  {admission.bed?.room?.ward?.name}
                </Text>
              </Flex>
              <Flex align="center" gap={6} style={{ marginInlineStart: 32 }}>
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>↳</Text>
                <HomeOutlined style={{ color: '#1677ff', fontSize: 15 }} />
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                  غرفة {admission.bed?.room?.room_number}
                </Text>
              </Flex>
              <Flex align="center" gap={6} style={{ marginInlineStart: 48 }}>
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>↳</Text>
                <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                  سرير {admission.bed?.bed_number}
                </Text>
              </Flex>
            </Flex>
          </div>
          <Flex vertical align="center" style={{ textAlign: 'center', flex: 1 }}>
            <Text style={{ borderBottom: '1px dashed #d9d9d9', paddingBottom: 2 }}>
              الطبيب: {admission.admitting_doctor?.name ?? '—'}
            </Text>
            {admission.diagnosis && <Text>التشخيص: {admission.diagnosis}</Text>}
          </Flex>
          <Flex align="center" gap={8}>
            <Tag color={admission.status === 'admitted' ? 'success' : 'default'}>
              {STATUS_LABEL[admission.status] ?? admission.status}
            </Tag>
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
          onAddService={(payload) => serviceMutation.mutate(payload)}
          onAddDeposit={(payload) => depositMutation.mutate(payload)}
          isSubmittingService={serviceMutation.isPending}
          isSubmittingDeposit={depositMutation.isPending}
        />
      )}

      {tab === 'operations' && (
        <OperationsTab
          operations={admission.operations ?? []}
          onSchedule={(payload) => operationMutation.mutate(payload)}
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
