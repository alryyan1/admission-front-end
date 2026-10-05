import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tabs, Tab, Alert, Typography } from '@mui/material'
import { Badge, Button, Flex } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import { AdmissionServicesCard } from '@/components/admissions/AdmissionServicesCard'
import { AdmissionDepositsDialog } from '@/components/admissions/AdmissionDepositsDialog'
import { OperationsTab } from '@/components/admissions/OperationsTab'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  addDeposit,
  addOperation,
  addRequestedService,
  calculateAccommodationFee,
  getAdmission,
  removeDeposit,
  removeRequestedService,
  updateOperation,
  updateRequestedService,
} from '@/services/admissionService'
import { getChartOpeningServiceSetting } from '@/services/serviceService'
import type { Admission } from '@/types/admission'

interface AdmissionWorkAreaProps {
  admission: Admission
}

/** Middle "main work area" — services and operations management, with payments in a dialog, for the active admission on {@link AdmissionsPage}. */
export function AdmissionWorkArea({ admission }: AdmissionWorkAreaProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'operations'>('services')

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
    mutationFn: ({ serviceId, ...payload }: { serviceId: number; quantity?: number; unit_price?: number }) =>
      updateRequestedService(admission.id, serviceId, payload),
    onSuccess: invalidateAfterChange,
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
            onAddService={(payload) => serviceMutation.mutate(payload)}
            onUpdateService={(serviceId, payload) => updateServiceMutation.mutate({ serviceId, ...payload })}
            onRemoveService={(serviceId) => removeServiceMutation.mutate(serviceId)}
            onCalculateAccommodationFee={() => accommodationFeeMutation.mutate()}
            isSubmittingService={serviceMutation.isPending}
            isUpdatingService={updateServiceMutation.isPending}
            isRemovingService={removeServiceMutation.isPending}
            isCalculatingAccommodationFee={accommodationFeeMutation.isPending}
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
            onTeamChanged={invalidateAfterChange}
            isSubmitting={operationMutation.isPending || updateOperationMutation.isPending}
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
