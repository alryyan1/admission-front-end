import apiClient from '@/services/api'
import type { RevenueCalculatorReport } from '@/types/report'

/** Relative paths to the server-rendered PDF endpoints (see {@link usePdfPreview}). */
export const reportPdfPaths = {
  revenueCalculator: (date: string) => `/reports/revenue-calculator.pdf?date=${date}`,
}

export async function getRevenueCalculator(date: string): Promise<RevenueCalculatorReport> {
  const { data } = await apiClient.get<RevenueCalculatorReport>('/reports/revenue-calculator', {
    params: { date },
  })
  return data
}
