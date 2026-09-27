import { apiClient } from '@/lib/api-client'
import type {
  SfiaCategory,
  SfiaSubcategory,
  SfiaSkillSummary,
  SfiaSkillDetail,
  SfiaLevelResponsibility,
  SfiaGenericAttribute,
  SfiaCoverageStats,
  SfiaMatrixCellData,
  SfiaQuestionBankItem,
} from '@/components/sfia/types'
import {
  MOCK_SFIA_CATEGORIES,
  MOCK_SFIA_SUBCATEGORIES,
  MOCK_SFIA_RESPONSIBILITY_LEVELS,
  MOCK_SFIA_GENERIC_ATTRIBUTES,
  MOCK_SFIA_SKILL_SUMMARIES,
  MOCK_SFIA_SKILL_DETAILS,
  MOCK_SFIA_COVERAGE_STATS,
} from '@/components/sfia/sfia-mock-data'

/**
 * Cờ điều khiển nguồn dữ liệu:
 * - true (Phase 1 ➔ Phase 7): Sử dụng Client Mock Data Factory
 * - false (Phase 8 ➔ Phase 9): Sử dụng NestJS Backend API thật
 */
const USE_MOCK = true

// In-Memory Session Mock Caches (Bảo đảm tính nhất quán state trong phiên làm việc)
let mockSkillSummariesCache: SfiaSkillSummary[] = [...MOCK_SFIA_SKILL_SUMMARIES]
let mockSkillDetailsCache: Record<string, SfiaSkillDetail> = { ...MOCK_SFIA_SKILL_DETAILS }

export interface SfiaSkillFilters {
  categoryCode?: string
  subcategoryCode?: string
  level?: number
  query?: string
}

export interface SfiaMatrixDataResponse {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  cells: Record<string, SfiaMatrixCellData>
}

export const sfiaAdminService = {
  /**
   * Lấy danh sách 6 danh mục lớn SFIA 9
   */
  async getCategories(): Promise<SfiaCategory[]> {
    if (USE_MOCK) {
      return Promise.resolve(MOCK_SFIA_CATEGORIES)
    }
    return apiClient.get<SfiaCategory[]>('/admin/sfia/categories')
  },

  /**
   * Lấy danh sách 22 phân nhóm chuyên môn
   */
  async getSubcategories(categoryCode?: string): Promise<SfiaSubcategory[]> {
    if (USE_MOCK) {
      if (categoryCode) {
        return Promise.resolve(
          MOCK_SFIA_SUBCATEGORIES.filter((sub) => sub.categoryCode === categoryCode)
        )
      }
      return Promise.resolve(MOCK_SFIA_SUBCATEGORIES)
    }
    const query = categoryCode ? `?categoryCode=${encodeURIComponent(categoryCode)}` : ''
    return apiClient.get<SfiaSubcategory[]>(`/admin/sfia/subcategories${query}`)
  },

  /**
   * Lấy danh sách kỹ năng SFIA có hỗ trợ bộ lọc
   */
  async getSkills(filters?: SfiaSkillFilters): Promise<SfiaSkillSummary[]> {
    if (USE_MOCK) {
      let result = [...mockSkillSummariesCache]

      if (filters?.categoryCode) {
        result = result.filter((s) => s.categoryCode === filters.categoryCode)
      }
      if (filters?.subcategoryCode) {
        result = result.filter((s) => s.subcategoryCode === filters.subcategoryCode)
      }
      if (filters?.level) {
        const lvl = filters.level
        result = result.filter((s) => s.minLevel <= lvl && lvl <= s.maxLevel)
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase().trim()
        result = result.filter(
          (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
      }

      return Promise.resolve(result)
    }

    const params = new URLSearchParams()
    if (filters?.categoryCode) params.set('categoryCode', filters.categoryCode)
    if (filters?.subcategoryCode) params.set('subcategoryCode', filters.subcategoryCode)
    if (filters?.level) params.set('level', String(filters.level))
    if (filters?.query) params.set('query', filters.query)

    const queryStr = params.toString()
    return apiClient.get<SfiaSkillSummary[]>(`/admin/sfia/skills${queryStr ? `?${queryStr}` : ''}`)
  },

  /**
   * Lấy chi tiết một kỹ năng theo mã code 4 chữ cái (PROG, SWDN,...)
   */
  async getSkillDetail(skillCode: string): Promise<SfiaSkillDetail | null> {
    if (USE_MOCK) {
      const code = skillCode.toUpperCase()
      if (mockSkillDetailsCache[code]) {
        return Promise.resolve(mockSkillDetailsCache[code])
      }

      // Fallback nếu kỹ năng có trong tóm tắt nhưng chưa có chi tiết phong phú
      const summary = mockSkillSummariesCache.find((s) => s.code === code)
      if (summary) {
        const generatedLevels = []
        for (let l = summary.minLevel; l <= summary.maxLevel; l++) {
          generatedLevels.push({
            skillCode: summary.code,
            levelId: l,
            essence: `Thực thi năng lực ${summary.name} ở Cấp độ ${l}.`,
            description: `Mô tả tiêu chuẩn hành vi chuẩn SFIA 9 cho kỹ năng ${summary.name} (${summary.code}) tại Cấp độ ${l}.`,
          })
        }

        const generatedDetail: SfiaSkillDetail = {
          ...summary,
          overallDescription: `Mô tả tổng quan về kỹ năng ${summary.name} theo khung năng lực SFIA 9.`,
          guidanceNotes: `Các lưu ý hướng dẫn áp dụng cho kỹ năng ${summary.name} trong thực tế phỏng vấn và đánh giá năng lực.`,
          skillLevels: generatedLevels,
          onetMappings: [],
          questionBankItems: [],
        }

        mockSkillDetailsCache[code] = generatedDetail
        return Promise.resolve(generatedDetail)
      }

      return Promise.resolve(null)
    }

    return apiClient.get<SfiaSkillDetail>(`/admin/sfia/skills/${encodeURIComponent(skillCode)}`)
  },

  /**
   * Thêm câu hỏi phỏng vấn mới vào kho dữ liệu (hỗ trợ in-memory mock store trong Phase 4)
   */
  async addMockQuestion(
    skillCode: string,
    newQuestion: Omit<SfiaQuestionBankItem, 'id'>
  ): Promise<SfiaQuestionBankItem> {
    const code = skillCode.toUpperCase()
    const id = `Q-${code}-${Math.floor(1000 + Math.random() * 9000)}`
    const createdItem: SfiaQuestionBankItem = {
      id,
      ...newQuestion,
    }

    if (USE_MOCK) {
      // 1. Cập nhật chi tiết kỹ năng trong cache
      const detail = await this.getSkillDetail(code)
      if (detail) {
        detail.questionBankItems = [createdItem, ...(detail.questionBankItems || [])]
        detail.questionCount += 1
        mockSkillDetailsCache[code] = { ...detail }
      }

      // 2. Đồng bộ questionCount trong danh sách tóm tắt
      const summary = mockSkillSummariesCache.find((s) => s.code === code)
      if (summary) {
        summary.questionCount += 1
      }

      return Promise.resolve(createdItem)
    }

    // Backend endpoint khi sang Phase 8
    return apiClient.post<SfiaQuestionBankItem>(
      `/admin/sfia/skills/${encodeURIComponent(code)}/questions`,
      newQuestion
    )
  },

  /**
   * Lấy danh sách 7 Cấp độ trách nhiệm
   */
  async getResponsibilityLevels(): Promise<SfiaLevelResponsibility[]> {
    if (USE_MOCK) {
      return Promise.resolve(MOCK_SFIA_RESPONSIBILITY_LEVELS)
    }
    return apiClient.get<SfiaLevelResponsibility[]>('/admin/sfia/levels')
  },

  /**
   * Lấy danh sách 5 Thuộc tính năng lực nền tảng
   */
  async getGenericAttributes(): Promise<SfiaGenericAttribute[]> {
    if (USE_MOCK) {
      return Promise.resolve(MOCK_SFIA_GENERIC_ATTRIBUTES)
    }
    return apiClient.get<SfiaGenericAttribute[]>('/admin/sfia/generic-attributes')
  },

  /**
   * Lấy dữ liệu toàn bộ ma trận 2D SFIA 147 kỹ năng x 7 level
   */
  async getMatrixData(): Promise<SfiaMatrixDataResponse> {
    if (USE_MOCK) {
      const cells: Record<string, SfiaMatrixCellData> = {}

      for (const skill of MOCK_SFIA_SKILL_SUMMARIES) {
        for (let lvl = 1; lvl <= 7; lvl++) {
          const key = `${skill.code}_L${lvl}`
          const isAvailable = lvl >= skill.minLevel && lvl <= skill.maxLevel
          cells[key] = {
            skillCode: skill.code,
            levelId: lvl,
            isAvailable,
            questionCount: isAvailable ? Math.floor((skill.questionCount / (skill.maxLevel - skill.minLevel + 1))) : 0,
            onetCount: isAvailable ? Math.floor((skill.onetCount / 2)) : 0,
            statementSnippet: isAvailable ? `Mô tả năng lực ${skill.code} tại Level ${lvl}` : undefined,
          }
        }
      }

      return Promise.resolve({
        skills: MOCK_SFIA_SKILL_SUMMARIES,
        categories: MOCK_SFIA_CATEGORIES,
        cells,
      })
    }

    return apiClient.get<SfiaMatrixDataResponse>('/admin/sfia/matrix')
  },

  /**
   * Lấy số liệu thống kê độ phủ và điểm mù
   */
  async getCoverageStats(): Promise<SfiaCoverageStats> {
    if (USE_MOCK) {
      return Promise.resolve(MOCK_SFIA_COVERAGE_STATS)
    }
    return apiClient.get<SfiaCoverageStats>('/admin/sfia/analytics/coverage')
  },
}
