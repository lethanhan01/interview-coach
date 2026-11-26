import { describe, expect, it } from 'vitest'
import {
  APP_TIME_ZONE,
  formatVietnamDateTime,
  formatVietnamRelativeDate,
  fromMantineMonthDate,
  toMantineMonthDate,
} from '@/lib/date-time'

describe('lib/date-time', () => {
  it('formats Vietnam datetime and relative dates accurately', () => {
    expect(APP_TIME_ZONE).toBe('Asia/Ho_Chi_Minh')
    expect(formatVietnamDateTime('2026-01-15T00:30:00.000Z')).toBe(
      '07:30 15/01/2026'
    )

    const now = new Date('2026-05-10T10:00:00.000Z')
    expect(formatVietnamRelativeDate('2026-05-10T01:00:00.000Z', now)).toBe(
      'Hôm nay'
    )
    expect(formatVietnamRelativeDate('2026-05-09T10:00:00.000Z', now)).toBe(
      'Hôm qua'
    )
    expect(formatVietnamRelativeDate('2026-05-06T10:00:00.000Z', now)).toBe(
      '4 ngày trước'
    )
    expect(formatVietnamRelativeDate('2026-04-20T10:00:00.000Z', now)).toBe(
      '2 tuần trước'
    )
  })

  describe('toMantineMonthDate', () => {
    it('converts YYYY-MM strings to YYYY-MM-01 without timezone shift', () => {
      expect(toMantineMonthDate('2024-01')).toBe('2024-01-01')
      expect(toMantineMonthDate('2026-12')).toBe('2026-12-01')
      expect(toMantineMonthDate(' 2025-07 ')).toBe('2025-07-01')
    })

    it('normalizes existing YYYY-MM-DD strings to first day of month', () => {
      expect(toMantineMonthDate('2025-03-28')).toBe('2025-03-01')
    })

    it('returns null for empty, nullish, or invalid strings', () => {
      expect(toMantineMonthDate(null)).toBeNull()
      expect(toMantineMonthDate(undefined)).toBeNull()
      expect(toMantineMonthDate('')).toBeNull()
      expect(toMantineMonthDate('2025-00')).toBeNull()
      expect(toMantineMonthDate('2025-13')).toBeNull()
      expect(toMantineMonthDate('invalid')).toBeNull()
    })
  })

  describe('fromMantineMonthDate', () => {
    it('converts YYYY-MM-DD strings back to YYYY-MM without timezone shift', () => {
      expect(fromMantineMonthDate('2024-01-01')).toBe('2024-01')
      expect(fromMantineMonthDate('2026-12-31')).toBe('2026-12')
      expect(fromMantineMonthDate(' 2025-09-15 ')).toBe('2025-09')
    })

    it('preserves valid YYYY-MM strings as-is', () => {
      expect(fromMantineMonthDate('2025-06')).toBe('2025-06')
    })

    it('returns empty string for empty, nullish, or invalid values', () => {
      expect(fromMantineMonthDate(null)).toBe('')
      expect(fromMantineMonthDate(undefined)).toBe('')
      expect(fromMantineMonthDate('')).toBe('')
      expect(fromMantineMonthDate('2025-13-01')).toBe('')
      expect(fromMantineMonthDate('not-a-date')).toBe('')
    })

    it('round-trips YYYY-MM across year boundaries cleanly', () => {
      const months = ['2020-01', '2024-02', '2025-11', '2026-12']
      for (const ym of months) {
        expect(fromMantineMonthDate(toMantineMonthDate(ym))).toBe(ym)
      }
    })
  })
})
