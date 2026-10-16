import apiClient from '@/services/api'
import type {
  AdmissionRevenueReport,
  DailyRevenueReport,
  DoctorEntitlementsReport,
  DoctorRevenueReport,
  DoctorRevenueRole,
  ExpensesReport,
  PaymentRecorder,
  RevenueCalculatorReport,
} from '@/types/report'

/** Relative paths to the server-rendered PDF endpoints (see {@link usePdfPreview}). */
export const reportPdfPaths = {
  revenueCalculator: (date: string, userId?: number | null) =>
    `/reports/revenue-calculator.pdf?date=${date}${userId ? `&user_id=${userId}` : ''}`,
  dailyRevenue: (month: string) => `/reports/daily-revenue.pdf?month=${month}`,
}

export async function getRevenueCalculator(date: string, userId?: number | null): Promise<RevenueCalculatorReport> {
  const { data } = await apiClient.get<RevenueCalculatorReport>('/reports/revenue-calculator', {
    params: { date, user_id: userId ?? undefined },
  })
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

export async function getAdmissionRevenueReport(filters: { from: string; to: string }): Promise<AdmissionRevenueReport> {
  const { data } = await apiClient.get<AdmissionRevenueReport>('/reports/admission-revenue', { params: filters })
  return data
}

export async function getDoctorRevenueReport(filters: {
  doctor_id: number
  doctor_role: DoctorRevenueRole
  from: string
  to: string
}): Promise<DoctorRevenueReport> {
  const { data } = await apiClient.get<DoctorRevenueReport>('/reports/doctor-revenue', { params: filters })
  return data
}

export async function getExpensesReport(filters: {
  from: string
  to: string
  category?: string
  search?: string
}): Promise<ExpensesReport> {
  const { data } = await apiClient.get<ExpensesReport>('/reports/expenses', { params: filters })
  return data
}
