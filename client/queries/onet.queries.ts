import { queryOptions } from '@tanstack/react-query'
import { onetAdminService } from '@/services/onet-admin.service'
import { onetService } from '@/services/onet.service'
import type {
  OnetAlternateTitlesQuery,
  OnetOccupationSearchFilters,
  OnetTopOccupationsQuery,
} from '@/types'
import { queryKeys } from './keys'
import { FIVE_MINUTES_MS } from './query-client'

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
  technologies: (query?: string, limit = 30) =>
    queryOptions({
      queryKey: queryKeys.onet.technologies(query, limit),
      queryFn: ({ signal }) =>
        onetService.searchTechnologies(query, limit, signal),
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
