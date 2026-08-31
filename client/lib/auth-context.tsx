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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  status: null,
  isLoading: true,
  refresh: async () => null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Omit<AuthContextValue, 'refresh'>>({
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

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timeout)
  }, [refresh])
  const contextValue = useMemo(() => ({ ...value, refresh }), [value, refresh])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

