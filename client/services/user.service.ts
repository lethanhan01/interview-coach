import { apiClient } from '@/lib/api-client'
import type { UpdateUserAccountPayload, UserAccountResponse } from '@/types'

export const userService = {
  /**
   * Fetch current authenticated user's account details
   */
  async getCurrentUser(signal?: AbortSignal): Promise<UserAccountResponse> {
    return apiClient.get<UserAccountResponse>('/users/me', { signal })
  },

  /**
   * Update current user's account details (e.g. firstname, lastname)
   */
  async updateCurrentUser(
    patch: UpdateUserAccountPayload
  ): Promise<UserAccountResponse> {
    return apiClient.patch<UserAccountResponse>('/users/me', patch)
  },
}
