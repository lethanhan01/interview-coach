import { describe, it, expect, vi } from 'vitest'
import {
  generateSfiaMatrixCsvString,
  downloadSfiaMatrixCsv,
} from './sfia-matrix-export'
import type { SfiaCategory, SfiaSkillSummary, SfiaMatrixCellData } from './types'

describe('sfia-matrix-export utility', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả',
      displayOrder: 1,
      skillCount: 1,
    },
  ]

  const mockSkills: SfiaSkillSummary[] = [
    {
      code: 'PROG',
      name: 'Programming/software development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      minLevel: 2,
      maxLevel: 6,
      questionCount: 10,
      onetCount: 4,
    },
  ]

  const mockCells: Record<string, SfiaMatrixCellData> = {
    PROG_L1: { skillCode: 'PROG', levelId: 1, isAvailable: false, questionCount: 0, onetCount: 0 },
    PROG_L2: { skillCode: 'PROG', levelId: 2, isAvailable: true, questionCount: 2, onetCount: 1 },
    PROG_L3: { skillCode: 'PROG', levelId: 3, isAvailable: true, questionCount: 3, onetCount: 2 },
    PROG_L4: { skillCode: 'PROG', levelId: 4, isAvailable: true, questionCount: 3, onetCount: 1 },
    PROG_L5: { skillCode: 'PROG', levelId: 5, isAvailable: true, questionCount: 1, onetCount: 0 },
    PROG_L6: { skillCode: 'PROG', levelId: 6, isAvailable: true, questionCount: 1, onetCount: 0 },
    PROG_L7: { skillCode: 'PROG', levelId: 7, isAvailable: false, questionCount: 0, onetCount: 0 },
  }

  it('generates CSV string starting with UTF-8 BOM', () => {
    const csv = generateSfiaMatrixCsvString(mockSkills, mockCategories, mockCells)
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })

  it('contains header row and formatted skill data', () => {
    const csv = generateSfiaMatrixCsvString(mockSkills, mockCategories, mockCells)
    expect(csv).toContain('Skill Code')
    expect(csv).toContain('PROG')
    expect(csv).toContain('Programming/software development')
    expect(csv).toContain('Development and implementation')
    // Level 1 is inactive
    expect(csv).toContain('—')
    // Level 2 is active with question count
    expect(csv).toContain('Available (2 Qs, 1 O*NET)')
  })

  it('downloads file via browser document DOM in client environment', () => {
    // Mock URL and document methods
    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-uuid')
    window.URL.revokeObjectURL = vi.fn()

    const result = downloadSfiaMatrixCsv(mockSkills, mockCategories, mockCells, 'test.csv')
    expect(result).toBe(true)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
  })
})
