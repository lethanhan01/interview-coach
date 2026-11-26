import { queryOptions } from '@tanstack/react-query'
import { rubricService } from '@/services/rubric.service'
import type { ContextPack, SessionType } from '@/types'
import { queryKeys } from './keys'
import { FIVE_MINUTES_MS } from './query-client'

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
