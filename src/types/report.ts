export interface RevenueCalculatorRow {
  label: string
  amounts: Record<string, number>
  total: number
}

export interface RevenueCalculatorReport {
  date: string
  payment_methods: string[]
  rows: RevenueCalculatorRow[]
  generated_by: string | null
  generated_at: string
}

export interface PaymentRecorder {
  id: number
  name: string
}

export interface PaymentMethodBreakdown {
  method: string
  count: number
  total: number
}

export interface DailyRevenuePaymentMethodColumn {
  key: string
  name: string
}

export interface DailyRevenueDay {
  date: string
  amounts: Record<string, number>
  total: number
}

export interface DailyRevenueReport {
  month: string
  range: { from: string; to: string }
  payment_methods: DailyRevenuePaymentMethodColumn[]
  days: DailyRevenueDay[]
  totals: { amounts: Record<string, number>; total: number }
}

export interface DoctorEntitlementDoctorRow {
  name: string
  role: string | null
  operations_count: number
  total: number
}

export interface DoctorEntitlementRow {
  id: number
  operation_id: number
  operation_number: string | null
  created_at: string | null
  patient_name: string | null
  procedure_name: string | null
  doctor_name: string
  role: string | null
  amount: number
  payment_method: string | null
}

export interface DoctorEntitlementsReport {
  range: { from: string; to: string }
  summary: { operations_count: number; total: number }
  doctors: DoctorEntitlementDoctorRow[]
  by_method: PaymentMethodBreakdown[]
  entitlements: DoctorEntitlementRow[]
}

export interface ExpenseCategoryBreakdown {
  category: string
  count: number
  total: number
}

export interface ExpenseReportRow {
  id: number
  expense_date: string
  category: string
  description: string | null
  amount: number
  payment_method: string | null
  recorded_by: string | null
}

export interface ExpensesReport {
  range: { from: string; to: string }
  summary: { count: number; total_amount: number }
  by_category: ExpenseCategoryBreakdown[]
  by_method: PaymentMethodBreakdown[]
  expenses: ExpenseReportRow[]
}

export interface RoomTypeRevenueBreakdown {
  room_type_code: string | null
  room_type_name: string
  admissions_count: number
  total: number
}

export interface AdmissionRevenueRow {
  admission_id: number
  admission_number: string | null
  patient_name: string | null
  admission_date: string | null
  discharge_date: string | null
  status: string
  room_type_code: string | null
  room_type_name: string
  ward_name: string | null
  room_number: string | null
  room_revenue: number
}

export interface AdmissionRevenueReport {
  range: { from: string; to: string }
  summary: { admissions_count: number; room_revenue: number }
  by_room_type: RoomTypeRevenueBreakdown[]
  admissions: AdmissionRevenueRow[]
}

export type DoctorRevenueRole = 'admitting' | 'referring'

export interface DoctorRevenueAdmissionRow {
  admission_id: number
  admission_number: string | null
  patient_id: number
  patient_name: string | null
  admission_date: string | null
  discharge_date: string | null
  status: string
  room_type_code: string | null
  room_type_name: string | null
  stay_days: number
  room_revenue: number
  services_revenue: number
  operations_revenue: number
  total_revenue: number
}

export interface DoctorRevenueRoomTypeBreakdown {
  room_type_code: string | null
  room_type_name: string
  total: number
}

export interface DoctorRevenueReport {
  doctor: { id: number; name: string; specialist: string | null }
  doctor_role: DoctorRevenueRole
  range: { from: string; to: string }
  summary: {
    patients_count: number
    admissions_count: number
    stay_days_count: number
    room_revenue: number
    services_revenue: number
    operations_revenue: number
    total_revenue: number
  }
  room_revenue_by_type: DoctorRevenueRoomTypeBreakdown[]
  admissions: DoctorRevenueAdmissionRow[]
}
