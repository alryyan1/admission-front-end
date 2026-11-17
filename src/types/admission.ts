import type { Bed } from '@/types/facility'
import type { Doctor, Patient } from '@/types/patient'
import type { PaymentMethod } from '@/types/paymentMethod'

export type AdmissionStatus = 'admitted' | 'discharged' | 'cancelled'
export type AdmissionEntryType = 'emergency' | 'clinic_referral' | 'hospital_transfer' | 'scheduled'

export const ADMISSION_ENTRY_TYPE_LABELS: Record<AdmissionEntryType, string> = {
  emergency: 'طوارئ',
  clinic_referral: 'تحويل من عيادة',
  hospital_transfer: 'تحويل من مستشفى آخر',
  scheduled: 'دخول مجدول',
}

export interface Admission {
  id: number
  patient_id: number
  /** Null until a bed is assigned (admissions can be registered without one). */
  bed_id: number | null
  admission_number: string | null
  entry_type: AdmissionEntryType | null
  referring_hospital_name: string | null
  admission_date: string
  discharge_date: string | null
  status: AdmissionStatus
  diagnosis: string | null
  admission_notes: string | null
  discharge_summary: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  /** When the WhatsApp admission notice was successfully sent to the referring doctor, if ever. */
  doctor_notice_sent_at: string | null
  patient?: Patient
  bed?: Bed | null
  /** User who registered/admitted this admission. */
  admitted_by?: { id: number; name: string } | null
  vital_signs?: VitalSign[]
  doctor_orders?: DoctorOrder[]
  intake_output_records?: IntakeOutputRecord[]
  short_stay_assessment?: ShortStayAssessment | null
  deposits?: AdmissionDeposit[]
  requested_services?: RequestedService[]
  operations?: Operation[]
  operations_count?: number
  /** Live services + priced operations total, as computed by the admissions index endpoint. */
  total_charges?: number
  /** Sum of deposits, as computed by the admissions index endpoint. */
  paid_total?: number
  /** Live services + priced operations minus deposits, as computed by the admissions index endpoint. */
  balance_due?: number
  /** Outcome of the synchronous WhatsApp notice sent to the referring doctor on admission (POST /admissions only). */
  whatsapp_doctor_notice?: { sent: boolean; message: string; response?: Record<string, unknown> }
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
  mop: string | null
  rbg: number | null
  notes: string | null
}

export interface IntakeOutputRecord {
  id: number
  admission_id: number
  recorded_at: string
  feeding: string | null
  iv_fluid: string | null
  maintenance: string | null
  urine_output: string | null
  insensible_losses: string | null
  total_intake: string | null
  total_output: string | null
  balance: string | null
  notes: string | null
}

export interface ShortStayAssessment {
  id: number
  admission_id: number
  blood_pressure: string | null
  oxygen_saturation: number | null
  pulse: number | null
  respiration_rate: number | null
  pmh: string | null
  chief_complaint: string | null
  plan: string | null
  signed_at: string | null
  assessed_by?: { id: number; name: string } | null
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
  /** Name of the user who recorded the payment. */
  paid_by_name?: string | null
}

export interface DepositSetting {
  id: number
  require_balance_for_deposit: boolean
}

export interface RequestedService {
  id: number
  admission_id: number
  name: string
  quantity: number
  unit_price: string
  total_price: number
  is_paid: boolean
  payment_method_id: number | null
  payment_method?: PaymentMethod | null
  created_at: string
}

export interface TeamRole {
  id: number
  slug: string | null
  name: string
  is_protected: boolean
  is_default_team_member: boolean
}

export interface Specialist {
  id: number
  name: string
}

export interface InsuranceCompany {
  id: number
  name: string
  phone: string | null
  email: string | null
  /** Decimal string from the API, e.g. "80.00". */
  coverage_percentage: string | null
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
  doctor?: Doctor | null
  role?: TeamRole | null
  payment_method?: PaymentMethod | null
  operation?: Operation
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
  base_price: string | null
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
  /** Whether the operation's price has been paid in full (false while partially paid). */
  is_paid: boolean
  /** Sum of every deposit linked to this operation. */
  amount_paid: number
  /** Outstanding balance on the price, floored at 0; null when price isn't set yet. */
  remaining_amount: number | null
  entitlements_approved: boolean
  entitlements_approved_at: string | null
  entitlements_approved_by: number | null
  scheduled_at: string | null
  created_at: string
  surgeon?: Doctor
  admission?: Admission
  team_members?: OperationTeamMember[]
  procedure?: Procedure
  /** Individual payments recorded against this operation's price. */
  deposits?: AdmissionDeposit[]
}

export interface OperationListResponse {
  data: Operation[]
  /** Sum of `price` across every operation matching the current filters. */
  price_total: number
  /** Sum of `price - team entitlements` across every operation matching the current filters. */
  net_total: number
}

/** A billable line on the invoice preview — a requested service or a priced operation. */
export interface AdmissionInvoiceLineItem {
  id: number | string
  name: string
  quantity: number
  unit_price: number
  total_price: number
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
