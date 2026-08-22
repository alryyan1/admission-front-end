import apiClient from '@/services/api'
import type { UserWithSessions } from '@/types/session'

export async function getSessions(): Promise<UserWithSessions[]> {
  const { data } = await apiClient.get<UserWithSessions[]>('/sessions')
  return data
}

export async function revokeSession(tokenId: number): Promise<void> {
  await apiClient.delete(`/sessions/${tokenId}`)
}

export async function revokeAllSessionsForUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/sessions`)
}
