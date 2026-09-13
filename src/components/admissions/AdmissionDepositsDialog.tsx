import { Modal } from 'antd'
import { AdmissionDepositsCard } from '@/components/admissions/AdmissionDepositsCard'
import type { AdmissionDeposit } from '@/types/admission'

interface AdmissionDepositsDialogProps {
  open: boolean
  onClose: () => void
  deposits: AdmissionDeposit[]
  admissionId: number
  onAddDeposit: (payload: { amount: number; payment_method_id?: number; comment?: string }) => void
  onRemoveDeposit: (depositId: number) => void
  isSubmittingDeposit: boolean
  isRemovingDeposit: boolean
}

/** Modal wrapper around {@link AdmissionDepositsCard} for the admissions main work area. */
export function AdmissionDepositsDialog({ open, onClose, ...cardProps }: AdmissionDepositsDialogProps) {
  return (
    <Modal open={open} onCancel={onClose} title={null} width={720} footer={null} destroyOnHidden>
      <AdmissionDepositsCard {...cardProps} />
    </Modal>
  )
}
