export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatVietnamDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return DATE_TIME_FORMATTER.format(date)
}

export function formatVietnamDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return DATE_FORMATTER.format(date)
}

export function formatVietnamRelativeDate(
  iso: string,
  now: Date = new Date()
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return '—'
  const diffDays = daysBetweenVietnamDates(date, now)

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
  return `${Math.floor(diffDays / 365)} năm trước`
}

function daysBetweenVietnamDates(from: Date, to: Date): number {
  const fromDay = getVietnamDateOnlyUtc(from)
  const toDay = getVietnamDateOnlyUtc(to)
  return Math.max(
    0,
    Math.floor((toDay.getTime() - fromDay.getTime()) / 86_400_000)
  )
}

function getVietnamDateOnlyUtc(value: Date): Date {
  const parts = DATE_KEY_FORMATTER.formatToParts(value)
  const partMap = new Map(parts.map((part) => [part.type, part.value]))
  const year = Number(partMap.get('year'))
  const month = Number(partMap.get('month'))
  const day = Number(partMap.get('day'))
  return new Date(Date.UTC(year, month - 1, day))
}

const YEAR_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/
const ISO_DATE_RE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/**
 * Chuyển chuỗi tháng `'YYYY-MM'` (Resume/API) sang `DateValue` (`'YYYY-MM-01'`)
 * cho `@mantine/dates` v9 bằng xử lý chuỗi thuần, tránh lệch múi giờ.
 */
export function toMantineMonthDate(
  ym: string | null | undefined
): string | null {
  if (!ym) return null
  const trimmed = ym.trim()

  const ymMatch = YEAR_MONTH_RE.exec(trimmed)
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2]}-01`
  }

  const isoMatch = ISO_DATE_RE.exec(trimmed)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-01`
  }

  return null
}

/**
 * Chuyển `DateValue` (`'YYYY-MM-DD'`) từ `@mantine/dates` v9 về chuỗi `'YYYY-MM'`
 * (Resume/API) bằng xử lý chuỗi thuần, tránh lệch múi giờ.
 */
export function fromMantineMonthDate(
  dateValue: string | null | undefined
): string {
  if (!dateValue) return ''
  const trimmed = dateValue.trim()

  const isoMatch = ISO_DATE_RE.exec(trimmed)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`
  }

  const ymMatch = YEAR_MONTH_RE.exec(trimmed)
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2]}`
  }

  return ''
}
