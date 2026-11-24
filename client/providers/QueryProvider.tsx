'use client'

import { useContext, useState, type ReactNode } from 'react'
import {
  QueryClientContext,
  QueryClientProvider,
  type QueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/queries/query-client'

/**
 * @deprecated Dùng `useQueryClient()` từ `@tanstack/react-query` kèm `@test-utils`.
 * Chỉ giữ tạm đến Phase 8 cho các caller & test legacy chưa migrate.
 *
 * Trả về QueryClient từ React Context nếu có `<QueryClientProvider>`,
 * hoặc fallback an toàn về `getQueryClient()` để không làm crash các bài unit test
 * legacy render trực tiếp bằng `@testing-library/react`.
 */
export function useOptionalQueryClient(): QueryClient {
  const contextClient = useContext(QueryClientContext)
  return contextClient ?? getQueryClient()
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  )
}
