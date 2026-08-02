'use client'

import { createContext, useContext, useEffect, useState } from 'react'

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

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Omit<AuthContextValue, 'refresh'>>({
    user: null,
    role: null,
    status: null,
    isLoading: true,
  })

  const refresh = async (): Promise<Role | null> => {
    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Not authenticated')
      const body = await response.json()
      const fetchedRole = body.data.role
      setValue({
        user: { id: body.data.id, email: body.data.email },
        role: fetchedRole,
        status: body.data.status,
        isLoading: false,
      })
      return fetchedRole
    } catch {
      setValue({ user: null, role: null, status: null, isLoading: false })
      return null
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void refresh()
  }, [])
  return (
    <AuthContext.Provider value={{ ...value, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
