import { queryOptions } from '@tanstack/react-query'
import { catalogService } from '@/services/catalog.service'
import { queryKeys } from './keys'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const catalogQueries = {
  all: () => queryKeys.catalog.all,
  interviewOptions: () =>
    queryOptions({
      queryKey: queryKeys.catalog.interviewOptions(),
      queryFn: ({ signal }) => catalogService.getInterviewOptions(signal),
      staleTime: ONE_DAY_MS,
      gcTime: ONE_DAY_MS,
    }),
}
