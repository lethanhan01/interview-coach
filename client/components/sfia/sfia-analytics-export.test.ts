import { describe, it, expect, vi } from 'vitest'
import {
  getBlindSpotPriority,
  generateSfiaBlindSpotsCsvString,
  downloadSfiaBlindSpotsCsv,
} from './sfia-analytics-export'
import type { SfiaCategory, SfiaSkillSummary } from './types'

describe('sfia-analytics-export utility', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả danh mục',
      displayOrder: 1,
      skillCount: 1,
    },
    {
      code: 'STRAT_ARCH',
      name: 'Strategy and architecture',
      nameVi: 'Chiến lược & Kiến trúc',
      description: 'Mô tả danh mục',
      displayOrder: 2,
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
      questionCount: 38, // Not a blind spot
      onetCount: 14,
    },
    {
      code: 'DESN',
      name: 'Digital product design',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'UX_DESIGN',
      minLevel: 2,
      maxLevel: 6,
      questionCount: 0, // High priority blind spot (onetCount >= 8)
      onetCount: 9,
    },
    {
      code: 'EMRG',
      name: 'Emerging technology monitoring',
      categoryCode: 'STRAT_ARCH',
      subcategoryCode: 'STRAT_PLAN',
      minLevel: 4,
      maxLevel: 6,
      questionCount: 0, // Medium priority blind spot (onetCount 4-7)
      onetCount: 4,
    },
    {
      code: 'MEAS',
      name: 'Measurement',
      categoryCode: 'STRAT_ARCH',
      subcategoryCode: 'STRAT_PLAN',
      minLevel: 3,
      maxLevel: 6,
      questionCount: 0, // Standard priority blind spot (onetCount < 4)
      onetCount: 3,
    },
  ]

  describe('getBlindSpotPriority', () => {
    it('returns HIGH priority when onetCount >= 8', () => {
      const res = getBlindSpotPriority(9)
      expect(res.level).toBe('HIGH')
      expect(res.badgeVariant).toBe('danger')
      expect(res.labelVi).toBe('High Priority')
    })

    it('returns MEDIUM priority when onetCount between 4 and 7', () => {
      const res = getBlindSpotPriority(5)
      expect(res.level).toBe('MEDIUM')
      expect(res.badgeVariant).toBe('warning')
      expect(res.labelVi).toBe('Medium Priority')
    })

    it('returns STANDARD priority when onetCount < 4', () => {
      const res = getBlindSpotPriority(2)
      expect(res.level).toBe('STANDARD')
      expect(res.badgeVariant).toBe('neutral')
      expect(res.labelVi).toBe('Standard')
    })
  })

  describe('generateSfiaBlindSpotsCsvString', () => {
    it('starts with UTF-8 BOM byte order mark (\\uFEFF)', () => {
      const csv = generateSfiaBlindSpotsCsvString(mockSkills, mockCategories)
      expect(csv.startsWith('\uFEFF')).toBe(true)
    })

    it('filters out skills with questionCount > 0 and only exports blind spots', () => {
      const csv = generateSfiaBlindSpotsCsvString(mockSkills, mockCategories)
      // PROG has 38 questions, should NOT be in blind spots export
      expect(csv).not.toContain('"PROG"')
      // DESN, EMRG, MEAS have 0 questions, should be included
      expect(csv).toContain('"DESN"')
      expect(csv).toContain('"EMRG"')
      expect(csv).toContain('"MEAS"')
    })

    it('includes category names and correct priority labels', () => {
      const csv = generateSfiaBlindSpotsCsvString(mockSkills, mockCategories)
      expect(csv).toContain('"Development and implementation"')
      expect(csv).toContain('"Strategy and architecture"')
      expect(csv).toContain('"High Priority"')
      expect(csv).toContain('"Medium Priority"')
      expect(csv).toContain('"Standard"')
    })

    it('escapes quotes and special characters properly', () => {
      const specialSkills: SfiaSkillSummary[] = [
        {
          code: 'SPEC',
          name: 'Special "Quoted" Skill, With Comma',
          categoryCode: 'DEV_IMPL',
          subcategoryCode: 'SYS_DEV',
          minLevel: 1,
          maxLevel: 3,
          questionCount: 0,
          onetCount: 2,
        },
      ]
      const csv = generateSfiaBlindSpotsCsvString(specialSkills, mockCategories)
      expect(csv).toContain('"Special ""Quoted"" Skill, With Comma"')
    })
  })

  describe('downloadSfiaBlindSpotsCsv', () => {
    it('downloads file via browser DOM in client environment', () => {
      const originalCreateObjectURL = window.URL.createObjectURL
      const originalRevokeObjectURL = window.URL.revokeObjectURL

      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-uuid')
      window.URL.revokeObjectURL = vi.fn()

      const result = downloadSfiaBlindSpotsCsv(mockSkills, mockCategories, 'test_blind_spots.csv')
      expect(result).toBe(true)
      expect(window.URL.createObjectURL).toHaveBeenCalled()

      window.URL.createObjectURL = originalCreateObjectURL
      window.URL.revokeObjectURL = originalRevokeObjectURL
    })
  })
})
