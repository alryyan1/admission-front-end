import apiClient from '@/services/api'
import type { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth'

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/login', credentials)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/logout')
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/user')
  return data
}
