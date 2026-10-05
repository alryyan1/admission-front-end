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

export interface PaymentReportRow {
  id: number
  admission_id: number
  patient_name: string | null
  amount: number
  payment_method: string | null
  comment: string | null
  paid_by: string | null
  paid_at: string | null
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

export interface PaymentsReport {
  range: { from: string; to: string }
  summary: { count: number; total_amount: number }
  by_method: PaymentMethodBreakdown[]
  payments: PaymentReportRow[]
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
  paid: number
  unpaid: number
}

export interface DoctorEntitlementRow {
  id: number
  operation_id: number
  operation_number: string | null
  scheduled_at: string | null
  patient_name: string | null
  procedure_name: string | null
  doctor_name: string
  role: string | null
  amount: number
  paid_at: string | null
  payment_method: string | null
}

export interface DoctorEntitlementsReport {
  range: { from: string; to: string }
  summary: { operations_count: number; total: number; paid: number; unpaid: number }
  doctors: DoctorEntitlementDoctorRow[]
  entitlements: DoctorEntitlementRow[]
}
