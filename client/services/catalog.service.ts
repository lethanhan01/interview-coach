import { apiClient } from '@/lib/api-client'
import type { InterviewOptionsCatalog } from '@/types'

export const catalogService = {
  /**
   * Lấy toàn bộ danh mục cấu hình phỏng vấn / hồ sơ (nguồn sự thật duy nhất từ Backend)
   */
  async getInterviewOptions(
    signal?: AbortSignal
  ): Promise<InterviewOptionsCatalog> {
    return apiClient.get<InterviewOptionsCatalog>(
      '/catalog/interview-options',
      {
        signal,
      }
    )
  },
}
