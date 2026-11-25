import type {
  ContextPack,
  ContextPackOption,
  JdLevelOption,
  SessionType,
  SessionTypeOption,
} from '@/types'

/**
 * Pure helpers cho danh mục phỏng vấn. KHÔNG chứa mảng dữ liệu cứng:
 * mọi danh mục (`jdLevels`, `sessionTypes`, `contextPacks`...) đến từ
 * `catalogQueries.interviewOptions()` (Backend SSOT).
 */

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function normalizeOptionToken(value: unknown): string {
  return text(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'd')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Trả về `value` chuẩn của JD level hoặc chuỗi rỗng nếu không khớp. */
export function normalizeJdLevel(
  value: unknown,
  jdLevels: readonly JdLevelOption[]
): string {
  const raw = text(value).trim()
  if (!raw) return ''
  const normalized = normalizeOptionToken(raw)

  for (const option of jdLevels) {
    const candidates = [
      option.value,
      option.label,
      ...option.label.split('/').map((part) => part.trim()),
      ...option.aliases,
    ]
    if (
      candidates.some(
        (candidate) => normalizeOptionToken(candidate) === normalized
      )
    ) {
      return option.value
    }
  }
  return ''
}

/** Nhãn hiển thị của level; trả nguyên chuỗi gốc khi chưa có catalog/không khớp. */
export function getJdLevelLabel(
  level: string,
  jdLevels: readonly JdLevelOption[]
): string {
  const canonical = normalizeJdLevel(level, jdLevels) || level
  return jdLevels.find((option) => option.value === canonical)?.label ?? level
}

/** SFIA level mặc định theo JD level; `undefined` nếu chưa xác định được. */
export function mapJdLevelToSfia(
  level: string,
  jdLevels: readonly JdLevelOption[]
): number | undefined {
  const canonical = normalizeJdLevel(level, jdLevels)
  if (!canonical) return undefined
  return jdLevels.find((option) => option.value === canonical)?.defaultSfiaLevel
}

export function getSessionTypeLabel(
  value: SessionType | string | undefined,
  sessionTypes: readonly SessionTypeOption[],
  variant: 'label' | 'shortLabel' = 'label'
): string {
  if (!value) return ''
  const matched = sessionTypes.find((option) => option.value === value)
  return matched ? matched[variant] : String(value)
}

export function getContextPackLabel(
  value: ContextPack | string | undefined,
  contextPacks: readonly ContextPackOption[]
): string {
  if (!value) return ''
  return (
    contextPacks.find((option) => option.value === value)?.label ??
    String(value)
  )
}
