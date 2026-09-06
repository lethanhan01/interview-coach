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
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    mutate,
  }
}
