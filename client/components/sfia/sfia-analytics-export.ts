import type { SfiaCategory, SfiaSkillSummary } from './types'

/**
 * Xác định mức độ ưu tiên bổ sung câu hỏi dựa trên nhu cầu tuyển dụng O*NET
 */
export function getBlindSpotPriority(onetCount: number): {
  level: 'HIGH' | 'MEDIUM' | 'STANDARD'
  labelVi: string
  badgeVariant: 'danger' | 'warning' | 'neutral'
} {
  if (onetCount >= 8) {
    return {
      level: 'HIGH',
      labelVi: 'Ưu tiên cao (High)',
      badgeVariant: 'danger',
    }
  }
  if (onetCount >= 4) {
    return {
      level: 'MEDIUM',
      labelVi: 'Ưu tiên trung bình (Medium)',
      badgeVariant: 'warning',
    }
  }
  return {
    level: 'STANDARD',
    labelVi: 'Tiêu chuẩn (Standard)',
    badgeVariant: 'neutral',
  }
}

/**
 * Tạo nội dung chuỗi CSV từ danh sách các kỹ năng Điểm mù (Blind Spots)
 * Định dạng kèm UTF-8 BOM (\uFEFF) giúp Excel tự động hiển thị đúng ký tự tiếng Việt có dấu
 */
export function generateSfiaBlindSpotsCsvString(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[]
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
    'Dải Level',
    'Số nghề O*NET liên kết',
    'Trạng thái độ phủ',
    'Mức độ ưu tiên bổ sung',
  ]

  const rows: string[] = []
  rows.push(headers.map(escapeCsv).join(','))

  // Lọc chỉ lấy các kỹ năng chưa có câu hỏi (hoặc toàn bộ nếu danh sách truyền vào đã là blind spots)
  const blindSpotSkills = skills.filter((s) => s.questionCount === 0)

  for (const skill of blindSpotSkills) {
    const categoryName = categoryMap.get(skill.categoryCode) || skill.categoryCode
    const priority = getBlindSpotPriority(skill.onetCount)

    const row = [
      escapeCsv(skill.code),
      escapeCsv(skill.name),
      escapeCsv(skill.categoryCode),
      escapeCsv(categoryName),
      escapeCsv(skill.subcategoryCode),
      escapeCsv(skill.minLevel),
      escapeCsv(skill.maxLevel),
      escapeCsv(`Level ${skill.minLevel} - ${skill.maxLevel}`),
      escapeCsv(skill.onetCount),
      escapeCsv('Chưa có câu hỏi phỏng vấn (0 Qs)'),
      escapeCsv(priority.labelVi),
    ]

    rows.push(row.join(','))
  }

  // Thêm phần phụ lục tóm tắt ở cuối file
  rows.push('')
  rows.push(escapeCsv('TỔNG HỢP BÁO CÁO ĐIỂM MÙ KHUNG NĂNG LỰC SFIA 9'))
  rows.push(
    [
      'Tổng số điểm mù',
      String(blindSpotSkills.length),
      'Thời điểm xuất',
      new Date().toISOString().slice(0, 10),
    ]
      .map(escapeCsv)
      .join(',')
  )

  // Thêm UTF-8 Byte Order Mark (\uFEFF)
  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Kích hoạt tải xuống file CSV danh sách điểm mù trên trình duyệt
 */
export function downloadSfiaBlindSpotsCsv(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  filename?: string
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  try {
    const csvContent = generateSfiaBlindSpotsCsvString(skills, categories)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().slice(0, 10)
    const finalFilename = filename || `SFIA9_Blind_Spots_${dateStr}.csv`

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
