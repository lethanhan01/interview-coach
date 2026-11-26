import { describe, expect, it } from 'vitest'
import type { SfiaOnetMappingItem } from '@/types'
import {
  buildKeyedOnetMappings,
  compareSfiaOnetMappings,
  countUniqueOnetOccupations,
} from './sfia-onet-mapping.utils'

describe('sfia-onet-mapping.utils', () => {
  describe('buildKeyedOnetMappings', () => {
    it('prefers trimmed id when available and falls back to socCode-targetLevel when missing or blank', () => {
      const items: SfiaOnetMappingItem[] = [
        {
          id: '  uuid-1  ',
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          id: '   ',
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 4,
          weight: 2.0,
          isCore: true,
        },
        {
          socCode: '15-1253.00',
          occupationTitle: 'Software Quality Assurance Analysts',
          targetLevel: 3,
          weight: 1.2,
          isCore: false,
        },
      ]

      const keyed = buildKeyedOnetMappings(items)
      expect(keyed.map((item) => item.key)).toEqual([
        'uuid-1',
        '15-1252.00-4',
        '15-1253.00-3',
      ])
    })

    it('generates distinct keys for same socCode across multiple levels without id', () => {
      const items: SfiaOnetMappingItem[] = [
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 2,
          weight: 1.0,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 4,
          weight: 2.0,
          isCore: true,
        },
      ]

      const keyed = buildKeyedOnetMappings(items)
      expect(keyed.map((item) => item.key)).toEqual([
        '15-1252.00-2',
        '15-1252.00-3',
        '15-1252.00-4',
      ])
    })

    it('appends collision suffix only when duplicate base keys occur', () => {
      const items: SfiaOnetMappingItem[] = [
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          id: 'dup-id',
          socCode: '15-1253.00',
          occupationTitle: 'Software Quality Assurance Analysts',
          targetLevel: 3,
          weight: 1.0,
          isCore: false,
        },
        {
          id: 'dup-id',
          socCode: '15-1253.00',
          occupationTitle: 'Software Quality Assurance Analysts',
          targetLevel: 4,
          weight: 1.0,
          isCore: false,
        },
      ]

      const keyed = buildKeyedOnetMappings(items)
      expect(keyed.map((item) => item.key)).toEqual([
        '15-1252.00-3',
        '15-1252.00-3::2',
        'dup-id',
        'dup-id::2',
      ])
    })
  })

  describe('compareSfiaOnetMappings', () => {
    it('sorts by isCore DESC, weight DESC, socCode ASC, then targetLevel ASC', () => {
      const items: SfiaOnetMappingItem[] = [
        {
          socCode: '15-1253.00',
          occupationTitle: 'QA',
          targetLevel: 4,
          weight: 2.0,
          isCore: false,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Dev',
          targetLevel: 4,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Dev',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1251.00',
          occupationTitle: 'Programmer',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Dev',
          targetLevel: 5,
          weight: 2.0,
          isCore: true,
        },
      ]

      const sorted = [...items].sort(compareSfiaOnetMappings)
      expect(
        sorted.map((item) => `${item.socCode}:L${item.targetLevel}`)
      ).toEqual([
        '15-1252.00:L5',
        '15-1251.00:L3',
        '15-1252.00:L3',
        '15-1252.00:L4',
        '15-1253.00:L4',
      ])
    })
  })

  describe('countUniqueOnetOccupations', () => {
    it('returns 0 for empty list and deduplicates repeated socCodes', () => {
      expect(countUniqueOnetOccupations([])).toBe(0)
      expect(
        countUniqueOnetOccupations([
          {
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 3,
            weight: 1.5,
            isCore: true,
          },
          {
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 4,
            weight: 2.0,
            isCore: true,
          },
          {
            socCode: '15-1253.00',
            occupationTitle: 'QA',
            targetLevel: 3,
            weight: 1.0,
            isCore: false,
          },
        ])
      ).toBe(2)
    })
  })
})
