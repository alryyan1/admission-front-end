import apiClient from '@/services/api'
import type { User, UserRole } from '@/types/auth'

export interface UserPayload {
  name: string
  username: string
  password?: string
  role: UserRole
  is_active?: boolean
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users')
  return data
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await apiClient.post<User>('/users', payload)
  return data
}

export async function updateUser(id: number, payload: Partial<UserPayload>): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
