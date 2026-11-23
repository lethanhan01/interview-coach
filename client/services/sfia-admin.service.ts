import { apiClient } from '@/lib/api-client'
import type {
  CreateSfiaQuestionPayload,
  SfiaCategory,
  SfiaCoverageStats,
  SfiaGenericAttribute,
  SfiaLevelResponsibility,
  SfiaMatrixDataResponse,
  SfiaQuestionBankItem,
  SfiaSkillDetail,
  SfiaSkillFilters,
  SfiaSkillSummary,
  SfiaSubcategory,
} from '@/types'

/**
 * SfiaAdminService — 100% Live Backend API Service for SFIA 9 Knowledge Base
 * Base endpoints: /admin/sfia/* on NestJS Backend (:3000/api/v1)
 */
export const sfiaAdminService = {
  /**
   * 1. GET /admin/sfia/categories
   * Lấy danh sách 6 danh mục lớn SFIA 9
   */
  async getCategories(): Promise<SfiaCategory[]> {
    return apiClient.get<SfiaCategory[]>('/admin/sfia/categories')
  },

  /**
   * 2. GET /admin/sfia/subcategories
   * Lấy danh sách 22 phân nhóm chuyên môn
   */
  async getSubcategories(categoryCode?: string): Promise<SfiaSubcategory[]> {
    const query = categoryCode
      ? `?categoryCode=${encodeURIComponent(categoryCode)}`
      : ''
    return apiClient.get<SfiaSubcategory[]>(`/admin/sfia/subcategories${query}`)
  },

  /**
   * 3. GET /admin/sfia/skills
   * Lấy danh sách kỹ năng SFIA có hỗ trợ bộ lọc
   */
  async getSkills(filters?: SfiaSkillFilters): Promise<SfiaSkillSummary[]> {
    const params = new URLSearchParams()
    if (filters?.categoryCode) params.set('categoryCode', filters.categoryCode)
    if (filters?.subcategoryCode)
      params.set('subcategoryCode', filters.subcategoryCode)
    if (filters?.level) params.set('level', String(filters.level))
    if (filters?.query) params.set('query', filters.query)

    const queryStr = params.toString()
    return apiClient.get<SfiaSkillSummary[]>(
      `/admin/sfia/skills${queryStr ? `?${queryStr}` : ''}`
    )
  },

  /**
   * 4. GET /admin/sfia/skills/:code
   * Lấy chi tiết kỹ năng (level statements, O*NET mappings, question bank)
   */
  async getSkillDetail(skillCode: string): Promise<SfiaSkillDetail | null> {
    try {
      return await apiClient.get<SfiaSkillDetail>(
        `/admin/sfia/skills/${encodeURIComponent(skillCode.toUpperCase())}`
      )
    } catch {
      return null
    }
  },

  /**
   * 5. POST /admin/sfia/skills/:code/questions
   * Tạo câu hỏi phỏng vấn mới gắn nhãn kỹ năng và level SFIA
   */
  async createQuestion(
    skillCode: string,
    payload: CreateSfiaQuestionPayload
  ): Promise<SfiaQuestionBankItem> {
    return apiClient.post<SfiaQuestionBankItem>(
      `/admin/sfia/skills/${encodeURIComponent(skillCode.toUpperCase())}/questions`,
      payload
    )
  },

  /**
   * 6. GET /admin/sfia/levels
   * Lấy danh sách 7 Cấp độ trách nhiệm chuẩn SFIA 9
   */
  async getResponsibilityLevels(): Promise<SfiaLevelResponsibility[]> {
    return apiClient.get<SfiaLevelResponsibility[]>('/admin/sfia/levels')
  },

  /**
   * 7. GET /admin/sfia/generic-attributes
   * Lấy danh sách 16 Thuộc tính năng lực nền tảng
   */
  async getGenericAttributes(): Promise<SfiaGenericAttribute[]> {
    return apiClient.get<SfiaGenericAttribute[]>(
      '/admin/sfia/generic-attributes'
    )
  },

  /**
   * 8. GET /admin/sfia/matrix
   * Lấy dữ liệu ma trận 2D SFIA 147 kỹ năng x 7 level
   */
  async getMatrixData(categoryCode?: string): Promise<SfiaMatrixDataResponse> {
    const query = categoryCode
      ? `?categoryCode=${encodeURIComponent(categoryCode)}`
      : ''
    return apiClient.get<SfiaMatrixDataResponse>(`/admin/sfia/matrix${query}`)
  },

  /**
   * 9. GET /admin/sfia/analytics/coverage
   * Lấy số liệu thống kê độ phủ câu hỏi và danh sách điểm mù
   */
  async getCoverageStats(): Promise<SfiaCoverageStats> {
    return apiClient.get<SfiaCoverageStats>('/admin/sfia/analytics/coverage')
  },
}
