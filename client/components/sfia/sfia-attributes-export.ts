import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'

/**
 * Tạo nội dung chuỗi CSV từ ma trận so sánh tiến trình 5 thuộc tính x 7 cấp độ
 * Định dạng kèm UTF-8 BOM (\uFEFF) giúp Excel tự động hiển thị đúng ký tự tiếng Việt
 */
export function generateSfiaAttributesProgressionCsvString(
  levels: SfiaLevelResponsibility[],
  attributes: SfiaGenericAttribute[]
): string {
  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const levelHeaders = levels.map(
    (lvl) => `Level ${lvl.levelId} - ${lvl.name} (${lvl.nameVi})`
  )

  const headers = [
    'Mã thuộc tính',
    'Tên thuộc tính (English)',
    'Tên thuộc tính (Việt)',
    'Mô tả tổng quát',
    ...levelHeaders,
  ]

  const rows: string[] = []
  rows.push(headers.map(escapeCsv).join(','))

  for (const attr of attributes) {
    const levelStatements = levels.map((lvl) => {
      return attr.levels[lvl.levelId] || '—'
    })

    const row = [
      escapeCsv(attr.code),
      escapeCsv(attr.name),
      escapeCsv(attr.nameVi),
      escapeCsv(attr.description),
      ...levelStatements.map(escapeCsv),
    ]

    rows.push(row.join(','))
  }

  // Thêm phần phụ lục tóm tắt triết lý cốt lõi của 7 cấp độ
  rows.push('')
  rows.push(escapeCsv('PHỤ LỤC: BẢN CHẤT CỐT LÕI CỦA 7 CẤP ĐỘ TRÁCH NHIỆM (SFIA 9)'))
  rows.push(['Cấp độ', 'Tên chuẩn', 'Tên tiếng Việt', 'Bản chất cốt lõi (Essence)', 'Mô tả quyền hạn'].map(escapeCsv).join(','))

  for (const lvl of levels) {
    rows.push([
      escapeCsv(`Level ${lvl.levelId}`),
      escapeCsv(lvl.name),
      escapeCsv(lvl.nameVi),
      escapeCsv(lvl.essence),
      escapeCsv(lvl.description),
    ].join(','))
  }

  // Thêm UTF-8 Byte Order Mark (\uFEFF)
  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Kích hoạt tải xuống file CSV ma trận tiến trình trên trình duyệt
 */
export function downloadSfiaAttributesProgressionCsv(
  levels: SfiaLevelResponsibility[],
  attributes: SfiaGenericAttribute[],
  filename?: string
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  try {
    const csvContent = generateSfiaAttributesProgressionCsvString(levels, attributes)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().slice(0, 10)
    const finalFilename = filename || `SFIA9_Attributes_Progression_${dateStr}.csv`

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', finalFilename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
