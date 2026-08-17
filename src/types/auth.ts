export type UserRole = 'admin' | 'doctor' | 'nurse' | 'admission_clerk' | 'cashier'

export interface AuthUser {
  id: number
  name: string
  username: string
  role: UserRole
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}
