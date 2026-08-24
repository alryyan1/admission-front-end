import apiClient from '@/services/api'
import type { Specialist } from '@/types/admission'

export async function getSpecialists(): Promise<Specialist[]> {
  const { data } = await apiClient.get<Specialist[]>('/specialists')
  return data
}

export async function createSpecialist(name: string): Promise<Specialist> {
  const { data } = await apiClient.post<Specialist>('/specialists', { name })
  return data
}

export async function updateSpecialist(id: number, name: string): Promise<Specialist> {
  const { data } = await apiClient.patch<Specialist>(`/specialists/${id}`, { name })
  return data
}

export async function deleteSpecialist(id: number): Promise<void> {
  await apiClient.delete(`/specialists/${id}`)
}
