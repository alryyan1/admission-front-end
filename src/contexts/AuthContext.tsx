import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import { queryClient } from '@/lib/queryClient'
import * as authService from '@/services/authService'
import { setUnauthenticatedHandler } from '@/services/authEvents'
import type { AuthUser, LoginCredentials } from '@/types/auth'

export interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True while the stored token is being verified on app start. */
  isBootstrapping: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('authUser')
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    localStorage.removeItem('authUser')
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'))
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(() =>
    Boolean(localStorage.getItem('authToken')),
  )

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setToken(null)
    setUser(null)
    queryClient.clear()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)

      localStorage.setItem('authToken', response.token)
      localStorage.setItem('authUser', JSON.stringify(response.user))
      setToken(response.token)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // ignore network/401 errors on logout; we clear locally regardless
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  // Called from the axios interceptor when the API reports the session is invalid.
  const handleUnauthenticated = useCallback(() => {
    // Already signed out (or never signed in) — nothing to do, avoids toast spam
    // when several requests fail at once.
    if (!localStorage.getItem('authToken')) return
    clearAuth()
    toast.error('انتهت الجلسة، يرجى تسجيل الدخول مجدداً')
  }, [clearAuth])

  useEffect(() => {
    setUnauthenticatedHandler(handleUnauthenticated)
    return () => setUnauthenticatedHandler(null)
  }, [handleUnauthenticated])

  // Verify the stored token once on app start so a stale token redirects to
  // /login immediately instead of flashing a page and then bouncing.
  const didBootstrap = useRef(false)
  useEffect(() => {
    if (didBootstrap.current) return
    didBootstrap.current = true

    if (!localStorage.getItem('authToken')) {
      setIsBootstrapping(false)
      return
    }

    authService
      .verifyStoredToken()
      .then((freshUser) => {
        localStorage.setItem('authUser', JSON.stringify(freshUser))
        setUser(freshUser)
      })
      .catch((error) => {
        if (error?.response?.status === 401) {
          clearAuth()
        }
        // Other errors (offline, 5xx): keep the optimistic session so the app
        // still works; a later request will trigger the 401 handler if needed.
      })
      .finally(() => setIsBootstrapping(false))
  }, [clearAuth])

  const isAuthenticated = Boolean(token && user)

  const handleIdle = useCallback(() => {
    toast.info('تم تسجيل الخروج تلقائياً بسبب عدم النشاط')
    void logout()
  }, [logout])

  // useIdleLogout(isAuthenticated, handleIdle)

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      isBootstrapping,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, isBootstrapping, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
