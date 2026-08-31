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

/**
 * Verify the stored token at app start. Skips the global 401 handler and the
 * error toast so a stale token results in a silent redirect to the login page.
 */
export async function verifyStoredToken(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/user', {
    skipAuthHandler: true,
    suppressToast: true,
  })
  return data
}
