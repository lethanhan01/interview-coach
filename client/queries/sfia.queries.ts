import { queryOptions } from '@tanstack/react-query'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type { SfiaSkillFilters } from '@/types'
import { queryKeys } from './keys'
import { FIVE_MINUTES_MS } from './query-client'

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
