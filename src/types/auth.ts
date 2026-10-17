export type UserRole = 'admin' | 'doctor' | 'nurse' | 'admission_clerk' | 'cashier'

export interface AuthUser {
  id: number
  name: string
  username: string
  role: UserRole
  /** Sidebar/route paths this user may access; null means unrestricted (governed by role only). */
  allowed_pages: string[] | null
}

export interface User {
  id: number
  name: string
  username: string
  role: UserRole
  /** Sidebar/route paths this user may access; null means unrestricted (governed by role only). */
  allowed_pages: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}
