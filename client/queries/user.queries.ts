import { queryOptions } from '@tanstack/react-query'
import { userManagementService } from '@/services/admin.service'
import { userService } from '@/services/user.service'
import { queryKeys } from './keys'

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
