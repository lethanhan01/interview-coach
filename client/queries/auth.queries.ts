import { queryOptions } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { queryKeys } from './keys'

export const authQueries = {
  all: () => queryKeys.auth.all,
  me: () =>
    queryOptions({
      queryKey: queryKeys.auth.me(),
      queryFn: ({ signal }) => authService.getMe(signal),
    }),
}
