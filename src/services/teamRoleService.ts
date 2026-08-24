import apiClient from '@/services/api'
import type { TeamRole } from '@/types/admission'

export async function getTeamRoles(): Promise<TeamRole[]> {
  const { data } = await apiClient.get<TeamRole[]>('/team-roles')
  return data
}

export async function createTeamRole(name: string): Promise<TeamRole> {
  const { data } = await apiClient.post<TeamRole>('/team-roles', { name })
  return data
}

export async function updateTeamRole(id: number, name: string): Promise<TeamRole> {
  const { data } = await apiClient.patch<TeamRole>(`/team-roles/${id}`, { name })
  return data
}

export async function deleteTeamRole(id: number): Promise<void> {
  await apiClient.delete(`/team-roles/${id}`)
}
