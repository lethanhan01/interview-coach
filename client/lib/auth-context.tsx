'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { authQueries, queryKeys } from '@/lib/query-client'
import { authService } from '@/services/auth.service'
import type { AuthUser, CurrentUser, UserRole } from '@/types'

function clearSessionCache(queryClient: QueryClient): void {
  queryClient.setQueryData(queryKeys.auth.me(), null)
  queryClient.removeQueries({
    predicate: (query) =>
      !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'me'),
  })
  queryClient.getMutationCache().clear()
}

/**
 * Ghi người dùng vừa xác thực vào cache `auth.me` và xóa sạch cache nghiệp vụ
 * của phiên cũ (nếu có) để ngăn rò rỉ dữ liệu giữa các tài khoản.
 */
export function applyAuthenticatedSession(
  queryClient: QueryClient,
  user: AuthUser
): void {
  queryClient.removeQueries({
    predicate: (query) =>
      !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'me'),
  })
  queryClient.setQueryData(queryKeys.auth.me(), user)
}

type AuthContextValue = {
  user: CurrentUser | null
  role: UserRole | null
  status: string | null
  isLoading: boolean
  refresh: () => Promise<UserRole | null>
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

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    ...authQueries.me(),
    retry: false,
  })

  const { mutateAsync: runLogout } = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSessionCache(queryClient)
    },
  })

  const refresh = useCallback(async (): Promise<UserRole | null> => {
    try {
      const fetchedUser = await queryClient.fetchQuery({
        ...authQueries.me(),
        staleTime: 0,
      })
      if (!fetchedUser) {
        queryClient.setQueryData(queryKeys.auth.me(), null)
        return null
      }
      return fetchedUser.role
    } catch {
      queryClient.setQueryData(queryKeys.auth.me(), null)
      return null
    }
  }, [queryClient])

  const logout = useCallback(async (): Promise<void> => {
    await runLogout().catch(() => {})
  }, [runLogout])

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSessionCache(queryClient)
      void authService.logout().catch(() => {})
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () =>
      window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [queryClient])

  const authUser = meQuery.isError ? null : (meQuery.data ?? null)
  const isLoading = meQuery.isPending

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: authUser ? { id: authUser.id, email: authUser.email } : null,
      role: authUser ? authUser.role : null,
      status: authUser ? authUser.status : null,
      isLoading,
      refresh,
      logout,
    }),
    [authUser, isLoading, refresh, logout]
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
