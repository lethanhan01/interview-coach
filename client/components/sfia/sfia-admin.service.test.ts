import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import { apiClient } from '@/lib/api-client'

describe('sfiaAdminService (Live Backend API Integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls GET /admin/sfia/categories correctly', async () => {
    const mockCategories = [
      {
        code: 'DEV_IMPL',
        name: 'Development and implementation',
        nameVi: 'Development and implementation',
        description: 'Software development',
        displayOrder: 3,
        skillCount: 30,
      },
    ]
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockCategories)

    const result = await sfiaAdminService.getCategories()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/categories')
    expect(result).toEqual(mockCategories)
  })

  it('calls GET /admin/sfia/subcategories with optional category filter', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue([])
    await sfiaAdminService.getSubcategories('DEV_IMPL')
    expect(spy).toHaveBeenCalledWith('/admin/sfia/subcategories?categoryCode=DEV_IMPL')

    await sfiaAdminService.getSubcategories()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/subcategories')
  })

  it('calls GET /admin/sfia/skills with serialized query parameters', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue([])
    await sfiaAdminService.getSkills({
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      level: 3,
      query: 'prog',
    })
    expect(spy).toHaveBeenCalledWith(
      '/admin/sfia/skills?categoryCode=DEV_IMPL&subcategoryCode=SYS_DEV&level=3&query=prog'
    )

    await sfiaAdminService.getSkills()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/skills')
  })

  it('calls GET /admin/sfia/skills/:code with upper-cased encoded skill code', async () => {
    const mockDetail = {
      code: 'PROG',
      name: 'Programming/software development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      minLevel: 2,
      maxLevel: 6,
      questionCount: 10,
      onetCount: 4,
      overallDescription: 'Programming desc',
      skillLevels: [],
      onetMappings: [],
      questionBankItems: [],
    }
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockDetail)

    const result = await sfiaAdminService.getSkillDetail('prog')
    expect(spy).toHaveBeenCalledWith('/admin/sfia/skills/PROG')
    expect(result).toEqual(mockDetail)
  })

  it('returns null when GET /admin/sfia/skills/:code fails with 404', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Not found'))
    const result = await sfiaAdminService.getSkillDetail('NON_EXISTENT')
    expect(result).toBeNull()
  })

  it('calls POST /admin/sfia/skills/:code/questions with payload', async () => {
    const mockCreated = {
      id: 'Q-PROG-1234',
      questionText: 'Explain event driven architecture',
      type: 'TECHNICAL' as const,
      difficulty: 'HARD' as const,
      targetSfiaLevel: 4,
    }
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockCreated)

    const payload = {
      questionText: 'Explain event driven architecture',
      type: 'TECHNICAL' as const,
      difficulty: 'HARD' as const,
      targetSfiaLevel: 4,
    }
    const result = await sfiaAdminService.createQuestion('prog', payload)

    expect(spy).toHaveBeenCalledWith('/admin/sfia/skills/PROG/questions', payload)
    expect(result).toEqual(mockCreated)
  })

  it('addMockQuestion calls createQuestion as alias', async () => {
    const mockCreated = {
      id: 'Q-PROG-5678',
      questionText: 'Explain microservices',
      type: 'TECHNICAL' as const,
      difficulty: 'MEDIUM' as const,
      targetSfiaLevel: 3,
    }
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockCreated)

    const payload = {
      questionText: 'Explain microservices',
      type: 'TECHNICAL' as const,
      difficulty: 'MEDIUM' as const,
      targetSfiaLevel: 3,
    }
    const result = await sfiaAdminService.addMockQuestion('PROG', payload)
    expect(spy).toHaveBeenCalledWith('/admin/sfia/skills/PROG/questions', payload)
    expect(result).toEqual(mockCreated)
  })

  it('calls GET /admin/sfia/levels correctly', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue([])
    await sfiaAdminService.getResponsibilityLevels()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/levels')
  })

  it('calls GET /admin/sfia/generic-attributes correctly', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue([])
    await sfiaAdminService.getGenericAttributes()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/generic-attributes')
  })

  it('calls GET /admin/sfia/matrix with optional category filter', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      skills: [],
      categories: [],
      cells: {},
    })
    await sfiaAdminService.getMatrixData('DEV_IMPL')
    expect(spy).toHaveBeenCalledWith('/admin/sfia/matrix?categoryCode=DEV_IMPL')

    await sfiaAdminService.getMatrixData()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/matrix')
  })

  it('calls GET /admin/sfia/analytics/coverage correctly', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      totalSkills: 147,
    })
    await sfiaAdminService.getCoverageStats()
    expect(spy).toHaveBeenCalledWith('/admin/sfia/analytics/coverage')
  })
})
