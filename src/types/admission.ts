import type { Bed, Room } from '@/types/facility'
import type { Doctor, Patient } from '@/types/patient'

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
  method: 'cash' | 'bank' | 'fawry' | 'ocash'
  paid_at: string
}

export interface RequestedService {
  id: number
  admission_id: number
  name: string
  quantity: number
  unit_price: string
  total_price: number
}

export type OperationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type OperationTeamRole =
  | 'surgeon'
  | 'assistant_surgeon'
  | 'anesthesiologist'
  | 'scrub_nurse'
  | 'circulating_nurse'
  | 'technician'
  | 'other'

export interface OperationTeamMember {
  id: number
  operation_id: number
  doctor_id: number | null
  name: string | null
  role: OperationTeamRole
  notes: string | null
  doctor?: Doctor | null
}

export interface OperationSupply {
  id: number
  operation_id: number
  name: string
  quantity: number
  unit: string | null
  notes: string | null
}

export type OperationPriority = 'emergency' | 'urgent' | 'scheduled'

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
  operation_room_id: number | null
  operation_number: string | null
  procedure_id: number
  priority: OperationPriority
  diagnosis: string | null
  expected_duration_minutes: number | null
  anesthesia_type: string | null
  requested_by_doctor_id: number | null
  scheduled_at: string
  started_at: string | null
  ended_at: string | null
  status: OperationStatus
  notes: string | null
  consent_obtained: boolean
  fasting_confirmed: boolean
  site_marked: boolean
  preop_vitals_checked: boolean
  preop_notes: string | null
  prepared_at: string | null
  findings: string | null
  complications: string | null
  blood_loss_ml: number | null
  outcome: string | null
  report_notes: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  surgeon?: Doctor
  requested_by_doctor?: Doctor | null
  operation_room?: Room
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

export interface AdmissionInvoice {
  admission_id: number
  patient: Patient
  billing_mode: 'daily' | 'short_stay'
  nights_stayed: number | null
  price_per_day: number | null
  admission_duration_hours: 12 | 24 | null
  bed_charges: number
  requested_services: RequestedService[]
  services_total: number
  total: number
  deposits: AdmissionDeposit[]
  deposits_total: number
  balance_due: number
}
