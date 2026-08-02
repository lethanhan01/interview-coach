export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatVietnamDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso))
}

export function formatVietnamRelativeDate(
  iso: string,
  now: Date = new Date()
): string {
  const diffDays = daysBetweenVietnamDates(new Date(iso), now)

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
