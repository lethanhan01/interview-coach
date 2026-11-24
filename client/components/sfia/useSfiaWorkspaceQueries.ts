'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import type { SfiaMainTab } from '@/types'

export function toSfiaErrorMessage(
  error: unknown,
  fallback: string
): string | null {
  if (!error) return null
  return error instanceof Error ? error.message : fallback
}

export function useSfiaWorkspaceQueries(
  activeTab: SfiaMainTab,
  selectedSkill: string
) {
  const categoriesQuery = useQuery(sfiaAdminQueries.categories())
  const skillsQuery = useQuery(sfiaAdminQueries.skills())
  const levelsQuery = useQuery(sfiaAdminQueries.levels())

  const subcategoriesQuery = useQuery({
    ...sfiaAdminQueries.subcategories(),
    enabled: activeTab === 'taxonomy',
  })
  const coverageQuery = useQuery({
    ...sfiaAdminQueries.coverage(),
    enabled: activeTab === 'taxonomy' || activeTab === 'analytics',
  })
  const matrixQuery = useQuery({
    ...sfiaAdminQueries.matrix(),
    enabled: activeTab === 'matrix',
  })
  const attributesQuery = useQuery({
    ...sfiaAdminQueries.attributes(),
    enabled: activeTab === 'attributes',
  })
  const skillDetailQuery = useQuery({
    ...sfiaAdminQueries.skillDetail(selectedSkill),
    enabled: activeTab === 'taxonomy' && Boolean(selectedSkill),
  })

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  )
  const skills = useMemo(() => skillsQuery.data ?? [], [skillsQuery.data])
  const levels = useMemo(() => levelsQuery.data ?? [], [levelsQuery.data])

  const isCoreLoading =
    (categoriesQuery.isPending && !categoriesQuery.data) ||
    (skillsQuery.isPending && !skillsQuery.data)

  const coreError = toSfiaErrorMessage(
    categoriesQuery.error ?? skillsQuery.error,
    'Không thể tải dữ liệu nền tảng Khung Năng Lực SFIA 9.'
  )

  return {
    categories,
    skills,
    levels,
    isCoreLoading,
    coreError,
    refetchCore: () => {
      void categoriesQuery.refetch()
      void skillsQuery.refetch()
      void levelsQuery.refetch()
    },
    subcategoriesQuery,
    coverageQuery,
    matrixQuery,
    attributesQuery,
    levelsQuery,
    skillDetailQuery,
  }
}
