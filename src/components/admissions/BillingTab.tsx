import { Row, Col } from 'antd'
import { AdmissionServicesCard } from '@/components/admissions/AdmissionServicesCard'
import { AdmissionDepositsCard } from '@/components/admissions/AdmissionDepositsCard'
import type { AdmissionDeposit, RequestedService } from '@/types/admission'

interface BillingTabProps {
  services: RequestedService[]
  deposits: AdmissionDeposit[]
  admissionId: number
  patientBalance?: number
  onAddService: (payload: { name: string; quantity?: number; unit_price: number }) => void
  onAddDeposit: (payload: { amount: number; payment_method_id?: number; comment?: string }) => void
  onUpdateService: (serviceId: number, payload: { quantity?: number; unit_price?: number }) => void
  onRemoveService: (serviceId: number) => void
  onRemoveDeposit: (depositId: number) => void
  onCalculateAccommodationFee: () => void
  isSubmittingService: boolean
  isSubmittingDeposit: boolean
  isUpdatingService: boolean
  isRemovingService: boolean
  isRemovingDeposit: boolean
  isCalculatingAccommodationFee: boolean
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
  isSubmittingService,
  isSubmittingDeposit,
  isUpdatingService,
  isRemovingService,
  isRemovingDeposit,
  isCalculatingAccommodationFee,
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
          isSubmittingService={isSubmittingService}
          isUpdatingService={isUpdatingService}
          isRemovingService={isRemovingService}
          isCalculatingAccommodationFee={isCalculatingAccommodationFee}
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
