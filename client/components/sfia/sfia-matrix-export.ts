import type {
  SfiaCategory,
  SfiaSkillSummary,
  SfiaMatrixCellData,
} from './types'

/**
 * Generates CSV string from SFIA 2D matrix dataset
 * Prepends UTF-8 BOM (\uFEFF) for seamless Microsoft Excel rendering
 */
export function generateSfiaMatrixCsvString(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  cells: Record<string, SfiaMatrixCellData>
): string {
  const categoryMap = new Map<string, string>()
  for (const cat of categories) {
    categoryMap.set(cat.code, cat.name)
  }

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const headers = [
    'Skill Code',
    'Skill Name',
    'Category Code',
    'Category Name',
    'Subcategory Code',
    'Min Level',
    'Max Level',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
    'Level 6',
    'Level 7',
    'Total Questions',
    'Total O*NET Occupations',
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
        levelCells.push(`Available (${cell.questionCount} Qs, ${cell.onetCount} O*NET)`)
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

  // Prepend UTF-8 BOM (\uFEFF)
  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Triggers file download in the browser
 */
export function downloadSfiaMatrixCsv(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  cells: Record<string, SfiaMatrixCellData>,
  fileName?: string
): boolean {
  try {
    const csvContent = generateSfiaMatrixCsvString(skills, categories, cells)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().split('T')[0]
    const defaultFileName = `sfia9-matrix-grid-${dateStr}.csv`

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', fileName || defaultFileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Failed to export SFIA matrix CSV:', error)
    return false
  }
}
