import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'
import {
  makeQueryClient,
  onetQueries,
  queryKeys,
  sessionQueries,
  shouldRetryQuery,
} from '@/lib/query-client'
import { useSessions } from '@/hooks/useSessions'
import { sessionService } from '@/services/session.service'
import { onetService } from '@/services/onet.service'
import type { Session } from '@/types'

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
    getSession: vi.fn(),
    getSessionStatus: vi.fn(),
    getQuestions: vi.fn(),
    getFeedbackProgress: vi.fn(),
    getReport: vi.fn(),
  },
}))

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn(),
    getOccupationTech: vi.fn(),
  },
}))

const mockSessionItem: Session = {
  id: 'session-001',
  userId: 'user-001',
  jobTitle: 'Backend Engineer',
  sessionType: 'technical',
  contextPackId: 'VN',
  status: 'active',
  numQuestions: 5,
  jobDescription: 'Backend Engineer NestJS',
  createdAt: '2026-11-23T10:00:00.000Z',
}

describe('query-client infrastructure & TanStack Query v5 integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shouldRetryQuery & makeQueryClient', () => {
    it('stops retrying when failureCount reaches 2', () => {
      expect(shouldRetryQuery(2, new Error('Network timeout'))).toBe(false)
      expect(shouldRetryQuery(3, new Error('Network timeout'))).toBe(false)
    })

    it('retries transient network errors and 5xx ApiClientError below failure threshold', () => {
      expect(shouldRetryQuery(0, new Error('Network failure'))).toBe(true)
      expect(
        shouldRetryQuery(
          1,
          new ApiClientError('Gateway Timeout', 504, 'SERVICE_UNAVAILABLE')
        )
      ).toBe(true)
    })

    it('does not retry 4xx ApiClientError or REPORT_NOT_READY errorCode', () => {
      expect(
        shouldRetryQuery(
          0,
          new ApiClientError('Unauthorized', 401, 'UNAUTHORIZED')
        )
      ).toBe(false)
      expect(
        shouldRetryQuery(0, new ApiClientError('Not Found', 404, 'NOT_FOUND'))
      ).toBe(false)
      expect(
        shouldRetryQuery(
          0,
          new ApiClientError('Report pending', 500, 'REPORT_NOT_READY')
        )
      ).toBe(false)
    })

    it('creates a QueryClient with 30s default staleTime and mutations retry disabled', () => {
      const client = makeQueryClient()
      const defaults = client.getDefaultOptions()
      expect(defaults.queries?.staleTime).toBe(30_000)
      expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
      expect(defaults.mutations?.retry).toBe(false)
    })
  })

  describe('queryKeys & queryOptions() factories', () => {
    it('builds deterministic hierarchical queryKeys across all domains', () => {
      expect(queryKeys.auth.me()).toEqual(['auth', 'me'])
      expect(queryKeys.users.adminDetail('u-1')).toEqual([
        'users',
        'admin-detail',
        'u-1',
      ])
      expect(queryKeys.candidateProfile.detail()).toEqual([
        'candidate-profile',
        'detail',
      ])
      expect(queryKeys.prep.savedJds()).toEqual(['prep', 'saved-jds'])
      expect(queryKeys.rubrics.active('VN', 'technical')).toEqual([
        'rubrics',
        'active',
        'VN',
        'technical',
      ])
      expect(queryKeys.sessions.report('s-1')).toEqual([
        'sessions',
        'report',
        's-1',
      ])
      expect(queryKeys.onet.search('backend', 15)).toEqual([
        'onet',
        'search',
        'backend',
        15,
      ])
      expect(queryKeys.onetAdmin.sfiaMappings('15-1252.00')).toEqual([
        'onet-admin',
        'sfia-mappings',
        '15-1252.00',
      ])
      expect(queryKeys.sfiaAdmin.skillDetail('PROG')).toEqual([
        'sfia-admin',
        'skill-detail',
        'PROG',
      ])
    })

    it('forwards AbortSignal from sessionQueries and onetQueries queryOptions()', async () => {
      vi.mocked(sessionService.getSessions).mockResolvedValue([mockSessionItem])
      vi.mocked(onetService.searchOccupations).mockResolvedValue([])

      const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      })

      const sessions = await client.fetchQuery(sessionQueries.list())
      expect(sessions).toEqual([mockSessionItem])
      expect(sessionService.getSessions).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(onetQueries.search('software', 10))
      expect(onetService.searchOccupations).toHaveBeenCalledWith(
        'software',
        10,
        expect.any(AbortSignal)
      )
    })
  })

  describe('useSessions hook', () => {
    it('fetches sessions using TanStack Query v5 and supports cache invalidation', async () => {
      vi.mocked(sessionService.getSessions).mockResolvedValue([mockSessionItem])

      const testClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      })

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={testClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useSessions(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.sessions).toEqual([])

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.sessions).toEqual([mockSessionItem])
      expect(result.current.error).toBeNull()

      const invalidateSpy = vi.spyOn(testClient, 'invalidateQueries')
      await result.current.invalidate()
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.sessions.all,
      })
    })
  })
})
