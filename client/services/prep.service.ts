import { apiClient } from '@/lib/api-client'
import type {
  SavedJobDescription,
  SavedJobDescriptionsResponse,
  SaveJobDescriptionPayload,
} from '@/types'

export const prepService = {
  /**
   * Lấy danh sách các Job Description đã lưu của người dùng
   */
  async getSavedJobDescriptions(
    signal?: AbortSignal
  ): Promise<SavedJobDescription[]> {
    const res = await apiClient.get<SavedJobDescriptionsResponse>(
      '/saved-job-descriptions',
      { signal }
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
