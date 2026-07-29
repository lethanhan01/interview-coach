'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from './supabase'
import { getSupabaseConfig } from './supabase-config'

type Role = 'user' | 'admin'
type AuthContextValue = {
  user: User | null
  session: Session | null
  role: Role | null
  status: string | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, role: null, status: null, isLoading: true,
})

const apiBase = getSupabaseConfig().apiBaseUrl

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<AuthContextValue>({
    user: null, session: null, role: null, status: null, isLoading: true,
  })

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const hydrate = async (session: Session | null) => {
      if (!session) {
        setValue({ user: null, session: null, role: null, status: null, isLoading: false })
        return
      }
      try {
        const response = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) {
          if (body?.errorCode === 'ACCOUNT_INACTIVE') {
            await supabase.auth.signOut()
            setValue({ user: null, session: null, role: null, status: null, isLoading: false })
            window.location.replace('/login?error=account_inactive')
            return
          }
          throw new Error(body?.message ?? 'Unable to load profile')
        }
        setValue({ user: session.user, session, role: body.data.role, status: body.data.status, isLoading: false })
      } catch {
        setValue({ user: session.user, session, role: null, status: null, isLoading: false })
      }
    }
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void hydrate(session) })
    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
