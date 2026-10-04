import apiClient from '@/services/api'
import type { InsuranceCompany } from '@/types/admission'

export interface InsuranceCompanyPayload {
  name?: string
  phone?: string | null
}

export async function getInsuranceCompanies(): Promise<InsuranceCompany[]> {
  const { data } = await apiClient.get<InsuranceCompany[]>('/insurance-companies')
  return data
}

export async function createInsuranceCompany(payload: InsuranceCompanyPayload): Promise<InsuranceCompany> {
  const { data } = await apiClient.post<InsuranceCompany>('/insurance-companies', payload)
  return data
}

export async function updateInsuranceCompany(id: number, payload: InsuranceCompanyPayload): Promise<InsuranceCompany> {
  const { data } = await apiClient.patch<InsuranceCompany>(`/insurance-companies/${id}`, payload)
  return data
}

export async function deleteInsuranceCompany(id: number): Promise<void> {
  await apiClient.delete(`/insurance-companies/${id}`)
}
