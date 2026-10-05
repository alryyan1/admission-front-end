import apiClient from '@/services/api'
import type { PaymentsReport, RevenueCalculatorReport } from '@/types/report'

/** Relative paths to the server-rendered PDF endpoints (see {@link usePdfPreview}). */
export const reportPdfPaths = {
  revenueCalculator: (date: string) => `/reports/revenue-calculator.pdf?date=${date}`,
  payments: (from: string, to: string) => `/reports/payments.pdf?from=${from}&to=${to}`,
}

export async function getRevenueCalculator(date: string): Promise<RevenueCalculatorReport> {
  const { data } = await apiClient.get<RevenueCalculatorReport>('/reports/revenue-calculator', {
    params: { date },
  })
  return data
}

export async function getPaymentsReport(filters: {
  from: string
  to: string
  payment_method_id?: number
  search?: string
}): Promise<PaymentsReport> {
  const { data } = await apiClient.get<PaymentsReport>('/reports/payments', { params: filters })
  return data
}
