import { apiClient } from '@/lib/api-client'
import type { GetProfileResponse } from '@/types'

export const candidateProfileService = {
  /**
   * Fetch current candidate's profile (career targets, education, skills, experience, etc.)
   */
  async getProfile(signal?: AbortSignal): Promise<GetProfileResponse> {
    return apiClient.get<GetProfileResponse>('/candidate-profile', { signal })
  },

  /**
   * Partially update current candidate's profile fields
   */
  async updateProfile<T extends object>(patch: T): Promise<GetProfileResponse> {
    return apiClient.patch<GetProfileResponse>('/candidate-profile', patch)
  },
}
