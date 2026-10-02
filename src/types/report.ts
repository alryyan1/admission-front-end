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
