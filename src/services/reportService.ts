import apiClient from '@/services/api'
import type {
  DailyRevenueReport,
  DoctorEntitlementsReport,
  PaymentRecorder,
  PaymentsReport,
  RevenueCalculatorReport,
} from '@/types/report'

/** Relative paths to the server-rendered PDF endpoints (see {@link usePdfPreview}). */
export const reportPdfPaths = {
  revenueCalculator: (date: string, userId?: number | null) =>
    `/reports/revenue-calculator.pdf?date=${date}${userId ? `&user_id=${userId}` : ''}`,
  payments: (from: string, to: string, paidByUserId?: number) =>
    `/reports/payments.pdf?from=${from}&to=${to}${paidByUserId ? `&paid_by_user_id=${paidByUserId}` : ''}`,
}

export async function getRevenueCalculator(date: string, userId?: number | null): Promise<RevenueCalculatorReport> {
  const { data } = await apiClient.get<RevenueCalculatorReport>('/reports/revenue-calculator', {
    params: { date, user_id: userId ?? undefined },
  })
  return data
}

export async function getPaymentsReport(filters: {
  from: string
  to: string
  payment_method_id?: number
  paid_by_user_id?: number
  search?: string
}): Promise<PaymentsReport> {
  const { data } = await apiClient.get<PaymentsReport>('/reports/payments', { params: filters })
  return data
}

export async function getPaymentRecorders(): Promise<PaymentRecorder[]> {
  const { data } = await apiClient.get<PaymentRecorder[]>('/reports/payments/recorders')
  return data
}

export async function getDailyRevenueReport(month: string): Promise<DailyRevenueReport> {
  const { data } = await apiClient.get<DailyRevenueReport>('/reports/daily-revenue', { params: { month } })
  return data
}

export async function getDoctorEntitlementsReport(filters: { from: string; to: string }): Promise<DoctorEntitlementsReport> {
  const { data } = await apiClient.get<DoctorEntitlementsReport>('/reports/doctor-entitlements', { params: filters })
  return data
}
