import type { SfiaOnetMappingItem } from '@/types'

export interface KeyedSfiaOnetMapping {
  key: string
  mapping: SfiaOnetMappingItem
}

/**
 * Thứ tự sắp xếp chuẩn cho danh sách ánh xạ SFIA–O*NET:
 * 1. Cốt lõi trước (isCore DESC)
 * 2. Trọng số cao trước (weight DESC)
 * 3. Mã SOC tăng dần (socCode ASC)
 * 4. Cấp độ mục tiêu tăng dần (targetLevel ASC)
 */
export function compareSfiaOnetMappings(
  a: SfiaOnetMappingItem,
  b: SfiaOnetMappingItem
): number {
  if (a.isCore !== b.isCore) {
    return a.isCore ? -1 : 1
  }
  if (b.weight !== a.weight) {
    return b.weight - a.weight
  }
  const socComparison = a.socCode.localeCompare(b.socCode)
  if (socComparison !== 0) {
    return socComparison
  }
  return a.targetLevel - b.targetLevel
}

/**
 * Sinh React key phòng thủ 2 tầng cho danh sách SfiaOnetMappingItem:
 * - Tầng 1 (chuẩn): ưu tiên UUID `mapping.id` (nếu non-empty), fallback `${socCode}-${targetLevel}`.
 * - Tầng 2 (chống va chạm): chỉ gắn hậu tố `::2`, `::3` khi phát hiện khóa trùng thực sự trong mảng.
 */
export function buildKeyedOnetMappings(
  mappings: readonly SfiaOnetMappingItem[]
): KeyedSfiaOnetMapping[] {
  const seenCounts = new Map<string, number>()

  return mappings.map((mapping) => {
    const trimmedId = mapping.id?.trim()
    const baseKey =
      trimmedId && trimmedId.length > 0
        ? trimmedId
        : `${mapping.socCode}-${mapping.targetLevel}`

    const count = (seenCounts.get(baseKey) ?? 0) + 1
    seenCounts.set(baseKey, count)

    return {
      key: count === 1 ? baseKey : `${baseKey}::${count}`,
      mapping,
    }
  })
}

/**
 * Đếm số nghề O*NET duy nhất (theo socCode) trong danh sách ánh xạ.
 */
export function countUniqueOnetOccupations(
  mappings: readonly SfiaOnetMappingItem[]
): number {
  return new Set(mappings.map((m) => m.socCode)).size
}
