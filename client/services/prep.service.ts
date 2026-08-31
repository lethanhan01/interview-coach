import { apiClient } from '@/lib/api-client'
import type { SavedJobDescription, SaveJobDescriptionPayload } from '@/lib/types'

export const prepService = {
  /**
   * Lấy danh sách các Job Description đã lưu của người dùng
   */
  async getSavedJobDescriptions(): Promise<SavedJobDescription[]> {
    const res = await apiClient.get<{ items: SavedJobDescription[] }>(
      '/saved-job-descriptions'
    )
    return res.items ?? []
  },

  /**
   * Lưu mới một Job Description
   */
  async saveJobDescription(
    payload: SaveJobDescriptionPayload
  ): Promise<SavedJobDescription> {
    return apiClient.post<SavedJobDescription>(
      '/saved-job-descriptions',
      payload
    )
  },
}
