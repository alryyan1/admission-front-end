import apiClient from '@/services/api'
import type { Company } from '@/types/admission'

export async function getCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get<Company[]>('/companies')
  return data
}

export async function createCompany(name: string): Promise<Company> {
  const { data } = await apiClient.post<Company>('/companies', { name })
  return data
}

export async function updateCompany(id: number, name: string): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`/companies/${id}`, { name })
  return data
}

export async function deleteCompany(id: number): Promise<void> {
  await apiClient.delete(`/companies/${id}`)
}
