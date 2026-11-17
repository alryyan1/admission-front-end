import apiClient from '@/services/api'
import type { GuardianRelationship } from '@/types/admission'

export async function getGuardianRelationships(): Promise<GuardianRelationship[]> {
  const { data } = await apiClient.get<GuardianRelationship[]>('/guardian-relationships')
  return data
}

export async function createGuardianRelationship(name: string): Promise<GuardianRelationship> {
  const { data } = await apiClient.post<GuardianRelationship>('/guardian-relationships', { name })
  return data
}

export async function updateGuardianRelationship(id: number, name: string): Promise<GuardianRelationship> {
  const { data } = await apiClient.patch<GuardianRelationship>(`/guardian-relationships/${id}`, { name })
  return data
}

export async function deleteGuardianRelationship(id: number): Promise<void> {
  await apiClient.delete(`/guardian-relationships/${id}`)
}
