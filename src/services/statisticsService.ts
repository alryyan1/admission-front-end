import apiClient from '@/services/api'
import type {
  AdmissionsStatistics,
  DoctorsServicesStatistics,
  FinancialStatistics,
  OccupancyStatistics,
} from '@/types/statistics'

export interface StatisticsDateRange {
  from?: string
  to?: string
}

export async function getOccupancyStatistics(): Promise<OccupancyStatistics> {
  const { data } = await apiClient.get<OccupancyStatistics>('/statistics/occupancy')
  return data
}

export async function getAdmissionsStatistics(range?: StatisticsDateRange): Promise<AdmissionsStatistics> {
  const { data } = await apiClient.get<AdmissionsStatistics>('/statistics/admissions', { params: range })
  return data
}

export async function getFinancialStatistics(range?: StatisticsDateRange): Promise<FinancialStatistics> {
  const { data } = await apiClient.get<FinancialStatistics>('/statistics/financials', { params: range })
  return data
}

export async function getDoctorsServicesStatistics(
  range?: StatisticsDateRange,
): Promise<DoctorsServicesStatistics> {
  const { data } = await apiClient.get<DoctorsServicesStatistics>('/statistics/doctors-services', {
    params: range,
  })
  return data
}
