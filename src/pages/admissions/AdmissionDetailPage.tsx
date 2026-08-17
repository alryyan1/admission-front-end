import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  startOperation,
  completeOperation,
  cancelOperation,
} from '@/services/admissionService'
import { OverviewTab } from '@/components/admissions/OverviewTab'
import { VitalsTab } from '@/components/admissions/VitalsTab'
import { OrdersTab } from '@/components/admissions/OrdersTab'
import { BillingTab } from '@/components/admissions/BillingTab'
import { InvoiceTab } from '@/components/admissions/InvoiceTab'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { PageLoader } from '@/components/common/PageLoader'

export function AdmissionDetailPage() {
  const { admissionId } = useParams<{ admissionId: string }>()
  const id = Number(admissionId)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('overview')

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

  const startOperationMutation = useMutation({
    mutationFn: (operationId: number) => startOperation(operationId),
    onSuccess: invalidateAdmission,
  })

  const completeOperationMutation = useMutation({
    mutationFn: (operationId: number) => completeOperation(operationId),
    onSuccess: invalidateAdmission,
  })

  const cancelOperationMutation = useMutation({
    mutationFn: ({ operationId, cancellation_reason }: { operationId: number; cancellation_reason: string }) =>
      cancelOperation(operationId, { cancellation_reason }),
    onSuccess: invalidateAdmission,
  })

  const admission = admissionQuery.data

  if (!admission) {
    return <PageLoader />
  }

  return (
    <div>
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-12 md:col-span-8">
            <h1 className="text-xl font-semibold">{admission.patient?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {admission.admission_number ?? '—'} · {admission.bed?.room?.ward?.name} — غرفة{' '}
              {admission.bed?.room?.room_number} — سرير {admission.bed?.bed_number} · الطبيب:{' '}
              {admission.admitting_doctor?.name ?? '—'}
            </p>
            {admission.diagnosis && <p className="text-sm">التشخيص: {admission.diagnosis}</p>}
          </div>
          <div className="col-span-12 flex items-center justify-end gap-2 md:col-span-4">
            <Badge variant={admission.status === 'admitted' ? 'success' : 'secondary'}>
              {admission.status === 'admitted' ? 'نشطة' : admission.status === 'discharged' ? 'مخرّجة' : 'ملغاة'}
            </Badge>
            {admission.status === 'admitted' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelMutation.isPending}
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
                  variant="destructive"
                  size="sm"
                  disabled={dischargeMutation.isPending}
                  onClick={() => {
                    const summary = window.prompt('ملخص الخروج (اختياري):') ?? ''
                    dischargeMutation.mutate(summary)
                  }}
                >
                  إخراج المريض
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="vitals">العلامات الحيوية</TabsTrigger>
          <TabsTrigger value="orders">أوامر الأطباء</TabsTrigger>
          <TabsTrigger value="billing">الفوترة</TabsTrigger>
          <TabsTrigger value="operations">العمليات</TabsTrigger>
          <TabsTrigger value="invoice">الفاتورة</TabsTrigger>
        </TabsList>
      </Tabs>

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
          onStart={(operationId) => startOperationMutation.mutate(operationId)}
          onComplete={(operationId) => completeOperationMutation.mutate(operationId)}
          onCancel={(operationId, cancellation_reason) =>
            cancelOperationMutation.mutate({ operationId, cancellation_reason })
          }
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
    </div>
  )
}
