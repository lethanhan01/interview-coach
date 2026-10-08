'use client'

import useSWR, { type KeyedMutator } from 'swr'
import { sessionService } from '@/services'
import type { Session } from '@/lib/types'

export interface UseSessionsResult {
  sessions: Session[]
  isLoading: boolean
  error: Error | null
  mutate: KeyedMutator<Session[]>
}

function toError(err: unknown): Error | null {
  if (!err) return null
  return err instanceof Error ? err : new Error(String(err))
}

export function useSessions(): UseSessionsResult {
  const { data, error, isLoading, mutate } = useSWR<Session[]>(
    '/sessions',
    () => sessionService.getSessions(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    sessions: data ?? [],
    isLoading,
    error: toError(error),
    mutate,
  }
}
