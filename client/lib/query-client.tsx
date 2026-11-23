'use client'

import { useContext, useState, type ReactNode } from 'react'
import {
  isServer,
  QueryClient,
  QueryClientContext,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ApiClientError } from '@/lib/api-client'
import {
  authService,
  candidateProfileService,
  onetAdminService,
  onetService,
  prepService,
  rubricService,
  sessionService,
  sfiaAdminService,
  userManagementService,
  userService,
} from '@/services'
import type {
  ContextPack,
  OnetAlternateTitlesQuery,
  OnetOccupationSearchFilters,
  OnetTopOccupationsQuery,
  SessionType,
  SfiaSkillFilters,
} from '@/types'

const NON_RETRYABLE_ERROR_CODES = new Set(['REPORT_NOT_READY'])
const FIVE_MINUTES_MS = 5 * 60_000

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

/**
 * Trả về QueryClient từ React Context nếu có `<QueryClientProvider>`,
 * hoặc fallback an toàn về `getQueryClient()` để không làm crash các bài unit test
 * legacy render trực tiếp bằng `@testing-library/react`.
 */
export function useOptionalQueryClient(): QueryClient {
  const contextClient = useContext(QueryClientContext)
  return contextClient ?? getQueryClient()
}

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
    adminList: () => ['users', 'admin-list'] as const,
    adminDetail: (id: string) => ['users', 'admin-detail', id] as const,
  },
  candidateProfile: {
    all: ['candidate-profile'] as const,
    detail: () => ['candidate-profile', 'detail'] as const,
  },
  prep: {
    all: ['prep'] as const,
    savedJds: () => ['prep', 'saved-jds'] as const,
  },
  rubrics: {
    all: ['rubrics'] as const,
    active: (contextPackId: string, sessionType?: string) =>
      ['rubrics', 'active', contextPackId, sessionType ?? 'all'] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: () => ['sessions', 'list'] as const,
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
    status: (sessionId: string) => ['sessions', 'status', sessionId] as const,
    questions: (sessionId: string) =>
      ['sessions', 'questions', sessionId] as const,
    feedbackProgress: (sessionId: string) =>
      ['sessions', 'feedback-progress', sessionId] as const,
    report: (sessionId: string) => ['sessions', 'report', sessionId] as const,
  },
  onet: {
    all: ['onet'] as const,
    search: (query?: string, limit?: number) =>
      ['onet', 'search', query ?? '', limit ?? 20] as const,
    tech: (socCode: string) => ['onet', 'tech', socCode] as const,
  },
  onetAdmin: {
    all: ['onet-admin'] as const,
    summary: () => ['onet-admin', 'summary'] as const,
    majorGroups: () => ['onet-admin', 'major-groups'] as const,
    majorGroupsDistribution: () =>
      ['onet-admin', 'major-groups-distribution'] as const,
    occupations: (filters?: OnetOccupationSearchFilters) =>
      ['onet-admin', 'occupations', filters ?? {}] as const,
    topOccupations: (filters?: OnetTopOccupationsQuery) =>
      ['onet-admin', 'top-occupations', filters ?? {}] as const,
    sfiaCoverage: (filters?: { limit?: number; category?: string }) =>
      ['onet-admin', 'sfia-coverage', filters ?? {}] as const,
    detail: (socCode: string) => ['onet-admin', 'detail', socCode] as const,
    alternateTitles: (
      socCode: string,
      page?: number,
      limit?: number,
      search?: string
    ) =>
      [
        'onet-admin',
        'alternate-titles',
        socCode,
        page ?? 1,
        limit ?? 20,
        search ?? '',
      ] as const,
    sfiaMappings: (socCode: string) =>
      ['onet-admin', 'sfia-mappings', socCode] as const,
    sfiaLibrary: () => ['onet-admin', 'sfia-library'] as const,
  },
  sfiaAdmin: {
    all: ['sfia-admin'] as const,
    categories: () => ['sfia-admin', 'categories'] as const,
    subcategories: (categoryCode?: string) =>
      ['sfia-admin', 'subcategories', categoryCode ?? 'all'] as const,
    skills: (filters?: SfiaSkillFilters) =>
      ['sfia-admin', 'skills', filters ?? {}] as const,
    skillDetail: (skillCode: string) =>
      ['sfia-admin', 'skill-detail', skillCode] as const,
    levels: () => ['sfia-admin', 'levels'] as const,
    attributes: () => ['sfia-admin', 'attributes'] as const,
    matrix: (categoryCode?: string) =>
      ['sfia-admin', 'matrix', categoryCode ?? 'all'] as const,
    coverage: () => ['sfia-admin', 'coverage'] as const,
  },
} as const

export const authQueries = {
  all: () => queryKeys.auth.all,
  me: () =>
    queryOptions({
      queryKey: queryKeys.auth.me(),
      queryFn: ({ signal }) => authService.getMe(signal),
    }),
}

export const userQueries = {
  all: () => queryKeys.users.all,
  me: () =>
    queryOptions({
      queryKey: queryKeys.users.me(),
      queryFn: ({ signal }) => userService.getCurrentUser(signal),
    }),
  adminList: () =>
    queryOptions({
      queryKey: queryKeys.users.adminList(),
      queryFn: ({ signal }) => userManagementService.listUsers(signal),
    }),
  adminDetail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.users.adminDetail(id),
      queryFn: ({ signal }) => userManagementService.getUser(id, signal),
    }),
}

export const candidateProfileQueries = {
  all: () => queryKeys.candidateProfile.all,
  detail: () =>
    queryOptions({
      queryKey: queryKeys.candidateProfile.detail(),
      queryFn: ({ signal }) => candidateProfileService.getProfile(signal),
    }),
}

export const prepQueries = {
  all: () => queryKeys.prep.all,
  savedJds: () =>
    queryOptions({
      queryKey: queryKeys.prep.savedJds(),
      queryFn: ({ signal }) => prepService.getSavedJobDescriptions(signal),
    }),
}

export const rubricQueries = {
  all: () => queryKeys.rubrics.all,
  active: (
    contextPackId: ContextPack,
    sessionType: SessionType = 'technical'
  ) =>
    queryOptions({
      queryKey: queryKeys.rubrics.active(contextPackId, sessionType),
      queryFn: ({ signal }) =>
        rubricService.getActiveRubric(contextPackId, sessionType, signal),
      staleTime: FIVE_MINUTES_MS,
    }),
}

export const sessionQueries = {
  all: () => queryKeys.sessions.all,
  list: () =>
    queryOptions({
      queryKey: queryKeys.sessions.list(),
      queryFn: ({ signal }) => sessionService.getSessions(signal),
      staleTime: 5_000,
    }),
  detail: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.detail(sessionId),
      queryFn: ({ signal }) => sessionService.getSession(sessionId, signal),
    }),
  status: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.status(sessionId),
      queryFn: ({ signal }) =>
        sessionService.getSessionStatus(sessionId, signal),
      staleTime: 5_000,
    }),
  questions: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.questions(sessionId),
      queryFn: ({ signal }) => sessionService.getQuestions(sessionId, signal),
    }),
  feedbackProgress: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.feedbackProgress(sessionId),
      queryFn: ({ signal }) =>
        sessionService.getFeedbackProgress(sessionId, signal),
      staleTime: 5_000,
    }),
  report: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.report(sessionId),
      queryFn: ({ signal }) => sessionService.getReport(sessionId, signal),
      staleTime: 60_000,
    }),
}

export const onetQueries = {
  all: () => queryKeys.onet.all,
  search: (query?: string, limit = 20) =>
    queryOptions({
      queryKey: queryKeys.onet.search(query, limit),
      queryFn: ({ signal }) =>
        onetService.searchOccupations(query, limit, signal),
      staleTime: 60_000,
    }),
  tech: (socCode: string) =>
    queryOptions({
      queryKey: queryKeys.onet.tech(socCode),
      queryFn: ({ signal }) => onetService.getOccupationTech(socCode, signal),
      staleTime: 60_000,
    }),
}

export const onetAdminQueries = {
  all: () => queryKeys.onetAdmin.all,
  summary: () =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.summary(),
      queryFn: ({ signal }) => onetAdminService.getAnalyticsSummary(signal),
    }),
  majorGroupsDistribution: () =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.majorGroupsDistribution(),
      queryFn: ({ signal }) =>
        onetAdminService.getMajorGroupsDistribution(signal),
      staleTime: 60_000,
    }),
  majorGroups: () =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.majorGroups(),
      queryFn: ({ signal }) => onetAdminService.getMajorGroups(signal),
      staleTime: 60_000,
    }),
  occupations: (filters: OnetOccupationSearchFilters = {}) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.occupations(filters),
      queryFn: ({ signal }) =>
        onetAdminService.searchOccupations(filters, signal),
      staleTime: 60_000,
    }),
  topOccupations: (filters: OnetTopOccupationsQuery = {}) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.topOccupations(filters),
      queryFn: ({ signal }) =>
        onetAdminService.getTopOccupations(filters, signal),
    }),
  sfiaCoverage: (limit = 20, category?: string) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.sfiaCoverage({
        limit,
        category: category ?? '',
      }),
      queryFn: ({ signal }) =>
        onetAdminService.getSfiaSkillCoverage(limit, category, signal),
    }),
  detail: (socCode: string) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.detail(socCode),
      queryFn: ({ signal }) =>
        onetAdminService.getOccupationDetail(socCode, signal),
    }),
  alternateTitles: (socCode: string, query: OnetAlternateTitlesQuery = {}) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.alternateTitles(
        socCode,
        query.page,
        query.limit,
        query.search
      ),
      queryFn: ({ signal }) =>
        onetAdminService.getAlternateTitles(socCode, query, signal),
    }),
  sfiaMappings: (socCode: string) =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.sfiaMappings(socCode),
      queryFn: ({ signal }) =>
        onetAdminService.getOccupationSfiaMappings(socCode, signal),
    }),
  sfiaLibrary: () =>
    queryOptions({
      queryKey: queryKeys.onetAdmin.sfiaLibrary(),
      queryFn: ({ signal }) => onetAdminService.getSfiaLibrary(signal),
      staleTime: FIVE_MINUTES_MS,
    }),
}

export const sfiaAdminQueries = {
  all: () => queryKeys.sfiaAdmin.all,
  categories: () =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.categories(),
      queryFn: ({ signal }) => sfiaAdminService.getCategories(signal),
      staleTime: FIVE_MINUTES_MS,
    }),
  subcategories: (categoryCode?: string) =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.subcategories(categoryCode),
      queryFn: ({ signal }) =>
        sfiaAdminService.getSubcategories(categoryCode, signal),
      staleTime: FIVE_MINUTES_MS,
    }),
  skills: (filters?: SfiaSkillFilters) =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.skills(filters),
      queryFn: ({ signal }) => sfiaAdminService.getSkills(filters, signal),
    }),
  skillDetail: (skillCode: string) =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.skillDetail(skillCode),
      queryFn: ({ signal }) =>
        sfiaAdminService.getSkillDetail(skillCode, signal),
    }),
  levels: () =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.levels(),
      queryFn: ({ signal }) => sfiaAdminService.getResponsibilityLevels(signal),
      staleTime: FIVE_MINUTES_MS,
    }),
  attributes: () =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.attributes(),
      queryFn: ({ signal }) => sfiaAdminService.getGenericAttributes(signal),
      staleTime: FIVE_MINUTES_MS,
    }),
  matrix: (categoryCode?: string) =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.matrix(categoryCode),
      queryFn: ({ signal }) =>
        sfiaAdminService.getMatrixData(categoryCode, signal),
    }),
  coverage: () =>
    queryOptions({
      queryKey: queryKeys.sfiaAdmin.coverage(),
      queryFn: ({ signal }) => sfiaAdminService.getCoverageStats(signal),
    }),
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
