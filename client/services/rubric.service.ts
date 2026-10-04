import { apiClient } from '@/lib/api-client'
import type { ContextPack, RubricConfig, SessionType } from '@/lib/types'

export const rubricService = {
  /**
   * Lấy cấu hình tiêu chí chấm điểm (rubric) đang áp dụng theo context pack và loại phỏng vấn
   */
  async getActiveRubric(
    contextPackId: ContextPack,
    sessionType: SessionType = 'technical'
  ): Promise<RubricConfig> {
    return apiClient.get<RubricConfig>(
      `/rubrics/${contextPackId}?sessionType=${sessionType}`
    )
  },
}
