import { apiClient } from '@/lib/api-client'
import type { GetProfileResponse } from '@/lib/types'

export const candidateProfileService = {
  /**
   * Fetch current candidate's profile (career targets, education, skills, experience, etc.)
   */
  async getProfile(): Promise<GetProfileResponse> {
    return apiClient.get<GetProfileResponse>('/candidate-profile')
  },

  /**
   * Partially update current candidate's profile fields
   */
  async updateProfile<T extends object>(patch: T): Promise<GetProfileResponse> {
    return apiClient.patch<GetProfileResponse>('/candidate-profile', patch)
  },
}
