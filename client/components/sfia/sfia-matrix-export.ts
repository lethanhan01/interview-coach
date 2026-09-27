import type {
  SfiaCategory,
  SfiaSkillSummary,
  SfiaMatrixCellData,
} from './types'

/**
 * Tạo nội dung chuỗi CSV từ dữ liệu ma trận SFIA 2D
 * Định dạng kèm UTF-8 BOM (\uFEFF) giúp Excel tự động hiển thị đúng ký tự tiếng Việt
 */
export function generateSfiaMatrixCsvString(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  cells: Record<string, SfiaMatrixCellData>
): string {
  const categoryMap = new Map<string, string>()
  for (const cat of categories) {
    categoryMap.set(cat.code, cat.nameVi || cat.name)
  }

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const headers = [
    'Mã kỹ năng',
    'Tên kỹ năng (English)',
    'Mã danh mục',
    'Tên danh mục',
    'Phân nhóm',
    'Min Level',
    'Max Level',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
    'Level 6',
    'Level 7',
    'Tổng câu hỏi',
    'Tổng nghề O*NET',
  ]

  const rows: string[] = []
  rows.push(headers.map(escapeCsv).join(','))

  for (const skill of skills) {
    const categoryName = categoryMap.get(skill.categoryCode) || skill.categoryCode

    const levelCells: string[] = []
    for (let l = 1; l <= 7; l++) {
      const cellKey = `${skill.code}_L${l}`
      const cell = cells[cellKey]
      if (cell && cell.isAvailable) {
        levelCells.push(`Khả dụng (${cell.questionCount} Qs, ${cell.onetCount} O*NET)`)
      } else {
        levelCells.push('—')
      }
    }

    const row = [
      escapeCsv(skill.code),
      escapeCsv(skill.name),
      escapeCsv(skill.categoryCode),
      escapeCsv(categoryName),
      escapeCsv(skill.subcategoryCode),
      escapeCsv(skill.minLevel),
      escapeCsv(skill.maxLevel),
      ...levelCells.map(escapeCsv),
      escapeCsv(skill.questionCount),
      escapeCsv(skill.onetCount),
    ]

    rows.push(row.join(','))
  }

  // Thêm UTF-8 Byte Order Mark (\uFEFF)
  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Kích hoạt tải xuống file CSV ma trận SFIA 2D trên trình duyệt
 */
export function downloadSfiaMatrixCsv(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  cells: Record<string, SfiaMatrixCellData>,
  filename?: string
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  try {
    const csvContent = generateSfiaMatrixCsvString(skills, categories, cells)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().slice(0, 10)
    const finalFilename = filename || `SFIA9_Matrix_Grid_${dateStr}.csv`

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
