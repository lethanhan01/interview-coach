'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { authService } from '@/services'

type Role = 'candidate' | 'admin'
type CurrentUser = { id: string; email: string }
type AuthContextValue = {
  user: CurrentUser | null
  role: Role | null
  status: string | null
  isLoading: boolean
  refresh: () => Promise<Role | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  status: null,
  isLoading: true,
  refresh: async () => null,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Omit<AuthContextValue, 'refresh' | 'logout'>>({
    user: null,
    role: null,
    status: null,
    isLoading: true,
  })

  const refresh = useCallback(async (): Promise<Role | null> => {
    try {
      const user = await authService.getMe()
      if (!user) throw new Error('Not authenticated')
      const fetchedRole = user.role as Role
      setValue({
        user: { id: user.id, email: user.email },
        role: fetchedRole,
        status: user.status,
        isLoading: false,
      })
      return fetchedRole
    } catch {
      setValue({ user: null, role: null, status: null, isLoading: false })
      return null
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout()
    } finally {
      setValue({ user: null, role: null, status: null, isLoading: false })
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timeout)
  }, [refresh])

  useEffect(() => {
    const handleSessionExpired = () => {
      setValue({ user: null, role: null, status: null, isLoading: false })
      void authService.logout().catch(() => {})
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  const contextValue = useMemo(
    () => ({ ...value, refresh, logout }),
    [value, refresh, logout]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

