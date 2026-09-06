import { apiClient } from '@/lib/api-client'

export interface OnetOccupation {
  socCode: string
  title: string
  description: string
  matchedTitle?: string
  similarityScore?: number
}

export interface OnetTech {
  example: string
  isHotTechnology: boolean
  inDemand: boolean
}

export const onetService = {
  /**
   * Tìm kiếm chức danh O*NET theo từ khóa hoặc lấy danh sách chức danh IT phổ biến
   */
  async searchOccupations(query?: string, limit = 10): Promise<OnetOccupation[]> {
    const params = new URLSearchParams()
    if (query && query.trim()) {
      params.append('query', query.trim())
    }
    if (limit) {
      params.append('limit', String(limit))
    }
    const queryString = params.toString()
    const path = `/onet/occupations${queryString ? `?${queryString}` : ''}`
    return apiClient.get<OnetOccupation[]>(path)
  },

  /**
   * Lấy danh sách công cụ và công nghệ phần mềm gắn với mã SOC
   */
  async getOccupationTech(socCode: string): Promise<OnetTech[]> {
    return apiClient.get<OnetTech[]>(
      `/onet/occupations/${encodeURIComponent(socCode.trim())}/tech`
    )
  },
}
