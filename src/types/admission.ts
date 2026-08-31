import type { Bed } from '@/types/facility'
import type { Doctor, Patient } from '@/types/patient'
import type { PaymentMethod } from '@/types/paymentMethod'

export type AdmissionStatus = 'admitted' | 'discharged' | 'cancelled'
export type AdmissionType = 'inpatient' | 'short_stay'

export interface Admission {
  id: number
  patient_id: number
  bed_id: number
  admitting_doctor_id: number | null
  admission_number: string | null
  admission_type: AdmissionType | null
  admission_date: string
  discharge_date: string | null
  admission_duration_hours: 12 | 24 | null
  status: AdmissionStatus
  diagnosis: string | null
  admission_notes: string | null
  discharge_summary: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  patient?: Patient
  bed?: Bed
  admitting_doctor?: Doctor | null
  vital_signs?: VitalSign[]
  doctor_orders?: DoctorOrder[]
  deposits?: AdmissionDeposit[]
  requested_services?: RequestedService[]
  invoices?: Invoice[]
  operations?: Operation[]
  operations_count?: number
}

export interface VitalSign {
  id: number
  admission_id: number
  recorded_at: string
  temperature: string | null
  pulse: number | null
  respiration_rate: number | null
  blood_pressure: string | null
  oxygen_saturation: number | null
  notes: string | null
}

export interface DoctorOrder {
  id: number
  admission_id: number
  order_text: string
  frequency: string | null
  route: string | null
  status: 'active' | 'discontinued'
  doses?: TreatmentDose[]
}

export interface TreatmentDose {
  id: number
  doctor_order_id: number
  administered_at: string
  status: 'given' | 'missed' | 'refused'
  notes: string | null
}

export interface AdmissionDeposit {
  id: number
  admission_id: number
  amount: string
  payment_method_id: number | null
  payment_method?: PaymentMethod | null
  comment: string | null
  paid_at: string
}

export interface RequestedService {
  id: number
  admission_id: number
  name: string
  quantity: number
  unit_price: string
  total_price: number
  is_auto_added: boolean
  created_at: string
}

export interface TeamRole {
  id: number
  slug: string | null
  name: string
  is_protected: boolean
}

export interface Specialist {
  id: number
  name: string
}

export interface OperationTeamMember {
  id: number
  operation_id: number
  doctor_id: number | null
  name: string | null
  role_id: number
  notes: string | null
  entitlement_amount: string | null
  payment_method_id: number | null
  entitlement_paid_at: string | null
  doctor?: Doctor | null
  role?: TeamRole | null
  payment_method?: PaymentMethod | null
  operation?: Operation
}

export interface OperationSupply {
  id: number
  operation_id: number
  name: string
  quantity: number
  unit: string | null
  notes: string | null
}

export interface ProcedureCategory {
  id: number
  name: string
}

export interface Procedure {
  id: number
  category_id: number | null
  name_ar: string
  name_en: string | null
  type: string | null
  description: string | null
  is_active: boolean
  category?: ProcedureCategory | null
}

export interface Operation {
  id: number
  admission_id: number
  surgeon_id: number
  operation_number: string | null
  procedure_id: number
  /** Price of the operation (decimal string, e.g. "75000.00"). */
  price: string | null
  scheduled_at: string | null
  surgeon?: Doctor
  admission?: Admission
  team_members?: OperationTeamMember[]
  supplies?: OperationSupply[]
  procedure?: Procedure
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled'

export interface InvoiceItem {
  id: number
  invoice_id: number
  description: string
  quantity: string
  unit_price: string
  total: string
}

export interface Invoice {
  id: number
  admission_id: number
  invoice_number: string
  subtotal: string
  discount: string
  total: string
  status: InvoiceStatus
  issued_at: string | null
  paid_at: string | null
  items?: InvoiceItem[]
  created_by?: { id: number; name: string } | null
}

export interface CashierAdmission {
  id: number
  admission_number: string | null
  admission_date: string
  patient: Patient
  bed?: Bed
  services_total: number
  operations_total: number
  deposits_total: number
  balance_due: number
  operations?: Operation[]
}

export interface CashierDepositsByPaymentMethod {
  payment_method_id: number | null
  payment_method_name: string
  total: number
}

export interface CashierOverview {
  summary: {
    admissions_count: number
    admissions_with_balance: number
    total_outstanding: number
    deposits_today: number
    deposits_by_payment_method: CashierDepositsByPaymentMethod[]
  }
  admissions: CashierAdmission[]
}

/** A billable line on the invoice preview — a requested service or a priced operation. */
export interface AdmissionInvoiceLineItem {
  id: number | string
  name: string
  quantity: number
  unit_price: number
  total_price: number
  is_auto_added: boolean
  is_operation: boolean
  created_at: string
}

export interface AdmissionInvoice {
  admission_id: number
  patient: Patient
  requested_services: AdmissionInvoiceLineItem[]
  services_total: number
  operations_total: number
  total: number
  deposits: AdmissionDeposit[]
  deposits_total: number
  balance_due: number
}
