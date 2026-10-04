import { apiClient } from '@/lib/api-client'
import type {
  OnetAnalyticsSummary,
  SocGroupDistributionItem,
  SocMajorGroup,
  OnetOccupationSummary,
  OnetOccupationDetail,
  PaginatedAlternateTitles,
  SfiaSkillCoverageItem,
  OnetTopOccupationItem,
  OnetSfiaMapping,
  SfiaSkillDefinition,
} from '@/components/onet/types'

// Backend Response DTO Shapes
interface RawSfiaMappingItem {
  id: string
  onetSocCode: string
  sfiaSkillCode: string
  skillName: string
  skillCategory?: string
  targetSfiaLevel: number
  defaultWeight: number | string
  isCore: boolean
  source: string
  minLevel: number
  maxLevel: number
  responsibility?: string
  createdAt?: string
}

interface RawSfiaLibrarySkill {
  code: string
  name: string
  category: string
  categoryCode?: string
  minLevel: number
  maxLevel: number
  description: string
  levels: Array<{ level: number; description: string }>
}

interface RawOccupationDetail extends Omit<OnetOccupationDetail, 'sfiaMappings'> {
  sfiaMappings: RawSfiaMappingItem[]
}

/**
 * Mapper: Chuyển đổi DTO Backend thành interface OnetSfiaMapping ở frontend
 */
function mapRawSfiaMapping(raw: RawSfiaMappingItem): OnetSfiaMapping {
  return {
    id: raw.id,
    skillCode: raw.sfiaSkillCode,
    skillName: raw.skillName || raw.sfiaSkillCode,
    category: raw.skillCategory || 'Software Engineering',
    targetLevel: raw.targetSfiaLevel,
    minLevel: raw.minLevel ?? 1,
    maxLevel: raw.maxLevel ?? 7,
    weight: typeof raw.defaultWeight === 'number' ? raw.defaultWeight : Number(raw.defaultWeight) || 1.0,
    isCore: Boolean(raw.isCore),
    source: (raw.source || 'USER_DEFINED') as OnetSfiaMapping['source'],
  }
}

/**
 * Mapper: Chuyển đổi SFIA Library DTO thành SfiaSkillDefinition ở frontend
 */
function mapRawSfiaLibrarySkill(raw: RawSfiaLibrarySkill): SfiaSkillDefinition {
  const levelDescriptions: Record<number, string> = {}
  if (Array.isArray(raw.levels)) {
    for (const lvl of raw.levels) {
      levelDescriptions[lvl.level] = lvl.description
    }
  }

  return {
    code: raw.code,
    name: raw.name,
    category: raw.category || 'Chung',
    description: raw.description || '',
    minLevel: raw.minLevel,
    maxLevel: raw.maxLevel,
    levelDescriptions,
  }
}

export const onetAdminService = {
  /**
   * 1. Lấy thông tin thống kê KPI vĩ mô cho Analytics Dashboard
   */
  async getAnalyticsSummary(): Promise<OnetAnalyticsSummary> {
    return apiClient.get<OnetAnalyticsSummary>('/onet/admin/analytics/summary')
  },

  /**
   * 2. Lấy phân bổ 23 nhóm nghề Major Groups SOC
   */
  async getMajorGroupsDistribution(): Promise<SocGroupDistributionItem[]> {
    return apiClient.get<SocGroupDistributionItem[]>('/onet/admin/analytics/major-groups')
  },

  /**
   * 3. Lấy danh sách 23 Major Groups ngắn gọn cho Master Sidebar
   */
  async getMajorGroups(): Promise<SocMajorGroup[]> {
    const list = await this.getMajorGroupsDistribution()
    return list.map((item) => ({
      code: item.code,
      name: item.name,
      englishName: item.englishName,
      totalOccupations: item.totalOccupations,
      mappedCount: item.mappedOccupations,
    }))
  },

  /**
   * 4. Tìm kiếm / Danh sách nghề cho Master Sidebar
   */
  async searchOccupations(query: {
    groupCode?: string
    mappedOnly?: boolean
    search?: string
    limit?: number
  } = {}): Promise<OnetOccupationSummary[]> {
    const params = new URLSearchParams()
    if (query.groupCode) params.append('groupCode', query.groupCode)
    if (query.mappedOnly) params.append('mappedOnly', 'true')
    if (query.search?.trim()) params.append('search', query.search.trim())
    if (query.limit) params.append('limit', String(query.limit))

    const qs = params.toString()
    return apiClient.get<OnetOccupationSummary[]>(`/onet/admin/occupations${qs ? `?${qs}` : ''}`)
  },

  /**
   * 5. Lấy danh sách Top nghề quan tâm nhất
   */
  async getTopOccupations(query: {
    limit?: number
    sortBy?: 'interviews' | 'jds' | 'mappings'
    search?: string
  } = {}): Promise<OnetTopOccupationItem[]> {
    const params = new URLSearchParams()
    if (query.limit) params.append('limit', String(query.limit))
    if (query.sortBy) params.append('sortBy', query.sortBy)
    if (query.search?.trim()) params.append('search', query.search.trim())

    const qs = params.toString()
    return apiClient.get<OnetTopOccupationItem[]>(`/onet/admin/analytics/top-occupations${qs ? `?${qs}` : ''}`)
  },

  /**
   * 6. Lấy phân bổ độ phủ kỹ năng SFIA
   */
  async getSfiaSkillCoverage(limit = 20, category?: string): Promise<SfiaSkillCoverageItem[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', String(limit))
    if (category?.trim()) params.append('category', category.trim())

    const qs = params.toString()
    return apiClient.get<SfiaSkillCoverageItem[]>(`/onet/admin/analytics/sfia-coverage${qs ? `?${qs}` : ''}`)
  },

  /**
   * 7. Lấy chi tiết một nghề nghiệp theo mã SOC
   */
  async getOccupationDetail(socCode: string): Promise<OnetOccupationDetail> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const res = await apiClient.get<RawOccupationDetail>(`/onet/admin/occupations/${cleanSoc}`)
    return {
      ...res,
      sfiaMappings: (res.sfiaMappings || []).map(mapRawSfiaMapping),
    }
  },

  /**
   * 8. Lấy danh sách chức danh thị trường (Alternate Job Titles) có phân trang
   */
  async getAlternateTitles(
    socCode: string,
    query: {
      page?: number
      limit?: number
      search?: string
    } = {}
  ): Promise<PaginatedAlternateTitles> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const params = new URLSearchParams()
    if (query.page) params.append('page', String(query.page))
    if (query.limit) params.append('limit', String(query.limit))
    if (query.search?.trim()) params.append('search', query.search.trim())

    const qs = params.toString()
    return apiClient.get<PaginatedAlternateTitles>(
      `/onet/admin/occupations/${cleanSoc}/alternate-titles${qs ? `?${qs}` : ''}`
    )
  },

  /**
   * 9. Lấy danh sách ánh xạ kỹ năng SFIA của một nghề
   */
  async getOccupationSfiaMappings(socCode: string): Promise<OnetSfiaMapping[]> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const rawList = await apiClient.get<RawSfiaMappingItem[]>(
      `/onet/admin/occupations/${cleanSoc}/sfia-mappings`
    )
    return rawList.map(mapRawSfiaMapping)
  },

  /**
   * 10. Thêm mới ánh xạ SFIA cho một nghề
   */
  async createSfiaMapping(
    socCode: string,
    data: {
      skillCode: string
      targetLevel: number
      weight?: number
      isCore?: boolean
      source?: string
    }
  ): Promise<OnetSfiaMapping> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const payload = {
      sfiaSkillCode: data.skillCode,
      targetSfiaLevel: data.targetLevel,
      defaultWeight: data.weight ?? 1.0,
      isCore: data.isCore ?? true,
      source: data.source || 'USER_DEFINED',
    }
    const raw = await apiClient.post<RawSfiaMappingItem>(
      `/onet/admin/occupations/${cleanSoc}/sfia-mappings`,
      payload
    )
    return mapRawSfiaMapping(raw)
  },

  /**
   * 11. Chỉnh sửa ánh xạ SFIA (Level, Weight, isCore)
   */
  async updateSfiaMapping(
    socCode: string,
    mappingId: string,
    data: {
      targetLevel?: number
      weight?: number
      isCore?: boolean
      source?: string
    }
  ): Promise<OnetSfiaMapping> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const cleanMappingId = encodeURIComponent(mappingId.trim())
    const payload = {
      targetSfiaLevel: data.targetLevel,
      defaultWeight: data.weight,
      isCore: data.isCore,
      source: data.source,
    }
    const raw = await apiClient.patch<RawSfiaMappingItem>(
      `/onet/admin/occupations/${cleanSoc}/sfia-mappings/${cleanMappingId}`,
      payload
    )
    return mapRawSfiaMapping(raw)
  },

  /**
   * 12. Xóa ánh xạ SFIA
   */
  async deleteSfiaMapping(
    socCode: string,
    mappingId: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const cleanMappingId = encodeURIComponent(mappingId.trim())
    return apiClient.delete<{ success: boolean; message: string }>(
      `/onet/admin/occupations/${cleanSoc}/sfia-mappings/${cleanMappingId}`
    )
  },

  /**
   * 13. Khôi phục ánh xạ SFIA về mặc định
   */
  async resetSfiaMappings(socCode: string): Promise<OnetSfiaMapping[]> {
    const cleanSoc = encodeURIComponent(socCode.trim())
    const rawList = await apiClient.post<RawSfiaMappingItem[]>(
      `/onet/admin/occupations/${cleanSoc}/sfia-mappings/reset`
    )
    return rawList.map(mapRawSfiaMapping)
  },

  /**
   * 14. Lấy toàn bộ thư viện kỹ năng SFIA 9 cho Combobox gợi ý
   */
  async getSfiaLibrary(): Promise<SfiaSkillDefinition[]> {
    const rawList = await apiClient.get<RawSfiaLibrarySkill[]>('/onet/admin/sfia-library')
    return rawList.map(mapRawSfiaLibrarySkill)
  },
}
