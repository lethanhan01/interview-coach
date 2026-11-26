import { isServer, QueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'

const NON_RETRYABLE_ERROR_CODES = new Set(['REPORT_NOT_READY'])
export const FIVE_MINUTES_MS = 5 * 60_000

export function shouldRetryQuery(
  failureCount: number,
  error: unknown
): boolean {
  if (failureCount >= 2) {
    return false
  }
  if (error instanceof ApiClientError) {
    if (
      error.errorCode &&
      NON_RETRYABLE_ERROR_CODES.has(error.errorCode.toUpperCase())
    ) {
      return false
    }
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false
    }
  }
  return true
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
