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
