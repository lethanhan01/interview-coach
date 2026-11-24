import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'
import { authQueries } from '@/queries/auth.queries'
import { candidateProfileQueries } from '@/queries/candidate-profile.queries'
import { makeQueryClient, shouldRetryQuery } from '@/queries/query-client'
import { onetAdminQueries, onetQueries } from '@/queries/onet.queries'
import { prepQueries } from '@/queries/prep.queries'
import { queryKeys } from '@/queries/keys'
import { rubricQueries } from '@/queries/rubric.queries'
import { sessionQueries } from '@/queries/session.queries'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import { userQueries } from '@/queries/user.queries'
import { useSessions } from '@/hooks/useSessions'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { userManagementService } from '@/services/admin.service'
import { candidateProfileService } from '@/services/candidate-profile.service'
import { prepService } from '@/services/prep.service'
import { rubricService } from '@/services/rubric.service'
import { sessionService } from '@/services/session.service'
import { onetService } from '@/services/onet.service'
import { onetAdminService } from '@/services/onet-admin.service'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type { Session } from '@/types'

vi.mock('@/services/auth.service', () => ({
  authService: {
    getMe: vi.fn(),
  },
}))

vi.mock('@/services/user.service', () => ({
  userService: {
    getCurrentUser: vi.fn(),
  },
}))

vi.mock('@/services/admin.service', () => ({
  userManagementService: {
    listUsers: vi.fn(),
    getUser: vi.fn(),
  },
}))

vi.mock('@/services/candidate-profile.service', () => ({
  candidateProfileService: {
    getProfile: vi.fn(),
  },
}))

vi.mock('@/services/prep.service', () => ({
  prepService: {
    getSavedJobDescriptions: vi.fn(),
  },
}))

vi.mock('@/services/rubric.service', () => ({
  rubricService: {
    getActiveRubric: vi.fn(),
  },
}))

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

vi.mock('@/services/onet-admin.service', () => ({
  onetAdminService: {
    getAnalyticsSummary: vi.fn(),
    getMajorGroupsDistribution: vi.fn(),
    getMajorGroups: vi.fn(),
    searchOccupations: vi.fn(),
    getTopOccupations: vi.fn(),
    getSfiaSkillCoverage: vi.fn(),
    getOccupationDetail: vi.fn(),
    getAlternateTitles: vi.fn(),
    getOccupationSfiaMappings: vi.fn(),
    getSfiaLibrary: vi.fn(),
  },
}))

vi.mock('@/services/sfia-admin.service', () => ({
  sfiaAdminService: {
    getCategories: vi.fn(),
    getSubcategories: vi.fn(),
    getSkills: vi.fn(),
    getSkillDetail: vi.fn(),
    getResponsibilityLevels: vi.fn(),
    getGenericAttributes: vi.fn(),
    getMatrixData: vi.fn(),
    getCoverageStats: vi.fn(),
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

  describe('queryKeys & all 9 queryOptions() factories', () => {
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
      expect(queryKeys.onetAdmin.majorGroupsDistribution()).toEqual([
        'onet-admin',
        'major-groups-distribution',
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

    it('forwards AbortSignal across all 9 domain queryOptions() factories', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(null)
      vi.mocked(userService.getCurrentUser).mockResolvedValue({
        id: 'u-1',
        email: 'user@test.dev',
        firstname: 'An',
        lastname: 'Nguyen',
        role: 'candidate',
        status: 'active',
        createdAt: '2026-11-23T00:00:00.000Z',
      })
      vi.mocked(userManagementService.listUsers).mockResolvedValue([])
      vi.mocked(candidateProfileService.getProfile).mockResolvedValue({
        id: 'u-1',
        email: 'user@test.dev',
        profile: null,
      })
      vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue([])
      vi.mocked(rubricService.getActiveRubric).mockResolvedValue({
        contextPackId: 'VN',
        sessionType: 'technical',
        categories: [],
        hint: 'hint',
      })
      vi.mocked(sessionService.getSessions).mockResolvedValue([mockSessionItem])
      vi.mocked(onetService.searchOccupations).mockResolvedValue([])
      vi.mocked(onetAdminService.getMajorGroups).mockResolvedValue([])
      vi.mocked(onetAdminService.getAlternateTitles).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
      vi.mocked(sfiaAdminService.getCategories).mockResolvedValue([])
      vi.mocked(sfiaAdminService.getSkillDetail).mockResolvedValue(null)

      const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      })

      await client.fetchQuery(authQueries.me())
      expect(authService.getMe).toHaveBeenCalledWith(expect.any(AbortSignal))

      await client.fetchQuery(userQueries.me())
      expect(userService.getCurrentUser).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(userQueries.adminList())
      expect(userManagementService.listUsers).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(candidateProfileQueries.detail())
      expect(candidateProfileService.getProfile).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(prepQueries.savedJds())
      expect(prepService.getSavedJobDescriptions).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(rubricQueries.active('VN', 'technical'))
      expect(rubricService.getActiveRubric).toHaveBeenCalledWith(
        'VN',
        'technical',
        expect.any(AbortSignal)
      )

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

      await client.fetchQuery(onetAdminQueries.majorGroups())
      expect(onetAdminService.getMajorGroups).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(
        onetAdminQueries.alternateTitles('15-1252.00', {
          page: 2,
          limit: 10,
          search: 'Lead',
        })
      )
      expect(onetAdminService.getAlternateTitles).toHaveBeenCalledWith(
        '15-1252.00',
        { page: 2, limit: 10, search: 'Lead' },
        expect.any(AbortSignal)
      )

      await client.fetchQuery(sfiaAdminQueries.categories())
      expect(sfiaAdminService.getCategories).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      )

      await client.fetchQuery(sfiaAdminQueries.skillDetail('PROG'))
      expect(sfiaAdminService.getSkillDetail).toHaveBeenCalledWith(
        'PROG',
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
