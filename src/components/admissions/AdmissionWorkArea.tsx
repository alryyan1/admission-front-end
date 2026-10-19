import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tabs, Tab, Alert, Typography } from '@mui/material'
import { Badge, Button, Flex } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import { AdmissionServicesCard } from '@/components/admissions/AdmissionServicesCard'
import { AdmissionDepositsDialog } from '@/components/admissions/AdmissionDepositsDialog'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { formatDateTime } from '@/lib/utils'
import { playPaymentSuccessSound } from '@/lib/sound'
import { useAuth } from '@/contexts/AuthContext'
import {
  addDeposit,
  addOperation,
  addRequestedService,
  calculateAccommodationFee,
  cancelRequestedServicePayment,
  deleteOperation,
  getAdmission,
  payOperation,
  payRequestedService,
  removeDeposit,
  removeRequestedService,
  updateOperation,
  updateRequestedService,
} from '@/services/admissionService'
import { getChartOpeningServiceSetting } from '@/services/serviceService'
import type { Admission } from '@/types/admission'

interface AdmissionWorkAreaProps {
  admission: Admission
  /** Bumped by the parent (e.g. clicking the "عملية" tag on the admissions list) to force-switch to the operations tab. */
  focusOperationsToken?: number
}

/** Middle "main work area" — services and operations management, with payments in a dialog, for the active admission on {@link AdmissionsPage}. */
export function AdmissionWorkArea({ admission, focusOperationsToken }: AdmissionWorkAreaProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'operations'>('services')

  useEffect(() => {
    if (focusOperationsToken) {
      setActiveTab('operations')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOperationsToken])

  const admissionQuery = useQuery({
    queryKey: ['admissions', admission.id],
    queryFn: () => getAdmission(admission.id),
  })

  const chartOpeningQuery = useQuery({
    queryKey: ['chart-opening-service-setting'],
    queryFn: getChartOpeningServiceSetting,
  })

  const currentAdmission = admissionQuery.data ?? admission
  /** Matches the backend's assertMutable(): only admins may change a discharged or cancelled admission. */
  const isReadOnly = currentAdmission.status !== 'admitted' && user?.role !== 'admin'
  const servicesCount = admissionQuery.data?.requested_services?.length ?? 0
  const operationsCount = admissionQuery.data?.operations?.length ?? 0
  const isFileOpeningFeeAdded = (admissionQuery.data?.requested_services ?? []).some(
    (service) => service.name === chartOpeningQuery.data?.service?.name_ar,
  )

  const totalServices = (admissionQuery.data?.requested_services ?? []).reduce(
    (sum, s) => sum + Number(s.total_price),
    0,
  )
  const totalOperations = (admissionQuery.data?.operations ?? []).reduce(
    (sum, op) => sum + (op.price != null ? Number(op.price) : 0),
    0,
  )
  const totalDeposits = (admissionQuery.data?.deposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0)
  const dueBalance = totalServices + totalOperations - totalDeposits

  function invalidateAfterChange() {
    queryClient.invalidateQueries({ queryKey: ['admissions'] })
    queryClient.invalidateQueries({ queryKey: ['admissions', admission.id] })
    queryClient.invalidateQueries({ queryKey: ['admissions', admission.id, 'invoice'] })
  }

  const serviceMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addRequestedService>[1]) => addRequestedService(admission.id, payload),
    onSuccess: invalidateAfterChange,
  })

  const updateServiceMutation = useMutation({
    mutationFn: (
      { serviceId, ...payload }: {
        serviceId: number
        quantity?: number
        unit_price?: number
        payment_method_id?: number | null
      },
    ) => updateRequestedService(admission.id, serviceId, payload),
    onSuccess: invalidateAfterChange,
  })

  const payServiceMutation = useMutation({
    mutationFn: ({ serviceId, paymentMethodId }: { serviceId: number; paymentMethodId?: number | null }) =>
      payRequestedService(admission.id, serviceId, paymentMethodId),
    onSuccess: () => {
      toast.success('تم تسجيل سداد الخدمة')
      playPaymentSuccessSound()
      invalidateAfterChange()
    },
  })

  const cancelPaymentMutation = useMutation({
    mutationFn: (serviceId: number) => cancelRequestedServicePayment(admission.id, serviceId),
    onSuccess: () => {
      toast.success('تم إلغاء السداد')
      invalidateAfterChange()
    },
  })

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: number) => removeRequestedService(admission.id, serviceId),
    onSuccess: invalidateAfterChange,
  })

  const accommodationFeeMutation = useMutation({
    mutationFn: () => calculateAccommodationFee(admission.id),
    onSuccess: () => {
      toast.success('تم احتساب رسوم الإقامة')
      invalidateAfterChange()
    },
  })

  const depositMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addDeposit>[1]) => addDeposit(admission.id, payload),
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة')
      playPaymentSuccessSound()
      invalidateAfterChange()
    },
  })

  const removeDepositMutation = useMutation({
    mutationFn: (depositId: number) => removeDeposit(admission.id, depositId),
    onSuccess: invalidateAfterChange,
  })

  const operationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof addOperation>[1]) => addOperation(admission.id, payload),
    onSuccess: invalidateAfterChange,
  })

  const updateOperationMutation = useMutation({
    mutationFn: ({ operationId, ...payload }: { operationId: number } & Parameters<typeof updateOperation>[1]) =>
      updateOperation(operationId, payload),
    onSuccess: invalidateAfterChange,
  })

  const deleteOperationMutation = useMutation({
    mutationFn: (operationId: number) => deleteOperation(operationId),
    onSuccess: invalidateAfterChange,
  })

  const payOperationMutation = useMutation({
    mutationFn: ({
      operationId,
      ...payload
    }: { operationId: number } & Parameters<typeof payOperation>[1]) => payOperation(operationId, payload),
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة')
      playPaymentSuccessSound()
      invalidateAfterChange()
    },
  })

  function handleAddFileOpeningFee() {
    const service = chartOpeningQuery.data?.service
    if (!service) {
      toast.error('لم يتم إعداد خدمة رسوم فتح الملف من الإعدادات')
      return
    }
    serviceMutation.mutate({ name: service.name_ar, quantity: 1, unit_price: Number(service.price) })
  }

  return (
    <>
      <div className="animate-in fade-in duration-300">
        <Flex gap={8} justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Flex gap={8}>
            <Button
              onClick={handleAddFileOpeningFee}
              disabled={
                isReadOnly ||
                serviceMutation.isPending ||
                chartOpeningQuery.isLoading ||
                !chartOpeningQuery.data?.service ||
                isFileOpeningFeeAdded
              }
            >
              رسوم فتح الملف
            </Button>
            <Button
              onClick={() => accommodationFeeMutation.mutate()}
              disabled={isReadOnly}
              loading={accommodationFeeMutation.isPending}
            >
              رسوم الإقامة
            </Button>
          </Flex>
          <Badge count={admissionQuery.data?.deposits?.length ?? 0} size="small" offset={[-4, 2]}>
            <Button icon={<WalletOutlined />} onClick={() => setPaymentsOpen(true)}>
              المدفوعات
            </Button>
          </Badge>
        </Flex>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab
            value="services"
            label={
              <Flex align="center" gap={6}>
                الخدمات
                <Badge count={servicesCount} size="small" showZero color="#8c8c8c" />
              </Flex>
            }
          />
          <Tab
            value="operations"
            label={
              <Flex align="center" gap={6}>
                العمليات
                <Badge count={operationsCount} size="small" showZero color="#8c8c8c" />
              </Flex>
            }
          />
        </Tabs>

        {activeTab === 'services' && (
          <AdmissionServicesCard
            services={admissionQuery.data?.requested_services ?? []}
            isLoading={admissionQuery.isLoading}
            onAddService={(payload) => serviceMutation.mutateAsync(payload)}
            onUpdateService={(serviceId, payload) => updateServiceMutation.mutate({ serviceId, ...payload })}
            onRemoveService={(serviceId) => removeServiceMutation.mutate(serviceId)}
            onCalculateAccommodationFee={() => accommodationFeeMutation.mutate()}
            onPayService={(serviceId, paymentMethodId) => payServiceMutation.mutate({ serviceId, paymentMethodId })}
            onCancelPayment={(serviceId) => cancelPaymentMutation.mutate(serviceId)}
            isSubmittingService={serviceMutation.isPending}
            isUpdatingService={updateServiceMutation.isPending}
            isRemovingService={removeServiceMutation.isPending}
            isCalculatingAccommodationFee={accommodationFeeMutation.isPending}
            isPayingService={payServiceMutation.isPending}
            isCancellingPayment={cancelPaymentMutation.isPending}
            hasPayments={(admissionQuery.data?.deposits?.length ?? 0) > 0}
            showQuickActions={false}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsTab
            operations={admissionQuery.data?.operations ?? []}
            loading={admissionQuery.isFetching}
            onSchedule={(payload) => operationMutation.mutateAsync(payload)}
            onUpdate={(operationId, payload) => updateOperationMutation.mutateAsync({ operationId, ...payload })}
            onDelete={(operationId) => deleteOperationMutation.mutate(operationId)}
            onTeamChanged={invalidateAfterChange}
            onPayOperation={(operationId, payload) => payOperationMutation.mutate({ operationId, ...payload })}
            onRemoveDeposit={(depositId) => removeDepositMutation.mutate(depositId)}
            isSubmitting={operationMutation.isPending || updateOperationMutation.isPending}
            isDeleting={deleteOperationMutation.isPending}
            isPayingOperation={payOperationMutation.isPending}
            isRemovingDeposit={removeDepositMutation.isPending}
            readOnly={isReadOnly}
          />
        )}

        {currentAdmission.status === 'cancelled' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              سبب الإلغاء
            </Typography>
            <Typography variant="body2">{currentAdmission.cancellation_reason || '—'}</Typography>
            {currentAdmission.cancelled_at && (
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(currentAdmission.cancelled_at)}
              </Typography>
            )}
          </Alert>
        )}
      </div>

      <AdmissionDepositsDialog
        open={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
        deposits={admissionQuery.data?.deposits ?? []}
        admissionId={admission.id}
        patientBalance={dueBalance}
        onAddDeposit={(payload) => depositMutation.mutate(payload)}
        onRemoveDeposit={(depositId) => removeDepositMutation.mutate(depositId)}
        isSubmittingDeposit={depositMutation.isPending}
        isRemovingDeposit={removeDepositMutation.isPending}
      />
    </>
  )
}
