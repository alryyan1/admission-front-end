import { Row, Col } from 'antd'
import { AdmissionServicesCard } from '@/components/admissions/AdmissionServicesCard'
import { AdmissionDepositsCard } from '@/components/admissions/AdmissionDepositsCard'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

interface BillingTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  admissionId: number
  patientBalance?: number
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => Promise<unknown>
  onAddDeposit: (payload: { amount: number; payment_method_id?: number; comment?: string }) => void
  onUpdateService: (
    serviceId: number,
    payload: { quantity?: number; unit_price?: number; payment_method_id?: number | null },
  ) => void
  onRemoveService: (serviceId: number) => void
  onRemoveDeposit: (depositId: number) => void
  onCalculateAccommodationFee: () => void
  onPayService: (serviceId: number, paymentMethodId?: number | null) => void
  onCancelPayment: (serviceId: number) => void
  isSubmittingService: boolean
  isSubmittingDeposit: boolean
  isUpdatingService: boolean
  isRemovingService: boolean
  isRemovingDeposit: boolean
  isCalculatingAccommodationFee: boolean
  isPayingService?: boolean
  isCancellingPayment?: boolean
}

export function BillingTab({
  services,
  deposits,
  admissionId,
  patientBalance,
  onAddService,
  onAddDeposit,
  onUpdateService,
  onRemoveService,
  onRemoveDeposit,
  onCalculateAccommodationFee,
  onPayService,
  onCancelPayment,
  isSubmittingService,
  isSubmittingDeposit,
  isUpdatingService,
  isRemovingService,
  isRemovingDeposit,
  isCalculatingAccommodationFee,
  isPayingService,
  isCancellingPayment,
}: BillingTabProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <AdmissionServicesCard
          services={services}
          onAddService={onAddService}
          onUpdateService={onUpdateService}
          onRemoveService={onRemoveService}
          onCalculateAccommodationFee={onCalculateAccommodationFee}
          onPayService={onPayService}
          onCancelPayment={onCancelPayment}
          isSubmittingService={isSubmittingService}
          isUpdatingService={isUpdatingService}
          isRemovingService={isRemovingService}
          isCalculatingAccommodationFee={isCalculatingAccommodationFee}
          isPayingService={isPayingService}
          isCancellingPayment={isCancellingPayment}
          hasPayments={deposits.length > 0}
        />
      </Col>

      <Col xs={24} md={12}>
        <AdmissionDepositsCard
          deposits={deposits}
          admissionId={admissionId}
          patientBalance={patientBalance}
          onAddDeposit={onAddDeposit}
          onRemoveDeposit={onRemoveDeposit}
          isSubmittingDeposit={isSubmittingDeposit}
          isRemovingDeposit={isRemovingDeposit}
        />
      </Col>
    </Row>
  )
}
