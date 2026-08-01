'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Role = 'user' | 'admin'
type CurrentUser = { id: string; email: string }
type AuthContextValue = {
  user: CurrentUser | null
  role: Role | null
  status: string | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null, role: null, status: null, isLoading: true, refresh: async () => {},
})

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Omit<AuthContextValue, 'refresh'>>({
    user: null, role: null, status: null, isLoading: true,
  })

  const refresh = async () => {
    try {
      const response = await fetch(`${apiBase}/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('Not authenticated')
      const body = await response.json()
      setValue({ user: { id: body.data.id, email: body.data.email }, role: body.data.role, status: body.data.status, isLoading: false })
    } catch {
      setValue({ user: null, role: null, status: null, isLoading: false })
    }
  }

  useEffect(() => { void refresh() }, [])
  return <AuthContext.Provider value={{ ...value, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
