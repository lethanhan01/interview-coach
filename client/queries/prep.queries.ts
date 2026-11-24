import { queryOptions } from '@tanstack/react-query'
import { prepService } from '@/services/prep.service'
import { queryKeys } from './keys'

export const prepQueries = {
  all: () => queryKeys.prep.all,
  savedJds: () =>
    queryOptions({
      queryKey: queryKeys.prep.savedJds(),
      queryFn: ({ signal }) => prepService.getSavedJobDescriptions(signal),
    }),
}
