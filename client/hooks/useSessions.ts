'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  queryKeys,
  sessionQueries,
  useOptionalQueryClient,
} from '@/lib/query-client'
import type { Session } from '@/lib/types'

export type UseSessionsResult = Omit<
  UseQueryResult<Session[], Error>,
  'error'
> & {
  sessions: Session[]
  error: Error | null
  invalidate: () => Promise<void>
}

function toError(err: unknown): Error | null {
  if (!err) return null
  return err instanceof Error ? err : new Error(String(err))
}

export function useSessions(): UseSessionsResult {
  const queryClient = useOptionalQueryClient()
  const query = useQuery(sessionQueries.list())

  return {
    ...query,
    sessions: query.data ?? [],
    error: toError(query.error),
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
  }
}
