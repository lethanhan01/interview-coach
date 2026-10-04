import type { SfiaCategory, SfiaSkillSummary } from './types'

/**
 * Determines question prioritization based on O*NET market demand
 */
export function getBlindSpotPriority(onetCount: number): {
  level: 'HIGH' | 'MEDIUM' | 'STANDARD'
  labelVi: string
  badgeVariant: 'danger' | 'warning' | 'neutral'
} {
  if (onetCount >= 8) {
    return {
      level: 'HIGH',
      labelVi: 'High Priority',
      badgeVariant: 'danger',
    }
  }
  if (onetCount >= 4) {
    return {
      level: 'MEDIUM',
      labelVi: 'Medium Priority',
      badgeVariant: 'warning',
    }
  }
  return {
    level: 'STANDARD',
    labelVi: 'Standard',
    badgeVariant: 'neutral',
  }
}

/**
 * Generates CSV string for SFIA 9 Blind Spots dataset
 * Prepends UTF-8 BOM (\uFEFF) for seamless Microsoft Excel rendering
 */
export function generateSfiaBlindSpotsCsvString(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[]
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
    'Level Span',
    'Mapped O*NET Occupations',
    'Coverage Status',
    'Priority Level',
  ]

  const rows: string[] = []
  rows.push(headers.map(escapeCsv).join(','))

  // Filter skills with 0 questions in question bank
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
      escapeCsv(`L${skill.minLevel}-${skill.maxLevel}`),
      escapeCsv(skill.onetCount),
      escapeCsv('0 Questions (Blind Spot)'),
      escapeCsv(priority.labelVi),
    ]

    rows.push(row.join(','))
  }

  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Triggers blind spots CSV download in the browser
 */
export function downloadSfiaBlindSpotsCsv(
  skills: SfiaSkillSummary[],
  categories: SfiaCategory[],
  fileName?: string
): boolean {
  try {
    const csvContent = generateSfiaBlindSpotsCsvString(skills, categories)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().split('T')[0]
    const defaultFileName = `sfia9-blind-spots-${dateStr}.csv`

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
    console.error('Failed to export SFIA blind spots CSV:', error)
    return false
  }
}
