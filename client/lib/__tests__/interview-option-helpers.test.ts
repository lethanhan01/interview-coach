import { describe, expect, it } from 'vitest'
import {
  getContextPackLabel,
  getJdLevelLabel,
  getSessionTypeLabel,
  mapJdLevelToSfia,
  normalizeJdLevel,
  normalizeOptionToken,
} from '@/lib/interview-option-helpers'
import { CATALOG_INTERVIEW_OPTIONS_FIXTURE } from '@/test-utils/fixtures/catalog.fixture'

const { jdLevels, sessionTypes, contextPacks } =
  CATALOG_INTERVIEW_OPTIONS_FIXTURE

describe('interview-option-helpers', () => {
  describe('normalizeOptionToken', () => {
    it('strips Vietnamese diacritics, normalizes punctuation and whitespace', () => {
      expect(normalizeOptionToken('  Trưởng_nhóm / Lead  ')).toBe(
        'truong nhom / lead'
      )
      expect(normalizeOptionToken('Thực-tập-sinh')).toBe('thuc tap sinh')
      expect(normalizeOptionToken(null)).toBe('')
      expect(normalizeOptionToken(undefined)).toBe('')
    })
  })

  describe('normalizeJdLevel', () => {
    it('resolves canonical values, labels, label segments, and aliases', () => {
      expect(normalizeJdLevel('Intern', jdLevels)).toBe('intern')
      expect(normalizeJdLevel('Thực tập sinh', jdLevels)).toBe('intern')
      expect(normalizeJdLevel('fresher', jdLevels)).toBe('fresher')
      expect(normalizeJdLevel('mới tốt nghiệp', jdLevels)).toBe('fresher')
      expect(normalizeJdLevel('mid-level', jdLevels)).toBe('middle')
      expect(normalizeJdLevel('Sr', jdLevels)).toBe('senior')
      expect(normalizeJdLevel('Manager', jdLevels)).toBe('lead')
      expect(normalizeJdLevel('Tech Lead', jdLevels)).toBe('lead')
      expect(normalizeJdLevel('unknown-role', jdLevels)).toBe('')
      expect(normalizeJdLevel('', jdLevels)).toBe('')
    })
  })

  describe('getJdLevelLabel', () => {
    it('returns catalog label when matched and raw string when unmatched or empty catalog', () => {
      expect(getJdLevelLabel('intern', jdLevels)).toBe('Intern / Thực tập sinh')
      expect(getJdLevelLabel('mid', jdLevels)).toBe('Middle')
      expect(getJdLevelLabel('custom-level', jdLevels)).toBe('custom-level')
      expect(getJdLevelLabel('senior', [])).toBe('senior')
    })
  })

  describe('mapJdLevelToSfia', () => {
    it('maps JD levels to default SFIA levels from catalog', () => {
      expect(mapJdLevelToSfia('intern', jdLevels)).toBe(1)
      expect(mapJdLevelToSfia('fresher', jdLevels)).toBe(2)
      expect(mapJdLevelToSfia('junior', jdLevels)).toBe(2)
      expect(mapJdLevelToSfia('middle', jdLevels)).toBe(3)
      expect(mapJdLevelToSfia('senior', jdLevels)).toBe(4)
      expect(mapJdLevelToSfia('manager', jdLevels)).toBe(5)
      expect(mapJdLevelToSfia('lead', jdLevels)).toBe(5)
      expect(mapJdLevelToSfia('unknown', jdLevels)).toBeUndefined()
      expect(mapJdLevelToSfia('senior', [])).toBeUndefined()
    })
  })

  describe('getSessionTypeLabel & getContextPackLabel', () => {
    it('returns full/short labels and falls back to raw value when catalog is empty', () => {
      expect(getSessionTypeLabel('hr', sessionTypes)).toBe('HR / Behavioral')
      expect(getSessionTypeLabel('hr', sessionTypes, 'shortLabel')).toBe(
        'Nhân sự'
      )
      expect(getSessionTypeLabel('technical', [])).toBe('technical')
      expect(getSessionTypeLabel(undefined, sessionTypes)).toBe('')

      expect(getContextPackLabel('VN', contextPacks)).toBe('Việt Nam')
      expect(getContextPackLabel('Western', contextPacks)).toBe('Western')
      expect(getContextPackLabel('VN', [])).toBe('VN')
      expect(getContextPackLabel(undefined, contextPacks)).toBe('')
    })
  })
})
