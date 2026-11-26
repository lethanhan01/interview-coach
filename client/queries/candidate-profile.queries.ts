import { queryOptions } from '@tanstack/react-query'
import { candidateProfileService } from '@/services/candidate-profile.service'
import { queryKeys } from './keys'

export const candidateProfileQueries = {
  all: () => queryKeys.candidateProfile.all,
  detail: () =>
    queryOptions({
      queryKey: queryKeys.candidateProfile.detail(),
      queryFn: ({ signal }) => candidateProfileService.getProfile(signal),
    }),
}
