import type {
  OnetOccupationSearchFilters,
  OnetTopOccupationsQuery,
  SfiaSkillFilters,
} from '@/types'

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
