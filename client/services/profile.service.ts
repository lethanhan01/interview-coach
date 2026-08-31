import { apiClient } from '@/lib/api-client'
import type { GetProfileResponse } from '@/lib/types'

export const profileService = {
  /**
   * Lấy toàn bộ thông tin hồ sơ và tài khoản của người dùng hiện tại
   */
  async getProfile(): Promise<GetProfileResponse> {
    return apiClient.get<GetProfileResponse>('/profile')
  },

  /**
   * Cập nhật thông tin tài khoản hoặc hồ sơ CV của người dùng
   */
  async updateProfile<T extends object>(patch: T): Promise<GetProfileResponse> {
    return apiClient.patch<GetProfileResponse>('/profile', patch)
  },
}
