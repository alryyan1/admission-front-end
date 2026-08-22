import type { UserRole } from '@/types/auth'

export interface UserSession {
  id: number
  name: string
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}

export interface UserWithSessions {
  id: number
  name: string
  username: string
  role: UserRole
  is_active: boolean
  tokens: UserSession[]
}
