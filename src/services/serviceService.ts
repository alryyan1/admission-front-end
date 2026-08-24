import apiClient from '@/services/api'
import type { ChartOpeningServiceSetting, Service, ServiceCategory, ShortStayServiceSetting } from '@/types/service'

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<ServiceCategory[]>('/service-categories')
  return data
}

export async function createServiceCategory(name: string): Promise<ServiceCategory> {
  const { data } = await apiClient.post<ServiceCategory>('/service-categories', { name })
  return data
}

export async function updateServiceCategory(id: number, name: string): Promise<ServiceCategory> {
  const { data } = await apiClient.patch<ServiceCategory>(`/service-categories/${id}`, { name })
  return data
}

export async function deleteServiceCategory(id: number): Promise<void> {
  await apiClient.delete(`/service-categories/${id}`)
}

export async function getServices(filters?: {
  category_id?: number
  search?: string
  active_only?: boolean
}): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>('/services', { params: filters ?? {} })
  return data
}

export async function createService(payload: {
  category_id?: number | null
  name_ar: string
  name_en?: string
  price: number
  is_active?: boolean
}): Promise<Service> {
  const { data } = await apiClient.post<Service>('/services', payload)
  return data
}

export async function updateService(
  id: number,
  payload: Partial<{
    category_id: number | null
    name_ar: string
    name_en: string | null
    price: number
    is_active: boolean
  }>,
): Promise<Service> {
  const { data } = await apiClient.patch<Service>(`/services/${id}`, payload)
  return data
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`)
}

export async function getChartOpeningServiceSetting(): Promise<ChartOpeningServiceSetting> {
  const { data } = await apiClient.get<ChartOpeningServiceSetting>('/settings/chart-opening-service')
  return data
}

export async function updateChartOpeningServiceSetting(payload: {
  service_id: number | null
  auto_add: boolean
  apply_to_short_stay: boolean
}): Promise<ChartOpeningServiceSetting> {
  const { data } = await apiClient.put<ChartOpeningServiceSetting>('/settings/chart-opening-service', payload)
  return data
}

export async function getShortStayServiceSetting(): Promise<ShortStayServiceSetting> {
  const { data } = await apiClient.get<ShortStayServiceSetting>('/settings/short-stay-service')
  return data
}

export async function updateShortStayServiceSetting(payload: {
  enabled: boolean
  service_12h_id: number | null
  service_24h_id: number | null
}): Promise<ShortStayServiceSetting> {
  const { data } = await apiClient.put<ShortStayServiceSetting>('/settings/short-stay-service', payload)
  return data
}
